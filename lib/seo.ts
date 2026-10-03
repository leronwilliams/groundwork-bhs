import type { Metadata } from 'next'

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.groundworksbhs.com').replace(/\/$/, '')
export const SITE_NAME = 'Groundwork BHS'
export const DEFAULT_DESCRIPTION =
  'Build right in The Bahamas: permit guides, construction cost estimates and BOQs, duty exemptions, property tax help and contractors across Nassau and the Family Islands.'

/** Per-page metadata with canonical URL, Open Graph and Twitter tags. */
export function pageMeta(path: string, title: string, description: string, opts: { noindex?: boolean; ogType?: 'website' | 'article' } = {}): Metadata {
  const url = path === '/' ? '/' : path.replace(/\/$/, '')
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: SITE_NAME, type: opts.ogType || 'website', locale: 'en_BS' },
    twitter: { card: 'summary_large_image', title, description },
    ...(opts.noindex ? { robots: { index: false, follow: false } } : {}),
  }
}
