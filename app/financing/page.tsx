'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle, ArrowRight } from 'lucide-react'

const LENDERS = [
  {
    name: 'NIB Housing Loan',
    shortName: 'NIB',
    type: 'Government',
    maxAmount: '$100,000',
    rate: '5–7%',
    processing: '60–90 days',
    qualifies: 'NIB contributors in good standing',
    bestFor: 'First-time builders with steady employment',
    contact: '(242) 502-1500',
    address: 'NIB Head Office, Farrington Road, Nassau',
    accent: '#6366f1',
    details: [
      'Available to NIB contributors in good standing',
      'Used for new construction, land purchase, renovation, or home purchase',
      'Maximum loan approximately $100,000',
      'Interest rates approximately 5–7%',
      'Must be Bahamian citizen or permanent resident',
      'Can be combined with personal savings or other loans',
      'Apply in person at NIB Head Office, Farrington Road',
    ],
    documents: [
      'NIB card and contribution statement',
      'Valid Bahamian passport or identity card',
      'Land title or deed of conveyance',
      'Architectural plans (signed)',
      'Contractor quotes',
      'Last 3 months bank statements',
      'Employment letter confirming salary',
      'Statutory declaration',
    ],
  },
  {
    name: 'Bahamas Mortgage Corporation',
    shortName: 'BMC',
    type: 'Government-Backed',
    maxAmount: '$250,000',
    rate: '5.5–7.5%',
    processing: '60–120 days',
    qualifies: 'Bahamian citizens with income limits',
    bestFor: 'Those declined by commercial banks; Family Island buyers',
    contact: '(242) 322-5353',
    address: 'Shirley Street, Nassau',
    accent: '#059669',
    details: [
      'Government-backed lender — purpose-built for Bahamian homeowners',
      'Programs: new construction, purchase, home improvement',
      'Rates 5.5–7.5% — generally lower than commercial banks',
      'Maximum approximately $250,000 for construction',
      'Income limits apply — focused on working Bahamians',
      'Has dedicated Family Island programs',
      'Will consider applicants commercial banks decline',
      'Longer processing — plan accordingly',
    ],
    documents: [
      'Proof of Bahamian citizenship',
      'Last 2 years tax returns or financial statements',
      'Last 3 months pay stubs',
      'Land title',
      'Signed architectural plans',
      'Contractor quotes',
      'Statutory declaration',
      'Credit bureau consent form',
    ],
  },
  {
    name: 'Commercial Banks',
    shortName: 'Banks',
    type: 'Private',
    maxAmount: 'Varies',
    rate: 'Prime +1–3%',
    processing: '30–60 days',
    qualifies: 'Employed or self-employed with income documentation',
    bestFor: 'Larger amounts, faster approval, competitive rates',
    contact: 'Varies by bank',
    address: 'Multiple branches island-wide',
    accent: 'var(--cyan)',
    details: [
      'Commonwealth Bank: most active residential lender in the Bahamas',
      'Fidelity Bank: strong for self-employed and small business owners',
      'RBC Royal Bank: good for larger amounts and complex transactions',
      'Scotiabank: competitive for government employees',
      'First Caribbean: strong for commercial and investment properties',
      'Rates: prime rate + 1–3% margin',
      'Terms: up to 30 years',
      'Down payment: typically 10% for Bahamian citizens, 20–30% for non-citizens',
      'Pre-approval typically 30–60 days',
    ],
    documents: [
      'Proof of citizenship or residency',
      'Last 2 years personal tax returns',
      'Last 3 months bank statements',
      'Employment letter and pay stubs',
      'Land title or purchase agreement',
      'Architect plans and contractor quotes',
      'Appraisal report',
      'Insurance quote',
    ],
  },
  {
    name: 'Vendor Financing',
    shortName: 'Vendor',
    type: 'Private',
    maxAmount: 'Negotiated',
    rate: 'Negotiated (typically higher)',
    processing: 'Fast — weeks not months',
    qualifies: 'Negotiated with seller',
    bestFor: 'Family Islands; when title issues exist; fast closings',
    contact: 'Through a Bahamian attorney',
    address: 'N/A — arranged privately',
    accent: 'var(--amber)',
    details: [
      'Common in Family Islands where institutional financing is harder to access',
      'Seller holds the mortgage instead of a bank',
      'Always document using a Bahamian attorney — this is not optional',
      'Rates are typically higher than institutional lenders',
      'Useful when title issues exist that banks will not lend against',
      'Can close much faster than bank financing',
      'Terms are fully negotiable — be careful with balloon payments',
      'Ensure the seller has clear title before proceeding',
    ],
    documents: [
      'Bahamian attorney engagement letter',
      'Vendor mortgage agreement (attorney-drafted)',
      'Title search by a Bahamian attorney',
      'Property survey',
      'Evidence of insurance',
    ],
  },
]

