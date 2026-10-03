import { pageMeta } from '@/lib/seo'

export const metadata = pageMeta('/boq-wizard', 'Bill of Quantities (BOQ) Wizard', 'Upload your plans and get an itemised Bill of Quantities with Nassau material prices, duty savings and a downloadable PDF budget estimate.')

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
