/**
 * POST /api/boq-quotes
 * 
 * Triggers the hardware store quote request flow for BOQ + Hardware Store Quotes orders.
 * 1. Parses the BOQ data from the order
 * 2. Finds all active hardware stores on the client's island
 * 3. Sends quote request emails (TEST MODE: all to leron@formartiq.com)
 * 4. Creates BOQQuoteRequest record in DB
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendBOQQuoteRequests, BOQLineItem } from '@/lib/hardware-store'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { orderId, boqData, island } = await req.json()

    if (!orderId || !boqData) {
      return NextResponse.json({ error: 'orderId and boqData required' }, { status: 400 })
    }

    // Verify order exists and is for boq_quotes service
    const order = await prisma.order.findUnique({ where: { id: orderId } })
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

    // Find active stores on this island (or all Nassau stores if no island match)
    const clientIsland = island || 'Nassau'
    let stores = await prisma.hardwareStore.findMany({
      where: { active: true, island: { contains: 'Nassau' } },
    })

    // If no Nassau stores found (fresh DB), fall back to all stores
    if (stores.length === 0) {
      stores = await prisma.hardwareStore.findMany({ where: { active: true } })
    }

    if (stores.length === 0) {
      return NextResponse.json({ error: 'No active hardware stores found — please seed the DB first' }, { status: 400 })
    }

    // Parse BOQ items from the AI-generated BOQ text
    const items: BOQLineItem[] = parseBoqText(boqData)

    if (items.length === 0) {
      return NextResponse.json({ error: 'Could not parse BOQ items from boqData' }, { status: 400 })
    }

    const deadline = new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours

    // Create the quote request record
    const quoteRequest = await prisma.bOQQuoteRequest.create({
      data: {
        orderId,
        boqData: JSON.parse(JSON.stringify({ items, rawBoq: boqData })),
        storesSentTo: stores.map(s => s.id),
        deadlineAt: deadline,
        status: 'pending',
      },
    })

    // Send emails
    const sendResults = await sendBOQQuoteRequests(
      { orderId, requestId: quoteRequest.id, clientIsland, deadline, items },
      stores.map(s => ({ id: s.id, name: s.name, email: s.email, island: s.island }))
    )

    const sentCount = sendResults.filter(r => r.sent).length

    return NextResponse.json({
      success: true,
      requestId: quoteRequest.id,
      storeCount: stores.length,
      emailsSent: sentCount,
      deadline: deadline.toISOString(),
      testMode: true,
      testRecipient: 'leron@formartiq.com',
      stores: sendResults.map(r => ({ name: r.storeName, sent: r.sent })),
    })
  } catch (error) {
    console.error('BOQ quotes error:', error)
    return NextResponse.json({ error: 'Failed to send quote requests' }, { status: 500 })
  }
}

/**
 * Extract BOQ line items from the markdown text produced by the BOQ engine.
 * Looks for table rows in the format: | Item | Description | Unit | Quantity | ... |
 */
function parseBoqText(boqText: string): BOQLineItem[] {
  const items: BOQLineItem[] = []
  const lines = boqText.split('\n')

  let inTable = false
  let headerParsed = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed.startsWith('|')) { if (inTable) break; continue }

    // Skip separator lines like |---|---|
    if (trimmed.replace(/[\|\s\-:]/g, '').length === 0) { headerParsed = true; continue }

    const cells = trimmed.split('|').map(c => c.trim()).filter(Boolean)
    if (cells.length < 4) continue

    // First row with content = header
    if (!inTable) { inTable = true; continue }
    if (!headerParsed) continue

    // Parse data row: Item | Description | Unit | Quantity | ...
    const [item, description, unit, qtyStr] = cells
    const quantity = parseFloat(qtyStr?.replace(/[^0-9.]/g, '') || '0')

    if (item && !item.toLowerCase().includes('item') && quantity > 0) {
      items.push({ item, description: description || '', unit: unit || 'each', quantity })
    }
  }

  // Fallback: extract key materials from free text
  if (items.length === 0) {
    const materialPatterns = [
      { pattern: /concrete blocks?.*?(\d+[\d,]*)/i, item: 'Concrete Blocks (8")', unit: 'each' },
      { pattern: /cement.*?(\d+[\d,]*)/i, item: 'Cement (94lb bag)', unit: 'bags' },
      { pattern: /sand.*?(\d+[\d,]*)/i, item: 'Sand', unit: 'yards' },
      { pattern: /gravel.*?(\d+[\d,]*)/i, item: 'Gravel', unit: 'yards' },
      { pattern: /rebar.*?(\d+[\d,]*)/i, item: 'Rebar #4', unit: 'sticks' },
      { pattern: /lumber.*?(\d+[\d,]*)/i, item: 'Lumber 2x4x8', unit: 'pieces' },
      { pattern: /roofing sheet.*?(\d+[\d,]*)/i, item: 'Roofing Sheet (26g)', unit: 'sheets' },
      { pattern: /paint.*?(\d+[\d,]*)/i, item: 'Paint (5 gallon)', unit: 'buckets' },
    ]
    for (const { pattern, item, unit } of materialPatterns) {
      const match = boqText.match(pattern)
      if (match) {
        items.push({ item, description: '', unit, quantity: parseInt(match[1].replace(/,/g, '')) })
      }
    }
  }

  return items
}
