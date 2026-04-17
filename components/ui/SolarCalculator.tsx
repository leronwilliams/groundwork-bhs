'use client'
import { useState } from 'react'
import Link from 'next/link'

const SYSTEM_SIZES = [
  { label: '1.5 kW', kw: 1.5, nassauCost: 7500, familyCost: 9500 },
  { label: '3 kW',   kw: 3,   nassauCost: 11500, familyCost: 14500 },
  { label: '5 kW',   kw: 5,   nassauCost: 17500, familyCost: 22000 },
  { label: '8 kW',   kw: 8,   nassauCost: 26000, familyCost: 33000 },
  { label: '10 kW',  kw: 10,  nassauCost: 32000, familyCost: 40000 },
]

// Previous duty on solar panels was ~25% before the exemption
const OLD_DUTY_RATE = 0.25
// Panel cost is ~40% of total installed cost
const PANEL_FRACTION = 0.40

const ISLANDS = ['New Providence (Nassau)', 'Grand Bahama', 'Abaco', 'Eleuthera', 'Exuma', 'Andros', 'Long Island', 'Other Family Island']
const FAMILY_ISLANDS = new Set(['Grand Bahama', 'Abaco', 'Eleuthera', 'Exuma', 'Andros', 'Long Island', 'Other Family Island'])

export function SolarCalculator() {
  const [sizeIdx, setSizeIdx] = useState(1) // default 3kW
  const [bplBill, setBplBill] = useState('350')
  const [island, setIsland] = useState('New Providence (Nassau)')
  const [showResults, setShowResults] = useState(false)

  const sys = SYSTEM_SIZES[sizeIdx]
  const isFamily = FAMILY_ISLANDS.has(island)
  const installedCost = isFamily ? sys.familyCost : sys.nassauCost

  // Duty savings: old 25% duty on panel component
  const panelCost = installedCost * PANEL_FRACTION
  const dutySaving = Math.round(panelCost * OLD_DUTY_RATE)

  // Monthly BPL savings: larger systems offset more
  const monthlyBill = parseFloat(bplBill) || 350
  // Typical offset: 1.5kW→35%, 3kW→65%, 5kW→85%, 8kW→95%, 10kW→100%
  const offsets = [0.35, 0.65, 0.85, 0.95, 1.0]
  const offset = offsets[sizeIdx]
  const monthlySaving = Math.round(monthlyBill * offset)

  // Payback in years
  const netCost = installedCost - dutySaving
  const annualSaving = monthlySaving * 12
  const payback = annualSaving > 0 ? (netCost / annualSaving).toFixed(1) : '—'

  // 10-year total saving
  const tenYearSaving = Math.round(annualSaving * 10 - netCost)

  function inputStyle(): React.CSSProperties {
    return { background: 'var(--navy)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)', borderRadius: '2px', padding: '10px 12px', fontSize: '0.875rem', width: '100%' }
  }

  return (
    <div className="rounded-sm overflow-hidden" style={{ border: '1px solid var(--amber)', background: 'var(--navy-surface)' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, rgba(245,166,35,0.12) 0%, transparent 100%)', borderBottom: '1px solid rgba(245,166,35,0.3)', padding: '20px 24px' }}>
        <div className="section-label mb-1" style={{ color: 'var(--amber)' }}>Solar Incentive Calculator</div>
        <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>How much will solar save you?</h3>
        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Solar panels are duty-free in the Bahamas. Calculate your savings including duty exemption.</p>
      </div>

      <div className="p-6 space-y-5">
        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--muted)' }}>System Size</label>
            <select value={sizeIdx} onChange={e => { setSizeIdx(Number(e.target.value)); setShowResults(false) }} style={inputStyle()}>
              {SYSTEM_SIZES.map((s, i) => (
                <option key={i} value={i}>{s.label} — {i === 1 ? 'most popular' : i === 0 ? 'small home' : i === 4 ? 'large home' : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Current Monthly BPL Bill (BSD)</label>
            <input type="number" value={bplBill} onChange={e => { setBplBill(e.target.value); setShowResults(false) }} placeholder="e.g. 350" style={inputStyle()} />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Island</label>
            <select value={island} onChange={e => { setIsland(e.target.value); setShowResults(false) }} style={inputStyle()}>
              {ISLANDS.map(i => <option key={i}>{i}</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={() => setShowResults(true)}
          className="w-full py-3 rounded-sm font-bold text-sm"
          style={{ background: 'var(--amber)', color: '#1a0f00' }}
        >
          Calculate My Solar Savings →
        </button>

        {/* Results */}
        {showResults && (
          <div className="space-y-4 pt-2">
            {/* Main cost card */}
            <div className="p-5 rounded-sm" style={{ background: 'var(--navy-card)', border: '1px solid var(--amber)' }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wide font-bold mb-1" style={{ color: 'var(--muted)' }}>System Cost</p>
                  <p className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>${installedCost.toLocaleString()}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>installed {isFamily ? '(Family Island)' : '(Nassau)'}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide font-bold mb-1" style={{ color: 'var(--muted)' }}>Duty Saved</p>
                  <p className="text-2xl font-black" style={{ color: '#059669' }}>−${dutySaving.toLocaleString()}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>0% duty vs old 25%</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide font-bold mb-1" style={{ color: 'var(--muted)' }}>Monthly Saving</p>
                  <p className="text-2xl font-black" style={{ color: 'var(--amber)' }}>${monthlySaving.toLocaleString()}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{Math.round(offset * 100)}% of BPL bill</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wide font-bold mb-1" style={{ color: 'var(--muted)' }}>Payback Period</p>
                  <p className="text-2xl font-black" style={{ color: 'var(--cyan)' }}>{payback} yrs</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>then pure savings</p>
                </div>
              </div>
            </div>

            {/* 10-year callout */}
            <div className="p-5 rounded-sm text-center" style={{ background: tenYearSaving > 0 ? 'rgba(245,166,35,0.08)' : 'var(--navy-card)', border: `1px solid ${tenYearSaving > 0 ? 'var(--amber)' : 'var(--cyan-border)'}` }}>
              {tenYearSaving > 0 ? (
                <>
                  <p className="text-xs uppercase tracking-wide font-bold mb-1" style={{ color: 'var(--amber)' }}>10-Year Net Saving</p>
                  <p style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--amber)', letterSpacing: '-0.03em' }}>${tenYearSaving.toLocaleString()}</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>After repaying the full system cost, over 10 years</p>
                </>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-wide font-bold mb-1" style={{ color: 'var(--muted)' }}>10-Year Position</p>
                  <p className="text-lg font-bold" style={{ color: 'var(--text-secondary)' }}>Break-even in year {payback}</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Increase your monthly BPL bill input to see savings</p>
                </>
              )}
            </div>

            {/* Summary bullets */}
            <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <li>• <strong style={{ color: 'var(--text-primary)' }}>{sys.label} system</strong> typically offsets ~{Math.round(offset * 100)}% of average Bahamian home power consumption</li>
              <li>• <strong style={{ color: '#059669' }}>Duty saving of ${dutySaving.toLocaleString()}</strong> reflects 0% duty vs the old 25% rate under the government solar incentive</li>
              <li>• Add BPL net metering: sell excess power back to the grid. Contact BPL: <span style={{ color: 'var(--cyan)' }}>(242) 302-1000</span></li>
              {isFamily && <li>• Family Island installation costs are higher due to freight and logistics</li>}
            </ul>

            <div className="pt-2">
              <Link href="/boq-wizard" className="flex items-center justify-center gap-2 py-3 rounded-sm font-bold text-sm" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
                Get a Solar Line Item in Your BOQ →
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
