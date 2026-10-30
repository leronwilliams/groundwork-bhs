import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/admin-auth'
import { StatusPill } from '@/components/builders-circle/ui'
import { PostForm } from '../PostForm'
import { NotifyPanel } from './NotifyPanel'
import { vapidPublicKey, pushRecipients, pushSendBlocked } from '@/lib/builders-circle/push'

export const dynamic = 'force-dynamic'

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const adminUser = await requireAdmin()
  const { id } = await params
  const p = await prisma.boardPost.findUnique({ where: { id } })
  if (!p) notFound()
  const subs = p.status === 'published' ? await pushRecipients(p.location) : []
  const myDevices = await prisma.pushSubscription.count({ where: { userId: adminUser } })
  const closeDate = p.closeDate ? p.closeDate.toLocaleDateString('en-CA', { timeZone: 'America/Nassau' }) : ''
  return (
    <div className="max-w-3xl">
      <div className="section-label mb-1"><Link href="/admin/builders-circle/board">Board</Link></div>
      <div className="flex items-center gap-3 mb-6"><h1 className="font-black" style={{ color: 'var(--text-primary)', fontSize: '1.75rem' }}>Edit post</h1><StatusPill status={p.status === 'published' ? 'open' : 'draft'} label={p.status} /></div>
      {p.sourceId && <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>Imported · source {p.sourceId}</p>}
      <PostForm postId={p.id} status={p.status} initial={{ type: p.type, title: p.title, summary: p.summary, source: p.source || '', location: p.location, closeDate, link: p.link || '' }} />
      {p.status === 'published' && (
        <NotifyPanel postId={p.id} location={p.location} devices={subs.length} members={new Set(subs.map(x => x.memberId)).size} myDevices={myDevices}
          pushedAt={p.pushSentAt ? p.pushSentAt.toISOString() : null} blocked={pushSendBlocked()} publicKey={vapidPublicKey()} />
      )}
    </div>
  )
}
