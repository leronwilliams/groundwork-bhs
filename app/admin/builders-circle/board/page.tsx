import Link from 'next/link'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { BOARD_TYPES, TYPE_LABEL, fmtClose } from '@/lib/builders-circle/board-constants'
import { StatusPill } from '@/components/builders-circle/ui'
import { ImportButton } from './ImportButton'

export const dynamic = 'force-dynamic'

export default async function AdminBoard({ searchParams }: { searchParams: Promise<{ status?: string; type?: string }> }) {
  await requireAdmin()
  const sp = await searchParams
  const status = sp.status === 'draft' || sp.status === 'published' ? sp.status : undefined
  const type = (BOARD_TYPES as readonly string[]).includes(sp.type || '') ? sp.type : undefined
  const posts = await prisma.boardPost.findMany({ where: { ...(status ? { status } : {}), ...(type ? { type } : {}) }, orderBy: [{ status: 'asc' }, { createdAt: 'desc' }], take: 300 })
  const counts = { draft: await prisma.boardPost.count({ where: { status: 'draft' } }), published: await prisma.boardPost.count({ where: { status: 'published' } }) }
  const tab = (label: string, q: string, active: boolean) => <Link href={`/admin/builders-circle/board${q}`} className="px-3 py-1.5 rounded-sm text-xs font-bold" style={{ background: active ? 'var(--cyan)' : 'var(--navy-surface)', color: active ? 'var(--navy)' : 'var(--text-secondary)', border: '1px solid var(--cyan-border)' }}>{label}</Link>
  return (
    <div>
      <div className="section-label mb-1"><Link href="/admin/builders-circle">Builders Circle</Link></div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <h1 className="font-black" style={{ color: 'var(--text-primary)', fontSize: '1.75rem' }}>Jobs &amp; news board</h1>
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/builders-circle/board/digest" className="px-4 py-2 rounded-sm text-sm font-bold" style={{ border: '1px solid var(--cyan-border)', color: 'var(--cyan)' }}>Email digest</Link>
          <Link href="/admin/builders-circle/board/new" className="px-4 py-2 rounded-sm text-sm font-bold" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>+ New post</Link>
        </div>
      </div>
      <div className="mb-5"><ImportButton /></div>
      <div className="flex gap-2 flex-wrap mb-5">
        {tab(`All (${counts.draft + counts.published})`, '', !status && !type)}
        {tab(`Drafts (${counts.draft})`, '?status=draft', status === 'draft')}
        {tab(`Published (${counts.published})`, '?status=published', status === 'published')}
        {BOARD_TYPES.map(t => tab(t === 'news' ? 'News' : `${TYPE_LABEL[t]}s`, `?type=${t}`, type === t))}
      </div>
      <div className="rounded-sm overflow-hidden" style={{ border: '1px solid var(--cyan-border)' }} data-testid="admin-board-list">
        {posts.length === 0 ? <p className="p-6 text-sm" style={{ color: 'var(--muted)' }}>No posts yet. Import tenders or create one.</p> : posts.map((p, i) => (
          <Link key={p.id} href={`/admin/builders-circle/board/${p.id}`} className="grid gap-3 items-center px-4 py-3" style={{ gridTemplateColumns: '3fr 1fr 1fr 1fr', background: i % 2 ? 'var(--navy-card)' : 'var(--navy-surface)' }}>
            <div><p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{p.title}</p><p className="text-xs" style={{ color: 'var(--muted)' }}>{TYPE_LABEL[p.type] || p.type} · {p.source || '—'} · {p.location}</p></div>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.closeDate ? `Closes ${fmtClose(p.closeDate)}` : 'No close date'}</p>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{p.digestSentAt ? 'In a digest' : p.status === 'published' ? 'Not emailed yet' : ''}</p>
            <StatusPill status={p.status === 'published' ? 'open' : 'draft'} label={p.status} />
          </Link>
        ))}
      </div>
    </div>
  )
}
