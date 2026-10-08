/**
 * Builders Circle email notifications (Resend).
 *
 * Safety:
 * - All user-supplied text is HTML-escaped before it goes into a template.
 * - BUILDERS_CIRCLE_EMAIL_REDIRECT (set on preview/test only) re-routes EVERY
 *   Builders Circle email to that one address, with the intended recipient in
 *   the subject. Outside production, nothing is sent unless that redirect is set.
 * - Emails never contain one-click action links; buttons open pages that need a
 *   signed-in session. Document links are additionally HMAC-signed and expire.
 */
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM = process.env.BUILDERS_CIRCLE_EMAIL_FROM || 'Groundwork Builders Circle <circle@groundworksbhs.com>'

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function adminEmails(): string[] {
  return (process.env.BUILDERS_CIRCLE_ADMIN_EMAILS || 'leron@formartiq.com').split(/[\s,]+/).filter(Boolean)
}

/** Layout. `bodyHtml` must already be escaped / built from escaped parts. */
function layout(heading: string, bodyHtml: string, cta?: { label: string; url: string }): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:20px;color:#1f2937">
  <div style="background:#060d1a;padding:24px;border-radius:4px;margin-bottom:24px">
    <h1 style="color:#00d4f5;margin:0;font-size:20px">GROUNDWORK BHS</h1>
    <p style="color:#f5a623;margin:8px 0 0;font-size:13px;letter-spacing:1px">BUILDERS CIRCLE · GRAND BAHAMA</p>
  </div>
  <h2 style="font-size:18px;margin:0 0 16px">${escapeHtml(heading)}</h2>
  ${bodyHtml}
  ${cta ? `<div style="text-align:center;margin:28px 0"><a href="${escapeHtml(cta.url)}" style="background:#00d4f5;color:#060d1a;padding:14px 28px;border-radius:4px;font-weight:bold;font-size:15px;text-decoration:none;display:inline-block">${escapeHtml(cta.label)}</a></div>` : ''}
  <p style="font-size:12px;color:#9ca3af;margin-top:32px">You are receiving this because of your Builders Circle account on Groundwork BHS. Links open the portal and ask you to sign in.</p>
</body></html>`
}

export function rows(pairs: [string, unknown][]): string {
  const tr = pairs
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `<tr><td style="padding:6px 0;color:#6b7280;width:150px;vertical-align:top">${escapeHtml(k)}</td><td style="padding:6px 0;font-weight:600">${escapeHtml(v)}</td></tr>`)
    .join('')
  return `<table style="width:100%;font-size:14px;border-collapse:collapse;background:#f0f9ff;border:1px solid #00d4f5;border-radius:4px;padding:12px">${tr}</table>`
}

export const para = (text: string) => `<p style="font-size:14px;line-height:1.6">${escapeHtml(text)}</p>`

export async function sendCircleEmail(opts: { to: string | string[]; subject: string; heading: string; body: string; cta?: { label: string; url: string } }): Promise<{ sent: boolean; skipped?: string }> {
  const intended = (Array.isArray(opts.to) ? opts.to : [opts.to]).filter(Boolean)
  if (!intended.length) return { sent: false, skipped: 'no recipient' }
  const redirect = (process.env.BUILDERS_CIRCLE_EMAIL_REDIRECT || '').trim()
  const isProd = process.env.VERCEL_ENV === 'production'
  if (!redirect && !isProd) {
    console.log(`[builders-circle email] skipped outside production (no redirect set): ${opts.subject}`)
    return { sent: false, skipped: 'non-production without redirect' }
  }
  if (!resend) {
    console.log(`[builders-circle email] RESEND_API_KEY missing: ${opts.subject}`)
    return { sent: false, skipped: 'no resend key' }
  }
  const to = redirect ? [redirect] : intended
  const subject = redirect ? `[TEST → ${intended.join(', ')}] ${opts.subject}` : opts.subject
  try {
    await resend.emails.send({ from: FROM, to, replyTo: process.env.BUILDERS_CIRCLE_REPLY_TO || 'jarvis@formartiq.com', subject, html: layout(opts.heading, opts.body, opts.cta) })
    return { sent: true }
  } catch (err) {
    console.error('[builders-circle email] send failed', err)
    return { sent: false, skipped: 'send failed' }
  }
}
