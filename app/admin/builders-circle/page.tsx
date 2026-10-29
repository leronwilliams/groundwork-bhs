import Link from 'next/link'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export default async function AdminCircleOverview() {
  await requireAdmin()
  const [applied, verified, pendingDocs, openJobs, liveEstimates] = await Promise.all([
    prisma.circleMember.count({ where: { status: 'applied' } }),
    prisma.circleMember.count({ where: { status: 'verified' } }),
    prisma.contractorDocument.count({ where: { status: 'pending' } }),
    prisma.circleJob.count({ where: { status: 'open' } }),
    prisma.circleEstimate.count({ where: { status: { in: ['submitted', 'shortlisted'] } } }),
  ])
  const cards = [
    { label: 'Applicants to review', value: applied, href: '/admin/builders-circle/members?status=applied' },
    { label: 'Documents awaiting review', value: pendingDocs, href: '/admin/builders-circle/members?status=applied' },
    { label: 'Verified members', value: verified, href: '/admin/builders-circle/members?status=verified' },
    { label: 'Open jobs', value: openJobs, href: '/admin/builders-circle/jobs' },
    { label: 'Live estimates', value: liveEstimates, href: '/admin/builders-circle/jobs' },
  ]
  return (
    <div>
      <div className="section-label mb-1">Admin</div>
      <h1 className="text-2xl font-black mb-6" style={{ color: 'var(--text-primary)', fontSize: '1.75rem' }}>Builders Circle</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {cards.map(c => (
          <Link key={c.label} href={c.href} className="p-5 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
            <div className="text-3xl font-black" style={{ color: 'var(--cyan)' }}>{c.value}</div>
            <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{c.label}</div>
          </Link>
        ))}
      </div>
      <div className="flex gap-3">
        <Link href="/admin/builders-circle/members" className="px-4 py-2 rounded-sm text-sm font-bold" style={{ border: '1px solid var(--cyan-border)', color: 'var(--cyan)' }}>Members</Link>
        <Link href="/admin/builders-circle/jobs" className="px-4 py-2 rounded-sm text-sm font-bold" style={{ border: '1px solid var(--cyan-border)', color: 'var(--cyan)' }}>Jobs</Link>
        <Link href="/admin/builders-circle/jobs/new" className="px-4 py-2 rounded-sm text-sm font-bold" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>+ Post a job</Link>
      </div>
    </div>
  )
}
