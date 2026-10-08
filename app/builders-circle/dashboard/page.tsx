import Link from 'next/link'
import { prisma } from '@/lib/db'
import { pageMeta } from '@/lib/seo'
import { requireMemberPage } from '@/lib/builders-circle/page-auth'
import { fmtDate, formatBSD, requirementStatus, CIRCLE_ISLAND } from '@/lib/builders-circle/constants'
import { CircleBadge, MemberShell, Notice, StatusPill, cardStyle } from '@/components/builders-circle/ui'

export const metadata = pageMeta('/builders-circle/dashboard', 'Builders Circle Dashboard', 'Your Builders Circle membership.', { noindex: true })
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { member } = await requireMemberPage('/builders-circle/dashboard')
  const [docs, jobs, estimates] = await Promise.all([
    prisma.contractorDocument.findMany({ where: { contractorId: member.contractorId } }),
    prisma.circleJob.findMany({ where: { status: 'open', island: CIRCLE_ISLAND }, orderBy: { publishedAt: 'desc' }, take: 5 }),
    prisma.circleEstimate.findMany({ where: { contractorId: member.contractorId }, include: { job: { select: { title: true } } }, orderBy: { updatedAt: 'desc' }, take: 5 }),
  ])
  const reqs = requirementStatus(docs)
  const verified = member.status === 'verified'
  const matching = jobs.filter(j => member.trades.includes('General Contractor') || j.trades.some(t => member.trades.includes(t)))

  return (
    <MemberShell active="/builders-circle/dashboard" title={member.contractor.name} status={member.status}>
      {verified && <div className="mb-6"><CircleBadge /> <span className="text-xs ml-2" style={{ color: 'var(--muted)' }}>Verified {fmtDate(member.verifiedAt)}</span></div>}
      {member.status === 'applied' && (
        <Notice tone="warn">
          Your membership is <strong>under review</strong>. Upload the three required documents below; once our team approves them we will verify your business.
          Until then you can browse job summaries, but full details and bidding unlock when you are verified.
        </Notice>
      )}
      {(member.status === 'rejected' || member.status === 'suspended') && (
        <Notice tone="error">Your membership is <strong>{member.status}</strong>.{member.statusReason ? ` Reason: ${member.statusReason}` : ''} Contact Groundwork BHS if you think this is a mistake.</Notice>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {reqs.map(r => (
          <div key={r.key} className="p-5 rounded-sm" style={cardStyle} data-testid={`req-${r.key}`}>
            <p className="text-xs uppercase tracking-wider mb-2" style={{ color: 'var(--muted)', fontSize: '0.7rem' }}>Required</p>
            <p className="font-bold mb-3" style={{ color: 'var(--text-primary)', fontSize: '0.95rem' }}>{r.label}</p>
            <StatusPill status={r.approved ? 'approved' : r.pending ? 'pending' : 'rejected'} label={r.approved ? 'Approved' : r.pending ? 'Awaiting review' : r.uploaded ? 'Needs new upload' : 'Not uploaded'} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-sm" style={cardStyle}>
          <div className="flex justify-between items-center mb-4">
            <h2 style={{ fontSize: '1.2rem' }}>Open jobs in your trades</h2>
            <Link href="/builders-circle/jobs" className="text-xs font-bold" style={{ color: 'var(--cyan)' }}>All jobs →</Link>
          </div>
          {matching.length === 0 ? <p className="text-sm">No open jobs match your trades right now.</p> : (
            <ul className="space-y-3">
              {matching.map(j => (
                <li key={j.id}><Link href={`/builders-circle/jobs/${j.id}`} className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{j.title}</Link>
                  <p className="text-xs" style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{j.settlement || CIRCLE_ISLAND} · due {fmtDate(j.bidDeadline)}</p></li>
              ))}
            </ul>
          )}
        </div>
        <div className="p-6 rounded-sm" style={cardStyle}>
          <div className="flex justify-between items-center mb-4">
            <h2 style={{ fontSize: '1.2rem' }}>My estimates</h2>
            <Link href="/builders-circle/estimates" className="text-xs font-bold" style={{ color: 'var(--cyan)' }}>All →</Link>
          </div>
          {estimates.length === 0 ? <p className="text-sm">{verified ? 'You have not submitted any estimates yet.' : 'You can submit estimates once verified.'}</p> : (
            <ul className="space-y-3">
              {estimates.map(e => (
                <li key={e.id} className="flex justify-between gap-3 items-center">
                  <Link href={`/builders-circle/jobs/${e.jobId}`} className="text-sm" style={{ color: 'var(--text-primary)' }}>{e.job.title}</Link>
                  <span className="flex items-center gap-2 text-xs whitespace-nowrap">{formatBSD(e.amountCents)} <StatusPill status={e.status} /></span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </MemberShell>
  )
}
