import type { Metadata } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Navbar } from '@/components/ui/Navbar'
import { AdvisorWidget } from '@/components/advisor/AdvisorWidget'
import { AdminServicesOverlay } from '@/components/admin/AdminServicesOverlay'
import './globals.css'

export const metadata: Metadata = {
  title: 'Groundwork — Build Right. From the Ground Up.',
  description: 'The complete guide to building, renovating, and owning property in the Bahamas.',
  keywords: 'bahamas construction, building permits bahamas, property tax bahamas, contractors nassau, real estate bahamas',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <Navbar />
          <main style={{ minHeight: '100vh', background: 'var(--navy)' }}>{children}</main>
          <AdvisorWidget />
          <AdminServicesOverlay />
        </body>
      </html>
    </ClerkProvider>
  )
}
