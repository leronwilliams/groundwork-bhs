import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { alternates: { canonical: '/' } }
import Image from 'next/image'
import { Scale, Landmark, DraftingCompass, FileCheck, HardHat, ShieldCheck, Calculator } from 'lucide-react'
import { VideoHero } from '@/components/ui/VideoHero'
import { IslandTag } from '@/components/ui/IslandTag'
import { HERO_IMAGE, CARD_IMAGES, PROPERTY_TAX_IMAGE } from '@/lib/site-images'

const FEATURE_CARDS = [
  { category: 'legal', title: 'Legal & Land', desc: 'Title searches, quiet title, conveyancing, and stamp duty.', href: '/guides?cat=legal', icon: Scale, image: CARD_IMAGES.legal },
  { category: 'finance', title: 'Financing', desc: 'Mortgages, construction loans, BMC, and bank options.', href: '/guides?cat=finance', icon: Landmark, image: CARD_IMAGES.finance },
  { category: 'design', title: 'Design & Plans', desc: 'Building code basics, architect requirements, drawings.', href: '/guides?cat=design', icon: DraftingCompass, image: CARD_IMAGES.design },
  { category: 'permits', title: 'Permits', desc: 'Planning permission, building permits, utility connections.', href: '/permits', icon: FileCheck, image: CARD_IMAGES.permits },
  { category: 'contractors', title: 'Contractors', desc: 'Find verified masons, electricians, and general contractors.', href: '/contractors', icon: HardHat, image: CARD_IMAGES.contractors },
  { category: 'insurance', title: 'Insurance', desc: 'Construction insurance requirements and coverage types.', href: '/guides?cat=insurance', icon: ShieldCheck, image: CARD_IMAGES.insurance },
]

const ISLAND_NAMES = ['Abaco', 'Exuma', 'Eleuthera', 'Andros', 'Long Island', 'Bimini']

