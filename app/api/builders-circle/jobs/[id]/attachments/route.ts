/** GET /api/builders-circle/jobs/[id]/attachments?i=0 — job files for verified members and admins only. */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCircleContext } from '@/lib/builders-circle/server'
import { streamPrivateBlob } from '@/lib/builders-circle/stream'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Att = { pathname: string; fileName: string; mimeType?: string }

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { userId, admin, member } = await getCircleContext()
  if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  const job = await prisma.circleJob.findUnique({ where: { id } })
  const visibleToMember = !!job && job.status !== 'draft' && member?.status === 'verified'
  if (!job || (!admin && !visibleToMember)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const list = (Array.isArray(job.attachments) ? job.attachments : []) as unknown as Att[]
  const att = list[Number(req.nextUrl.searchParams.get('i') || '0')]
  if (!att) return NextResponse.json({ error: 'File not found' }, { status: 404 })
  return streamPrivateBlob(att.pathname, att.fileName, att.mimeType)
}
