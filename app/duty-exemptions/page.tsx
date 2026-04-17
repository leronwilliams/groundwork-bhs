import Link from 'next/link'

const DUTY_RATES = [
  { material: 'Cement (94lb bag)', duty: '0%', vat: '10%', note: 'Essential material — duty-free', exempt: true },
  { material: 'Concrete Blocks (8")', duty: '0%', vat: '10%', note: 'Locally manufactured — no duty', exempt: true },
  { material: 'Steel Rebar', duty: '0–10%', vat: '10%', note: 'Varies by specification', exempt: true },
  { material: 'Lumber — Rough/Unfinished', duty: '10%', vat: '10%', note: 'Structural grade', exempt: true },
  { material: 'Lumber — Dressed/Finished', duty: '25%', vat: '10%', note: 'Interior finish grade', exempt: true },
  { material: 'Roofing Sheets (Galvanize)', duty: '10–15%', vat: '10%', note: 'Standard Bahamian roofing', exempt: true },
  { material: 'Windows & Doors (Imported)', duty: '25–45%', vat: '10%', note: 'Major duty item — budget carefully', exempt: true },
  { material: 'Electrical Wire & Fittings', duty: '10–25%', vat: '10%', note: 'Varies by type and specification', exempt: true },
  { material: 'PVC Plumbing Pipe', duty: '10%', vat: '10%', note: 'Standard grey PVC', exempt: true },
  { material: 'Ceramic & Porcelain Tile', duty: '25–45%', vat: '10%', note: 'High duty — significant cost on large homes', exempt: false },
  { material: 'Paint & Coatings', duty: '25–35%', vat: '10%', note: 'Interior and exterior', exempt: false },
  { material: 'HVAC & AC Units', duty: '25–45%', vat: '10%', note: 'Mini-splits, central air', exempt: false },
  { material: 'Generators', duty: '10–25%', vat: '10%', note: 'Standby and portable', exempt: false },
  { material: 'Solar Panels', duty: '0%', vat: '10%', note: 'Government incentive — duty-free', exempt: false },
  { material: 'Solar Batteries & Storage', duty: '0%', vat: '10%', note: 'Government incentive — duty-free', exempt: false },
]

const REQUIRED_DOCS = [
  'Proof of Bahamian citizenship (passport or identity card)',
  'Land title or deed of conveyance in your name',
  'Signed architectural plans from a licensed architect',
  'Contractor quotes for materials to be exempted',
  'Statutory declaration that this is your first home',
  'Completed duty exemption application form (from Customs)',
  'Bank finance letter (if using a mortgage)',
  'Floor plan showing property is for owner-occupation only',
]

const APPLICATION_STEPS = [
  {
    step: '1',
    title: 'Confirm eligibility',
    desc: 'You must be a Bahamian citizen purchasing or building your first home for owner-occupation. The property cannot be for rental or commercial use.',
  },
  {
    step: '2',
    title: 'Get your plans and quotes ready',
    desc: 'You will need signed architectural plans from a licensed Bahamian architect and written quotes from your contractor for all materials you intend to import.',
  },
  {
    step: '3',
    title: 'Visit Customs Department',
    desc: 'Go to the Customs Department, Custom House, Bay Street, Nassau. Tel: (242) 322-3598. Ask for the First-Time Homeowner Duty Exemption application form.',
  },
  {
    step: '4',
    title: 'Submit your application',
    desc: 'Submit all required documents. The application is reviewed by the Ministry of Finance. Processing typically takes 2–4 weeks.',
  },
  {
    step: '5',
    title: 'Receive your concession letter',
    desc: 'You receive an official concession letter from the Ministry of Finance listing the approved exemptions. Keep this letter — you will need it at the port when clearing materials.',
  },
  {
    step: '6',
    title: 'Import materials using your concession',
    desc: 'Present your concession letter to Customs when clearing each shipment. Duty will be waived on approved materials. Do not import before receiving this letter.',
  },
]

const COMMON_MISTAKES = [
  'Importing materials before receiving the concession letter — cannot claim exemption retroactively',
  'Applying for property that will be rented out — exemption is owner-occupation only',
  'Submitting unsigned or unapproved architectural plans',
  'Missing the statutory declaration — a sworn statement before a Commissioner of Oaths',
  'Not having the land title in your name at time of application',
  'Applying for ineligible materials — exemption covers structural materials, not fixtures/finishes like tile',
]

