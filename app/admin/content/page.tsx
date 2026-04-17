import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function AdminContentPage() {
  await requireAdmin()

  const [guides, prices] = await Promise.all([
    prisma.guide.findMany({ orderBy: { category: 'asc' }, select: { id: true, slug: true, title: true, category: true, island: true, featured: true, order: true } }),
    prisma.priceList.findMany({ orderBy: { itemCode: 'asc' } }),
  ])

  return (
    <div>
      <div className="mb-6">
        <div className="section-label mb-1">Admin</div>
        <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Content Management</h1>
      </div>

      {/* Guides */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Guides ({guides.length})</h2>
        </div>
        <div className="rounded-sm overflow-hidden" style={{ border: '1px solid var(--cyan-border)' }}>
          <div className="grid gap-2 px-4 py-2.5" style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr', background: 'var(--navy-card)', borderBottom: '1px solid var(--cyan-border)' }}>
            {['Title', 'Category', 'Island', 'Featured', 'Order'].map(h => (
              <div key={h} className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--cyan)' }}>{h}</div>
            ))}
          </div>
          {guides.map((g, i) => (
            <div key={g.id} className="grid items-center gap-2 px-4 py-3" style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr 1fr', background: i % 2 === 0 ? 'var(--navy-surface)' : 'var(--navy-card)', borderBottom: '1px solid rgba(0,212,245,0.06)' }}>
              <Link href={`/guides/${g.slug}`} className="text-xs font-bold hover:underline" style={{ color: 'var(--text-primary)' }}>{g.title}</Link>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{g.category}</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{g.island}</p>
              <span style={{ color: g.featured ? '#059669' : 'var(--muted)', fontSize: '0.7rem', fontWeight: 700 }}>{g.featured ? '★ Featured' : '—'}</span>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{g.order}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Material Prices */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>Material Prices ({prices.length})</h2>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>2025 Nassau market rates</p>
        </div>
        <div className="rounded-sm overflow-hidden" style={{ border: '1px solid var(--cyan-border)' }}>
          <div className="grid gap-2 px-4 py-2.5" style={{ gridTemplateColumns: '1.5fr 2fr 1fr 1fr 1.5fr', background: 'var(--navy-card)', borderBottom: '1px solid var(--cyan-border)' }}>
            {['Code', 'Item', 'Unit', 'Price (BSD)', 'Supplier'].map(h => (
              <div key={h} className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--cyan)' }}>{h}</div>
            ))}
          </div>
          {prices.map((p, i) => (
            <div key={p.id} className="grid items-center gap-2 px-4 py-2.5" style={{ gridTemplateColumns: '1.5fr 2fr 1fr 1fr 1.5fr', background: i % 2 === 0 ? 'var(--navy-surface)' : 'var(--navy-card)', borderBottom: '1px solid rgba(0,212,245,0.06)' }}>
              <p className="text-xs font-mono" style={{ color: 'var(--muted)' }}>{p.itemCode}</p>
              <p className="text-xs" style={{ color: 'var(--text-primary)' }}>{p.itemName}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.unit}</p>
              <p className="text-xs font-bold" style={{ color: 'var(--cyan)' }}>${p.unitPrice.toFixed(2)}</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{p.supplier || '—'}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs" style={{ color: 'var(--muted)' }}>To update prices: edit the PriceList table in your Neon DB or run the seed script with updated values.</p>
      </div>
    </div>
  )
}
