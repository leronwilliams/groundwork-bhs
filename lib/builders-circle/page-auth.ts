import { redirect } from 'next/navigation'
import { getCircleContext } from '@/lib/builders-circle/server'

/** For member pages: signed-in Builders Circle member, or redirect to sign-in / join. */
export async function requireMemberPage(path: string) {
  const ctx = await getCircleContext()
  if (!ctx.userId) redirect(`/sign-in?redirect_url=${encodeURIComponent(path)}`)
  if (!ctx.member) redirect('/builders-circle/join')
  return { userId: ctx.userId, admin: ctx.admin, member: ctx.member }
}
