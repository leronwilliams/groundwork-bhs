import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { ADVISOR_SYSTEM_PROMPT } from '@/lib/advisor/system-prompt'
import { prisma } from '@/lib/db'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionId } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages' }), { status: 400 })
    }

    // Build Anthropic message array
    const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }))

    // Stream the response
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: ADVISOR_SYSTEM_PROMPT,
      messages: anthropicMessages,
    })

    // Create a ReadableStream to pipe back
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

        // Save session if sessionId provided
        if (sessionId) {
          try {
            const updatedMessages = [...messages, { role: 'assistant', content: fullText }]
            await prisma.advisorSession.upsert({
              where: { id: sessionId },
              update: { messages: updatedMessages },
              create: { id: sessionId, messages: updatedMessages },
            })
          } catch (err) {
            console.error('Session save error:', err)
          }
        }

        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      },
    })
  } catch (error) {
    console.error('Advisor API error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 })
  }
}
