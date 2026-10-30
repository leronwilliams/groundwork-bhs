/**
 * Builders Circle jobs & news board: constants, input parsing, Bonfire tender importer, digest helpers.
 * Posts are always created as drafts; only an admin publishes. The digest never sends by itself.
 */
import { prisma } from '@/lib/db'
import { escapeHtml } from '@/lib/builders-circle/email'
import { signPath } from '@/lib/builders-circle/signed-link'
import { str } from '@/lib/builders-circle/server'

export * from '@/lib/builders-circle/board-constants'
import { BOARD_TYPES, BOARD_LOCATIONS, TYPE_LABEL, TYPE_COLOR, fmtClose, unsubscribePathFor } from '@/lib/builders-circle/board-constants'

/** YYYY-MM-DD means "end of that day, Nassau time"; full ISO strings are used as given. */
export function parseCloseDate(v: unknown): Date | null {
  const s = str(v, 40)
  if (!s) return null
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T23:59:00-04:00` : s)
  return isNaN(d.getTime()) ? null : d
}

export function parsePostInput(b: Record<string, unknown>) {
  const type = str(b.type, 20)
  const title = str(b.title, 220)
  const summary = str(b.summary, 2000)
  const source = str(b.source, 200)
  const location = str(b.location, 40) || 'Grand Bahama'
  const link = str(b.link, 500)
  const errors: string[] = []
  if (!(BOARD_TYPES as readonly string[]).includes(type)) errors.push('Choose a type')
  if (!title) errors.push('Title is required')
  if (!(BOARD_LOCATIONS as readonly string[]).includes(location)) errors.push('Choose a location')
  if (link && !/^https?:\/\/\S+$/i.test(link)) errors.push('Link must start with http:// or https://')
  const closeRaw = str(b.closeDate, 40)
  const closeDate = parseCloseDate(closeRaw)
  if (closeRaw && !closeDate) errors.push('Close date is not valid')
  if (errors.length) return { error: errors.join('. ') } as const
  return { data: { type, title, summary, source: source || null, location, link: link || null, closeDate } } as const
}

/* ---------------------------- Bonfire importer ---------------------------- */

const BONFIRE = 'https://bahamas.bonfirehub.com'
const INCLUDE = /construct|build|repair|paving|pave|renovat|electrical|upgrade|install|potable water|water supply|roof|plumb|paint|court|clinic|office space|home|housing|school|road|drain|sewer|bridge|dock|pier|fenc|wall|termite|maintenance|rehabilitat|refurb|works/i
const EXCLUDE = /vessel|drone|quadcopter|radio|repeater|truck|furniture|stretcher|tent|chairs|awning|consult|software|supply and delivery|power supply|expression of interest|professional/i

export function classifyTender(name: string, agency: string) {
  const text = `${name} ${agency}`
  const include = INCLUDE.test(name) && !EXCLUDE.test(name)
  const location = /grand bahama|freeport|lucaya|\bMoGB\b/i.test(text) ? 'Grand Bahama' : /nassau|new providence/i.test(text) ? 'Nassau' : 'Other'
  return { include, location }
}

const tidy = (t: string) => {
  const s = t.replace(/\s+/g, ' ').trim()
  return s === s.toUpperCase() ? s.toLowerCase().replace(/(^|[\s(–-])([a-z])/g, (_m, a, b) => a + b.toUpperCase()) : s
}

export type BonfireProject = { ProjectID: string | number; ReferenceID: string; ProjectName: string; DepartmentID: string | number; DateClose: string }

export async function fetchBonfireOpen(): Promise<{ projects: BonfireProject[]; departments: Record<string, { DepartmentName: string }> }> {
  const res = await fetch(`${BONFIRE}/PublicPortal/getOpenPublicOpportunitiesSectionData`, {
    headers: { 'X-Requested-With': 'XMLHttpRequest', 'User-Agent': 'Mozilla/5.0 (compatible; GroundworkBHS-BoardImporter)' },
    cache: 'no-store',
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error(`Bonfire responded ${res.status}`)
  const json = (await res.json()) as { payload?: { projects?: Record<string, BonfireProject>; departments?: Record<string, { DepartmentName: string }> } }
  const p = json.payload
  if (!p?.projects) throw new Error('Unexpected Bonfire response')
  return { projects: Object.values(p.projects), departments: p.departments || {} }
}

/** Creates DRAFT posts for open construction / works tenders. Dedupes on sourceId; never touches existing posts; never publishes. */
export async function importBonfire(opts: { all?: boolean } = {}) {
  const { projects, departments } = await fetchBonfireOpen()
  const now = Date.now()
  let created = 0, existing = 0, skippedClosed = 0, skippedFilter = 0
  const createdTitles: string[] = []
  for (const p of projects) {
    const closeDate = new Date(`${p.DateClose.replace(' ', 'T')}Z`)
    if (isNaN(closeDate.getTime()) || closeDate.getTime() < now) { skippedClosed++; continue }
    const agency = departments[String(p.DepartmentID)]?.DepartmentName || 'Government of The Bahamas'
    const { include, location } = classifyTender(p.ProjectName, agency)
    if (!include && !opts.all) { skippedFilter++; continue }
    const sourceId = `bonfire:${p.ProjectID}`
    if (await prisma.boardPost.findUnique({ where: { sourceId }, select: { id: true } })) { existing++; continue }
    try {
      await prisma.boardPost.create({
        data: {
          type: 'tender', title: tidy(p.ProjectName), source: agency, location, closeDate, sourceId, status: 'draft',
          link: `${BONFIRE}/opportunities/${p.ProjectID}`,
          summary: `Reference ${p.ReferenceID}. Open tender on the Bahamas government procurement portal (Bonfire). Open the link for the full documents and how to submit.`,
        },
      })
      created++; createdTitles.push(tidy(p.ProjectName))
    } catch (e) {
      if ((e as { code?: string }).code === 'P2002') existing++ // lost a race with another import: same sourceId
      else throw e
    }
  }
  return { fetched: projects.length, created, existing, skippedClosed, skippedFilter, createdTitles }
}

/* ------------------------------ email digest ------------------------------ */

export const DIGEST_MAX_RECIPIENTS = 90

/** Published posts not yet in a digest, still open, Grand Bahama only unless includeAll. */
export async function digestPosts(includeAll = false) {
  return prisma.boardPost.findMany({
    where: {
      status: 'published', digestSentAt: null,
      OR: [{ closeDate: null }, { closeDate: { gt: new Date() } }],
      ...(includeAll ? {} : { location: 'Grand Bahama' }),
    },
    orderBy: [{ closeDate: 'asc' }, { publishedAt: 'desc' }],
  })
}

/** Approved (verified) Grand Bahama members with a service area, an email, and who have not unsubscribed. */
export async function digestRecipients() {
  const members = await prisma.circleMember.findMany({
    where: { status: 'verified', island: 'Grand Bahama', NOT: { serviceAreas: { isEmpty: true } } },
    include: { contractor: { select: { name: true, contactName: true, email: true } } },
  })
  const opted = new Set((await prisma.boardDigestOptOut.findMany({ where: { memberId: { in: members.map(m => m.id) } }, select: { memberId: true } })).map(o => o.memberId))
  return members.filter(m => !opted.has(m.id) && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(m.contractor.email || ''))
}

export const unsubscribePath = unsubscribePathFor
export const unsubscribeUrl = (origin: string, memberId: string) => `${origin}${signPath(unsubscribePath(memberId), 365 * 24 * 3600 * 1000)}`

type DigestPost = { type: string; title: string; summary: string; source: string | null; location: string; closeDate: Date | null; link: string | null }

export function renderDigestBody(posts: DigestPost[], origin: string): string {
  const items = posts.map(p => {
    const color = TYPE_COLOR[p.type] || '#374151'
    const href = p.link || `${origin}/builders-circle/board`
    const meta = [p.source, p.location, p.closeDate ? `Closes ${fmtClose(p.closeDate)}` : null].filter(Boolean).map(x => escapeHtml(x)).join(' &middot; ')
    const summary = p.summary.length > 220 ? `${p.summary.slice(0, 217)}…` : p.summary
    return `<div style="border:1px solid #e5e7eb;border-left:4px solid ${color};border-radius:4px;padding:14px 16px;margin:0 0 12px">
  <span style="display:inline-block;background:${color};color:#fff;font-size:10px;font-weight:bold;letter-spacing:1px;padding:2px 8px;border-radius:2px;text-transform:uppercase">${escapeHtml(TYPE_LABEL[p.type] || p.type)}</span>
  <p style="margin:8px 0 4px;font-size:15px;font-weight:bold;line-height:1.35"><a href="${escapeHtml(href)}" style="color:#111827;text-decoration:none">${escapeHtml(p.title)}</a></p>
  <p style="margin:0 0 6px;font-size:12px;color:#6b7280">${meta}</p>
  ${summary ? `<p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#374151">${escapeHtml(summary)}</p>` : ''}
  <a href="${escapeHtml(href)}" style="font-size:13px;font-weight:bold;color:#ea580c;text-decoration:none">View details &rarr;</a>
</div>`
  }).join('')
  return `<p style="font-size:14px;line-height:1.6">${posts.length === 1 ? 'A new opportunity' : `${posts.length} new opportunities`} for Grand Bahama builders, fresh on the Builders Circle board:</p>${items}`
}
