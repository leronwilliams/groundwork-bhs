/**
 * Builders Circle — pre-registered ("invited") contractors.
 * An invite is a CircleMember whose userId is a placeholder `invite:<contractorId>` (status "applied").
 * When someone signs up with a VERIFIED email that matches the invite's contractor email (or an alternate
 * email recorded in statusReason), POST /api/builders-circle/join claims that row instead of creating a new one.
 */
import { prisma } from '@/lib/db'

export const INVITE_PREFIX = 'invite:'

type ClerkUserLike = { emailAddresses?: { emailAddress: string; verification?: { status?: string | null } | null }[] } | null | undefined

export function verifiedEmails(user: ClerkUserLike): string[] {
  return (user?.emailAddresses ?? [])
    .filter(e => e.verification?.status === 'verified')
    .map(e => e.emailAddress.trim().toLowerCase())
    .filter(Boolean)
}

export async function findInvite(emails: string[]) {
  if (!emails.length) return null
  const candidates = await prisma.circleMember.findMany({
    where: {
      userId: { startsWith: INVITE_PREFIX },
      OR: emails.flatMap(e => [
        { contractor: { email: { equals: e, mode: 'insensitive' as const } } },
        { statusReason: { contains: e, mode: 'insensitive' as const } },
      ]),
    },
    include: { contractor: true },
  })
  // statusReason may list alternate emails; require a whole-token match (not a substring of a longer address).
  return candidates.find(m =>
    emails.includes((m.contractor.email || '').trim().toLowerCase()) ||
    (m.statusReason || '').toLowerCase().split(/[\s|,;]+/).some(t => emails.includes(t)),
  ) ?? null
}
