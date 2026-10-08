import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { ShieldCheck, FileCheck2, ClipboardList, HandCoins, MapPin } from 'lucide-react'
import { prisma } from '@/lib/db'
import { pageMeta } from '@/lib/seo'
import { REQUIRED_GROUPS, SETTLEMENTS } from '@/lib/builders-circle/constants'

export const metadata = pageMeta(
  '/builders-circle',
  'Builders Circle — Verified Contractors in Grand Bahama',
  'Join the Groundwork BHS Builders Circle: a verified network of Grand Bahama contractors. Upload your documents once, get verified, and bid on construction jobs in Freeport, Lucaya and across the island.',
)
export const dynamic = 'force-dynamic'

async function stats() {
  try {
    const [verified, openJobs] = await Promise.all([
      prisma.circleMember.count({ where: { status: 'verified' } }),
      prisma.circleJob.count({ where: { status: 'open' } }),
    ])
    return { verified, openJobs }
  } catch {
    return null
  }
}

export default async function BuildersCircleLanding() {
  const [{ userId }, s] = await Promise.all([auth(), stats()])
  let isMember = false
  if (userId) {
    try { isMember = !!(await prisma.circleMember.findUnique({ where: { userId }, select: { id: true } })) } catch { /* table not ready */ }
  }
  const primary = isMember ? { href: '/builders-circle/dashboard', label: 'Go to my dashboard' } : { href: userId ? '/builders-circle/join' : '/sign-up?redirect_url=/builders-circle/join', label: 'Join the Builders Circle — free' }

  const steps = [
    { icon: ClipboardList, title: 'Create your profile', text: 'Tell us about your business, your trades and the parts of Grand Bahama you cover.' },
    { icon: FileCheck2, title: 'Upload your documents', text: 'Securely upload your licence, NIB letter and ID. Only you and our verification team can see them.' },
    { icon: ShieldCheck, title: 'Get verified', text: 'We check every document by hand. Verified members get the Builders Circle badge on our contractor directory.' },
    { icon: HandCoins, title: 'Bid on jobs', text: 'See full job details and send sealed estimates. Other contractors never see your price.' },
  ]

  return (
    <div className="min-h-screen pt-28 pb-24 px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="section-label mb-4" style={{ color: 'var(--amber)' }}>Grand Bahama · Contractor Network</div>
        <h1 className="font-black mb-6" style={{ color: 'var(--text-bright)', fontSize: 'clamp(2.5rem, 6vw, 4.5rem)' }}>Builders Circle</h1>
        <p className="max-w-2xl mb-8 text-lg" style={{ color: 'var(--text-secondary)' }}>
          A verified network of contractors on Grand Bahama. Get checked once, show homeowners and developers you are the real deal,
          and bid on construction jobs posted by Groundwork BHS — from Freeport and Lucaya to West End and East End.
        </p>
        <div className="flex gap-3 flex-wrap mb-10">
          <Link href={primary.href} className="btn-glow px-6 py-3 rounded-sm font-bold text-sm" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>{primary.label}</Link>
          {!userId && <Link href="/sign-in?redirect_url=/builders-circle/dashboard" className="px-6 py-3 rounded-sm font-bold text-sm" style={{ border: '1px solid var(--cyan-border)', color: 'var(--text-secondary)' }}>Member sign in</Link>}
        </div>

        {s && (
          <div className="flex gap-6 flex-wrap mb-16">
            <div className="px-5 py-3 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
              <div className="text-2xl font-black" style={{ color: 'var(--cyan)' }}>{s.verified}</div>
              <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Verified members</div>
            </div>
            <div className="px-5 py-3 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
              <div className="text-2xl font-black" style={{ color: 'var(--amber)' }}>{s.openJobs}</div>
              <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Open jobs</div>
            </div>
            <div className="px-5 py-3 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
              <div className="text-2xl font-black" style={{ color: '#059669' }}>Free</div>
              <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Founding membership</div>
            </div>
          </div>
        )}

        <h2 className="mb-8" style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)' }}>How it works</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
          {steps.map((st, i) => (
            <div key={st.title} className="p-6 rounded-sm" style={{ background: 'var(--navy-card)', border: '1px solid var(--cyan-border)' }}>
              <st.icon size={22} style={{ color: 'var(--cyan)' }} />
              <div className="text-xs font-mono mt-4 mb-1" style={{ color: 'var(--amber)' }}>STEP {i + 1}</div>
              <h3 className="mb-2" style={{ fontSize: '1.15rem' }}>{st.title}</h3>
              <p className="text-sm" style={{ fontSize: '0.92rem' }}>{st.text}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="p-6 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
            <h3 className="mb-4" style={{ fontSize: '1.2rem' }}>Documents we check</h3>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {REQUIRED_GROUPS.map(g => <li key={g.key}>✓ <strong style={{ color: 'var(--text-primary)' }}>{g.label}</strong> (required)</li>)}
              <li>○ Insurance certificate, VAT certificate, trade certifications (optional, shown on your profile)</li>
            </ul>
            <p className="text-xs mt-4" style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>Freeport Port Area businesses can upload their Grand Bahama Port Authority licence instead of a Business Licence. We track expiry dates so your verification stays current.</p>
          </div>
          <div className="p-6 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
            <h3 className="mb-4 flex items-center gap-2" style={{ fontSize: '1.2rem' }}><MapPin size={18} style={{ color: 'var(--amber)' }} /> Grand Bahama only</h3>
            <p className="text-sm mb-3" style={{ fontSize: '0.92rem' }}>The Builders Circle is launching on Grand Bahama. Choose the areas you work in:</p>
            <div className="flex flex-wrap gap-2">
              {SETTLEMENTS.map(x => <span key={x} className="text-xs px-2 py-0.5 rounded-sm font-mono" style={{ background: 'var(--amber-dim)', color: 'var(--amber)', border: '1px solid rgba(245,158,11,0.3)' }}>{x}</span>)}
            </div>
          </div>
        </div>

        <div className="p-8 rounded-sm text-center" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
          <h2 className="mb-3" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>Founding members join free</h2>
          <p className="mb-6 max-w-xl mx-auto text-sm">Your documents are stored privately and are only seen by you and the Groundwork verification team. Estimates are sealed: only Groundwork sees your price.</p>
          <Link href={primary.href} className="inline-block px-6 py-3 rounded-sm font-bold text-sm" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>{primary.label}</Link>
        </div>
      </div>
    </div>
  )
}
