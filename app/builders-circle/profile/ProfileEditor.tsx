'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { ProfileFields, type ProfileForm } from '@/components/builders-circle/ProfileFields'

export function ProfileEditor({ initial }: { initial: ProfileForm }) {
  const router = useRouter()
  const [form, setForm] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg(null)
    const res = await fetch('/api/builders-circle/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    setMsg(res.ok ? { ok: true, text: 'Saved.' } : { ok: false, text: data.error || 'Could not save.' })
    if (res.ok) router.refresh()
  }
  return (
    <form onSubmit={save} className="space-y-6">
      <ProfileFields form={form} set={p => setForm(f => ({ ...f, ...p }))} lockBusinessName />
      <p className="text-xs" style={{ color: 'var(--muted)', fontSize: '0.75rem' }}>Business name is locked after applying because your documents are checked against it. Contact us to change it.</p>
      <div className="flex items-center gap-3">
        <button disabled={busy} className="px-6 py-2.5 rounded-sm font-bold text-sm inline-flex items-center gap-2" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>{busy && <Loader2 size={14} className="animate-spin" />} Save profile</button>
        {msg && <span className="text-sm" style={{ color: msg.ok ? 'var(--bc-ok, #059669)' : 'var(--bc-error, #ef4444)' }}>{msg.text}</span>}
      </div>
    </form>
  )
}
