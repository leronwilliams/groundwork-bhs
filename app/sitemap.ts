import type { MetadataRoute } from 'next'
import { prisma } from '@/lib/db'
import { SITE_URL } from '@/lib/seo'
import { excludePlaceholders } from '@/lib/contractors'
import { HAS_CONTACT } from '@/lib/contact'

export const revalidate = 3600

const STATIC_ROUTES: { path: string; priority: number; freq: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '', priority: 1, freq: 'weekly' },
  { path: '/guides', priority: 0.9, freq: 'weekly' },
  { path: '/permits', priority: 0.9, freq: 'monthly' },
  { path: '/boq-wizard', priority: 0.9, freq: 'monthly' },
  { path: '/services', priority: 0.9, freq: 'monthly' },
  { path: '/advisor', priority: 0.8, freq: 'monthly' },
  { path: '/contractors', priority: 0.8, freq: 'weekly' },
  { path: '/post-project', priority: 0.8, freq: 'monthly' },
  { path: '/duty-exemptions', priority: 0.8, freq: 'monthly' },
  { path: '/property-tax', priority: 0.8, freq: 'monthly' },
  { path: '/financing', priority: 0.7, freq: 'monthly' },
  { path: '/pricing', priority: 0.7, freq: 'monthly' },
  { path: '/become-a-contractor', priority: 0.6, freq: 'monthly' },
  { path: '/builders-circle', priority: 0.6, freq: 'monthly' },
  { path: '/partners', priority: 0.6, freq: 'monthly' },
  { path: '/partners/join', priority: 0.4, freq: 'yearly' },
  { path: '/disclaimer', priority: 0.2, freq: 'yearly' },
  { path: '/privacy', priority: 0.2, freq: 'yearly' },
  { path: '/terms', priority: 0.2, freq: 'yearly' },
  { path: '/credits', priority: 0.1, freq: 'yearly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const routes = HAS_CONTACT ? [...STATIC_ROUTES, { path: '/contact', priority: 0.5, freq: 'yearly' as const }] : STATIC_ROUTES
  const entries: MetadataRoute.Sitemap = routes.map(r => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.freq,
    priority: r.priority,
  }))
  try {
    const [guides, contractors] = await Promise.all([
      prisma.guide.findMany({ select: { slug: true, createdAt: true } }),
      prisma.contractor.findMany({ where: { listingStatus: 'active', ...excludePlaceholders() }, select: { id: true } }),
    ])
    for (const g of guides) entries.push({ url: `${SITE_URL}/guides/${g.slug}`, lastModified: g.createdAt, changeFrequency: 'monthly', priority: 0.7 })
    for (const c of contractors) entries.push({ url: `${SITE_URL}/contractors/${c.id}`, changeFrequency: 'weekly', priority: 0.5 })
  } catch (err) {
    console.error('[sitemap] DB unavailable, static routes only:', err)
  }
  return entries
}
