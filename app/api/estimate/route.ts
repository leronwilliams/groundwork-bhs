import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/db'
import { ESTIMATION_SYSTEM_PROMPT } from '@/lib/estimation-prompt'
import { readPdfAsBase64 } from '@/lib/blob-read'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for large plans

export async function POST(req: NextRequest) {
  try {
    let userId: string | null = null
    try { const { auth } = await import('@clerk/nextjs/server'); const a = await auth(); userId = a.userId } catch {}
    const { fileUrl, brief, orderId, serviceType } = await req.json()

    if (!brief) {
      return NextResponse.json({ error: 'Project brief is required' }, { status: 400 })
    }

    // Build the user prompt from the brief
    const briefText = `
PROJECT BRIEF:
- Island: ${brief.island || 'Nassau, New Providence'}
- Project Type: ${brief.projectType || 'New Build'}
- Total Area: ${brief.area || 'Unknown'} sqft
- Floors: ${brief.floors || 1}
- Finish Level: ${brief.finishLevel || 'Standard'}
- Trades Required: ${Array.isArray(brief.trades) && brief.trades.length > 0 ? brief.trades.join(', ') : 'All trades'}
- Special Requirements: ${brief.notes || 'None'}
- Service Type: ${serviceType || 'estimate_full'}
${fileUrl ? `- Plans uploaded: ${fileUrl}` : '- No plans uploaded (estimate based on brief only)'}
`

    const messages: Anthropic.MessageParam[] = []

    // If we have a file URL, fetch the PDF and include it as a document
    if (fileUrl) {
      try {
        const pdfBase64 = await readPdfAsBase64(fileUrl)
        if (pdfBase64) {
          messages.push({
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: pdfBase64,
                },
              } as unknown as Anthropic.TextBlockParam,
              {
                type: 'text',
                text: `Please analyze these architectural plans along with the project brief below and produce a detailed cost estimate.\n\n${briefText}`,
              },
            ],
          })
        } else {
          messages.push({ role: 'user', content: `Produce a detailed cost estimate based on the following project brief (plans were unavailable):\n\n${briefText}` })
        }
      } catch {
        messages.push({ role: 'user', content: `Produce a detailed cost estimate based on the following project brief:\n\n${briefText}` })
      }
    } else {
      messages.push({ role: 'user', content: `Produce a detailed cost estimate based on the following project brief (no plans provided):\n\n${briefText}` })
    }

    // Stream response from claude-opus-4-6
    const readable = new ReadableStream({
      async start(controller) {
        let fullResult = ''

        try {
          const stream = await anthropic.messages.stream({
            model: 'claude-opus-4-6',
            max_tokens: 4096,
            system: ESTIMATION_SYSTEM_PROMPT,
            messages,
          })

          for await (const chunk of stream) {
            if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
              const text = chunk.delta.text
              fullResult += text
              controller.enqueue(new TextEncoder().encode(text))
            }
          }
        } finally {
          controller.close()
        }

        // Post-stream: save result to DB and mark order delivered
        if (fullResult) {
          try {
            // Find user by clerkId
            let dbUser = null
            if (userId) {
              dbUser = await prisma.user.findFirst({ where: { clerkId: userId } })
            }

            // Find or create order
            let order = orderId ? await prisma.order.findUnique({ where: { id: orderId } }) : null
            if (!order && dbUser) {
              order = await prisma.order.findFirst({
                where: { userId: dbUser.id, type: { in: ['estimate_single', 'estimate_full', 'boq', 'boq_hardware', 'boq_quotes'] }, status: { in: ['paid', 'processing'] } },
                orderBy: { createdAt: 'desc' },
              })
            }

            if (order) {
              // Save estimate result
              await prisma.estimateResult.upsert({
                where: { orderId: order.id },
                update: { result: fullResult, resultType: serviceType || 'estimate_full', fileUrl: fileUrl || null, brief },
                create: {
                  orderId: order.id,
                  userId: dbUser?.id || 'guest',
                  result: fullResult,
                  resultType: serviceType || 'estimate_full',
                  fileUrl: fileUrl || null,
                  brief,
                },
              })

              // Mark order as delivered
              await prisma.order.update({
                where: { id: order.id },
                data: { status: 'delivered' },
              })
            }
          } catch (dbErr) {
            console.error('DB save error:', dbErr)
          }
        }
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
        'X-Model': 'claude-opus-4-6',
      },
    })
  } catch (error) {
    console.error('Estimate API error:', error)
    return NextResponse.json({ error: 'Estimation failed' }, { status: 500 })
  }
}
