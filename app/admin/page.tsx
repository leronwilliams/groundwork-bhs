import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'
import { stripe } from '@/lib/stripe'

function StatCard({ label, value, sub, accent = 'var(--cyan)' }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="p-6 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
      <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: 'var(--muted)' }}>{label}</p>
      <p className="text-3xl font-black mb-1" style={{ color: accent }}>{value}</p>
      {sub && <p className="text-xs" style={{ color: 'var(--muted)' }}>{sub}</p>}
    </div>
  )
}

export default async function AdminOverviewPage() {
  await requireAdmin()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  // DB stats
  const [
    totalUsers,
    totalOrders,
    ordersThisMonth,
    activeSubscriptions,
    pendingContractors,
    advisorCacheCount,
    totalAdvisorSessions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.subscription.count({ where: { status: 'active', tier: { not: 'free' } } }),
    prisma.contractor.count({ where: { verified: false } }),
    prisma.advisorCache.count(),
    prisma.advisorSession.count(),
  ])

  // Stripe revenue (last 30 days)
  let revenueThisMonth = 0
  let revenueLabel = '$0'
  try {
    const charges = await stripe.charges.list({
      created: { gte: Math.floor(startOfMonth.getTime() / 1000) },
      limit: 100,
    })
    revenueThisMonth = charges.data.filter(c => c.paid).reduce((s, c) => s + c.amount, 0)
    revenueLabel = '$' + (revenueThisMonth / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  } catch {}

  // Cache hit rate
  const cacheEntries = await prisma.advisorCache.findMany({ select: { hitCount: true }, take: 100 })
  const totalHits = cacheEntries.reduce((s, e) => s + e.hitCount, 0)
  const cacheHitRate = totalAdvisorSessions > 0 ? Math.round((totalHits / (totalAdvisorSessions + totalHits)) * 100) : 0

  // Recent orders
  const recentOrders = await prisma.order.findMany({
    take: 8,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { email: true, name: true } } },
  })

  // Orders by type
  const ordersByType = await prisma.order.groupBy({
    by: ['type'],
    _count: { type: true },
    _sum: { amount: true },
    orderBy: { _count: { type: 'desc' } },
  })

  return (
    <div>
      <div className="mb-8">
        <div className="section-label mb-2">Admin</div>
        <h1 className="text-3xl font-black" style={{ color: 'var(--text-primary)' }}>Overview</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Revenue This Month" value={revenueLabel} sub="from Stripe charges" accent="var(--cyan)" />
        <StatCard label="Active Subscribers" value={String(activeSubscriptions)} sub="Pro + Builder" accent="#059669" />
        <StatCard label="Orders This Month" value={String(ordersThisMonth)} sub={`${totalOrders} total`} accent="var(--amber)" />
        <StatCard label="Cache Hit Rate" value={cacheHitRate + '%'} sub={`${advisorCacheCount} cached answers`} accent="#6366f1" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard label="Total Users" value={String(totalUsers)} accent="var(--text-primary)" />
        <StatCard label="Pending Contractors" value={String(pendingContractors)} sub="awaiting verification" accent={pendingContractors > 0 ? 'var(--amber)' : 'var(--muted)'} />
        <StatCard label="Advisor Sessions" value={String(totalAdvisorSessions)} accent="var(--text-primary)" />
        <StatCard label="Total Orders" value={String(totalOrders)} accent="var(--text-primary)" />
      </div>

      {/* Quick actions */}
      {pendingContractors > 0 && (
        <div className="mb-8 p-4 rounded-sm flex items-center justify-between" style={{ background: 'rgba(245,166,35,0.08)', border: '1px solid var(--amber)' }}>
          <div>
            <p className="font-bold text-sm" style={{ color: 'var(--amber)' }}>Action Required</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{pendingContractors} contractor{pendingContractors > 1 ? 's' : ''} pending verification</p>
          </div>
          <a href="/admin/contractors" className="px-4 py-2 rounded-sm font-bold text-sm" style={{ background: 'var(--amber)', color: '#1a0f00' }}>Review →</a>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div>
          <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Orders</h2>
          <div className="rounded-sm overflow-hidden" style={{ border: '1px solid var(--cyan-border)' }}>
            {recentOrders.map((order, i) => (
              <div key={order.id} className="flex items-center justify-between px-4 py-3" style={{ background: i % 2 === 0 ? 'var(--navy-surface)' : 'var(--navy-card)', borderBottom: i < recentOrders.length - 1 ? '1px solid rgba(0,212,245,0.08)' : 'none' }}>
                <div>
                  <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{order.type.replace(/_/g, ' ')}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{order.user?.email || 'guest'}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold" style={{ color: 'var(--cyan)' }}>${(order.amount / 100).toFixed(0)}</p>
                  <span className="text-xs px-1.5 py-0.5 rounded-sm font-bold" style={{ background: order.status === 'delivered' ? 'rgba(5,150,105,0.2)' : order.status === 'paid' ? 'rgba(0,212,245,0.15)' : 'rgba(245,166,35,0.15)', color: order.status === 'delivered' ? '#059669' : order.status === 'paid' ? 'var(--cyan)' : 'var(--amber)' }}>{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Orders by type */}
        <div>
          <h2 className="text-base font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Orders by Service</h2>
          <div className="rounded-sm overflow-hidden" style={{ border: '1px solid var(--cyan-border)' }}>
            {ordersByType.map((row, i) => (
              <div key={row.type} className="flex items-center justify-between px-4 py-3" style={{ background: i % 2 === 0 ? 'var(--navy-surface)' : 'var(--navy-card)', borderBottom: i < ordersByType.length - 1 ? '1px solid rgba(0,212,245,0.08)' : 'none' }}>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{row.type.replace(/_/g, ' ')}</p>
                <div className="text-right">
                  <span className="text-xs font-bold" style={{ color: 'var(--cyan)' }}>{row._count.type} orders</span>
                  <span className="text-xs ml-3" style={{ color: 'var(--muted)' }}>${((row._sum.amount || 0) / 100).toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
