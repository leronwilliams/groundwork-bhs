'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Zap } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
  isLimit?: boolean
  limitType?: 'anon' | 'free'
}

const SUGGESTED_QUESTIONS = [
  { category: 'Permits', q: 'What permits do I need to build in Nassau?' },
  { category: 'Property Tax', q: 'How is real property tax calculated on my home?' },
  { category: 'Legal', q: 'What\'s the process for quiet title in Exuma?' },
  { category: 'Permits', q: 'How do I get planning permission for a commercial build?' },
  { category: 'Construction', q: 'What are the hurricane strapping requirements?' },
  { category: 'Property Tax', q: 'How do I appeal my property tax assessment?' },
  { category: 'Contractors', q: 'What should a contractor agreement include?' },
  { category: 'Permits', q: 'How much does a building permit cost?' },
  { category: 'Finance', q: 'How do I finance a construction project in the Bahamas?' },
  { category: 'Family Islands', q: 'What\'s different about building in the Family Islands?' },
]

const CATEGORY_COLORS: Record<string, string> = {
  Permits: '#dc2626', 'Property Tax': '#c2410c', Legal: '#7c3aed',
  Construction: '#0891b2', Contractors: '#f59e0b', Finance: '#059669', 'Family Islands': '#06b6d4',
}

const ANON_STORAGE_KEY = 'gw_anon_count'

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [inputLocked, setInputLocked] = useState(false)
  const [sessionId] = useState(() => crypto.randomUUID())
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const getAnonCount = () => { try { return parseInt(localStorage.getItem(ANON_STORAGE_KEY) || '0') } catch { return 0 } }
  const incrementAnonCount = () => { try { localStorage.setItem(ANON_STORAGE_KEY, String(getAnonCount() + 1)) } catch {} }

  const send = async (text?: string) => {
    const content = text || input
    if (!content.trim() || loading || inputLocked) return

    const userMsg: Message = { role: 'user', content }
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
        body: JSON.stringify({ messages: newMessages, sessionId, anonCount }),
      })

      // Limit reached
      if (res.status === 402) {
        const data = await res.json()
        setMessages(prev => [...prev, { role: 'system', content: data.message, isLimit: true, limitType: data.limitType }])
        setInputLocked(true)
        setLoading(false)
        return
      }

      if (!res.body) throw new Error('No response body')
      incrementAnonCount()

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''
      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          for (let i = updated.length - 1; i >= 0; i--) {
            if (updated[i].role === 'assistant') { updated[i] = { role: 'assistant', content: accumulated }; break }
          }
          return updated
        })
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  return (
    <div className="min-h-screen pt-20" style={{ background: 'var(--navy)' }}>
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="section-label mb-2">AI · Build Advisor</div>
          <h1 className="text-4xl font-bold mb-3" style={{ fontFamily: 'Syne, sans-serif' }}>Ask the Groundwork Advisor</h1>
          <p style={{ color: 'var(--muted)', maxWidth: 600 }}>
            Deep expertise in Bahamian building codes, permits, property tax, land titles, contractor standards, and Family Island requirements.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" style={{ height: 'calc(100vh - 280px)' }}>
          {/* Suggested questions */}
          <div className="lg:col-span-1 overflow-y-auto">
            <div className="text-xs uppercase tracking-wider mb-4 font-mono" style={{ color: 'var(--muted)' }}>Suggested questions</div>
            <div className="space-y-2">
              {SUGGESTED_QUESTIONS.map((item, i) => {
                const color = CATEGORY_COLORS[item.category] || 'var(--cyan)'
                return (
                  <button key={i} onClick={() => send(item.q)} disabled={loading || inputLocked}
                    className="w-full text-left p-3 rounded-sm text-sm transition-all"
                    style={{ background: 'var(--navy-card)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)', opacity: (loading || inputLocked) ? 0.5 : 1 }}>
                    <span className="text-xs uppercase tracking-wider mr-2 px-1.5 py-0.5 rounded-sm" style={{ background: `${color}20`, color }}>{item.category}</span>
                    {item.q}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-2 flex flex-col" style={{ border: '1px solid var(--cyan-border)', borderRadius: 2, background: 'var(--navy-surface)' }}>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="text-5xl mb-4">🏗️</div>
                  <p className="text-lg font-semibold mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>Ready to help you build right.</p>
                  <p className="text-sm" style={{ color: 'var(--muted)', maxWidth: 400 }}>
                    Ask anything about building in the Bahamas — permits, property tax, land titles, contractors, or Family Island construction.
                  </p>
                </div>
              )}

              {messages.map((msg, i) => {
                // Limit message — inline card
                if (msg.isLimit) {
                  return (
                    <div key={i} className="rounded-sm p-4" style={{ background: 'rgba(0,212,245,0.06)', border: '1px solid var(--cyan-border)', maxWidth: '85%' }}>
                      <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>{msg.content}</p>
                      {msg.limitType === 'anon' ? (
                        <Link href="/sign-up" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm font-bold text-sm" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
                          Create Free Account
                        </Link>
                      ) : (
                        <Link href="/pricing" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm font-bold text-sm" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
                          <Zap size={14} /> Upgrade to Pro — $19/month
                        </Link>
                      )}
                    </div>
                  )
                }
                if (msg.role === 'system') return null

                return (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mr-3 shrink-0 mt-1" style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>GW</div>
                    )}
                    <div className="text-sm px-4 py-3 rounded-sm max-w-[85%] leading-relaxed"
                      style={{ background: msg.role === 'user' ? 'var(--cyan)' : 'var(--navy-card)', color: msg.role === 'user' ? 'var(--navy)' : 'var(--text-primary)', border: msg.role === 'assistant' ? '1px solid var(--cyan-border)' : 'none', whiteSpace: 'pre-wrap' }}>
                      {msg.content || (loading && i === messages.length - 1 ? <span style={{ color: 'var(--muted)' }}>Thinking…</span> : '')}
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-4" style={{ borderTop: '1px solid var(--cyan-border)' }}>
              {inputLocked ? (
                <div className="text-center py-2">
                  <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
                    {messages.find(m => m.limitType === 'free') ? 'Monthly limit reached.' : 'Create a free account to continue.'}
                  </p>
                  <Link href={messages.find(m => m.limitType === 'free') ? '/pricing' : '/sign-up'}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-sm font-bold text-sm"
                    style={{ background: 'var(--cyan)', color: 'var(--navy)' }}>
                    {messages.find(m => m.limitType === 'free') ? <><Zap size={13} /> Upgrade to Pro</> : 'Create Free Account'}
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex gap-3">
                    <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                      placeholder="Ask about building, permits, property tax, land, financing…"
                      className="flex-1 px-4 py-3 text-sm outline-none rounded-sm"
                      style={{ background: 'var(--navy)', border: '1px solid var(--cyan-border)', color: 'var(--text-primary)' }}
                    />
                    <button onClick={() => send()} disabled={loading || !input.trim()}
                      className="px-5 py-3 rounded-sm text-sm font-semibold"
                      style={{ background: 'var(--cyan)', color: 'var(--navy)', opacity: loading || !input.trim() ? 0.5 : 1 }}>
                      {loading ? '...' : 'Send'}
                    </button>
                  </div>
                  <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                    For legal, surveying, or financial decisions, consult a licensed Bahamian professional.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
