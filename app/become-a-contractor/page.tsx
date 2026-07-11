'use client'
import { useState, useEffect } from 'react'
import { useAuth, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { CheckCircle, Loader2, Hammer, AlertCircle } from 'lucide-react'

const ISLANDS = ['New Providence (Nassau)', 'Grand Bahama (Freeport)', 'Abaco', 'Eleuthera', 'Exuma', 'Andros', 'Cat Island', 'Long Island', 'Bimini', 'Berry Islands', 'Other']
const TRADES = ['General Contractor', 'Foundation', 'Masonry', 'Structure / Concrete Block', 'Roofing', 'Electrical', 'Plumbing', 'Tiling', 'Painting', 'Joinery / Carpentry', 'Landscaping', 'HVAC']

const fieldStyle = { background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }

export default function BecomeAContractorPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const { user } = useUser()
  const [form, setForm] = useState({
    businessName: '', contactName: '', email: '', phone: '', whatsapp: '',
    island: '', trade: '', description: '', website: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill from Clerk once loaded.
  useEffect(() => {
    if (user) {
      setForm(p => ({
        ...p,
        email: p.email || user.primaryEmailAddress?.emailAddress || '',
        contactName: p.contactName || user.fullName || '',
      }))
    }
  }, [user])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/contractors/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) { setDone(true); return }
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'Something went wrong. Please try again.')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Success
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--navy)' }}>
        <div className="max-w-md w-full text-center p-12 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid rgba(5,150,105,0.4)' }}>
          <CheckCircle size={64} style={{ color: '#059669', margin: '0 auto 24px' }} strokeWidth={1.5} />
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Application Submitted</h1>
          <p className="mb-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Thanks! Your listing is pending review. Once our team verifies your details, your business will appear in the directory and you&apos;ll start receiving matched project leads on your island.
          </p>
          <Link href="/dashboard" className="block py-3 rounded-sm font-bold text-sm mb-3" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
            Go to Dashboard
          </Link>
          <Link href="/contractors" className="block py-3 rounded-sm font-bold text-sm" style={{ border: '1px solid var(--cyan-border)', color: 'var(--text-secondary)' }}>
            View the Directory
          </Link>
        </div>
      </div>
    )
  }

  // Sign-in gate
  if (isLoaded && !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--navy)' }}>
        <div className="max-w-md w-full text-center p-12 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
          <div className="section-label mb-4">Become a Contractor</div>
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Sign in to list your business</h1>
          <p className="mb-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Create a free account to list your business and start receiving matched project leads across the Bahamas.
          </p>
          <a href="/sign-in" className="block py-3 rounded-sm font-bold text-sm mb-3" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>Sign In</a>
          <a href="/sign-up" className="block py-3 rounded-sm font-bold text-sm" style={{ border: '1px solid var(--cyan-border)', color: 'var(--text-secondary)' }}>Create Free Account</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-28 pb-24 px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-2xl mx-auto">
        <div className="section-label mb-4">Become a Contractor</div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>List your business on Groundwork</h1>
        <p className="mb-10" style={{ color: 'var(--text-secondary)' }}>
          Get matched to homeowners and developers across the Bahamas. Listings are reviewed before they go live — you&apos;ll receive project leads on your island once approved.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Business Name</label>
              <input required value={form.businessName} onChange={e => setForm(p => ({ ...p, businessName: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={fieldStyle} placeholder="e.g. Island Masonry Ltd" />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Contact Name</label>
              <input required value={form.contactName} onChange={e => setForm(p => ({ ...p, contactName: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={fieldStyle} placeholder="Your name" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Email</label>
              <input required type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={fieldStyle} placeholder="you@business.com" />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Phone</label>
              <input required value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={fieldStyle} placeholder="(242) 555-0100" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>WhatsApp <span style={{ color: 'var(--muted)' }}>(optional)</span></label>
              <input value={form.whatsapp} onChange={e => setForm(p => ({ ...p, whatsapp: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={fieldStyle} placeholder="(242) 555-0100" />
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Website <span style={{ color: 'var(--muted)' }}>(optional)</span></label>
              <input value={form.website} onChange={e => setForm(p => ({ ...p, website: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={fieldStyle} placeholder="https://…" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Island Served</label>
              <select required value={form.island} onChange={e => setForm(p => ({ ...p, island: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={fieldStyle}>
                <option value="">Select island</option>
                {ISLANDS.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Primary Trade</label>
              <select required value={form.trade} onChange={e => setForm(p => ({ ...p, trade: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={fieldStyle}>
                <option value="">Select trade</option>
                {TRADES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>About Your Business <span style={{ color: 'var(--muted)' }}>(optional)</span></label>
            <textarea rows={4} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={fieldStyle} placeholder="Services offered, years in business, notable projects…" />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm p-3 rounded-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
              <AlertCircle size={16} strokeWidth={2} /> {error}
            </div>
          )}

          <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-sm font-bold text-sm disabled:opacity-60" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : <><Hammer size={16} /> Submit Application</>}
          </button>
          <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
            Free to list. Your details are reviewed before your listing goes live.
          </p>
        </form>
      </div>
    </div>
  )
}
