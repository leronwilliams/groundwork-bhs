/**
 * Hardware Store Email Flow — Phase 6
 * 
 * TEST MODE: All emails are redirected to leron@formartiq.com.
 * Real store emails are stored in DB but not used for delivery in dev.
 * 
 * When Ron updates hardware store contacts with real emails,
 * remove the TEST_RECIPIENT override and emails will route correctly.
 */

import { Resend } from 'resend'
import Anthropic from '@anthropic-ai/sdk'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// TEST MODE: all emails go here instead of real store addresses
const TEST_RECIPIENT = 'leron@formartiq.com'
const TEST_MODE = false // Domain verified — emails route to real addresses

export interface BOQLineItem {
  item: string
  description: string
  unit: string
  quantity: number
  estimatedUnitPrice?: number
}

export interface StoreQuoteRequest {
  orderId: string
  requestId: string
  clientIsland: string
  deadline: Date
  items: BOQLineItem[]
}

/**
 * Format BOQ items into a clean HTML email table for hardware stores.
 */
function formatBOQEmailHTML(req: StoreQuoteRequest, storeName: string): string {
  const rows = req.items.map((item, i) => `
    <tr style="background:${i % 2 === 0 ? '#f9fafb' : '#ffffff'}">
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;font-weight:600">${item.item}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb">${item.description}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center">${item.unit}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:center;font-weight:600">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#6b7280">$______</td>
    </tr>`).join('')

  const deadlineStr = req.deadline.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>BOQ Quote Request — Groundwork BHS</title></head>
<body style="font-family:Arial,sans-serif;max-width:700px;margin:0 auto;padding:20px;color:#1f2937">
  <div style="background:#060d1a;padding:24px;border-radius:4px;margin-bottom:24px">
    <h1 style="color:#00d4f5;margin:0;font-size:20px">GROUNDWORK BHS</h1>
    <p style="color:#b8c5e0;margin:8px 0 0;font-size:14px">The Bahamas Construction Platform</p>
  </div>

  <p>Dear <strong>${storeName}</strong>,</p>

  <p>Groundwork BHS is requesting a material price quote on behalf of one of our clients. The project is located on <strong>${req.clientIsland}</strong>.</p>

  <p>Please review the Bill of Quantities below and reply with your prices for each item. <strong>Deadline: ${deadlineStr}</strong>.</p>

  <h2 style="color:#060d1a;font-size:16px;border-bottom:2px solid #00d4f5;padding-bottom:8px">Bill of Quantities — Quote Request</h2>
  <p style="font-size:13px;color:#6b7280">Order Reference: ${req.orderId} | Request ID: ${req.requestId}</p>

  <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
    <thead>
      <tr style="background:#060d1a;color:#ffffff">
        <th style="padding:10px 12px;text-align:left">Item</th>
        <th style="padding:10px 12px;text-align:left">Description</th>
        <th style="padding:10px 12px;text-align:center">Unit</th>
        <th style="padding:10px 12px;text-align:center">Quantity</th>
        <th style="padding:10px 12px;text-align:right">Your Unit Price (BSD)</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div style="background:#f0f9ff;border:1px solid #00d4f5;border-radius:4px;padding:16px;margin:24px 0">
    <p style="margin:0;font-weight:bold;color:#0369a1">How to respond:</p>
    <ol style="margin:8px 0 0;padding-left:20px;color:#374151;font-size:14px">
      <li>Reply directly to this email</li>
      <li>Fill in your unit price for each item in the table above (copy and paste the table into your reply)</li>
      <li>Include your total quote amount at the bottom</li>
      <li>Add any notes about availability, lead times, or substitutions</li>
    </ol>
  </div>

  <p style="font-size:13px;color:#6b7280">Prices should be in Bahamian Dollars (BSD). Quotes are valid for 7 days. This quote is being requested from multiple suppliers — the client will make their selection based on price and availability.</p>

  <p>Thank you for your time.</p>
  <p><strong>Groundwork BHS</strong><br>
  <a href="https://www.groundworksbhs.com" style="color:#00d4f5">www.groundworksbhs.com</a></p>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
  <p style="font-size:11px;color:#9ca3af">This email was sent on behalf of a Groundwork BHS client. Reply-to this email to submit your quote. Reference: ${req.requestId}</p>
</body>
</html>`
}

/**
 * Send BOQ quote requests to all active hardware stores on the client's island.
 * TEST MODE: all emails go to TEST_RECIPIENT regardless of store email.
 */
export async function sendBOQQuoteRequests(
  req: StoreQuoteRequest,
  stores: Array<{ id: string; name: string; email: string; island: string }>
): Promise<{ storeId: string; storeName: string; sent: boolean; error?: string }[]> {
  const results = []

  for (const store of stores) {
    const recipient = TEST_MODE ? TEST_RECIPIENT : store.email
    const subjectPrefix = TEST_MODE ? `[TEST — would go to ${store.email}] ` : ''

    try {
      if (!resend) throw new Error('RESEND_API_KEY not configured')
      await resend.emails.send({
        from: 'Groundwork BHS <noreply@groundworksbhs.com>', // verified domain
        to: [recipient],
        replyTo: process.env.JARVIS_EMAIL || 'jarvis@formartiq.com',
        subject: `${subjectPrefix}BOQ Quote Request — Groundwork BHS [${req.orderId}]`,
        html: formatBOQEmailHTML(req, store.name),
      })
      results.push({ storeId: store.id, storeName: store.name, sent: true })
    } catch (err) {
      console.error(`Failed to send to ${store.name}:`, err)
      results.push({ storeId: store.id, storeName: store.name, sent: false, error: String(err) })
    }
  }

  return results
}

/**
 * Parse price data from a hardware store's email reply using Claude.
 * Returns structured price data for each BOQ item.
 */
export async function parseStoreQuoteReply(
  emailBody: string,
  originalItems: BOQLineItem[]
): Promise<{ item: string; unitPrice: number; total: number; notes?: string }[]> {
  const itemList = originalItems.map(i => `${i.item}: ${i.quantity} ${i.unit}`).join('\n')

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Parse the following hardware store quote reply email and extract prices for each item.

Original BOQ items requested:
${itemList}

Store reply email:
${emailBody}

Return a JSON array with this structure for each item found:
[{"item": "item name", "unitPrice": 0.00, "total": 0.00, "notes": "any notes"}]

If a price is not found for an item, use null for unitPrice and total.
Return ONLY valid JSON, no other text.`,
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
  try {
    return JSON.parse(text.trim())
  } catch {
    return []
  }
}

/**
 * Generate a price comparison table from multiple store responses.
 */
export function generateComparisonTable(
  items: BOQLineItem[],
  responses: Array<{
    storeName: string
    priceData: { item: string; unitPrice: number; total: number; notes?: string }[]
  }>
): { item: string; unit: string; qty: number; prices: Record<string, number | null>; cheapest: string | null }[] {
  return items.map(item => {
    const prices: Record<string, number | null> = {}
    let cheapestStore: string | null = null
    let cheapestPrice = Infinity

    for (const resp of responses) {
      const found = resp.priceData.find(p => p.item?.toLowerCase().includes(item.item.toLowerCase()))
      const price = found?.total ?? null
      prices[resp.storeName] = price
      if (price !== null && price < cheapestPrice) {
        cheapestPrice = price
        cheapestStore = resp.storeName
      }
    }

    return { item: item.item, unit: item.unit, qty: item.quantity, prices, cheapest: cheapestStore }
  })
}
