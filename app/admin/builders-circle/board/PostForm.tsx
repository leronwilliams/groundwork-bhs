'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { BOARD_LOCATIONS, BOARD_TYPES, TYPE_LABEL } from '@/lib/builders-circle/board-constants'

const input = { background: 'var(--navy)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }
export type PostValues = { type: string; title: string; summary: string; source: string; location: string; closeDate: string; link: string }
export const emptyPost: PostValues = { type: 'news', title: '', summary: '', source: '', location: 'Grand Bahama', closeDate: '', link: '' }

export function PostForm({ postId, initial, status }: { postId?: string; initial: PostValues; status?: string }) {
  const router = useRouter()
  const [f, setF] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const L = ({ children }: { children: React.ReactNode }) => <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>{children}</label>

  async function call(url: string, method: string, body?: unknown) {
    setBusy(true); setMsg(null)
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
    const data = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setMsg({ ok: false, text: data.error || 'Something went wrong' }); return null }
    return data
  }
  async function save(e: React.FormEvent) {
    e.preventDefault()
    const data = await call(postId ? `/api/admin/builders-circle/board/${postId}` : '/api/admin/builders-circle/board', postId ? 'PATCH' : 'POST', f)
    if (!data) return
    if (!postId && data.postId) { router.push(`/admin/builders-circle/board/${data.postId}`); return }
    setMsg({ ok: true, text: 'Saved.' }); router.refresh()
  }
  async function act(action: 'publish' | 'unpublish') {
    const data = await call(`/api/admin/builders-circle/board/${postId}`, 'PATCH', { action })
    if (data) { setMsg({ ok: true, text: action === 'publish' ? 'Published. It is now on the board.' : 'Unpublished (back to draft).' }); router.refresh() }
  }
  async function del() {
    if (!confirm('Delete this draft post?')) return
    const data = await call(`/api/admin/builders-circle/board/${postId}`, 'DELETE')
    if (data) router.push('/admin/builders-circle/board')
  }

  return (
    <form onSubmit={save} className="space-y-4" data-testid="post-form">
      <fieldset disabled={busy} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div><L>Type</L><select name="type" value={f.type} onChange={e => setF({ ...f, type: e.target.value })} className="w-full p-2.5 rounded-sm text-sm" style={input}>{BOARD_TYPES.map(t => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</select></div>
          <div><L>Location</L><select name="location" value={f.location} onChange={e => setF({ ...f, location: e.target.value })} className="w-full p-2.5 rounded-sm text-sm" style={input}>{BOARD_LOCATIONS.map(l => <option key={l}>{l}</option>)}</select></div>
          <div><L>Close date (tenders and jobs)</L><input name="closeDate" type="date" value={f.closeDate} onChange={e => setF({ ...f, closeDate: e.target.value })} className="w-full p-2.5 rounded-sm text-sm" style={input} /></div>
        </div>
        <div><L>Title</L><input name="title" required value={f.title} onChange={e => setF({ ...f, title: e.target.value })} className="w-full p-2.5 rounded-sm text-sm" style={input} /></div>
        <div><L>Summary (shown to members and in the email)</L><textarea name="summary" rows={3} value={f.summary} onChange={e => setF({ ...f, summary: e.target.value })} className="w-full p-2.5 rounded-sm text-sm" style={input} /></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div><L>Agency or source</L><input name="source" value={f.source} onChange={e => setF({ ...f, source: e.target.value })} className="w-full p-2.5 rounded-sm text-sm" style={input} /></div>
          <div><L>Link (https://…)</L><input name="link" value={f.link} onChange={e => setF({ ...f, link: e.target.value })} className="w-full p-2.5 rounded-sm text-sm" style={input} /></div>
        </div>
      </fieldset>
      <div className="flex items-center gap-3 flex-wrap">
        <button disabled={busy} className="px-5 py-2 rounded-sm font-bold text-sm inline-flex items-center gap-2" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>{busy && <Loader2 size={14} className="animate-spin" />}{postId ? 'Save changes' : 'Create draft'}</button>
        {postId && status !== 'published' && <button type="button" disabled={busy} onClick={() => act('publish')} className="px-5 py-2 rounded-sm font-bold text-sm" style={{ background: '#059669', color: '#fff' }} data-testid="publish">Publish</button>}
        {postId && status === 'published' && <button type="button" disabled={busy} onClick={() => act('unpublish')} className="px-5 py-2 rounded-sm font-bold text-sm" style={{ border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }} data-testid="unpublish">Unpublish</button>}
        {postId && status !== 'published' && <button type="button" disabled={busy} onClick={del} className="px-5 py-2 rounded-sm text-sm" style={{ color: '#ef4444' }}>Delete draft</button>}
        {msg && <span className="text-sm" style={{ color: msg.ok ? '#059669' : '#ef4444' }} data-testid="post-form-msg">{msg.text}</span>}
      </div>
    </form>
  )
}
