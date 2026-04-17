'use client'
import { useEffect } from 'react'

export interface PartnerAdData {
  id: string
  headline: string
  tagline?: string | null
  ctaText?: string | null
  ctaUrl: string
  logoUrl?: string | null
  placement: string
  partner: { businessName: string }
}

interface Props {
  ad: PartnerAdData
  className?: string
}

export function PartnerAdBanner({ ad, className = '' }: Props) {
  useEffect(() => {
    // Track impression
    fetch('/api/partners/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId: ad.id, type: 'impression' }),
    }).catch(() => {})
  }, [ad.id])

  function handleClick() {
    fetch('/api/partners/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adId: ad.id, type: 'click' }),
    }).catch(() => {})
  }

  return (
    <div className={`rounded-sm p-4 flex items-center justify-between gap-4 ${className}`}
      style={{ background: 'var(--navy-surface)', border: '1px solid rgba(0,212,245,0.12)' }}>
      <div className="flex items-center gap-3">
        {ad.logoUrl && (
          <div className="w-10 h-10 rounded-sm overflow-hidden shrink-0" style={{ background: 'var(--navy-card)', border: '1px solid var(--cyan-border)' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ad.logoUrl} alt={ad.partner.businessName} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        )}
        <div>
          <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{ad.headline}</p>
          {ad.tagline && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{ad.tagline}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <a href={ad.ctaUrl} target="_blank" rel="noopener noreferrer" onClick={handleClick}
          className="px-4 py-2 rounded-sm text-xs font-bold"
          style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
          {ad.ctaText || 'Learn More'}
        </a>
        <span className="text-xs" style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>Groundwork Partner</span>
      </div>
    </div>
  )
}
