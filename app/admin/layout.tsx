import { requireAdmin } from '@/lib/admin-auth'
import { AdminNav } from '@/components/admin/AdminNav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  return (
    <div className="flex" style={{ minHeight: '100vh', background: 'var(--navy)' }}>
      <AdminNav />
      <main style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
