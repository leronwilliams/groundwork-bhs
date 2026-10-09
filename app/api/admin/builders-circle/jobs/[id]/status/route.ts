/**
 * POST /api/admin/builders-circle/jobs/[id]/status — publish (open), close, cancel, or back to draft.
 * Publishing emails verified members whose trades match.
 */
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { adminFromRequest, audit, baseUrl, done, fail, readBody, str } from '@/lib/builders-circle/server'
import { para, rows, sendCircleEmail } from '@/lib/builders-circle/email'
import { fmtDate } from '@/lib/builders-circle/constants'

export const runtime = 'nodejs'

const TRANSITIONS: Record<string, string[]> = {
  draft: ['open', 'cancelled'],
  open: ['closed', 'cancelled'],
  closed: ['open', 'cancelled'],
  awarded: [],
  cancelled: [],
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await adminFromRequest(req)
  if (!adminId) return fail(req, 403, 'Forbidden')
  const { id } = await params
  const back = `/admin/builders-circle/jobs/${id}`
  const job = await prisma.circleJob.findUnique({ where: { id } })
  if (!job) return fail(req, 404, 'Not found')
  const status = str((await readBody(req)).status, 20)
  if (!TRANSITIONS[job.status]?.includes(status)) return fail(req, 409, `Cannot move a ${job.status} job to ${status}`, back)

  const firstPublish = status === 'open' && !job.publishedAt
  await prisma.circleJob.update({ where: { id }, data: { status, ...(firstPublish ? { publishedAt: new Date() } : {}) } })
  await audit(adminId, `job.${status}`, 'CircleJob', id)

  if (firstPublish) {
    const members = await prisma.circleMember.findMany({ where: { status: 'verified' }, include: { contractor: { select: { email: true, name: true } } } })
    const matches = members.filter(m => m.trades.includes('General Contractor') || m.trades.some(t => job.trades.includes(t)))
    const origin = baseUrl(req)
    await Promise.allSettled(matches.filter(m => m.contractor.email).map(m => sendCircleEmail({
      to: m.contractor.email as string,
      subject: `New Grand Bahama job: ${job.title}`,
      heading: 'A new job matches your trade',
      body: para(job.summary) + rows([['Trades', job.trades.join(', ')], ['Area', job.settlement || 'Grand Bahama'], ['Budget', job.budgetRange || 'To be discussed'], ['Estimates due', fmtDate(job.bidDeadline)]]),
      cta: { label: 'View job and submit an estimate', url: `${origin}/builders-circle/jobs/${id}` },
    })))
  }
  return done(req, back, { ok: true, status })
}
