import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import crypto from 'crypto'
import { ADVISOR_SYSTEM_PROMPT } from '@/lib/advisor/system-prompt'
import { prisma } from '@/lib/db'
import { getEmbedding, findSimilarQuestion, cacheAnswer, incrementCacheHit } from '@/lib/embeddings'
import { rateLimit } from '@/lib/rate-limit'
import { ANON_LIMIT, readAnonCount, anonCookieHeader, anonIpCapExceeded } from '@/lib/advisor-quota'
import { aiUnavailableResponse } from '@/lib/ai-errors'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FREE_TIER_LIMIT = 5
const MAX_MESSAGES = 20
const MAX_MESSAGE_CHARS = 4000
const MAX_TOTAL_CHARS = 20000
const ADVISOR_MODEL = 'claude-sonnet-4-6'
const ADVISOR_MAX_TOKENS = 1500

type ChatMessage = { role: 'user' | 'assistant'; content: string }

function cleanMessages(raw: unknown): ChatMessage[] | string {
  if (!Array.isArray(raw) || raw.length === 0) return 'Invalid messages'
  const trimmed = raw.slice(-MAX_MESSAGES)
  const out: ChatMessage[] = []
  let total = 0
  for (const m of trimmed) {
    const role = (m as { role?: string })?.role
    const content = (m as { content?: unknown })?.content
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string') continue
    const c = content.trim()
    if (!c) continue
    if (c.length > MAX_MESSAGE_CHARS) return `Each message must be under ${MAX_MESSAGE_CHARS} characters.`
    total += c.length
    out.push({ role, content: c })
  }
  if (total > MAX_TOTAL_CHARS) return 'This conversation is too long. Please start a new one.'
  while (out.length && out[0].role !== 'user') out.shift()
  if (!out.length) return 'Invalid messages'
  return out
}

export async function POST(req: NextRequest) {
  try {
    const limited = rateLimit(req, 'advisor', 20)
    if (limited) return limited

    const body = await req.json().catch(() => null)
    const cleaned = cleanMessages(body?.messages)
    if (typeof cleaned === 'string') return NextResponse.json({ error: cleaned }, { status: 400 })
    const messages = cleaned
    const sessionIdIn: string | null = typeof body?.sessionId === 'string' && body.sessionId.length <= 64 ? body.sessionId : null

    // ─── USAGE LIMITS (server-side; client-supplied counts are ignored) ────
    let userId: string | null = null
    let tier = 'free'
    let dbUser: { id: string; subscription: { tier: string; status: string } | null } | null = null

    try {
      const { auth } = await import('@clerk/nextjs/server')
      userId = (await auth()).userId
    } catch {}

    if (userId) {
      dbUser = await prisma.user.findFirst({ where: { clerkId: userId }, include: { subscription: true } })
      const sub = dbUser?.subscription
      tier = sub && sub.status === 'active' ? sub.tier : 'free'
    }

    let setCookie: string | null = null
    if (!userId) {
      const { count, windowStart } = readAnonCount(req)
      if (count >= ANON_LIMIT || anonIpCapExceeded(req)) {
        return NextResponse.json({
          limitReached: true,
          limitType: 'anon',
          message: `You've used your ${ANON_LIMIT} free questions. Create a free account to keep asking (5 sessions a month), or upgrade to Pro for unlimited.`,
          signUpUrl: '/sign-up',
        }, { status: 402 })
      }
      setCookie = anonCookieHeader(count + 1, windowStart)
    }

    // Free tier: 5 sessions per calendar month (a session is always recorded for signed-in users)
    if (userId && tier === 'free') {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      const sessionCount = dbUser ? await prisma.advisorSession.count({
        where: { userId: dbUser.id, createdAt: { gte: startOfMonth } },
      }) : 0
      const isExistingSession = sessionIdIn && dbUser
        ? !!(await prisma.advisorSession.findFirst({ where: { id: sessionIdIn, userId: dbUser.id } }))
        : false
      if (!isExistingSession && sessionCount >= FREE_TIER_LIMIT) {
        return NextResponse.json({
          limitReached: true,
          limitType: 'free',
          sessionsUsed: sessionCount,
          sessionsLimit: FREE_TIER_LIMIT,
          message: `You've used your ${FREE_TIER_LIMIT} free sessions this month. Upgrade to Pro for unlimited access.`,
          upgradeUrl: '/pricing',
        }, { status: 402 })
      }
    }
    const sessionId = sessionIdIn || (dbUser ? crypto.randomUUID() : null)

    const question = [...messages].reverse().find(m => m.role === 'user')?.content || ''
    const baseHeaders: Record<string, string> = { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' }
    if (setCookie) baseHeaders['Set-Cookie'] = setCookie

    // ─── SEMANTIC CACHE CHECK ─────────────────────────────────────────────
    let cacheStatus = 'BYPASS'
    if (question && process.env.OPENAI_API_KEY) {
      try {
        const embedding = await getEmbedding(question)
        const cached = await findSimilarQuestion(embedding, 0.92)
        if (cached) {
          await incrementCacheHit(cached.id)
          return new Response(cached.answer, {
            headers: { ...baseHeaders, 'X-Cache': 'HIT', 'X-Cache-Hits': String(cached.hitCount + 1) },
          })
        }
        cacheStatus = 'MISS'
      } catch {}
    }

    // ─── CLAUDE (open the stream first so provider errors become a 503) ───
    let stream: Awaited<ReturnType<typeof anthropic.messages.create>> & AsyncIterable<Anthropic.RawMessageStreamEvent>
    try {
      stream = await anthropic.messages.create({
        model: ADVISOR_MODEL,
        max_tokens: ADVISOR_MAX_TOKENS,
        system: ADVISOR_SYSTEM_PROMPT,
        messages,
        stream: true,
      }) as typeof stream
    } catch (err) {
      return aiUnavailableResponse('advisor', err,
        'The Advisor is temporarily unavailable, so your question was not used up. Please try again in a few minutes.')
    }

    const readable = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder()
        let fullText = ''
        let failed = false
        try {
          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              fullText += chunk.delta.text
              controller.enqueue(enc.encode(chunk.delta.text))
            }
          }
        } catch (err) {
          failed = true
          console.error('[advisor] stream interrupted', (err as Error)?.message)
          controller.enqueue(enc.encode('\n\n(Sorry, the answer was interrupted. Please ask again.)'))
        } finally {
          controller.close()
        }
        if (!failed && fullText && question) {
          try { await cacheAnswer(question, fullText, await getEmbedding(question)) } catch {}
        }
        if (sessionId && fullText) {
          try {
            const updatedMessages = [...messages, { role: 'assistant', content: fullText }]
            await prisma.advisorSession.upsert({
              where: { id: sessionId },
              update: { messages: updatedMessages },
              create: { id: sessionId, userId: dbUser?.id || null, messages: updatedMessages },
            })
          } catch {}
        }
      },
    })

    return new Response(readable, {
      headers: { ...baseHeaders, 'Transfer-Encoding': 'chunked', 'X-Cache': cacheStatus, ...(sessionId ? { 'X-Session-Id': sessionId } : {}) },
    })
  } catch (error) {
    console.error('Advisor API error:', error)
    return NextResponse.json({ error: 'Something went wrong on our side. Please try again.' }, { status: 500 })
  }
}
