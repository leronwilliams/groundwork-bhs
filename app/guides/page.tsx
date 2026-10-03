import Link from 'next/link'
import Image from 'next/image'
import { guideImage } from '@/lib/site-images'
import { prisma } from '@/lib/db'
import { BlueprintCard } from '@/components/ui/BlueprintCard'
import { SectionBadge } from '@/components/ui/SectionBadge'
import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta('/guides', 'Building Guides for The Bahamas', 'Step-by-step guides to permits, building codes, construction costs, land and property ownership in The Bahamas.')


export const revalidate = 60

const CATEGORIES = ['legal', 'finance', 'design', 'permits', 'contractors', 'insurance', 'property-tax']

export default async function GuidesPage() {
  const guides = await prisma.guide.findMany({ orderBy: [{ featured: 'desc' }, { order: 'asc' }] })

  return (
    <div className="min-h-screen pt-24 pb-20 px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="text-xs uppercase tracking-widest mb-3 font-mono" style={{ color: 'var(--cyan)' }}>
          Resource Library
        </div>
        <h1 className="text-5xl font-bold mb-4" style={{ fontFamily: 'Syne, sans-serif' }}>
          Building Guides
        </h1>
        <p className="mb-12 text-lg" style={{ color: 'var(--muted)' }}>
          Practical guides on permits, legal, financing, design, contractors, and property tax in the Bahamas.
        </p>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-12">
          {CATEGORIES.map(cat => (
            <SectionBadge key={cat} label={cat} className="cursor-pointer" />
          ))}
        </div>

        {guides.length === 0 ? (
          <div className="text-center py-20" style={{ color: 'var(--muted)' }}>
            Guides are being added. Check back soon.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {guides.map(guide => {
              const image = guideImage(guide.slug, guide.category)
              return (
              <Link key={guide.id} href={`/guides/${guide.slug}`}>
                <BlueprintCard
                  category={guide.category}
                  island={guide.island !== 'all' ? guide.island : undefined}
                >
                  {image && (
                    <div className="relative w-full h-40 mb-4 overflow-hidden rounded-sm">
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                  )}
                  <h2 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>
                    {guide.title}
                    {guide.featured && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 rounded-sm" style={{ background: 'var(--amber-dim)', color: 'var(--amber)' }}>
                        Featured
                      </span>
                    )}
                  </h2>
                  <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>{guide.excerpt}</p>
                  <span className="text-sm" style={{ color: 'var(--cyan)' }}>Read guide →</span>
                </BlueprintCard>
              </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
