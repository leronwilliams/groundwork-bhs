import { requireAdmin } from '@/lib/admin-auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'

const ORDER_LABELS: Record<string, string> = {
  lead: 'Contractor Lead', estimate_single: 'Single Estimate', estimate_full: 'Full Estimate',
  boq: 'BOQ', boq_hardware: 'BOQ + Hardware', boq_quotes: 'BOQ + Quotes',
  permit_prep: 'Permit Prep', contract: 'Contract', tax_appeal: 'Tax Appeal',
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: 'rgba(245,166,35,0.2)', color: 'var(--amber)' },
  paid: { bg: 'rgba(0,212,245,0.15)', color: 'var(--cyan)' },
  processing: { bg: 'rgba(99,102,241,0.2)', color: '#6366f1' },
  delivered: { bg: 'rgba(5,150,105,0.2)', color: '#059669' },
  refunded: { bg: 'rgba(239,68,68,0.2)', color: '#ef4444' },
}

export default async function AdminOrdersPage({ searchParams }: { searchParams: Promise<{ status?: string; type?: string }> }) {
  await requireAdmin()
  const { status, type } = await searchParams

  const where: Record<string, unknown> = {}
  if (status) where.status = status
  if (type) where.type = type

  const orders = await prisma.order.findMany({
    where,
    take: 50,
    orderBy: { createdAt: 'desc' },
    include: { user: { select: { email: true, name: true } }, estimateResult: { select: { resultType: true } } },
  })

  const statusCounts = await prisma.order.groupBy({ by: ['status'], _count: { status: true } })

  return (
    <div>
      <div className="mb-6">
        <div className="section-label mb-1">Admin</div>
        <h1 className="text-2xl font-black" style={{ color: 'var(--text-primary)' }}>Orders</h1>
      </div>

      {/* Status filter */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Link href="/admin/orders" className="px-3 py-1.5 rounded-sm text-xs font-bold" style={{ background: !status ? 'var(--cyan)' : 'var(--navy-surface)', color: !status ? 'var(--navy)' : 'var(--text-secondary)', border: '1px solid var(--cyan-border)' }}>
          All ({orders.length})
        </Link>
        {statusCounts.map(s => (
          <Link key={s.status} href={`/admin/orders?status=${s.status}`} className="px-3 py-1.5 rounded-sm text-xs font-bold" style={{ background: status === s.status ? 'var(--cyan)' : 'var(--navy-surface)', color: status === s.status ? 'var(--navy)' : 'var(--text-secondary)', border: '1px solid var(--cyan-border)' }}>
            {s.status} ({s._count.status})
          </Link>
        ))}
      </div>

      <div className="rounded-sm overflow-hidden" style={{ border: '1px solid var(--cyan-border)' }}>
        <div className="grid gap-2 px-4 py-3" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr', background: 'var(--navy-card)', borderBottom: '1px solid var(--cyan-border)' }}>
          {['User', 'Service', 'Amount', 'Status', 'Date', 'Actions'].map(h => (
            <div key={h} className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--cyan)' }}>{h}</div>
          ))}
        </div>

        {orders.map((order, i) => {
          const sc = STATUS_COLORS[order.status] || STATUS_COLORS.pending
          return (
            <div key={order.id} className="grid items-center gap-2 px-4 py-3" style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr', background: i % 2 === 0 ? 'var(--navy-surface)' : 'var(--navy-card)', borderBottom: '1px solid rgba(0,212,245,0.06)' }}>
              <div>
                <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{order.user?.name || 'Guest'}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{order.user?.email || '—'}</p>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{ORDER_LABELS[order.type] || order.type}</p>
              <p className="text-xs font-bold" style={{ color: 'var(--cyan)' }}>${(order.amount / 100).toFixed(0)}</p>
              <span className="text-xs px-2 py-0.5 rounded-sm font-bold inline-block" style={{ background: sc.bg, color: sc.color }}>{order.status}</span>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{new Date(order.createdAt).toLocaleDateString()}</p>
              <div className="flex gap-1">
                {order.estimateResult && (
                  <Link href={`/estimate/${order.id}`} className="text-xs px-2 py-1 rounded-sm font-bold" style={{ background: 'rgba(0,212,245,0.15)', color: 'var(--cyan)' }}>View</Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
