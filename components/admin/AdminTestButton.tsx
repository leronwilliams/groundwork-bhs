'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  serviceType: string
  label?: string
  className?: string
}

export function AdminTestButton({ serviceType, label, className = '' }: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleTest() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/test-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceType, label: label || `Admin test: ${serviceType}` }),
      })
      const data = await res.json()
      if (!res.ok) { alert('Error: ' + data.error); return }
      router.push(data.deliveryUrl)
    } catch (err) {
      alert('Failed: ' + String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleTest}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-sm font-bold text-xs ${className}`}
      style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', opacity: loading ? 0.7 : 1 }}
    >
      {loading ? '⏳ Creating...' : '🔧 Test as Admin (no charge)'}
    </button>
  )
}
