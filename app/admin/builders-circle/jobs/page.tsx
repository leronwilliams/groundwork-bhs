import Link from 'next/link'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { fmtDate } from '@/lib/builders-circle/constants'
import { StatusPill } from '@/components/builders-circle/ui'

export const dynamic = 'force-dynamic'

export default async function AdminJobs() {
  await requireAdmin()
  const jobs = await prisma.circleJob.findMany({ orderBy: { createdAt: 'desc' }, take: 200, include: { _count: { select: { estimates: true } } } })
  return (
    <div>
      <div className="section-label mb-1"><Link href="/admin/builders-circle">Builders Circle</Link></div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="font-black" style={{ color: 'var(--text-primary)', fontSize: '1.75rem' }}>Jobs</h1>
        <Link href="/admin/builders-circle/jobs/new" className="px-4 py-2 rounded-sm text-sm font-bold" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>+ Post a job</Link>
      </div>
      <div className="rounded-sm overflow-hidden" style={{ border: '1px solid var(--cyan-border)' }}>
        {jobs.length === 0 ? <p className="p-6 text-sm" style={{ color: 'var(--muted)' }}>No jobs yet.</p> : jobs.map((j, i) => (
          <Link key={j.id} href={`/admin/builders-circle/jobs/${j.id}`} className="grid gap-3 items-center px-4 py-3" style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr', background: i % 2 ? 'var(--navy-card)' : 'var(--navy-surface)' }}>
            <div><p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{j.title}</p><p className="text-xs" style={{ color: 'var(--muted)' }}>{j.trades.join(', ')} · {j.settlement || 'Grand Bahama'}</p></div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Due {fmtDate(j.bidDeadline)}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{j._count.estimates} estimate(s)</p>
            <StatusPill status={j.status} />
          </Link>
        ))}
      </div>
    </div>
  )
}
