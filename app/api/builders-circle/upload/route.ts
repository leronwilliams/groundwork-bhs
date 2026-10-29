/**
 * POST /api/builders-circle/upload
 * Issues short-lived Vercel Blob client-upload tokens so files go straight from
 * the browser to the PRIVATE blob store (no 4.5 MB function body limit).
 * Every token is tied to the signed-in user and a path they are allowed to write:
 *   doc      → {prefix}/docs/{ownContractorId}/...       (any member not suspended/rejected)
 *   estimate → {prefix}/estimates/{jobId}/{ownContractorId}/...  (verified member, open job)
 *   job      → {prefix}/jobs/{jobId}/...                 (admins only)
 * Uploaded files are only recorded once the matching API route verifies them.
 */
import { NextRequest, NextResponse } from 'next/server'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { ALLOWED_UPLOAD_TYPES, MAX_UPLOAD_BYTES } from '@/lib/builders-circle/constants'
import { blobPrefix, docPathPrefix, getCircleContext, jobPathPrefix, sameOrigin } from '@/lib/builders-circle/server'

export const runtime = 'nodejs'

class UploadDenied extends Error {}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Bad origin' }, { status: 403 })
  const limited = rateLimit(req, 'bc-upload', 30)
  if (limited) return limited
  const body = (await req.json().catch(() => null)) as HandleUploadBody | null
  if (!body || body.type !== 'blob.generate-client-token') {
    return NextResponse.json({ error: 'Unsupported upload event' }, { status: 400 })
  }
  const { userId, admin, member } = await getCircleContext()
  if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })

  try {
    const result = await handleUpload({
      body,
      request: req,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        if (pathname.includes('..') || pathname.includes('//')) throw new UploadDenied('Invalid file path')
        let payload: { kind?: string; jobId?: string } = {}
        try { payload = JSON.parse(clientPayload || '{}') } catch { /* ignore */ }

        if (payload.kind === 'doc') {
          if (!member || member.status === 'suspended' || member.status === 'rejected') throw new UploadDenied('Your membership cannot upload documents.')
          if (!pathname.startsWith(docPathPrefix(member.contractorId))) throw new UploadDenied('Invalid document path')
        } else if (payload.kind === 'estimate') {
          if (!member || member.status !== 'verified') throw new UploadDenied('Only verified members can attach files to estimates.')
          const job = payload.jobId ? await prisma.circleJob.findUnique({ where: { id: payload.jobId }, select: { status: true } }) : null
          if (!job || job.status !== 'open') throw new UploadDenied('This job is not open for estimates.')
          if (!pathname.startsWith(`${blobPrefix()}/estimates/${payload.jobId}/${member.contractorId}/`)) throw new UploadDenied('Invalid estimate path')
        } else if (payload.kind === 'job') {
          if (!admin) throw new UploadDenied('Admins only')
          if (!payload.jobId || !pathname.startsWith(jobPathPrefix(payload.jobId))) throw new UploadDenied('Invalid job path')
        } else {
          throw new UploadDenied('Unknown upload type')
        }
        return {
          allowedContentTypes: ALLOWED_UPLOAD_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          validUntil: Date.now() + 10 * 60 * 1000,
          tokenPayload: JSON.stringify({ userId, kind: payload.kind }),
        }
      },
    })
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof UploadDenied ? err.message : 'Upload could not be authorised'
    if (!(err instanceof UploadDenied)) console.error('[builders-circle upload]', err)
    return NextResponse.json({ error: msg }, { status: err instanceof UploadDenied ? 403 : 400 })
  }
}
