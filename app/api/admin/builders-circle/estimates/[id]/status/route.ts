/**
 * POST /api/admin/builders-circle/estimates/[id]/status — shortlist, decline, or accept (= award the job).
 * Awarding marks the job "awarded", accepts this estimate and declines the other live ones.
 */
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { formatBSD } from '@/lib/builders-circle/constants'
import { adminFromRequest, audit, baseUrl, done, fail, readBody, str } from '@/lib/builders-circle/server'
import { para, rows, sendCircleEmail } from '@/lib/builders-circle/email'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await adminFromRequest(req)
  if (!adminId) return fail(req, 403, 'Forbidden')
  const { id } = await params
  const est = await prisma.circleEstimate.findUnique({ where: { id }, include: { job: true, contractor: true } })
  if (!est) return fail(req, 404, 'Not found')
  const back = `/admin/builders-circle/jobs/${est.jobId}`
  const status = str((await readBody(req)).status, 20)
  if (!['shortlisted', 'declined', 'accepted'].includes(status)) return fail(req, 400, 'Unknown status', back)
  if (!['submitted', 'shortlisted'].includes(est.status)) return fail(req, 409, `A ${est.status} estimate cannot be changed`, back)
  if (est.job.status === 'awarded' || est.job.status === 'cancelled') return fail(req, 409, `This job is already ${est.job.status}`, back)

  const origin = baseUrl(req)
  const notify = (to: string | null, subject: string, heading: string, text: string) =>
    to ? sendCircleEmail({ to, subject, heading, body: para(text) + rows([['Job', est.job.title], ['Your estimate', formatBSD(est.amountCents)]]), cta: { label: 'Open my estimates', url: `${origin}/builders-circle/estimates` } }) : Promise.resolve()

  if (status !== 'accepted') {
    await prisma.circleEstimate.update({ where: { id }, data: { status } })
    await audit(adminId, `estimate.${status}`, 'CircleEstimate', id)
    await notify(est.contractor.email,
      status === 'shortlisted' ? `Shortlisted: ${est.job.title}` : `Estimate not selected: ${est.job.title}`,
      status === 'shortlisted' ? 'Your estimate is shortlisted' : 'Estimate not selected',
      status === 'shortlisted' ? 'Good news: your estimate has been shortlisted. We may contact you to discuss details.' : 'Thank you for your estimate. It was not selected for this job.')
    return done(req, back, { ok: true, status })
  }

  const others = await prisma.circleEstimate.findMany({ where: { jobId: est.jobId, id: { not: id }, status: { in: ['submitted', 'shortlisted'] } }, include: { contractor: true } })
  await prisma.$transaction([
    prisma.circleEstimate.update({ where: { id }, data: { status: 'accepted' } }),
    prisma.circleEstimate.updateMany({ where: { id: { in: others.map(o => o.id) } }, data: { status: 'declined' } }),
    prisma.circleJob.update({ where: { id: est.jobId }, data: { status: 'awarded', awardedEstimateId: id } }),
  ])
  await audit(adminId, 'job.awarded', 'CircleJob', est.jobId, { estimateId: id, declined: others.length })
  await notify(est.contractor.email, `Estimate accepted: ${est.job.title}`, 'Your estimate has been accepted', 'Groundwork BHS has accepted your estimate for this job. We will contact you to arrange next steps.')
  await Promise.allSettled(others.map(o => sendCircleEmail({
    to: o.contractor.email || '', subject: `Estimate not selected: ${est.job.title}`, heading: 'Estimate not selected',
    body: para('Thank you for your estimate. Another estimate was chosen for this job.') + rows([['Job', est.job.title], ['Your estimate', formatBSD(o.amountCents)]]),
    cta: { label: 'Open my estimates', url: `${origin}/builders-circle/estimates` },
  })))
  return done(req, back, { ok: true, status: 'accepted' })
}
