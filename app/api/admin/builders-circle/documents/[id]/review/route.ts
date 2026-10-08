/** POST /api/admin/builders-circle/documents/[id]/review — approve or reject one document (admins). */
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { DOC_TYPES, type DocType } from '@/lib/builders-circle/constants'
import { adminFromRequest, audit, baseUrl, dateOrNull, done, fail, readBody, str } from '@/lib/builders-circle/server'
import { para, rows, sendCircleEmail } from '@/lib/builders-circle/email'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await adminFromRequest(req)
  if (!adminId) return fail(req, 403, 'Forbidden')
  const { id } = await params
  const doc = await prisma.contractorDocument.findUnique({ where: { id }, include: { contractor: { include: { circleMember: true } } } })
  if (!doc) return fail(req, 404, 'Document not found')
  const back = doc.contractor.circleMember ? `/admin/builders-circle/members/${doc.contractor.circleMember.id}` : '/admin/builders-circle/members'

  const b = await readBody(req)
  const decision = str(b.decision, 20)
  const reason = str(b.reason, 500)
  const expiresAt = dateOrNull(b.expiresAt)
  if (decision !== 'approve' && decision !== 'reject') return fail(req, 400, 'Choose approve or reject', back)
  if (decision === 'reject' && !reason) return fail(req, 400, 'A reason is required when rejecting', back)

  const updated = await prisma.contractorDocument.update({
    where: { id },
    data: {
      status: decision === 'approve' ? 'approved' : 'rejected',
      rejectionReason: decision === 'reject' ? reason : null,
      reviewedBy: adminId, reviewedAt: new Date(),
      ...(expiresAt ? { expiresAt } : {}),
    },
  })
  await audit(adminId, `document.${updated.status}`, 'ContractorDocument', id, { reason: reason || undefined })

  const label = DOC_TYPES[doc.type as DocType]?.label || doc.type
  if (doc.contractor.email) {
    await sendCircleEmail({
      to: doc.contractor.email,
      subject: decision === 'approve' ? `Document approved: ${label}` : `Action needed: ${label} was not accepted`,
      heading: decision === 'approve' ? 'Document approved' : 'Document not accepted',
      body: decision === 'approve'
        ? para(`Your ${label} has been approved.`) + rows([['File', doc.fileName], ['Valid until', updated.expiresAt ? updated.expiresAt.toDateString() : 'n/a']])
        : para(`Your ${label} could not be accepted. Please upload a new copy.`) + rows([['File', doc.fileName], ['Reason', reason]]),
      cta: { label: 'Open my documents', url: `${baseUrl(req)}/builders-circle/documents` },
    })
  }
  return done(req, back, { ok: true, status: updated.status })
}
