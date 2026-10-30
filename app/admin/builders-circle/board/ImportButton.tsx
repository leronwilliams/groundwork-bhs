'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function ImportButton() {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  async function run() {
    setBusy(true); setMsg(null)
    const res = await fetch('/api/admin/builders-circle/board/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    const d = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) return setMsg({ ok: false, text: d.error || 'Import failed' })
    setMsg({ ok: true, text: `Imported ${d.created} new draft(s). ${d.existing} already on the board, ${d.skippedFilter} not construction/works, ${d.skippedClosed} closed.` }); router.refresh()
  }
  return (
    <span className="inline-flex items-center gap-3 flex-wrap">
      <button onClick={run} disabled={busy} className="px-4 py-2 rounded-sm text-sm font-bold inline-flex items-center gap-2" style={{ border: '1px solid var(--cyan-border)', color: 'var(--cyan)' }} data-testid="import-btn">{busy && <Loader2 size={14} className="animate-spin" />}Import open tenders (Bonfire)</button>
      {msg && <span className="text-sm" style={{ color: msg.ok ? '#059669' : '#ef4444' }} data-testid="import-msg">{msg.text}</span>}
    </span>
  )
}
