import { prisma } from '@/lib/db'
import { pageMeta } from '@/lib/seo'
import { requireMemberPage } from '@/lib/builders-circle/page-auth'
import { docPathPrefix } from '@/lib/builders-circle/server'
import { DOC_TYPES, effectiveDocStatus, fmtDate, requirementStatus, type DocType } from '@/lib/builders-circle/constants'
import { MemberShell, Notice, StatusPill, cardStyle } from '@/components/builders-circle/ui'
import { DocumentUpload, DeleteDocButton } from './DocumentUpload'

export const metadata = pageMeta('/builders-circle/documents', 'My Documents', 'Builders Circle verification documents.', { noindex: true })
export const dynamic = 'force-dynamic'

export default async function DocumentsPage({ searchParams }: { searchParams: Promise<{ welcome?: string }> }) {
  const { member } = await requireMemberPage('/builders-circle/documents')
  const sp = await searchParams
  const docs = await prisma.contractorDocument.findMany({ where: { contractorId: member.contractorId }, orderBy: { createdAt: 'desc' } })
  const reqs = requirementStatus(docs)
  const canUpload = member.status !== 'suspended' && member.status !== 'rejected'

  return (
    <MemberShell active="/builders-circle/documents" title="Verification documents" status={member.status}>
      {sp.welcome && <Notice tone="ok">Profile saved. Now upload your documents — your Business Licence (or GBPA licence), NIB compliance letter and a government photo ID.</Notice>}
      <div className="flex gap-2 flex-wrap mb-6">
        {reqs.map(r => <StatusPill key={r.key} status={r.approved ? 'approved' : r.pending ? 'pending' : 'draft'} label={`${r.approved ? '✓' : '○'} ${r.label}`} />)}
      </div>
      <p className="text-sm mb-8" style={{ fontSize: '0.9rem' }}>Files are stored privately. Only you and the Groundwork verification team can open them.</p>

      {canUpload && <DocumentUpload pathPrefix={docPathPrefix(member.contractorId)} />}

      <div className="rounded-sm overflow-hidden mt-10" style={cardStyle} data-testid="doc-list">
        {docs.length === 0 ? <p className="p-6 text-sm">No documents uploaded yet.</p> : docs.map(d => {
          const st = effectiveDocStatus(d)
          return (
            <div key={d.id} className="p-4 flex flex-wrap gap-4 items-center justify-between" style={{ borderBottom: '1px solid rgba(0,212,245,0.08)' }} data-doc-id={d.id}>
              <div className="min-w-0">
                <p className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{DOC_TYPES[d.type as DocType]?.label || d.type}</p>
                <p className="text-xs" style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{d.fileName} · uploaded {fmtDate(d.createdAt)} · expires {fmtDate(d.expiresAt)}</p>
                {d.status === 'rejected' && d.rejectionReason && <p className="text-xs mt-1" style={{ color: '#ef4444', fontSize: '0.8rem' }}>Not accepted: {d.rejectionReason}</p>}
              </div>
              <div className="flex items-center gap-3">
                <StatusPill status={st} label={st === 'pending' ? 'Awaiting review' : st} />
                <a href={`/api/builders-circle/documents/${d.id}/file`} target="_blank" rel="noopener" className="text-xs font-bold" style={{ color: 'var(--cyan)' }}>View</a>
                {(d.status === 'pending' || d.status === 'rejected') && <DeleteDocButton id={d.id} />}
              </div>
            </div>
          )
        })}
      </div>
    </MemberShell>
  )
}
