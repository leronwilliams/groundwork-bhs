/**
 * POST /api/builders-circle/documents
 * Records a document the member just uploaded directly to the private blob store.
 * The server re-checks the blob (path ownership, private store, size and type).
 */
import { NextRequest, NextResponse } from 'next/server'
import { head } from '@vercel/blob'
import { prisma } from '@/lib/db'
import { ALLOWED_UPLOAD_TYPES, DOC_TYPE_KEYS, DOC_TYPES, MAX_UPLOAD_BYTES, type DocType } from '@/lib/builders-circle/constants'
import { audit, baseUrl, dateOrNull, docPathPrefix, getCircleContext, readBody, sameOrigin, str } from '@/lib/builders-circle/server'
import { adminEmails, para, rows, sendCircleEmail } from '@/lib/builders-circle/email'
import { signPath } from '@/lib/builders-circle/signed-link'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return NextResponse.json({ error: 'Bad origin' }, { status: 403 })
  const { userId, member } = await getCircleContext()
  if (!userId) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  if (!member || member.status === 'suspended' || member.status === 'rejected') {
    return NextResponse.json({ error: 'Your membership cannot upload documents.' }, { status: 403 })
  }
  const b = await readBody(req)
  const pathname = str(b.pathname, 500)
  const type = str(b.type, 40) as DocType
  const fileName = str(b.fileName, 200) || 'document'
  const expiresAt = dateOrNull(b.expiresAt)

  if (!DOC_TYPE_KEYS.includes(type)) return NextResponse.json({ error: 'Choose a document type.' }, { status: 400 })
  if (!pathname.startsWith(docPathPrefix(member.contractorId)) || pathname.includes('..')) {
    return NextResponse.json({ error: 'That file does not belong to your account.' }, { status: 403 })
  }
  if (DOC_TYPES[type].expires && !expiresAt) return NextResponse.json({ error: 'Please enter the expiry date shown on the document.' }, { status: 400 })

  let meta
  try {
    meta = await head(pathname, { token: process.env.BLOB_READ_WRITE_TOKEN })
  } catch {
    return NextResponse.json({ error: 'Upload not found. Please try again.' }, { status: 400 })
  }
  if (!meta.url.includes('.private.')) return NextResponse.json({ error: 'File must be stored privately.' }, { status: 400 })
  if (meta.size > MAX_UPLOAD_BYTES || !ALLOWED_UPLOAD_TYPES.includes(meta.contentType)) {
    return NextResponse.json({ error: 'Only PDF, JPG or PNG files up to 10 MB.' }, { status: 400 })
  }

  const doc = await prisma.contractorDocument.create({
    data: { contractorId: member.contractorId, type, blobPathname: pathname, fileName, mimeType: meta.contentType, size: meta.size, status: 'pending', expiresAt },
  })
  await audit(userId, 'document.uploaded', 'ContractorDocument', doc.id, { type, contractorId: member.contractorId })

  const origin = baseUrl(req)
  await sendCircleEmail({
    to: adminEmails(),
    subject: `Document to review: ${DOC_TYPES[type].label} — ${member.contractor.name}`,
    heading: 'New document to review',
    body: para(`${member.contractor.name} uploaded a document for verification.`) +
      rows([['Document', DOC_TYPES[type].label], ['File', fileName], ['Expires', expiresAt ? expiresAt.toDateString() : 'n/a']]) +
      `<p style="font-size:13px"><a href="${origin}${signPath(`/api/builders-circle/documents/${doc.id}/file`, 24 * 60 * 60 * 1000)}">View document</a> (link expires in 24 hours; admin sign-in required)</p>`,
    cta: { label: 'Review applicant', url: `${origin}/admin/builders-circle/members/${member.id}` },
  })
  return NextResponse.json({ ok: true, documentId: doc.id })
}
