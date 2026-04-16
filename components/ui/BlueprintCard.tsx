'use client'

import { ReactNode } from 'react'

interface BlueprintCardProps {
  title?: string
  category?: string
  island?: string
  children: ReactNode
  className?: string
  onClick?: () => void
}

export function BlueprintCard({ title, category, island, children, className = '', onClick }: BlueprintCardProps) {
  return (
    <div
      onClick={onClick}
      className={`relative group p-6 rounded-sm cursor-default ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{
        background: 'var(--navy-card)',
        border: '1px solid var(--cyan-border)',
        boxShadow: '0 0 0 0 rgba(6,182,212,0)',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = '0 0 20px rgba(6,182,212,0.08)'
        el.style.borderColor = 'rgba(6,182,212,0.4)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.boxShadow = '0 0 0 0 rgba(6,182,212,0)'
        el.style.borderColor = 'var(--cyan-border)'
      }}
    >
      {/* Corner brackets */}
      <span className="absolute top-0 left-0 w-3 h-3 border-t border-l" style={{ borderColor: 'var(--cyan)' }} />
      <span className="absolute top-0 right-0 w-3 h-3 border-t border-r" style={{ borderColor: 'var(--cyan)' }} />
      <span className="absolute bottom-0 left-0 w-3 h-3 border-b border-l" style={{ borderColor: 'var(--cyan)' }} />
      <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r" style={{ borderColor: 'var(--cyan)' }} />

      {(category || island) && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {category && <SectionBadge label={category} />}
          {island && <IslandTag island={island} />}
        </div>
      )}

      {title && (
        <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>
          {title}
        </h3>
      )}

      {children}
    </div>
  )
}

function SectionBadge({ label }: { label: string }) {
  const colors: Record<string, string> = {
    legal: '#7c3aed',
    finance: '#059669',
    design: '#2563eb',
    permits: '#dc2626',
    contractors: 'var(--amber)',
    insurance: '#0891b2',
    'property-tax': '#c2410c',
    default: 'var(--cyan)',
  }
  const color = colors[label.toLowerCase()] || colors.default
  return (
    <span
      className="text-xs uppercase tracking-wider px-2 py-0.5 rounded-sm font-mono-code"
      style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}
    >
      {label}
    </span>
  )
}

function IslandTag({ island }: { island: string }) {
  const isFamily = island.toLowerCase() !== 'new providence' && island.toLowerCase() !== 'nassau'
  return (
    <span
      className="text-xs uppercase tracking-wider px-2 py-0.5 rounded-sm font-mono-code"
      style={{
        background: isFamily ? 'var(--amber-dim)' : 'var(--cyan-dim)',
        color: isFamily ? 'var(--amber)' : 'var(--cyan)',
        border: `1px solid ${isFamily ? 'rgba(245,158,11,0.3)' : 'var(--cyan-border)'}`,
      }}
    >
      {island}
    </span>
  )
}
