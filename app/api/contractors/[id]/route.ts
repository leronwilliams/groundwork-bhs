/**
 * GET /api/contractors/[id]
 * Public contractor profile + recent reviews. Only active (approved) listings
 * are publicly visible; pending/inactive return 404.
 */

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { isHiddenContractor, isPlaceholderContractor } from '@/lib/contractors'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const contractor = await prisma.contractor.findUnique({
      where: { id },
      include: {
        reviews: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    })

    if (!contractor || contractor.listingStatus !== 'active' || isHiddenContractor(contractor.id)) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 })
    }

    const placeholder = isPlaceholderContractor(contractor.id)
    return NextResponse.json({ ...contractor, verified: contractor.verified && !placeholder, isPlaceholder: placeholder })
  } catch (error) {
    console.error('Error fetching contractor:', error)
    return NextResponse.json({ error: 'Failed to fetch contractor' }, { status: 500 })
  }
}
