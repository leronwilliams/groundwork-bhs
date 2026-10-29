/** PATCH /api/admin/builders-circle/jobs/[id] — admin edits a job (not once awarded/cancelled). */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { adminFromRequest, audit, readBody } from '@/lib/builders-circle/server'
import { parseJobInput } from '@/lib/builders-circle/jobs'

export const runtime = 'nodejs'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminId = await adminFromRequest(req)
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { id } = await params
  const job = await prisma.circleJob.findUnique({ where: { id } })
  if (!job) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (job.status === 'awarded' || job.status === 'cancelled') return NextResponse.json({ error: 'Awarded or cancelled jobs cannot be edited.' }, { status: 409 })
  const parsed = parseJobInput(await readBody(req))
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  await prisma.circleJob.update({ where: { id }, data: parsed.data })
  await audit(adminId, 'job.updated', 'CircleJob', id)
  return NextResponse.json({ ok: true })
}
