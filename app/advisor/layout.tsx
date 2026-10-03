import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta('/advisor', 'AI Building Advisor for The Bahamas', 'Ask our AI advisor about permits, building codes, costs and contractors in The Bahamas. Two free questions, no sign-up needed.')

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
