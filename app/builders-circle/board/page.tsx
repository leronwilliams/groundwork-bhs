import Link from 'next/link'
import { ExternalLink, Lock, MapPin, Clock, Building2, BellRing } from 'lucide-react'
import { prisma } from '@/lib/db'
import { pageMeta } from '@/lib/seo'
import { getCircleContext } from '@/lib/builders-circle/server'
import { signPath } from '@/lib/builders-circle/signed-link'
import { BOARD_LOCATIONS, BOARD_TYPES, TYPE_COLOR, TYPE_LABEL, closesIn, fmtClose, unsubscribePathFor } from '@/lib/builders-circle/board-constants'
import { BuildersCircleLogo, MemberShell, cardStyle } from '@/components/builders-circle/ui'

export const metadata = pageMeta('/builders-circle/board', 'Jobs & News Board', 'Tenders, jobs and construction news for Grand Bahama builders.', { noindex: true })
export const dynamic = 'force-dynamic'

type SP = { type?: string; loc?: string; closed?: string }

function href(sp: SP, patch: Partial<SP>) {
  const m = { ...sp, ...patch }
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(m)) if (v) q.set(k, v)
  const s = q.toString()
  return `/builders-circle/board${s ? `?${s}` : ''}`
}

function Pill({ active, to, children }: { active: boolean; to: string; children: React.ReactNode }) {
  return (
    <Link href={to} className="px-3 py-1.5 rounded-sm text-xs font-bold whitespace-nowrap" aria-current={active ? 'true' : undefined}
      style={{ background: active ? '#0b0b0b' : '#ffffff', color: active ? '#ffffff' : 'var(--text-secondary)', border: `1px solid ${active ? '#0b0b0b' : 'var(--cyan-border)'}` }}>
      {children}
    </Link>
  )
}

