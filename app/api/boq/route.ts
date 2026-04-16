import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/db'
import { BOQ_SYSTEM_PROMPT } from '@/lib/estimation-prompt'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    let userId: string | null = null
    try { const { auth } = await import('@clerk/nextjs/server'); const a = await auth(); userId = a.userId } catch {}
    const { fileUrl, brief, orderId, serviceType } = await req.json()

    const briefText = `
PROJECT BRIEF:
- Island: ${brief.island || 'Nassau, New Providence'}
- Project Type: ${brief.projectType || 'New Build'}
- Total Area: ${brief.area || 'Unknown'} sqft
- Floors: ${brief.floors || 1}
- Finish Level: ${brief.finishLevel || 'Standard'}
- Trades Required: ${Array.isArray(brief.trades) && brief.trades.length > 0 ? brief.trades.join(', ') : 'All trades'}
- Special Requirements: ${brief.notes || 'None'}
${fileUrl ? `- Plans: ${fileUrl}` : '- No plans uploaded'}
`

    const messages: Anthropic.MessageParam[] = []

    if (fileUrl) {
      try {
        const pdfResponse = await fetch(fileUrl)
        if (pdfResponse.ok) {
          const pdfBase64 = Buffer.from(await pdfResponse.arrayBuffer()).toString('base64')
          messages.push({
            role: 'user',
            content: [
              { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } } as unknown as Anthropic.TextBlockParam,
              { type: 'text', text: `Produce a full Bill of Quantities for these plans.\n\n${briefText}` },
            ],
          })
        } else {
          messages.push({ role: 'user', content: `Produce a Bill of Quantities from this brief (plans unavailable):\n\n${briefText}` })
        }
      } catch {
        messages.push({ role: 'user', content: `Produce a Bill of Quantities:\n\n${briefText}` })
      }
    } else {
      messages.push({ role: 'user', content: `Produce a Bill of Quantities based on this brief (no plans):\n\n${briefText}` })
    }

    const readable = new ReadableStream({
      async start(controller) {
        let fullResult = ''
        try {
          const stream = await anthropic.messages.stream({
            model: 'claude-opus-4-6',
            max_tokens: 6000,
            system: BOQ_SYSTEM_PROMPT,
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

        if (fullResult) {
          try {
            let dbUser = null
            if (userId) dbUser = await prisma.user.findFirst({ where: { clerkId: userId } })

            let order = orderId ? await prisma.order.findUnique({ where: { id: orderId } }) : null
            if (!order && dbUser) {
              order = await prisma.order.findFirst({
                where: { userId: dbUser.id, type: { in: ['boq', 'boq_hardware', 'boq_quotes'] }, status: { in: ['paid', 'processing'] } },
                orderBy: { createdAt: 'desc' },
              })
            }

            if (order) {
              await prisma.estimateResult.upsert({
                where: { orderId: order.id },
                update: { result: fullResult, resultType: serviceType || 'boq', fileUrl: fileUrl || null, brief },
                create: { orderId: order.id, userId: dbUser?.id || 'guest', result: fullResult, resultType: serviceType || 'boq', fileUrl: fileUrl || null, brief },
              })
              await prisma.order.update({ where: { id: order.id }, data: { status: 'delivered' } })
            }
          } catch (dbErr) {
            console.error('DB save error:', dbErr)
          }
        }
      },
    })

    return new Response(readable, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Transfer-Encoding': 'chunked', 'Cache-Control': 'no-cache', 'X-Model': 'claude-opus-4-6' },
    })
  } catch (error) {
    console.error('BOQ API error:', error)
    return NextResponse.json({ error: 'BOQ generation failed' }, { status: 500 })
  }
}
