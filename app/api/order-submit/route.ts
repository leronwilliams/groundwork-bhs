import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    const { type, fileUrl, brief } = await req.json()

    if (!type) return NextResponse.json({ error: 'Missing type' }, { status: 400 })

    // Find user if authenticated
    let dbUser = null
    if (userId) {
      dbUser = await prisma.user.findFirst({ where: { clerkId: userId } })
    }

    // Create a pending order record (or update if already exists from webhook)
    if (dbUser) {
      const existing = await prisma.order.findFirst({
        where: { userId: dbUser.id, type, status: 'paid' },
        orderBy: { createdAt: 'desc' },
      })

      if (existing) {
        // Attach the brief and file to the existing paid order
        await prisma.order.update({
          where: { id: existing.id },
          data: {
            metadata: { ...((existing.metadata as object) || {}), fileUrl, brief, submittedAt: new Date().toISOString() },
            status: 'processing',
          },
        })
        return NextResponse.json({ success: true, orderId: existing.id, status: 'processing' })
      }
    }

    // Fallback: create new order entry (user may have checked out as guest)
    const order = await prisma.order.create({
      data: {
        userId: dbUser?.id || 'guest',
        type,
        amount: 0, // Already paid via Stripe — amount tracked in Stripe
        status: 'processing',
        metadata: { fileUrl, brief, submittedAt: new Date().toISOString() },
      },
    })

    return NextResponse.json({ success: true, orderId: order.id, status: 'processing' })
  } catch (error) {
    console.error('Order submit error:', error)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}
