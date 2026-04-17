/**
 * POST /api/shopping-list
 * Groups selected BOQ items by cheapest hardware store.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { DEFAULT_PRICES } from '@/lib/boq/prices'

export async function POST(req: NextRequest) {
  try {
    const { boqId, selectedItems } = await req.json()

    if (!selectedItems || !Array.isArray(selectedItems)) {
      return NextResponse.json({ error: 'selectedItems[] required' }, { status: 400 })
    }

    // Get price list
    const priceItems = await prisma.priceList.findMany()
    const prices: Record<string, { price: number; supplier: string }> = {}
    priceItems.forEach(p => { prices[p.itemCode] = { price: p.unitPrice, supplier: p.supplier || 'General Supplier' } })

    // Group by supplier (in production: multiple store prices per item)
    const supplierGroups: Record<string, { items: typeof selectedItems; total: number }> = {}

    selectedItems.forEach((item: { itemCode: string; description: string; quantity: number; unit: string }) => {
      const priceData = prices[item.itemCode] || { price: DEFAULT_PRICES[item.itemCode] || 0, supplier: 'General Supplier' }
      const total = priceData.price * item.quantity
      const supplier = priceData.supplier

      if (!supplierGroups[supplier]) supplierGroups[supplier] = { items: [], total: 0 }
      supplierGroups[supplier].items.push({ ...item, unitPrice: priceData.price, lineTotal: total })
      supplierGroups[supplier].total += total
    })

    const groupedList = Object.entries(supplierGroups)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([supplier, data]) => ({
        supplier,
        items: data.items,
        subtotal: Math.round(data.total),
        itemCount: data.items.length,
      }))

    const grandTotal = groupedList.reduce((s, g) => s + g.subtotal, 0)

    return NextResponse.json({
      success: true,
      boqId,
      groupedBySupplier: groupedList,
      grandTotal,
      itemCount: selectedItems.length,
      tip: 'Request hardware store quotes to compare real prices and save more.',
    })
  } catch (error) {
    return NextResponse.json({ error: 'Shopping list failed', detail: String(error) }, { status: 500 })
  }
}
