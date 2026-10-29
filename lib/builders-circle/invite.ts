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
  return prisma.circleMember.findFirst({
    where: {
      userId: { startsWith: INVITE_PREFIX },
      OR: emails.flatMap(e => [
        { contractor: { email: { equals: e, mode: 'insensitive' as const } } },
        { statusReason: { contains: e, mode: 'insensitive' as const } },
      ]),
    },
    include: { contractor: true },
  })
}
