/**
 * POST /api/boq-quote-response
 * 
 * Called when Jarvis parses an incoming hardware store email reply.
 * Stores the parsed quote, then checks if enough responses received
 * to generate the price comparison report.
 * 
 * In production this would be triggered by an email webhook (Resend inbound).
 * For now it accepts manual submission for testing.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { parseStoreQuoteReply, generateComparisonTable, BOQLineItem } from '@/lib/hardware-store'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { requestId, storeId, emailBody } = await req.json()

    if (!requestId || !storeId || !emailBody) {
      return NextResponse.json({ error: 'requestId, storeId, and emailBody required' }, { status: 400 })
    }

    const quoteRequest = await prisma.bOQQuoteRequest.findUnique({
      where: { id: requestId },
      include: { responses: { include: { store: true } } },
    })

    if (!quoteRequest) return NextResponse.json({ error: 'Quote request not found' }, { status: 404 })

    const store = await prisma.hardwareStore.findUnique({ where: { id: storeId } })
    if (!store) return NextResponse.json({ error: 'Store not found' }, { status: 404 })

    // Parse prices from email body using Claude
    const boqData = quoteRequest.boqData as unknown as { items: BOQLineItem[] }
    const parsedPrices = await parseStoreQuoteReply(emailBody, boqData.items || [])

    const totalAmount = parsedPrices.reduce((sum, p) => sum + (p.total || 0), 0)

    // Store the response
    await prisma.bOQQuoteResponse.create({
      data: { requestId, storeId, priceData: parsedPrices, totalAmount: Math.round(totalAmount * 100) },
    })

    // Check if we have 2+ responses or deadline has passed
    const allResponses = await prisma.bOQQuoteResponse.findMany({
      where: { requestId },
      include: { store: true },
    })

    const deadlinePassed = new Date() > quoteRequest.deadlineAt
    const enoughResponses = allResponses.length >= 2

    if (enoughResponses || deadlinePassed) {
      // Generate comparison table
      const responseData = allResponses.map(r => ({
        storeName: r.store.name,
        priceData: r.priceData as { item: string; unitPrice: number; total: number; notes?: string }[],
      }))

      const comparison = generateComparisonTable(boqData.items || [], responseData)

      // Update request status
      await prisma.bOQQuoteRequest.update({
        where: { id: requestId },
        data: { status: 'responses_received' },
      })

      return NextResponse.json({
        success: true,
        responseCount: allResponses.length,
        comparisonReady: true,
        comparison,
        stores: allResponses.map(r => ({
          store: r.store.name,
          total: (r.totalAmount || 0) / 100,
        })).sort((a, b) => a.total - b.total),
      })
    }

    return NextResponse.json({
      success: true,
      responseCount: allResponses.length,
      comparisonReady: false,
      message: `Response recorded. Waiting for more responses or deadline (${quoteRequest.deadlineAt.toISOString()}).`,
    })
  } catch (error) {
    console.error('BOQ response error:', error)
    return NextResponse.json({ error: 'Failed to process response' }, { status: 500 })
  }
}
