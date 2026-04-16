import Link from 'next/link'
import { VideoHero } from '@/components/ui/VideoHero'
import { BlueprintCard } from '@/components/ui/BlueprintCard'
import { IslandTag } from '@/components/ui/IslandTag'
import { BeforeAfter } from '@/components/ui/BeforeAfter'

const FEATURE_CARDS = [
  { category: 'legal', title: 'Legal & Land', desc: 'Title searches, quiet title, conveyancing, and stamp duty.', href: '/guides?cat=legal' },
  { category: 'finance', title: 'Financing', desc: 'Mortgages, construction loans, BMC, and bank options.', href: '/guides?cat=finance' },
  { category: 'design', title: 'Design & Plans', desc: 'Building code basics, architect requirements, drawings.', href: '/guides?cat=design' },
  { category: 'permits', title: 'Permits', desc: 'Planning permission, building permits, utility connections.', href: '/permits' },
  { category: 'contractors', title: 'Contractors', desc: 'Find verified masons, electricians, and general contractors.', href: '/contractors' },
  { category: 'insurance', title: 'Insurance', desc: 'Construction insurance requirements and coverage types.', href: '/guides?cat=insurance' },
]

const ISLAND_NAMES = ['Abaco', 'Exuma', 'Eleuthera', 'Andros', 'Long Island', 'Bimini']

