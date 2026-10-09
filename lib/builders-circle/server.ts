/**
 * Builders Circle — server-only helpers: auth context, request parsing, blob paths, audit log.
 */
import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isAdmin } from '@/lib/admin-auth'

export function blobPrefix(): string {
  return (process.env.BUILDERS_CIRCLE_BLOB_PREFIX || 'builders-circle').replace(/^\/+|\/+$/g, '')
}
export const docPathPrefix = (contractorId: string) => `${blobPrefix()}/docs/${contractorId}/`
export const jobPathPrefix = (jobId: string) => `${blobPrefix()}/jobs/${jobId}/`

export async function getCircleContext() {
  const { userId } = await auth()
  if (!userId) return { userId: null, admin: false, member: null } as const
  const member = await prisma.circleMember.findUnique({ where: { userId }, include: { contractor: true } })
  return { userId, admin: isAdmin(userId), member } as const
}

/** Reject cross-site state-changing requests (defence in depth on top of SameSite cookies). */
export function sameOrigin(req: NextRequest | Request): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return true // same-origin fetches from older browsers / server tools
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  try { return new URL(origin).host === host } catch { return false }
}

export function baseUrl(req: NextRequest | Request): string {
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') || 'https'
  return host ? `${proto}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.groundworksbhs.com')
}

export const isForm = (req: Request) => (req.headers.get('content-type') || '').includes('form')

/** Reads a JSON or HTML-form body into a plain object of strings / string arrays. */
export async function readBody(req: Request): Promise<Record<string, unknown>> {
  if (isForm(req)) {
    const fd = await req.formData()
    const out: Record<string, unknown> = {}
    for (const key of new Set(fd.keys())) {
      const all = fd.getAll(key).map(v => (typeof v === 'string' ? v : ''))
      out[key] = all.length > 1 ? all : all[0]
    }
    return out
  }
  return (await req.json().catch(() => ({}))) as Record<string, unknown>
}

export const str = (v: unknown, max = 2000) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
export const strArr = (v: unknown, allowed?: readonly string[]) => {
  const arr = Array.isArray(v) ? v : typeof v === 'string' && v ? [v] : []
  const clean = arr.filter((x): x is string => typeof x === 'string').map(x => x.trim()).filter(Boolean)
  return Array.from(new Set(allowed ? clean.filter(x => allowed.includes(x)) : clean))
}
export const dateOrNull = (v: unknown): Date | null => {
  const s = str(v, 40)
  if (!s) return null
  const d = new Date(s.length === 10 ? `${s}T12:00:00-04:00` : s)
  return isNaN(d.getTime()) ? null : d
}

/** Form posts get a 303 back to the page; fetch callers get JSON. */
export function done(req: Request, redirectTo: string, json: Record<string, unknown> = { ok: true }, status = 200) {
  if (isForm(req)) return NextResponse.redirect(new URL(redirectTo, baseUrl(req)), 303)
  return NextResponse.json(json, { status })
}
export function fail(req: Request, status: number, error: string, redirectTo?: string) {
  if (isForm(req) && redirectTo) {
    const u = new URL(redirectTo, baseUrl(req))
    u.searchParams.set('error', error)
    return NextResponse.redirect(u, 303)
  }
  return NextResponse.json({ error }, { status })
}

export async function audit(actorUserId: string, action: string, entityType: string, entityId: string, meta?: Record<string, unknown>) {
  try {
    await prisma.circleAuditLog.create({ data: { actorUserId, action, entityType, entityId, meta: (meta ?? undefined) as never } })
  } catch (err) {
    console.error('[builders-circle] audit log failed', err)
  }
}

/** For admin API routes: returns the admin's userId, or null (caller responds 403). */
export async function adminFromRequest(req: Request): Promise<string | null> {
  if (!sameOrigin(req)) return null
  const { userId } = await auth()
  return isAdmin(userId) ? (userId as string) : null
}
