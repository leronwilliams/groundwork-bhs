import Link from 'next/link'
import { ContactDetails } from '@/components/ui/ContactDetails'
import { HAS_CONTACT } from '@/lib/contact'

const LINKS: [string, string][] = [
  ['/guides', 'Guides'], ['/permits', 'Permits'], ['/boq-wizard', 'BOQ Wizard'], ['/services', 'Services'],
  ['/property-tax', 'Property Tax'], ['/duty-exemptions', 'Duty Exemptions'], ['/financing', 'Financing'],
  ['/contractors', 'Contractors'], ['/post-project', 'Post a Project'], ['/partners', 'Partners'],
  ['/advisor', 'Advisor'], ['/pricing', 'Pricing'], ...(HAS_CONTACT ? [['/contact', 'Contact'] as [string, string]] : []), ['/credits', 'Credits'],
]

export function Footer() {
  return (
    <footer className="py-14 px-6" style={{ borderTop: '1px solid var(--cyan-border)', background: 'var(--navy)' }}>
      <div className={`max-w-7xl mx-auto grid grid-cols-1 gap-10 ${HAS_CONTACT ? 'md:grid-cols-[1fr_2fr_1fr]' : 'md:grid-cols-[1fr_2fr]'}`}>
        <div>
          <div className="text-xl font-black mb-1" style={{ fontFamily: 'Syne, sans-serif', color: 'white', letterSpacing: '-0.02em' }}>Groundwork</div>
          <div className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Build right. From the ground up.</div>
          <div className="text-sm font-mono" style={{ color: 'var(--muted)' }}>© 2026 Groundwork BHS</div>
          <div className="flex gap-4 text-xs mt-2" style={{ color: 'var(--muted)' }}>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/disclaimer" className="hover:text-white transition-colors">Disclaimer</Link>
          </div>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-sm font-medium content-start" style={{ color: 'var(--text-secondary)' }}>
          {LINKS.map(([href, label]) => (
            <Link key={href} href={href} className="hover:text-white transition-colors">{label}</Link>
          ))}
        </nav>
        {HAS_CONTACT && (
          <div>
            <div className="text-xs uppercase tracking-wider font-mono mb-3" style={{ color: 'var(--amber)' }}>Contact us</div>
            <ContactDetails />
          </div>
        )}
      </div>
    </footer>
  )
}
