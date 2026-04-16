'use client'

import { useRef, useState, useCallback } from 'react'

interface BeforeAfterProps {
  beforeSrc: string
  afterSrc: string
  beforeAlt?: string
  afterAlt?: string
  className?: string
}

export function BeforeAfter({ beforeSrc, afterSrc, beforeAlt = 'Before', afterAlt = 'After', className = '' }: BeforeAfterProps) {
  const [position, setPosition] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const { left, width } = containerRef.current.getBoundingClientRect()
    const pct = Math.max(0, Math.min(100, ((clientX - left) / width) * 100))
    setPosition(pct)
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-sm select-none ${className}`}
      style={{ cursor: 'ew-resize', border: '1px solid var(--cyan-border)' }}
      onMouseMove={e => { if (dragging.current) updatePosition(e.clientX) }}
      onMouseUp={() => { dragging.current = false }}
      onMouseLeave={() => { dragging.current = false }}
    >
      {/* After image (full) */}
      <img src={afterSrc} alt={afterAlt} className="w-full h-64 object-cover block" />

      {/* Before image (clipped) */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
        <img src={beforeSrc} alt={beforeAlt} className="w-full h-64 object-cover block" style={{ width: `${100 / (position / 100)}%` }} />
      </div>

      {/* Divider */}
      <div
        className="absolute top-0 bottom-0 w-0.5 z-10"
        style={{ left: `${position}%`, background: 'var(--cyan)', boxShadow: '0 0 8px rgba(6,182,212,0.6)' }}
        onMouseDown={e => { e.preventDefault(); dragging.current = true }}
      >
        {/* Handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ background: 'var(--navy)', border: '2px solid var(--cyan)', boxShadow: '0 0 12px rgba(6,182,212,0.4)' }}
        >
          <span className="text-xs" style={{ color: 'var(--cyan)' }}>⟺</span>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-3 left-3 text-xs uppercase tracking-wider px-2 py-0.5 rounded-sm"
        style={{ background: 'rgba(10,22,40,0.8)', color: 'var(--muted)', border: '1px solid var(--cyan-border)' }}>
        Before
      </div>
      <div className="absolute top-3 right-3 text-xs uppercase tracking-wider px-2 py-0.5 rounded-sm"
        style={{ background: 'rgba(10,22,40,0.8)', color: 'var(--cyan)', border: '1px solid var(--cyan-border)' }}>
        After
      </div>
    </div>
  )
}
