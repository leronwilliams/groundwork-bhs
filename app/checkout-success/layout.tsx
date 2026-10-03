import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta('/checkout-success', 'Payment Received', 'Your Groundwork order is confirmed.', { noindex: true })

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
