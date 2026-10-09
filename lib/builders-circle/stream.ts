import { NextResponse } from 'next/server'
import { get } from '@vercel/blob'

/** Streams a private blob with no-cache headers. Callers must authorise first. */
export async function streamPrivateBlob(pathname: string, fileName: string, mimeType?: string) {
  try {
    const result = await get(pathname, { access: 'private', token: process.env.BLOB_READ_WRITE_TOKEN })
    if (!result || result.statusCode !== 200 || !result.stream) return NextResponse.json({ error: 'File not found' }, { status: 404 })
    const safeName = fileName.replace(/[^a-z0-9._ -]/gi, '_').slice(0, 120) || 'file'
    return new NextResponse(result.stream as ReadableStream, {
      status: 200,
      headers: {
        'Content-Type': mimeType || result.blob?.contentType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${safeName}"`,
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    console.error('[builders-circle] blob read failed', err)
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
