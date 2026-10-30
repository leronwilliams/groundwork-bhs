/**
 * POST /api/admin/builders-circle/board/digest — admin sends the board email digest.
 *   mode "test": one digest to the admin email(s) only (nothing is marked as sent).
 *   mode "send": one digest per approved Grand Bahama member; requires confirm === "SEND".
 * Safety: in production nothing goes to members unless BC_DIGEST_SEND_ENABLED=1. On preview the email layer
 * redirects every message to the test inbox and this route caps the run at 2 emails and marks nothing as sent.
 */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { adminFromRequest, audit, baseUrl, readBody, str } from '@/lib/builders-circle/server'
import { adminEmails, sendCircleEmail, escapeHtml } from '@/lib/builders-circle/email'
import { DIGEST_MAX_RECIPIENTS, digestPosts, digestRecipients, renderDigestBody, unsubscribeUrl } from '@/lib/builders-circle/board'

export const runtime = 'nodejs'
export const maxDuration = 120

const footer = (url: string) => `<p style="font-size:12px;color:#9ca3af;margin:8px 0 0">Don't want these? <a href="${escapeHtml(url)}" style="color:#6b7280">Unsubscribe from board emails</a>.</p>`

export async function POST(req: NextRequest) {
  const adminId = await adminFromRequest(req)
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const b = await readBody(req)
  const mode = str(b.mode, 10)
  const includeAll = b.includeAll === true || b.includeAll === 'true'
  const origin = baseUrl(req)
  const posts = await digestPosts(includeAll)
  if (!posts.length) return NextResponse.json({ error: 'No unsent published posts to include.' }, { status: 409 })
  const subject = posts.length === 1 ? `Builders Circle: ${posts[0].title}` : `Builders Circle board: ${posts.length} new opportunities in Grand Bahama`
  const redirectMode = !!(process.env.BUILDERS_CIRCLE_EMAIL_REDIRECT || '').trim()

  if (mode === 'test') {
    const to = adminEmails()
    const r = await sendCircleEmail({ to, subject: `[Digest test] ${subject}`, heading: 'New on the Builders Circle board', body: renderDigestBody(posts, origin), cta: { label: 'Open the board', url: `${origin}/builders-circle/board` }, footerHtml: footer(`${origin}/builders-circle/unsubscribe`) })
    await audit(adminId, 'board.digest_test', 'BoardPost', 'digest', { posts: posts.length, sent: r.sent })
    return NextResponse.json({ ok: true, mode, sent: r.sent ? 1 : 0, skipped: r.skipped })
  }

  if (mode !== 'send') return NextResponse.json({ error: 'Unknown mode' }, { status: 400 })
  if (str(b.confirm, 10) !== 'SEND') return NextResponse.json({ error: 'Type SEND to confirm.' }, { status: 400 })
  if (process.env.VERCEL_ENV === 'production' && process.env.BC_DIGEST_SEND_ENABLED !== '1') {
    return NextResponse.json({ error: 'Member digests are switched off in production (BC_DIGEST_SEND_ENABLED is not 1).' }, { status: 403 })
  }
  let recipients = await digestRecipients()
  if (recipients.length > DIGEST_MAX_RECIPIENTS) return NextResponse.json({ error: `More than ${DIGEST_MAX_RECIPIENTS} recipients: the sender needs batching before this many go out.` }, { status: 413 })
  if (redirectMode) recipients = recipients.slice(0, 2)
  let sent = 0, failed = 0
  for (const m of recipients) {
    const r = await sendCircleEmail({
      to: m.contractor.email as string, subject, heading: 'New on the Builders Circle board',
      body: renderDigestBody(posts, origin), cta: { label: 'Open the board', url: `${origin}/builders-circle/board` },
      footerHtml: footer(unsubscribeUrl(origin, m.id)),
      headers: { 'List-Unsubscribe': `<${unsubscribeUrl(origin, m.id)}>` },
    })
    if (r.sent) sent++; else failed++
  }
  // Preview/test runs never mark posts as sent, so they can be re-tested.
  if (!redirectMode && sent > 0) await prisma.boardPost.updateMany({ where: { id: { in: posts.map(p => p.id) } }, data: { digestSentAt: new Date() } })
  await audit(adminId, 'board.digest_sent', 'BoardPost', 'digest', { posts: posts.length, recipients: recipients.length, sent, failed, redirectMode })
  return NextResponse.json({ ok: true, mode, posts: posts.length, recipients: recipients.length, sent, failed, testMode: redirectMode })
}
