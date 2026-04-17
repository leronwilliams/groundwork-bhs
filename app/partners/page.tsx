import { prisma } from '@/lib/db'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const CATEGORY_META: Record<string, { label: string; desc: string; accent: string }> = {
  hardware:    { label: 'Hardware Suppliers',   desc: 'Building materials, tools, roofing, lumber', accent: 'var(--cyan)' },
  hvac:        { label: 'HVAC & Air Conditioning', desc: 'Mini-splits, central air, ventilation, refrigeration', accent: '#6366f1' },
  mep:         { label: 'MEP Suppliers',        desc: 'Mechanical, electrical, plumbing materials', accent: '#0891b2' },
  solar:       { label: 'Solar & Energy',       desc: 'Solar panels, batteries, inverters, installation', accent: '#059669' },
  paint:       { label: 'Paint & Coatings',     desc: 'Interior, exterior, primers, sealers', accent: '#e879f9' },
  tile:        { label: 'Tile & Flooring',      desc: 'Ceramic, porcelain, marble, vinyl, laminate', accent: '#f97316' },
  equipment:   { label: 'Equipment Rental',     desc: 'Scaffolding, concrete mixers, generators, tools', accent: 'var(--amber)' },
  architect:   { label: 'Architects & Designers', desc: 'Licensed architects, interior designers, planners', accent: '#ec4899' },
  qs:          { label: 'Quantity Surveyors',   desc: 'Certified QS for formal BOQ and cost management', accent: '#8b5cf6' },
  attorney:    { label: 'Attorneys',            desc: 'Real estate, construction, conveyancing law', accent: '#64748b' },
  mortgage:    { label: 'Mortgage & Finance',   desc: 'Mortgage brokers, construction lenders, NIB advisors', accent: '#059669' },
  insurance:   { label: 'Insurance',            desc: 'Property, construction, liability insurance', accent: 'var(--cyan)' },
  realtor:     { label: 'Realtors',             desc: 'Licensed real estate agents across all islands', accent: 'var(--amber)' },
  contractor:  { label: 'General Contractors',  desc: 'Licensed general contractors and builders', accent: '#f59e0b' },
}

export default async function PartnersPage() {
  const partners = await prisma.partner.findMany({
    where: { approved: true, active: true },
    orderBy: [{ tier: 'asc' }, { businessName: 'asc' }],
  })

  const grouped = partners.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = []
    acc[p.category].push(p)
    return acc
  }, {} as Record<string, typeof partners>)

  const categories = Object.keys(CATEGORY_META).filter(c => grouped[c]?.length > 0)

  return (
    <div className="min-h-screen pt-24 pb-24" style={{ background: 'var(--navy)' }}>
      {/* Hero */}
      <div style={{ borderBottom: '1px solid var(--cyan-border)', padding: '48px 24px 40px' }}>
        <div className="max-w-5xl mx-auto">
          <div className="section-label mb-4">Partner Network</div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--text-primary)', marginBottom: '16px' }}>
            Trusted Partners
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: 560 }}>
            Hardware stores, HVAC suppliers, architects, attorneys, mortgage lenders — verified Bahamian businesses trusted by the Groundwork community.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 mt-12">
        {categories.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Partner directory launching soon</p>
            <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>We are verifying our first wave of partner businesses. Check back soon.</p>
            <Link href="/partners/join" className="inline-block px-6 py-3 rounded-sm font-bold text-sm" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
              Apply to Become a Partner
            </Link>
          </div>
        ) : (
          <div className="space-y-16">
            {categories.map(cat => {
              const meta = CATEGORY_META[cat]
              const catPartners = grouped[cat]
              return (
                <section key={cat}>
                  <div className="flex items-end justify-between mb-6">
                    <div>
                      <div className="section-label mb-1" style={{ color: meta.accent }}>{meta.label}</div>
                      <p className="text-sm" style={{ color: 'var(--muted)' }}>{meta.desc}</p>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>{catPartners.length} partner{catPartners.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {catPartners.map(partner => (
                      <div key={partner.id} className="p-5 rounded-sm flex flex-col" style={{ background: 'var(--navy-surface)', border: `1px solid ${meta.accent}30` }}>
                        {/* Logo or placeholder */}
                        <div className="w-12 h-12 rounded-sm mb-4 flex items-center justify-center" style={{ background: `${meta.accent}15`, border: `1px solid ${meta.accent}30` }}>
                          {partner.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={partner.logoUrl} alt={partner.businessName} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 2 }} />
                          ) : (
                            <span className="text-xs font-black" style={{ color: meta.accent }}>{partner.businessName.charAt(0)}</span>
                          )}
                        </div>
                        {partner.tier === 'featured' || partner.tier === 'premium' ? (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-sm inline-block mb-2 self-start" style={{ background: `${meta.accent}20`, color: meta.accent }}>
                            {partner.tier === 'premium' ? '★ Premium Partner' : '✓ Featured Partner'}
                          </span>
                        ) : null}
                        <h3 className="font-bold text-base mb-1" style={{ color: 'var(--text-primary)' }}>{partner.businessName}</h3>
                        <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>{partner.island}</p>
                        {partner.description && (
                          <p className="text-sm leading-relaxed flex-1 mt-2" style={{ color: 'var(--text-secondary)' }}>
                            {partner.description.slice(0, 100)}{partner.description.length > 100 ? '...' : ''}
                          </p>
                        )}
                        {partner.website && (
                          <a href={partner.website} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 mt-4 text-xs font-bold"
                            style={{ color: meta.accent }}>
                            Visit Website <ArrowRight size={12} />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )
            })}
          </div>
        )}

        {/* Become a partner CTA */}
        <div className="mt-20 p-10 rounded-sm text-center" style={{ background: 'linear-gradient(135deg, var(--navy-surface) 0%, rgba(0,212,245,0.05) 100%)', border: '1px solid var(--cyan-border)' }}>
          <div className="section-label mb-3">Grow Your Business</div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Become a Groundwork Partner</h2>
          <p className="mb-6 max-w-lg mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Reach homeowners, developers, and contractors actively planning Bahamian construction projects. Featured listings, ad placements, and referral tracking from $99/month.
          </p>
          <Link href="/partners/join" className="inline-flex items-center gap-2 px-8 py-3 rounded-sm font-bold text-sm" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
            Apply to Join the Partner Network <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}
