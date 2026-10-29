/**
 * Builders Circle — shared constants and pure helpers (safe for client and server).
 */

export const CIRCLE_ISLAND = 'Grand Bahama'

export const SETTLEMENTS = [
  'Freeport', 'Lucaya', 'Bahamia', 'Eight Mile Rock', 'Holmes Rock', "Pinder's Point",
  'Hunters', 'Seagrape', 'West End', 'East End',
] as const

export const CIRCLE_TRADES = [
  'General Contractor', 'Foundation', 'Masonry', 'Structure / Concrete Block', 'Roofing',
  'Electrical', 'Plumbing', 'HVAC', 'Tiling', 'Painting', 'Joinery / Carpentry',
  'Steel / Welding', 'Landscaping', 'Demolition / Site Work',
] as const

export const BUDGET_RANGES = [
  'Under $10,000', '$10,000 – $50,000', '$50,000 – $150,000', '$150,000 – $500,000', '$500,000+', 'To be discussed',
] as const

export type DocType =
  | 'business_licence' | 'gbpa_licence' | 'nib_compliance' | 'government_id'
  | 'insurance' | 'vat_cert' | 'trade_cert' | 'other'

export const DOC_TYPES: Record<DocType, { label: string; hint: string; expires: boolean }> = {
  business_licence: { label: 'Business Licence', hint: 'Issued by the Business Licence Unit (outside the Freeport Port Area).', expires: true },
  gbpa_licence: { label: 'GBPA Licence', hint: 'Grand Bahama Port Authority licence (businesses in the Freeport Port Area).', expires: true },
  nib_compliance: { label: 'NIB Compliance Letter', hint: 'Current letter of good standing from the National Insurance Board.', expires: true },
  government_id: { label: 'Government Photo ID', hint: 'Passport, driver’s licence or voter’s card of the business owner.', expires: true },
  insurance: { label: 'Insurance Certificate', hint: 'Public liability / contractor’s all-risk (optional).', expires: true },
  vat_cert: { label: 'VAT Registration Certificate', hint: 'If VAT-registered (optional).', expires: false },
  trade_cert: { label: 'Trade Certification', hint: 'E.g. licensed electrician or plumber certificate (optional).', expires: true },
  other: { label: 'Other Supporting Document', hint: 'Anything else that supports your application (optional).', expires: false },
}

export const DOC_TYPE_KEYS = Object.keys(DOC_TYPES) as DocType[]

/** Required groups: each needs at least one approved, unexpired document of one of its types. */
export const REQUIRED_GROUPS: { key: string; label: string; types: DocType[] }[] = [
  { key: 'licence', label: 'Business Licence or GBPA Licence', types: ['business_licence', 'gbpa_licence'] },
  { key: 'nib', label: 'NIB Compliance Letter', types: ['nib_compliance'] },
  { key: 'id', label: 'Government Photo ID', types: ['government_id'] },
]

export const ALLOWED_UPLOAD_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024

export type MemberStatus = 'applied' | 'verified' | 'suspended' | 'rejected'
export type JobStatus = 'draft' | 'open' | 'closed' | 'awarded' | 'cancelled'
export type EstimateStatus = 'submitted' | 'withdrawn' | 'shortlisted' | 'accepted' | 'declined'

export const STATUS_COLORS: Record<string, string> = {
  applied: '#f5a623', pending: '#f5a623', submitted: '#00d4f5', draft: '#6b7a99',
  verified: '#059669', approved: '#059669', open: '#059669', accepted: '#059669', awarded: '#059669',
  shortlisted: '#6366f1', closed: '#6b7a99', withdrawn: '#6b7a99',
  rejected: '#ef4444', declined: '#ef4444', suspended: '#ef4444', expired: '#ef4444', cancelled: '#ef4444',
}

export interface DocLike { type: string; status: string; expiresAt: Date | string | null }

export function isExpired(d: DocLike, now = new Date()): boolean {
  return !!d.expiresAt && new Date(d.expiresAt).getTime() < now.getTime()
}

/** Display status: approved docs past their expiry date show as "expired". */
export function effectiveDocStatus(d: DocLike, now = new Date()): string {
  if (d.status === 'approved' && isExpired(d, now)) return 'expired'
  return d.status
}

export function requirementStatus(docs: DocLike[], now = new Date()) {
  return REQUIRED_GROUPS.map(g => {
    const ofGroup = docs.filter(d => (g.types as string[]).includes(d.type))
    const approved = ofGroup.some(d => d.status === 'approved' && !isExpired(d, now))
    const pending = ofGroup.some(d => d.status === 'pending')
    return { ...g, approved, pending, uploaded: ofGroup.length > 0 }
  })
}

export function requirementsMet(docs: DocLike[], now = new Date()): boolean {
  return requirementStatus(docs, now).every(r => r.approved)
}

export function formatBSD(cents: number): string {
  return `B$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/Nassau' })
}
