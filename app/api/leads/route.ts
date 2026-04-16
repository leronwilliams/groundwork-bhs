/**
 * POST /api/leads
 * 
 * Creates a contractor lead:
 * - Builder tier: free, no Stripe interaction
 * - Free/Pro tier: requires paid orderId (verified against DB)
 * 
 * Matches contractors by trade AND island — no cross-island leads.
 * Sends anonymous lead notification to matched contractors.
 * Client contact details hidden until contractor expresses interest.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendLeadToContractor } from '@/lib/lead-emails'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    let userId: string | null = null
    try {
      const { auth } = await import('@clerk/nextjs/server')
      const a = await auth()
      userId = a.userId
    } catch {}

    const { orderId, island, projectType, tradesNeeded, budget, timeline, notes } = await req.json()

    if (!island || !tradesNeeded || !Array.isArray(tradesNeeded) || tradesNeeded.length === 0) {
      return NextResponse.json({ error: 'island and tradesNeeded[] required' }, { status: 400 })
    }

    // Resolve user
    let dbUser = null
    let tier = 'free'
    if (userId) {
      dbUser = await prisma.user.findFirst({
        where: { clerkId: userId },
        include: { subscription: true },
      })
      tier = dbUser?.subscription?.tier || 'free'
    }

    // Access check
    if (tier !== 'builder') {
      // Must have a paid lead order
      if (!orderId) {
        return NextResponse.json({ error: 'orderId required for Free and Pro tier', code: 'PAYMENT_REQUIRED' }, { status: 402 })
      }
      const order = await prisma.order.findUnique({ where: { id: orderId } })
      if (!order || order.type !== 'lead' || order.status !== 'paid') {
        return NextResponse.json({ error: 'Valid paid lead order required', code: 'PAYMENT_REQUIRED' }, { status: 402 })
      }
    }

    // Match contractors by trade AND island
    const islandKey = island.toLowerCase()
    const allContractors = await prisma.contractor.findMany({
      where: {
        listingStatus: 'active',
        island: { contains: islandKey.includes('nassau') ? 'nassau' : islandKey, mode: 'insensitive' },
      },
    })

    // Further filter by trade match
    const tradeTerms = tradesNeeded.map((t: string) => t.toLowerCase())
    const matched = allContractors.filter(c =>
      tradeTerms.some(trade =>
        c.trade?.toLowerCase().includes(trade) ||
        c.description?.toLowerCase().includes(trade) ||
        trade.includes(c.trade?.toLowerCase() || '')
      )
    )

    if (matched.length === 0) {
      // Still create the lead record — no contractors matched right now
      const lead = await prisma.contractorLead.create({
        data: {
          orderId: orderId || null,
          userId: dbUser?.id || 'guest',
          projectBrief: { projectType, notes } as Record<string, string>,
          island,
          tradesNeeded,
          budget: budget || null,
          timeline: timeline || null,
          contractorsSent: [],
          status: 'sent',
        },
      })
      return NextResponse.json({
        success: true,
        leadId: lead.id,
        matchedContractors: 0,
        message: 'No contractors currently match your trade + island criteria. We\'ll notify you when a match is found.',
      })
    }

    // Get client first name only
    const clientFirstName = dbUser?.name?.split(' ')[0] || 'Client'

    // Create lead record
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.groundworksbhs.com'
    const lead = await prisma.contractorLead.create({
      data: {
        orderId: orderId || null,
        userId: dbUser?.id || 'guest',
        projectBrief: { projectType, notes } as Record<string, string>,
        island,
        tradesNeeded,
        budget: budget || null,
        timeline: timeline || null,
        contractorsSent: matched.map(c => c.id),
        status: 'sent',
      },
    })

    // Send anonymous lead email to each matched contractor
    const emailResults = []
    for (const contractor of matched) {
      const expressInterestUrl = `${baseUrl}/api/leads/express-interest?leadId=${lead.id}&contractorId=${contractor.id}&token=${Buffer.from(`${lead.id}:${contractor.id}`).toString('base64')}`

      const result = await sendLeadToContractor(
        contractor.email || 'noreply@placeholder.com',
        contractor.name,
        {
          leadId: lead.id,
          clientFirstName,
          island,
          projectType: projectType || 'Construction Project',
          trades: tradesNeeded,
          budget: budget || 'Not specified',
          timeline: timeline || 'Flexible',
          notes,
          expressInterestUrl,
        }
      )
      emailResults.push({ contractor: contractor.name, ...result })
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      matchedContractors: matched.length,
      emailsSent: emailResults.filter(r => r.sent).length,
      tier,
      builderFree: tier === 'builder',
      contractors: emailResults,
    })
  } catch (error) {
    console.error('Lead creation error:', error)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}
