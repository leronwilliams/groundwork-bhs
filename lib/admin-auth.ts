/**
 * Admin authentication helper.
 *
 * Admins are listed in ADMIN_CLERK_IDS (comma- or space-separated Clerk user
 * ids). The original single ADMIN_CLERK_ID is still honoured, so existing
 * setups keep working unchanged. Non-admins are redirected to / with no error.
 */

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export function adminIds(): string[] {
  const list = (process.env.ADMIN_CLERK_IDS || '').split(/[\s,]+/)
  const single = process.env.ADMIN_CLERK_ID || ''
  return Array.from(new Set([...list, single].map(s => s.trim()).filter(Boolean)))
}

export function isAdmin(userId: string | null | undefined): boolean {
  return !!userId && adminIds().includes(userId)
}

export async function requireAdmin() {
  const { userId } = await auth()
  if (!isAdmin(userId)) {
    redirect('/')
  }
  return userId as string
}
