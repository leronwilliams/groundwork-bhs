import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta('/order', 'Complete Your Order', 'Upload your plans and project details to complete your Groundwork order.', { noindex: true })

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
