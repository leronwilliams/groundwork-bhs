/**
 * Admin authentication helper.
 * Only the user with ADMIN_CLERK_ID can access /admin routes.
 * Any other user is redirected to / with no error message.
 */

import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export async function requireAdmin() {
  const { userId } = await auth()
  const adminId = process.env.ADMIN_CLERK_ID

  if (!userId || !adminId || userId !== adminId) {
    redirect('/')
  }

  return userId
}

export function isAdmin(userId: string | null): boolean {
  const adminId = process.env.ADMIN_CLERK_ID
  return !!userId && !!adminId && userId === adminId
}
