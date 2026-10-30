/** POST /api/builders-circle/unsubscribe — signed-link opt-out / opt-in for the board email digest (no login needed). */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { baseUrl, readBody, sameOrigin, str } from '@/lib/builders-circle/server'
import { verifySignedPath } from '@/lib/builders-circle/signed-link'
import { unsubscribePath } from '@/lib/builders-circle/board'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Bad origin' }, { status: 403 })
  const b = await readBody(req)
  const m = str(b.m, 60), exp = str(b.exp, 20), sig = str(b.sig, 100), action = str(b.action, 12)
  if (!m || !verifySignedPath(unsubscribePath(m), exp, sig)) return NextResponse.json({ error: 'This link is not valid or has expired.' }, { status: 403 })
  const member = await prisma.circleMember.findUnique({ where: { id: m }, select: { id: true } })
  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (action === 'resubscribe') await prisma.boardDigestOptOut.deleteMany({ where: { memberId: m } })
  else await prisma.boardDigestOptOut.upsert({ where: { memberId: m }, update: {}, create: { memberId: m } })
  const back = new URL(`/builders-circle/unsubscribe?m=${encodeURIComponent(m)}&exp=${encodeURIComponent(exp)}&sig=${encodeURIComponent(sig)}&done=${action === 'resubscribe' ? 'on' : 'off'}`, baseUrl(req))
  return NextResponse.redirect(back, 303)
}
