import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { ADVISOR_SYSTEM_PROMPT } from '@/lib/advisor/system-prompt'
import { prisma } from '@/lib/db'
import { getEmbedding, findSimilarQuestion, cacheAnswer, incrementCacheHit } from '@/lib/embeddings'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FREE_TIER_LIMIT = 5
const ANON_LIMIT = 2

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionId, anonCount } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }

    // ─── USAGE LIMITS ─────────────────────────────────────────────────────
    let userId: string | null = null
    let tier = 'free'
    let dbUser = null

    try {
      const { auth } = await import('@clerk/nextjs/server')
      const a = await auth()
      userId = a.userId
    } catch {}

    if (userId) {
      dbUser = await prisma.user.findFirst({
        where: { clerkId: userId },
        include: { subscription: true },
      })
      tier = dbUser?.subscription?.tier || 'free'
    }

    // Unauthenticated: allow 2 questions
    if (!userId) {
      const count = typeof anonCount === 'number' ? anonCount : 0
      if (count >= ANON_LIMIT) {
        return NextResponse.json({
          limitReached: true,
          limitType: 'anon',
          message: 'Create a free account to continue asking questions.',
          signUpUrl: '/sign-up',
        }, { status: 402 })
      }
    }

    // Free tier: 5 sessions per calendar month
    if (userId && tier === 'free') {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const sessionCount = dbUser ? await prisma.advisorSession.count({
        where: { userId: dbUser.id, createdAt: { gte: startOfMonth } },
      }) : 0

      if (sessionCount >= FREE_TIER_LIMIT) {
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

    // Pro/Builder: no limits, no checks needed

    // ─── EXTRACT QUESTION ──────────────────────────────────────────────────
    const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user')
    const question = lastUserMessage?.content?.trim() || ''

    // ─── SEMANTIC CACHE CHECK ─────────────────────────────────────────────
    if (question && process.env.OPENAI_API_KEY) {
      try {
        const embedding = await getEmbedding(question)
        const cached = await findSimilarQuestion(embedding, 0.92)

        if (cached) {
          await incrementCacheHit(cached.id)
          return new Response(cached.answer, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'X-Cache': 'HIT',
              'X-Cache-Hits': String(cached.hitCount + 1),
            },
          })
        }

        // Cache MISS — call Claude, stream, cache, save session
        const readable = new ReadableStream({
          async start(controller) {
            let fullText = ''
            try {
              const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
                role: m.role as 'user' | 'assistant',
                content: m.content,
              }))
              const stream = await anthropic.messages.stream({
                model: 'claude-sonnet-4-6',
                max_tokens: 2048,
                system: ADVISOR_SYSTEM_PROMPT,
                messages: anthropicMessages,
              })
              for await (const chunk of stream) {
                if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                  const text = chunk.delta.text
                  fullText += text
                  controller.enqueue(new TextEncoder().encode(text))
                }
              }
            } finally {
              controller.close()
            }
            if (fullText && question) {
              try {
                const emb = await getEmbedding(question)
                await cacheAnswer(question, fullText, emb)
              } catch {}
            }
            if (sessionId && fullText) {
              try {
                const updatedMessages = [...messages, { role: 'assistant', content: fullText }]
                await prisma.advisorSession.upsert({
                  where: { id: sessionId },
                  update: { messages: updatedMessages },
                  create: {
                    id: sessionId,
                    userId: dbUser?.id || null,
                    messages: updatedMessages,
                  },
                })
              } catch {}
            }
          },
        })

        return new Response(readable, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Transfer-Encoding': 'chunked',
            'Cache-Control': 'no-cache',
            'X-Cache': 'MISS',
          },
        })
      } catch {
        // Fall through to direct Claude call
      }
    }

    // ─── FALLBACK: Direct Claude call ─────────────────────────────────────
    const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: ADVISOR_SYSTEM_PROMPT,
      messages: anthropicMessages,
    })

    const readable = new ReadableStream({
      async start(controller) {
        let fullText = ''
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            const text = chunk.delta.text
            fullText += text
            controller.enqueue(new TextEncoder().encode(text))
          }
        }
        if (sessionId && fullText) {
          try {
            const updatedMessages = [...messages, { role: 'assistant', content: fullText }]
            await prisma.advisorSession.upsert({
              where: { id: sessionId },
              update: { messages: updatedMessages },
              create: {
                id: sessionId,
                userId: dbUser?.id || null,
                messages: updatedMessages,
              },
            })
          } catch {}
        }
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'X-Cache': 'BYPASS',
      },
    })
  } catch (error) {
    console.error('Advisor API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
