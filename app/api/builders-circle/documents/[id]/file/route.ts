/**
 * GET /api/builders-circle/documents/[id]/file
 * Streams a private verification document. Only the owning contractor or an
 * admin may read it (everyone else gets 403). If the link carries exp/sig
 * (emailed links), the signature must also be valid and unexpired.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCircleContext } from '@/lib/builders-circle/server'
import { verifySignedPath } from '@/lib/builders-circle/signed-link'
import { streamPrivateBlob } from '@/lib/builders-circle/stream'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const sp = req.nextUrl.searchParams
  if ((sp.has('sig') || sp.has('exp')) && !verifySignedPath(`/api/builders-circle/documents/${id}/file`, sp.get('exp'), sp.get('sig'))) {
    return NextResponse.json({ error: 'This link is invalid or has expired.' }, { status: 403 })
  }
  const { userId, admin, member } = await getCircleContext()
  if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  const doc = await prisma.contractorDocument.findUnique({ where: { id } })
  const owner = !!doc && !!member && member.contractorId === doc.contractorId
  if (!doc || (!owner && !admin)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return streamPrivateBlob(doc.blobPathname, doc.fileName, doc.mimeType)
}
