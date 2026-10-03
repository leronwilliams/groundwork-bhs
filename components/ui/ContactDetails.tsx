import { Phone, Mail, MessageCircle, MapPin } from 'lucide-react'
import { CONTACT, telHref, whatsappHref } from '@/lib/contact'

/** Renders whichever contact details are configured; renders nothing when none are set. */
export function ContactDetails({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const items: { icon: typeof Phone; label: string; value: string; href?: string; external?: boolean }[] = []
  if (CONTACT.phone) items.push({ icon: Phone, label: 'Phone', value: CONTACT.phone, href: telHref(CONTACT.phone) })
  if (CONTACT.whatsapp) items.push({ icon: MessageCircle, label: 'WhatsApp', value: CONTACT.whatsapp, href: whatsappHref(CONTACT.whatsapp), external: true })
  if (CONTACT.email) items.push({ icon: Mail, label: 'Email', value: CONTACT.email, href: `mailto:${CONTACT.email}` })
  if (CONTACT.address) items.push({ icon: MapPin, label: 'Address', value: CONTACT.address })
  if (items.length === 0) return null
  const lg = size === 'lg'
  return (
    <ul className={lg ? 'space-y-4' : 'space-y-2'} data-testid="contact-details">
      {items.map(({ icon: Icon, label, value, href, external }) => (
        <li key={label} className="flex items-start gap-3">
          <Icon size={lg ? 20 : 14} strokeWidth={2} style={{ color: 'var(--cyan)', marginTop: lg ? 2 : 3, flexShrink: 0 }} />
          <div className="min-w-0">
            {lg && <div className="text-xs uppercase tracking-wider font-mono" style={{ color: 'var(--muted)' }}>{label}</div>}
            {href ? (
              <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                className={`${lg ? 'text-lg font-semibold' : 'text-sm'} break-words hover:text-white transition-colors`}
                style={{ color: 'var(--text-secondary)' }}>{value}</a>
            ) : (
              <span className={`${lg ? 'text-lg font-semibold' : 'text-sm'} break-words`} style={{ color: 'var(--text-secondary)' }}>{value}</span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
