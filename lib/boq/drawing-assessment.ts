/**
 * Groundwork BHS — Drawing Quality Assessment
 * Phase 1.1: Assess uploaded PDF quality before running takeoff
 * 
 * Uses Claude Opus with native PDF support to analyze the drawing.
 * Quality score determines whether we proceed to takeoff or request more info.
 */

import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface DrawingAssessment {
  qualityScore: number          // 1-5
  hasScaleBar: boolean
  hasDimensions: boolean
  hasFloorPlan: boolean
  hasElevations: boolean
  hasSections: boolean
  detectedScale: string | null
  detectedArea: number | null   // sqft if detectable
  warnings: string[]
  recommendation: 'proceed' | 'request_more_info' | 'manual_input_required'
  rawAnalysis: string
}

const ASSESSMENT_PROMPT = `You are a licensed quantity surveyor reviewing architectural drawings for a Bahamian construction project.

TASK: Assess the quality and completeness of these drawings for quantity takeoff purposes.

Analyze and respond with ONLY a valid JSON object in this exact format:
{
  "qualityScore": 3,
  "hasScaleBar": true,
  "hasDimensions": true,
  "hasFloorPlan": true,
  "hasElevations": false,
  "hasSections": false,
  "detectedScale": "1:100",
  "detectedArea": 1500,
  "warnings": ["No elevations provided", "Scale bar partially obscured"],
  "recommendation": "proceed",
  "rawAnalysis": "The drawings show a single-storey floor plan with readable dimension strings. Scale is 1:100. Floor area approximately 1,500 sqft based on dimension strings. Missing elevations limit confidence on wall heights and roof details."
}

QUALITY SCORE GUIDE:
5 — Full construction drawings: floor plan + elevations + sections + dimensions + scale + title block
4 — Good: floor plan + at least one elevation + dimensions + scale
3 — Adequate: floor plan + dimensions + scale (can proceed with medium confidence)
2 — Poor: floor plan only, partial dimensions, no scale (need manual input for key dimensions)
1 — Unusable: sketch, rendering, or image without technical dimensions

RECOMMENDATION:
- Score 4-5: "proceed"
- Score 3: "request_more_info"
- Score 1-2: "manual_input_required"

For detectedArea: measure from dimensions if possible, otherwise null.
If no PDF/image provided: return qualityScore 0, recommendation "manual_input_required".

Return ONLY the JSON object, no prose.`

/**
 * Assess drawing quality using Claude Opus with native PDF support.
 * If no file URL provided, returns manual_input_required.
 */
export async function assessDrawing(fileUrl: string | null): Promise<DrawingAssessment> {
  // No file — manual input required
  if (!fileUrl) {
    return {
      qualityScore: 0,
      hasScaleBar: false,
      hasDimensions: false,
      hasFloorPlan: false,
      hasElevations: false,
      hasSections: false,
      detectedScale: null,
      detectedArea: null,
      warnings: ['No architectural drawings uploaded. BOQ will be calculated from your confirmed dimensions only.'],
      recommendation: 'manual_input_required',
      rawAnalysis: 'No file provided.',
    }
  }

  try {
    // Fetch the PDF
    const pdfResponse = await fetch(fileUrl)
    if (!pdfResponse.ok) throw new Error(`Could not fetch file: ${pdfResponse.status}`)
    
    const pdfBuffer = await pdfResponse.arrayBuffer()
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64')

    const response = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      messages: [{
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
            text: ASSESSMENT_PROMPT,
          },
        ],
      }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}'
    
    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in assessment response')
    
    const parsed = JSON.parse(jsonMatch[0])
    return parsed as DrawingAssessment

  } catch (err) {
    console.error('Drawing assessment error:', err)
    // Graceful fallback — proceed with manual input
    return {
      qualityScore: 2,
      hasScaleBar: false,
      hasDimensions: false,
      hasFloorPlan: true,
      hasElevations: false,
      hasSections: false,
      detectedScale: null,
      detectedArea: null,
      warnings: ['Drawing could not be fully analyzed. Proceeding with confirmed dimensions only.'],
      recommendation: 'request_more_info',
      rawAnalysis: `Assessment error: ${err instanceof Error ? err.message : 'unknown'}`,
    }
  }
}
