'use client'
import { useState } from 'react'
import { FileText, Calculator, Hammer, Scale, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES = [
  {
    id: 'estimation',
    label: 'Estimation Services',
    icon: Calculator,
    accent: 'var(--cyan)',
    desc: 'Professional cost estimates and material lists at Bahamian market rates.',
    services: [
      { key: 'estimate_single', name: 'Single Trade Estimate', price: '$50', tagline: 'Materials + labour for one trade', detail: 'Masonry, electrical, plumbing, carpentry — pick one. Upload your plans and get a detailed cost breakdown.' },
      { key: 'estimate_full', name: 'Full Project Estimate', price: '$150', tagline: 'Complete project cost breakdown', detail: 'Every trade, every phase. Covers foundation through finishing with Nassau market labour and material rates.' },
      { key: 'boq', name: 'Bill of Quantities', price: '$200', tagline: 'Itemised material list for tendering', detail: 'Full BOQ formatted for contractor tendering. Share with multiple contractors for apples-to-apples quotes.' },
      { key: 'boq_hardware', name: 'BOQ + Hardware Pricing', price: '$250', tagline: 'BOQ with current Nassau hardware prices', detail: 'Everything in the BOQ, plus we source current retail prices from Nassau hardware stores for every line item.' },
      { key: 'boq_quotes', name: 'BOQ + Hardware Store Quotes', price: '$299', tagline: 'Real quotes from Nassau stores', detail: 'We contact Nassau hardware stores on your behalf and return dated, real quotes for every material in your BOQ.' },
    ],
  },
  {
    id: 'legal',
    label: 'Legal & Admin Services',
    icon: Scale,
    accent: 'var(--amber)',
    desc: 'Professional documents prepared fast — without lawyer fees.',
    services: [
      { key: 'permit_prep', name: 'Permit Document Preparation', price: '$75', tagline: 'Planning & building permit package', detail: 'AI-prepared application package for the Department of Physical Planning or local authority. Includes required forms, site plan notes, and supporting docs.' },
      { key: 'contract', name: 'Contractor Agreement', price: '$35', tagline: 'Legally sound project contract', detail: 'A tailored contractor agreement based on Bahamian law and your specific project — scope, payment schedule, disputes, and termination clauses included.' },
      { key: 'tax_appeal', name: 'Property Tax Appeal Letter', price: '$25', tagline: 'Professional appeal based on your assessment', detail: 'Well-reasoned, professionally written appeal letter citing comparable properties and assessment methodology. Ready to submit to the Department of Inland Revenue.' },
    ],
  },
  {
    id: 'leads',
    label: 'Contractor Leads',
    icon: Hammer,
    accent: '#a78bfa',
    desc: 'Connect directly with verified contractors across Nassau and the Family Islands.',
    services: [
      { key: 'lead', name: 'Contractor Lead', price: '$20', tagline: 'Full contact details for any contractor', detail: 'Unlock phone, email, and website for any verified contractor in our directory. Builder subscribers get this free.' },
    ],
  },
]

export default function ServicesPage() {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleCheckout(priceKey: string) {
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
        <div className="section-label mb-4">Services</div>
        <h1 className="mb-6" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, letterSpacing: '-0.03em' }}>
          Professional Services
        </h1>
        <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto' }}>
          On-demand documents, estimates, and expert preparation — without the consultant fees.
        </p>
      </div>

      <div className="px-6 max-w-6xl mx-auto space-y-20">
        {CATEGORIES.map(cat => {
          const Icon = cat.icon
          return (
            <div key={cat.id}>
              {/* Category header */}
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-sm" style={{ background: `${cat.accent}15`, border: `1px solid ${cat.accent}30` }}>
                  <Icon size={18} style={{ color: cat.accent }} strokeWidth={1.5} />
                </div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{cat.label}</h2>
              </div>
              <p className="mb-8 text-sm" style={{ color: 'var(--muted)', paddingLeft: '2.75rem' }}>{cat.desc}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {cat.services.map(service => (
                  <div
                    key={service.key}
                    className="group relative flex flex-col rounded-sm overflow-hidden transition-all duration-300"
                    style={{
                      background: 'var(--navy-surface)',
                      border: '1px solid var(--cyan-border)',
                    }}
                  >
                    {/* Accent top bar */}
                    <div className="h-0.5 w-full" style={{ background: cat.accent, opacity: 0.6 }} />

                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-3xl font-black" style={{ color: cat.accent, letterSpacing: '-0.02em' }}>
                          {service.price}
                        </span>
                        <FileText size={16} style={{ color: 'var(--muted)', marginTop: 6 }} strokeWidth={1.5} />
                      </div>

                      <h3 className="font-bold mb-1" style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>
                        {service.name}
                      </h3>
                      <p className="text-xs mb-3 font-semibold uppercase tracking-wider" style={{ color: cat.accent }}>
                        {service.tagline}
                      </p>
                      <p className="text-sm leading-relaxed mb-6 flex-1" style={{ color: 'var(--text-secondary)' }}>
                        {service.detail}
                      </p>

                      <button
                        onClick={() => handleCheckout(service.key)}
                        disabled={loading === service.key}
                        className="w-full py-3 rounded-sm font-bold text-sm flex items-center justify-center gap-2 transition-all"
                        style={{
                          background: loading === service.key ? 'var(--navy-card)' : cat.accent,
                          color: cat.id === 'legal' ? '#1a0f00' : 'var(--navy)',
                          opacity: loading === service.key ? 0.7 : 1,
                        }}
                      >
                        {loading === service.key ? 'Redirecting...' : (
                          <>Order Now <ArrowRight size={14} /></>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        {/* Builder upsell */}
        <div
          className="p-10 rounded-sm text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(245,166,35,0.06) 0%, var(--navy-surface) 100%)',
            border: '1px solid var(--amber)',
          }}
        >
          <div className="section-label mb-3" style={{ color: 'var(--amber)' }}>Builder Plan</div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            Need multiple services? Get Builder.
          </h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            $49/month includes unlimited advisor sessions, free contractor leads, BOQ download access, and priority service delivery.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-sm font-bold text-sm"
            style={{ background: 'var(--amber)', color: '#1a0f00' }}
          >
            Compare Plans <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
