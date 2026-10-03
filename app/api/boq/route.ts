import { NextRequest, NextResponse } from 'next/server'
import { BOQ_SYSTEM_PROMPT } from '@/lib/estimation-prompt'
import { handlePaidStream } from '@/lib/paid-stream'
import { BOQ_TYPES } from '@/lib/payment'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  try {
    return await handlePaidStream(req, {
      route: 'boq',
      allowedTypes: BOQ_TYPES,
      model: 'claude-sonnet-4-6',
      maxTokens: 6000,
      system: BOQ_SYSTEM_PROMPT,
      defaultType: 'boq',
      instruction: hasPlans => hasPlans
        ? 'Produce a full Bill of Quantities for these plans.'
        : hasPlans === null
          ? 'Produce a Bill of Quantities from this brief (plans unavailable):'
          : 'Produce a Bill of Quantities based on this brief (no plans):',
    })
  } catch (error) {
    console.error('BOQ API error:', error)
    return NextResponse.json({ error: 'BOQ generation failed. Please try again.' }, { status: 500 })
  }
}