export default async function BoardPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams
  const type = (BOARD_TYPES as readonly string[]).includes(sp.type || '') ? sp.type : undefined
  const loc = (BOARD_LOCATIONS as readonly string[]).includes(sp.loc || '') ? sp.loc : undefined
  const showClosed = sp.closed === '1'
  const ctx = await getCircleContext()
  const member = ctx.member
  const full = !!member && member.status !== 'suspended' && member.status !== 'rejected'

  let posts: Awaited<ReturnType<typeof prisma.boardPost.findMany>> = []
  let unavailable = false
  try {
    posts = await prisma.boardPost.findMany({
      where: {
        status: 'published',
        ...(type ? { type } : {}), ...(loc ? { location: loc } : {}),
        ...(showClosed ? {} : { OR: [{ closeDate: null }, { closeDate: { gt: new Date() } }] }),
      },
      orderBy: { publishedAt: 'desc' }, take: 100,
    })
  } catch { unavailable = true }

  let optedOut = false
  if (member) { try { optedOut = !!(await prisma.boardDigestOptOut.findUnique({ where: { memberId: member.id } })) } catch { /* table not ready */ } }

  const body = (
    <>
      <div className="flex flex-col gap-3 mb-6" data-testid="board-filters">
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs font-mono mr-1" style={{ color: 'var(--muted)' }}>TYPE</span>
          <Pill active={!type} to={href(sp, { type: undefined })}>All</Pill>
          {BOARD_TYPES.map(t => <Pill key={t} active={type === t} to={href(sp, { type: t })}>{t === 'news' ? 'News' : TYPE_LABEL[t] + 's'}</Pill>)}
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs font-mono mr-1" style={{ color: 'var(--muted)' }}>WHERE</span>
          <Pill active={!loc} to={href(sp, { loc: undefined })}>Anywhere</Pill>
          {BOARD_LOCATIONS.map(l => <Pill key={l} active={loc === l} to={href(sp, { loc: l })}>{l}</Pill>)}
          <span className="mx-2" style={{ color: 'var(--cyan-border)' }}>|</span>
          <Pill active={showClosed} to={href(sp, { closed: showClosed ? undefined : '1' })}>{showClosed ? 'Showing closed' : 'Show closed'}</Pill>
        </div>
      </div>

      {!full && (
        <div className="p-4 rounded-sm text-sm mb-6 flex items-start gap-3" style={{ background: '#fff7ed', border: '1px solid rgba(234,88,12,0.4)', color: 'var(--text-secondary)' }}>
          <Lock size={16} className="mt-0.5 shrink-0" style={{ color: '#ea580c' }} />
          <span>You are seeing headlines only. <Link href={ctx.userId ? '/builders-circle/join' : '/sign-up?redirect_url=/builders-circle/join'} className="font-bold" style={{ color: '#ea580c' }}>Join the Builders Circle (free)</Link> to open the full details and links, and to get Grand Bahama opportunities by email.</span>
        </div>
      )}

      {unavailable ? (
        <div className="p-8 rounded-sm text-center" style={cardStyle}><p>The board is being set up. Please check back shortly.</p></div>
      ) : posts.length === 0 ? (
        <div className="p-10 rounded-sm text-center" style={cardStyle}>
          <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Nothing posted here yet</p>
          <p className="text-sm">New tenders, jobs and construction news for Grand Bahama will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4" data-testid="board-list">
          {posts.map(p => {
            const color = TYPE_COLOR[p.type] || '#374151'
            const closed = !!p.closeDate && p.closeDate.getTime() < Date.now()
            const soon = !!p.closeDate && !closed && p.closeDate.getTime() - Date.now() < 7 * 86400000
            return (
              <article key={p.id} className="p-5 md:p-6 rounded-sm" data-post-id={p.id} style={{ ...cardStyle, background: '#ffffff', borderLeft: `4px solid ${color}`, opacity: closed ? 0.6 : 1 }}>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm" style={{ background: color, color: '#fff' }}>{TYPE_LABEL[p.type] || p.type}</span>
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-sm font-mono" style={{ background: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid rgba(234,88,12,0.35)' }}><MapPin size={11} /> {p.location}</span>
                  {p.closeDate && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-sm font-bold" style={{ background: soon ? '#fef3c7' : '#f3f4f6', color: closed ? '#6b7280' : soon ? '#b45309' : '#374151' }}>
                      <Clock size={11} /> {closesIn(p.closeDate)} · {fmtClose(p.closeDate)}
                    </span>
                  )}
                </div>
                <h2 className="mb-1" style={{ fontSize: '1.2rem', lineHeight: 1.3 }}>{p.title}</h2>
                {p.source && <p className="text-xs mb-1 flex items-center gap-1.5" style={{ color: 'var(--muted)' }}><Building2 size={12} /> {p.source}</p>}
                {full ? (
                  <>
                    {p.summary && <p className="text-sm mb-4" style={{ fontSize: '0.92rem' }}>{p.summary}</p>}
                    {p.link && <a href={p.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: '#ea580c' }}>{p.type === 'tender' ? 'View tender' : 'Read more'} <ExternalLink size={14} /></a>}
                  </>
                ) : (
                  <p className="text-xs flex items-center gap-1.5 mt-3" style={{ color: 'var(--muted)' }}><Lock size={12} /> Details and link are for members</p>
                )}
              </article>
            )
          })}
        </div>
      )}

      {member && (
        <p className="text-xs mt-8 inline-flex items-center gap-2" style={{ color: 'var(--muted)' }}>
          <BellRing size={13} />
          {member.status === 'verified' ? (optedOut ? 'Board emails are off.' : 'Verified members get Grand Bahama opportunities by email.') : 'Board emails start once your business is verified.'}{' '}
          <Link href={signPath(unsubscribePathFor(member.id), 365 * 24 * 3600 * 1000)} className="font-bold" style={{ color: '#ea580c' }}>Manage email alerts</Link>
        </p>
      )}
    </>
  )

  if (full) return <MemberShell active="/builders-circle/board" title="Jobs & news board" status={member!.status}>{body}</MemberShell>

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bc-dark bc-hero pt-28 pb-10 px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-5">
          <Link href="/builders-circle" className="shrink-0"><BuildersCircleLogo size={88} priority className="w-16 md:w-[88px]" sizes="(min-width: 768px) 88px, 64px" /></Link>
          <div>
            <div className="section-label mb-2" style={{ color: 'var(--amber)' }}>Builders Circle · Grand Bahama</div>
            <h1 className="font-black" style={{ fontSize: 'clamp(1.8rem, 4.5vw, 2.8rem)' }}>Jobs &amp; news board</h1>
            <p className="mt-2 text-sm">Government tenders, jobs and construction news for Grand Bahama builders.</p>
          </div>
        </div>
      </div>
      <div className="bc-light flex-1 pt-10 pb-20 px-6"><div className="max-w-5xl mx-auto">{body}</div></div>
    </div>
  )
}
