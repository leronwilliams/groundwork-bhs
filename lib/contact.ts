/**
 * Public contact details. Set these in Vercel → Project → Settings →
 * Environment Variables (Production), then redeploy. Any value left unset is
 * simply not shown; if none are set, the contact block/page shows a generic
 * message pointing to the Advisor.
 *
 *   NEXT_PUBLIC_CONTACT_PHONE     e.g. "+1 (242) 555-0123"
 *   NEXT_PUBLIC_CONTACT_EMAIL     e.g. "hello@groundworksbhs.com"
 *   NEXT_PUBLIC_CONTACT_WHATSAPP  e.g. "+12425550123" (digits used for wa.me link)
 *   NEXT_PUBLIC_CONTACT_ADDRESS   e.g. "Bay Street, Nassau, The Bahamas"
 */
export interface ContactInfo {
  phone?: string
  email?: string
  whatsapp?: string
  address?: string
}

const clean = (v: string | undefined) => (v && v.trim() ? v.trim() : undefined)

export const CONTACT: ContactInfo = {
  phone: clean(process.env.NEXT_PUBLIC_CONTACT_PHONE),
  email: clean(process.env.NEXT_PUBLIC_CONTACT_EMAIL),
  whatsapp: clean(process.env.NEXT_PUBLIC_CONTACT_WHATSAPP),
  address: clean(process.env.NEXT_PUBLIC_CONTACT_ADDRESS),
}

export const HAS_CONTACT = Boolean(CONTACT.phone || CONTACT.email || CONTACT.whatsapp || CONTACT.address)

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`
}

export function whatsappHref(num: string): string {
  return `https://wa.me/${num.replace(/\D/g, '')}`
}
