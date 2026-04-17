'use client'
import { useState } from 'react'
import { CheckCircle, Upload, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const CATEGORIES = [
  { value: 'hardware', label: 'Hardware / Building Supplies' },
  { value: 'hvac', label: 'HVAC & Air Conditioning' },
  { value: 'mep', label: 'MEP (Mechanical, Electrical, Plumbing)' },
  { value: 'solar', label: 'Solar & Energy' },
  { value: 'paint', label: 'Paint & Coatings' },
  { value: 'tile', label: 'Tile & Flooring' },
  { value: 'equipment', label: 'Equipment Rental' },
  { value: 'architect', label: 'Architect / Designer' },
  { value: 'qs', label: 'Quantity Surveyor' },
  { value: 'attorney', label: 'Attorney / Legal' },
  { value: 'mortgage', label: 'Mortgage & Finance' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'realtor', label: 'Realtor' },
  { value: 'contractor', label: 'General Contractor' },
]

const ISLANDS = ['Nassau / New Providence', 'Grand Bahama', 'Abaco', 'Eleuthera', 'Exuma', 'Andros', 'Long Island', 'Cat Island', 'Multiple Islands']

const TIERS = [
  { value: 'basic', label: 'Basic Listing', price: '$99/month', perks: ['Directory listing', 'Referral tracking link', 'Groundwork Partner badge'] },
  { value: 'featured', label: 'Featured Listing', price: '$149–$199/month', perks: ['Everything in Basic', 'Top placement in category', 'Logo display', 'Featured partner badge'] },
  { value: 'premium', label: 'Premium + Ad Placement', price: '$299–$399/month', perks: ['Everything in Featured', 'Ad banner on relevant pages', 'Impression & click analytics', 'Priority partner badge'] },
]

function inputStyle(): React.CSSProperties {
  return { background: 'var(--navy)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)', borderRadius: '2px', padding: '10px 12px', fontSize: '0.875rem', width: '100%' }
}
function labelStyle(): React.CSSProperties {
  return { display: 'block', color: 'var(--muted)', fontSize: '0.75rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }
}

export default function PartnersJoinPage() {
  const [form, setForm] = useState({ businessName: '', category: '', contactName: '', email: '', phone: '', website: '', island: '', description: '' })
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [referralCode, setReferralCode] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Submission failed')
      setReferralCode(data.referralCode)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--navy)' }}>
        <div className="max-w-md w-full text-center p-12 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid rgba(5,150,105,0.4)' }}>
          <CheckCircle size={64} style={{ color: '#059669', margin: '0 auto 24px' }} strokeWidth={1.5} />
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Application Received</h1>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Thank you for applying to the Groundwork BHS Partner Network. We will review your application and respond within 2–3 business days.</p>
          <div className="p-4 rounded-sm mb-6" style={{ background: 'var(--navy-card)', border: '1px solid var(--cyan-border)' }}>
            <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Your referral code</p>
            <p className="font-black text-xl" style={{ color: 'var(--cyan)' }}>{referralCode}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Share: groundworksbhs.com?ref={referralCode}</p>
          </div>
          <Link href="/partners" className="block py-3 rounded-sm font-bold text-sm" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
            View Partner Directory
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-24 px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="section-label mb-4">Partner Network</div>
        <h1 className="text-3xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Become a Groundwork Partner</h1>
        <p className="mb-10" style={{ color: 'var(--text-secondary)' }}>
          Reach thousands of Bahamians actively planning construction and property projects. Listed alongside trusted suppliers and professionals.
        </p>

        {/* Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {TIERS.map(tier => (
            <div key={tier.value} className="p-5 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
              <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{tier.label}</p>
              <p className="text-lg font-black mb-3" style={{ color: 'var(--cyan)' }}>{tier.price}</p>
              <ul className="space-y-1">
                {tier.perks.map(p => (
                  <li key={p} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                    <span style={{ color: '#059669', marginTop: 1 }}>✓</span>{p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label style={labelStyle()}>Business Name *</label>
              <input required value={form.businessName} onChange={e => setForm(p => ({ ...p, businessName: e.target.value }))} placeholder="e.g. Island Build Supplies Ltd." style={inputStyle()} />
            </div>
            <div>
              <label style={labelStyle()}>Category *</label>
              <select required value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} style={inputStyle()}>
                <option value="">Select category</option>
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle()}>Island *</label>
              <select required value={form.island} onChange={e => setForm(p => ({ ...p, island: e.target.value }))} style={inputStyle()}>
                <option value="">Select island</option>
                {ISLANDS.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle()}>Contact Name *</label>
              <input required value={form.contactName} onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))} placeholder="Your full name" style={inputStyle()} />
            </div>
            <div>
              <label style={labelStyle()}>Business Email *</label>
              <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="contact@yourbusiness.com" style={inputStyle()} />
            </div>
            <div>
              <label style={labelStyle()}>Phone</label>
              <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1 (242) 000-0000" style={inputStyle()} />
            </div>
            <div>
              <label style={labelStyle()}>Website</label>
              <input type="url" value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} placeholder="https://yourbusiness.com" style={inputStyle()} />
            </div>
            <div className="col-span-2">
              <label style={labelStyle()}>Business Description</label>
              <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe your business, products, and what makes you the right partner for Groundwork users..." style={{ ...inputStyle(), resize: 'none' }} />
            </div>
          </div>

          {error && <p className="text-sm" style={{ color: '#ef4444' }}>{error}</p>}

          <button type="submit" disabled={submitting} className="w-full py-4 rounded-sm font-bold text-sm flex items-center justify-center gap-2" style={{ background: 'var(--cyan)', color: 'var(--navy)', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Submitting...' : <><Upload size={16} /> Submit Partner Application <ArrowRight size={14} /></>}
          </button>

          <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
            Applications reviewed within 2–3 business days. You will receive a confirmation email immediately. Billing begins only after your listing is approved and activated.
          </p>
        </form>
      </div>
    </div>
  )
}
