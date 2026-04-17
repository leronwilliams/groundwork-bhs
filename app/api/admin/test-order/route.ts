/**
 * POST /api/admin/test-order
 * Admin-only: creates a paid test order without Stripe, for testing delivery flows.
 * Returns orderId for immediate navigation to the delivery page.
 */
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

const SERVICE_AMOUNTS: Record<string, number> = {
  estimate_single: 5000,
  estimate_full:   15000,
  boq:             20000,
  boq_hardware:    25000,
  boq_quotes:      29900,
  permit_prep:     7500,
  contract:        3500,
  tax_appeal:      2500,
  lead:            2000,
}

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId || userId !== process.env.ADMIN_CLERK_ID) {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { serviceType, label } = await req.json()
  if (!serviceType || !SERVICE_AMOUNTS[serviceType]) {
    return NextResponse.json({ error: 'Invalid serviceType' }, { status: 400 })
  }

  // Find or create admin DB user
  let dbUser = await prisma.user.findFirst({ where: { clerkId: userId } })
  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: { clerkId: userId, email: 'leronkwilliams@gmail.com', name: 'Leron Williams (Admin)' },
    })
  }

  const order = await prisma.order.create({
    data: {
      userId: dbUser.id,
      type: serviceType,
      amount: SERVICE_AMOUNTS[serviceType],
      status: 'paid',
      stripePaymentId: 'admin_test',
      metadata: {
        isAdminTest: true,
        label: label || 'Admin test order',
        createdAt: new Date().toISOString(),
      },
    },
  })

  // Determine the correct delivery URL
  const isEstimate = ['estimate_single', 'estimate_full'].includes(serviceType)
  const isBoq = ['boq', 'boq_hardware', 'boq_quotes'].includes(serviceType)
  const isLead = serviceType === 'lead'

  let deliveryUrl = `/order/${serviceType}`
  if (isEstimate || isBoq) deliveryUrl = `/estimate/${order.id}`
  if (isLead) deliveryUrl = `/contractors`

  return NextResponse.json({ success: true, orderId: order.id, serviceType, deliveryUrl })
}
