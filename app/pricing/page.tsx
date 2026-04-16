'use client'
import { useState } from 'react'
import { CheckCircle } from 'lucide-react'
import { TIER_FEATURES } from '@/lib/access'

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    period: '/month',
    desc: 'Get started with Bahamian construction guidance',
    border: '1px solid rgba(255,255,255,0.12)',
    badge: null,
    cta: 'Get Started',
    ctaBg: 'transparent',
    ctaColor: 'var(--text-primary)',
    ctaBorder: '1px solid rgba(255,255,255,0.2)',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$19',
    period: '/month',
    desc: 'For serious homeowners and first-time builders',
    border: '1px solid var(--cyan)',
    badge: 'Most Popular',
    badgeColor: 'var(--cyan)',
    cta: 'Start Pro',
    ctaBg: 'var(--cyan)',
    ctaColor: 'var(--navy)',
    ctaBorder: 'none',
  },
  {
    key: 'builder',
    name: 'Builder',
    price: '$49',
    period: '/month',
    desc: 'For developers, contractors, and property investors',
    border: '1px solid var(--amber)',
    badge: 'Best Value',
    badgeColor: 'var(--amber)',
    cta: 'Start Builder',
    ctaBg: 'var(--amber)',
    ctaColor: '#1a0f00',
    ctaBorder: 'none',
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleCheckout(priceKey: string) {
    if (priceKey === 'free') {
      window.location.href = '/sign-up'
      return
    }
    setLoading(priceKey)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceKey }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
    } catch {
      alert('Could not start checkout. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen pt-28 pb-24 px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="section-label mb-4">Pricing</div>
          <h1 className="mb-4">Simple, Transparent Pricing</h1>
          <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Everything you need to build, buy, or invest in Bahamian real estate — at a fraction of what a consultant charges.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {PLANS.map(plan => (
            <div
              key={plan.key}
              className="relative p-8 rounded-sm flex flex-col"
              style={{ background: 'var(--navy-surface)', border: plan.border }}
            >
              {plan.badge && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-bold px-4 py-1 rounded-full"
                  style={{ background: plan.badgeColor, color: plan.key === 'builder' ? '#1a0f00' : 'var(--navy)' }}
                >
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{plan.name}</h2>
                <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>{plan.desc}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black" style={{ color: 'var(--text-primary)' }}>{plan.price}</span>
                  <span className="text-sm" style={{ color: 'var(--muted)' }}>{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {TIER_FEATURES[plan.key as keyof typeof TIER_FEATURES].map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                    <CheckCircle size={15} strokeWidth={2} style={{ color: 'var(--cyan)', marginTop: 2, flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout(plan.key)}
                disabled={loading === plan.key}
                className="w-full py-3 rounded-sm font-bold text-sm transition-opacity"
                style={{
                  background: plan.ctaBg,
                  color: plan.ctaColor,
                  border: plan.ctaBorder,
                  opacity: loading === plan.key ? 0.7 : 1,
                }}
              >
                {loading === plan.key ? 'Redirecting...' : plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="text-center text-sm" style={{ color: 'var(--muted)' }}>
          All prices in USD. Cancel anytime. No contracts.
          Payments processed securely by Stripe.
        </div>
      </div>
    </div>
  )
}
