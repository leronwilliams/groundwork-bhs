'use client'
import { useState } from 'react'

const SERVICES = [
  // Estimation
  { key: 'estimate_single', name: 'Single Trade Estimate', price: '$50', category: 'Estimation', desc: 'Upload your plans and get a detailed materials + labour cost breakdown for one trade (e.g., masonry, carpentry, plumbing, or electrical).' },
  { key: 'estimate_full', name: 'Full Project Estimate', price: '$150', category: 'Estimation', desc: 'Complete cost breakdown for your entire building project. Every trade, every phase, with Nassau market rates.' },
  { key: 'boq', name: 'Bill of Quantities', price: '$200', category: 'Estimation', desc: 'Full itemised material list formatted for contractor tendering. Download, share with contractors, get apples-to-apples quotes.' },
  { key: 'boq_hardware', name: 'BOQ + Hardware Pricing', price: '$250', category: 'Estimation', desc: 'Everything in BOQ, plus we add current Nassau hardware store prices for every material line item.' },
  { key: 'boq_quotes', name: 'BOQ + Hardware Store Quotes', price: '$299', category: 'Estimation', desc: 'We contact Nassau hardware stores on your behalf and get you real, dated quotes for every item in your BOQ.' },
  // Legal & Admin
  { key: 'permit_prep', name: 'Permit Document Preparation', price: '$75', category: 'Legal & Admin', desc: 'AI-prepared planning and building permit application package for the Department of Physical Planning or local authority.' },
  { key: 'contract', name: 'Contractor Agreement', price: '$35', category: 'Legal & Admin', desc: 'A legally sound contractor agreement tailored to Bahamian law and your project details.' },
  { key: 'tax_appeal', name: 'Property Tax Appeal Letter', price: '$25', category: 'Legal & Admin', desc: 'Professional, well-reasoned appeal letter based on your current assessment value and comparable properties.' },
  // Leads
  { key: 'lead', name: 'Contractor Lead', price: '$20', category: 'Contractor Leads', desc: 'Unlock full contact details — phone, email, and website — for any verified contractor in our directory. Builder subscribers get this free.' },
]

const CATEGORIES = ['Estimation', 'Legal & Admin', 'Contractor Leads']

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
    <div className="min-h-screen pt-28 pb-24 px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="section-label mb-4">Services</div>
          <h1 className="mb-4">Professional Services</h1>
          <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            On-demand documents, estimates, and expert preparation — without the consultant fees.
          </p>
        </div>

        {CATEGORIES.map(cat => {
          const items = SERVICES.filter(s => s.category === cat)
          return (
            <div key={cat} className="mb-14">
              <div className="section-label mb-6">{cat}</div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map(service => (
                  <div
                    key={service.key}
                    className="p-6 rounded-sm flex flex-col"
                    style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}
                  >
                    <div className="flex-1">
                      <p className="text-2xl font-black mb-1" style={{ color: 'var(--cyan)' }}>{service.price}</p>
                      <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{service.name}</h3>
                      <p className="text-sm leading-relaxed mb-6" style={{ color: 'var(--text-secondary)' }}>{service.desc}</p>
                    </div>
                    <button
                      onClick={() => handleCheckout(service.key)}
                      disabled={loading === service.key}
                      className="w-full py-2.5 rounded-sm font-bold text-sm transition-opacity"
                      style={{
                        background: 'var(--cyan)',
                        color: 'var(--navy)',
                        opacity: loading === service.key ? 0.7 : 1,
                      }}
                    >
                      {loading === service.key ? 'Redirecting...' : 'Order Now'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })}

        <div
          className="text-center p-8 rounded-sm mt-8"
          style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}
        >
          <p className="font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Need everything?</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
            Groundwork Builder includes unlimited contractor leads and priority service access.
          </p>
          <a
            href="/pricing"
            className="inline-block px-8 py-3 rounded-sm font-bold text-sm"
            style={{ background: 'var(--amber)', color: '#1a0f00' }}
          >
            See Pricing Plans
          </a>
        </div>
      </div>
    </div>
  )
}
