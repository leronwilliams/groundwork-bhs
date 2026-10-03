/**
 * POST /api/boq-v2
 * 
 * BOQ engine (paid; payment verified server-side):
 * 0. Payment verification + per-IP rate limit
 * 1. Drawing Assessment (Claude Haiku, PDF)
 * 2. Dimension Confirmation (from request body)
 * 3. AI Takeoff (Claude Sonnet, required) + GPT-4o cross-check (optional)
 * 4. Formula Engine Cross-Validation
 * 5. Confidence Scoring + Island Premium
 * 6. PDF Report Generation
 * 7. Store to DB + mark order delivered
 */

import { NextRequest, NextResponse } from 'next/server'
import { assessDrawing } from '@/lib/boq/drawing-assessment'
import { runDualTakeoff } from '@/lib/boq/takeoff-engine'
import { calculateTotalDutySavings } from '@/lib/boq/duty-rates'
import { generateBOQReport } from '@/lib/boq/report-generator'
import { put } from '@vercel/blob'
import { prisma } from '@/lib/db'
import { rateLimit } from '@/lib/rate-limit'
import { verifyPaidAccess, recordAiRun, BOQ_TYPES } from '@/lib/payment'
import { AIUnavailableError, aiUnavailableResponse } from '@/lib/ai-errors'

