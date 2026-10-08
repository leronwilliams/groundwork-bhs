'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertCircle, Loader2 } from 'lucide-react'
import { ProfileFields, type ProfileForm } from '@/components/builders-circle/ProfileFields'

export function JoinForm({ initial, hasListing }: { initial: ProfileForm; hasListing: boolean }) {
  const router = useRouter()
  const [form, setForm] = useState<ProfileForm>(initial)
  const [agree, setAgree] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      const res = await fetch('/api/builders-circle/join', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, agree }) })
      const data = await res.json().catch(() => ({}))
      if (res.ok || res.status === 409) { router.push('/builders-circle/documents?welcome=1'); router.refresh(); return }
      setError(data.error || 'Something went wrong.')
    } catch { setError('Network error. Please try again.') } finally { setBusy(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-8" data-testid="join-form">
      {hasListing && <p className="text-sm p-3 rounded-sm" style={{ border: '1px solid var(--cyan-border)' }}>We found your existing Groundwork directory listing and pre-filled it. Your listing stays as it is.</p>}
      <ProfileFields form={form} set={p => setForm(f => ({ ...f, ...p }))} lockBusinessName={hasListing} />
      <label className="flex items-start gap-3 text-sm cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
        <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-1.5" name="agree" />
        <span>I confirm that I am authorised to act for this business, that the documents I upload are genuine, and that I agree to Groundwork BHS checking them with the issuing bodies.</span>
      </label>
      {error && <p className="flex items-center gap-2 text-sm" style={{ color: '#ef4444' }}><AlertCircle size={14} /> {error}</p>}
      <button type="submit" disabled={busy} className="w-full md:w-auto px-8 py-3 rounded-sm font-bold text-sm inline-flex items-center justify-center gap-2" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
        {busy && <Loader2 size={14} className="animate-spin" />} Continue to documents
      </button>
    </form>
  )
}
