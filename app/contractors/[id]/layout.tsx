import type { Metadata } from 'next'
import { prisma } from '@/lib/db'
import { pageMeta } from '@/lib/seo'
import { isHiddenContractor } from '@/lib/contractors'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const c = await prisma.contractor
    .findUnique({ where: { id }, select: { name: true, trade: true, island: true, listingStatus: true } })
    .catch(() => null)
  if (!c || c.listingStatus !== 'active' || isHiddenContractor(id)) {
    return { title: 'Contractor not found', robots: { index: false, follow: false } }
  }
  return pageMeta(
    `/contractors/${id}`,
    `${c.name} — ${c.trade} in ${c.island}`,
    `${c.name}: ${c.trade} serving ${c.island}, The Bahamas. Contact details and homeowner reviews on Groundwork.`,
  )
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
