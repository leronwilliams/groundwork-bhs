import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { ADVISOR_SYSTEM_PROMPT } from '@/lib/advisor/system-prompt'
import { prisma } from '@/lib/db'
import { getEmbedding, findSimilarQuestion, cacheAnswer, incrementCacheHit } from '@/lib/embeddings'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionId } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Invalid messages' }, { status: 400 })
    }

    // Extract the latest user question
    const lastUserMessage = [...messages].reverse().find((m: { role: string }) => m.role === 'user')
    const question = lastUserMessage?.content?.trim() || ''

    // ─── SEMANTIC CACHE CHECK ───────────────────────────────────────────────
    if (question && process.env.OPENAI_API_KEY) {
      try {
        const embedding = await getEmbedding(question)
        const cached = await findSimilarQuestion(embedding, 0.92)

        if (cached) {
          // Cache HIT — return immediately, no Claude call
          await incrementCacheHit(cached.id)

          return new Response(cached.answer, {
            headers: {
              'Content-Type': 'text/plain; charset=utf-8',
              'X-Cache': 'HIT',
              'X-Cache-Hits': String(cached.hitCount + 1),
            },
          })
        }

        // Cache MISS — call Claude, stream, then cache result
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

            // Post-stream: cache the answer
            if (fullText && question) {
              try {
                await cacheAnswer(question, fullText, embedding)
              } catch (cacheErr) {
                console.error('Cache write error:', cacheErr)
              }
            }

            // Save session if provided
            if (sessionId && fullText) {
              try {
                const updatedMessages = [...messages, { role: 'assistant', content: fullText }]
                await prisma.advisorSession.upsert({
                  where: { id: sessionId },
                  update: { messages: updatedMessages },
                  create: { id: sessionId, messages: updatedMessages },
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
      } catch (embeddingErr) {
        console.error('Embedding error, falling back to direct Claude:', embeddingErr)
        // Fall through to direct Claude call below
      }
    }

    // ─── FALLBACK: Direct Claude call (no embedding) ─────────────────────────
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
              create: { id: sessionId, messages: updatedMessages },
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
