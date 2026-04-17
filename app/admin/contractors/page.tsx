import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function AdminContractorsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  await requireAdmin()
  const { filter } = await searchParams

  const where = filter === 'pending' ? { verified: false }
    : filter === 'verified' ? { verified: true }
    : filter === 'featured' ? { featuredTier: { not: null } }
    : {}

  const contractors = await prisma.contractor.findMany({
    where,
    orderBy: { listingStatus: 'asc' },
    take: 100,
  })

  const counts = await prisma.contractor.groupBy({ by: ['verified'], _count: { verified: true } })
  const pendingCount = counts.find(c => !c.verified)?._count?.verified || 0
  const verifiedCount = counts.find(c => c.verified)?._count?.verified || 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="section-label mb-1">Admin</div>
          <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Contractors</h1>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { label: 'All', val: '', count: pendingCount + verifiedCount },
          { label: 'Pending', val: 'pending', count: pendingCount },
          { label: 'Verified', val: 'verified', count: verifiedCount },
          { label: 'Featured', val: 'featured', count: null },
        ].map(tab => (
          <Link key={tab.val} href={`/admin/contractors${tab.val ? '?filter=' + tab.val : ''}`}
            className="px-3 py-1.5 rounded-sm text-xs font-bold"
            style={{ background: filter === tab.val || (!filter && !tab.val) ? 'var(--cyan)' : 'var(--navy-surface)', color: filter === tab.val || (!filter && !tab.val) ? 'var(--navy)' : 'var(--text-secondary)', border: '1px solid var(--cyan-border)' }}>
            {tab.label} {tab.count !== null ? `(${tab.count})` : ''}
          </Link>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-sm overflow-hidden" style={{ border: '1px solid var(--cyan-border)' }}>
        <div className="grid" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr', background: 'var(--navy-card)', borderBottom: '1px solid var(--cyan-border)', padding: '10px 16px', gap: 8 }}>
          {['Name', 'Trade', 'Island', 'Status', 'Featured', 'Actions'].map(h => (
            <div key={h} className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--cyan)' }}>{h}</div>
          ))}
        </div>

        {contractors.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--muted)' }}>No contractors found.</div>
        ) : contractors.map((c, i) => (
          <div key={c.id} className="grid items-center gap-2 px-4 py-3" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1.5fr', background: i % 2 === 0 ? 'var(--navy-surface)' : 'var(--navy-card)', borderBottom: '1px solid rgba(0,212,245,0.06)' }}>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{c.name}</p>
              {c.email && <p className="text-xs" style={{ color: 'var(--muted)' }}>{c.email}</p>}
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.trade}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.island}</p>
            <span className="text-xs px-2 py-0.5 rounded-sm font-bold inline-block" style={{ background: c.verified ? 'rgba(5,150,105,0.2)' : 'rgba(245,166,35,0.2)', color: c.verified ? '#059669' : 'var(--amber)' }}>
              {c.verified ? 'Verified' : 'Pending'}
            </span>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{c.featuredTier || '—'}</p>
            <div className="flex gap-2">
              {!c.verified && (
                <form action={`/api/admin/contractors/${c.id}/approve`} method="POST">
                  <button type="submit" className="text-xs px-2 py-1 rounded-sm font-bold" style={{ background: 'rgba(5,150,105,0.2)', color: '#059669' }}>✓ Approve</button>
                </form>
              )}
              {c.verified && (
                <form action={`/api/admin/contractors/${c.id}/reject`} method="POST">
                  <button type="submit" className="text-xs px-2 py-1 rounded-sm font-bold" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>✕ Remove</button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
