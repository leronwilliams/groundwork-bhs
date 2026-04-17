import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'

export default async function AdminUsersPage() {
  await requireAdmin()
  const users = await prisma.user.findMany({
    take: 50, orderBy: { createdAt: 'desc' },
    include: { subscription: true, _count: { select: { orders: true, advisorSessions: true } } },
  })

  return (
    <div>
      <div className="mb-6">
        <div className="section-label mb-1">Admin</div>
        <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Users</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{users.length} users</p>
      </div>

      <div className="rounded-sm overflow-hidden" style={{ border: '1px solid var(--cyan-border)' }}>
        <div className="grid gap-2 px-4 py-3" style={{ gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr', background: 'var(--navy-card)', borderBottom: '1px solid var(--cyan-border)' }}>
          {['User', 'Tier', 'Orders', 'Sessions', 'Joined'].map(h => (
            <div key={h} className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--cyan)' }}>{h}</div>
          ))}
        </div>

        {users.length === 0 ? (
          <div className="p-8 text-center" style={{ color: 'var(--muted)' }}>No users have signed up yet.</div>
        ) : users.map((user, i) => {
          const tier = user.subscription?.tier || 'free'
          const tierColor = tier === 'builder' ? 'var(--amber)' : tier === 'pro' ? 'var(--cyan)' : 'var(--muted)'
          return (
            <div key={user.id} className="grid items-center gap-2 px-4 py-3" style={{ gridTemplateColumns: '2.5fr 1fr 1fr 1fr 1fr', background: i % 2 === 0 ? 'var(--navy-surface)' : 'var(--navy-card)', borderBottom: '1px solid rgba(0,212,245,0.06)' }}>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{user.name || 'Unknown'}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{user.email}</p>
              </div>
              <span className="text-xs font-bold capitalize" style={{ color: tierColor }}>{tier}</span>
              <p className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>{user._count.orders}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{user._count.advisorSessions}</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
