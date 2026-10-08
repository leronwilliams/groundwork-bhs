/** PATCH /api/builders-circle/profile — member edits their own business profile. */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CIRCLE_TRADES, SETTLEMENTS } from '@/lib/builders-circle/constants'
import { audit, getCircleContext, readBody, sameOrigin, str, strArr } from '@/lib/builders-circle/server'

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Bad origin' }, { status: 403 })
  const { userId, member } = await getCircleContext()
  if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  if (!member) return NextResponse.json({ error: 'Not a Builders Circle member.' }, { status: 403 })

  const b = await readBody(req)
  const contactName = str(b.contactName, 120)
  const phone = str(b.phone, 40)
  const whatsapp = str(b.whatsapp, 40)
  const email = str(b.email, 200)
  const trades = strArr(b.trades, CIRCLE_TRADES)
  const serviceAreas = strArr(b.serviceAreas, SETTLEMENTS)
  const businessAddress = str(b.businessAddress, 300)
  const description = str(b.description, 1500)
  const website = str(b.website, 300)
  const yearsRaw = parseInt(str(b.yearsInBusiness, 4), 10)

  const errors: string[] = []
  if (!contactName) errors.push('Contact name is required')
  if (!phone) errors.push('Phone is required')
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.push('A valid email is required')
  if (!trades.length) errors.push('Choose at least one trade')
  if (!serviceAreas.length) errors.push('Choose at least one service area')
  if (!businessAddress) errors.push('Business address is required')
  if (website && !/^https?:\/\//i.test(website)) errors.push('Website must start with http:// or https://')
  if (errors.length) return NextResponse.json({ error: errors.join('. ') }, { status: 400 })

  // Business name is locked once applied (it is what the documents are checked against).
  await prisma.$transaction([
    prisma.contractor.update({
      where: { id: member.contractorId },
      data: { contactName, phone, whatsapp: whatsapp || null, email, description: description || null, website: website || null },
    }),
    prisma.circleMember.update({
      where: { id: member.id },
      data: { trades, serviceAreas, businessAddress, yearsInBusiness: Number.isFinite(yearsRaw) && yearsRaw >= 0 && yearsRaw < 150 ? yearsRaw : null },
    }),
  ])
  await audit(userId, 'member.profile_updated', 'CircleMember', member.id)
  return NextResponse.json({ ok: true })
}
