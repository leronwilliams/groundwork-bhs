/** Pure board constants and helpers (safe for client and server). */

export const BOARD_TYPES = ['tender', 'job', 'news'] as const
export const BOARD_LOCATIONS = ['Grand Bahama', 'Nassau', 'Other'] as const
export type BoardType = (typeof BOARD_TYPES)[number]
export const TYPE_LABEL: Record<string, string> = { tender: 'Tender', job: 'Job', news: 'News' }
export const TYPE_COLOR: Record<string, string> = { tender: '#ea580c', job: '#0f766e', news: '#1f2937' }

export const isClosed = (p: { closeDate: Date | null }) => !!p.closeDate && p.closeDate.getTime() < Date.now()

export function fmtClose(d: Date | string | null | undefined): string {
  if (!d) return 'Open'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Nassau' })
}
export function closesIn(d: Date | string | null | undefined): string | null {
  if (!d) return null
  const days = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000)
  if (days < 0) return 'Closed'
  if (days === 0) return 'Closes today'
  if (days === 1) return 'Closes tomorrow'
  return `Closes in ${days} days`
}


export const unsubscribePathFor = (memberId: string) => `/builders-circle/unsubscribe?m=${encodeURIComponent(memberId)}`
