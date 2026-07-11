'use client'
import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { CheckCircle, Loader2, Send, AlertCircle } from 'lucide-react'

const ISLANDS = ['New Providence (Nassau)', 'Grand Bahama (Freeport)', 'Abaco', 'Eleuthera', 'Exuma', 'Andros', 'Cat Island', 'Long Island', 'Bimini', 'Berry Islands', 'Other']
const PROJECT_TYPES = ['New Build', 'Renovation', 'Addition / Extension', 'Commercial Build', 'Repair / Maintenance', 'Other']
const TRADES = ['Foundation', 'Structure / Concrete Block', 'Masonry', 'Roofing', 'Electrical', 'Plumbing', 'Tiling', 'Painting', 'Joinery / Carpentry', 'Landscaping', 'General Contractor']
const BUDGETS = ['Under $10,000', '$10,000 – $50,000', '$50,000 – $150,000', '$150,000 – $500,000', '$500,000+', 'Not sure yet']
const TIMELINES = ['As soon as possible', 'Within 1 month', '1 – 3 months', '3 – 6 months', '6 – 12 months', 'Just planning']

const fieldStyle = { background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }

type Result = { matchedContractors: number; builderFree: boolean; message?: string }

export default function PostProjectPage() {
  const { isSignedIn, isLoaded } = useAuth()
  const [form, setForm] = useState({
    island: '', projectType: '', trades: [] as string[],
    budget: '', timeline: '', notes: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)

  function toggleTrade(trade: string) {
    setForm(prev => ({
      ...prev,
      trades: prev.trades.includes(trade) ? prev.trades.filter(t => t !== trade) : [...prev.trades, trade],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (form.trades.length === 0) { setError('Please select at least one trade you need.'); return }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          island: form.island,
          projectType: form.projectType,
          tradesNeeded: form.trades,
          budget: form.budget || null,
          timeline: form.timeline || null,
          notes: form.notes || null,
        }),
      })

      if (res.ok) {
        // Builder tier — dispatched free, immediately.
        const data = await res.json()
        setResult({ matchedContractors: data.matchedContractors ?? 0, builderFree: !!data.builderFree, message: data.message })
        return
      }

      if (res.status === 402) {
        // Free/Pro tier — pay to broadcast. Carry the brief through checkout metadata;
        // the Stripe webhook dispatches the lead once payment clears.
        const checkout = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            priceKey: 'lead',
            metadata: {
              island: form.island,
              projectType: form.projectType,
              trades: form.trades.join(','),
              budget: form.budget,
              timeline: form.timeline,
              notes: form.notes.slice(0, 480),
            },
          }),
        })
        const cd = await checkout.json()
        if (cd.url) { window.location.href = cd.url; return }
        setError('Could not start checkout. Please try again or contact support.')
        return
      }

      const ed = await res.json().catch(() => ({}))
      setError(ed.error || 'Something went wrong. Please try again.')
    } catch {
      setError('Network error. Please check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Success screen
  if (result) {
    const none = result.matchedContractors === 0
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--navy)' }}>
        <div className="max-w-md w-full text-center p-12 rounded-sm" style={{ background: 'var(--navy-surface)', border: `1px solid ${none ? 'var(--cyan-border)' : 'rgba(5,150,105,0.4)'}` }}>
          <CheckCircle size={64} style={{ color: none ? 'var(--cyan)' : '#059669', margin: '0 auto 24px' }} strokeWidth={1.5} />
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            {none ? 'Project Received' : 'Project Posted'}
          </h1>
          <p className="mb-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {none
              ? (result.message || 'No contractors match your trade and island just yet. We\'ll notify matching contractors as they join.')
              : `Your project was sent to ${result.matchedContractors} matching contractor${result.matchedContractors === 1 ? '' : 's'}${result.builderFree ? ' (free with your Builder plan)' : ''}. You'll be notified the moment one expresses interest.`}
          </p>
          <Link href="/dashboard" className="block py-3 rounded-sm font-bold text-sm mb-3" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
            View in Dashboard
          </Link>
          <Link href="/" className="block py-3 rounded-sm font-bold text-sm" style={{ border: '1px solid var(--cyan-border)', color: 'var(--text-secondary)' }}>
            Back to Home
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
          <div className="section-label mb-4">Post a Project</div>
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Sign in to post your project</h1>
          <p className="mb-8 text-sm" style={{ color: 'var(--text-secondary)' }}>
            We match your project to verified contractors on your island and notify you when one is interested.
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
        <div className="section-label mb-4">Post a Project</div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Find the right contractor</h1>
        <p className="mb-10" style={{ color: 'var(--text-secondary)' }}>
          Tell us about your project. We&apos;ll match it to verified contractors on your island and notify you when one expresses interest. Your contact details stay private until then.
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Island / Location</label>
              <select required value={form.island} onChange={e => setForm(p => ({ ...p, island: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={fieldStyle}>
                <option value="">Select island</option>
                {ISLANDS.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Project Type</label>
              <select required value={form.projectType} onChange={e => setForm(p => ({ ...p, projectType: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={fieldStyle}>
                <option value="">Select type</option>
                {PROJECT_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-3 uppercase tracking-wider" style={{ color: 'var(--cyan)' }}>Trades Needed</label>
            <div className="grid grid-cols-2 gap-2">
              {TRADES.map(trade => {
                const active = form.trades.includes(trade)
                return (
                  <label key={trade} className="flex items-center gap-2 cursor-pointer text-sm p-2.5 rounded-sm transition-colors"
                    style={{ color: active ? 'var(--text-primary)' : 'var(--text-secondary)', background: active ? 'rgba(0,212,245,0.08)' : 'var(--navy-surface)', border: `1px solid ${active ? 'var(--cyan)' : 'var(--cyan-border)'}` }}>
                    <input type="checkbox" checked={active} onChange={() => toggleTrade(trade)} className="accent-cyan-400" />
                    {trade}
                  </label>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Budget Range</label>
              <select value={form.budget} onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={fieldStyle}>
                <option value="">Select budget (optional)</option>
                {BUDGETS.map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Timeline</label>
              <select value={form.timeline} onChange={e => setForm(p => ({ ...p, timeline: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={fieldStyle}>
                <option value="">Select timeline (optional)</option>
                {TIMELINES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Project Details</label>
            <textarea rows={4} placeholder="Describe the scope, location details, and anything a contractor should know." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="w-full p-3 rounded-sm text-sm" style={fieldStyle} />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm p-3 rounded-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
              <AlertCircle size={16} strokeWidth={2} /> {error}
            </div>
          )}

          <button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-sm font-bold text-sm disabled:opacity-60" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
            {submitting ? <><Loader2 size={16} className="animate-spin" /> Sending…</> : <><Send size={16} /> Post Project &amp; Match Contractors</>}
          </button>
          <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
            Builder plan members post leads free. Free &amp; Pro members pay a one-time $20 lead fee at checkout.
          </p>
        </form>
      </div>
    </div>
  )
}
