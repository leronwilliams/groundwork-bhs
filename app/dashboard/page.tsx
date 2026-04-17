import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { FileText, Calculator, Users, MessageSquare, Home, Download, ArrowRight, CheckCircle, Clock, Package, AlertCircle, Zap } from 'lucide-react'

const ORDER_LABELS: Record<string, string> = {
  lead: 'Contractor Lead',
  estimate_single: 'Single Trade Estimate',
  estimate_full: 'Full Project Estimate',
  boq: 'Bill of Quantities',
  boq_hardware: 'BOQ + Hardware Pricing',
  boq_quotes: 'BOQ + Hardware Store Quotes',
  permit_prep: 'Permit Document Prep',
  contract: 'Contractor Agreement',
  tax_appeal: 'Property Tax Appeal Letter',
}

const STATUS_BADGE: Record<string, { label: string; color: string; icon: LucideIcon }> = {
  pending:    { label: 'Pending Payment', color: '#f5a623', icon: Clock },
  paid:       { label: 'Paid', color: '#00d4f5', icon: CheckCircle },
  processing: { label: 'In Progress', color: '#6366f1', icon: Clock },
  delivered:  { label: 'Delivered', color: '#059669', icon: CheckCircle },
  refunded:   { label: 'Refunded', color: '#ef4444', icon: AlertCircle },
}

const STAGE_LABELS = ['Planning', 'Design', 'Permits', 'Foundation', 'Structure', 'Finishing', 'Complete']

const QUICK_ACTIONS = [
  { label: 'Upload Plans for Estimate', href: '/estimate/new', icon: Calculator as LucideIcon, accent: 'var(--cyan)', desc: 'Get a professional cost estimate' },
  { label: 'Get a Bill of Quantities', href: '/services', icon: FileText as LucideIcon, accent: '#6366f1', desc: 'Full itemised material list' },
  { label: 'Find a Contractor', href: '/contractors', icon: Users as LucideIcon, accent: 'var(--amber)', desc: 'Matched to your trade & island' },
  { label: 'Ask the AI Advisor', href: '/advisor', icon: MessageSquare as LucideIcon, accent: '#059669', desc: 'Bahamian construction guidance' },
  { label: 'Calculate Property Tax', href: '/property-tax', icon: Home as LucideIcon, accent: '#e879f9', desc: 'Estimate your annual bill' },
  { label: 'Permit Checklist', href: '/permits', icon: Download as LucideIcon, accent: '#f97316', desc: 'What you need to get approved' },
]

