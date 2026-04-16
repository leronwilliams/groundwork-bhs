'use client'

import { useState } from 'react'
import Link from 'next/link'
import { BlueprintCard } from '@/components/ui/BlueprintCard'

function calcPropertyTax(value: number, ownerOccupied: boolean, type: string): { tax: number; breakdown: string[] } {
  const breakdown: string[] = []
  let tax = 0

  if (type === 'vacant') {
    tax = value * 0.015
    breakdown.push(`Vacant land: 1.5% flat rate = $${tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)
    return { tax, breakdown }
  }

  if (type === 'commercial') {
    const first = Math.min(value, 500000)
    const above = Math.max(0, value - 500000)
    const t1 = first * 0.01
    const t2 = above * 0.015
    tax = t1 + t2
    breakdown.push(`First $500,000 @ 1%: $${t1.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)
    if (above > 0) breakdown.push(`Above $500,000 @ 1.5%: $${t2.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)
    return { tax, breakdown }
  }

  // Residential
  if (ownerOccupied) {
    if (value <= 300000) {
      breakdown.push('Owner-occupied residential under $300,000: EXEMPT')
      return { tax: 0, breakdown }
    }
    const band1 = Math.min(value, 500000) - 300000
    const above = Math.max(0, value - 500000)
    const t1 = band1 * 0.00625
    const t2 = above * 0.01
    tax = t1 + t2
    breakdown.push(`$300,000–$500,000 @ 0.625%: $${t1.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)
    if (above > 0) breakdown.push(`Above $500,000 @ 1%: $${t2.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)
  } else {
    const first = Math.min(value, 500000)
    const above = Math.max(0, value - 500000)
    const t1 = first * 0.01
    const t2 = above * 0.015
    tax = t1 + t2
    breakdown.push(`First $500,000 @ 1%: $${t1.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)
    if (above > 0) breakdown.push(`Above $500,000 @ 1.5%: $${t2.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)
  }

  return { tax, breakdown }
}

export default function PropertyTaxPage() {
  const [value, setValue] = useState('')
  const [ownerOccupied, setOwnerOccupied] = useState(true)
  const [type, setType] = useState('residential')
  const [result, setResult] = useState<{ tax: number; breakdown: string[] } | null>(null)

  const calculate = () => {
    const num = parseFloat(value.replace(/,/g, ''))
    if (isNaN(num) || num <= 0) return
    setResult(calcPropertyTax(num, ownerOccupied, type))
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-xs uppercase tracking-widest mb-3 font-mono" style={{ color: 'var(--amber)' }}>
          Real Property Tax
        </div>
        <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
          Property Tax Calculator
        </h1>
        <p className="mb-12 text-lg" style={{ color: 'var(--muted)' }}>
          Estimate your annual Real Property Tax in the Bahamas. Due March 31 each year.
        </p>

        {/* Calculator */}
        <BlueprintCard className="mb-10">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>
                Property Value (BSD)
              </label>
              <input
                type="text"
                value={value}
                onChange={e => setValue(e.target.value)}
                placeholder="e.g. 450,000"
                className="w-full px-4 py-3 rounded-sm text-lg outline-none"
                style={{ background: 'var(--navy)', border: '1px solid var(--cyan-border)', color: 'var(--text)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Property Type</label>
              <div className="flex gap-3 flex-wrap">
                {[
                  { val: 'residential', label: 'Residential' },
                  { val: 'commercial', label: 'Commercial' },
                  { val: 'vacant', label: 'Vacant Land' },
                ].map(opt => (
                  <button
                    key={opt.val}
                    onClick={() => setType(opt.val)}
                    className="px-4 py-2 rounded-sm text-sm transition-all"
                    style={{
                      background: type === opt.val ? 'var(--cyan)' : 'var(--navy)',
                      color: type === opt.val ? 'var(--navy)' : 'var(--muted)',
                      border: `1px solid ${type === opt.val ? 'var(--cyan)' : 'var(--cyan-border)'}`,
                      fontWeight: type === opt.val ? 600 : 400,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {type === 'residential' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text)' }}>Occupancy</label>
                <div className="flex gap-3">
                  {[
                    { val: true, label: 'Owner-occupied' },
                    { val: false, label: 'Not owner-occupied / rental' },
                  ].map(opt => (
                    <button
                      key={String(opt.val)}
                      onClick={() => setOwnerOccupied(opt.val)}
                      className="px-4 py-2 rounded-sm text-sm transition-all"
                      style={{
                        background: ownerOccupied === opt.val ? 'var(--cyan)' : 'var(--navy)',
                        color: ownerOccupied === opt.val ? 'var(--navy)' : 'var(--muted)',
                        border: `1px solid ${ownerOccupied === opt.val ? 'var(--cyan)' : 'var(--cyan-border)'}`,
                        fontWeight: ownerOccupied === opt.val ? 600 : 400,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={calculate}
              className="w-full py-4 rounded-sm font-semibold text-lg transition-all"
              style={{ background: 'var(--cyan)', color: 'var(--navy)' }}
            >
              Calculate
            </button>

            {result && (
              <div
                className="rounded-sm p-6 mt-4"
                style={{ background: result.tax === 0 ? 'rgba(5,150,105,0.1)' : 'var(--amber-dim)', border: `1px solid ${result.tax === 0 ? 'rgba(5,150,105,0.3)' : 'rgba(245,158,11,0.3)'}` }}
              >
                <div className="text-sm mb-3" style={{ color: 'var(--muted)' }}>Estimated Annual Property Tax</div>
                <div className="text-4xl font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif', color: result.tax === 0 ? '#059669' : 'var(--amber)' }}>
                  {result.tax === 0 ? 'EXEMPT' : `$${result.tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                </div>
                <div className="space-y-1">
                  {result.breakdown.map((line, i) => (
                    <div key={i} className="text-sm font-mono" style={{ color: 'var(--text)' }}>
                      {line}
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-xs" style={{ color: 'var(--muted)' }}>
                  This is an estimate only. Verify with the Department of Inland Revenue: (242) 225-7280
                </div>
              </div>
            )}
          </div>
        </BlueprintCard>

        {/* Info sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: 'Rate Schedule', items: ['Owner-occupied under $300k: Exempt', '$300k–$500k: 0.625%', 'Above $500k: 1%', 'Non-owner residential: 1% / 1.5%', 'Commercial: 1% / 1.5%', 'Vacant land: 1.5% flat'] },
            { title: 'Key Dates & Facts', items: ['Due date: March 31 annually', 'Late penalty: interest accrues', 'Clearance certificate required for sales', 'Pay online at Bahamas.gov.bs', 'Department of Inland Revenue: (242) 225-7280', 'Appeals: file within 30 days of assessment'] },
          ].map(card => (
            <BlueprintCard key={card.title} title={card.title}>
              <ul className="space-y-2 mt-2">
                {card.items.map((item, i) => (
                  <li key={i} className="text-sm flex gap-2" style={{ color: 'var(--muted)' }}>
                    <span style={{ color: 'var(--cyan)' }}>·</span> {item}
                  </li>
                ))}
              </ul>
            </BlueprintCard>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/advisor"
            className="inline-block px-6 py-3 rounded-sm font-semibold"
            style={{ background: 'var(--cyan)', color: 'var(--navy)' }}
          >
            Ask the Advisor about your specific situation
          </Link>
        </div>
      </div>
    </div>
  )
}
