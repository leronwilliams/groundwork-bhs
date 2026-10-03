import type { Metadata } from 'next'
import { SignIn } from '@clerk/nextjs'
import { clerkAppearance } from '@/lib/clerk-appearance'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your Groundwork account.',
  robots: { index: false, follow: true },
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center pt-28 pb-16 px-4" style={{ background: 'var(--navy)' }}>
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Welcome back</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Sign in to your Groundwork account</p>
        </div>
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" appearance={clerkAppearance} />
      </div>
    </div>
  )
}