export default function DutyExemptionsPage() {
  return (
    <div className="min-h-screen pt-24 pb-24" style={{ background: 'var(--navy)' }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--navy) 0%, #0a1f3c 100%)', borderBottom: '1px solid var(--cyan-border)', padding: '60px 24px' }}>
        <div className="max-w-4xl mx-auto">
          <div className="section-label mb-4">Duty Exemptions & Tax</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '16px' }}>
            Save $15,000–$40,000<br />on Your Build
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', maxWidth: 580, marginBottom: '32px' }}>
            Most first-time Bahamian homeowners don&apos;t know they qualify for duty concessions on construction materials. This is one of the most valuable benefits you will ever get — and most people miss it.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/advisor" className="inline-flex items-center gap-2 px-6 py-3 rounded-sm font-bold text-sm" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
              Ask the Advisor About Your Situation
            </Link>
            <Link href="/guides/duty-exemption-first-time-homeowner-bahamas" className="inline-flex items-center gap-2 px-6 py-3 rounded-sm font-bold text-sm" style={{ border: '1px solid var(--cyan-border)', color: 'var(--text-secondary)' }}>
              Full Guide: How to Apply
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-16 space-y-20">

        {/* First-Time Exemption */}
        <section>
          <div className="section-label mb-4">First-Time Homeowner Exemption</div>
          <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>What Is the Duty Exemption?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="p-6 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
              <p className="text-4xl font-black mb-2" style={{ color: 'var(--cyan)' }}>$15k–$40k</p>
              <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Potential savings</p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Depending on project size and materials imported</p>
            </div>
            <div className="p-6 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
              <p className="text-4xl font-black mb-2" style={{ color: 'var(--amber)' }}>2–4 wks</p>
              <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Processing time</p>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>Apply before you order any materials</p>
            </div>
          </div>
          <div className="p-6 rounded-sm mb-8" style={{ background: 'rgba(0,212,245,0.05)', border: '1px solid var(--cyan-border)' }}>
            <p className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Under the Tariff Act, first-time Bahamian homeowners can apply for duty concessions on construction materials for their primary residence.</p>
            <p style={{ color: 'var(--text-secondary)' }}>The concession is administered by the Ministry of Finance and covers structural materials including cement, lumber, roofing, electrical, plumbing, and windows and doors. The key rule: <strong style={{ color: 'var(--amber)' }}>you must apply and receive approval before importing any materials</strong>. There is no retroactive claim.</p>
          </div>

          {/* Eligibility */}
          <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Who Qualifies?</h3>
          <div className="space-y-3 mb-8">
            {['Bahamian citizen (or spouse of a Bahamian citizen)', 'First time purchasing or building a home in the Bahamas', 'Property will be your primary residence — not a rental property', 'You have not previously claimed this exemption'].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid rgba(5,150,105,0.3)' }}>
                <span style={{ color: '#059669', fontWeight: 800, fontSize: '1.1rem', lineHeight: 1.3 }}>✓</span>
                <span style={{ color: 'var(--text-secondary)' }}>{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Step-by-step */}
        <section>
          <div className="section-label mb-4">Application Process</div>
          <h2 className="text-3xl font-bold mb-8" style={{ color: 'var(--text-primary)' }}>How to Apply — Step by Step</h2>
          <div className="space-y-4">
            {APPLICATION_STEPS.map(s => (
              <div key={s.step} className="flex gap-5 p-5 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center font-black shrink-0" style={{ background: 'var(--cyan)', color: 'var(--navy)', fontSize: '1.1rem' }}>{s.step}</div>
                <div>
                  <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{s.title}</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-5 rounded-sm" style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid var(--amber)' }}>
            <p className="font-bold mb-1" style={{ color: 'var(--amber)' }}>⚠️ Critical: Apply Before You Import Anything</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>The exemption cannot be claimed retroactively. If you buy materials before receiving your concession letter, you will pay full duty. Apply as soon as your land is secured and plans are ready.</p>
          </div>
        </section>

        {/* Required documents */}
        <section>
          <div className="section-label mb-4">Documents Required</div>
          <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>What to Bring</h2>
          <div className="space-y-3">
            {REQUIRED_DOCS.map((doc, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
                <div className="w-6 h-6 rounded-sm flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(0,212,245,0.15)', border: '1px solid var(--cyan-border)' }}>
                  <span className="text-xs font-bold" style={{ color: 'var(--cyan)' }}>{i + 1}</span>
                </div>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{doc}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 rounded-sm text-center" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
            <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>Contact Customs Department:</p>
            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Custom House, Bay Street, Nassau</p>
            <p style={{ color: 'var(--cyan)' }}>(242) 322-3598</p>
          </div>
        </section>

        {/* Duty rate table */}
        <section>
          <div className="section-label mb-4">Duty Rate Reference</div>
          <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Customs Duty on Construction Materials</h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>Rates are approximate. Always verify current rates with Customs before importing. All materials are also subject to 10% VAT.</p>
          <div className="rounded-sm overflow-hidden" style={{ border: '1px solid var(--cyan-border)' }}>
            <div className="grid grid-cols-4 gap-0" style={{ background: 'var(--navy-card)', borderBottom: '1px solid var(--cyan-border)' }}>
              {['Material', 'Duty', 'VAT', 'Exempt?'].map(h => (
                <div key={h} className="p-3 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--cyan)' }}>{h}</div>
              ))}
            </div>
            {DUTY_RATES.map((row, i) => (
              <div key={i} className="grid grid-cols-4 gap-0" style={{ background: i % 2 === 0 ? 'var(--navy-surface)' : 'var(--navy-card)', borderBottom: i < DUTY_RATES.length - 1 ? '1px solid rgba(0,212,245,0.08)' : 'none' }}>
                <div className="p-3 text-sm" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{row.material}</div>
                <div className="p-3 text-sm font-bold" style={{ color: row.duty === '0%' ? '#059669' : row.duty.includes('25') || row.duty.includes('45') ? '#ef4444' : 'var(--amber)' }}>{row.duty}</div>
                <div className="p-3 text-sm" style={{ color: 'var(--muted)' }}>+{row.vat}</div>
                <div className="p-3 text-sm font-bold" style={{ color: row.exempt ? '#059669' : 'var(--muted)' }}>{row.exempt ? '✓ Yes' : '—'}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>* &ldquo;Exempt?&rdquo; column shows eligibility for First-Time Homeowner Duty Exemption. Tile, paint, HVAC, and fixtures are not covered.</p>
        </section>

        {/* Solar */}
        <section>
          <div className="section-label mb-4" style={{ color: 'var(--amber)' }}>Solar Incentives</div>
          <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Solar Panels: 0% Duty</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
            {[
              { label: '0% Duty', sub: 'on panels & batteries', color: '#059669' },
              { label: '$8k–$15k', sub: 'typical installed cost (3kW)', color: 'var(--cyan)' },
              { label: '4–7 years', sub: 'payback through BPL savings', color: 'var(--amber)' },
            ].map(card => (
              <div key={card.label} className="p-5 rounded-sm text-center" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
                <p className="text-3xl font-black mb-1" style={{ color: card.color }}>{card.label}</p>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>{card.sub}</p>
              </div>
            ))}
          </div>
          <div className="p-6 rounded-sm" style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.4)' }}>
            <p className="font-bold mb-3" style={{ color: '#059669' }}>Building new? This is the best time to go solar.</p>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>When constructing a new home, you can integrate solar into the roof structure, run conduit during framing, and orient the roof for maximum panel efficiency. Adding solar later is more expensive and disruptive. A 3kW system handles the average Bahamian home. Pair with battery storage for full grid independence.</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>BPL operates a net metering program — excess power is sold back to the grid. Contact BPL: <span style={{ color: 'var(--cyan)' }}>(242) 302-1000</span></p>
          </div>
        </section>

        {/* VAT */}
        <section>
          <div className="section-label mb-4">VAT on Construction</div>
          <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>VAT — What You Need to Know</h2>
          <div className="space-y-4">
            {[
              { label: 'Construction services', detail: '10% VAT applies to all contractor work. If your contractor is VAT registered (billing >$100k/year), they must charge VAT on their invoices.' },
              { label: 'Materials purchased locally', detail: '10% VAT is included in the price of materials at most Nassau hardware stores. Always confirm with your supplier.' },
              { label: 'Request VAT receipts', detail: 'Always get VAT receipts from contractors and suppliers. You need these for your financial records and any future claims.' },
              { label: 'Cannot reclaim VAT', detail: 'Homeowners building a personal residence cannot currently claim back VAT. Only VAT-registered businesses can reclaim input VAT.' },
            ].map((item, i) => (
              <div key={i} className="p-5 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
                <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{item.label}</p>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Common mistakes */}
        <section>
          <div className="section-label mb-4">Common Mistakes</div>
          <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--text-primary)' }}>What Gets Applications Rejected</h2>
          <div className="space-y-3">
            {COMMON_MISTAKES.map((mistake, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-sm" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <span style={{ color: '#ef4444', fontWeight: 800, fontSize: '1rem' }}>✕</span>
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{mistake}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Financing callout */}
        <section>
          <div className="p-8 rounded-sm" style={{ background: 'linear-gradient(135deg, var(--navy-surface) 0%, rgba(0,212,245,0.05) 100%)', border: '1px solid var(--cyan-border)' }}>
            <div className="section-label mb-3">Financing Strategy</div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Apply for Exemption Before You Budget</h2>
            <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>If you qualify for the first-time homeowner duty exemption, your total project cost drops by $15,000–$40,000. A lower project cost means a smaller mortgage needed — which means lower monthly payments for the life of your loan. Apply for duty exemption as one of your first steps, before finalising your budget or applying for a mortgage.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Without exemption', val: '$180,000', sub: 'total project cost' },
                { label: 'Duty savings', val: '− $25,000', sub: 'if exemption approved', color: '#059669' },
                { label: 'With exemption', val: '$155,000', sub: 'lower mortgage needed', color: 'var(--cyan)' },
              ].map(c => (
                <div key={c.label} className="p-4 rounded-sm text-center" style={{ background: 'var(--navy-card)', border: '1px solid rgba(0,212,245,0.12)' }}>
                  <p className="text-2xl font-black mb-1" style={{ color: c.color || 'var(--text-primary)' }}>{c.val}</p>
                  <p className="text-xs font-bold uppercase tracking-wide mb-0.5" style={{ color: 'var(--muted)' }}>{c.label}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{c.sub}</p>
                </div>
              ))}
            </div>
            <Link href="/advisor" className="inline-block px-6 py-3 rounded-sm font-bold text-sm" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
              Ask the Advisor About Your Specific Situation
            </Link>
          </div>
        </section>

      </div>
    </div>
  )
}
