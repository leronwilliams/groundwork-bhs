import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { isAdmin } from '@/lib/admin-auth'

export async function GET() {
  try {
    const { userId } = await auth()
    return NextResponse.json({ isAdmin: isAdmin(userId) })
  } catch {
    return NextResponse.json({ isAdmin: false })
  }
}
