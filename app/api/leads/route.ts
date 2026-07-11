/**
 * POST /api/leads
 *
 * Creates a contractor lead:
 * - Builder tier: free, no Stripe interaction — dispatched immediately.
 * - Free/Pro tier: requires paid orderId (verified against DB). In practice the
 *   post-project form sends Free/Pro users through Stripe checkout instead, and
 *   the webhook dispatches the lead after payment (see lib/leads.ts).
 *
 * Matching + email dispatch live in lib/leads.ts (shared with the webhook).
 * Client contact details stay hidden until a contractor expresses interest.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createAndDispatchLead } from '@/lib/leads'

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

    // Resolve user + tier
    let dbUser = null
    let tier = 'free'
    if (userId) {
      dbUser = await prisma.user.findFirst({
        where: { clerkId: userId },
        include: { subscription: true },
      })
      tier = dbUser?.subscription?.tier || 'free'
    }

    // Access check — Builder posts leads free; everyone else needs a paid lead order.
    if (tier !== 'builder') {
      if (!orderId) {
        return NextResponse.json({ error: 'orderId required for Free and Pro tier', code: 'PAYMENT_REQUIRED' }, { status: 402 })
      }
      const order = await prisma.order.findUnique({ where: { id: orderId } })
      if (!order || order.type !== 'lead' || order.status !== 'paid') {
        return NextResponse.json({ error: 'Valid paid lead order required', code: 'PAYMENT_REQUIRED' }, { status: 402 })
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.groundworksbhs.com'
    const result = await createAndDispatchLead({
      dbUserId: dbUser?.id || null,
      clientName: dbUser?.name,
      orderId: orderId || null,
      brief: { island, projectType, tradesNeeded, budget: budget || null, timeline: timeline || null, notes: notes || null },
      baseUrl,
    })

    return NextResponse.json({
      success: true,
      leadId: result.leadId,
      matchedContractors: result.matchedContractors,
      emailsSent: result.emailsSent,
      tier,
      builderFree: tier === 'builder',
      contractors: result.contractors,
      message: result.matchedContractors === 0
        ? 'No contractors currently match your trade + island criteria. We\'ll notify you when a match is found.'
        : undefined,
    })
  } catch (error) {
    console.error('Lead creation error:', error)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}
