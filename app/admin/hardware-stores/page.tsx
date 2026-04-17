import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'

export default async function AdminHardwareStoresPage() {
  await requireAdmin()
  const stores = await prisma.hardwareStore.findMany({ orderBy: { island: 'asc' } })

  return (
    <div>
      <div className="mb-6">
        <div className="section-label mb-1">Admin</div>
        <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Hardware Stores</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Manage registered hardware stores for BOQ quote requests. Update real email addresses when available.</p>
      </div>

      <div className="rounded-sm overflow-hidden" style={{ border: '1px solid var(--cyan-border)' }}>
        <div className="grid gap-2 px-4 py-3" style={{ gridTemplateColumns: '2fr 1fr 2fr 1fr 1fr', background: 'var(--navy-card)', borderBottom: '1px solid var(--cyan-border)' }}>
          {['Name', 'Island', 'Email', 'Tier', 'Status'].map(h => (
            <div key={h} className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--cyan)' }}>{h}</div>
          ))}
        </div>

        {stores.map((store, i) => (
          <div key={store.id} className="grid items-center gap-2 px-4 py-3" style={{ gridTemplateColumns: '2fr 1fr 2fr 1fr 1fr', background: i % 2 === 0 ? 'var(--navy-surface)' : 'var(--navy-card)', borderBottom: '1px solid rgba(0,212,245,0.06)' }}>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{store.name}</p>
              {store.contactName && <p className="text-xs" style={{ color: 'var(--muted)' }}>{store.contactName}</p>}
            </div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{store.island}</p>
            <p className="text-xs font-mono" style={{ color: store.email.includes('placeholder') ? 'var(--amber)' : 'var(--text-secondary)' }}>
              {store.email}
              {store.email.includes('placeholder') && <span className="ml-1 text-xs" style={{ color: 'var(--amber)' }}>⚠️ placeholder</span>}
            </p>
            <span className="text-xs px-2 py-0.5 rounded-sm font-bold" style={{ background: store.tier === 'premium' ? 'rgba(245,166,35,0.2)' : 'rgba(0,212,245,0.1)', color: store.tier === 'premium' ? 'var(--amber)' : 'var(--cyan)' }}>
              {store.tier}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-sm font-bold" style={{ background: store.active ? 'rgba(5,150,105,0.2)' : 'rgba(239,68,68,0.2)', color: store.active ? '#059669' : '#ef4444' }}>
              {store.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 rounded-sm" style={{ background: 'rgba(245,166,35,0.06)', border: '1px solid var(--amber)' }}>
        <p className="font-bold text-sm mb-1" style={{ color: 'var(--amber)' }}>Action Required</p>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {stores.filter(s => s.email.includes('placeholder')).length} stores have placeholder emails. Update them with real contact emails to enable live BOQ quote requests. Contact each store directly to confirm their purchasing email.
        </p>
      </div>
    </div>
  )
}
