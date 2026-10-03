/**
 * Server-side free-question allowance for anonymous Advisor users.
 *
 * Primary control: an HttpOnly, HMAC-signed cookie holding the number of
 * questions asked in the current 30-day window. The client can no longer
 * report its own count. Backstop: an in-memory per-IP daily cap (generous,
 * because many Bahamian mobile users share carrier IPs). Clearing cookies
 * resets the cookie count, which the IP cap and rate limiter then bound.
 */
import crypto from 'crypto'
import { NextRequest } from 'next/server'
import { clientIp, hit } from '@/lib/rate-limit'

export const ANON_LIMIT = 2
export const ANON_IP_DAILY_CAP = 10
const COOKIE = 'gw_aq'
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000

function secret(): string {
  const base = process.env.ADVISOR_QUOTA_SECRET || process.env.CLERK_SECRET_KEY || process.env.STRIPE_SECRET_KEY || 'gw-dev-only'
  return crypto.createHash('sha256').update(`advisor-quota:${base}`).digest('hex')
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url').slice(0, 32)
}

export function readAnonCount(req: NextRequest): { count: number; windowStart: number } {
  const raw = req.cookies.get(COOKIE)?.value
  const now = Date.now()
  if (raw) {
    const [c, w, sig] = raw.split('.')
    if (c && w && sig && sign(`${c}.${w}`) === sig) {
      const count = Number(c), windowStart = Number(w)
      if (Number.isFinite(count) && Number.isFinite(windowStart) && now - windowStart < WINDOW_MS) {
        return { count, windowStart }
      }
    }
  }
  return { count: 0, windowStart: now }
}

export function anonCookieHeader(count: number, windowStart: number): string {
  const payload = `${count}.${windowStart}`
  const maxAge = Math.max(60, Math.floor((windowStart + WINDOW_MS - Date.now()) / 1000))
  return `${COOKIE}=${payload}.${sign(payload)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`
}

/** Counts one anonymous question against the per-IP daily backstop. Returns true if over the cap. */
export function anonIpCapExceeded(req: NextRequest): boolean {
  return hit(`advisor-anon-ip:${clientIp(req)}`, ANON_IP_DAILY_CAP, 24 * 60 * 60 * 1000) > 0
}
