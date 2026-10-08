'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { DOC_TYPES, DOC_TYPE_KEYS, MAX_UPLOAD_BYTES, ALLOWED_UPLOAD_TYPES, type DocType } from '@/lib/builders-circle/constants'
import { FilePicker, ProgressNote, useBlobUpload } from '@/components/builders-circle/BlobUploader'
import { fieldStyle, cardStyle } from '@/components/builders-circle/ui'

export function DocumentUpload({ pathPrefix }: { pathPrefix: string }) {
  const router = useRouter()
  const { send, progress } = useBlobUpload()
  const [type, setType] = useState<DocType | ''>('')
  const [expiresAt, setExpiresAt] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const needsExpiry = type ? DOC_TYPES[type].expires : false

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (!type) return setMsg({ ok: false, text: 'Choose the document type.' })
    if (!file) return setMsg({ ok: false, text: 'Choose a file.' })
    if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) return setMsg({ ok: false, text: 'Only PDF, JPG or PNG files.' })
    if (file.size > MAX_UPLOAD_BYTES) return setMsg({ ok: false, text: 'File is larger than 10 MB.' })
    if (needsExpiry && !expiresAt) return setMsg({ ok: false, text: 'Enter the expiry date shown on the document.' })
    setBusy(true)
    try {
      const blob = await send(file, pathPrefix, { kind: 'doc' })
      const res = await fetch('/api/builders-circle/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pathname: blob.pathname, type, fileName: file.name, expiresAt: expiresAt || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Could not save the document.')
      setMsg({ ok: true, text: 'Uploaded. Our team will review it shortly.' })
      setType(''); setExpiresAt(''); setFile(null)
      router.refresh()
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Upload failed.' })
    } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="p-6 rounded-sm space-y-4" style={cardStyle} data-testid="doc-upload-form">
      <h2 style={{ fontSize: '1.15rem' }}>Upload a document</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Document type</label>
          <select name="type" value={type} onChange={e => setType(e.target.value as DocType)} className="w-full p-3 rounded-sm text-sm" style={fieldStyle}>
            <option value="">Select…</option>
            {DOC_TYPE_KEYS.map(k => <option key={k} value={k}>{DOC_TYPES[k].label}</option>)}
          </select>
          {type && <p className="text-xs mt-1.5" style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>{DOC_TYPES[type].hint}</p>}
        </div>
        <div>
          <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>Expiry date {needsExpiry ? '' : '(if any)'}</label>
          <input name="expiresAt" type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="w-full p-3 rounded-sm text-sm" style={fieldStyle} />
        </div>
      </div>
      <FilePicker onPick={setFile} disabled={busy} />
      <div className="flex items-center gap-4 flex-wrap">
        <button type="submit" disabled={busy} className="px-6 py-2.5 rounded-sm font-bold text-sm inline-flex items-center gap-2" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
          {busy && <Loader2 size={14} className="animate-spin" />} Upload securely
        </button>
        <ProgressNote progress={progress} />
        {msg && <span className="text-sm inline-flex items-center gap-2" style={{ color: msg.ok ? '#059669' : '#ef4444' }} data-testid="upload-msg">{msg.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {msg.text}</span>}
      </div>
    </form>
  )
}

export function DeleteDocButton({ id }: { id: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  return (
    <button type="button" disabled={busy} className="text-xs font-bold" style={{ color: '#ef4444' }}
      onClick={async () => {
        if (!confirm('Remove this document?')) return
        setBusy(true)
        await fetch(`/api/builders-circle/documents/${id}`, { method: 'DELETE' })
        setBusy(false); router.refresh()
      }}>
      {busy ? 'Removing…' : 'Remove'}
    </button>
  )
}
