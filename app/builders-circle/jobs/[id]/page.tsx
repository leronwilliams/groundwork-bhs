import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Lock, Paperclip } from 'lucide-react'
import { prisma } from '@/lib/db'
import { pageMeta } from '@/lib/seo'
import { requireMemberPage } from '@/lib/builders-circle/page-auth'
import { blobPrefix } from '@/lib/builders-circle/server'
import { CIRCLE_ISLAND, fmtDate, formatBSD } from '@/lib/builders-circle/constants'
import { MemberShell, Notice, StatusPill, cardStyle } from '@/components/builders-circle/ui'
import { EstimateForm } from './EstimateForm'

export const metadata = pageMeta('/builders-circle/jobs', 'Job', 'Builders Circle job.', { noindex: true })
export const dynamic = 'force-dynamic'

type Att = { fileName: string; size?: number }

export default async function JobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { member } = await requireMemberPage(`/builders-circle/jobs/${id}`)
  const verified = member.status === 'verified'

  // Unverified members only ever get the summary columns from the database.
  const job = await prisma.circleJob.findUnique({ where: { id }, select: { id: true, title: true, summary: true, trades: true, settlement: true, budgetRange: true, bidDeadline: true, status: true, island: true } })
  if (!job || job.status === 'draft' || job.status === 'cancelled') notFound()
  const full = verified ? await prisma.circleJob.findUnique({ where: { id }, select: { description: true, siteVisit: true, targetStart: true, attachments: true } }) : null
  const mine = await prisma.circleEstimate.findUnique({ where: { jobId_contractorId: { jobId: id, contractorId: member.contractorId } } })
  const attachments = (full && Array.isArray(full.attachments) ? full.attachments : []) as unknown as Att[]
  const deadlinePassed = !!job.bidDeadline && job.bidDeadline.getTime() < Date.now()
  const canBid = verified && job.status === 'open' && !deadlinePassed

  return (
    <MemberShell active="/builders-circle/jobs" title={job.title} status={member.status}>
      <Link href="/builders-circle/jobs" className="text-xs font-bold" style={{ color: 'var(--cyan)' }}>← Back to job board</Link>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-sm" style={cardStyle}>
            <div className="flex items-center gap-2 mb-3"><StatusPill status={job.status} /></div>
            <p className="mb-4" data-testid="job-summary">{job.summary}</p>
            {full ? (
              <div data-testid="job-details">
                <h2 className="mb-2" style={{ fontSize: '1.1rem' }}>Full scope</h2>
                <p className="whitespace-pre-wrap text-sm mb-4" style={{ fontSize: '0.92rem' }}>{full.description}</p>
                <p className="text-sm">Site visit: {full.siteVisit ? 'Required before pricing' : 'Not required'} · Target start: {fmtDate(full.targetStart)}</p>
                {attachments.length > 0 && (
                  <div className="mt-4">
                    <h3 className="mb-2" style={{ fontSize: '1rem' }}>Drawings & files</h3>
                    <ul className="space-y-1">{attachments.map((a, i) => (
                      <li key={i}><a href={`/api/builders-circle/jobs/${job.id}/attachments?i=${i}`} target="_blank" rel="noopener" className="text-sm inline-flex items-center gap-2" style={{ color: 'var(--cyan)' }}><Paperclip size={13} /> {a.fileName}</a></li>
                    ))}</ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-sm" style={{ border: '1px dashed var(--amber)' }} data-testid="job-locked">
                <p className="text-sm flex items-center gap-2" style={{ color: 'var(--amber)' }}><Lock size={14} /> Full scope, drawings and bidding are for verified members.</p>
                <Link href="/builders-circle/documents" className="text-xs font-bold" style={{ color: 'var(--cyan)' }}>Finish verification →</Link>
              </div>
            )}
          </div>
          {verified && (
            <div className="p-6 rounded-sm" style={cardStyle}>
              <h2 className="mb-1" style={{ fontSize: '1.2rem' }}>Your estimate</h2>
              <p className="text-xs mb-4" style={{ color: 'var(--muted)', fontSize: '0.78rem' }}>Sealed bid — only Groundwork BHS sees your price. One estimate per job; you can edit or withdraw it until the deadline.</p>
              {mine && <p className="text-sm mb-4" data-testid="my-estimate">Current: <strong>{formatBSD(mine.amountCents)}</strong> {mine.vatIncluded ? '(VAT incl.)' : '(plus VAT)'} · {mine.timelineDays} days · <StatusPill status={mine.status} /></p>}
              {canBid && (!mine || ['submitted', 'shortlisted', 'withdrawn'].includes(mine.status)) ? (
                <EstimateForm jobId={job.id} pathPrefix={`${blobPrefix()}/estimates/${job.id}/${member.contractorId}/`} existing={mine ? {
                  amount: (mine.amountCents / 100).toFixed(2), vatIncluded: mine.vatIncluded, timelineDays: String(mine.timelineDays ?? ''),
                  availableFrom: mine.availableFrom ? mine.availableFrom.toISOString().slice(0, 10) : '', scopeNotes: mine.scopeNotes || '', status: mine.status, hasAttachment: !!mine.attachmentPathname,
                } : null} />
              ) : (
                <Notice tone="info">{job.status !== 'open' ? `This job is ${job.status}; estimates are closed.` : deadlinePassed ? 'The bid deadline has passed.' : 'This estimate has been decided.'}</Notice>
              )}
              {mine?.attachmentPathname && <a href={`/api/builders-circle/estimates/${mine.id}/file`} target="_blank" rel="noopener" className="text-xs font-bold" style={{ color: 'var(--cyan)' }}>View my attachment</a>}
            </div>
          )}
        </div>
        <aside className="p-6 rounded-sm h-fit text-sm space-y-2" style={cardStyle}>
          <p className="text-sm"><span style={{ color: 'var(--muted)' }}>Island:</span> {job.island || CIRCLE_ISLAND}</p>
          <p className="text-sm"><span style={{ color: 'var(--muted)' }}>Area:</span> {job.settlement || '—'}</p>
          <p className="text-sm"><span style={{ color: 'var(--muted)' }}>Trades:</span> {job.trades.join(', ')}</p>
          <p className="text-sm"><span style={{ color: 'var(--muted)' }}>Budget:</span> {job.budgetRange || 'To be discussed'}</p>
          <p className="text-sm"><span style={{ color: 'var(--muted)' }}>Estimates due:</span> {fmtDate(job.bidDeadline)}</p>
        </aside>
      </div>
    </MemberShell>
  )
}