const CONSTRUCTION_DRAWS = [
  { stage: '1st Draw', milestone: 'Foundation complete', detail: 'Footings, foundation walls, ground slab poured and inspected' },
  { stage: '2nd Draw', milestone: 'Structure complete', detail: 'Block walls to wall plate height, columns and beams in place' },
  { stage: '3rd Draw', milestone: 'Roof complete', detail: 'Roof structure, sheeting, and weatherproofing complete' },
  { stage: '4th Draw', milestone: 'Lock-up', detail: 'All external doors, windows installed; property is secure' },
  { stage: '5th Draw', milestone: 'Completion', detail: 'Interior finishing, fixtures, final inspections passed' },
]

const STACKING_STEPS = [
  { label: 'NIB loan', detail: 'Secure NIB housing loan for land purchase (~$50,000–$70,000)', color: '#6366f1' },
  { label: 'BMC or bank mortgage', detail: 'Apply for construction mortgage for building costs (~$150,000–$200,000)', color: '#059669' },
  { label: 'Personal savings', detail: 'Reserve personal savings for contingency (10–15% of project cost)', color: 'var(--cyan)' },
  { label: 'Duty exemption', detail: 'Apply for first-time homeowner duty exemption — reduces materials cost by $15,000–$40,000', color: 'var(--amber)' },
]

const GRANTS = [
  { name: 'Department of Social Services', desc: 'Emergency housing assistance for qualifying low-income families.', contact: 'Nassau Government Complex' },
  { name: 'Urban Renewal Commission', desc: 'Home repair grants for qualifying Nassau residents in designated urban areas.', contact: 'Blue Hill Road, Nassau' },
  { name: 'Ministry of Housing', desc: 'Periodic affordable housing programs and land allocation.', contact: '(242) 322-6534' },
]

// Eligibility checker questions
const QUESTIONS = [
  { id: 'citizen', text: 'Are you a Bahamian citizen?', options: ['Yes', 'Permanent Resident', 'Non-Bahamian'] },
  { id: 'income', text: 'What is your approximate annual income?', options: ['Under $30,000', '$30,000–$60,000', '$60,000–$100,000', 'Over $100,000'] },
  { id: 'employment', text: 'What is your employment status?', options: ['Salaried employee', 'Government employee', 'Self-employed', 'Business owner'] },
  { id: 'amount', text: 'How much do you need to finance?', options: ['Under $100,000', '$100,000–$200,000', '$200,000–$400,000', 'Over $400,000'] },
  { id: 'island', text: 'Where is the property?', options: ['Nassau / New Providence', 'Grand Bahama', 'Family Island', 'Multiple locations'] },
]

function getRecommendations(answers: Record<string, string>): { lender: string; reason: string; priority: number }[] {
  const recs: { lender: string; reason: string; priority: number }[] = []

  const isFamily = answers.island?.includes('Family')
  const income = answers.income || ''
  const amount = answers.amount || ''
  const employment = answers.employment || ''
  const citizen = answers.citizen || ''

  if (citizen === 'Yes' || citizen === 'Permanent Resident') {
    if (income === 'Under $30,000' || income === '$30,000–$60,000') {
      recs.push({ lender: 'NIB Housing Loan', reason: 'Best fit for your income range. NIB accepts contributors at your income level and offers competitive rates.', priority: 1 })
      recs.push({ lender: 'Bahamas Mortgage Corporation', reason: 'BMC is designed for working Bahamians and will consider your application even if banks decline.', priority: 2 })
    }
    if (income === '$30,000–$60,000' || income === '$60,000–$100,000') {
      recs.push({ lender: 'Bahamas Mortgage Corporation', reason: 'Your income likely qualifies for BMC. Lower rates than commercial banks.', priority: 1 })
      recs.push({ lender: 'Commonwealth Bank', reason: 'Most active residential lender — worth applying simultaneously with BMC.', priority: 2 })
    }
    if (income === '$60,000–$100,000' || income === 'Over $100,000') {
      recs.push({ lender: 'Commercial Bank', reason: 'Your income qualifies for commercial bank rates. Pre-qualify at multiple banks for best rate.', priority: 1 })
      if (employment === 'Self-employed' || employment === 'Business owner') {
        recs.push({ lender: 'Fidelity Bank', reason: 'Fidelity has the strongest track record with self-employed applicants in the Bahamas.', priority: 1 })
      }
    }
    if (employment === 'Government employee') {
      recs.push({ lender: 'Scotiabank', reason: 'Scotiabank consistently offers competitive rates for government employees with salary deduction options.', priority: 1 })
    }
  }

  if (isFamily) {
    recs.push({ lender: 'Bahamas Mortgage Corporation', reason: 'BMC has dedicated Family Island programs and will lend where commercial banks often do not.', priority: 1 })
    recs.push({ lender: 'Vendor Financing', reason: 'On Family Islands, vendor financing is common and can be faster when institutional lenders are unavailable.', priority: 2 })
  }

  if (amount === 'Under $100,000' && citizen === 'Yes') {
    recs.unshift({ lender: 'NIB Housing Loan', reason: 'Your financing need fits within the NIB loan limit. Apply here first — lowest rates for qualifying contributors.', priority: 0 })
  }

  // Deduplicate
  const seen = new Set<string>()
  return recs.filter(r => { if (seen.has(r.lender)) return false; seen.add(r.lender); return true })
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)
}

