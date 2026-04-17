/**
 * POST /api/boq-v2
 * 
 * 4-Layer BOQ Accuracy Engine:
 * 1. Drawing Assessment (Claude Opus Vision)
 * 2. Dimension Confirmation (from request body)
 * 3. Dual AI Takeoff (Claude + GPT-4o simultaneously)
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

export const runtime = 'nodejs'
export const maxDuration = 300  // 5 minutes for dual AI + PDF

export async function POST(req: NextRequest) {
  try {
    let userId: string | null = null
    try {
      const { auth } = await import('@clerk/nextjs/server')
      userId = (await auth()).userId
    } catch {}

    const { orderId, fileUrl, dimensions, projectName, isFirstTimeHomeowner } = await req.json()

    if (!dimensions) {
      return NextResponse.json({ error: 'dimensions required' }, { status: 400 })
    }

    // ── Step 1: Drawing Assessment ────────────────────────────────────────
    console.log('[BOQ-V2] Starting drawing assessment...')
    const assessment = await assessDrawing(fileUrl || null)

    // If drawing is unusable and no dimensions provided — stop early
    if (assessment.recommendation === 'manual_input_required' && !dimensions.totalFloorArea) {
      return NextResponse.json({
        assessment,
        error: 'Drawing quality too low for automated takeoff. Please provide project dimensions.',
        code: 'DRAWING_QUALITY_TOO_LOW',
      }, { status: 400 })
    }

    // ── Step 2: Dual AI Takeoff + Formula Engine ──────────────────────────
    console.log('[BOQ-V2] Running dual takeoff (Claude + GPT-4o)...')
    const takeoffResult = await runDualTakeoff(fileUrl || null, dimensions, assessment)

    // ── Step 3: Generate PDF Report ───────────────────────────────────────
    console.log('[BOQ-V2] Generating PDF report...')
    const pdfBytes = await generateBOQReport(takeoffResult, dimensions, projectName || 'My Project')

    // ── Step 4: Upload PDF to Vercel Blob ─────────────────────────────────
    let reportUrl = null
    try {
      const blob = await put(
        `boq-reports/${orderId || 'test'}-${Date.now()}.pdf`,
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
            userId: dbUser?.id || 'guest',
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
      modelUsed: {
        takeoff: 'claude-opus-4-6',
        validation: 'gpt-4o',
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
    return NextResponse.json({ error: 'BOQ engine failed', detail: String(error) }, { status: 500 })
  }
}
