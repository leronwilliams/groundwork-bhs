'use client'
import { useRef, useState } from 'react'
import { upload } from '@vercel/blob/client'
import { Loader2, Upload } from 'lucide-react'

/**
 * Uploads one file straight from the browser to the PRIVATE blob store.
 * The server (/api/builders-circle/upload) checks who you are before issuing a token.
 */
export function useBlobUpload() {
  const [progress, setProgress] = useState<number | null>(null)
  async function send(file: File, pathPrefix: string, clientPayload: Record<string, string>) {
    const safe = file.name.replace(/[^a-z0-9._-]/gi, '_').slice(-80) || 'file'
    setProgress(0)
    try {
      const blob = await upload(`${pathPrefix}${safe}`, file, {
        access: 'private',
        handleUploadUrl: '/api/builders-circle/upload',
        clientPayload: JSON.stringify(clientPayload),
        contentType: file.type,
        onUploadProgress: p => setProgress(Math.round(p.percentage)),
      })
      return blob
    } finally {
      setProgress(null)
    }
  }
  return { send, progress }
}

export function FilePicker({ onPick, disabled, label = 'Choose file' }: { onPick: (f: File | null) => void; disabled?: boolean; label?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const [name, setName] = useState<string | null>(null)
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <input ref={ref} type="file" accept="application/pdf,image/jpeg,image/png" className="hidden" data-testid="file-input"
        onChange={e => { const f = e.target.files?.[0] || null; setName(f?.name || null); onPick(f) }} />
      <button type="button" disabled={disabled} onClick={() => ref.current?.click()} className="inline-flex items-center gap-2 px-4 py-2 rounded-sm text-sm font-bold"
        style={{ border: '1px solid var(--cyan-border)', color: 'var(--cyan)' }}>
        <Upload size={14} /> {label}
      </button>
      <span className="text-xs" style={{ color: 'var(--muted)' }}>{name || 'PDF, JPG or PNG, up to 10 MB'}</span>
    </div>
  )
}

export function ProgressNote({ progress }: { progress: number | null }) {
  if (progress === null) return null
  return <span className="inline-flex items-center gap-2 text-xs" style={{ color: 'var(--cyan)' }}><Loader2 size={12} className="animate-spin" /> Uploading {progress}%</span>
}
