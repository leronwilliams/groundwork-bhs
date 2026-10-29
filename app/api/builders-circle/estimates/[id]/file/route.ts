/** GET /api/builders-circle/estimates/[id]/file — the estimate's attachment, for its contractor or an admin only (sealed bids). */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCircleContext } from '@/lib/builders-circle/server'
import { streamPrivateBlob } from '@/lib/builders-circle/stream'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId, admin, member } = await getCircleContext()
  if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  const est = await prisma.circleEstimate.findUnique({ where: { id } })
  const owner = !!est && !!member && est.contractorId === member.contractorId
  if (!est || !est.attachmentPathname || (!owner && !admin)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const name = est.attachmentPathname.split('/').pop() || 'estimate'
  return streamPrivateBlob(est.attachmentPathname, name)
}
