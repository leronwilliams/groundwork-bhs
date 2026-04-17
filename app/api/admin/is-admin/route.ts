import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const { userId } = await auth()
    return NextResponse.json({ isAdmin: !!userId && userId === process.env.ADMIN_CLERK_ID })
  } catch {
    return NextResponse.json({ isAdmin: false })
  }
}