export default function HomePage() {
  return (
    <div>
      {/* Section 1 — Video Hero */}
      <VideoHero
        fallbackImage="https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1920"
      >
        <div className="flex flex-col items-center justify-center min-h-screen text-center px-6">
          <div
            className="text-xs uppercase tracking-widest mb-6 px-3 py-1 rounded-sm font-mono"
            style={{ color: 'var(--cyan)', border: '1px solid var(--cyan-border)', background: 'var(--cyan-dim)' }}
          >
            The Bahamas Construction & Property Platform
          </div>
          <h1 className="text-6xl md:text-8xl font-bold mb-4 leading-none" style={{ fontFamily: 'Syne, sans-serif' }}>
            Build right.
          </h1>
          <h2 className="text-4xl md:text-5xl font-bold mb-6" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--cyan)' }}>
            From the ground up.
          </h2>
          <p className="text-lg md:text-xl mb-10 max-w-2xl" style={{ color: 'rgba(226,232,240,0.8)' }}>
            The complete guide to building, renovating, and owning property in the Bahamas. 
            Permits, contractors, property tax, legal — all in one place.
          </p>
          <div className="flex gap-4 flex-wrap justify-center">
            <Link
              href="/dashboard"
              className="px-8 py-4 rounded-sm text-lg font-semibold transition-all"
              style={{ background: 'var(--cyan)', color: 'var(--navy)' }}
            >
              Start Your Project
            </Link>
            <Link
              href="/advisor"
              className="px-8 py-4 rounded-sm text-lg font-semibold transition-all"
              style={{ border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}
            >
              Ask the Advisor
            </Link>
          </div>
        </div>
      </VideoHero>

      {/* Section 2 — Before & After */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-xs uppercase tracking-widest mb-3 font-mono" style={{ color: 'var(--cyan)' }}>
            Real Transformations
          </div>
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
            See what&apos;s possible
          </h2>
          <p className="mb-12 max-w-xl" style={{ color: 'var(--muted)' }}>
            Renovation projects across Nassau and the Family Islands — from concept to completion.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BeforeAfter
              beforeSrc="https://images.pexels.com/photos/1797428/pexels-photo-1797428.jpeg?auto=compress&cs=tinysrgb&w=800"
              afterSrc="https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=800"
            />
            <BeforeAfter
              beforeSrc="https://images.pexels.com/photos/2523959/pexels-photo-2523959.jpeg?auto=compress&cs=tinysrgb&w=800"
              afterSrc="https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=800"
            />
            <BeforeAfter
              beforeSrc="https://images.pexels.com/photos/259580/pexels-photo-259580.jpeg?auto=compress&cs=tinysrgb&w=800"
              afterSrc="https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=800"
            />
          </div>
        </div>
      </section>

      {/* Section 3 — Feature Cards */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-xs uppercase tracking-widest mb-3 font-mono" style={{ color: 'var(--cyan)' }}>
            Everything You Need
          </div>
          <h2 className="text-4xl font-bold mb-12" style={{ fontFamily: 'Syne, sans-serif' }}>
            The complete toolkit
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURE_CARDS.map(card => (
              <Link key={card.category} href={card.href}>
                <BlueprintCard category={card.category} title={card.title}>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>{card.desc}</p>
                  <span className="inline-block mt-4 text-sm" style={{ color: 'var(--cyan)' }}>
                    Explore →
                  </span>
                </BlueprintCard>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 — Property Tax Callout */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div
            className="rounded-sm p-10 relative overflow-hidden"
            style={{ background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.3)' }}
          >
            <div className="relative z-10 max-w-2xl">
              <div className="text-xs uppercase tracking-widest mb-3 font-mono" style={{ color: 'var(--amber)' }}>
                Real Property Tax · Due March 31
              </div>
              <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
                Do you know what you owe?
              </h2>
              <p className="mb-6" style={{ color: 'rgba(226,232,240,0.8)' }}>
                Real Property Tax is due every year by March 31. Owner-occupied residential properties 
                under $300,000 are exempt — but everything above that threshold is taxed. 
                Don&apos;t get caught with a lien.
              </p>
              <Link
                href="/property-tax"
                className="inline-block px-6 py-3 rounded-sm font-semibold transition-all"
                style={{ background: 'var(--amber)', color: 'var(--navy)' }}
              >
                Calculate Your Property Tax
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Section 5 — Family Islands Banner */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div
            className="rounded-sm p-12 text-center"
            style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}
          >
            <div className="text-xs uppercase tracking-widest mb-3 font-mono" style={{ color: 'var(--cyan)' }}>
              Family Islands
            </div>
            <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
              The only platform covering out-island construction
            </h2>
            <p className="mb-8 max-w-xl mx-auto" style={{ color: 'var(--muted)' }}>
              Every island has different permit processes, contractor availability, material logistics, 
              and Commissioner approvals. We cover them all.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              {ISLAND_NAMES.map(island => (
                <IslandTag key={island} island={island} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Section 6 — AI Advisor Callout */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-xs uppercase tracking-widest mb-3 font-mono" style={{ color: 'var(--cyan)' }}>
                AI Build Advisor
              </div>
              <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
                Ask anything about building in the Bahamas.
              </h2>
              <p className="mb-6" style={{ color: 'var(--muted)' }}>
                Our AI advisor knows the Building Code, permit process, property tax law, land titles, 
                contractor standards, and Family Island requirements — in depth. Available 24/7.
              </p>
              <Link
                href="/advisor"
                className="inline-block px-6 py-3 rounded-sm font-semibold transition-all"
                style={{ background: 'var(--cyan)', color: 'var(--navy)' }}
              >
                Meet the Advisor
              </Link>
            </div>
            {/* Static advisor mockup */}
            <div
              className="rounded-sm p-6"
              style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}
            >
              <div className="space-y-4">
                {[
                  { role: 'user', text: 'What permits do I need to build in Nassau?' },
                  { role: 'assistant', text: 'For a residential build in Nassau, you typically need three permits in sequence: Planning Permission from the Ministry of Works (8-16 weeks), a Building Permit once planning is approved, and separate utility connection approvals from BPL and WSC...' },
                ].map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="text-sm px-3 py-2 rounded-sm max-w-[85%]"
                      style={{
                        background: msg.role === 'user' ? 'var(--cyan)' : 'var(--navy-card)',
                        color: msg.role === 'user' ? 'var(--navy)' : 'var(--text)',
                        border: msg.role === 'assistant' ? '1px solid var(--cyan-border)' : 'none',
                      }}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div
                  className="text-xs text-center py-2 rounded-sm"
                  style={{ color: 'var(--cyan)', border: '1px dashed var(--cyan-border)' }}
                >
                  Streaming response…
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 7 — Photo Gallery */}
      <section className="py-16 px-6 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-xs uppercase tracking-widest mb-3 font-mono" style={{ color: 'var(--cyan)' }}>
            Bahamian Homes
          </div>
          <h2 className="text-4xl font-bold mb-10" style={{ fontFamily: 'Syne, sans-serif' }}>
            Built in the Bahamas
          </h2>
          <div className="columns-2 md:columns-3 gap-4 space-y-4">
            {[
              'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=600',
              'https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=600',
              'https://images.pexels.com/photos/2121121/pexels-photo-2121121.jpeg?auto=compress&cs=tinysrgb&w=600',
              'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=600',
              'https://images.pexels.com/photos/106399/pexels-photo-106399.jpeg?auto=compress&cs=tinysrgb&w=600',
              'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=600',
              'https://images.pexels.com/photos/1475938/pexels-photo-1475938.jpeg?auto=compress&cs=tinysrgb&w=600',
              'https://images.pexels.com/photos/2635038/pexels-photo-2635038.jpeg?auto=compress&cs=tinysrgb&w=600',
              'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=600',
            ].map((src, i) => (
              <div
                key={i}
                className="relative overflow-hidden rounded-sm group"
                style={{ border: '1px solid var(--cyan-border)', breakInside: 'avoid' }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`Bahamian home ${i + 1}`}
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3"
                  style={{ background: 'linear-gradient(to top, rgba(10,22,40,0.8), transparent)' }}
                >
                  <IslandTag island={i % 3 === 0 ? 'Exuma' : i % 3 === 1 ? 'New Providence' : 'Abaco'} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6" style={{ borderTop: '1px solid var(--cyan-border)' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <div className="text-lg font-semibold mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>Groundwork</div>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>Build right. From the ground up.</div>
          </div>
          <div className="flex gap-6 text-sm" style={{ color: 'var(--muted)' }}>
            <Link href="/guides">Guides</Link>
            <Link href="/permits">Permits</Link>
            <Link href="/property-tax">Property Tax</Link>
            <Link href="/contractors">Contractors</Link>
            <Link href="/advisor">Advisor</Link>
          </div>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>
            © 2026 Groundwork BHS
          </div>
        </div>
      </footer>
    </div>
  )
}
