import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { jobPathPrefix } from '@/lib/builders-circle/server'
import { fmtDate, formatBSD } from '@/lib/builders-circle/constants'
import { StatusPill } from '@/components/builders-circle/ui'
import { JobForm } from '../JobForm'
import { JobAttachments } from '../Attachments'

export const dynamic = 'force-dynamic'
const box = { background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }
const d10 = (d: Date | null) => (d ? new Date(d.getTime() - 4 * 3600 * 1000).toISOString().slice(0, 10) : '')

const ACTIONS: Record<string, { status: string; label: string; color: string }[]> = {
  draft: [{ status: 'open', label: 'Publish & notify members', color: '#059669' }, { status: 'cancelled', label: 'Cancel', color: '#ef4444' }],
  open: [{ status: 'closed', label: 'Close bidding', color: '#f5a623' }, { status: 'cancelled', label: 'Cancel job', color: '#ef4444' }],
  closed: [{ status: 'open', label: 'Re-open bidding', color: '#059669' }, { status: 'cancelled', label: 'Cancel job', color: '#ef4444' }],
}

export default async function AdminJob({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireAdmin()
  const { id } = await params
  const { error } = await searchParams
  const job = await prisma.circleJob.findUnique({ where: { id }, include: { estimates: { include: { contractor: { include: { circleMember: true } } }, orderBy: { amountCents: 'asc' } } } })
  if (!job) notFound()
  const files = (Array.isArray(job.attachments) ? job.attachments : []) as unknown as { fileName: string }[]
  const locked = job.status === 'awarded' || job.status === 'cancelled'

  return (
    <div className="max-w-5xl">
      <div className="section-label mb-1"><Link href="/admin/builders-circle/jobs">← Jobs</Link></div>
      <div className="flex items-center gap-3 mb-4 flex-wrap"><h1 className="font-black" style={{ color: 'var(--text-primary)', fontSize: '1.75rem' }}>{job.title}</h1><StatusPill status={job.status} /></div>
      {error && <p className="p-3 mb-4 text-sm rounded-sm" style={{ border: '1px solid #ef4444', color: '#ef4444' }}>{error}</p>}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(ACTIONS[job.status] || []).map(a => (
          <form key={a.status} action={`/api/admin/builders-circle/jobs/${job.id}/status`} method="POST">
            <input type="hidden" name="status" value={a.status} />
            <button className="text-xs px-3 py-1.5 rounded-sm font-bold" style={{ background: `${a.color}25`, color: a.color, border: `1px solid ${a.color}55` }} data-testid={`job-action-${a.status}`}>{a.label}</button>
          </form>
        ))}
        {job.status !== 'draft' && <Link href={`/builders-circle/jobs/${job.id}`} className="text-xs px-3 py-1.5 rounded-sm font-bold" style={{ border: '1px solid var(--cyan-border)', color: 'var(--cyan)' }}>View as member ↗</Link>}
      </div>

      <h2 className="mb-3" style={{ fontSize: '1.2rem' }}>Estimates ({job.estimates.length}) — sealed, admins only</h2>
      <div className="rounded-sm overflow-hidden mb-8" style={{ border: '1px solid var(--cyan-border)' }} data-testid="admin-estimates">
        {job.estimates.length === 0 ? <p className="p-5 text-sm" style={{ color: 'var(--muted)' }}>No estimates yet.</p> : job.estimates.map((e, i) => (
          <div key={e.id} className="p-4" style={{ background: i % 2 ? 'var(--navy-card)' : 'var(--navy-surface)' }} data-estimate-id={e.id}>
            <div className="flex flex-wrap justify-between gap-3 items-center">
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{e.contractor.name} {e.contractor.circleMember && <Link href={`/admin/builders-circle/members/${e.contractor.circleMember.id}`} className="text-xs font-normal" style={{ color: 'var(--cyan)' }}>profile</Link>}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{formatBSD(e.amountCents)} {e.vatIncluded ? 'VAT incl.' : '+ VAT'} · {e.timelineDays} days · available {fmtDate(e.availableFrom)} · updated {fmtDate(e.updatedAt)}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <StatusPill status={e.status} />
                {e.attachmentPathname && <a href={`/api/builders-circle/estimates/${e.id}/file`} target="_blank" rel="noopener" className="text-xs font-bold" style={{ color: 'var(--cyan)' }}>Quote file ↗</a>}
                {!locked && ['submitted', 'shortlisted'].includes(e.status) && (<>
                  {e.status === 'submitted' && <form action={`/api/admin/builders-circle/estimates/${e.id}/status`} method="POST"><input type="hidden" name="status" value="shortlisted" /><button className="text-xs px-2 py-1 rounded-sm font-bold" style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8' }}>Shortlist</button></form>}
                  <form action={`/api/admin/builders-circle/estimates/${e.id}/status`} method="POST"><input type="hidden" name="status" value="accepted" /><button className="text-xs px-2 py-1 rounded-sm font-bold" style={{ background: 'rgba(5,150,105,0.2)', color: '#059669' }} data-testid="award">Award job</button></form>
                  <form action={`/api/admin/builders-circle/estimates/${e.id}/status`} method="POST"><input type="hidden" name="status" value="declined" /><button className="text-xs px-2 py-1 rounded-sm font-bold" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>Decline</button></form>
                </>)}
              </div>
            </div>
            {e.scopeNotes && <p className="text-xs mt-2 whitespace-pre-wrap" style={{ color: 'var(--text-secondary)' }}>{e.scopeNotes}</p>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-sm" style={box}>
          <h2 className="mb-4" style={{ fontSize: '1.1rem' }}>Job details</h2>
          <JobForm jobId={job.id} disabled={locked} initial={{ title: job.title, summary: job.summary, description: job.description, trades: job.trades, settlement: job.settlement || '', budgetRange: job.budgetRange || '', siteVisit: job.siteVisit, bidDeadline: d10(job.bidDeadline), targetStart: d10(job.targetStart), clientContact: job.clientContact || '' }} />
        </div>
        <div className="p-5 rounded-sm h-fit" style={box}>
          <h2 className="mb-3" style={{ fontSize: '1.1rem' }}>Drawings & files</h2>
          <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>Private. Verified members can open them once the job is published.</p>
          {locked ? <p className="text-sm">{files.map(f => f.fileName).join(', ') || 'None'}</p> : <JobAttachments jobId={job.id} pathPrefix={jobPathPrefix(job.id)} files={files} />}
        </div>
      </div>
    </div>
  )
}
