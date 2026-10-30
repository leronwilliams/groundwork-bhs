import Link from 'next/link'
import { requireAdmin } from '@/lib/admin-auth'
import { PostForm, emptyPost } from '../PostForm'

export default async function NewPost() {
  await requireAdmin()
  return (
    <div className="max-w-3xl">
      <div className="section-label mb-1"><Link href="/admin/builders-circle/board">Board</Link></div>
      <h1 className="font-black mb-6" style={{ color: 'var(--text-primary)', fontSize: '1.75rem' }}>New post</h1>
      <PostForm initial={emptyPost} />
    </div>
  )
}
