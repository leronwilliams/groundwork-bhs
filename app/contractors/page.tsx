import { prisma } from '@/lib/db'
import { BlueprintCard } from '@/components/ui/BlueprintCard'
import { IslandTag } from '@/components/ui/IslandTag'
import { SectionBadge } from '@/components/ui/SectionBadge'
import { CheckCircle, Lock, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export const revalidate = 60

export default async function ContractorsPage() {
  const contractors = await prisma.contractor.findMany({ orderBy: [{ featuredTier: 'asc' }, { name: 'asc' }] })

  const featured = contractors.filter(c => c.featuredTier)
  const regular = contractors.filter(c => !c.featuredTier)

  return (
    <div className="min-h-screen pt-24 pb-20 px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-xs uppercase tracking-widest mb-3 font-mono" style={{ color: 'var(--amber)' }}>
          Contractors
        </div>
        <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
          Find a Contractor
        </h1>
        <p className="mb-12 text-lg" style={{ color: 'var(--muted)' }}>
          Masons, electricians, plumbers, roofers, and general contractors across Nassau and the Family Islands.
        </p>

        {/* Featured */}
        {featured.length > 0 && (
          <div className="mb-12">
            <div className="text-xs uppercase tracking-wider mb-4 font-mono" style={{ color: 'var(--amber)' }}>
              Featured Contractors
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featured.map(c => (
                <div
                  key={c.id}
                  className="p-6 rounded-sm relative"
                  style={{ background: 'var(--amber-dim)', border: '1px solid rgba(245,158,11,0.4)' }}
                >
                  <div className="absolute top-3 right-3">
                    <span className="text-xs px-2 py-0.5 rounded-sm font-mono" style={{ background: 'var(--amber)', color: 'var(--navy)' }}>
                      Featured
                    </span>
                  </div>
                  <div className="flex items-start gap-4">
                    {c.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl} alt={c.name} className="w-16 h-16 rounded-sm object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>{c.name}</h2>
                      <div className="flex gap-2 flex-wrap mb-2">
                        <SectionBadge label={c.trade} />
                        <IslandTag island={c.island} />
                        {c.verified ? (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-sm" style={{ background: 'rgba(5,150,105,0.2)', color: '#059669' }}>
                        <CheckCircle size={12} strokeWidth={2} /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-sm" style={{ background: 'rgba(245,166,35,0.12)', color: 'var(--amber)' }}>
                        <AlertCircle size={12} strokeWidth={2} /> Pending verification
                      </span>
                    )}
                      </div>
                      {c.description && <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>{c.description}</p>}
                      <div className="flex gap-4 text-sm flex-wrap">
                        {c.phone && <a href={`tel:${c.phone}`} style={{ color: 'var(--cyan)' }}>{c.phone}</a>}
                        {c.email && <a href={`mailto:${c.email}`} style={{ color: 'var(--cyan)' }}>{c.email}</a>}
                        {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--cyan)' }}>Website →</a>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Regular listings */}
        {regular.length > 0 && (
          <div className="mb-16">
            <div className="text-xs uppercase tracking-wider mb-4 font-mono" style={{ color: 'var(--muted)' }}>
              All Contractors
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regular.map(c => (
                <BlueprintCard key={c.id}>
                  <div>
                    <h2 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>{c.name}</h2>
                    <div className="flex gap-2 flex-wrap mb-3">
                      <SectionBadge label={c.trade} />
                      <IslandTag island={c.island} />
                    </div>
                    {c.description && <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>{c.description}</p>}
                    <div className="flex gap-3 text-sm flex-wrap">
                      {c.phone && <a href={`tel:${c.phone}`} style={{ color: 'var(--cyan)' }}>{c.phone}</a>}
                      {c.email && <a href={`mailto:${c.email}`} style={{ color: 'var(--cyan)' }}>{c.email}</a>}
                    </div>
                  </div>
                </BlueprintCard>
              ))}
            </div>
          </div>
        )}

        {contractors.length === 0 && (
          <div
            className="text-center py-20 rounded-sm"
            style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}
          >
            <Lock size={40} style={{ color: 'var(--cyan)', margin: '0 auto 16px', opacity: 0.6 }} />
            <h2 className="text-2xl mb-3">Contractor Directory Coming Soon</h2>
            <p className="mb-6 max-w-md mx-auto" style={{ color: 'var(--text-secondary)' }}>
              We are verifying contractors across Nassau and the Family Islands. 
              All listings go through an approval process before they appear here.
            </p>
            <Link
              href="/advisor"
              className="inline-block px-6 py-3 rounded-sm font-bold text-sm"
              style={{ background: 'var(--cyan)', color: 'var(--navy)' }}
            >
              Ask the Advisor to find a contractor
            </Link>
          </div>
        )}

        {/* List your business */}
        <div
          className="p-8 rounded-sm text-center"
          style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}
        >
          <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>
            Are you a contractor or professional?
          </h2>
          <p className="mb-6" style={{ color: 'var(--muted)' }}>
            List your business on Groundwork and reach homeowners and developers across the Bahamas.
          </p>
          <Link
            href="/advisor"
            className="inline-block px-6 py-3 rounded-sm font-semibold"
            style={{ background: 'var(--cyan)', color: 'var(--navy)' }}
          >
            Contact us to list
          </Link>
        </div>
      </div>
    </div>
  )
}
