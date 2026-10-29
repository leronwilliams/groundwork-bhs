import Link from 'next/link'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { fmtDate, requirementStatus } from '@/lib/builders-circle/constants'
import { StatusPill } from '@/components/builders-circle/ui'

export const dynamic = 'force-dynamic'
const TABS = ['applied', 'verified', 'suspended', 'rejected', 'all']

export default async function AdminMembers({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requireAdmin()
  const status = (await searchParams).status || 'applied'
  const members = await prisma.circleMember.findMany({
    where: status === 'all' ? {} : { status },
    include: { contractor: { include: { documents: true } } },
    orderBy: { appliedAt: 'desc' }, take: 200,
  })
  return (
    <div>
      <div className="section-label mb-1"><Link href="/admin/builders-circle">Builders Circle</Link></div>
      <h1 className="text-2xl font-black mb-6" style={{ color: 'var(--text-primary)', fontSize: '1.75rem' }}>Members</h1>
      <div className="flex gap-2 mb-6">
        {TABS.map(t => (
          <Link key={t} href={`/admin/builders-circle/members?status=${t}`} className="px-3 py-1.5 rounded-sm text-xs font-bold capitalize"
            style={{ background: status === t ? 'var(--cyan)' : 'var(--navy-surface)', color: status === t ? 'var(--navy)' : 'var(--text-secondary)', border: '1px solid var(--cyan-border)' }}>{t}</Link>
        ))}
      </div>
      <div className="rounded-sm overflow-hidden" style={{ border: '1px solid var(--cyan-border)' }} data-testid="members-table">
        {members.length === 0 ? <p className="p-6 text-sm" style={{ color: 'var(--muted)' }}>No members in this tab.</p> : members.map((m, i) => {
          const reqs = requirementStatus(m.contractor.documents)
          const pending = m.contractor.documents.filter(d => d.status === 'pending').length
          return (
            <Link key={m.id} href={`/admin/builders-circle/members/${m.id}`} className="grid items-center gap-3 px-4 py-3"
              style={{ gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', background: i % 2 ? 'var(--navy-card)' : 'var(--navy-surface)' }}>
              <div><p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{m.contractor.name}</p><p className="text-xs" style={{ color: 'var(--muted)' }}>{m.contractor.email}</p></div>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{m.trades.join(', ')}</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Required: {reqs.filter(r => r.approved).length}/{reqs.length}{pending ? ` · ${pending} to review` : ''}</p>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>{fmtDate(m.appliedAt)}</p>
              <StatusPill status={m.status} />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
