/**
 * GET /api/leads/express-interest?leadId=&contractorId=&token=
 * 
 * Called when a contractor clicks "Express Interest" in their lead email.
 * 1. Verifies the token (base64 of leadId:contractorId)
 * 2. Records the interest in DB
 * 3. Finds the client and notifies them with contractor full contact details
 * 4. Redirects contractor to a thank-you page
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendInterestNotificationToClient } from '@/lib/lead-emails'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const leadId = searchParams.get('leadId')
    const contractorId = searchParams.get('contractorId')
    const token = searchParams.get('token')

    if (!leadId || !contractorId || !token) {
      return NextResponse.redirect(new URL('/lead-interest?error=invalid', req.url))
    }

    // Verify token
    const expectedToken = Buffer.from(`${leadId}:${contractorId}`).toString('base64')
    if (token !== expectedToken) {
      return NextResponse.redirect(new URL('/lead-interest?error=invalid', req.url))
    }

    // Get lead and contractor
    const [lead, contractor] = await Promise.all([
      prisma.contractorLead.findUnique({ where: { id: leadId }, include: { user: true } }),
      prisma.contractor.findUnique({ where: { id: contractorId } }),
    ])

    if (!lead || !contractor) {
      return NextResponse.redirect(new URL('/lead-interest?error=notfound', req.url))
    }

    // Check if already expressed interest
    const existing = await prisma.contractorInterest.findFirst({
      where: { leadId, contractorId },
    })

    if (existing) {
      return NextResponse.redirect(new URL('/lead-interest?status=already', req.url))
    }

    // Record interest
    await prisma.contractorInterest.create({
      data: { leadId, contractorId, clientNotified: false },
    })

    // Update lead status
    await prisma.contractorLead.update({
      where: { id: leadId },
      data: { status: 'interested' },
    })

    // Send client notification with contractor contact details
    const clientUser = lead.user
    const clientFirstName = clientUser?.name?.split(' ')[0] || 'Client'
    const clientEmail = clientUser?.email

    if (clientEmail) {
      const notifyResult = await sendInterestNotificationToClient({
        clientEmail,
        clientFirstName,
        contractorName: contractor.name,
        contractorTrade: contractor.trade,
        contractorPhone: contractor.phone || undefined,
        contractorEmail: contractor.email || undefined,
        contractorWebsite: contractor.website || undefined,
        island: lead.island,
      })

      // Mark client as notified
      if (notifyResult.sent) {
        await prisma.contractorInterest.updateMany({
          where: { leadId, contractorId },
          data: { clientNotified: true },
        })
      }
    }

    return NextResponse.redirect(new URL('/lead-interest?status=success', req.url))
  } catch (error) {
    console.error('Express interest error:', error)
    return NextResponse.redirect(new URL('/lead-interest?error=server', req.url))
  }
}