export default function HomePage() {
  return (
    <div>
      {/* Section 1 — Video Hero */}
      <VideoHero fallbackImage={HERO_IMAGE.src} fallbackAlt={HERO_IMAGE.alt}>
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-6 pt-16">
          <div
            className="mb-8 inline-block"
            style={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#ffffff',
              background: 'rgba(0,212,245,0.15)',
              border: '1px solid rgba(0,212,245,0.5)',
              padding: '6px 16px',
              borderRadius: '4px',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            The Bahamas Construction &amp; Property Platform
          </div>
          <h1 className="mb-6" style={{ color: 'var(--text-bright)', textShadow: '0 2px 40px rgba(0,0,0,0.5)' }}>
            Build right.
          </h1>
          <div className="text-5xl md:text-6xl font-bold mb-8" style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, color: 'var(--cyan)', letterSpacing: '-0.02em' }}>
            From the ground up.
          </div>
          <p className="text-xl md:text-2xl mb-12 max-w-3xl" style={{ color: 'rgba(240,244,255,0.85)', lineHeight: 1.6, fontWeight: 400 }}>
            The complete guide to building, renovating, and owning property in the Bahamas. 
            Permits, contractors, property tax, legal — all in one place.
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Link
              href="/dashboard"
              className="btn-glow px-10 py-5 rounded-sm text-lg font-bold transition-all"
              style={{ background: 'var(--cyan)', color: 'var(--navy)', letterSpacing: '0.02em' }}
            >
              Start Your Project
            </Link>
            <Link
              href="/advisor"
              className="px-10 py-5 rounded-sm text-lg font-bold transition-all"
              style={{ border: '1.5px solid rgba(255,255,255,0.35)', color: 'white', backdropFilter: 'blur(10px)' }}
            >
              Ask the Advisor
            </Link>
          </div>

          {/* Stats bar */}
          <div className="mt-20 flex gap-12 flex-wrap justify-center">
            {[
              { num: '8+', label: 'Expert Guides' },
              { num: '6', label: 'Island Coverage' },
              { num: '24/7', label: 'AI Advisor' },
              { num: '100%', label: 'Bahamian Focus' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-4xl font-black mb-1" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--cyan)', letterSpacing: '-0.02em' }}>{stat.num}</div>
                <div style={{ color: 'rgba(240,244,255,0.6)', fontSize: '0.8rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </VideoHero>

      {/* Section 3 — Feature Cards with Photo Backgrounds */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="section-label mb-6">Everything You Need</div>
          <h2 className="mb-16">The complete toolkit</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURE_CARDS.map(card => {
              const Icon = card.icon
              return (
                <Link key={card.category} href={card.href} className="card-hover block">
                  <div
                    className="relative overflow-hidden rounded-sm"
                    style={{ border: '1px solid var(--cyan-border)', height: 280 }}
                  >
                    {/* Photo background */}
                    <Image
                      src={card.image.src}
                      alt={card.image.alt}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                    <div className="photo-card-overlay" />

                    {/* Content */}
                    <div className="absolute inset-0 z-10 p-7 flex flex-col justify-end">
                      <div
                        className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-md"
                        style={{ background: 'rgba(6,13,26,0.75)', border: '1px solid rgba(0,212,245,0.55)', boxShadow: '0 0 18px rgba(0,212,245,0.18)' }}
                      >
                        <Icon size={24} strokeWidth={2.25} style={{ color: 'var(--cyan)' }} />
                      </div>
                      <div className="section-label mb-2" style={{ color: 'var(--cyan)', fontSize: '0.7rem' }}>
                        {card.category}
                      </div>
                      <h3 className="text-2xl mb-2" style={{ color: 'white', fontWeight: 800, letterSpacing: '-0.01em' }}>
                        {card.title}
                      </h3>
                      <p className="text-sm" style={{ color: 'rgba(184,197,224,0.85)', lineHeight: 1.5 }}>
                        {card.desc}
                      </p>
                      <span className="mt-4 text-sm font-bold" style={{ color: 'var(--cyan)', letterSpacing: '0.05em' }}>
                        Explore →
                      </span>
                    </div>

                    {/* Corner brackets */}
                    <span className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 z-20" style={{ borderColor: 'var(--cyan)', opacity: 0.6 }} />
                    <span className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 z-20" style={{ borderColor: 'var(--cyan)', opacity: 0.6 }} />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Section 4 — Property Tax Callout */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div
            className="relative overflow-hidden rounded-sm"
            style={{ background: 'linear-gradient(135deg, #1a0f00 0%, #2d1a00 100%)', border: '1px solid rgba(245,166,35,0.35)' }}
          >
            {/* Background photo */}
            <Image
              src={PROPERTY_TAX_IMAGE.src}
              alt={PROPERTY_TAX_IMAGE.alt}
              fill
              sizes="(min-width: 1280px) 1280px, 100vw"
              className="object-cover opacity-25"
            />
            <div className="relative z-10 p-12 md:p-16 max-w-2xl">
              <div className="section-label mb-6" style={{ color: 'var(--amber)' }}>
                Real Property Tax · Due March 31
              </div>
              <h2 className="mb-6" style={{ fontWeight: 900 }}>
                Do you know what you owe?
              </h2>
              <p className="text-xl mb-10" style={{ color: 'rgba(240,244,255,0.85)', lineHeight: 1.7 }}>
                Real Property Tax is due every year by March 31. Owner-occupied residential 
                properties under $300,000 are exempt — but everything above that threshold is taxed. 
                Don&apos;t get caught with a lien.
              </p>
              <Link
                href="/property-tax"
                className="btn-amber-glow inline-flex items-center gap-3 px-8 py-4 rounded-sm font-bold text-lg transition-all"
                style={{ background: 'var(--amber)', color: 'var(--navy)' }}
              >
                <Calculator size={20} strokeWidth={2} />
                Calculate Your Property Tax
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5 — Family Islands Banner */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div
            className="rounded-sm p-6 sm:p-10 md:p-14 text-center"
            style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}
          >
            <div className="section-label mb-6">Family Islands</div>
            <h2 className="mb-6 max-w-3xl mx-auto">
              The only platform covering out-island construction
            </h2>
            <p className="text-xl mb-12 max-w-xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Every island has different permit processes, contractor availability, material logistics, 
              and Commissioner approvals. We cover them all.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              {ISLAND_NAMES.map(island => (
                <IslandTag key={island} island={island} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 6 — AI Advisor Callout */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="section-label mb-6">AI Build Advisor</div>
              <h2 className="mb-8">
                Ask anything about building in the Bahamas.
              </h2>
              <p className="text-xl mb-10" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Our AI advisor knows the Building Code, permit process, property tax law, land titles, 
                contractor standards, and Family Island requirements — in depth. Available 24/7.
              </p>
              <Link
                href="/advisor"
                className="btn-glow inline-block px-8 py-4 rounded-sm font-bold text-lg transition-all"
                style={{ background: 'var(--cyan)', color: 'var(--navy)' }}
              >
                Meet the Advisor
              </Link>
            </div>
            {/* Chat preview */}
            <div
              className="rounded-sm p-8"
              style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', boxShadow: '0 0 60px rgba(0,212,245,0.06)' }}
            >
              <div className="space-y-5">
                {[
                  { role: 'user', text: 'What permits do I need to build in Nassau?' },
                  { role: 'assistant', text: 'For a residential build in Nassau, you need three permits in sequence: Planning Permission from the Ministry of Works (8-16 weeks), a Building Permit, and separate BPL and WSC utility connection approvals...' },
                ].map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black mr-3 flex-shrink-0 mt-1"
                        style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>GW</div>
                    )}
                    <div
                      className="text-sm px-4 py-3 rounded-sm max-w-[85%]"
                      style={{
                        background: msg.role === 'user' ? 'var(--cyan)' : 'var(--navy-card)',
                        color: msg.role === 'user' ? 'var(--navy)' : 'var(--text-secondary)',
                        border: msg.role === 'assistant' ? '1px solid var(--cyan-border)' : 'none',
                        fontWeight: msg.role === 'user' ? 600 : 400,
                        lineHeight: 1.6,
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div className="text-xs text-center py-2 rounded-sm font-mono"
                  style={{ color: 'var(--cyan)', border: '1px dashed var(--cyan-border)' }}>
                  Streaming response — real answers, not scripts
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
