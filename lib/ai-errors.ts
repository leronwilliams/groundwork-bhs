import { NextResponse } from 'next/server'

export const AI_UNAVAILABLE_MESSAGE =
  'Our AI service is temporarily unavailable, so nothing was generated. ' +
  'Your purchase is still valid; please try again in a few minutes. If this keeps happening, contact support.'

export class AIUnavailableError extends Error {
  constructor(message = 'AI unavailable', public cause?: unknown) {
    super(message)
    this.name = 'AIUnavailableError'
  }
}

/** Log the real provider error server-side; return a friendly 503 to the client. */
export function aiUnavailableResponse(context: string, err: unknown, message = AI_UNAVAILABLE_MESSAGE) {
  const e = err as { status?: number; error?: { error?: { type?: string } }; message?: string }
  console.error(`[${context}] AI provider error`, e?.status, e?.error?.error?.type, e?.message)
  return NextResponse.json({ error: message, code: 'AI_UNAVAILABLE' }, { status: 503 })
}
