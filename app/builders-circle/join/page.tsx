import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { pageMeta } from '@/lib/seo'
import { getCircleContext } from '@/lib/builders-circle/server'
import { JoinForm } from './JoinForm'
import { BuildersCircleLogo } from '@/components/builders-circle/ui'

export const metadata = pageMeta('/builders-circle/join', 'Join the Builders Circle', 'Apply to join the Grand Bahama Builders Circle.', { noindex: true })
export const dynamic = 'force-dynamic'

export default async function JoinPage() {
  const ctx = await getCircleContext()
  if (!ctx.userId) redirect('/sign-up?redirect_url=/builders-circle/join')
  if (ctx.member) redirect('/builders-circle/dashboard')
  const [user, listing] = await Promise.all([currentUser(), prisma.contractor.findUnique({ where: { userId: ctx.userId } })])

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bc-dark bc-hero pt-28 pb-10 px-6">
        <div className="max-w-3xl mx-auto">
          <BuildersCircleLogo size={88} priority className="w-16 md:w-[88px] mb-5" sizes="(min-width: 768px) 88px, 64px" />
          <div className="section-label mb-4" style={{ color: 'var(--amber)' }}>Builders Circle · Step 1 of 2</div>
          <h1 className="font-black mb-3" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>Your business profile</h1>
          <p>Tell us about your business. Next you will upload your licence, NIB letter and photo ID for verification. Founding membership is free.</p>
        </div>
      </div>
      <div className="bc-light flex-1 pt-10 pb-24 px-6">
      <div className="max-w-3xl mx-auto p-6 md:p-8 rounded-sm" style={{ background: '#ffffff', border: '1px solid var(--cyan-border)', boxShadow: 'var(--bc-card-shadow)' }}>
        <JoinForm
          hasListing={!!listing}
          initial={{
            businessName: listing?.name || '',
            contactName: listing?.contactName || user?.fullName || '',
            email: listing?.email || user?.primaryEmailAddress?.emailAddress || '',
            phone: listing?.phone || '',
            whatsapp: listing?.whatsapp || '',
            trades: [], serviceAreas: [], businessAddress: '', yearsInBusiness: '',
            description: listing?.description || '', website: listing?.website || '',
          }}
        />
      </div>
      </div>
    </div>
  )
}
