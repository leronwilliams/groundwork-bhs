/** POST /api/admin/builders-circle/board/import — admin pulls open tenders from the public Bonfire portal as DRAFTS. */
import { NextRequest, NextResponse } from 'next/server'
import { adminFromRequest, audit, readBody } from '@/lib/builders-circle/server'
import { importBonfire } from '@/lib/builders-circle/board'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const adminId = await adminFromRequest(req)
  if (!adminId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const b = await readBody(req)
  try {
    const result = await importBonfire({ all: b.all === true || b.all === 'true' })
    await audit(adminId, 'board.imported', 'BoardPost', 'bonfire', { created: result.created, existing: result.existing, fetched: result.fetched })
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    return NextResponse.json({ error: `Import failed: ${err instanceof Error ? err.message : String(err)}` }, { status: 502 })
  }
}
