import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function PartnerDashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await currentUser()
  const email = user?.emailAddresses?.[0]?.emailAddress

  // Find partner by email
  const partner = email ? await prisma.partner.findFirst({
    where: { email },
    include: { adPlacements: true, referrals: { orderBy: { createdAt: 'desc' }, take: 10 } },
  }) : null

  if (!partner) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--navy)' }}>
        <div className="max-w-md w-full text-center p-12 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
          <div className="section-label mb-4">Partner Dashboard</div>
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Not a Partner Yet</h1>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>We could not find a partner account linked to {email}. Apply to join the Groundwork Partner Network.</p>
          <Link href="/partners/join" className="block py-3 rounded-sm font-bold text-sm" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
            Apply to Become a Partner
          </Link>
        </div>
      </div>
    )
  }

  const totalImpressions = partner.adPlacements.reduce((s, a) => s + a.impressions, 0)
  const totalClicks = partner.adPlacements.reduce((s, a) => s + a.clicks, 0)
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : '0.0'

  return (
    <div className="min-h-screen pt-24 pb-20 px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="section-label mb-2">Partner Dashboard</div>
        <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{partner.businessName}</h1>
        <div className="flex items-center gap-3 mb-8">
          <span className="text-xs font-bold px-2 py-0.5 rounded-sm capitalize" style={{ background: partner.approved ? 'rgba(5,150,105,0.2)' : 'rgba(245,166,35,0.2)', color: partner.approved ? '#059669' : 'var(--amber)' }}>
            {partner.approved ? (partner.active ? 'Active' : 'Approved — Not Active') : 'Pending Approval'}
          </span>
          <span className="text-xs font-bold px-2 py-0.5 rounded-sm capitalize" style={{ background: 'rgba(0,212,245,0.15)', color: 'var(--cyan)' }}>{partner.tier} tier</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Referrals', value: String(partner.referralCount) },
            { label: 'Ad Impressions', value: String(totalImpressions) },
            { label: 'Ad Clicks', value: String(totalClicks) },
            { label: 'Click Rate', value: ctr + '%' },
          ].map(stat => (
            <div key={stat.label} className="p-4 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
              <p className="text-xs uppercase tracking-wide font-bold mb-1" style={{ color: 'var(--muted)' }}>{stat.label}</p>
              <p className="text-2xl font-black" style={{ color: 'var(--cyan)' }}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Listing preview */}
          <div className="p-5 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--cyan)' }}>Your Listing</p>
            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{partner.businessName}</p>
            <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>{partner.category} · {partner.island}</p>
            {partner.description && <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{partner.description.slice(0, 120)}...</p>}
            <div className="mt-4 p-3 rounded-sm" style={{ background: 'var(--navy-card)', border: '1px solid var(--cyan-border)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--muted)' }}>Your referral link</p>
              <p className="font-mono text-xs" style={{ color: 'var(--cyan)' }}>groundworksbhs.com?ref={partner.referralCode}</p>
            </div>
          </div>

          {/* Ad placements */}
          <div className="p-5 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
            <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: 'var(--cyan)' }}>Ad Placements ({partner.adPlacements.length})</p>
            {partner.adPlacements.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted)' }}>No active ad placements. Contact us to add an ad placement to your listing.</p>
            ) : partner.adPlacements.map(ad => (
              <div key={ad.id} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(0,212,245,0.08)' }}>
                <div>
                  <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{ad.placement.replace(/_/g, ' ')}</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>{ad.impressions} impressions · {ad.clicks} clicks</p>
                </div>
                <span className="text-xs font-bold" style={{ color: ad.active ? '#059669' : 'var(--amber)' }}>{ad.active ? 'Live' : 'Pending'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent referrals */}
        <div>
          <p className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Recent Referrals ({partner.referrals.length})</p>
          {partner.referrals.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--muted)' }}>No referrals yet. Share your referral link to start tracking.</p>
          ) : (
            <div className="rounded-sm overflow-hidden" style={{ border: '1px solid var(--cyan-border)' }}>
              {partner.referrals.map((ref, i) => (
                <div key={ref.id} className="flex items-center justify-between px-4 py-3" style={{ background: i % 2 === 0 ? 'var(--navy-surface)' : 'var(--navy-card)', borderBottom: '1px solid rgba(0,212,245,0.06)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{ref.page}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold" style={{ color: ref.converted ? '#059669' : 'var(--muted)' }}>{ref.converted ? 'Converted' : 'Visited'}</span>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{new Date(ref.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
