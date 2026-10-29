/** POST /api/admin/builders-circle/jobs/[id]/attachments — record ({pathname,fileName}) or remove ({remove:index}) a job file. */
import { NextRequest, NextResponse } from 'next/server'
import { del, head } from '@vercel/blob'
import { prisma } from '@/lib/db'
import { adminFromRequest, audit, jobPathPrefix, readBody, str } from '@/lib/builders-circle/server'

export const runtime = 'nodejs'

type Att = { pathname: string; fileName: string; mimeType: string; size: number }

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await adminFromRequest(req)
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const job = await prisma.circleJob.findUnique({ where: { id } })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const list = (Array.isArray(job.attachments) ? job.attachments : []) as unknown as Att[]
  const b = await readBody(req)

  if (b.remove !== undefined) {
    const idx = Number(b.remove)
    const att = list[idx]
    if (!att) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const next = list.filter((_, i) => i !== idx)
    await prisma.circleJob.update({ where: { id }, data: { attachments: next as never } })
    try { await del(att.pathname, { token: process.env.BLOB_READ_WRITE_TOKEN }) } catch { /* already gone */ }
    await audit(adminId, 'job.attachment_removed', 'CircleJob', id, { fileName: att.fileName })
    return NextResponse.json({ ok: true })
  }

  const pathname = str(b.pathname, 500)
  const fileName = str(b.fileName, 200) || 'file'
  if (!pathname.startsWith(jobPathPrefix(id)) || pathname.includes('..')) return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  let meta
  try { meta = await head(pathname, { token: process.env.BLOB_READ_WRITE_TOKEN }) } catch { return NextResponse.json({ error: 'Upload not found' }, { status: 400 }) }
  if (!meta.url.includes('.private.')) return NextResponse.json({ error: 'File must be private' }, { status: 400 })
  const next = [...list, { pathname, fileName, mimeType: meta.contentType, size: meta.size }]
  await prisma.circleJob.update({ where: { id }, data: { attachments: next as never } })
  await audit(adminId, 'job.attachment_added', 'CircleJob', id, { fileName })
  return NextResponse.json({ ok: true })
}
