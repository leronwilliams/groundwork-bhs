/**
 * Access control for Groundwork BHS.
 * Determines what each subscription tier can do.
 */

export type Tier = 'free' | 'pro' | 'builder'

export function canAccessAdvisor(tier: Tier, sessionCount: number): boolean {
  if (tier === 'pro' || tier === 'builder') return true
  return sessionCount < 5 // free: 5 sessions/month
}

export function getLeadCost(tier: Tier): number {
  if (tier === 'builder') return 0    // free for Builder
  return 2000                          // $20 for free and pro
}

export function canDownloadBOQ(tier: Tier): boolean {
  return tier === 'pro' || tier === 'builder'
}

export function canAccessPermitPrep(tier: Tier): boolean {
  return tier === 'pro' || tier === 'builder'
}

export function getAdvisorSessionsRemaining(tier: Tier, usedThisMonth: number): number | null {
  if (tier === 'pro' || tier === 'builder') return null // unlimited
  return Math.max(0, 5 - usedThisMonth)
}

export function getTierLabel(tier: Tier): string {
  const labels: Record<Tier, string> = {
    free: 'Free',
    pro: 'Pro',
    builder: 'Builder',
  }
  return labels[tier] || 'Free'
}

export const TIER_FEATURES: Record<Tier, string[]> = {
  free: [
    '5 advisor sessions/month',
    'All guides & articles',
    'Permit checklists',
    'Property tax calculator',
    'Contractor directory (view only)',
  ],
  pro: [
    'Unlimited advisor sessions',
    'BOQ download access',
    'Permit document preparation',
    'Contractor agreement template',
    'Priority advisor responses',
    'All Free features',
  ],
  builder: [
    'Everything in Pro',
    'Free contractor leads (unlimited)',
    'BOQ + hardware pricing reports',
    'Hardware store quote service',
    'Direct contractor introductions',
    'Dedicated account support',
  ],
}