export default function FinancingPage() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showRecs, setShowRecs] = useState(false)
  const [activeLender, setActiveLender] = useState(0)

  const answered = Object.keys(answers).length
  const recommendations = getRecommendations(answers)

  return (
    <div className="min-h-screen pt-24 pb-24" style={{ background: 'var(--navy)' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--navy) 0%, #0a1f3c 100%)', borderBottom: '1px solid var(--cyan-border)', padding: '60px 24px' }}>
        <div className="max-w-4xl mx-auto">
          <div className="section-label mb-4">Construction Financing</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '16px' }}>
            How to Finance Your Build
          </h1>
          <p style={{ fontSize: '1.15rem', color: 'var(--text-secondary)', maxWidth: 580, marginBottom: '32px' }}>
            NIB loans. BMC mortgages. Commercial banks. Vendor financing. Most Bahamians don&apos;t know all their options — or how to stack them. This page explains everything.
          </p>
          <div className="flex flex-wrap gap-4">
            <button onClick={() => document.getElementById('eligibility')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-block px-6 py-3 rounded-sm font-bold text-sm"
              style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
              Check My Options →
            </button>
            <Link href="/advisor" className="inline-block px-6 py-3 rounded-sm font-bold text-sm" style={{ border: '1px solid var(--cyan-border)', color: 'var(--text-secondary)' }}>
              Ask the Advisor
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-16 space-y-20">

        {/* Comparison table */}
        <section>
          <div className="section-label mb-4">Lender Comparison</div>
          <h2 className="text-3xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>Your Financing Options at a Glance</h2>
          <div className="overflow-x-auto">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--navy-card)' }}>
                  {['', 'NIB', 'BMC', 'Commercial Bank', 'Vendor'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--cyan)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--cyan-border)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Max Amount', '$100,000', '$250,000', 'Varies', 'Negotiated'],
                  ['Rate', '5–7%', '5.5–7.5%', 'Prime +1–3%', 'Higher, negotiated'],
                  ['Processing', '60–90 days', '60–120 days', '30–60 days', 'Weeks'],
                  ['Who Qualifies', 'NIB contributors', 'Bahamian citizens', 'Income + credit', 'Anyone (seller decides)'],
                  ['Best For', 'First-time builders', 'Those banks decline', 'Larger loans', 'Family Islands'],
                ].map(([label, ...cells], i) => (
                  <tr key={label} style={{ background: i % 2 === 0 ? 'var(--navy-surface)' : 'var(--navy-card)' }}>
                    <td style={{ padding: '10px 16px', color: 'var(--muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid rgba(0,212,245,0.06)' }}>{label}</td>
                    {cells.map((cell, j) => (
                      <td key={j} style={{ padding: '10px 16px', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(0,212,245,0.06)' }}>{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Lender details tabs */}
        <section>
          <div className="section-label mb-4">Lender Details</div>
          <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Deep Dive: Each Option</h2>

          <div className="flex gap-2 mb-6 flex-wrap">
            {LENDERS.map((l, i) => (
              <button key={l.shortName} onClick={() => setActiveLender(i)}
                className="px-4 py-2 rounded-sm text-sm font-bold"
                style={{ background: activeLender === i ? l.accent : 'var(--navy-surface)', color: activeLender === i ? (l.accent === 'var(--amber)' ? '#1a0f00' : 'var(--navy)') : 'var(--text-secondary)', border: `1px solid ${activeLender === i ? l.accent : 'var(--cyan-border)'}` }}>
                {l.shortName}
              </button>
            ))}
          </div>

          {LENDERS.map((lender, i) => i !== activeLender ? null : (
            <div key={lender.name} className="rounded-sm overflow-hidden" style={{ border: `1px solid ${lender.accent}40` }}>
              <div style={{ background: `linear-gradient(135deg, ${lender.accent}12 0%, transparent 100%)`, borderBottom: `1px solid ${lender.accent}30`, padding: '20px 24px' }}>
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-sm" style={{ background: `${lender.accent}20`, color: lender.accent }}>{lender.type}</span>
                    <h3 className="text-xl font-bold mt-2" style={{ color: 'var(--text-primary)' }}>{lender.name}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
                    <span style={{ color: 'var(--muted)' }}>Max: <strong style={{ color: 'var(--text-primary)' }}>{lender.maxAmount}</strong></span>
                    <span style={{ color: 'var(--muted)' }}>Rate: <strong style={{ color: 'var(--text-primary)' }}>{lender.rate}</strong></span>
                    <span style={{ color: 'var(--muted)' }}>Processing: <strong style={{ color: 'var(--text-primary)' }}>{lender.processing}</strong></span>
                    <span style={{ color: 'var(--muted)' }}>Contact: <strong style={{ color: lender.accent }}>{lender.contact}</strong></span>
                  </div>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: lender.accent }}>Key Details</p>
                  <ul className="space-y-2">
                    {lender.details.map((d, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <CheckCircle size={13} strokeWidth={2} style={{ color: lender.accent, marginTop: 3, flexShrink: 0 }} />{d}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: lender.accent }}>Required Documents</p>
                  <ul className="space-y-2">
                    {lender.documents.map((d, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <span className="text-xs font-bold shrink-0 mt-0.5" style={{ color: lender.accent }}>{j + 1}.</span>{d}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4 p-3 rounded-sm" style={{ background: 'var(--navy-card)', border: '1px solid var(--cyan-border)' }}>
                    <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--text-primary)' }}>{lender.address}</p>
                    <p style={{ color: lender.accent, fontSize: '0.85rem', fontWeight: 700 }}>{lender.contact}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Construction loan draws */}
        <section>
          <div className="section-label mb-4">Construction Loans</div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>How Construction Draw Loans Work</h2>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
            Construction loans release funds in stages as your build progresses. A bank inspector must sign off at each stage before the next draw is released. This protects the bank — and you. Interest-only payments during construction; converts to a permanent mortgage on completion.
          </p>
          <div className="space-y-3">
            {CONSTRUCTION_DRAWS.map((draw, i) => (
              <div key={i} className="flex gap-4 p-4 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black shrink-0" style={{ background: 'var(--cyan)', color: 'var(--navy)', fontSize: '0.9rem' }}>{i + 1}</div>
                <div>
                  <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{draw.stage}: {draw.milestone}</p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{draw.detail}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 p-4 rounded-sm" style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid var(--amber)' }}>
            <p className="font-bold text-sm mb-1" style={{ color: 'var(--amber)' }}>Total timeline: 12–24 months</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Construction loans require patience. Build delays mean interest-only payments continue. Budget your carrying costs carefully.</p>
          </div>
        </section>

        {/* Stacking strategy */}
        <section>
          <div className="section-label mb-4">Strategy</div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Stacking Financing Sources</h2>
          <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>
            This is accessible to working Bahamians earning $40,000–$60,000/year. Most people don&apos;t know you can combine these sources:
          </p>
          <div className="mb-6 p-4 rounded-sm" style={{ background: 'rgba(0,212,245,0.04)', border: '1px solid var(--cyan-border)' }}>
            <p className="font-bold text-sm" style={{ color: 'var(--cyan)' }}>This combination is not widely understood. Groundwork explaining it clearly is a genuine public service.</p>
          </div>
          <div className="space-y-4">
            {STACKING_STEPS.map((step, i) => (
              <div key={i} className="flex gap-4 p-5 rounded-sm" style={{ background: 'var(--navy-surface)', border: `1px solid ${step.color}40` }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-black shrink-0" style={{ background: step.color, color: step.color === 'var(--amber)' ? '#1a0f00' : 'var(--navy)', fontSize: '0.85rem' }}>{i + 1}</div>
                <div>
                  <p className="font-bold text-sm" style={{ color: step.color }}>{step.label}</p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>{step.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Eligibility checker */}
        <section id="eligibility">
          <div className="section-label mb-4">Eligibility Checker</div>
          <h2 className="text-3xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>What&apos;s the Best Option for Me?</h2>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>Answer 5 quick questions and we&apos;ll recommend the best financing path for your situation.</p>

          <div className="space-y-6">
            {QUESTIONS.map(q => (
              <div key={q.id}>
                <p className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>{q.text}</p>
                <div className="flex flex-wrap gap-2">
                  {q.options.map(opt => (
                    <button key={opt} onClick={() => { setAnswers(prev => ({ ...prev, [q.id]: opt })); setShowRecs(false) }}
                      className="px-4 py-2 rounded-sm text-sm font-bold transition-all"
                      style={{ background: answers[q.id] === opt ? 'var(--cyan)' : 'var(--navy-surface)', color: answers[q.id] === opt ? 'var(--navy)' : 'var(--text-secondary)', border: `1px solid ${answers[q.id] === opt ? 'var(--cyan)' : 'var(--cyan-border)'}` }}>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={() => setShowRecs(true)}
              disabled={answered < 3}
              className="w-full py-4 rounded-sm font-bold text-sm"
              style={{ background: answered >= 3 ? 'var(--cyan)' : 'var(--navy-card)', color: answered >= 3 ? 'var(--navy)' : 'var(--muted)', border: '1px solid var(--cyan-border)' }}>
              {answered < 3 ? `Answer ${3 - answered} more question${3 - answered > 1 ? 's' : ''} to continue` : 'Show My Recommended Options →'}
            </button>

            {showRecs && recommendations.length > 0 && (
              <div className="space-y-4 pt-2">
                <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Based on your answers:</p>
                {recommendations.map((rec, i) => (
                  <div key={i} className="p-5 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-black px-2 py-0.5 rounded-sm" style={{ background: 'rgba(0,212,245,0.15)', color: 'var(--cyan)' }}>#{i + 1}</span>
                      <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{rec.lender}</p>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{rec.reason}</p>
                  </div>
                ))}
                <Link href="/advisor" className="flex items-center justify-center gap-2 py-3 rounded-sm font-bold text-sm" style={{ border: '1px solid var(--cyan-border)', color: 'var(--cyan)' }}>
                  Ask the Advisor for Detailed Guidance <ArrowRight size={14} />
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Grants */}
        <section>
          <div className="section-label mb-4">Grants & Assistance</div>
          <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Government Grants & Housing Assistance</h2>
          <div className="space-y-4">
            {GRANTS.map((g, i) => (
              <div key={i} className="p-5 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
                <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{g.name}</p>
                <p className="text-sm mb-2" style={{ color: 'var(--text-secondary)' }}>{g.desc}</p>
                <p className="text-xs" style={{ color: 'var(--cyan)' }}>{g.contact}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Duty exemption CTA */}
        <section>
          <div className="p-8 rounded-sm" style={{ background: 'linear-gradient(135deg, rgba(5,150,105,0.08) 0%, var(--navy-surface) 100%)', border: '1px solid rgba(5,150,105,0.4)' }}>
            <div className="section-label mb-3" style={{ color: '#059669' }}>Apply Before You Budget</div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>First-Time Homeowner? Apply for Duty Exemption First</h2>
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>
              Before you finalise your project budget or apply for a mortgage — apply for your first-time homeowner duty exemption. Savings of $15,000–$40,000 on materials reduce your total project cost, which means a smaller mortgage and lower monthly payments for the life of your loan.
            </p>
            <Link href="/duty-exemptions" className="inline-flex items-center gap-2 px-6 py-3 rounded-sm font-bold text-sm" style={{ background: '#059669', color: 'white' }}>
              Learn About Duty Exemptions <ArrowRight size={14} />
            </Link>
          </div>
        </section>

        {/* Advisor CTA */}
        <section>
          <div className="p-8 rounded-sm text-center" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
            <p className="section-label mb-3">Still unsure?</p>
            <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Ask the Groundwork Advisor</h2>
            <p className="mb-6 max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Every financing situation is different — income type, family island, self-employed, title issues. The Groundwork Advisor knows Bahamian financing and can give you specific guidance for your situation.
            </p>
            <Link href="/advisor" className="inline-flex items-center gap-2 px-8 py-3 rounded-sm font-bold text-sm" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
              Ask About My Specific Situation <ArrowRight size={14} />
            </Link>
          </div>
        </section>

      </div>
    </div>
  )
}
