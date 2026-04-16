import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { BlueprintCard } from '@/components/ui/BlueprintCard'
import { StageTracker } from '@/components/ui/StageTracker'

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await prisma.user.findUnique({ where: { clerkId: userId }, include: { projects: { orderBy: { updatedAt: 'desc' } } } })
  const projects = user?.projects || []

  return (
    <div className="min-h-screen pt-24 pb-20 px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="text-xs uppercase tracking-widest mb-2 font-mono" style={{ color: 'var(--cyan)' }}>
              Dashboard
            </div>
            <h1 className="text-4xl font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
              Your Projects
            </h1>
          </div>
          <Link
            href="/dashboard/projects/new"
            className="px-5 py-3 rounded-sm font-semibold text-sm"
            style={{ background: 'var(--cyan)', color: 'var(--navy)' }}
          >
            + New Project
          </Link>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {[
            { href: '/guides', label: 'Guides', icon: '📖' },
            { href: '/permits', label: 'Permits', icon: '📋' },
            { href: '/property-tax', label: 'Property Tax', icon: '🏛️' },
            { href: '/advisor', label: 'AI Advisor', icon: '💬' },
          ].map(link => (
            <Link key={link.href} href={link.href}>
              <div
                className="p-4 rounded-sm text-center transition-all"
                style={{ background: 'var(--navy-card)', border: '1px solid var(--cyan-border)' }}
              >
                <div className="text-2xl mb-2">{link.icon}</div>
                <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>{link.label}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Projects */}
        {projects.length === 0 ? (
          <BlueprintCard>
            <div className="text-center py-10">
              <div className="text-4xl mb-4">🏗️</div>
              <h2 className="text-xl font-semibold mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
                No projects yet
              </h2>
              <p className="mb-6" style={{ color: 'var(--muted)' }}>
                Start tracking your build from planning through completion.
              </p>
              <Link
                href="/dashboard/projects/new"
                className="inline-block px-5 py-2.5 rounded-sm text-sm font-semibold"
                style={{ background: 'var(--cyan)', color: 'var(--navy)' }}
              >
                Create your first project
              </Link>
            </div>
          </BlueprintCard>
        ) : (
          <div className="space-y-6">
            {projects.map(project => (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                <BlueprintCard>
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-semibold" style={{ fontFamily: 'Syne, sans-serif' }}>
                        {project.title}
                      </h2>
                      <span className="text-sm" style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                        {project.island}
                      </span>
                    </div>
                    <StageTracker currentStage={project.stage} />
                    {project.notes && (
                      <p className="mt-4 text-sm" style={{ color: 'var(--muted)' }}>{project.notes}</p>
                    )}
                  </div>
                </BlueprintCard>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