export default async function DashboardPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const user = await currentUser()
  const firstName = user?.firstName || 'there'

  // Fetch DB user + subscription + orders + projects
  const dbUser = await prisma.user.findFirst({
    where: { clerkId: userId },
    include: {
      subscription: true,
      orders: { orderBy: { createdAt: 'desc' }, take: 10, include: { estimateResult: true } },
      projects: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  })

  const tier = dbUser?.subscription?.tier || 'free'
  const orders = dbUser?.orders || []
  const projects = dbUser?.projects || []

  // Advisor session count this month (from AdvisorSession table)
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const advisorSessions = dbUser ? await prisma.advisorSession.count({
    where: { userId: dbUser.id, createdAt: { gte: startOfMonth } },
  }) : 0

  const advisorLimit = 5
  const advisorPct = Math.min((advisorSessions / advisorLimit) * 100, 100)
  const advisorRemaining = Math.max(0, advisorLimit - advisorSessions)

  return (
    <div className="min-h-screen pt-24 pb-20 px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-12">
          <div>
            <div className="section-label mb-2">Dashboard</div>
            <h1 className="text-4xl font-black mb-1" style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
              Welcome back, {firstName}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-widest"
                style={{ background: tier === 'builder' ? 'rgba(245,166,35,0.15)' : tier === 'pro' ? 'rgba(0,212,245,0.15)' : 'rgba(148,163,184,0.15)', color: tier === 'builder' ? 'var(--amber)' : tier === 'pro' ? 'var(--cyan)' : '#94a3b8' }}>
                {tier.charAt(0).toUpperCase() + tier.slice(1)} Plan
              </span>
            </div>
          </div>
          {tier === 'free' && (
            <Link href="/pricing" className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-sm font-bold text-sm"
              style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
              <Zap size={14} /> Upgrade to Pro
            </Link>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-14">
          <div className="section-label mb-6">Quick Actions</div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {QUICK_ACTIONS.map(action => {
              const Icon = action.icon
              return (
                <Link key={action.label} href={action.href}
                  className="group relative rounded-sm overflow-hidden flex flex-col justify-end p-5 transition-transform duration-300 hover:-translate-y-1"
                  style={{ background: 'var(--navy-surface)', border: `1px solid ${action.accent}30`, minHeight: 120 }}>
                  <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${action.accent}08 0%, transparent 100%)` }} />
                  <div className="relative">
                    <div className="mb-2 p-1.5 rounded-sm inline-block" style={{ background: `${action.accent}18` }}>
                      <Icon size={16} strokeWidth={1.5} style={{ color: action.accent }} />
                    </div>
                    <p className="font-bold text-sm leading-tight mb-0.5" style={{ color: 'var(--text-primary)' }}>{action.label}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{action.desc}</p>
                  </div>
                  <ArrowRight size={14} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: action.accent }} />
                </Link>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-14">
          {/* Orders */}
          <div className="lg:col-span-2">
            <div className="section-label mb-4">My Orders</div>
            {orders.length === 0 ? (
              <div className="p-8 rounded-sm text-center" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
                <Package size={36} style={{ color: 'var(--muted)', margin: '0 auto 12px' }} strokeWidth={1.5} />
                <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No orders yet</p>
                <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Order an estimate, BOQ, or document service to get started.</p>
                <Link href="/services" className="inline-block px-5 py-2 rounded-sm font-bold text-sm" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>Browse Services</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => {
                  const badge = STATUS_BADGE[order.status] || STATUS_BADGE.pending
                  const BadgeIcon = badge.icon
                  const hasResult = !!order.estimateResult
                  return (
                    <div key={order.id} className="p-4 rounded-sm flex items-center justify-between gap-4"
                      style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                          {ORDER_LABELS[order.type] || order.type}
                        </p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                          ${(order.amount / 100).toFixed(2)} · {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-sm"
                          style={{ background: `${badge.color}18`, color: badge.color }}>
                          <BadgeIcon size={11} strokeWidth={2} /> {badge.label}
                        </span>
                        {hasResult && (
                          <Link href={`/estimate/${order.id}`}
                            className="text-xs font-bold px-3 py-1.5 rounded-sm"
                            style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
                            View Result
                          </Link>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Usage + Projects sidebar */}
          <div className="space-y-5">
            {/* Advisor Usage */}
            <div className="p-5 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
              <div className="section-label mb-3">AI Advisor</div>
              {tier === 'free' ? (
                <>
                  <div className="flex justify-between text-sm mb-2">
                    <span style={{ color: 'var(--text-secondary)' }}>Sessions this month</span>
                    <span className="font-bold" style={{ color: advisorSessions >= advisorLimit ? '#ef4444' : 'var(--text-primary)' }}>
                      {advisorSessions}/{advisorLimit}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full mb-3" style={{ background: 'var(--navy-card)' }}>
                    <div className="h-1.5 rounded-full transition-all" style={{ width: `${advisorPct}%`, background: advisorSessions >= advisorLimit ? '#ef4444' : 'var(--cyan)' }} />
                  </div>
                  {advisorSessions >= advisorLimit ? (
                    <div>
                      <p className="text-xs mb-3" style={{ color: '#ef4444' }}>Monthly limit reached.</p>
                      <Link href="/pricing" className="block text-center py-2 rounded-sm font-bold text-xs" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
                        Upgrade for Unlimited
                      </Link>
                    </div>
                  ) : (
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                      {advisorRemaining} session{advisorRemaining !== 1 ? 's' : ''} remaining. Upgrade Pro for unlimited.
                    </p>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} style={{ color: '#059669' }} />
                  <p className="text-sm font-bold" style={{ color: '#059669' }}>Unlimited sessions</p>
                </div>
              )}
            </div>

            {/* Plan card */}
            <div className="p-5 rounded-sm" style={{ background: 'var(--navy-surface)', border: `1px solid ${tier === 'builder' ? 'var(--amber)' : tier === 'pro' ? 'var(--cyan)' : 'var(--cyan-border)'}` }}>
              <div className="section-label mb-2">Your Plan</div>
              <p className="text-2xl font-black mb-1" style={{ color: tier === 'builder' ? 'var(--amber)' : tier === 'pro' ? 'var(--cyan)' : 'var(--text-primary)' }}>
                {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </p>
              {tier === 'free' && (
                <>
                  <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>5 advisor sessions/month · No BOQ downloads</p>
                  <Link href="/pricing" className="block text-center py-2 rounded-sm font-bold text-xs" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
                    Upgrade → $19/month
                  </Link>
                </>
              )}
              {tier === 'pro' && <p className="text-xs" style={{ color: 'var(--muted)' }}>Unlimited sessions · BOQ downloads · Permit prep</p>}
              {tier === 'builder' && <p className="text-xs" style={{ color: 'var(--muted)' }}>Everything + free leads · Hardware quotes · Priority support</p>}
            </div>
          </div>
        </div>

        {/* Projects */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="section-label">My Projects</div>
          </div>
          {projects.length === 0 ? (
            <div className="p-8 rounded-sm text-center" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
              <Home size={36} style={{ color: 'var(--muted)', margin: '0 auto 12px' }} strokeWidth={1.5} />
              <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>No projects yet</p>
              <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>Start by asking the AI Advisor about your project or ordering an estimate.</p>
              <Link href="/advisor" className="inline-block px-5 py-2 rounded-sm font-bold text-sm" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>Ask the Advisor</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map(project => (
                <div key={project.id} className="p-5 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{project.title}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{project.island} · {project.projectType}</p>
                    </div>
                    <Link href="/services" className="text-xs font-bold px-3 py-1.5 rounded-sm" style={{ border: '1px solid var(--cyan-border)', color: 'var(--cyan)' }}>
                      Get Estimate →
                    </Link>
                  </div>
                  {/* Stage tracker */}
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {STAGE_LABELS.map((label, i) => {
                      const active = i < (project.stage || 1)
                      const current = i === (project.stage || 1) - 1
                      return (
                        <div key={label} className="flex items-center gap-1 shrink-0">
                          <div className="flex flex-col items-center gap-1">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                              style={{ background: current ? 'var(--cyan)' : active ? 'rgba(0,212,245,0.2)' : 'var(--navy-card)', color: current ? 'var(--navy)' : active ? 'var(--cyan)' : 'var(--muted)', border: current ? 'none' : `1px solid ${active ? 'var(--cyan)' : 'var(--navy-card)'}` }}>
                              {active ? (current ? i + 1 : '✓') : i + 1}
                            </div>
                            <span className="text-xs whitespace-nowrap" style={{ color: active ? 'var(--text-secondary)' : 'var(--muted)', fontSize: '0.6rem' }}>{label}</span>
                          </div>
                          {i < STAGE_LABELS.length - 1 && (
                            <div className="w-6 h-px mb-4 shrink-0" style={{ background: active && i < (project.stage || 1) - 1 ? 'var(--cyan)' : 'var(--navy-card)' }} />
                          )}
                        </div>
                      )
                    })}
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
