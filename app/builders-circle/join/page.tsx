import { redirect } from 'next/navigation'
import { currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { pageMeta } from '@/lib/seo'
import { getCircleContext } from '@/lib/builders-circle/server'
import { JoinForm } from './JoinForm'

export const metadata = pageMeta('/builders-circle/join', 'Join the Builders Circle', 'Apply to join the Grand Bahama Builders Circle.', { noindex: true })
export const dynamic = 'force-dynamic'

export default async function JoinPage() {
  const ctx = await getCircleContext()
  if (!ctx.userId) redirect('/sign-up?redirect_url=/builders-circle/join')
  if (ctx.member) redirect('/builders-circle/dashboard')
  const [user, listing] = await Promise.all([currentUser(), prisma.contractor.findUnique({ where: { userId: ctx.userId } })])

  return (
    <div className="min-h-screen pt-28 pb-24 px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="section-label mb-4" style={{ color: 'var(--amber)' }}>Builders Circle · Step 1 of 2</div>
        <h1 className="font-black mb-3" style={{ fontSize: 'clamp(2rem, 5vw, 3rem)' }}>Your business profile</h1>
        <p className="mb-10">Tell us about your business. Next you will upload your licence, NIB letter and photo ID for verification. Founding membership is free.</p>
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
  )
}
