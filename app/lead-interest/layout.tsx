import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta('/lead-interest', 'Lead Interest', 'Contractor lead response.', { noindex: true })

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
