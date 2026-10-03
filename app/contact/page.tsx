import Link from 'next/link'
import { pageMeta } from '@/lib/seo'
import { ContactDetails } from '@/components/ui/ContactDetails'
import { HAS_CONTACT } from '@/lib/contact'

export const metadata = pageMeta('/contact', 'Contact Us', 'Get in touch with Groundwork BHS about estimates, BOQs, permits and finding contractors in The Bahamas.')

export default function ContactPage() {
  return (
    <div className="min-h-screen pt-28 pb-20 px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="section-label mb-4">Contact</div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>Talk to Groundwork</h1>
        <p className="text-lg mb-10" style={{ color: 'var(--text-secondary)' }}>
          Questions about an estimate, a BOQ, permits or finding a contractor? We&apos;re here to help.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          {HAS_CONTACT && (
            <div className="p-6 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
              <ContactDetails size="lg" />
            </div>
          )}
          <div className="p-6 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
            <h2 className="text-lg font-bold mb-2">Need a quick answer?</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Our AI Advisor answers questions about Bahamian permits, building codes and costs right away.
            </p>
            <Link href="/advisor" className="inline-block px-5 py-2.5 rounded-sm font-bold text-sm" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
              Ask the Advisor →
            </Link>
          </div>
          <div className="p-6 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
            <h2 className="text-lg font-bold mb-2">Starting a project?</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              Tell us what you&apos;re building and we&apos;ll match you with contractors on your island.
            </p>
            <Link href="/post-project" className="inline-block px-5 py-2.5 rounded-sm font-bold text-sm" style={{ border: '1px solid var(--cyan-border)', color: 'var(--cyan)' }}>
              Post a Project →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
