/**
 * Server-side payment verification for paid AI services.
 *
 * A request is allowed only if it is tied to either:
 *  - a paid Order row (created by the Stripe webhook or the admin test-order
 *    route; status paid/processing/delivered with a Stripe payment id), owned
 *    by the signed-in user (or the admin), or
 *  - a Stripe Checkout Session (the session_id Stripe appends to our
 *    success_url) whose payment_status is "paid" and whose line item price
 *    matches the service being requested.
 *
 * Each purchase allows MAX_AI_RUNS successful generations (retries on failure
 * are free). Usage is tracked on the Order metadata, or on the Stripe
 * PaymentIntent metadata for guest purchases that have no Order row.
 */
import type Stripe from 'stripe'
import { prisma } from '@/lib/db'
import { stripe, PRICE_IDS, type PriceKey } from '@/lib/stripe'

export const ESTIMATE_TYPES = ['estimate_single', 'estimate_full']
export const BOQ_TYPES = ['boq', 'boq_hardware', 'boq_quotes']
export const MAX_AI_RUNS = 3
const PAID_STATUSES = ['paid', 'processing', 'delivered']

export type PaidAccess = {
  ok: true
  type: string
  orderId: string | null
  orderUserId: string | null
  paymentIntentId: string | null
  sessionId: string | null
  customerEmail: string | null
  amount: number
  runs: number
}
export type DeniedAccess = { ok: false; status: number; error: string; code: string }

function deny(status: number, error: string, code = 'PAYMENT_REQUIRED'): DeniedAccess {
  return { ok: false, status, error, code }
}

const UNPAID_MESSAGE =
  'Payment required. This service is available after a completed purchase. ' +
  'Please buy it from the Services page; you will be returned here automatically after checkout.'

function runsFrom(meta: unknown): number {
  const n = Number((meta as Record<string, unknown> | null)?.aiRuns ?? 0)
  return Number.isFinite(n) ? n : 0
}

export async function verifyPaidAccess(opts: {
  sessionId?: string | null
  orderId?: string | null
  clerkUserId?: string | null
  allowedTypes: string[]
  /** When true, an exhausted run allowance is treated as an error. Default true. */
  enforceRunLimit?: boolean
}): Promise<PaidAccess | DeniedAccess> {
  const { sessionId, orderId, clerkUserId, allowedTypes } = opts
  const enforceRunLimit = opts.enforceRunLimit !== false

  // ── Order path ──────────────────────────────────────────────────────────
  if (orderId && typeof orderId === 'string') {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { user: true } })
    if (!order || !order.stripePaymentId || !PAID_STATUSES.includes(order.status)) {
      return deny(402, UNPAID_MESSAGE)
    }
    if (!allowedTypes.includes(order.type)) {
      return deny(402, 'This order is for a different service than the one requested.', 'WRONG_SERVICE')
    }
    const ownerClerk = order.user?.clerkId
    const isGuestOrder = !ownerClerk || ownerClerk === 'guest_checkout'
    const isAdmin = !!clerkUserId && clerkUserId === process.env.ADMIN_CLERK_ID
    if (!isGuestOrder && !isAdmin && clerkUserId !== ownerClerk) {
      return deny(403, 'Please sign in with the account that placed this order.', 'NOT_ORDER_OWNER')
    }
    if (isGuestOrder && !isAdmin) {
      // Guest orders must be accessed with their checkout session, not the bare order id.
      const sid = (order.metadata as Record<string, unknown> | null)?.stripeSessionId
      if (!sessionId || sessionId !== sid) return deny(402, UNPAID_MESSAGE)
    }
    const runs = runsFrom(order.metadata)
    if (enforceRunLimit && runs >= MAX_AI_RUNS) {
      return deny(402, `This purchase has already been generated ${runs} times. Please contact support if you need another run.`, 'RUN_LIMIT')
    }
    return {
      ok: true, type: order.type, orderId: order.id, orderUserId: order.userId,
      paymentIntentId: order.stripePaymentId, sessionId: sessionId || null,
      customerEmail: order.user?.email || null, amount: order.amount, runs,
    }
  }

  // ── Checkout Session path ──────────────────────────────────────────────
  if (sessionId && typeof sessionId === 'string') {
    if (!/^cs_(live|test)_[A-Za-z0-9]+$/.test(sessionId)) return deny(402, UNPAID_MESSAGE)
    let session: Stripe.Checkout.Session
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['line_items'] })
    } catch {
      return deny(402, UNPAID_MESSAGE)
    }
    if (session.mode !== 'payment' || session.payment_status !== 'paid') {
      return deny(402, 'Payment for this checkout has not been completed.', 'PAYMENT_INCOMPLETE')
    }
    const type = session.metadata?.priceKey || ''
    const paidPriceIds = (session.line_items?.data || []).map(li => li.price?.id).filter(Boolean)
    const expectedPrice = PRICE_IDS[type as PriceKey]
    if (!expectedPrice || !paidPriceIds.includes(expectedPrice)) {
      return deny(402, UNPAID_MESSAGE)
    }
    if (!allowedTypes.includes(type)) {
      return deny(402, 'This purchase is for a different service than the one requested.', 'WRONG_SERVICE')
    }
    const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id || null

    // Prefer an existing Order row (the webhook creates one for signed-in buyers).
    const order = paymentIntentId
      ? await prisma.order.findFirst({ where: { stripePaymentId: paymentIntentId }, orderBy: { createdAt: 'desc' } })
      : null

    let runs = 0
    if (order) runs = runsFrom(order.metadata)
    else if (paymentIntentId) {
      try {
        const pi = await stripe.paymentIntents.retrieve(paymentIntentId)
        runs = Number(pi.metadata?.gw_ai_runs || 0) || 0
      } catch {}
    }
    if (enforceRunLimit && runs >= MAX_AI_RUNS) {
      return deny(402, `This purchase has already been generated ${runs} times. Please contact support if you need another run.`, 'RUN_LIMIT')
    }
    return {
      ok: true, type, orderId: order?.id || null, orderUserId: order?.userId || null,
      paymentIntentId, sessionId, customerEmail: session.customer_details?.email || null,
      amount: session.amount_total || 0, runs,
    }
  }

  return deny(402, UNPAID_MESSAGE)
}

/** Record one successful AI generation against the purchase. Never throws. */
export async function recordAiRun(access: PaidAccess): Promise<void> {
  try {
    if (access.orderId) {
      const order = await prisma.order.findUnique({ where: { id: access.orderId } })
      const meta = (order?.metadata as Record<string, unknown> | null) || {}
      await prisma.order.update({
        where: { id: access.orderId },
        data: { metadata: { ...meta, aiRuns: runsFrom(meta) + 1, lastAiRunAt: new Date().toISOString() } },
      })
    } else if (access.paymentIntentId && access.paymentIntentId.startsWith('pi_')) {
      await stripe.paymentIntents.update(access.paymentIntentId, {
        metadata: { gw_ai_runs: String(access.runs + 1) },
      })
    }
  } catch (err) {
    console.error('recordAiRun failed', err)
  }
}

/** Placeholder owner for orders paid via guest checkout (Order.userId is a required relation). */
export async function guestCheckoutUserId(): Promise<string> {
  const u = await prisma.user.upsert({
    where: { clerkId: 'guest_checkout' },
    update: {},
    create: { clerkId: 'guest_checkout', name: 'Guest checkout (placeholder)' },
  })
  return u.id
}
