/**
 * Lead Email Templates — Phase 7
 * 
 * Privacy model:
 * - Contractor sees: project summary, client first name only, island, trades, budget
 * - Contractor does NOT see: client last name, phone, email, address
 * - Client sees contractor contact ONLY after contractor expresses interest
 */

import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const TEST_MODE = !process.env.RESEND_API_KEY
const TEST_RECIPIENT = 'leron@formartiq.com'

export interface LeadEmailData {
  leadId: string
  clientFirstName: string   // first name only — never share full name
  island: string
  projectType: string
  trades: string[]
  budget: string
  timeline: string
  notes?: string
  expressInterestUrl: string
}

export interface InterestNotificationData {
  clientEmail: string
  clientFirstName: string
  contractorName: string
  contractorTrade: string
  contractorPhone?: string
  contractorEmail?: string
  contractorWebsite?: string
  island: string
}

/**
 * Send lead notification to a matched contractor.
 * Only reveals client first name — no contact details until contractor expresses interest.
 */
export async function sendLeadToContractor(
  contractorEmail: string,
  contractorName: string,
  data: LeadEmailData
): Promise<{ sent: boolean; error?: string }> {
  const recipient = TEST_MODE ? TEST_RECIPIENT : contractorEmail
  const subjectPrefix = TEST_MODE ? `[TEST → ${contractorEmail}] ` : ''

  const tradesHtml = data.trades.map(t => `<li style="margin:4px 0">${t}</li>`).join('')

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:20px;color:#1f2937">
  <div style="background:#060d1a;padding:24px;border-radius:4px;margin-bottom:24px">
    <h1 style="color:#00d4f5;margin:0;font-size:20px">GROUNDWORK BHS</h1>
    <p style="color:#b8c5e0;margin:8px 0 0;font-size:13px">Contractor Lead Network</p>
  </div>

  <p>Dear <strong>${contractorName}</strong>,</p>

  <p>A new project has been posted on Groundwork BHS that matches your trade profile. Here are the details:</p>

  <div style="background:#f0f9ff;border:1px solid #00d4f5;border-radius:4px;padding:20px;margin:20px 0">
    <table style="width:100%;font-size:14px;border-collapse:collapse">
      <tr><td style="padding:6px 0;color:#6b7280;width:140px">Island:</td><td style="padding:6px 0;font-weight:600">${data.island}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Project Type:</td><td style="padding:6px 0;font-weight:600">${data.projectType}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Client:</td><td style="padding:6px 0;font-weight:600">${data.clientFirstName} (first name only)</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Budget:</td><td style="padding:6px 0;font-weight:600">${data.budget || 'Not specified'}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Timeline:</td><td style="padding:6px 0;font-weight:600">${data.timeline || 'Flexible'}</td></tr>
      <tr>
        <td style="padding:6px 0;color:#6b7280;vertical-align:top">Trades Needed:</td>
        <td style="padding:6px 0"><ul style="margin:0;padding-left:18px">${tradesHtml}</ul></td>
      </tr>
      ${data.notes ? `<tr><td style="padding:6px 0;color:#6b7280;vertical-align:top">Notes:</td><td style="padding:6px 0">${data.notes}</td></tr>` : ''}
    </table>
  </div>

  <p style="font-size:14px;color:#374151">If you are interested in this project, click the button below. The client will be notified and receive your contact details so they can reach out to you directly.</p>

  <div style="text-align:center;margin:28px 0">
    <a href="${data.expressInterestUrl}" 
       style="background:#00d4f5;color:#060d1a;padding:14px 32px;border-radius:4px;font-weight:bold;font-size:15px;text-decoration:none;display:inline-block">
      ✓ Express Interest in This Project
    </a>
  </div>

  <p style="font-size:12px;color:#9ca3af">This lead was sent because your trade profile matches the project requirements. You will only be contacted if you express interest. Client contact details are revealed only after you click Express Interest.</p>
  <p style="font-size:12px;color:#9ca3af">Lead ID: ${data.leadId} | <a href="https://www.groundworksbhs.com" style="color:#00d4f5">Groundwork BHS</a></p>
</body>
</html>`

  try {
    if (!resend) {
      console.log(`[LEAD EMAIL — no Resend key] Would send to: ${contractorEmail} | Lead: ${data.leadId}`)
      return { sent: false, error: 'RESEND_API_KEY not configured' }
    }
    await resend.emails.send({
      from: 'Groundwork BHS Leads <leads@groundworksbhs.com>',
      to: [recipient],
      replyTo: 'jarvis@formartiq.com',
      subject: `${subjectPrefix}New Project Lead — ${data.island} | ${data.trades[0] || 'Construction'}`,
      html,
    })
    return { sent: true }
  } catch (err) {
    console.error('Lead email send failed:', err)
    return { sent: false, error: String(err) }
  }
}

/**
 * Notify client that a contractor has expressed interest.
 * Now reveals contractor full contact details.
 */
export async function sendInterestNotificationToClient(data: InterestNotificationData): Promise<{ sent: boolean }> {
  const recipient = TEST_MODE ? TEST_RECIPIENT : data.clientEmail

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:20px;color:#1f2937">
  <div style="background:#060d1a;padding:24px;border-radius:4px;margin-bottom:24px">
    <h1 style="color:#00d4f5;margin:0;font-size:20px">GROUNDWORK BHS</h1>
    <p style="color:#b8c5e0;margin:8px 0 0;font-size:13px">Contractor Match</p>
  </div>

  <p>Hi <strong>${data.clientFirstName}</strong>,</p>
  <p>A contractor has expressed interest in your project on <strong>${data.island}</strong>. Here are their contact details:</p>

  <div style="background:#f0fdf4;border:1px solid #16a34a;border-radius:4px;padding:20px;margin:20px 0">
    <table style="width:100%;font-size:14px;border-collapse:collapse">
      <tr><td style="padding:6px 0;color:#6b7280;width:120px">Name:</td><td style="padding:6px 0;font-weight:700">${data.contractorName}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280">Trade:</td><td style="padding:6px 0;font-weight:600">${data.contractorTrade}</td></tr>
      ${data.contractorPhone ? `<tr><td style="padding:6px 0;color:#6b7280">Phone:</td><td style="padding:6px 0"><a href="tel:${data.contractorPhone}" style="color:#059669">${data.contractorPhone}</a></td></tr>` : ''}
      ${data.contractorEmail ? `<tr><td style="padding:6px 0;color:#6b7280">Email:</td><td style="padding:6px 0"><a href="mailto:${data.contractorEmail}" style="color:#059669">${data.contractorEmail}</a></td></tr>` : ''}
      ${data.contractorWebsite ? `<tr><td style="padding:6px 0;color:#6b7280">Website:</td><td style="padding:6px 0"><a href="${data.contractorWebsite}" style="color:#059669">${data.contractorWebsite}</a></td></tr>` : ''}
    </table>
  </div>

  <p style="font-size:14px">This contractor matched your project requirements. Please contact them directly to discuss your project. Always verify contractor credentials before signing any agreement.</p>
  <p style="font-size:12px;color:#9ca3af"><a href="https://www.groundworksbhs.com/contractor-agreement" style="color:#00d4f5">Need a Contractor Agreement? Get one for $35 →</a></p>
</body>
</html>`

  try {
    if (!resend) {
      console.log(`[INTEREST NOTIFY — no Resend key] Would send to: ${data.clientEmail}`)
      return { sent: false }
    }
    await resend.emails.send({
      from: 'Groundwork BHS <noreply@groundworksbhs.com>',
      to: [recipient],
      subject: 'A contractor is interested in your project — Groundwork BHS',
      html,
    })
    return { sent: true }
  } catch (err) {
    console.error('Interest notification failed:', err)
    return { sent: false }
  }
}
