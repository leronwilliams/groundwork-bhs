/**
 * GET /api/boq-report?p=<blob pathname>&exp=<ms>&sig=<hmac>
 * Streams a private BOQ PDF from Vercel Blob after verifying the signed link
 * issued by /api/boq-v2 (only returned to the verified paying customer).
 */
import { NextRequest, NextResponse } from 'next/server'
import { get } from '@vercel/blob'
import { verifyReportSignature } from '@/lib/report-link'
import { rateLimit } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const limited = rateLimit(req, 'boq-report', 30)
  if (limited) return limited
  const sp = req.nextUrl.searchParams
  const pathname = sp.get('p')
  if (!verifyReportSignature(pathname, sp.get('exp'), sp.get('sig'))) {
    return NextResponse.json({ error: 'This report link is invalid or has expired.' }, { status: 403 })
  }
  try {
    const result = await get(pathname!, { access: 'private', token: process.env.BLOB_READ_WRITE_TOKEN })
    if (!result || result.statusCode !== 200 || !result.stream) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }
    const filename = pathname!.split('/').pop() || 'groundwork-boq.pdf'
    return new NextResponse(result.stream as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="groundwork-boq-${filename}"`,
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex',
      },
    })
  } catch (err) {
    console.error('[boq-report] fetch error:', err)
    return NextResponse.json({ error: 'Report not found' }, { status: 404 })
  }
}
