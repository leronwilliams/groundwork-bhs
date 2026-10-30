/** POST /api/builders-circle/push/unsubscribe — turn job alerts off for this device. */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getCircleContext, readBody, sameOrigin, str } from '@/lib/builders-circle/server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const ctx = await getCircleContext()
  if (!ctx.userId) return NextResponse.json({ error: 'Sign in first.' }, { status: 401 })
  const b = await readBody(req)
  const endpoint = str(b.endpoint, 1000)
  if (!endpoint) return NextResponse.json({ error: 'Missing endpoint.' }, { status: 400 })
  const r = await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: ctx.userId } })
  return NextResponse.json({ ok: true, removed: r.count })
}
