import Link from 'next/link'
import { headers } from 'next/headers'
import { requireAdmin } from '@/lib/admin-auth'
import { DIGEST_MAX_RECIPIENTS, digestPosts, digestRecipients, renderDigestBody } from '@/lib/builders-circle/board'
import { renderCircleEmail } from '@/lib/builders-circle/email'
import { DigestPanel } from './DigestPanel'

export const dynamic = 'force-dynamic'

export default async function DigestPage() {
  await requireAdmin()
  const h = await headers()
  const host = h.get('x-forwarded-host') || h.get('host')
  const origin = host ? `https://${host}` : 'https://www.groundworksbhs.com'
  const [posts, recipients] = await Promise.all([digestPosts(false), digestRecipients()])
  const html = renderCircleEmail({
    heading: 'New on the Builders Circle board',
    body: renderDigestBody(posts, origin),
    cta: { label: 'Open the board', url: `${origin}/builders-circle/board` },
    footerHtml: `<p style="font-size:12px;color:#9ca3af;margin:8px 0 0">Don't want these? <a href="#" style="color:#6b7280">Unsubscribe from board emails</a>.</p>`,
  })
  const productionOff = process.env.VERCEL_ENV === 'production' && process.env.BC_DIGEST_SEND_ENABLED !== '1'
  return (
    <div className="max-w-4xl">
      <div className="section-label mb-1"><Link href="/admin/builders-circle/board">Board</Link></div>
      <h1 className="font-black mb-2" style={{ color: 'var(--text-primary)', fontSize: '1.75rem' }}>Email digest</h1>
      <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>Includes published Grand Bahama posts that are still open and have not been emailed yet. Goes to verified members with a Grand Bahama service area who have not unsubscribed. Nothing is sent until you press a button.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <div className="p-4 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}><div className="text-2xl font-black" style={{ color: 'var(--cyan)' }}>{posts.length}</div><div className="text-xs" style={{ color: 'var(--muted)' }}>posts in this digest</div></div>
        <div className="p-4 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}><div className="text-2xl font-black" style={{ color: 'var(--cyan)' }}>{recipients.length}</div><div className="text-xs" style={{ color: 'var(--muted)' }}>recipients (max {DIGEST_MAX_RECIPIENTS} per send)</div></div>
        <div className="p-4 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}><div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{recipients.length ? recipients.slice(0, 6).map(r => r.contractor.name).join(', ') : 'No verified members yet'}</div><div className="text-xs" style={{ color: 'var(--muted)' }}>who would get it</div></div>
      </div>
      <DigestPanel disabled={posts.length === 0} recipients={recipients.length} posts={posts.length} productionOff={productionOff} />
      <h2 className="font-bold mt-8 mb-3" style={{ color: 'var(--text-primary)' }}>Preview</h2>
      {posts.length === 0 ? <p className="text-sm" style={{ color: 'var(--muted)' }}>Publish a Grand Bahama post to see the digest.</p> : (
        <iframe title="Digest preview" srcDoc={html} className="w-full rounded-sm" style={{ height: 760, background: '#fff', border: '1px solid var(--cyan-border)' }} data-testid="digest-preview" />
      )}
    </div>
  )
}
