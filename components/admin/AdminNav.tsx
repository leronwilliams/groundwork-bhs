import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/admin', label: 'Overview', icon: '📊' },
  { href: '/admin/contractors', label: 'Contractors', icon: '👷' },
  { href: '/admin/hardware-stores', label: 'Hardware Stores', icon: '🏪' },
  { href: '/admin/orders', label: 'Orders', icon: '📦' },
  { href: '/admin/users', label: 'Users', icon: '👤' },
  { href: '/admin/content', label: 'Content', icon: '📝' },
  { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
  { href: '/admin/partners', label: 'Partners', icon: '🤝' },
]

export function AdminNav() {
  return (
    <nav style={{ width: 220, background: 'var(--navy-surface)', borderRight: '1px solid var(--cyan-border)', minHeight: '100vh', padding: '24px 0', flexShrink: 0 }}>
      <div style={{ padding: '0 20px 24px', borderBottom: '1px solid var(--cyan-border)' }}>
        <div className="section-label" style={{ fontSize: '0.65rem' }}>ADMIN</div>
        <p className="font-bold text-sm" style={{ color: 'var(--text-primary)', marginTop: 4 }}>Groundwork BHS</p>
      </div>
      <div style={{ padding: '12px 0' }}>
        {NAV_ITEMS.map(item => (
          <Link key={item.href} href={item.href}
            className="flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors hover:bg-white hover:bg-opacity-5"
            style={{ color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '1rem' }}>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </div>
      <div style={{ padding: '12px 20px', borderTop: '1px solid var(--cyan-border)', marginTop: 'auto', position: 'absolute', bottom: 0, width: 220 }}>
        <Link href="/" className="text-xs" style={{ color: 'var(--muted)' }}>← Back to site</Link>
      </div>
    </nav>
  )
}
