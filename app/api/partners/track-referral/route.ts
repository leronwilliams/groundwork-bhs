import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { referralCode, page, userId } = await req.json()
    if (!referralCode) return NextResponse.json({ ok: false })

    const partner = await prisma.partner.findUnique({ where: { referralCode } })
    if (!partner) return NextResponse.json({ ok: false })

    await Promise.all([
      prisma.partnerReferral.create({ data: { partnerId: partner.id, referralCode, page: page || '/', userId: userId || null } }),
      prisma.partner.update({ where: { id: partner.id }, data: { referralCount: { increment: 1 } } }),
    ])

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false })
  }
}
