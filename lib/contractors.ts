/**
 * Placeholder (seed/demo) contractor listings.
 *
 * The original seed created 8 sample contractors with made-up phone numbers
 * and email domains that don't exist (e.g. acabobuild.bs, nassaubuild.bs).
 * They are hidden from the public directory, profile pages, reviews and lead
 * matching, and never get a "Verified" badge. This is code-only (no DB change);
 * delete a listing from this list or the row from the DB when it is replaced
 * by a real business. Set SHOW_PLACEHOLDER_CONTRACTORS=true to show them
 * (labelled "Sample listing") for demos/QA.
 */
export const PLACEHOLDER_CONTRACTOR_IDS: string[] = [
  'cmo1hsvap0008xmej3zb93god', // Nassau Build Co.            info@nassaubuild.bs
  'cmo1hsvfj0009xmej5v2d37iv', // Island Masonry Works        island.masonry@gmail.com (unverified)
  'cmo1hsvir000axmejw330ynwn', // Caribbean Electric Ltd.
  'cmo1hsvly000bxmej9pm3qvxm', // AbacoBuild                  info@acabobuild.bs
  'cmo1hsvp8000cxmejmdqqmq57', // Exuma Construction Services
  'cmo1hsvsg000dxmej5ktapujy', // Eleuthera Builders
  'cmo1hsvvn000exmej50u7rlml', // Nassau Plumbing Pro
  'cmo1hsvyv000fxmejed4u3bq6', // BHS Roofing & Waterproofing
]

export function showPlaceholders(): boolean {
  return process.env.SHOW_PLACEHOLDER_CONTRACTORS === 'true'
}

export function isPlaceholderContractor(id: string): boolean {
  return PLACEHOLDER_CONTRACTOR_IDS.includes(id)
}

/** Prisma `where` fragment that excludes placeholder listings (unless the demo override is on). */
export function excludePlaceholders(): { id?: { notIn: string[] } } {
  return showPlaceholders() ? {} : { id: { notIn: PLACEHOLDER_CONTRACTOR_IDS } }
}

/** True when a contractor should be hidden from public pages/APIs. */
export function isHiddenContractor(id: string): boolean {
  return isPlaceholderContractor(id) && !showPlaceholders()
}
