'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { BUDGET_RANGES, CIRCLE_TRADES, SETTLEMENTS } from '@/lib/builders-circle/constants'
import { CheckboxGroup } from '@/components/builders-circle/CheckboxGroup'

const input = { background: 'var(--navy)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }
export type JobFormValues = { title: string; summary: string; description: string; trades: string[]; settlement: string; budgetRange: string; siteVisit: boolean; bidDeadline: string; targetStart: string; clientContact: string }
export const emptyJob: JobFormValues = { title: '', summary: '', description: '', trades: [], settlement: '', budgetRange: '', siteVisit: false, bidDeadline: '', targetStart: '', clientContact: '' }

export function JobForm({ jobId, initial, disabled }: { jobId?: string; initial: JobFormValues; disabled?: boolean }) {
  const router = useRouter()
  const [f, setF] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const L = ({ children }: { children: React.ReactNode }) => <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>{children}</label>

  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null)
    const res = await fetch(jobId ? `/api/admin/builders-circle/jobs/${jobId}` : '/api/admin/builders-circle/jobs', { method: jobId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) return setMsg({ ok: false, text: data.error || 'Could not save' })
    if (!jobId && data.jobId) { router.push(`/admin/builders-circle/jobs/${data.jobId}`); return }
    setMsg({ ok: true, text: 'Saved.' }); router.refresh()
  }

  return (
    <form onSubmit={save} className="space-y-4" data-testid="job-form">
      <fieldset disabled={disabled || busy} className="space-y-4">
        <div><L>Title (start test jobs with “TEST”)</L><input name="title" required value={f.title} onChange={e => setF({ ...f, title: e.target.value })} className="w-full p-2.5 rounded-sm text-sm" style={input} /></div>
        <div><L>Summary — visible to ALL members (no client names or addresses)</L><textarea name="summary" required rows={2} value={f.summary} onChange={e => setF({ ...f, summary: e.target.value })} className="w-full p-2.5 rounded-sm text-sm" style={input} /></div>
        <div><L>Full scope — verified members only</L><textarea name="description" required rows={6} value={f.description} onChange={e => setF({ ...f, description: e.target.value })} className="w-full p-2.5 rounded-sm text-sm" style={input} /></div>
        <div><L>Trades</L><CheckboxGroup name="trades" options={CIRCLE_TRADES} value={f.trades} onChange={v => setF({ ...f, trades: v })} /></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div><L>Area</L><select name="settlement" value={f.settlement} onChange={e => setF({ ...f, settlement: e.target.value })} className="w-full p-2.5 rounded-sm text-sm" style={input}><option value="">Grand Bahama (any)</option>{SETTLEMENTS.map(s => <option key={s}>{s}</option>)}</select></div>
          <div><L>Budget range</L><select name="budgetRange" value={f.budgetRange} onChange={e => setF({ ...f, budgetRange: e.target.value })} className="w-full p-2.5 rounded-sm text-sm" style={input}><option value="">—</option>{BUDGET_RANGES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div><L>Estimates due (end of day)</L><input name="bidDeadline" type="date" value={f.bidDeadline} onChange={e => setF({ ...f, bidDeadline: e.target.value })} className="w-full p-2.5 rounded-sm text-sm" style={input} /></div>
          <div><L>Target start</L><input name="targetStart" type="date" value={f.targetStart} onChange={e => setF({ ...f, targetStart: e.target.value })} className="w-full p-2.5 rounded-sm text-sm" style={input} /></div>
        </div>
        <label className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}><input type="checkbox" name="siteVisit" checked={f.siteVisit} onChange={e => setF({ ...f, siteVisit: e.target.checked })} /> Site visit required before pricing</label>
        <div><L>Client contact — admin only, never shown to contractors</L><input name="clientContact" value={f.clientContact} onChange={e => setF({ ...f, clientContact: e.target.value })} className="w-full p-2.5 rounded-sm text-sm" style={input} /></div>
      </fieldset>
      <div className="flex items-center gap-3">
        {!disabled && <button disabled={busy} className="px-5 py-2 rounded-sm font-bold text-sm inline-flex items-center gap-2" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>{busy && <Loader2 size={14} className="animate-spin" />}{jobId ? 'Save changes' : 'Create draft job'}</button>}
        {msg && <span className="text-sm" style={{ color: msg.ok ? '#059669' : '#ef4444' }} data-testid="job-form-msg">{msg.text}</span>}
      </div>
    </form>
  )
}
