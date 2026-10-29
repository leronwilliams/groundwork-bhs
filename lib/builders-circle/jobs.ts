import { BUDGET_RANGES, CIRCLE_TRADES, SETTLEMENTS } from '@/lib/builders-circle/constants'
import { dateOrNull, str, strArr } from '@/lib/builders-circle/server'

/** Validates the admin job form. Returns { data } or { error }. */
export function parseJobInput(b: Record<string, unknown>) {
  const title = str(b.title, 160)
  const summary = str(b.summary, 600)
  const description = str(b.description, 10000)
  const trades = strArr(b.trades, CIRCLE_TRADES)
  const settlement = str(b.settlement, 60)
  const budgetRange = str(b.budgetRange, 60)
  const clientContact = str(b.clientContact, 500)
  const siteVisit = b.siteVisit === true || b.siteVisit === 'true' || b.siteVisit === 'on'
  const bidDeadlineRaw = dateOrNull(b.bidDeadline)
  // A deadline date means "until the end of that day" in Bahamas time.
  const bidDeadline = bidDeadlineRaw && str(b.bidDeadline, 40).length === 10 ? new Date(`${str(b.bidDeadline, 10)}T23:59:59-04:00`) : bidDeadlineRaw
  const targetStart = dateOrNull(b.targetStart)

  const errors: string[] = []
  if (!title) errors.push('Title is required')
  if (!summary) errors.push('Summary is required')
  if (!description) errors.push('Full description is required')
  if (!trades.length) errors.push('Choose at least one trade')
  if (settlement && !(SETTLEMENTS as readonly string[]).includes(settlement)) errors.push('Unknown settlement')
  if (budgetRange && !(BUDGET_RANGES as readonly string[]).includes(budgetRange)) errors.push('Unknown budget range')
  if (errors.length) return { error: errors.join('. ') } as const
  return {
    data: { title, summary, description, trades, settlement: settlement || null, budgetRange: budgetRange || null, clientContact: clientContact || null, siteVisit, bidDeadline, targetStart },
  } as const
}
