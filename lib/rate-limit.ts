/**
 * Simple per-IP sliding-window rate limiter.
 *
 * LIMITATION: state lives in memory of a single serverless instance. Vercel
 * can run several instances in parallel and recycles them, so this is a
 * speed bump against bursts/abuse, not a hard global quota. For durable,
 * global limits move this to Upstash Redis / Vercel KV (not configured yet).
 */
import { NextRequest, NextResponse } from 'next/server'

const buckets = new Map<string, number[]>()

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

/** Returns seconds to wait if limited, or 0 if the request may proceed (and is counted). */
export function hit(key: string, limit: number, windowMs: number): number {
  const now = Date.now()
  const recent = (buckets.get(key) || []).filter(t => now - t < windowMs)
  if (recent.length >= limit) {
    buckets.set(key, recent)
    return Math.max(1, Math.ceil((windowMs - (now - recent[0])) / 1000))
  }
  recent.push(now)
  buckets.set(key, recent)
  if (buckets.size > 10000) {
    for (const [k, v] of buckets) if (!v.length || now - v[v.length - 1] > windowMs) buckets.delete(k)
  }
  return 0
}

/** Convenience: returns a 429 response if the caller's IP is over the limit for this route. */
export function rateLimit(req: NextRequest, route: string, limit: number, windowMs = 10 * 60 * 1000): NextResponse | null {
  const wait = hit(`${route}:${clientIp(req)}`, limit, windowMs)
  if (!wait) return null
  return NextResponse.json(
    { error: 'Too many requests. Please wait a few minutes and try again.', code: 'RATE_LIMITED', retryAfter: wait },
    { status: 429, headers: { 'Retry-After': String(wait) } },
  )
}
