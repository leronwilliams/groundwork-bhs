import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { stripe, PRICE_IDS, PriceKey } from '@/lib/stripe'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    const { priceKey, metadata } = await req.json()

    if (!priceKey || !PRICE_IDS[priceKey as PriceKey]) {
      return NextResponse.json({ error: 'Invalid price key' }, { status: 400 })
    }

    const priceId = PRICE_IDS[priceKey as PriceKey]
    const isSubscription = priceKey === 'pro' || priceKey === 'builder'

    // Get or create Stripe customer
    let stripeCustomerId: string | undefined
    if (userId) {
      const user = await prisma.user.findFirst({ where: { clerkId: userId }, include: { subscription: true } })
      stripeCustomerId = user?.subscription?.stripeCustomerId || undefined

      if (!stripeCustomerId && user?.email) {
        const customer = await stripe.customers.create({ email: user.email, metadata: { clerkId: userId } })
        stripeCustomerId = customer.id
      }
    }

    const origin = req.headers.get('origin') || 'https://www.groundworksbhs.com'

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: isSubscription ? 'subscription' : 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}&type=${priceKey}`,
      cancel_url: `${origin}/${isSubscription ? 'pricing' : 'services'}`,
      metadata: {
        clerkUserId: userId || '',
        priceKey,
        ...metadata,
      },
      ...(isSubscription ? {
        subscription_data: {
          metadata: { clerkUserId: userId || '', tier: priceKey },
        },
      } : {}),
    })

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (error) {
    console.error('Checkout error:', error)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }
}
