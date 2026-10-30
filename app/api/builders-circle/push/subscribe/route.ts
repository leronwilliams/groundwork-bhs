/** POST /api/builders-circle/push/subscribe — a signed-in member (or admin) registers this device for job alerts. */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCircleContext, readBody, sameOrigin, str } from '@/lib/builders-circle/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const ctx = await getCircleContext()
  if (!ctx.userId) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })
  if (!ctx.member && !ctx.admin) return NextResponse.json({ error: 'Join the Builders Circle first.' }, { status: 403 })
  const b = await readBody(req)
  const sub = (b.subscription || {}) as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }
  const endpoint = str(sub.endpoint, 1000), p256dh = str(sub.keys?.p256dh, 200), auth = str(sub.keys?.auth, 100)
  if (!/^https:\/\/[^\s]+$/.test(endpoint) || !p256dh || !auth) return NextResponse.json({ error: 'Invalid subscription.' }, { status: 400 })
  const data = { p256dh, auth, userId: ctx.userId, memberId: ctx.member?.id ?? null, areas: ctx.member?.serviceAreas ?? [], userAgent: (req.headers.get('user-agent') || '').slice(0, 300) || null, failCount: 0 }
  await prisma.pushSubscription.upsert({ where: { endpoint }, create: { endpoint, ...data }, update: data })
  // Keep at most 5 devices per person; drop the oldest.
  const mine = await prisma.pushSubscription.findMany({ where: { userId: ctx.userId }, orderBy: { createdAt: 'desc' }, select: { id: true } })
  if (mine.length > 5) await prisma.pushSubscription.deleteMany({ where: { id: { in: mine.slice(5).map(m => m.id) } } })
  return NextResponse.json({ ok: true })
}
