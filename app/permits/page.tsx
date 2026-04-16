import Link from 'next/link'
import { BlueprintCard } from '@/components/ui/BlueprintCard'

const PERMITS = [
  {
    title: 'Planning Permission',
    authority: 'Ministry of Works',
    timeline: '8–16 weeks',
    docs: ['Site plan (surveyor-certified)', 'Architectural drawings', 'Title documents', 'Completed application form', 'Application fee'],
    notes: 'Required before any construction. Must be obtained first — building permit cannot be issued without it.',
  },
  {
    title: 'Building Permit',
    authority: 'Building Control Authority (BCA)',
    timeline: '4–8 weeks after planning',
    docs: ['Planning permission approval', 'Structural drawings', 'Electrical drawings', 'Plumbing drawings', 'Contractor details'],
    notes: 'Fee is calculated per square foot of construction. Inspections required at foundation, frame, and completion stages.',
  },
  {
    title: 'Environmental Permit',
    authority: 'Bahamas Environment, Science & Technology (BEST) Commission',
    timeline: '12–24 weeks (EIA required)',
    docs: ['Environmental Impact Assessment', 'Site plan', 'Project description', 'Mitigation plan'],
    notes: 'Required for large developments, coastal construction, and projects in environmentally sensitive areas.',
  },
  {
    title: 'Subdivision Approval',
    authority: 'Ministry of Works & Planning',
    timeline: '16–24 weeks',
    docs: ['Survey plan', 'Title documents', 'Proposed lot layout', 'Infrastructure plan'],
    notes: 'Required when dividing land into multiple lots. Must show road access, utilities, and lot dimensions.',
  },
  {
    title: 'BPL Connection',
    authority: 'Bahamas Power & Light (BPL)',
    timeline: '4–12 weeks',
    docs: ['Electrical inspection certificate', 'Building permit', 'Property ownership proof', 'BPL application form'],
    notes: 'Submit after electrical work is complete and inspected. Meter installation scheduled after approval.',
  },
  {
    title: 'WSC Connection',
    authority: 'Water & Sewerage Corporation (WSC)',
    timeline: '4–8 weeks',
    docs: ['Plumbing inspection certificate', 'Building permit', 'Property ownership proof', 'WSC application form'],
    notes: 'Required for water and sewerage connections. Septic system approval separate if public sewerage unavailable.',
  },
]

const FAMILY_ISLAND_NOTES = [
  'Commissioner\'s approval required before planning permission on most Family Islands',
  'Process and timelines vary significantly by island and Commissioner\'s office',
  'Some islands have limited Ministry of Works presence — allow extra time',
  'Environmental considerations more prominent on smaller, more fragile islands',
  'Utility connections (BEC, WSC) may not be available — generator + cistern + septic common',
]

export default function PermitsPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="text-xs uppercase tracking-widest mb-3 font-mono" style={{ color: '#dc2626' }}>
          Permits
        </div>
        <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
          Permit Guide
        </h1>
        <p className="mb-4 text-lg max-w-2xl" style={{ color: 'var(--muted)' }}>
          Every construction project in the Bahamas requires permits. Here is what you need, who issues them, 
          how long they take, and what documents to prepare.
        </p>

        {/* Island toggle note */}
        <div
          className="inline-flex gap-3 mb-12 p-3 rounded-sm text-sm"
          style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}
        >
          <span style={{ color: 'var(--cyan)' }}>🏙 New Providence</span>
          <span style={{ color: 'var(--muted)' }}>|</span>
          <span style={{ color: 'var(--amber)' }}>⚓ Family Islands — see notes below each permit</span>
        </div>

        {/* Permit cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {PERMITS.map(permit => (
            <BlueprintCard key={permit.title} title={permit.title} category="permits">
              <div className="mt-3 space-y-4">
                <div className="flex gap-6 text-sm">
                  <div>
                    <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>Authority</div>
                    <div style={{ color: 'var(--text)' }}>{permit.authority}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>Timeline</div>
                    <div style={{ color: 'var(--cyan)' }}>{permit.timeline}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>Required Documents</div>
                  <ul className="space-y-1">
                    {permit.docs.map(doc => (
                      <li key={doc} className="text-sm flex gap-2" style={{ color: 'var(--muted)' }}>
                        <span style={{ color: 'var(--cyan)' }}>·</span> {doc}
                      </li>
                    ))}
                  </ul>
                </div>
                <div
                  className="text-sm p-3 rounded-sm"
                  style={{ background: 'var(--navy)', border: '1px solid var(--cyan-border)', color: 'var(--muted)' }}
                >
                  {permit.notes}
                </div>
              </div>
            </BlueprintCard>
          ))}
        </div>

        {/* Family Island notes */}
        <div
          className="p-8 rounded-sm mb-12"
          style={{ background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.3)' }}
        >
          <div className="text-xs uppercase tracking-wider mb-4 font-mono" style={{ color: 'var(--amber)' }}>
            Family Islands — Additional Requirements
          </div>
          <ul className="space-y-3">
            {FAMILY_ISLAND_NOTES.map(note => (
              <li key={note} className="flex gap-3 text-sm" style={{ color: 'var(--text)' }}>
                <span style={{ color: 'var(--amber)' }}>⚓</span> {note}
              </li>
            ))}
          </ul>
        </div>

        <div className="text-center">
          <p className="mb-4" style={{ color: 'var(--muted)' }}>
            Have specific questions about your project&apos;s permits?
          </p>
          <Link
            href="/advisor"
            className="inline-block px-6 py-3 rounded-sm font-semibold"
            style={{ background: 'var(--cyan)', color: 'var(--navy)' }}
          >
            Ask the Advisor
          </Link>
        </div>
      </div>
    </div>
  )
}
