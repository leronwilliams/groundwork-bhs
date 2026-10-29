/**
 * POST /api/builders-circle/jobs/[id]/estimate
 * body.action = "submit" (create or edit — one estimate per contractor per job) | "withdraw"
 * Verified members only, job must be open and before its bid deadline. Estimates are sealed.
 */
import { NextRequest, NextResponse } from 'next/server'
import { head } from '@vercel/blob'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { formatBSD } from '@/lib/builders-circle/constants'
import { audit, baseUrl, blobPrefix, dateOrNull, getCircleContext, readBody, sameOrigin, str } from '@/lib/builders-circle/server'
import { adminEmails, para, rows, sendCircleEmail } from '@/lib/builders-circle/email'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Bad origin' }, { status: 403 })
  const limited = rateLimit(req, 'bc-estimate', 30)
  if (limited) return limited
  const { id } = await params
  const { userId, member } = await getCircleContext()
  if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  if (!member || member.status !== 'verified') return NextResponse.json({ error: 'Only verified Builders Circle members can submit estimates.' }, { status: 403 })

  const job = await prisma.circleJob.findUnique({ where: { id } })
  if (!job || job.status === 'draft') return NextResponse.json({ error: 'Job not found.' }, { status: 404 })
  if (job.status !== 'open') return NextResponse.json({ error: 'This job is no longer accepting estimates.' }, { status: 409 })
  if (job.bidDeadline && job.bidDeadline.getTime() < Date.now()) return NextResponse.json({ error: 'The bid deadline has passed.' }, { status: 409 })

  const b = await readBody(req)
  const action = str(b.action, 20) || 'submit'
  const existing = await prisma.circleEstimate.findUnique({ where: { jobId_contractorId: { jobId: id, contractorId: member.contractorId } } })

  if (action === 'withdraw') {
    if (!existing || !['submitted', 'shortlisted'].includes(existing.status)) return NextResponse.json({ error: 'Nothing to withdraw.' }, { status: 409 })
    await prisma.circleEstimate.update({ where: { id: existing.id }, data: { status: 'withdrawn' } })
    await audit(userId, 'estimate.withdrawn', 'CircleEstimate', existing.id, { jobId: id })
    return NextResponse.json({ ok: true, status: 'withdrawn' })
  }
  if (action !== 'submit') return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  if (existing && ['accepted', 'declined'].includes(existing.status)) return NextResponse.json({ error: 'This estimate has already been decided and cannot be changed.' }, { status: 409 })

  const amount = Number(str(b.amount, 20).replace(/[$,\s]/g, ''))
  const amountCents = Math.round(amount * 100)
  const timelineDays = parseInt(str(b.timelineDays, 6), 10)
  const scopeNotes = str(b.scopeNotes, 5000)
  const availableFrom = dateOrNull(b.availableFrom)
  const vatIncluded = b.vatIncluded === true || b.vatIncluded === 'true' || b.vatIncluded === 'on'
  const attachmentPathname = str(b.attachmentPathname, 500) || null

  const errors: string[] = []
  if (!Number.isFinite(amount) || amountCents <= 0 || amountCents > 100_000_000_00) errors.push('Enter your price in Bahamian dollars')
  if (!Number.isFinite(timelineDays) || timelineDays <= 0 || timelineDays > 2000) errors.push('Enter a timeline in days')
  if (!scopeNotes) errors.push('Describe what your price includes')
  if (errors.length) return NextResponse.json({ error: errors.join('. ') }, { status: 400 })

  if (attachmentPathname && attachmentPathname !== existing?.attachmentPathname) {
    if (!attachmentPathname.startsWith(`${blobPrefix()}/estimates/${id}/${member.contractorId}/`) || attachmentPathname.includes('..')) {
      return NextResponse.json({ error: 'That file does not belong to your account.' }, { status: 403 })
    }
    try {
      const meta = await head(attachmentPathname, { token: process.env.BLOB_READ_WRITE_TOKEN })
      if (!meta.url.includes('.private.')) throw new Error('not private')
    } catch {
      return NextResponse.json({ error: 'Attachment not found. Please upload it again.' }, { status: 400 })
    }
  }

  const data = { amountCents, vatIncluded, timelineDays, availableFrom, scopeNotes, attachmentPathname: attachmentPathname ?? existing?.attachmentPathname ?? null, status: 'submitted' }
  const est = existing
    ? await prisma.circleEstimate.update({ where: { id: existing.id }, data })
    : await prisma.circleEstimate.create({ data: { ...data, jobId: id, contractorId: member.contractorId } })
  const verb = existing ? (existing.status === 'withdrawn' ? 'resubmitted' : 'updated') : 'submitted'
  await audit(userId, `estimate.${verb}`, 'CircleEstimate', est.id, { jobId: id, amountCents })

  await sendCircleEmail({
    to: adminEmails(),
    subject: `Estimate ${verb}: ${formatBSD(amountCents)} on “${job.title}”`,
    heading: `Estimate ${verb}`,
    body: para(`${member.contractor.name} ${verb} an estimate.`) +
      rows([['Job', job.title], ['Amount', `${formatBSD(amountCents)} ${vatIncluded ? '(VAT included)' : '(plus VAT)'}`], ['Timeline', `${timelineDays} days`]]),
    cta: { label: 'Compare estimates', url: `${baseUrl(req)}/admin/builders-circle/jobs/${id}` },
  })
  return NextResponse.json({ ok: true, status: 'submitted', estimateId: est.id, verb })
}
