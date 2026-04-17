import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function AdminPartnersPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  await requireAdmin()
  const { filter } = await searchParams

  const where = filter === 'pending' ? { approved: false }
    : filter === 'active' ? { approved: true, active: true }
    : {}

  const [partners, pendingCount, activeCount, totalImpressions, totalClicks] = await Promise.all([
    prisma.partner.findMany({ where, orderBy: { createdAt: 'desc' }, take: 50, include: { adPlacements: true, _count: { select: { referrals: true } } } }),
    prisma.partner.count({ where: { approved: false } }),
    prisma.partner.count({ where: { approved: true, active: true } }),
    prisma.partnerAd.aggregate({ _sum: { impressions: true } }),
    prisma.partnerAd.aggregate({ _sum: { clicks: true } }),
  ])

  const totalImp = totalImpressions._sum.impressions || 0
  const totalClk = totalClicks._sum.clicks || 0
  const ctr = totalImp > 0 ? ((totalClk / totalImp) * 100).toFixed(1) : '0.0'

  return (
    <div>
      <div className="mb-6">
        <div className="section-label mb-1">Admin</div>
        <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Partners</h1>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Pending Approval', value: String(pendingCount), accent: pendingCount > 0 ? 'var(--amber)' : 'var(--muted)' },
          { label: 'Active Partners', value: String(activeCount), accent: 'var(--cyan)' },
          { label: 'Total Ad Impressions', value: String(totalImp), accent: 'var(--text-primary)' },
          { label: 'Ad CTR', value: ctr + '%', accent: '#059669' },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
            <p className="text-xs uppercase tracking-wide font-bold mb-1" style={{ color: 'var(--muted)' }}>{s.label}</p>
            <p className="text-2xl font-black" style={{ color: s.accent }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-5">
        {[['All', ''], ['Pending', 'pending'], ['Active', 'active']].map(([label, val]) => (
          <Link key={val} href={`/admin/partners${val ? '?filter=' + val : ''}`}
            className="px-3 py-1.5 rounded-sm text-xs font-bold"
            style={{ background: filter === val || (!filter && !val) ? 'var(--cyan)' : 'var(--navy-surface)', color: filter === val || (!filter && !val) ? 'var(--navy)' : 'var(--text-secondary)', border: '1px solid var(--cyan-border)' }}>
            {label}
          </Link>
        ))}
      </div>

      <div className="rounded-sm overflow-hidden" style={{ border: '1px solid var(--cyan-border)' }}>
        <div className="grid gap-2 px-4 py-3" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr', background: 'var(--navy-card)', borderBottom: '1px solid var(--cyan-border)' }}>
          {['Business', 'Category', 'Island', 'Tier', 'Status', 'Referrals', 'Actions'].map(h => (
            <div key={h} className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--cyan)' }}>{h}</div>
          ))}
        </div>

        {partners.map((p, i) => (
          <div key={p.id} className="grid items-center gap-2 px-4 py-3" style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr', background: i % 2 === 0 ? 'var(--navy-surface)' : 'var(--navy-card)', borderBottom: '1px solid rgba(0,212,245,0.06)' }}>
            <div>
              <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{p.businessName}</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{p.email}</p>
            </div>
            <p className="text-xs capitalize" style={{ color: 'var(--text-secondary)' }}>{p.category}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.island}</p>
            <span className="text-xs font-bold capitalize" style={{ color: p.tier === 'premium' ? 'var(--amber)' : p.tier === 'featured' ? 'var(--cyan)' : 'var(--muted)' }}>{p.tier}</span>
            <span className="text-xs font-bold" style={{ color: p.approved && p.active ? '#059669' : p.approved ? 'var(--cyan)' : 'var(--amber)' }}>
              {p.approved && p.active ? 'Active' : p.approved ? 'Approved' : 'Pending'}
            </span>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p._count.referrals}</p>
            <div className="flex gap-1">
              {!p.approved && (
                <form action={`/api/admin/partners/${p.id}/approve`} method="POST">
                  <button type="submit" className="text-xs px-2 py-1 rounded-sm font-bold" style={{ background: 'rgba(5,150,105,0.2)', color: '#059669' }}>✓ Approve</button>
                </form>
              )}
            </div>
          </div>
        ))}

        {partners.length === 0 && (
          <div className="p-8 text-center" style={{ color: 'var(--muted)' }}>No partners found.</div>
        )}
      </div>
    </div>
  )
}
