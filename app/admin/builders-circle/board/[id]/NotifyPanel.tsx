'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { JobAlerts } from '@/components/builders-circle/JobAlerts'

export function NotifyPanel({ postId, location, devices, members, myDevices, pushedAt, blocked, publicKey }: { postId: string; location: string; devices: number; members: number; myDevices: number; pushedAt: string | null; blocked: string | null; publicKey: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [confirm, setConfirm] = useState('')
  const [again, setAgain] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  async function go(mode: 'test' | 'send') {
    setBusy(true); setMsg(null)
    const res = await fetch(`/api/admin/builders-circle/board/${postId}/notify`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode, confirm, again }) })
    const d = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) return setMsg({ ok: false, text: d.error || 'Failed' })
    setMsg({ ok: true, text: mode === 'test' ? `Test push sent to ${d.sent} of ${d.devices} of your device(s).` : `Pushed to ${d.sent} of ${d.devices} device(s)${d.removed ? `, ${d.removed} expired device(s) removed` : ''}${d.testMode ? ' (preview: capped, post not marked as pushed)' : ''}.` }); router.refresh()
  }
  const btn = { border: '1px solid var(--cyan-border)', color: 'var(--cyan)' }
  return (
    <div className="mt-10 p-5 rounded-sm space-y-4" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }} data-testid="notify-panel">
      <h2 className="font-bold" style={{ color: 'var(--text-primary)', fontSize: '1.1rem' }}>Notify members (phone alert)</h2>
      <p className="text-xs" style={{ color: 'var(--muted)' }}>
        {location === 'Grand Bahama' || location === 'Nassau'
          ? <>Goes to <strong>{devices}</strong> device(s) of <strong>{members}</strong> approved member(s) with {location === 'Nassau' ? 'a Nassau / New Providence' : 'a Grand Bahama'} service area who turned on job alerts.</>
          : <>Alerts only go out for Grand Bahama and Nassau posts. This post is tagged {location}, so there is nobody to notify.</>}
        {pushedAt && <> Already pushed {new Date(pushedAt).toLocaleString('en-US', { timeZone: 'America/New_York', dateStyle: 'medium', timeStyle: 'short' })} ET.</>}
      </p>
      <div>
        <p className="text-xs mb-2" style={{ color: 'var(--muted)' }}>Your own device ({myDevices} subscribed). Turn alerts on here to receive test pushes:</p>
        <div className="p-3 rounded-sm bc-light" style={{ background: '#fff' }}><JobAlerts publicKey={publicKey} signedIn canSubscribe /></div>
      </div>
      <div className="flex gap-3 flex-wrap items-center">
        <button disabled={busy || myDevices === 0} onClick={() => go('test')} className="px-4 py-2 rounded-sm text-sm font-bold inline-flex items-center gap-2 disabled:opacity-40" style={btn} data-testid="push-test">{busy && <Loader2 size={14} className="animate-spin" />}Send test push to me</button>
      </div>
      <div className="p-4 rounded-sm" style={{ background: 'var(--navy)', border: '1px solid var(--cyan-border)' }}>
        <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Notify members</p>
        {blocked && <p className="text-xs mb-2" style={{ color: '#f59e0b' }} data-testid="push-blocked">{blocked}</p>}
        <div className="flex gap-3 flex-wrap items-center">
          <input value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Type SEND" className="p-2 rounded-sm text-sm w-32" style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }} data-testid="push-confirm" />
          {pushedAt && <label className="text-xs flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}><input type="checkbox" checked={again} onChange={e => setAgain(e.target.checked)} /> send again</label>}
          <button disabled={busy || confirm !== 'SEND' || !!blocked || devices === 0} onClick={() => go('send')} className="px-4 py-2 rounded-sm text-sm font-bold disabled:opacity-40" style={{ background: 'var(--cyan)', color: 'var(--navy)' }} data-testid="push-send">Notify {devices} device(s)</button>
        </div>
      </div>
      {msg && <p className="text-sm" style={{ color: msg.ok ? '#059669' : '#ef4444' }} data-testid="push-msg">{msg.text}</p>}
    </div>
  )
}
