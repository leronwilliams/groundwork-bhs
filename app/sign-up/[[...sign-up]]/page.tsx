import type { Metadata } from 'next'
import { SignUp } from '@clerk/nextjs'
import { clerkAppearance } from '@/lib/clerk-appearance'

export const metadata: Metadata = {
  title: 'Create your account',
  description: 'Create a free Groundwork account to post projects, save advisor sessions and leave reviews.',
  robots: { index: false, follow: true },
}

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center pt-28 pb-16 px-4" style={{ background: 'var(--navy)' }}>
      <div className="w-full max-w-md flex flex-col items-center">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Create your free account</h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Post projects, track orders and get more Advisor sessions</p>
        </div>
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" appearance={clerkAppearance} />
      </div>
    </div>
  )
}
