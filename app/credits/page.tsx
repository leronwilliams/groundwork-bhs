import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { SITE_IMAGES } from '@/lib/site-images'

export const metadata: Metadata = {
  title: 'Photo Credits — Groundwork',
  description: 'Credits and licences for the photographs used on Groundwork.',
}

const LICENSE_URLS: Record<string, string> = {
  'CC BY 2.0': 'https://creativecommons.org/licenses/by/2.0/',
  'CC BY 3.0': 'https://creativecommons.org/licenses/by/3.0/',
  'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/',
  'CC BY-SA 2.0': 'https://creativecommons.org/licenses/by-sa/2.0/',
  'CC BY-SA 3.0': 'https://creativecommons.org/licenses/by-sa/3.0/',
  'CC BY-SA 4.0': 'https://creativecommons.org/licenses/by-sa/4.0/',
  'CC0 1.0': 'https://creativecommons.org/publicdomain/zero/1.0/',
  'Pexels License': 'https://www.pexels.com/license/',
}

export default function CreditsPage() {
  // One entry per unique photo (a few photos are used in more than one place)
  const seen = new Set<string>()
  const photos = SITE_IMAGES.filter(i => (seen.has(i.sourceUrl) ? false : (seen.add(i.sourceUrl), true)))

  return (
    <div className="min-h-screen pt-28 pb-24 px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-5xl mx-auto">
        <div className="section-label mb-4">Credits</div>
        <h1 className="text-5xl font-bold mb-6" style={{ fontFamily: 'Syne, sans-serif' }}>Photo credits</h1>
        <p className="mb-4 text-lg max-w-3xl" style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
          Every photograph on Groundwork was taken in The Bahamas. They are stock and archive photos of Bahamian
          homes, public buildings and construction, used under the licences below — they are not Groundwork projects.
        </p>
        <p className="mb-12 text-sm max-w-3xl" style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
          Images have been resized for the web only. Photos under CC BY-SA remain available under the same licence.
        </p>

        <ul className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {photos.map(p => (
            <li
              key={p.sourceUrl}
              className="flex gap-4 p-4 rounded-sm"
              style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}
            >
              <div className="relative w-28 h-20 flex-shrink-0 overflow-hidden rounded-sm">
                <Image src={p.src} alt={p.alt} fill sizes="112px" className="object-cover" />
              </div>
              <div className="min-w-0 text-sm" style={{ lineHeight: 1.5 }}>
                <div className="font-semibold" style={{ color: 'var(--text-bright)' }}>{p.title}</div>
                <div style={{ color: 'var(--text-secondary)' }}>{p.place}</div>
                <div className="mt-1" style={{ color: 'var(--muted)' }}>
                  Photo: {p.author} ·{' '}
                  {LICENSE_URLS[p.license] ? (
                    <a href={LICENSE_URLS[p.license]} target="_blank" rel="noopener noreferrer license" className="underline hover:text-white">{p.license}</a>
                  ) : (
                    p.license
                  )}{' '}
                  · <a href={p.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">{p.host}</a>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-12">
          <Link href="/" className="text-sm" style={{ color: 'var(--cyan)' }}>← Back to home</Link>
        </div>
      </div>
    </div>
  )
}
