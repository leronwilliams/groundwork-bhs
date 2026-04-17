import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'

export default async function AdminAnalyticsPage() {
  await requireAdmin()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // Top cached questions
  const topCached = await prisma.advisorCache.findMany({
    orderBy: { hitCount: 'desc' },
    take: 10,
    select: { question: true, hitCount: true, createdAt: true },
  })

  // Cache stats
  const cacheEntries = await prisma.advisorCache.count()
  const totalHits = (await prisma.advisorCache.aggregate({ _sum: { hitCount: true } }))._sum.hitCount || 0
  const sessions = await prisma.advisorSession.count()
  const cacheHitRate = sessions + totalHits > 0 ? Math.round((totalHits / (sessions + totalHits)) * 100) : 0

  // Orders by type (revenue breakdown)
  const ordersByType = await prisma.order.groupBy({
    by: ['type', 'status'],
    _count: { type: true },
    _sum: { amount: true },
  })

  // Users by tier
  const tierBreakdown = await prisma.subscription.groupBy({
    by: ['tier'],
    _count: { tier: true },
  })

  // Orders this month
  const ordersThisMonth = await prisma.order.count({ where: { createdAt: { gte: startOfMonth } } })
  const revenueThisMonth = (await prisma.order.aggregate({ where: { createdAt: { gte: startOfMonth }, status: { in: ['paid', 'delivered'] } }, _sum: { amount: true } }))._sum.amount || 0

  // By island (from contractor leads)
  const leadsByIsland = await prisma.contractorLead.groupBy({ by: ['island'], _count: { island: true } })

  return (
    <div>
      <div className="mb-6">
        <div className="section-label mb-1">Admin</div>
        <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Analytics</h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Cache Entries', value: String(cacheEntries), sub: 'advisor answers cached' },
          { label: 'Total Cache Hits', value: String(totalHits), sub: 'Claude calls avoided' },
          { label: 'Cache Hit Rate', value: cacheHitRate + '%', sub: 'efficiency rate' },
          { label: 'Orders This Month', value: String(ordersThisMonth), sub: '$' + (revenueThisMonth / 100).toFixed(0) + ' revenue' },
        ].map(stat => (
          <div key={stat.label} className="p-4 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
            <p className="text-xs uppercase tracking-wide font-bold mb-1" style={{ color: 'var(--muted)' }}>{stat.label}</p>
            <p className="text-2xl font-black" style={{ color: 'var(--cyan)' }}>{stat.value}</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top cached questions */}
        <div>
          <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Top Advisor Questions</h2>
          <div className="space-y-2">
            {topCached.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-3 p-3 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
                <p className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>{item.question.slice(0, 80)}{item.question.length > 80 ? '...' : ''}</p>
                <span className="text-xs font-black shrink-0" style={{ color: 'var(--cyan)' }}>{item.hitCount} hits</span>
              </div>
            ))}
            {topCached.length === 0 && <p className="text-sm" style={{ color: 'var(--muted)' }}>No cache data yet. Use the advisor to build the cache.</p>}
          </div>
        </div>

        {/* Revenue by service type */}
        <div>
          <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Revenue by Service</h2>
          <div className="space-y-2">
            {ordersByType
              .filter(o => o.status !== 'pending' && (o._sum.amount || 0) > 0)
              .sort((a, b) => (b._sum.amount || 0) - (a._sum.amount || 0))
              .slice(0, 10)
              .map((row, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{row.type.replace(/_/g, ' ')} <span style={{ color: 'var(--muted)' }}>({row._count.type})</span></p>
                  <p className="text-xs font-bold" style={{ color: 'var(--cyan)' }}>${((row._sum.amount || 0) / 100).toFixed(0)}</p>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Users by tier */}
        <div>
          <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Users by Tier</h2>
          <div className="space-y-2">
            {tierBreakdown.map(t => (
              <div key={t.tier} className="flex items-center justify-between p-3 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
                <span className="text-sm font-bold capitalize" style={{ color: t.tier === 'builder' ? 'var(--amber)' : t.tier === 'pro' ? 'var(--cyan)' : 'var(--muted)' }}>{t.tier}</span>
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{t._count.tier}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Leads by island */}
        <div>
          <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Contractor Leads by Island</h2>
          <div className="space-y-2">
            {leadsByIsland.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>No leads submitted yet.</p>
            ) : leadsByIsland.map(l => (
              <div key={l.island} className="flex items-center justify-between p-3 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{l.island}</p>
                <p className="text-xs font-bold" style={{ color: 'var(--cyan)' }}>{l._count.island} leads</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
