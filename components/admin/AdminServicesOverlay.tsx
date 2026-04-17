'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const SERVICE_LABELS: Record<string, string> = {
  estimate_single: 'Single Trade Estimate ($50)',
  estimate_full:   'Full Project Estimate ($150)',
  boq:             'Bill of Quantities ($200)',
  boq_hardware:    'BOQ + Hardware Pricing ($250)',
  boq_quotes:      'BOQ + Hardware Quotes ($299)',
  permit_prep:     'Permit Document Prep ($75)',
  contract:        'Contractor Agreement ($35)',
  tax_appeal:      'Property Tax Appeal ($25)',
  lead:            'Contractor Lead ($20)',
}

export function AdminServicesOverlay() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [creating, setCreating] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetch('/api/admin/is-admin').then(r => r.json()).then(d => setIsAdmin(d.isAdmin)).catch(() => {})
  }, [])

  if (!isAdmin) return null

  async function createTestOrder(serviceType: string) {
    setCreating(serviceType)
    try {
      const res = await fetch('/api/admin/test-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceType, label: `Admin test: ${serviceType}` }),
      })
      const data = await res.json()
      if (!res.ok) { alert('Error: ' + data.error); return }
      router.push(data.deliveryUrl)
    } catch (err) {
      alert('Failed: ' + String(err))
    } finally {
      setCreating(null)
    }
  }

  return (
    <div style={{ position: 'fixed', bottom: 24, left: 24, zIndex: 9999 }}>
      <div style={{ background: 'rgba(6,13,26,0.97)', border: '1px solid rgba(239,68,68,0.5)', borderRadius: 4, overflow: 'hidden', boxShadow: '0 0 30px rgba(239,68,68,0.15)' }}>
        <button
          onClick={() => setExpanded(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', width: '100%', color: '#ef4444', fontWeight: 700, fontSize: '0.75rem', background: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          🔧 ADMIN TEST PANEL {expanded ? '▲' : '▼'}
        </button>
        {expanded && (
          <div style={{ borderTop: '1px solid rgba(239,68,68,0.3)', padding: '12px 16px', maxWidth: 280 }}>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Create paid test order (no charge)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Object.entries(SERVICE_LABELS).map(([type, label]) => (
                <button
                  key={type}
                  onClick={() => createTestOrder(type)}
                  disabled={!!creating}
                  style={{ textAlign: 'left', padding: '6px 10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 2, color: creating === type ? '#ef4444' : 'rgba(255,255,255,0.7)', fontSize: '0.75rem', cursor: 'pointer', opacity: creating && creating !== type ? 0.5 : 1 }}
                >
                  {creating === type ? '⏳ Creating...' : `→ ${label}`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
