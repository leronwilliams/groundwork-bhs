import Link from 'next/link'
import { prisma } from '@/lib/db'
import { pageMeta } from '@/lib/seo'
import { requireMemberPage } from '@/lib/builders-circle/page-auth'
import { fmtDate, formatBSD } from '@/lib/builders-circle/constants'
import { MemberShell, StatusPill, cardStyle } from '@/components/builders-circle/ui'

export const metadata = pageMeta('/builders-circle/estimates', 'My Estimates', 'Your Builders Circle estimates.', { noindex: true })
export const dynamic = 'force-dynamic'

export default async function MyEstimates() {
  const { member } = await requireMemberPage('/builders-circle/estimates')
  const estimates = await prisma.circleEstimate.findMany({ where: { contractorId: member.contractorId }, include: { job: { select: { title: true, status: true } } }, orderBy: { updatedAt: 'desc' } })
  return (
    <MemberShell active="/builders-circle/estimates" title="My estimates" status={member.status}>
      <div className="rounded-sm overflow-hidden" style={cardStyle} data-testid="estimates-list">
        {estimates.length === 0 ? <p className="p-6 text-sm">No estimates yet.</p> : estimates.map(e => (
          <div key={e.id} className="p-4 flex flex-wrap justify-between gap-3 items-center" style={{ borderBottom: '1px solid var(--bc-row, rgba(0,212,245,0.08))' }}>
            <div>
              <Link href={`/builders-circle/jobs/${e.jobId}`} className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{e.job.title}</Link>
              <p className="text-xs" style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Job {e.job.status} · updated {fmtDate(e.updatedAt)}</p>
            </div>
            <div className="flex items-center gap-3 text-sm">{formatBSD(e.amountCents)} <StatusPill status={e.status} label={e.status === 'accepted' ? 'Awarded to you' : e.status} /></div>
          </div>
        ))}
      </div>
    </MemberShell>
  )
}
