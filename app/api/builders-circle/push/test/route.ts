/** POST /api/builders-circle/push/test — send a test alert to the caller's own devices only. */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCircleContext, sameOrigin } from '@/lib/builders-circle/server'
import { pushConfigured, sendPush } from '@/lib/builders-circle/push'

export const runtime = 'nodejs'
const last = new Map<string, number>()

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const ctx = await getCircleContext()
  if (!ctx.userId) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })
  if (!pushConfigured()) return NextResponse.json({ error: 'Alerts are not available yet.' }, { status: 503 })
  const now = Date.now()
  if (now - (last.get(ctx.userId) || 0) < 10_000) return NextResponse.json({ error: 'Wait a few seconds before testing again.' }, { status: 429 })
  last.set(ctx.userId, now)
  const subs = await prisma.pushSubscription.findMany({ where: { userId: ctx.userId } })
  if (!subs.length) return NextResponse.json({ error: 'No device is subscribed yet. Turn on job alerts first.' }, { status: 409 })
  const r = await sendPush(subs, { title: 'Job alerts are on', body: 'This is a test alert from Groundwork Builders Circle. New Grand Bahama jobs will arrive like this.', url: '/builders-circle/board', tag: 'test-alert' })
  return NextResponse.json({ ok: true, ...r })
}
