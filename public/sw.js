/* Groundwork BHS service worker: Web Push job alerts only (no offline caching, no fetch interception). */
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()))

self.addEventListener('push', (event) => {
  let d = {}
  try { d = event.data ? event.data.json() : {} } catch (_) { d = { body: event.data ? event.data.text() : '' } }
  const title = d.title || 'Groundwork Builders Circle'
  event.waitUntil(
    self.registration.showNotification(title, {
      body: d.body || 'There is something new on the board.',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-96.png',
      tag: d.tag || 'builders-circle',
      renotify: true, // alert again (sound/vibration) even if replacing an earlier one with the same tag
      vibrate: [250, 120, 250, 120, 400], // Android honours this; iOS ignores it
      data: { url: d.url || '/builders-circle/board' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = new URL((event.notification.data && event.notification.data.url) || '/builders-circle/board', self.location.origin).href
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    for (const c of all) {
      if (new URL(c.url).origin === self.location.origin && 'focus' in c) { await c.focus(); if ('navigate' in c) { try { await c.navigate(url) } catch (_) {} } return }
    }
    await self.clients.openWindow(url)
  })())
})

// The browser rotated or expired the subscription: re-subscribe and tell the server (same-origin, uses the signed-in cookie).
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil((async () => {
    try {
      const old = event.oldSubscription
      const key = old && old.options && old.options.applicationServerKey
      const sub = event.newSubscription || (key ? await self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key }) : null)
      if (!sub) return
      await fetch('/api/builders-circle/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ subscription: sub.toJSON() }) })
    } catch (_) {}
  })())
})
