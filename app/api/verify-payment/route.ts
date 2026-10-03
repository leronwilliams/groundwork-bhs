/**
 * GET /api/verify-payment?session_id=cs_...&orderId=...&scope=estimate|boq|any|<type>
 * Lets delivery pages check, server-side, whether the visitor has a paid purchase.
 */
import { NextRequest, NextResponse } from 'next/server'
import { verifyPaidAccess, ESTIMATE_TYPES, BOQ_TYPES, MAX_AI_RUNS } from '@/lib/payment'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const ALL_TYPES = [...ESTIMATE_TYPES, ...BOQ_TYPES, 'permit_prep', 'contract', 'tax_appeal']

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, 'verify-payment', 30)
  if (limited) return limited

  const sp = req.nextUrl.searchParams
  const scope = sp.get('scope') || 'any'
  const allowedTypes = scope === 'estimate' ? ESTIMATE_TYPES
    : scope === 'boq' ? BOQ_TYPES
    : scope === 'any' ? ALL_TYPES
    : ALL_TYPES.includes(scope) ? [scope] : []

  let clerkUserId: string | null = null
  try { const { auth } = await import('@clerk/nextjs/server'); clerkUserId = (await auth()).userId } catch {}

  const orderId = sp.get('orderId')
  const access = await verifyPaidAccess({
    sessionId: sp.get('session_id'),
    orderId: orderId && orderId !== 'new' ? orderId : null,
    clerkUserId,
    allowedTypes,
    enforceRunLimit: false,
  })
  if (!access.ok) return NextResponse.json({ paid: false, error: access.error, code: access.code }, { status: access.status })
  return NextResponse.json({ paid: true, type: access.type, runsUsed: access.runs, runsAllowed: MAX_AI_RUNS })
}
