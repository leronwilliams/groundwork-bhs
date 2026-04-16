import Link from 'next/link'
import { prisma } from '@/lib/db'
import { BlueprintCard } from '@/components/ui/BlueprintCard'
import { SectionBadge } from '@/components/ui/SectionBadge'
import { IslandTag } from '@/components/ui/IslandTag'

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
            {guides.map(guide => (
              <Link key={guide.id} href={`/guides/${guide.slug}`}>
                <BlueprintCard
                  category={guide.category}
                  island={guide.island !== 'all' ? guide.island : undefined}
                >
                  {guide.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={guide.imageUrl}
                      alt={guide.title}
                      className="w-full h-40 object-cover rounded-sm mb-4"
                    />
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
