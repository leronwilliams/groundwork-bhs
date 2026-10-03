import { NextRequest, NextResponse } from 'next/server'
import { ESTIMATION_SYSTEM_PROMPT } from '@/lib/estimation-prompt'
import { handlePaidStream } from '@/lib/paid-stream'
import { ESTIMATE_TYPES } from '@/lib/payment'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for large plans

export async function POST(req: NextRequest) {
  try {
    return await handlePaidStream(req, {
      route: 'estimate',
      allowedTypes: ESTIMATE_TYPES,
      model: 'claude-sonnet-4-6',
      maxTokens: 4096,
      system: ESTIMATION_SYSTEM_PROMPT,
      defaultType: 'estimate_full',
      instruction: hasPlans => hasPlans
        ? 'Please analyze these architectural plans along with the project brief below and produce a detailed cost estimate.'
        : hasPlans === null
          ? 'Produce a detailed cost estimate based on the following project brief (plans were unavailable):'
          : 'Produce a detailed cost estimate based on the following project brief (no plans provided):',
    })
  } catch (error) {
    console.error('Estimate API error:', error)
    return NextResponse.json({ error: 'Estimation failed. Please try again.' }, { status: 500 })
  }
}
