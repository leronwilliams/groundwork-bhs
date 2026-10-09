import { pageMeta } from '@/lib/seo'
import { requireMemberPage } from '@/lib/builders-circle/page-auth'
import { MemberShell } from '@/components/builders-circle/ui'
import { ProfileEditor } from './ProfileEditor'

export const metadata = pageMeta('/builders-circle/profile', 'My Profile', 'Your Builders Circle profile.', { noindex: true })
export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const { member } = await requireMemberPage('/builders-circle/profile')
  const c = member.contractor
  return (
    <MemberShell active="/builders-circle/profile" title="Business profile" status={member.status}>
      <ProfileEditor initial={{
        businessName: c.name, contactName: c.contactName || '', email: c.email || '', phone: c.phone || '', whatsapp: c.whatsapp || '',
        trades: member.trades, serviceAreas: member.serviceAreas, businessAddress: member.businessAddress || '',
        yearsInBusiness: member.yearsInBusiness != null ? String(member.yearsInBusiness) : '', description: c.description || '', website: c.website || '',
      }} />
    </MemberShell>
  )
}
