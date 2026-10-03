/**
 * Shared handler for the streaming paid generators (/api/estimate, /api/boq).
 * Verifies payment server-side, rate limits, opens the Claude stream before
 * responding (so provider failures become a clear 503 instead of an empty
 * 200), streams the text, then saves the result and records the run.
 */
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/db'
import { readPdfAsBase64 } from '@/lib/blob-read'
import { rateLimit } from '@/lib/rate-limit'
import { verifyPaidAccess, recordAiRun } from '@/lib/payment'
import { aiUnavailableResponse } from '@/lib/ai-errors'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

type Brief = { island?: string; projectType?: string; area?: string | number; floors?: string | number; finishLevel?: string; trades?: string[]; notes?: string }

function s(v: unknown, max = 300): string {
  return String(v ?? '').slice(0, max)
}

export async function handlePaidStream(req: NextRequest, cfg: {
  route: string
  allowedTypes: string[]
  model: string
  maxTokens: number
  system: string
  defaultType: string
  instruction: (hasPlans: boolean | null) => string
}) {
  const limited = rateLimit(req, cfg.route, 6)
  if (limited) return limited

  let userId: string | null = null
  try { const { auth } = await import('@clerk/nextjs/server'); userId = (await auth()).userId } catch {}

  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  const { fileUrl, orderId, sessionId } = body as { fileUrl?: string; orderId?: string; sessionId?: string }
  const brief: Brief = body.brief || {}
  if (!body.brief) return NextResponse.json({ error: 'Project brief is required' }, { status: 400 })

  const access = await verifyPaidAccess({
    sessionId: sessionId || null,
    orderId: orderId && orderId !== 'new' ? orderId : null,
    clerkUserId: userId,
    allowedTypes: cfg.allowedTypes,
  })
  if (!access.ok) return NextResponse.json({ error: access.error, code: access.code }, { status: access.status })

  const serviceType = access.type || cfg.defaultType // the paid type, never the client's choice
  const trades = Array.isArray(brief.trades) && brief.trades.length > 0 ? brief.trades.slice(0, 20).map(t => s(t, 60)).join(', ') : 'All trades'
  const briefText = `
PROJECT BRIEF:
- Island: ${s(brief.island) || 'Nassau, New Providence'}
- Project Type: ${s(brief.projectType) || 'New Build'}
- Total Area: ${s(brief.area, 20) || 'Unknown'} sqft
- Floors: ${s(brief.floors, 5) || 1}
- Finish Level: ${s(brief.finishLevel, 40) || 'Standard'}
- Trades Required: ${trades}
- Special Requirements: ${s(brief.notes, 2000) || 'None'}
- Service Type: ${serviceType}
${fileUrl ? '- Plans uploaded (attached)' : '- No plans uploaded (estimate based on brief only)'}
`

  const messages: Anthropic.MessageParam[] = []
  let pdfBase64: string | null = null
  if (fileUrl && typeof fileUrl === 'string') {
    try { pdfBase64 = await readPdfAsBase64(fileUrl) } catch {}
  }
  if (pdfBase64) {
    messages.push({
      role: 'user',
      content: [
        { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } } as unknown as Anthropic.TextBlockParam,
        { type: 'text', text: `${cfg.instruction(true)}\n\n${briefText}` },
      ],
    })
  } else {
    messages.push({ role: 'user', content: `${cfg.instruction(fileUrl ? null : false)}\n\n${briefText}` })
  }

  let stream: AsyncIterable<Anthropic.RawMessageStreamEvent>
  try {
    stream = await anthropic.messages.create({
      model: cfg.model,
      max_tokens: cfg.maxTokens,
      system: cfg.system,
      messages,
      stream: true,
    })
  } catch (err) {
    return aiUnavailableResponse(cfg.route, err)
  }

  const readable = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder()
      let fullResult = ''
      let failed = false
      try {
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            fullResult += chunk.delta.text
            controller.enqueue(enc.encode(chunk.delta.text))
          }
        }
      } catch (err) {
        failed = true
        console.error(`[${cfg.route}] stream interrupted`, (err as Error)?.message)
        controller.enqueue(enc.encode('\n\n[Generation was interrupted before it finished. This attempt does not count against your purchase; please generate again.]'))
      } finally {
        controller.close()
      }
      if (failed || !fullResult) return

      await recordAiRun(access)
      if (access.orderId) {
        try {
          await prisma.estimateResult.upsert({
            where: { orderId: access.orderId },
            update: { result: fullResult, resultType: serviceType, fileUrl: fileUrl || null, brief: JSON.parse(JSON.stringify(brief)) },
            create: {
              orderId: access.orderId,
              userId: access.orderUserId || 'guest',
              result: fullResult,
              resultType: serviceType,
              fileUrl: fileUrl || null,
              brief: JSON.parse(JSON.stringify(brief)),
            },
          })
          await prisma.order.update({ where: { id: access.orderId }, data: { status: 'delivered' } })
        } catch (dbErr) {
          console.error(`[${cfg.route}] DB save error:`, dbErr)
        }
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'X-Model': cfg.model,
    },
  })
}
