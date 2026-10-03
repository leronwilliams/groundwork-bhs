import type { Metadata, Viewport } from 'next'
import { ClerkProvider } from '@clerk/nextjs'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/ui/Footer'
import { AdvisorWidget } from '@/components/advisor/AdvisorWidget'
import { AdminServicesOverlay } from '@/components/admin/AdminServicesOverlay'
import { ThirdPartyAnalytics } from '@/components/analytics/ThirdPartyAnalytics'
import { SITE_URL, SITE_NAME, DEFAULT_DESCRIPTION } from '@/lib/seo'
import './globals.css'

const DEFAULT_TITLE = 'Groundwork BHS — Build Right in The Bahamas'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: DEFAULT_TITLE, template: `%s | ${SITE_NAME}` },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ['bahamas construction', 'building permits bahamas', 'construction cost nassau', 'bill of quantities bahamas', 'property tax bahamas', 'contractors nassau', 'duty exemption building materials'],
  alternates: { canonical: '/' },
  openGraph: { type: 'website', siteName: SITE_NAME, title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION, url: '/', locale: 'en_BS' },
  twitter: { card: 'summary_large_image', title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
}

export const viewport: Viewport = { themeColor: '#060d1a' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
      <html lang="en">
        <body>
          <Navbar />
          <main style={{ minHeight: '100vh', background: 'var(--navy)' }}>{children}</main>
          <Footer />
          <AdvisorWidget />
          <AdminServicesOverlay />
          <Analytics />
          <SpeedInsights />
          <ThirdPartyAnalytics />
        </body>
      </html>
    </ClerkProvider>
  )
}
