import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

function generateCode(name: string): string {
  const base = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return base + rand
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { businessName, category, contactName, email, phone, website, island, description, logoUrl } = body

    if (!businessName || !category || !contactName || !email || !island) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const referralCode = generateCode(businessName)

    const partner = await prisma.partner.create({
      data: {
        businessName, category, contactName, email, phone: phone || null,
        website: website || null, island, description: description || null,
        logoUrl: logoUrl || null, referralCode, monthlyFee: 9900,
        tier: 'basic', active: false, approved: false,
      },
    })

    // Notify admin
    if (resend) {
      await resend.emails.send({
        from: 'Groundwork BHS <noreply@groundworksbhs.com>',
        to: ['leronkwilliams@gmail.com'],
        subject: `New Partner Application: ${businessName}`,
        html: `<p>New partner application received.</p><p><strong>${businessName}</strong><br>${category} — ${island}<br>Contact: ${contactName} &lt;${email}&gt;</p><p><a href="https://www.groundworksbhs.com/admin/partners">Review in Admin Dashboard</a></p>`,
      }).catch(() => {})

      // Confirm to applicant
      await resend.emails.send({
        from: 'Groundwork BHS <noreply@groundworksbhs.com>',
        to: [email],
        subject: 'Your Groundwork BHS Partner Application',
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;padding:20px"><div style="background:#060d1a;padding:20px;border-radius:4px;margin-bottom:20px"><h1 style="color:#00d4f5;margin:0;font-size:18px">GROUNDWORK BHS</h1></div><p>Dear ${contactName},</p><p>Thank you for applying to join the Groundwork BHS Partner Network. We have received your application for <strong>${businessName}</strong>.</p><p>Our team will review your application and contact you within 2-3 business days.</p><p>Your referral code: <strong>${referralCode}</strong></p><p>Best regards,<br>Groundwork BHS Team</p></div>`,
      }).catch(() => {})
    }

    return NextResponse.json({ success: true, partnerId: partner.id, referralCode })
  } catch (error) {
    console.error('Partner application error:', error)
    return NextResponse.json({ error: 'Application failed' }, { status: 500 })
  }
}
