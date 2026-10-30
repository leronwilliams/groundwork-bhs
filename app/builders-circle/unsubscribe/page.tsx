import Link from 'next/link'
import { prisma } from '@/lib/db'
import { pageMeta } from '@/lib/seo'
import { verifySignedPath } from '@/lib/builders-circle/signed-link'
import { unsubscribePathFor } from '@/lib/builders-circle/board-constants'
import { BuildersCircleLogo, cardStyle } from '@/components/builders-circle/ui'

export const metadata = pageMeta('/builders-circle/unsubscribe', 'Board email preferences', 'Manage Builders Circle board emails.', { noindex: true })
export const dynamic = 'force-dynamic'

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ m?: string; exp?: string; sig?: string; done?: string }> }) {
  const { m = '', exp = '', sig = '', done } = await searchParams
  const valid = !!m && verifySignedPath(unsubscribePathFor(m), exp, sig)
  let optedOut = false
  if (valid) { try { optedOut = !!(await prisma.boardDigestOptOut.findUnique({ where: { memberId: m } })) } catch { /* table not ready */ } }
  const Hidden = () => <><input type="hidden" name="m" value={m} /><input type="hidden" name="exp" value={exp} /><input type="hidden" name="sig" value={sig} /></>
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bc-dark bc-hero pt-28 pb-8 px-6"><div className="max-w-xl mx-auto flex items-center gap-4"><BuildersCircleLogo size={72} className="w-14" sizes="56px" /><h1 className="font-black" style={{ fontSize: '1.8rem' }}>Board email preferences</h1></div></div>
      <div className="bc-light flex-1 pt-10 pb-20 px-6">
        <div className="max-w-xl mx-auto p-6 rounded-sm" style={{ ...cardStyle, background: '#fff' }}>
          {!valid ? <p>This link is not valid or has expired. Sign in to the <Link href="/builders-circle/board" className="font-bold" style={{ color: '#ea580c' }}>board</Link> and use “Manage email alerts” for a fresh link.</p> : (
            <>
              {done && <p className="mb-4 font-bold" style={{ color: '#059669' }}>{done === 'off' ? 'You are unsubscribed. We will not email you board updates.' : 'You are subscribed again.'}</p>}
              <p className="mb-5 text-sm">{optedOut ? 'Board emails are currently OFF for your Builders Circle account.' : 'Board emails are currently ON: you get new Grand Bahama tenders, jobs and news.'}</p>
              <form method="post" action="/api/builders-circle/unsubscribe">
                <Hidden />
                <input type="hidden" name="action" value={optedOut ? 'resubscribe' : 'unsubscribe'} />
                <button className="px-5 py-2.5 rounded-sm font-bold text-sm" style={{ background: optedOut ? '#ea580c' : '#0b0b0b', color: '#fff' }}>{optedOut ? 'Turn board emails back on' : 'Unsubscribe from board emails'}</button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
