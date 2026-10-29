import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { DOC_TYPES, effectiveDocStatus, fmtDate, formatBSD, requirementStatus, requirementsMet, type DocType } from '@/lib/builders-circle/constants'
import { StatusPill } from '@/components/builders-circle/ui'

export const dynamic = 'force-dynamic'
const box = { background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }
const input = { background: 'var(--navy)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }

export default async function AdminMember({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireAdmin()
  const { id } = await params
  const { error } = await searchParams
  const m = await prisma.circleMember.findUnique({ where: { id }, include: { contractor: { include: { documents: { orderBy: { createdAt: 'desc' } }, estimates: { include: { job: { select: { title: true } } }, orderBy: { updatedAt: 'desc' }, take: 10 } } } } })
  if (!m) notFound()
  const c = m.contractor
  const reqs = requirementStatus(c.documents)
  const ready = requirementsMet(c.documents)
  const log = await prisma.circleAuditLog.findMany({ where: { OR: [{ entityId: m.id }, { entityId: { in: c.documents.map(d => d.id) } }, { meta: { path: ['contractorId'], equals: c.id } }] }, orderBy: { createdAt: 'desc' }, take: 20 })

  return (
    <div className="max-w-5xl">
      <div className="section-label mb-1"><Link href="/admin/builders-circle/members">← Members</Link></div>
      <div className="flex items-center gap-3 mb-6"><h1 className="font-black" style={{ color: 'var(--text-primary)', fontSize: '1.75rem' }}>{c.name}</h1><StatusPill status={m.status} /></div>
      {error && <p className="p-3 mb-4 text-sm rounded-sm" style={{ border: '1px solid #ef4444', color: '#ef4444' }} data-testid="admin-error">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-5 rounded-sm text-sm space-y-1" style={box}>
          <p className="text-sm"><span style={{ color: 'var(--muted)' }}>Contact:</span> {c.contactName} · {c.phone}{c.whatsapp ? ` · WhatsApp ${c.whatsapp}` : ''}</p>
          <p className="text-sm"><span style={{ color: 'var(--muted)' }}>Email:</span> {c.email}</p>
          <p className="text-sm"><span style={{ color: 'var(--muted)' }}>Address:</span> {m.businessAddress}</p>
          <p className="text-sm"><span style={{ color: 'var(--muted)' }}>Trades:</span> {m.trades.join(', ')}</p>
          <p className="text-sm"><span style={{ color: 'var(--muted)' }}>Areas:</span> {m.serviceAreas.join(', ')}</p>
          <p className="text-sm"><span style={{ color: 'var(--muted)' }}>Years:</span> {m.yearsInBusiness ?? '—'} · <span style={{ color: 'var(--muted)' }}>Applied:</span> {fmtDate(m.appliedAt)}</p>
          {c.website && <p className="text-sm"><span style={{ color: 'var(--muted)' }}>Web:</span> {c.website}</p>}
          {m.statusReason && <p className="text-sm"><span style={{ color: 'var(--muted)' }}>Status note:</span> {m.statusReason}</p>}
        </div>
        <div className="p-5 rounded-sm" style={box}>
          <p className="text-xs uppercase mb-3" style={{ color: 'var(--muted)' }}>Required documents</p>
          {reqs.map(r => <p key={r.key} className="text-sm mb-1" style={{ color: r.approved ? '#059669' : 'var(--text-secondary)' }}>{r.approved ? '✓' : '○'} {r.label}{!r.approved && r.pending ? ' (awaiting review)' : ''}</p>)}
          <div className="flex flex-wrap gap-2 mt-4">
            {m.status !== 'verified' && (
              <form action={`/api/admin/builders-circle/members/${m.id}/status`} method="POST">
                <input type="hidden" name="status" value="verified" />
                <button disabled={!ready} className="text-xs px-3 py-1.5 rounded-sm font-bold" style={{ background: ready ? '#059669' : 'var(--navy)', color: ready ? 'white' : 'var(--muted)', border: '1px solid #05966955' }} data-testid="verify-member">✓ Verify member</button>
              </form>
            )}
            {m.status !== 'applied' && (
              <form action={`/api/admin/builders-circle/members/${m.id}/status`} method="POST">
                <input type="hidden" name="status" value="applied" />
                <button className="text-xs px-3 py-1.5 rounded-sm font-bold" style={{ border: '1px solid var(--cyan-border)', color: 'var(--cyan)' }}>Back to review</button>
              </form>
            )}
          </div>
          <form action={`/api/admin/builders-circle/members/${m.id}/status`} method="POST" className="flex gap-2 mt-3 flex-wrap">
            <input name="reason" placeholder="Reason (required)" className="flex-1 p-2 rounded-sm text-xs" style={input} />
            <select name="status" className="p-2 rounded-sm text-xs" style={input}><option value="rejected">Reject application</option><option value="suspended">Suspend</option></select>
            <button className="text-xs px-3 py-1.5 rounded-sm font-bold" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>Apply</button>
          </form>
        </div>
      </div>

      <h2 className="mb-3" style={{ fontSize: '1.2rem' }}>Documents</h2>
      <div className="space-y-3 mb-8" data-testid="admin-docs">
        {c.documents.length === 0 && <p className="text-sm" style={{ color: 'var(--muted)' }}>No documents uploaded yet.</p>}
        {c.documents.map(d => {
          const st = effectiveDocStatus(d)
          return (
            <div key={d.id} className="p-4 rounded-sm" style={box} data-doc-id={d.id}>
              <div className="flex flex-wrap justify-between gap-3 items-center mb-2">
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{DOC_TYPES[d.type as DocType]?.label || d.type}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{d.fileName} · {(d.size / 1024).toFixed(0)} KB · uploaded {fmtDate(d.createdAt)} · expires {fmtDate(d.expiresAt)}{d.reviewedAt ? ` · reviewed ${fmtDate(d.reviewedAt)}` : ''}</p>
                  {d.rejectionReason && <p className="text-xs" style={{ color: '#ef4444' }}>Rejected: {d.rejectionReason}</p>}
                </div>
                <div className="flex items-center gap-3"><StatusPill status={st} /><a href={`/api/builders-circle/documents/${d.id}/file`} target="_blank" rel="noopener" className="text-xs font-bold" style={{ color: 'var(--cyan)' }}>Open file ↗</a></div>
              </div>
              {d.status === 'pending' && (
                <div className="flex flex-wrap gap-2">
                  <form action={`/api/admin/builders-circle/documents/${d.id}/review`} method="POST" className="flex gap-2 items-center">
                    <input type="hidden" name="decision" value="approve" />
                    <input type="date" name="expiresAt" defaultValue={d.expiresAt ? d.expiresAt.toISOString().slice(0, 10) : ''} className="p-1.5 rounded-sm text-xs" style={input} title="Correct the expiry date if needed" />
                    <button className="text-xs px-3 py-1.5 rounded-sm font-bold" style={{ background: 'rgba(5,150,105,0.2)', color: '#059669' }} data-testid="approve-doc">✓ Approve</button>
                  </form>
                  <form action={`/api/admin/builders-circle/documents/${d.id}/review`} method="POST" className="flex gap-2 items-center flex-1">
                    <input type="hidden" name="decision" value="reject" />
                    <input name="reason" placeholder="Reason for rejection (sent to the contractor)" className="flex-1 p-1.5 rounded-sm text-xs" style={input} />
                    <button className="text-xs px-3 py-1.5 rounded-sm font-bold" style={{ background: 'rgba(239,68,68,0.2)', color: '#ef4444' }} data-testid="reject-doc">✕ Reject</button>
                  </form>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {c.estimates.length > 0 && (<>
        <h2 className="mb-3" style={{ fontSize: '1.2rem' }}>Recent estimates</h2>
        <div className="mb-8 text-sm space-y-1">{c.estimates.map(e => <p key={e.id} className="text-sm"><Link href={`/admin/builders-circle/jobs/${e.jobId}`} style={{ color: 'var(--cyan)' }}>{e.job.title}</Link> — {formatBSD(e.amountCents)} <StatusPill status={e.status} /></p>)}</div>
      </>)}

      <h2 className="mb-3" style={{ fontSize: '1.2rem' }}>Audit trail</h2>
      <div className="text-xs space-y-1" style={{ color: 'var(--muted)' }}>
        {log.map(l => <p key={l.id} className="text-xs">{l.createdAt.toLocaleString('en-US', { timeZone: 'America/Nassau', dateStyle: 'medium', timeStyle: 'short' })} ET · {l.action} · by {l.actorUserId.slice(0, 12)}…</p>)}
      </div>
    </div>
  )
}
