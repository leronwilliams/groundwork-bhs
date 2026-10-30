'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function DigestPanel({ disabled, recipients, posts, productionOff }: { disabled: boolean; recipients: number; posts: number; productionOff: boolean }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  async function go(mode: 'test' | 'send') {
    setBusy(true); setMsg(null)
    const res = await fetch('/api/admin/builders-circle/board/digest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode, confirm }) })
    const d = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) return setMsg({ ok: false, text: d.error || 'Failed' })
    setMsg({ ok: true, text: mode === 'test' ? (d.sent ? 'Test digest sent to the admin address.' : `Not sent: ${d.skipped || 'unknown'}`) : `Sent ${d.sent} of ${d.recipients}${d.testMode ? ' (test mode: redirected to the test inbox, capped, posts not marked as sent)' : ''}.` }); router.refresh()
  }
  const btn = { border: '1px solid var(--cyan-border)', color: 'var(--cyan)' }
  return (
    <div className="space-y-4" data-testid="digest-panel">
      <div className="flex gap-3 flex-wrap items-center">
        <button disabled={busy || disabled} onClick={() => go('test')} className="px-4 py-2 rounded-sm text-sm font-bold inline-flex items-center gap-2" style={btn} data-testid="digest-test">{busy && <Loader2 size={14} className="animate-spin" />}Send test to me</button>
      </div>
      <div className="p-4 rounded-sm" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}>
        <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Send to members</p>
        <p className="text-xs mb-3" style={{ color: 'var(--muted)' }}>{posts} post(s) to {recipients} verified Grand Bahama member(s). {productionOff && 'Member sends are switched OFF in production until BC_DIGEST_SEND_ENABLED=1 is set.'}</p>
        <div className="flex gap-3 flex-wrap items-center">
          <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Type SEND" className="p-2 rounded-sm text-sm w-32" style={{ background: 'var(--navy)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }} data-testid="digest-confirm" />
          <button disabled={busy || disabled || confirm !== 'SEND' || productionOff} onClick={() => go('send')} className="px-4 py-2 rounded-sm text-sm font-bold disabled:opacity-40" style={{ background: 'var(--cyan)', color: 'var(--navy)' }} data-testid="digest-send">Send digest</button>
        </div>
      </div>
      {msg && <p className="text-sm" style={{ color: msg.ok ? '#059669' : '#ef4444' }} data-testid="digest-msg">{msg.text}</p>}
    </div>
  )
}
