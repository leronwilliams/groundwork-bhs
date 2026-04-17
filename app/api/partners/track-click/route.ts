import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { adId, type } = await req.json()
    if (!adId) return NextResponse.json({ ok: false }, { status: 400 })
    if (type === 'impression') {
      await prisma.partnerAd.update({ where: { id: adId }, data: { impressions: { increment: 1 } } })
    } else if (type === 'click') {
      await prisma.partnerAd.update({ where: { id: adId }, data: { clicks: { increment: 1 } } })
    }
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
