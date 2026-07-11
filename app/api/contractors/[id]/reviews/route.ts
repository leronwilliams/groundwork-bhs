/**
 * POST /api/contractors/[id]/reviews
 * A signed-in user leaves a review (rating 1–5 + optional comment) for an
 * active contractor. Rating is validated 1–5 here (the schema stores a plain Int).
 */

import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'You must be signed in to leave a review.' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json().catch(() => ({}))

    const rating = Number(body.rating)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be a whole number from 1 to 5.' }, { status: 400 })
    }
    const comment = typeof body.comment === 'string' ? body.comment.trim() : ''

    const contractor = await prisma.contractor.findUnique({ where: { id } })
    if (!contractor || contractor.listingStatus !== 'active') {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
    }

    const user = await currentUser()
    const authorName = [user?.firstName, user?.lastName].filter(Boolean).join(' ').trim() || 'Anonymous'
    const dbUser = await prisma.user.findFirst({ where: { clerkId: userId } })

    const review = await prisma.review.create({
      data: {
        contractorId: id,
        authorUserId: dbUser?.id || userId,
        authorName,
        rating,
        comment: comment || null,
      },
    })

    return NextResponse.json({ success: true, review })
  } catch (error) {
    console.error('Error creating review:', error)
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }
}