export const runtime = 'nodejs'
export const maxDuration = 300  // 5 minutes for dual AI + PDF

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, 'boq-v2', 6)
  if (limited) return limited
  try {
    let userId: string | null = null
    try {
      const { auth } = await import('@clerk/nextjs/server')
      userId = (await auth()).userId
    } catch {}

    const body = await req.json().catch(() => null)
    if (!body) return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    const { orderId: clientOrderId, sessionId, fileUrl, dimensions, projectName, isFirstTimeHomeowner } = body

    if (!dimensions) {
      return NextResponse.json({ error: 'dimensions required' }, { status: 400 })
    }

    // ── Step 0: Payment verification ──────────────────────────────────────
    const access = await verifyPaidAccess({
      sessionId: sessionId || null,
      orderId: clientOrderId || null,
      clerkUserId: userId,
      allowedTypes: BOQ_TYPES,
    })
    if (!access.ok) {
      return NextResponse.json({ error: access.error, code: access.code }, { status: access.status })
    }
    const orderId = access.orderId // only ever the verified order

    // ── Step 1: Drawing Assessment ────────────────────────────────────────
    console.log('[BOQ-V2] Starting drawing assessment...')
    const assessment = await assessDrawing(fileUrl || null)
    if (assessment.aiFailed) {
      return aiUnavailableResponse('boq-v2', new Error('drawing assessment failed'))
    }

    // If drawing is unusable and no dimensions provided — stop early
    if (assessment.recommendation === 'manual_input_required' && !dimensions.totalFloorArea) {
      return NextResponse.json({
        assessment,
        error: 'Drawing quality too low for automated takeoff. Please provide project dimensions.',
        code: 'DRAWING_QUALITY_TOO_LOW',
      }, { status: 400 })
    }

    // ── Step 2: Dual AI Takeoff + Formula Engine ──────────────────────────
    console.log('[BOQ-V2] Running takeoff (Claude + optional GPT-4o)...')
    let takeoffResult
    try {
      takeoffResult = await runDualTakeoff(fileUrl || null, dimensions, assessment)
    } catch (err) {
      if (err instanceof AIUnavailableError) return aiUnavailableResponse('boq-v2', err.cause || err)
      throw err
    }
    await recordAiRun(access)

    // ── Step 3: Generate PDF Report ───────────────────────────────────────
    console.log('[BOQ-V2] Generating PDF report...')
    const pdfBytes = await generateBOQReport(takeoffResult, dimensions, projectName || 'My Project')

    // ── Step 4: Upload PDF to Vercel Blob ─────────────────────────────────
    let reportUrl = null
    try {
      const blob = await put(
        `boq-reports/${orderId || 'session'}-${Date.now()}.pdf`,
        Buffer.from(pdfBytes),
        { access: 'private', token: process.env.BLOB_READ_WRITE_TOKEN }
      )
      reportUrl = blob.url
    } catch (blobErr) {
      console.error('[BOQ-V2] Blob upload error:', blobErr)
    }

    // ── Step 5: Save to DB ────────────────────────────────────────────────
    let dbUser = null
    if (userId) {
      try { dbUser = await prisma.user.findFirst({ where: { clerkId: userId } }) } catch {}
    }

    if (orderId) {
      try {
        await prisma.bOQResultV2.upsert({
          where: { orderId },
          update: {
            fileUrl: fileUrl || null,
            dimensions: JSON.parse(JSON.stringify(dimensions)),
            assessment: JSON.parse(JSON.stringify(assessment)),
            lineItems: JSON.parse(JSON.stringify(takeoffResult.allItems)),
            summary: JSON.parse(JSON.stringify(takeoffResult.summary)),
            reportUrl,
            confidenceHigh: takeoffResult.confidence.highPct,
            confidenceMed: takeoffResult.confidence.mediumPct,
            confidenceLow: takeoffResult.confidence.lowPct,
            totalLow: takeoffResult.summary.grandTotalLow,
            totalHigh: takeoffResult.summary.grandTotalHigh,
          },
          create: {
            orderId,
            userId: dbUser?.id || access.orderUserId || 'guest',
            fileUrl: fileUrl || null,
            dimensions: JSON.parse(JSON.stringify(dimensions)),
            assessment: JSON.parse(JSON.stringify(assessment)),
            lineItems: JSON.parse(JSON.stringify(takeoffResult.allItems)),
            summary: JSON.parse(JSON.stringify(takeoffResult.summary)),
            reportUrl,
            confidenceHigh: takeoffResult.confidence.highPct,
            confidenceMed: takeoffResult.confidence.mediumPct,
            confidenceLow: takeoffResult.confidence.lowPct,
            totalLow: takeoffResult.summary.grandTotalLow,
            totalHigh: takeoffResult.summary.grandTotalHigh,
          },
        })
        await prisma.order.update({ where: { id: orderId }, data: { status: 'delivered' } })
      } catch (dbErr) {
        console.error('[BOQ-V2] DB save error:', dbErr)
      }
    }

    // Calculate duty savings
    const dutySavings = calculateTotalDutySavings(
      takeoffResult.allItems.map(i => ({ itemCode: i.itemCode, quantity: i.quantity, unitPrice: i.unitPrice }))
    )

    console.log('[BOQ-V2] Complete. Confidence:', takeoffResult.confidence)

    return NextResponse.json({
      success: true,
      assessment,
      confidence: takeoffResult.confidence,
      summary: takeoffResult.summary,
      trades: takeoffResult.trades.map(t => ({
        trade: t.trade,
        itemCount: t.items.length,
        subtotalLow: t.subtotalLow,
        subtotalHigh: t.subtotalHigh,
      })),
      lineItems: takeoffResult.allItems,
      reportUrl,
      aiStatus: takeoffResult.aiStatus,
      modelUsed: {
        assessment: fileUrl ? 'claude-haiku-4-5' : null,
        takeoff: 'claude-sonnet-4-6',
        validation: takeoffResult.aiStatus.gpt ? 'gpt-4o' : null,
        formula: 'groundwork-bahamas-v1',
      },
      dutySavings: {
        ...dutySavings,
        isFirstTimeHomeowner: !!isFirstTimeHomeowner,
        message: isFirstTimeHomeowner
          ? `You may save up to $${dutySavings.potentialSaving.toLocaleString()} in customs duty on exempt materials. Apply before importing.`
          : `First-time homeowner? You could save up to $${dutySavings.potentialSaving.toLocaleString()} in customs duty. See /duty-exemptions.`,
      },
    })
  } catch (error) {
    console.error('[BOQ-V2] Error:', error)
    return NextResponse.json({ error: 'The BOQ engine hit an unexpected error. Your purchase is still valid; please try again.' }, { status: 500 })
  }
}
