/** POST /api/admin/builders-circle/jobs — admin creates a job (saved as draft; publish separately). */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { CIRCLE_ISLAND } from '@/lib/builders-circle/constants'
import { adminFromRequest, audit, readBody } from '@/lib/builders-circle/server'
import { parseJobInput } from '@/lib/builders-circle/jobs'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const adminId = await adminFromRequest(req)
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const parsed = parseJobInput(await readBody(req))
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const job = await prisma.circleJob.create({ data: { ...parsed.data, island: CIRCLE_ISLAND, postedByUserId: adminId, posterType: 'admin', status: 'draft' } })
  await audit(adminId, 'job.created', 'CircleJob', job.id)
  return NextResponse.json({ ok: true, jobId: job.id })
}
