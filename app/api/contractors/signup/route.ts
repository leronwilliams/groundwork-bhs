/**
 * POST /api/contractors/signup
 *
 * Self-service contractor signup. Creates a Contractor tied to the caller's
 * Clerk account with listingStatus 'pending' + verified false, so it lands in
 * the existing admin review queue (/admin/contractors → Pending tab) and is
 * hidden from the public directory until an admin approves it.
 *
 * Validation is manual (the repo doesn't use zod) — matches existing routes.
 */

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'You must be signed in to create a contractor profile.' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

    const businessName = s(body.businessName)
    const contactName = s(body.contactName)
    const email = s(body.email)
    const phone = s(body.phone)
    const whatsapp = s(body.whatsapp)
    const island = s(body.island)
    const trade = s(body.trade)
    const description = s(body.description)
    const website = s(body.website)

    const errors: string[] = []
    if (!businessName) errors.push('Business name is required')
    if (!contactName) errors.push('Contact name is required')
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) errors.push('A valid email is required')
    if (!phone) errors.push('Phone number is required')
    if (!island) errors.push('Island is required')
    if (!trade) errors.push('Primary trade is required')
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join('. ') }, { status: 400 })
    }

    // One contractor profile per account (userId is @unique).
    const existing = await prisma.contractor.findUnique({ where: { userId } })
    if (existing) {
      return NextResponse.json(
        { error: 'You already have a contractor profile.', contractorId: existing.id },
        { status: 409 }
      )
    }

    const contractor = await prisma.contractor.create({
      data: {
        userId,
        name: businessName,
        contactName,
        email,
        phone,
        whatsapp: whatsapp || null,
        island,
        trade,
        description: description || null,
        website: website || null,
        verified: false,
        listingStatus: 'pending',
      },
    })

    return NextResponse.json({ success: true, contractorId: contractor.id })
  } catch (error) {
    console.error('Contractor signup error:', error)
    return NextResponse.json({ error: 'Failed to create contractor profile' }, { status: 500 })
  }
}
