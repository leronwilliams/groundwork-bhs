'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FilePicker, ProgressNote, useBlobUpload } from '@/components/builders-circle/BlobUploader'

export function JobAttachments({ jobId, pathPrefix, files }: { jobId: string; pathPrefix: string; files: { fileName: string }[] }) {
  const router = useRouter()
  const { send, progress } = useBlobUpload()
  const [file, setFile] = useState<File | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const post = (body: unknown) => fetch(`/api/admin/builders-circle/jobs/${jobId}/attachments`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  return (
    <div className="space-y-3">
      <ul className="space-y-1">{files.map((f, i) => (
        <li key={i} className="text-sm flex gap-3"><a href={`/api/builders-circle/jobs/${jobId}/attachments?i=${i}`} target="_blank" rel="noopener" style={{ color: 'var(--cyan)' }}>{f.fileName}</a>
          <button type="button" className="text-xs" style={{ color: '#ef4444' }} onClick={async () => { await post({ remove: i }); router.refresh() }}>remove</button></li>
      ))}</ul>
      <FilePicker onPick={setFile} label="Choose drawing / file" />
      <div className="flex items-center gap-3">
        <button type="button" disabled={!file || progress !== null} className="px-4 py-1.5 rounded-sm text-xs font-bold" style={{ border: '1px solid var(--cyan-border)', color: 'var(--cyan)' }}
          onClick={async () => {
            if (!file) return
            setErr(null)
            try {
              const blob = await send(file, pathPrefix, { kind: 'job', jobId })
              const r = await post({ pathname: blob.pathname, fileName: file.name })
              if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || 'Failed')
              setFile(null); router.refresh()
            } catch (e) { setErr(e instanceof Error ? e.message : 'Upload failed') }
          }}>Upload file</button>
        <ProgressNote progress={progress} />
        {err && <span className="text-xs" style={{ color: '#ef4444' }}>{err}</span>}
      </div>
    </div>
  )
}
