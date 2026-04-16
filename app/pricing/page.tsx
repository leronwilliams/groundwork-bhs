'use client'
import { useState } from 'react'
import { CheckCircle, Zap, Building2, Wrench } from 'lucide-react'
import { TIER_FEATURES } from '@/lib/access'
import Link from 'next/link'

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    period: '/month',
    desc: 'Get started with Bahamian construction guidance',
    icon: Building2,
    borderColor: 'rgba(255,255,255,0.12)',
    accentColor: '#94a3b8',
    badge: null,
    cta: 'Create Free Account',
    ctaStyle: { background: 'transparent', color: 'var(--text-primary)', border: '1px solid rgba(255,255,255,0.2)' },
    href: '/sign-up',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$19',
    period: '/month',
    desc: 'For serious homeowners and first-time builders',
    icon: Zap,
    borderColor: 'var(--cyan)',
    accentColor: 'var(--cyan)',
    badge: 'Most Popular',
    cta: 'Start Pro',
    ctaStyle: { background: 'var(--cyan)', color: 'var(--navy)', border: 'none' },
  },
  {
    key: 'builder',
    name: 'Builder',
    price: '$49',
    period: '/month',
    desc: 'For developers, contractors, and investors',
    icon: Wrench,
    borderColor: 'var(--amber)',
    accentColor: 'var(--amber)',
    badge: 'Best Value',
    cta: 'Start Builder',
    ctaStyle: { background: 'var(--amber)', color: '#1a0f00', border: 'none' },
  },
]

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleCheckout(priceKey: string, href?: string) {
    if (href) { window.location.href = href; return }
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
    <div className="min-h-screen pt-28 pb-24" style={{ background: 'var(--navy)' }}>
      {/* Header */}
      <div className="text-center px-6 mb-20">
        <div className="section-label mb-4">Pricing</div>
        <h1 className="mb-6" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, letterSpacing: '-0.03em' }}>
          Simple, Transparent Pricing
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: 520, margin: '0 auto' }}>
          Everything you need to build in The Bahamas — at a fraction of what a consultant charges.
        </p>
      </div>

      {/* Plan cards */}
      <div className="px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {PLANS.map(plan => {
            const Icon = plan.icon
            return (
              <div
                key={plan.key}
                className="relative flex flex-col rounded-sm overflow-hidden"
                style={{ background: 'var(--navy-surface)', border: `1px solid ${plan.borderColor}` }}
              >
                {plan.badge && (
                  <div
                    className="absolute top-0 inset-x-0 text-center text-xs font-bold py-1.5 tracking-widest uppercase"
                    style={{ background: plan.accentColor, color: plan.key === 'builder' ? '#1a0f00' : 'var(--navy)' }}
                  >
                    {plan.badge}
                  </div>
                )}

                <div className={`p-8 flex flex-col flex-1 ${plan.badge ? 'pt-12' : ''}`}>
                  {/* Icon + name */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 rounded-sm" style={{ background: `${plan.accentColor}18`, border: `1px solid ${plan.accentColor}30` }}>
                      <Icon size={20} style={{ color: plan.accentColor }} strokeWidth={1.5} />
                    </div>
                    <span className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{plan.name}</span>
                  </div>

                  {/* Price */}
                  <div className="mb-2 flex items-baseline gap-1">
                    <span style={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.04em', color: plan.accentColor, lineHeight: 1 }}>
                      {plan.price}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--muted)' }}>{plan.period}</span>
                  </div>
                  <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>{plan.desc}</p>

                  {/* Features */}
                  <ul className="space-y-3 mb-8 flex-1">
                    {TIER_FEATURES[plan.key as keyof typeof TIER_FEATURES].map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <CheckCircle size={14} strokeWidth={2.5} style={{ color: plan.accentColor, marginTop: 3, flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleCheckout(plan.key, plan.href)}
                    disabled={loading === plan.key}
                    className="w-full py-3.5 rounded-sm font-bold text-sm tracking-wide transition-opacity"
                    style={{ ...plan.ctaStyle, opacity: loading === plan.key ? 0.7 : 1 }}
                  >
                    {loading === plan.key ? 'Redirecting...' : plan.cta}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* FAQ strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16" style={{ color: 'var(--text-secondary)' }}>
          {[
            { q: 'Can I cancel anytime?', a: 'Yes. Cancel from your dashboard at any time. Access continues until end of billing period. No contracts.' },
            { q: 'What currency are prices in?', a: 'All prices are in US dollars (USD). Bahamian dollar is pegged 1:1, so the price is the same in BSD.' },
            { q: 'Is my payment secure?', a: 'Payments are processed by Stripe. We never store your card details. Stripe is PCI DSS Level 1 certified.' },
          ].map(faq => (
            <div key={faq.q} className="p-6 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
              <p className="font-bold mb-2" style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{faq.q}</p>
              <p className="text-sm leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        {/* One-time services callout */}
        <div
          className="text-center p-10 rounded-sm"
          style={{ background: 'linear-gradient(135deg, var(--navy-surface) 0%, rgba(0,212,245,0.05) 100%)', border: '1px solid var(--cyan-border)' }}
        >
          <p className="section-label mb-3">No subscription needed</p>
          <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Need a one-time document or estimate?</h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Order individual services — BOQs, estimates, permits, contracts — without a monthly plan.
          </p>
          <Link
            href="/services"
            className="inline-block px-8 py-3 rounded-sm font-bold text-sm"
            style={{ border: '1px solid var(--cyan)', color: 'var(--cyan)' }}
          >
            View All Services
          </Link>
        </div>
      </div>
    </div>
  )
}
