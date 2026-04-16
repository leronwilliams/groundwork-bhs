export default function PrivacyPage() {
  return (
    <div className="min-h-screen pt-24 pb-20 px-6" style={{ background: 'var(--navy)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="section-label mb-4">Legal</div>
        <h1 className="mb-2">Privacy Policy</h1>
        <p className="mb-12 text-sm font-mono" style={{ color: 'var(--muted)' }}>Last updated: April 2026</p>

        <div className="prose-groundwork space-y-8" style={{ color: 'var(--text-secondary)' }}>
          <section>
            <h2>1. Information We Collect</h2>
            <p>We collect information you provide when creating an account (name, email via Clerk), information from project briefs and advisor conversations, and standard usage analytics (page views, session duration).</p>
          </section>
          <section>
            <h2>2. How We Use Your Information</h2>
            <p>Your information is used to provide and improve the Service, generate cost estimates and BOQs, match you with contractors, process payments, and respond to support requests. AI advisor conversations may be stored to improve response quality through semantic caching.</p>
          </section>
          <section>
            <h2>3. Data Storage</h2>
            <p>Your data is stored on Neon (PostgreSQL) hosted in the United States, and Vercel infrastructure. Payment data is processed and stored by Stripe — we do not store card numbers.</p>
          </section>
          <section>
            <h2>4. Sharing of Information</h2>
            <p>We share your information with contractors only when you purchase a lead or explicitly request contractor matching. We do not sell your data to third parties. We may share data with service providers (Clerk, Stripe, Vercel, Anthropic) necessary to operate the platform.</p>
          </section>
          <section>
            <h2>5. Cookies and Analytics</h2>
            <p>We use session cookies for authentication via Clerk. We may use anonymized analytics to understand how the platform is used. We do not use advertising trackers.</p>
          </section>
          <section>
            <h2>6. Your Rights</h2>
            <p>You may request deletion of your account and associated data at any time by contacting us. Data deletion requests are processed within 30 days.</p>
          </section>
          <section>
            <h2>7. Contact</h2>
            <p>For privacy questions: <a href="mailto:privacy@groundworkbhs.com" style={{ color: 'var(--cyan)' }}>privacy@groundworkbhs.com</a></p>
          </section>
        </div>
      </div>
    </div>
  )
}
