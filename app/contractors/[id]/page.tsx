'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import Link from 'next/link'
import { CheckCircle, Loader2, Star, Phone, Mail, Globe, MessageCircle, AlertCircle, ArrowLeft } from 'lucide-react'

interface Review { id: string; authorName: string; rating: number; comment: string | null; createdAt: string }
interface Contractor {
  id: string; name: string; contactName: string | null; trade: string; island: string
  phone: string | null; whatsapp: string | null; email: string | null; website: string | null
  description: string | null; imageUrl: string | null; verified: boolean; featuredTier: string | null
  reviews: Review[]
}

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={size} strokeWidth={2}
          style={{ color: n <= value ? 'var(--amber)' : 'var(--muted)', fill: n <= value ? 'var(--amber)' : 'transparent' }} />
      ))}
    </span>
  )
}

export default function ContractorProfilePage() {
  const params = useParams()
  const id = params?.id as string
  const { isSignedIn } = useAuth()

  const [contractor, setContractor] = useState<Contractor | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/contractors/${id}`)
      if (res.status === 404) { setNotFound(true); return }
      if (!res.ok) throw new Error()
      setContractor(await res.json())
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { if (id) load() }, [id, load])

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    if (rating < 1) { setReviewError('Please select a star rating.'); return }
    setSubmitting(true)
    setReviewError(null)
    try {
      const res = await fetch(`/api/contractors/${id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment }),
      })
      if (res.ok) {
        setRating(0); setComment('')
        await load()
        return
      }
      const data = await res.json().catch(() => ({}))
      setReviewError(data.error || 'Could not submit review.')
    } catch {
      setReviewError('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--navy)' }}>
        <Loader2 size={32} className="animate-spin" style={{ color: 'var(--cyan)' }} />
      </div>
    )
  }

  if (notFound || !contractor) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--navy)' }}>
        <div className="max-w-md w-full text-center p-12 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
          <AlertCircle size={48} style={{ color: 'var(--amber)', margin: '0 auto 16px' }} />
          <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Contractor not found</h1>
          <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>This listing may be pending review or no longer active.</p>
          <Link href="/contractors" className="inline-block px-6 py-3 rounded-sm font-bold text-sm" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>Back to Directory</Link>
        </div>
      </div>
    )
  }

  const reviews = contractor.reviews || []
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

  return (
    <div className="min-h-screen pt-28 pb-24 px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/contractors" className="inline-flex items-center gap-1 text-sm mb-6" style={{ color: 'var(--muted)' }}>
          <ArrowLeft size={14} /> All Contractors
        </Link>

        {/* Header */}
        <div className="p-6 rounded-sm mb-6" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
          <div className="flex items-start gap-4">
            {contractor.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={contractor.imageUrl} alt={contractor.name} className="w-20 h-20 rounded-sm object-cover flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{contractor.name}</h1>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-xs px-2 py-0.5 rounded-sm font-mono" style={{ background: 'rgba(0,212,245,0.12)', color: 'var(--cyan)' }}>{contractor.trade}</span>
                <span className="text-xs px-2 py-0.5 rounded-sm font-mono" style={{ background: 'var(--navy-card)', color: 'var(--text-secondary)' }}>{contractor.island}</span>
                {contractor.verified ? (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-sm" style={{ background: 'rgba(5,150,105,0.2)', color: '#059669' }}>
                    <CheckCircle size={12} strokeWidth={2} /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-sm" style={{ background: 'rgba(245,166,35,0.12)', color: 'var(--amber)' }}>
                    <AlertCircle size={12} strokeWidth={2} /> Pending verification
                  </span>
                )}
              </div>
              {reviews.length > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Stars value={Math.round(avg)} />
                  <span style={{ color: 'var(--text-secondary)' }}>{avg.toFixed(1)} · {reviews.length} review{reviews.length === 1 ? '' : 's'}</span>
                </div>
              )}
            </div>
          </div>
          {contractor.description && <p className="mt-4 text-sm" style={{ color: 'var(--text-secondary)' }}>{contractor.description}</p>}
        </div>

        {/* Contact */}
        <div className="p-6 rounded-sm mb-6" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
          <div className="section-label mb-4">Contact</div>
          {isSignedIn ? (
            <div className="flex flex-col gap-3 text-sm">
              {contractor.contactName && <p style={{ color: 'var(--text-secondary)' }}>Ask for <strong style={{ color: 'var(--text-primary)' }}>{contractor.contactName}</strong></p>}
              {contractor.phone && <a href={`tel:${contractor.phone}`} className="flex items-center gap-2" style={{ color: 'var(--cyan)' }}><Phone size={14} /> {contractor.phone}</a>}
              {contractor.whatsapp && <a href={`https://wa.me/${contractor.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2" style={{ color: 'var(--cyan)' }}><MessageCircle size={14} /> WhatsApp</a>}
              {contractor.email && <a href={`mailto:${contractor.email}`} className="flex items-center gap-2" style={{ color: 'var(--cyan)' }}><Mail size={14} /> {contractor.email}</a>}
              {contractor.website && <a href={contractor.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2" style={{ color: 'var(--cyan)' }}><Globe size={14} /> Website</a>}
            </div>
          ) : (
            <div>
              <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>Sign in to view this contractor&apos;s contact details.</p>
              <a href="/sign-in" className="inline-block px-5 py-2.5 rounded-sm font-bold text-sm" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>Sign In</a>
            </div>
          )}
        </div>

        {/* Reviews */}
        <div className="p-6 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
          <div className="section-label mb-4">Reviews</div>

          {reviews.length === 0 ? (
            <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>No reviews yet. Be the first to leave one.</p>
          ) : (
            <div className="space-y-4 mb-8">
              {reviews.map(r => (
                <div key={r.id} className="pb-4" style={{ borderBottom: '1px solid var(--cyan-border)' }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{r.authorName}</span>
                    <Stars value={r.rating} size={12} />
                  </div>
                  {r.comment && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{r.comment}</p>}
                  <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              ))}
            </div>
          )}

          {/* Review form */}
          {isSignedIn ? (
            <form onSubmit={submitReview} className="pt-2">
              <div className="section-label mb-3">Leave a Review</div>
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n === 1 ? '' : 's'}`}>
                    <Star size={24} strokeWidth={2} style={{ color: n <= rating ? 'var(--amber)' : 'var(--muted)', fill: n <= rating ? 'var(--amber)' : 'transparent' }} />
                  </button>
                ))}
              </div>
              <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)} placeholder="Share your experience (optional)"
                className="w-full p-3 rounded-sm text-sm mb-3" style={{ background: 'var(--navy-card)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }} />
              {reviewError && (
                <div className="flex items-center gap-2 text-sm p-3 rounded-sm mb-3" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
                  <AlertCircle size={16} strokeWidth={2} /> {reviewError}
                </div>
              )}
              <button type="submit" disabled={submitting} className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-sm font-bold text-sm disabled:opacity-60" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
                {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting…</> : 'Submit Review'}
              </button>
            </form>
          ) : (
            <p className="text-sm pt-2" style={{ color: 'var(--muted)' }}>
              <a href="/sign-in" style={{ color: 'var(--cyan)' }}>Sign in</a> to leave a review.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
