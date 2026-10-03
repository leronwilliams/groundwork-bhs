/**
 * Signed, expiring links for private BOQ PDF reports stored in Vercel Blob.
 * The blob itself is private (direct URL returns 403); /api/boq-report
 * verifies the HMAC signature and streams the file server-side.
 */
import crypto from 'crypto'

const TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

function secret(): string {
  const base = process.env.REPORT_LINK_SECRET || process.env.CLERK_SECRET_KEY || process.env.STRIPE_SECRET_KEY || process.env.BLOB_READ_WRITE_TOKEN || 'gw-dev-only'
  return crypto.createHash('sha256').update(`boq-report-link:${base}`).digest('hex')
}

function sign(pathname: string, exp: number): string {
  return crypto.createHmac('sha256', secret()).update(`${pathname}|${exp}`).digest('base64url')
}

export function signedReportUrl(pathname: string, ttlMs = TTL_MS): string {
  const exp = Date.now() + ttlMs
  const q = new URLSearchParams({ p: pathname, exp: String(exp), sig: sign(pathname, exp) })
  return `/api/boq-report?${q.toString()}`
}

export function verifyReportSignature(pathname: string | null, exp: string | null, sig: string | null): boolean {
  if (!pathname || !exp || !sig) return false
  if (!pathname.startsWith('boq-reports/') || pathname.includes('..')) return false
  const expNum = Number(exp)
  if (!Number.isFinite(expNum) || expNum < Date.now()) return false
  const expected = Buffer.from(sign(pathname, expNum))
  const given = Buffer.from(sig)
  return expected.length === given.length && crypto.timingSafeEqual(expected, given)
}
