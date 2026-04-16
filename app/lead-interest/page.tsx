'use client'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { CheckCircle, AlertCircle, Clock } from 'lucide-react'
import Link from 'next/link'

function LeadInterestContent() {
  const params = useSearchParams()
  const status = params.get('status')
  const error = params.get('error')

  if (error) {
    return (
      <div className="text-center">
        <AlertCircle size={64} style={{ color: 'var(--amber)', margin: '0 auto 24px' }} strokeWidth={1.5} />
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          {error === 'already' ? 'Already Registered' : 'Invalid Link'}
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          {error === 'already'
            ? 'You have already expressed interest in this project. The client has been notified.'
            : 'This link is invalid or has expired. Please contact Groundwork BHS if you received this in an email.'}
        </p>
      </div>
    )
  }

  if (status === 'already') {
    return (
      <div className="text-center">
        <Clock size={64} style={{ color: 'var(--cyan)', margin: '0 auto 24px' }} strokeWidth={1.5} />
        <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Already Submitted</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          You have already expressed interest in this project. The client will contact you if they select you.
        </p>
      </div>
    )
  }

  return (
    <div className="text-center">
      <CheckCircle size={64} style={{ color: '#059669', margin: '0 auto 24px' }} strokeWidth={1.5} />
      <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Interest Recorded</h1>
      <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
        Thank you. The client has been notified and received your contact details. They will reach out to you directly if they wish to proceed.
      </p>
      <p className="text-sm mb-8" style={{ color: 'var(--muted)' }}>
        Want more leads? Join the Groundwork BHS contractor network.
      </p>
      <Link
        href="/"
        className="inline-block px-8 py-3 rounded-sm font-bold text-sm"
        style={{ background: 'var(--cyan)', color: 'var(--navy)' }}
      >
        Learn About Groundwork BHS
      </Link>
    </div>
  )
}

export default function LeadInterestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--navy)' }}>
      <div
        className="max-w-md w-full p-12 rounded-sm"
        style={{ background: 'var(--navy-surface)', border: '1px solid var(--cyan-border)' }}
      >
        <Suspense>
          <LeadInterestContent />
        </Suspense>
      </div>
    </div>
  )
}
