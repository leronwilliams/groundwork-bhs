import Link from 'next/link'
import { requireAdmin } from '@/lib/admin-auth'
import { JobForm, emptyJob } from '../JobForm'

export default async function NewJob() {
  await requireAdmin()
  return (
    <div className="max-w-4xl">
      <div className="section-label mb-1"><Link href="/admin/builders-circle/jobs">← Jobs</Link></div>
      <h1 className="font-black mb-2" style={{ color: 'var(--text-primary)', fontSize: '1.75rem' }}>Post a job</h1>
      <p className="text-sm mb-6">Jobs are saved as drafts. Add drawings, then publish to notify verified members whose trades match. Island: Grand Bahama.</p>
      <JobForm initial={emptyJob} />
    </div>
  )
}
