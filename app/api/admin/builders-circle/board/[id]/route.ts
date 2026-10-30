/** PATCH/DELETE /api/admin/builders-circle/board/[id] — edit, publish, unpublish or delete (drafts only) a board post. */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { adminFromRequest, audit, readBody, str } from '@/lib/builders-circle/server'
import { parsePostInput } from '@/lib/builders-circle/board'

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await adminFromRequest(req)
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const post = await prisma.boardPost.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const b = await readBody(req)
  const action = str(b.action, 20)
  if (action === 'publish' || action === 'unpublish') {
    if (action === 'publish') {
      if (post.status === 'published') return NextResponse.json({ error: 'Already published' }, { status: 409 })
      await prisma.boardPost.update({ where: { id }, data: { status: 'published', publishedAt: new Date() } })
    } else {
      if (post.status !== 'published') return NextResponse.json({ error: 'Not published' }, { status: 409 })
      await prisma.boardPost.update({ where: { id }, data: { status: 'draft' } })
    }
    await audit(adminId, `board.${action}ed`, 'BoardPost', id)
    return NextResponse.json({ ok: true })
  }
  const parsed = parsePostInput(b)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  await prisma.boardPost.update({ where: { id }, data: parsed.data })
  await audit(adminId, 'board.updated', 'BoardPost', id)
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await adminFromRequest(req)
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const post = await prisma.boardPost.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (post.status === 'published') return NextResponse.json({ error: 'Unpublish the post before deleting it.' }, { status: 409 })
  await prisma.boardPost.delete({ where: { id } })
  await audit(adminId, 'board.deleted', 'BoardPost', id, { title: post.title.slice(0, 120) })
  return NextResponse.json({ ok: true })
}
