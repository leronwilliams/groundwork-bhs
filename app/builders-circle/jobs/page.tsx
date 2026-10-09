import Link from 'next/link'
import { Lock } from 'lucide-react'
import { prisma } from '@/lib/db'
import { pageMeta } from '@/lib/seo'
import { requireMemberPage } from '@/lib/builders-circle/page-auth'
import { CIRCLE_ISLAND, CIRCLE_TRADES, SETTLEMENTS, fmtDate } from '@/lib/builders-circle/constants'
import { MemberShell, Notice, StatusPill, cardStyle, fieldStyle } from '@/components/builders-circle/ui'

export const metadata = pageMeta('/builders-circle/jobs', 'Job Board', 'Builders Circle job board.', { noindex: true })
export const dynamic = 'force-dynamic'

export default async function JobBoard({ searchParams }: { searchParams: Promise<{ trade?: string; area?: string }> }) {
  const { member } = await requireMemberPage('/builders-circle/jobs')
  const sp = await searchParams
  const trade = (CIRCLE_TRADES as readonly string[]).includes(sp.trade || '') ? sp.trade : undefined
  const area = (SETTLEMENTS as readonly string[]).includes(sp.area || '') ? sp.area : undefined
  const verified = member.status === 'verified'
  if (member.status === 'suspended' || member.status === 'rejected') {
    return (
      <MemberShell active="/builders-circle/jobs" title="Job board" status={member.status}>
        <Notice tone="error">The job board is not available while your membership is {member.status}. {member.statusReason ? `Reason: ${member.statusReason}. ` : ''}Please contact Groundwork BHS if you think this is a mistake.</Notice>
      </MemberShell>
    )
  }

  // Summary fields only — description, attachments and client details are never loaded here.
  const jobs = await prisma.circleJob.findMany({
    where: { status: 'open', island: CIRCLE_ISLAND, ...(trade ? { trades: { has: trade } } : {}), ...(area ? { settlement: area } : {}) },
    select: { id: true, title: true, summary: true, trades: true, settlement: true, budgetRange: true, bidDeadline: true, publishedAt: true },
    orderBy: { publishedAt: 'desc' },
  })
  const mine = new Set((await prisma.circleEstimate.findMany({ where: { contractorId: member.contractorId, jobId: { in: jobs.map(j => j.id) } }, select: { jobId: true } })).map(e => e.jobId))

  return (
    <MemberShell active="/builders-circle/jobs" title="Job board" status={member.status}>
      {!verified && <Notice tone="warn"><Lock size={14} className="inline mr-1" /> You are seeing job <strong>summaries</strong>. Full details, drawings and bidding unlock once your business is verified.</Notice>}
      <form className="flex gap-3 flex-wrap mb-6" method="get">
        <select name="trade" defaultValue={trade || ''} className="p-2 rounded-sm text-sm" style={fieldStyle}>
          <option value="">All trades</option>{CIRCLE_TRADES.map(t => <option key={t}>{t}</option>)}
        </select>
        <select name="area" defaultValue={area || ''} className="p-2 rounded-sm text-sm" style={fieldStyle}>
          <option value="">All areas</option>{SETTLEMENTS.map(t => <option key={t}>{t}</option>)}
        </select>
        <button className="px-4 py-2 rounded-sm text-sm font-bold" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>Filter</button>
      </form>
      {jobs.length === 0 ? <div className="p-8 rounded-sm text-center" style={cardStyle}><p>No open jobs right now. We will email you when one matches your trades.</p></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="job-list">
          {jobs.map(j => (
            <div key={j.id} className="p-6 rounded-sm flex flex-col" style={cardStyle} data-job-id={j.id}>
              <div className="flex justify-between gap-3 mb-2">
                <h2 style={{ fontSize: '1.15rem' }}>{j.title}</h2>
                {mine.has(j.id) && <StatusPill status="submitted" label="You bid" />}
              </div>
              <p className="text-sm mb-4" style={{ fontSize: '0.9rem' }}>{j.summary}</p>
              <div className="text-xs space-y-1 mb-4" style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>
                <p className="text-xs">Trades: {j.trades.join(', ')}</p>
                <p className="text-xs">Area: {j.settlement || CIRCLE_ISLAND} · Budget: {j.budgetRange || 'To be discussed'}</p>
                <p className="text-xs">Estimates due: {fmtDate(j.bidDeadline)}</p>
              </div>
              <div className="mt-auto">
                <Link href={`/builders-circle/jobs/${j.id}`} className="text-sm font-bold" style={{ color: verified ? 'var(--bc-link, var(--cyan))' : 'var(--muted)' }}>
                  {verified ? 'View details & submit estimate →' : 'View summary →'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </MemberShell>
  )
}
