import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { verifyPaidAccess, guestCheckoutUserId } from '@/lib/payment'

const SUBMITTABLE = ['estimate_single', 'estimate_full', 'boq', 'boq_hardware', 'boq_quotes', 'permit_prep', 'contract', 'tax_appeal']

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 'order-submit', 10)
  if (limited) return limited
  try {
    const { userId } = await auth()
    const body = await req.json().catch(() => null)
    const { type, fileUrl, brief, sessionId, orderId } = body || {}

    if (!type || !SUBMITTABLE.includes(type)) return NextResponse.json({ error: 'Missing or invalid service type' }, { status: 400 })

    let dbUser = null
    if (userId) dbUser = await prisma.user.findFirst({ where: { clerkId: userId } })

    // Signed-in buyers: the webhook already recorded a paid order for this type.
    let existing = dbUser
      ? await prisma.order.findFirst({ where: { userId: dbUser.id, type, status: 'paid', stripePaymentId: { not: null } }, orderBy: { createdAt: 'desc' } })
      : null

    let access = null
    if (!existing) {
      const v = await verifyPaidAccess({ sessionId: sessionId || null, orderId: orderId || null, clerkUserId: userId, allowedTypes: [type], enforceRunLimit: false })
      if (!v.ok) return NextResponse.json({ error: v.error, code: v.code }, { status: v.status })
      access = v
      if (v.orderId) existing = await prisma.order.findUnique({ where: { id: v.orderId } })
    }

    const submission = { fileUrl: fileUrl || null, brief: brief || null, submittedAt: new Date().toISOString() }

    if (existing) {
      await prisma.order.update({
        where: { id: existing.id },
        data: { metadata: { ...((existing.metadata as object) || {}), ...submission }, status: existing.status === 'delivered' ? 'delivered' : 'processing' },
      })
      return NextResponse.json({ success: true, orderId: existing.id, status: 'processing' })
    }

    // Verified Stripe session with no Order row yet (guest checkout): record it now.
    const order = await prisma.order.create({
      data: {
        userId: dbUser?.id || await guestCheckoutUserId(),
        type,
        amount: access?.amount || 0,
        status: 'processing',
        stripePaymentId: access?.paymentIntentId || null,
        metadata: { ...submission, stripeSessionId: access?.sessionId || null, customerEmail: access?.customerEmail || null },
      },
    })
    return NextResponse.json({ success: true, orderId: order.id, status: 'processing' })
  } catch (error) {
    console.error('Order submit error:', error)
    return NextResponse.json({ error: 'Submission failed. Please try again or contact support.' }, { status: 500 })
  }
}
