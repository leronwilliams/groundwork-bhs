'use client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Suspense } from 'react'

const SERVICE_LABELS: Record<string, string> = {
  pro: 'Groundwork Pro Subscription',
  builder: 'Groundwork Builder Subscription',
  lead: 'Contractor Lead',
  estimate_single: 'Single Trade Estimate',
  estimate_full: 'Full Project Estimate',
  boq: 'Bill of Quantities',
  boq_hardware: 'BOQ + Hardware Pricing',
  boq_quotes: 'BOQ + Hardware Store Quotes',
  permit_prep: 'Permit Document Preparation',
  contract: 'Contractor Agreement',
  tax_appeal: 'Property Tax Appeal Letter',
}

function SuccessContent() {
  const params = useSearchParams()
  const type = params.get('type') || ''
  const label = SERVICE_LABELS[type] || 'Your Order'
  const isSubscription = type === 'pro' || type === 'builder'

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--navy)' }}>
      <div
        className="max-w-md w-full text-center p-12 rounded-sm"
        style={{ background: 'var(--navy-surface)', border: '1px solid rgba(5,150,105,0.4)' }}
      >
        <div className="flex justify-center mb-6">
          <CheckCircle size={64} style={{ color: '#059669' }} strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl mb-4" style={{ color: '#f0f4ff' }}>Payment Confirmed</h1>
        <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--cyan)' }}>{label}</strong>
        </p>
        <p className="mb-8 text-sm" style={{ color: 'var(--muted)' }}>
          {isSubscription
            ? 'Your subscription is now active. You have full access to all features in your plan.'
            : 'Your order has been received. We will deliver your document within 1–2 business days.'}
        </p>
        <div className="flex flex-col gap-3">
          {!isSubscription && type && type !== 'lead' && (
            <Link
              href={`/order/${type}`}
              className="block py-3 rounded-sm font-bold text-sm"
              style={{ background: 'var(--cyan)', color: 'var(--navy)' }}
            >
              Submit Your Order Details
            </Link>
          )}
          <Link
            href="/dashboard"
            className="block py-3 rounded-sm font-bold text-sm"
            style={{ background: isSubscription ? 'var(--cyan)' : 'transparent', color: isSubscription ? 'var(--navy)' : 'var(--text-secondary)', border: isSubscription ? 'none' : '1px solid var(--cyan-border)' }}
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="block py-3 rounded-sm font-bold text-sm"
            style={{ border: '1px solid var(--cyan-border)', color: 'var(--text-secondary)' }}
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense>
      <SuccessContent />
    </Suspense>
  )
}
