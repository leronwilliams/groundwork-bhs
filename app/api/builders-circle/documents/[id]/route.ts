/** DELETE /api/builders-circle/documents/[id] — owner removes a pending or rejected document. */
import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { prisma } from '@/lib/db'
import { audit, getCircleContext, sameOrigin } from '@/lib/builders-circle/server'

export const runtime = 'nodejs'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Bad origin' }, { status: 403 })
  const { id } = await params
  const { userId, member } = await getCircleContext()
  if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  const doc = await prisma.contractorDocument.findUnique({ where: { id } })
  if (!doc || !member || doc.contractorId !== member.contractorId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (doc.status !== 'pending' && doc.status !== 'rejected') {
    return NextResponse.json({ error: 'Approved documents are locked. Upload a new version instead.' }, { status: 409 })
  }
  await prisma.contractorDocument.delete({ where: { id } })
  try { await del(doc.blobPathname, { token: process.env.BLOB_READ_WRITE_TOKEN }) } catch (err) { console.error('[builders-circle] blob delete failed', err) }
  await audit(userId, 'document.deleted', 'ContractorDocument', id, { type: doc.type })
  return NextResponse.json({ ok: true })
}
