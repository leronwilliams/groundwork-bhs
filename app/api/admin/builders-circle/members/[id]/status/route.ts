/**
 * POST /api/admin/builders-circle/members/[id]/status — verify, reject, suspend or reinstate a member (admins).
 * Verifying requires all required documents approved and unexpired. A verified member's
 * contractor listing is marked verified + active (shown on /contractors with the Builders Circle badge).
 */
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { requirementsMet } from '@/lib/builders-circle/constants'
import { adminFromRequest, audit, baseUrl, done, fail, readBody, str } from '@/lib/builders-circle/server'
import { para, sendCircleEmail } from '@/lib/builders-circle/email'

export const runtime = 'nodejs'

const ALLOWED = ['verified', 'rejected', 'suspended', 'applied'] as const

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await adminFromRequest(req)
  if (!adminId) return fail(req, 403, 'Forbidden')
  const { id } = await params
  const back = `/admin/builders-circle/members/${id}`
  const member = await prisma.circleMember.findUnique({ where: { id }, include: { contractor: { include: { documents: true } } } })
  if (!member) return fail(req, 404, 'Member not found')

  const b = await readBody(req)
  const status = str(b.status, 20) as (typeof ALLOWED)[number]
  const reason = str(b.reason, 500)
  if (!ALLOWED.includes(status)) return fail(req, 400, 'Unknown status', back)
  if ((status === 'rejected' || status === 'suspended') && !reason) return fail(req, 400, 'A reason is required', back)
  if (status === 'verified' && !requirementsMet(member.contractor.documents)) {
    return fail(req, 409, 'All required documents must be approved (and unexpired) before verifying', back)
  }

  await prisma.$transaction([
    prisma.circleMember.update({
      where: { id },
      data: { status, statusReason: reason || null, ...(status === 'verified' ? { verifiedAt: new Date() } : {}) },
    }),
    ...(status === 'verified'
      ? [prisma.contractor.update({ where: { id: member.contractorId }, data: { verified: true, listingStatus: 'active' } })]
      : []),
  ])
  await audit(adminId, `member.${status}`, 'CircleMember', id, { reason: reason || undefined })

  const origin = baseUrl(req)
  const copy: Record<string, { subject: string; heading: string; text: string }> = {
    verified: { subject: 'You are now a verified Builders Circle member', heading: 'Welcome to the Builders Circle', text: 'Your documents have been checked and your business is now verified. You can view full job details and submit estimates, and your listing shows the Builders Circle badge.' },
    rejected: { subject: 'Your Builders Circle application', heading: 'Application not approved', text: `We could not approve your application at this time. Reason: ${reason}` },
    suspended: { subject: 'Your Builders Circle membership is suspended', heading: 'Membership suspended', text: `Your membership has been suspended. Reason: ${reason}` },
    applied: { subject: 'Your Builders Circle membership is back under review', heading: 'Back under review', text: 'Your membership has been reopened for review. Check your documents page for anything outstanding.' },
  }
  if (member.contractor.email) {
    const c = copy[status]
    await sendCircleEmail({ to: member.contractor.email, subject: c.subject, heading: c.heading, body: para(c.text), cta: { label: 'Open Builders Circle', url: `${origin}/builders-circle/dashboard` } })
  }
  return done(req, back, { ok: true, status })
}
