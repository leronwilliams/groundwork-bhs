'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export function AdvisorWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const pathname = usePathname()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Hide on advisor page
  if (pathname === '/advisor') return null

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!res.body) throw new Error('No response body')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let text = ''
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        text += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: text }
          return updated
        })
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const recentMessages = messages.slice(-3)

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Expanded panel */}
      {open && (
        <div
          className="mb-4 rounded-sm overflow-hidden"
          style={{
            width: 360,
            maxHeight: 480,
            border: '1px solid var(--cyan-border)',
            background: 'var(--navy-surface)',
            boxShadow: '0 0 40px rgba(6,182,212,0.12)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--cyan-border)' }}>
            <div>
              <div className="text-sm font-semibold" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text)' }}>
                Build Advisor
              </div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Ask about building in the Bahamas</div>
            </div>
            <Link
              href="/advisor"
              className="text-xs px-2 py-1 rounded-sm"
              style={{ color: 'var(--cyan)', border: '1px solid var(--cyan-border)' }}
            >
              Full view →
            </Link>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: 200 }}>
            {recentMessages.length === 0 && (
              <p className="text-sm text-center" style={{ color: 'var(--muted)' }}>
                Ask anything about building, permits, or property tax in the Bahamas.
              </p>
            )}
            {recentMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className="text-sm px-3 py-2 rounded-sm max-w-[85%]"
                  style={{
                    background: msg.role === 'user' ? 'var(--cyan)' : 'var(--navy-card)',
                    color: msg.role === 'user' ? 'var(--navy)' : 'var(--text)',
                    border: msg.role === 'assistant' ? '1px solid var(--cyan-border)' : 'none',
                  }}
                >
                  {msg.content || (loading && msg.role === 'assistant' ? '...' : '')}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3" style={{ borderTop: '1px solid var(--cyan-border)' }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder="Ask a question..."
                className="flex-1 text-sm px-3 py-2 rounded-sm outline-none"
                style={{
                  background: 'var(--navy)',
                  border: '1px solid var(--cyan-border)',
                  color: 'var(--text)',
                }}
              />
              <button
                onClick={send}
                disabled={loading}
                className="px-3 py-2 rounded-sm text-sm font-semibold transition-opacity"
                style={{ background: 'var(--cyan)', color: 'var(--navy)', opacity: loading ? 0.6 : 1 }}
              >
                →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-14 h-14 rounded-full flex items-center justify-center transition-all"
        style={{
          background: open ? 'var(--navy-surface)' : 'var(--cyan)',
          border: '2px solid var(--cyan)',
          boxShadow: '0 0 20px rgba(6,182,212,0.3)',
          color: open ? 'var(--cyan)' : 'var(--navy)',
        }}
      >
        {/* Blueprint bracket decoration */}
        <span className="absolute top-0 left-0 w-3 h-3 border-t border-l" style={{ borderColor: 'var(--cyan)' }} />
        <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r" style={{ borderColor: 'var(--cyan)' }} />
        <span className="text-xl">{open ? '×' : '💬'}</span>
      </button>
    </div>
  )
}
