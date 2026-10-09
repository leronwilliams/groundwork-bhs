'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { FilePicker, ProgressNote, useBlobUpload } from '@/components/builders-circle/BlobUploader'
import { fieldStyle } from '@/components/builders-circle/ui'

type Existing = { amount: string; vatIncluded: boolean; timelineDays: string; availableFrom: string; scopeNotes: string; status: string; hasAttachment: boolean } | null

export function EstimateForm({ jobId, pathPrefix, existing }: { jobId: string; pathPrefix: string; existing: Existing }) {
  const router = useRouter()
  const { send, progress } = useBlobUpload()
  const [f, setF] = useState({ amount: existing?.amount || '', vatIncluded: existing?.vatIncluded || false, timelineDays: existing?.timelineDays || '', availableFrom: existing?.availableFrom || '', scopeNotes: existing?.scopeNotes || '' })
  const [file, setFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const live = existing && existing.status !== 'withdrawn'

  async function post(body: Record<string, unknown>) {
    const res = await fetch(`/api/builders-circle/jobs/${jobId}/estimate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || 'Something went wrong.')
    return data
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    try {
      let attachmentPathname: string | undefined
      if (file) attachmentPathname = (await send(file, pathPrefix, { kind: 'estimate', jobId })).pathname
      const data = await post({ action: 'submit', ...f, attachmentPathname })
      setMsg({ ok: true, text: `Estimate ${data.verb}.` })
      setFile(null)
      router.refresh()
    } catch (err) { setMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed' }) } finally { setBusy(false) }
  }

  async function withdraw() {
    if (!confirm('Withdraw your estimate? You can resubmit before the deadline.')) return
    setBusy(true); setMsg(null)
    try { await post({ action: 'withdraw' }); setMsg({ ok: true, text: 'Estimate withdrawn.' }); router.refresh() }
    catch (err) { setMsg({ ok: false, text: err instanceof Error ? err.message : 'Failed' }) } finally { setBusy(false) }
  }

  const L = ({ children }: { children: React.ReactNode }) => <label className="block text-xs mb-1.5" style={{ color: 'var(--muted)' }}>{children}</label>
  return (
    <form onSubmit={submit} className="space-y-4" data-testid="estimate-form">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div><L>Price (B$)</L><input name="amount" required inputMode="decimal" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} className="w-full p-3 rounded-sm text-sm" style={fieldStyle} placeholder="25,000.00" /></div>
        <div><L>Timeline (days)</L><input name="timelineDays" required type="number" min={1} value={f.timelineDays} onChange={e => setF({ ...f, timelineDays: e.target.value })} className="w-full p-3 rounded-sm text-sm" style={fieldStyle} /></div>
        <div><L>Available from</L><input name="availableFrom" type="date" value={f.availableFrom} onChange={e => setF({ ...f, availableFrom: e.target.value })} className="w-full p-3 rounded-sm text-sm" style={fieldStyle} /></div>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
        <input type="checkbox" name="vatIncluded" checked={f.vatIncluded} onChange={e => setF({ ...f, vatIncluded: e.target.checked })} /> Price includes VAT (10%)
      </label>
      <div><L>What your price includes</L><textarea name="scopeNotes" required rows={5} value={f.scopeNotes} onChange={e => setF({ ...f, scopeNotes: e.target.value })} className="w-full p-3 rounded-sm text-sm" style={fieldStyle} placeholder="Materials, labour, exclusions, payment schedule…" /></div>
      <div><L>Attach a detailed quote (optional){existing?.hasAttachment ? ' — uploading replaces the current file' : ''}</L><FilePicker onPick={setFile} disabled={busy} label="Attach file" /></div>
      <div className="flex items-center gap-3 flex-wrap">
        <button type="submit" disabled={busy} className="px-6 py-2.5 rounded-sm font-bold text-sm inline-flex items-center gap-2" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
          {busy && <Loader2 size={14} className="animate-spin" />} {live ? 'Update estimate' : existing ? 'Resubmit estimate' : 'Submit estimate'}
        </button>
        {live && <button type="button" disabled={busy} onClick={withdraw} className="px-4 py-2.5 rounded-sm text-sm font-bold" style={{ border: '1px solid var(--bc-error, #ef4444)', color: 'var(--bc-error, #ef4444)' }}>Withdraw</button>}
        <ProgressNote progress={progress} />
        {msg && <span className="text-sm inline-flex items-center gap-2" style={{ color: msg.ok ? 'var(--bc-ok, #059669)' : 'var(--bc-error, #ef4444)' }} data-testid="estimate-msg">{msg.ok ? <CheckCircle size={14} /> : <AlertCircle size={14} />} {msg.text}</span>}
      </div>
    </form>
  )
}
