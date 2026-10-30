import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Groundwork BHS Builders Circle',
    short_name: 'Groundwork',
    description: 'Grand Bahama construction jobs, tenders and news, with job alerts for Builders Circle members.',
    id: '/builders-circle',
    start_url: '/builders-circle/board?source=app',
    scope: '/',
    display: 'standalone',
    background_color: '#060d1a',
    theme_color: '#060d1a',
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
