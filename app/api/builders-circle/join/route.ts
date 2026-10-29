/**
 * POST /api/builders-circle/join
 * Creates the caller's Builders Circle membership (status "applied").
 * Re-uses their existing Contractor listing if they already have one;
 * otherwise creates a new Contractor (listingStatus "pending", hidden from the
 * public directory until verified).
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { CIRCLE_ISLAND, CIRCLE_TRADES, SETTLEMENTS } from '@/lib/builders-circle/constants'
import { audit, baseUrl, readBody, sameOrigin, str, strArr } from '@/lib/builders-circle/server'
import { adminEmails, rows, para, sendCircleEmail } from '@/lib/builders-circle/email'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Bad origin' }, { status: 403 })
  const limited = rateLimit(req, 'bc-join', 10)
  if (limited) return limited
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 })

  const b = await readBody(req)
  const businessName = str(b.businessName, 160)
  const contactName = str(b.contactName, 120)
  const email = str(b.email, 200)
  const phone = str(b.phone, 40)
  const whatsapp = str(b.whatsapp, 40)
  const trades = strArr(b.trades, CIRCLE_TRADES)
  const serviceAreas = strArr(b.serviceAreas, SETTLEMENTS)
  const businessAddress = str(b.businessAddress, 300)
  const yearsRaw = parseInt(str(b.yearsInBusiness, 4), 10)
  const description = str(b.description, 1500)
  const website = str(b.website, 300)
  const agreed = b.agree === true || b.agree === 'on' || b.agree === 'true'

  const errors: string[] = []
  if (!businessName) errors.push('Business name is required')
  if (!contactName) errors.push('Contact name is required')
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.push('A valid email is required')
  if (!phone) errors.push('Phone number is required')
  if (!trades.length) errors.push('Choose at least one trade')
  if (!serviceAreas.length) errors.push('Choose at least one Grand Bahama service area')
  if (!businessAddress) errors.push('Business address is required')
  if (!agreed) errors.push('Please confirm the declaration')
  if (website && !/^https?:\/\//i.test(website)) errors.push('Website must start with http:// or https://')
  if (errors.length) return NextResponse.json({ error: errors.join('. ') }, { status: 400 })

  const already = await prisma.circleMember.findUnique({ where: { userId } })
  if (already) return NextResponse.json({ error: 'You are already a Builders Circle member.', memberId: already.id }, { status: 409 })

  const existing = await prisma.contractor.findUnique({ where: { userId } })
  const member = await prisma.$transaction(async tx => {
    const contractor = existing
      ? await tx.contractor.update({
          where: { id: existing.id },
          // Keep the existing directory listing as-is; only fill blanks.
          data: {
            contactName: existing.contactName || contactName,
            whatsapp: existing.whatsapp || whatsapp || null,
            website: existing.website || website || null,
            description: existing.description || description || null,
          },
        })
      : await tx.contractor.create({
          data: {
            userId, name: businessName, contactName, email, phone, whatsapp: whatsapp || null,
            island: CIRCLE_ISLAND, trade: trades[0], description: description || null, website: website || null,
            verified: false, listingStatus: 'pending',
          },
        })
    return tx.circleMember.create({
      data: {
        contractorId: contractor.id, userId, status: 'applied', island: CIRCLE_ISLAND,
        serviceAreas, trades, businessAddress, yearsInBusiness: Number.isFinite(yearsRaw) && yearsRaw >= 0 && yearsRaw < 150 ? yearsRaw : null,
      },
      include: { contractor: true },
    })
  })

  await audit(userId, 'member.applied', 'CircleMember', member.id, { reusedListing: !!existing })
  const origin = baseUrl(req)
  await sendCircleEmail({
    to: adminEmails(),
    subject: `New Builders Circle applicant: ${member.contractor.name}`,
    heading: 'New Builders Circle applicant',
    body: para('A contractor has applied to join the Builders Circle. They will upload their documents next.') +
      rows([['Business', member.contractor.name], ['Contact', contactName], ['Email', email], ['Phone', phone], ['Trades', trades.join(', ')], ['Service areas', serviceAreas.join(', ')]]),
    cta: { label: 'Open in admin', url: `${origin}/admin/builders-circle/members/${member.id}` },
  })
  return NextResponse.json({ ok: true, memberId: member.id })
}
