import webpush from 'web-push'
import { prisma } from '@/lib/db'
import { TYPE_LABEL, fmtClose } from '@/lib/builders-circle/board-constants'

/** Web Push (VAPID). Keys live in Vercel env: NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT. */
export const vapidPublicKey = () => (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim()
export const pushConfigured = () => !!(vapidPublicKey() && (process.env.VAPID_PRIVATE_KEY || '').trim())

let ready = false
function init() {
  if (ready) return
  webpush.setVapidDetails((process.env.VAPID_SUBJECT || 'mailto:ron@formartiq.com').trim(), vapidPublicKey(), (process.env.VAPID_PRIVATE_KEY || '').trim())
  ready = true
}

export type PushPayload = { title: string; body: string; url: string; tag?: string }

export function postPayload(p: { id: string; type: string; title: string; location: string; closeDate: Date | null }): PushPayload {
  const kind = TYPE_LABEL[p.type] || 'Post'
  const tail = p.closeDate ? ` Closes ${fmtClose(p.closeDate)}.` : ''
  return {
    title: `New ${kind.toLowerCase()} in ${p.location}`,
    body: `${p.title.length > 110 ? `${p.title.slice(0, 107)}…` : p.title}.${tail}`,
    url: `/builders-circle/board#post-${p.id}`,
    tag: `post-${p.id}`,
  }
}

type Sub = { id: string; endpoint: string; p256dh: string; auth: string; failCount: number }

/** Send to each subscription. 404/410 (expired or revoked) deletes it; other failures count up and delete after 5. */
export async function sendPush(subs: Sub[], payload: PushPayload) {
  if (!pushConfigured()) throw new Error('Push is not configured (VAPID keys missing).')
  init()
  const body = JSON.stringify(payload)
  let sent = 0, removed = 0, failed = 0
  for (const s of subs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body, { TTL: 24 * 3600, urgency: 'high', topic: payload.tag ? payload.tag.replace(/[^A-Za-z0-9_-]/g, '').slice(0, 32) : undefined })
      sent++
      await prisma.pushSubscription.update({ where: { id: s.id }, data: { lastSuccessAt: new Date(), failCount: 0 } }).catch(() => {})
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode
      if (code === 404 || code === 410) { removed++; await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {}) }
      else {
        failed++
        if (s.failCount + 1 >= 5) { removed++; await prisma.pushSubscription.delete({ where: { id: s.id } }).catch(() => {}) }
        else await prisma.pushSubscription.update({ where: { id: s.id }, data: { failCount: { increment: 1 } } }).catch(() => {})
        console.error('[push] send failed', code, (e as Error).message?.slice(0, 120))
      }
    }
  }
  return { sent, removed, failed }
}

/** Devices of approved (verified) members who should hear about a post at this location. */
export async function pushRecipients(location: string) {
  if (location !== 'Grand Bahama') return []
  const members = await prisma.circleMember.findMany({
    where: { status: 'verified', island: 'Grand Bahama', NOT: { serviceAreas: { isEmpty: true } } },
    select: { id: true },
  })
  if (!members.length) return []
  return prisma.pushSubscription.findMany({ where: { memberId: { in: members.map(m => m.id) } } })
}

/** Preview/test deployments may only send when pointed at the isolated test DB (marked by the email redirect var). */
export function pushSendBlocked(): string | null {
  if (process.env.VERCEL_ENV === 'production') return process.env.BC_PUSH_SEND_ENABLED === '1' ? null : 'Member pushes are switched off in production (BC_PUSH_SEND_ENABLED is not 1).'
  return (process.env.BUILDERS_CIRCLE_EMAIL_REDIRECT || '').trim() ? null : 'This deployment is not on the isolated test database, so member pushes are blocked.'
}
