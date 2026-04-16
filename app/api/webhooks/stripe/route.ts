import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import type Stripe from 'stripe'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event: Stripe.Event

  try {
    if (!sig || !webhookSecret) {
      console.warn('Webhook: missing signature or secret — processing without verification')
      event = JSON.parse(body) as Stripe.Event
    } else {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    }
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const clerkUserId = session.metadata?.clerkUserId
        const priceKey = session.metadata?.priceKey

        if (!clerkUserId) break

        // Find or create user
        let user = await prisma.user.findFirst({ where: { clerkId: clerkUserId } })
        if (!user) {
          user = await prisma.user.create({ data: { clerkId: clerkUserId, email: session.customer_details?.email || undefined } })
        }

        const isSubscription = priceKey === 'pro' || priceKey === 'builder'

        if (isSubscription && session.subscription) {
          // Activate subscription
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          await prisma.subscription.upsert({
            where: { userId: user.id },
            update: {
              tier: priceKey as string,
              stripeCustomerId: session.customer as string,
              stripeSubId: session.subscription as string,
              stripePriceId: sub.items.data[0]?.price.id,
              status: 'active',
              currentPeriodEnd: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
            },
            create: {
              userId: user.id,
              tier: priceKey as string,
              stripeCustomerId: session.customer as string,
              stripeSubId: session.subscription as string,
              stripePriceId: sub.items.data[0]?.price.id,
              status: 'active',
              currentPeriodEnd: new Date((sub as unknown as { current_period_end: number }).current_period_end * 1000),
            },
          })
        } else {
          // Record one-time order as paid
          await prisma.order.create({
            data: {
              userId: user.id,
              type: priceKey || 'unknown',
              amount: session.amount_total || 0,
              status: 'paid',
              stripePaymentId: session.payment_intent as string,
              metadata: session.metadata || {},
            },
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await prisma.subscription.updateMany({
          where: { stripeSubId: sub.id },
          data: { tier: 'free', status: 'cancelled', stripeSubId: null },
        })
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subId = (invoice as unknown as { subscription?: string }).subscription
        if (subId) {
          await prisma.subscription.updateMany({
            where: { stripeSubId: subId },
            data: { status: 'past_due' },
          })
        }
        break
      }

      default:
        // Unhandled event — safe to ignore
        break
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    // Return 200 so Stripe doesn't retry
  }

  return NextResponse.json({ received: true })
}
