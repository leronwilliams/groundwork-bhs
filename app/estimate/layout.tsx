import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta('/estimate', 'Your Estimate', 'Your Groundwork estimate.', { noindex: true })

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
