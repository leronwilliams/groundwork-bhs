/**
 * POST /api/admin/builders-circle/board/[id]/notify — push a published post to members' devices.
 *   mode "test": only the admin's own subscribed devices.
 *   mode "send": approved members whose area matches the post (Grand Bahama posts -> Grand Bahama members);
 *                requires confirm === "SEND", and `again: true` to re-send a post that was already pushed.
 * Safety: production sends need BC_PUSH_SEND_ENABLED=1; preview sends need the isolated test DB marker and are capped.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { adminFromRequest, audit, readBody, str } from '@/lib/builders-circle/server'
import { postPayload, pushConfigured, pushRecipients, pushSendBlocked, sendPush } from '@/lib/builders-circle/push'

export const runtime = 'nodejs'
export const maxDuration = 120
const PREVIEW_CAP = 5

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await adminFromRequest(req)
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const post = await prisma.boardPost.findUnique({ where: { id } })
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (post.status !== 'published') return NextResponse.json({ error: 'Publish the post first.' }, { status: 409 })
  if (!pushConfigured()) return NextResponse.json({ error: 'Push is not configured (VAPID keys missing).' }, { status: 503 })
  const b = await readBody(req)
  const mode = str(b.mode, 10)
  const payload = postPayload(post)

  if (mode === 'test') {
    const subs = await prisma.pushSubscription.findMany({ where: { userId: adminId } })
    if (!subs.length) return NextResponse.json({ error: 'No device of yours is subscribed. Use "Turn on alerts on this device" first.' }, { status: 409 })
    const r = await sendPush(subs, { ...payload, title: `[Test] ${payload.title}` })
    await audit(adminId, 'board.push_test', 'BoardPost', id, { ...r })
    return NextResponse.json({ ok: true, mode, devices: subs.length, ...r })
  }

  if (mode !== 'send') return NextResponse.json({ error: 'Unknown mode' }, { status: 400 })
  if (str(b.confirm, 10) !== 'SEND') return NextResponse.json({ error: 'Type SEND to confirm.' }, { status: 400 })
  const blocked = pushSendBlocked()
  if (blocked) return NextResponse.json({ error: blocked }, { status: 403 })
  if (post.pushSentAt && b.again !== true) return NextResponse.json({ error: 'This post was already pushed. Tick "send again" to repeat it.' }, { status: 409 })
  const preview = process.env.VERCEL_ENV !== 'production'
  let subs = await pushRecipients(post.location)
  if (!subs.length) return NextResponse.json({ error: 'No subscribed devices match this post.' }, { status: 409 })
  if (preview) subs = subs.slice(0, PREVIEW_CAP)
  const r = await sendPush(subs, payload)
  if (!preview && r.sent > 0) await prisma.boardPost.update({ where: { id }, data: { pushSentAt: new Date() } })
  await audit(adminId, 'board.push_sent', 'BoardPost', id, { devices: subs.length, ...r, preview })
  return NextResponse.json({ ok: true, mode, devices: subs.length, ...r, testMode: preview })
}
