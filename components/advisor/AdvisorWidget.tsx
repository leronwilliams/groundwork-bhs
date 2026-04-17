'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Zap } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  isLimit?: boolean
  limitType?: 'anon' | 'free'
}

const ANON_STORAGE_KEY = 'gw_anon_count'

export function AdvisorWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [inputLocked, setInputLocked] = useState(false)
  const pathname = usePathname()
  const bottomRef = useRef<HTMLDivElement>(null)

  // Track anon question count in localStorage
  const getAnonCount = () => {
    try { return parseInt(localStorage.getItem(ANON_STORAGE_KEY) || '0') } catch { return 0 }
  }
  const incrementAnonCount = () => {
    try { localStorage.setItem(ANON_STORAGE_KEY, String(getAnonCount() + 1)) } catch {}
  }

  const send = async () => {
    if (!input.trim() || loading || inputLocked) return
    const userMsg: Message = { role: 'user', content: input }
    const chatMessages = messages.filter(m => m.role === 'user' || m.role === 'assistant')
    const newMessages = [...chatMessages, userMsg]
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const anonCount = getAnonCount()

    try {
      const res = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, anonCount }),
      })

      // Handle limit responses (402)
      if (res.status === 402) {
        const data = await res.json()
        setMessages(prev => [...prev, {
          role: 'system',
          content: data.message,
          isLimit: true,
          limitType: data.limitType,
        }])
        setInputLocked(true)
        setLoading(false)
        return
      }

      if (!res.body) throw new Error('No response body')

      // Increment anon count on successful send
      incrementAnonCount()

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
          // Find last assistant message
          for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].role === 'assistant') {
              updated[i] = { role: 'assistant', content: text }
              break
            }
          }
          return updated
        })
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const recentMessages = messages.slice(-4)

  if (pathname === '/advisor') return null

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div
          className="mb-4 rounded-sm overflow-hidden"
          style={{ width: 360, maxHeight: 500, border: '1px solid var(--cyan-border)', background: 'var(--navy-surface)', boxShadow: '0 0 40px rgba(0,212,245,0.12)', display: 'flex', flexDirection: 'column' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--cyan-border)' }}>
            <div>
              <div className="text-sm font-bold" style={{ fontFamily: 'Syne, sans-serif', color: 'var(--text-primary)' }}>Build Advisor</div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>Ask about building in the Bahamas</div>
            </div>
            <Link href="/advisor" className="text-xs px-2 py-1 rounded-sm" style={{ color: 'var(--cyan)', border: '1px solid var(--cyan-border)' }}>
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
            {recentMessages.map((msg, i) => {
              if (msg.isLimit) {
                return (
                  <div key={i} className="rounded-sm p-3" style={{ background: 'rgba(0,212,245,0.06)', border: '1px solid var(--cyan-border)' }}>
                    <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{msg.content}</p>
                    {msg.limitType === 'anon' ? (
                      <Link href="/sign-up" className="flex items-center justify-center gap-2 py-2 rounded-sm font-bold text-sm w-full" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
                        Create Free Account
                      </Link>
                    ) : (
                      <Link href="/pricing" className="flex items-center justify-center gap-2 py-2 rounded-sm font-bold text-sm w-full" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
                        <Zap size={13} /> Upgrade to Pro — $19/month
                      </Link>
                    )}
                  </div>
                )
              }
              if (msg.role === 'system') return null
              return (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="text-sm px-3 py-2 rounded-sm max-w-[85%]"
                    style={{ background: msg.role === 'user' ? 'var(--cyan)' : 'var(--navy-card)', color: msg.role === 'user' ? 'var(--navy)' : 'var(--text-primary)', border: msg.role === 'assistant' ? '1px solid var(--cyan-border)' : 'none' }}>
                    {msg.content || (loading && msg.role === 'assistant' ? '▋' : '')}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3" style={{ borderTop: '1px solid var(--cyan-border)' }}>
            {inputLocked ? (
              <p className="text-xs text-center py-1" style={{ color: 'var(--muted)' }}>
                {messages.find(m => m.limitType === 'free') ? 'Limit reached — upgrade to continue.' : 'Sign up to continue.'}
              </p>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && send()}
                  placeholder="Ask a question..."
                  className="flex-1 text-sm px-3 py-2 rounded-sm outline-none"
                  style={{ background: 'var(--navy)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }}
                />
                <button onClick={send} disabled={loading}
                  className="px-3 py-2 rounded-sm text-sm font-semibold"
                  style={{ background: 'var(--cyan)', color: 'var(--navy)', opacity: loading ? 0.6 : 1 }}>
                  →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <button onClick={() => setOpen(o => !o)}
        className="relative w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: open ? 'var(--navy-surface)' : 'var(--cyan)', border: '2px solid var(--cyan)', boxShadow: '0 0 20px rgba(0,212,245,0.3)', color: open ? 'var(--cyan)' : 'var(--navy)' }}>
        <span className="absolute top-0 left-0 w-3 h-3 border-t border-l" style={{ borderColor: 'var(--cyan)' }} />
        <span className="absolute bottom-0 right-0 w-3 h-3 border-b border-r" style={{ borderColor: 'var(--cyan)' }} />
        <span className="text-xl">{open ? '×' : '💬'}</span>
      </button>
    </div>
  )
}
