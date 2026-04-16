import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { SectionBadge } from '@/components/ui/SectionBadge'
import { IslandTag } from '@/components/ui/IslandTag'
import { BlueprintCard } from '@/components/ui/BlueprintCard'

export const revalidate = 60

interface Params {
  params: Promise<{ slug: string }>
}

export default async function GuideDetailPage({ params }: Params) {
  const { slug } = await params
  const [guide, related] = await Promise.all([
    prisma.guide.findUnique({ where: { slug } }),
    prisma.guide.findMany({ take: 3, orderBy: { order: 'asc' } }),
  ])

  if (!guide) notFound()

  return (
    <div className="min-h-screen pt-24 pb-20 px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
          {/* Main content */}
          <article className="lg:col-span-3">
            <div className="flex gap-3 mb-6 flex-wrap">
              <SectionBadge label={guide.category} />
              {guide.island !== 'all' && <IslandTag island={guide.island} />}
            </div>

            <h1 className="text-5xl font-bold mb-6" style={{ fontFamily: 'Syne, sans-serif' }}>
              {guide.title}
            </h1>

            {guide.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={guide.imageUrl} alt={guide.title} className="w-full h-64 object-cover rounded-sm mb-8" />
            )}

            <div
              className="prose prose-invert max-w-none text-base leading-relaxed"
              style={{ color: 'var(--text)', whiteSpace: 'pre-wrap' }}
            >
              {guide.content}
            </div>

            {/* Ask advisor prompt */}
            <div
              className="mt-12 p-6 rounded-sm"
              style={{ background: 'var(--cyan-dim)', border: '1px solid var(--cyan-border)' }}
            >
              <p className="mb-3" style={{ color: 'var(--text)' }}>
                Have a question about <strong>{guide.title}</strong>?
              </p>
              <Link
                href={`/advisor`}
                className="inline-block px-5 py-2.5 rounded-sm text-sm font-semibold"
                style={{ background: 'var(--cyan)', color: 'var(--navy)' }}
              >
                Ask the Advisor →
              </Link>
            </div>
          </article>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="text-xs uppercase tracking-wider mb-4 font-mono" style={{ color: 'var(--muted)' }}>
              Related Guides
            </div>
            <div className="space-y-4">
              {related.filter(r => r.id !== guide.id).slice(0, 3).map(r => (
                <Link key={r.id} href={`/guides/${r.slug}`}>
                  <BlueprintCard category={r.category}>
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{r.title}</p>
                  </BlueprintCard>
                </Link>
              ))}
            </div>

            <div className="mt-8">
              <Link
                href="/guides"
                className="text-sm"
                style={{ color: 'var(--cyan)' }}
              >
                ← All guides
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
