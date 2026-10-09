import Link from 'next/link'
import Image from 'next/image'
import { STATUS_COLORS } from '@/lib/builders-circle/constants'

export const fieldStyle = { background: 'var(--navy-surface)', border: '1px solid var(--bc-field-border, var(--cyan-border))', color: 'var(--text-primary)' }
export const cardStyle = { background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', boxShadow: 'var(--bc-card-shadow, none)' }

export function StatusPill({ status, label }: { status: string; label?: string }) {
  const color = STATUS_COLORS[status] || '#6b7a99'
  return (
    <span className="inline-block whitespace-nowrap text-xs px-2 py-0.5 rounded-sm font-bold uppercase tracking-wide" style={{ background: `var(--pill-bg-${status}, ${color}22)`, color: `var(--pill-${status}, ${color})`, border: `1px solid var(--pill-border-${status}, ${color}55)` }}>
      {label || status}
    </span>
  )
}

export function CircleBadge({ small = false }: { small?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 ${small ? 'text-[10px]' : 'text-xs'} px-2 py-0.5 rounded-sm font-bold uppercase tracking-wide`}
      style={{ background: 'rgba(245,166,35,0.15)', color: 'var(--amber)', border: '1px solid rgba(245,166,35,0.45)' }}>
      ◆ Builders Circle Verified
    </span>
  )
}

/** Builders Circle logo. `onDark` uses the variant with white lettering for black bands. */
export function BuildersCircleLogo({ size, onDark = true, priority = false, className = '', sizes }: { size: number; onDark?: boolean; priority?: boolean; className?: string; sizes?: string }) {
  return (
    <Image
      src={onDark ? '/builders-circle/logo-dark-bg.png' : '/builders-circle/logo-light-bg.png'}
      alt="Heroic Builders Circle logo"
      width={size} height={size} priority={priority} quality={90}
      sizes={sizes || `${size}px`}
      className={className}
      style={{ height: 'auto' }}
    />
  )
}

const TABS = [
  { href: '/builders-circle/dashboard', label: 'Dashboard' },
  { href: '/builders-circle/documents', label: 'Documents' },
  { href: '/builders-circle/jobs', label: 'Job Board' },
  { href: '/builders-circle/estimates', label: 'My Estimates' },
  { href: '/builders-circle/profile', label: 'Profile' },
]

export function MemberShell({ active, title, children, status }: { active: string; title: string; children: React.ReactNode; status?: string }) {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="bc-dark bc-hero pt-24 pb-6 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 md:gap-5 mb-6">
            <Link href="/builders-circle" className="shrink-0" aria-label="Builders Circle home">
              <BuildersCircleLogo size={88} priority className="w-14 md:w-[88px]" sizes="(min-width: 768px) 88px, 56px" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <div className="section-label" style={{ color: 'var(--amber)' }}>Builders Circle · Grand Bahama</div>
                {status && <StatusPill status={status} label={status === 'applied' ? 'Under review' : status} />}
              </div>
              <h1 className="text-3xl md:text-4xl font-black" style={{ color: 'var(--text-bright)', fontSize: 'clamp(1.6rem, 4vw, 2.5rem)' }}>{title}</h1>
            </div>
          </div>
          <nav className="flex gap-2 flex-wrap">
            {TABS.map(t => (
              <Link key={t.href} href={t.href} className="px-3 py-1.5 rounded-sm text-xs font-bold" aria-current={active === t.href ? 'page' : undefined}
                style={{ background: active === t.href ? 'var(--cyan)' : 'var(--navy-surface)', color: active === t.href ? 'var(--navy)' : 'var(--text-secondary)', border: '1px solid var(--cyan-border)' }}>
                {t.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      <div className="bc-light flex-1 pt-10 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'error' | 'ok'; children: React.ReactNode }) {
  const c = { info: 'var(--cyan)', warn: 'var(--amber)', error: '#ef4444', ok: '#059669' }[tone]
  return <div className="p-4 rounded-sm text-sm mb-6" style={{ background: 'var(--navy-surface)', border: `1px solid ${c}`, color: 'var(--text-secondary)' }}>{children}</div>
}
