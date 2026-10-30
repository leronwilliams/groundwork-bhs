'use client'
import { useCallback, useEffect, useState } from 'react'
import { Bell, BellOff, Loader2, Smartphone } from 'lucide-react'

type State = 'loading' | 'unavailable' | 'unsupported' | 'ios-install' | 'denied' | 'off' | 'on'

function keyBytes(b64: string) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, c => c.charCodeAt(0))
}

/** "Turn on job alerts" button. Registers /sw.js, asks permission, subscribes to Web Push and saves the device. */
export function JobAlerts({ publicKey, signedIn, canSubscribe = true }: { publicKey: string; signedIn: boolean; canSubscribe?: boolean }) {
  const [state, setState] = useState<State>('loading')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const detect = useCallback(async () => {
    if (!publicKey) return setState('unavailable')
    const ua = navigator.userAgent
    const ios = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    if (!supported) return setState(ios && !standalone ? 'ios-install' : 'unsupported')
    if (Notification.permission === 'denied') return setState('denied')
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      const sub = await reg.pushManager.getSubscription()
      setState(sub && Notification.permission === 'granted' ? 'on' : 'off')
    } catch { setState('unsupported') }
  }, [publicKey])

  useEffect(() => { detect() }, [detect])

  async function enable() {
    setBusy(true); setMsg(null)
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setState(perm === 'denied' ? 'denied' : 'off'); setMsg({ ok: false, text: 'Alerts were not allowed. You can allow them in your browser or phone settings.' }); return }
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready
      let sub = await reg.pushManager.getSubscription()
      if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) })
      const res = await fetch('/api/builders-circle/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ subscription: sub.toJSON() }) })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { await sub.unsubscribe().catch(() => {}); setMsg({ ok: false, text: d.error || 'Could not save this device.' }); return }
      setState('on'); setMsg({ ok: true, text: 'Job alerts are on for this device.' })
    } catch (e) {
      setMsg({ ok: false, text: `Could not turn on alerts: ${(e as Error).message || 'unknown error'}` })
    } finally { setBusy(false) }
  }

  async function disable() {
    setBusy(true); setMsg(null)
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js') || await navigator.serviceWorker.getRegistration()
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await fetch('/api/builders-circle/push/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) })
        await sub.unsubscribe()
      }
      setState('off'); setMsg({ ok: true, text: 'Job alerts are off for this device.' })
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }) } finally { setBusy(false) }
  }

  async function test() {
    setBusy(true); setMsg(null)
    const res = await fetch('/api/builders-circle/push/test', { method: 'POST' })
    const d = await res.json().catch(() => ({}))
    setBusy(false)
    setMsg(res.ok ? { ok: true, text: d.sent ? 'Test alert sent. It should arrive in a few seconds.' : 'The alert could not be delivered. Try turning alerts off and on again.' } : { ok: false, text: d.error || 'Test failed' })
  }

  const btn = 'px-5 py-2.5 rounded-sm font-bold text-sm inline-flex items-center gap-2 disabled:opacity-60'
  return (
    <div data-testid="job-alerts" data-state={state}>
      {state === 'loading' && <p className="text-sm" style={{ color: 'var(--muted)' }}>Checking your device…</p>}
      {state === 'unavailable' && <p className="text-sm" style={{ color: 'var(--muted)' }}>Job alerts are not switched on for this site yet.</p>}
      {!signedIn && state !== 'loading' && state !== 'unavailable' && <a href="/sign-in?redirect_url=/builders-circle/alerts" className={btn} style={{ background: '#ea580c', color: '#fff' }}><Bell size={16} /> Sign in to turn on job alerts</a>}
      {signedIn && !canSubscribe && state !== 'loading' && <p className="text-sm" style={{ color: 'var(--muted)' }}>Join the Builders Circle to get job alerts.</p>}
      {signedIn && canSubscribe && state === 'off' && <button onClick={enable} disabled={busy} className={btn} style={{ background: '#ea580c', color: '#fff' }} data-testid="alerts-enable">{busy ? <Loader2 size={16} className="animate-spin" /> : <Bell size={16} />} Turn on job alerts</button>}
      {signedIn && canSubscribe && state === 'on' && (
        <div className="flex gap-3 flex-wrap items-center">
          <span className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: '#059669' }}><Bell size={16} /> Job alerts are on for this device</span>
          <button onClick={test} disabled={busy} className={btn} style={{ border: '1px solid #d1d5db', color: '#111' }} data-testid="alerts-test">Send me a test alert</button>
          <button onClick={disable} disabled={busy} className={btn} style={{ color: '#6b7280' }} data-testid="alerts-disable"><BellOff size={16} /> Turn off</button>
        </div>
      )}
      {signedIn && canSubscribe && state === 'ios-install' && (
        <div className="p-4 rounded-sm text-sm" style={{ background: '#fff7ed', border: '1px solid #fdba74', color: '#7c2d12' }} data-testid="alerts-ios-install">
          <p className="font-bold mb-1 inline-flex items-center gap-2"><Smartphone size={16} /> One more step on iPhone</p>
          <p>iPhone only allows alerts from an app on your Home Screen. Tap the Share button in Safari, choose <strong>Add to Home Screen</strong>, then open Groundwork from your Home Screen and tap this button again. Needs iOS 16.4 or newer.</p>
        </div>
      )}
      {signedIn && canSubscribe && state === 'denied' && <p className="text-sm" style={{ color: '#b45309' }} data-testid="alerts-denied">Alerts are blocked for this site. Allow notifications for Groundwork in your browser or phone settings, then come back and tap Turn on job alerts.</p>}
      {signedIn && canSubscribe && state === 'unsupported' && <p className="text-sm" style={{ color: 'var(--muted)' }} data-testid="alerts-unsupported">This browser cannot receive job alerts. Try Chrome on Android, or Safari on iPhone with the app added to your Home Screen.</p>}
      {msg && <p className="text-sm mt-3" style={{ color: msg.ok ? '#059669' : '#dc2626' }} data-testid="alerts-msg">{msg.text}</p>}
    </div>
  )
}
