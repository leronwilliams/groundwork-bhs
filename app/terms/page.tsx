export default function TermsPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="section-label mb-4">Legal</div>
        <h1 className="mb-2">Terms of Service</h1>
        <p className="mb-12 text-sm font-mono" style={{ color: 'var(--muted)' }}>Last updated: April 2026</p>

        <div className="prose-groundwork space-y-8" style={{ color: 'var(--text-secondary)' }}>
          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>By accessing or using the Groundwork BHS platform (&quot;Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Service.</p>
          </section>
          <section>
            <h2>2. Description of Service</h2>
            <p>Groundwork BHS provides information, tools, and an AI advisor related to construction, real estate, permits, and property ownership in The Bahamas. The Service is for informational purposes only and does not constitute legal, financial, or professional advice.</p>
          </section>
          <section>
            <h2>3. Use of AI Advisor</h2>
            <p>The Groundwork AI Advisor provides general guidance based on publicly available Bahamian laws, regulations, and construction standards. It does not replace the advice of a licensed Bahamian attorney, architect, engineer, or quantity surveyor. Always consult a qualified professional for your specific situation.</p>
          </section>
          <section>
            <h2>4. User Accounts</h2>
            <p>Account registration is provided through Clerk. You are responsible for maintaining the security of your account and all activity that occurs under it.</p>
          </section>
          <section>
            <h2>5. Subscriptions and Payments</h2>
            <p>Paid subscriptions are processed through Stripe. Subscription fees are charged in advance on a monthly basis. Cancellation takes effect at the end of the current billing period. No refunds are issued for partial periods.</p>
          </section>
          <section>
            <h2>6. Intellectual Property</h2>
            <p>All content, design, and functionality of Groundwork BHS is the intellectual property of the platform owners. You may not reproduce, distribute, or create derivative works without written permission.</p>
          </section>
          <section>
            <h2>7. Limitation of Liability</h2>
            <p>Groundwork BHS is provided &quot;as is&quot; without warranty of any kind. We are not liable for any damages arising from your use of, or inability to use, the Service. This includes reliance on AI-generated advice for legal, financial, or construction decisions.</p>
          </section>
          <section>
            <h2>8. Governing Law</h2>
            <p>These Terms are governed by the laws of The Commonwealth of The Bahamas. Disputes shall be resolved in the courts of New Providence, The Bahamas.</p>
          </section>
          <section>
            <h2>9. Contact</h2>
            <p>For questions about these Terms, contact us at: <a href="mailto:legal@groundworkbhs.com" style={{ color: 'var(--cyan)' }}>legal@groundworkbhs.com</a></p>
          </section>
        </div>
      </div>
    </div>
  )
}
