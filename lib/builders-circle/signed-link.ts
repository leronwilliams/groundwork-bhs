/**
 * HMAC-signed, expiring links for Builders Circle email links.
 * A signed link never replaces a login: routes still require the right session,
 * the signature only makes emailed links expire and impossible to tamper with.
 */
import crypto from 'crypto'

function secret(): string {
  const base = process.env.BUILDERS_CIRCLE_LINK_SECRET || process.env.REPORT_LINK_SECRET || process.env.CLERK_SECRET_KEY || 'gw-dev-only'
  return crypto.createHash('sha256').update(`builders-circle-link:${base}`).digest('hex')
}

const sign = (path: string, exp: number) => crypto.createHmac('sha256', secret()).update(`${path}|${exp}`).digest('base64url')

export function signPath(path: string, ttlMs = 7 * 24 * 60 * 60 * 1000): string {
  const exp = Date.now() + ttlMs
  const sep = path.includes('?') ? '&' : '?'
  return `${path}${sep}exp=${exp}&sig=${sign(path, exp)}`
}

export function verifySignedPath(path: string, exp: string | null, sig: string | null): boolean {
  if (!exp || !sig) return false
  const expNum = Number(exp)
  if (!Number.isFinite(expNum) || expNum < Date.now()) return false
  const expected = Buffer.from(sign(path, expNum))
  const given = Buffer.from(sig)
  return expected.length === given.length && crypto.timingSafeEqual(expected, given)
}
