/** POST /api/admin/builders-circle/board — admin creates a board post (always a draft; publish separately). */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { adminFromRequest, audit, readBody } from '@/lib/builders-circle/server'
import { parsePostInput } from '@/lib/builders-circle/board'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const adminId = await adminFromRequest(req)
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const parsed = parsePostInput(await readBody(req))
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const post = await prisma.boardPost.create({ data: { ...parsed.data, status: 'draft' } })
  await audit(adminId, 'board.created', 'BoardPost', post.id)
  return NextResponse.json({ ok: true, postId: post.id })
}
