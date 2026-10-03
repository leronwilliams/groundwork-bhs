/**
 * Groundwork BHS — AI Takeoff Engine
 * Claude Sonnet takeoff + GPT-4o cross-validation + formula engine
 *
 * Claude Sonnet: native PDF analysis + QS expertise (required: if it fails,
 *   the takeoff fails with AIUnavailableError; no silent formula substitution)
 * GPT-4o: optional cross-check; if it fails the result is labelled as
 *   single-AI, never "dual AI"
 * GPT-4o: independent dimension-based validation (formula cross-check with AI reasoning)
 * Formula engine: Bahamian construction standards as ground truth baseline
 * 
 * Result reconciliation:
 * - Within 10% variance → HIGH confidence, use weighted average
 * - 10-25% variance → MEDIUM confidence, flag for review
 * - >25% variance → LOW confidence, QS review recommended
 */

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { readPdfAsBase64 } from '@/lib/blob-read'
import { runFormulaEngine, applyIslandPremium, FINISH_MULTIPLIERS } from './formulas'
import type { ProjectDimensions } from './formulas'
import type { DrawingAssessment } from './drawing-assessment'
import { getPrices } from './prices'
import { ITEM_CATALOG, TRADE_DISPLAY } from './catalog'
import { AIUnavailableError } from '@/lib/ai-errors'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface LineItem {
  itemCode: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  confidence: 'high' | 'medium' | 'low'
  confidencePct: number
  source: 'measured_from_drawing' | 'calculated_from_area' | 'industry_standard_ratio' | 'formula_engine'
  notes: string
  trade: string
}

export interface TradeSection {
  trade: string
  items: LineItem[]
  subtotalLow: number
  subtotalHigh: number
}

export interface DualTakeoffResult {
  trades: TradeSection[]
  allItems: LineItem[]
  summary: {
    materialsCostLow: number
    materialsCostHigh: number
    labourEstimateLow: number
    labourEstimateHigh: number
    permitFees: number
    contingency: number
    grandTotalLow: number
    grandTotalHigh: number
    islandPremium: string
  }
  /** Which AI layers actually succeeded for this result. */
  aiStatus: { claude: boolean; gpt: boolean; dualAI: boolean; label: string }
  confidence: {
    highPct: number
    mediumPct: number
    lowPct: number
    overallScore: number
  }
}

const CLAUDE_TAKEOFF_PROMPT = (dims: ProjectDimensions, assessment: DrawingAssessment) => `You are a licensed quantity surveyor analyzing architectural drawings for a Bahamian construction project.

TASK: Perform a detailed quantity takeoff from these drawings.

PROJECT DIMENSIONS (confirmed by client):
- Total floor area: ${dims.totalFloorArea} sqft
- Number of floors: ${dims.numberOfFloors}
- Wall height: ${dims.wallHeight} ft
- Foundation type: ${dims.foundationType}
- Roof type: ${dims.roofType}
- Doors: ${dims.numberOfDoors} | Windows: ${dims.numberOfWindows} | Sliding doors: ${dims.numberOfSlidingDoors}
- Bedrooms: ${dims.numberOfBedrooms} | Bathrooms: ${dims.numberOfBathrooms}
- Island: ${dims.island}
- Finish level: ${dims.finishLevel}
- Special: ${dims.specialRequirements || 'None'}

DRAWING QUALITY SCORE: ${assessment.qualityScore}/5
DRAWING NOTES: ${assessment.rawAnalysis || 'No drawing analysis available'}

Output a JSON array of takeoff sections. Each section is one trade:
[
  {
    "trade": "foundation",
    "items": [
      {
        "itemCode": "concrete_block_8",
        "description": "Concrete blocks 8 inch hollow",
        "quantity": 4200,
        "unit": "each",
        "confidence": "high",
        "source": "calculated_from_area",
        "notes": "Calculated from wall area: perimeter × height minus openings, 12.5 blocks/sqm + 5% waste"
      }
    ]
  }
]

TRADE LIST (use exactly these trade names):
foundation, structure, roofing, plumbing, electrical, painting, tiling, joinery, landscaping

ITEM CODES to use (match exactly; unit in brackets):
${Object.entries(ITEM_CATALOG).map(([code, c]) => `${code} [${c.unit}]`).join(', ')}

KEY CONVENTIONS:
- Slab, footings, bond beams and cell fill are ready_mix_concrete (yd³); cement_94lb is only for block mortar and render
- roofing_sheet_26g: 10ft sheet covers ~25 sqft after laps
- plumbing_fittings_set is one SET per wet area (each bathroom + kitchen + laundry), not individual fittings
- concrete_block_6 is for interior partitions

RULES:
- Only output the JSON array, no prose before or after
- Add 5% waste to all materials minimum
- Conservative estimates — underestimating costs a homeowner money
- Confidence "high" = directly calculated from dimensions, "medium" = estimated from ratios, "low" = rule of thumb
- Source: "measured_from_drawing" only if drawing quality ≥ 4 and item directly measurable
- Bahamian construction standards throughout`

const GPT_VALIDATION_PROMPT = (dims: ProjectDimensions, assessment: DrawingAssessment, claudeResult: string) => `You are an independent quantity surveyor providing a second opinion on a Bahamian construction BOQ.

The following quantities were calculated by another QS for a ${dims.totalFloorArea} sqft, ${dims.numberOfFloors}-storey home in ${dims.island}, ${dims.finishLevel} finish.

ORIGINAL QS OUTPUT:
${claudeResult}

PROJECT DIMENSIONS:
- Floor area: ${dims.totalFloorArea} sqft | Floors: ${dims.numberOfFloors}
- Wall height: ${dims.wallHeight}ft | Roof: ${dims.roofType}
- Doors: ${dims.numberOfDoors} | Windows: ${dims.numberOfWindows} | Sliding: ${dims.numberOfSlidingDoors}
- Bathrooms: ${dims.numberOfBathrooms} | Bedrooms: ${dims.numberOfBedrooms}

YOUR TASK: Independently verify or challenge each quantity. Use your own calculations.
Apply Bahamian construction standards: 12.5 blocks/sqm; structural concrete as ready-mix yd³; cement bags only for mortar (1 per ~33 blocks) and render (1 per ~70 sqft); 26g roofing sheet ≈25 sqft effective; plumbing fittings are one set per wet area.

Output a JSON array in the same format as the input. Where you agree: use same quantity. 
Where you differ by >10%: use your calculated quantity and explain in notes.
Where you think an item was missed: add it.

Output ONLY the JSON array.`

/**
 * Cross-validate Claude vs GPT-4o vs formula engine.
 * Returns reconciled quantities with confidence scores.
 */
function crossValidate(
  claudeQty: Record<string, number>,
  gptQty: Record<string, number>,
  formulaQty: Record<string, number>
): { quantities: Record<string, { qty: number; confidence: 'high' | 'medium' | 'low'; pct: number }> } {
  const allKeys = new Set([...Object.keys(claudeQty), ...Object.keys(gptQty), ...Object.keys(formulaQty)])
  const result: Record<string, { qty: number; confidence: 'high' | 'medium' | 'low'; pct: number }> = {}

  allKeys.forEach(key => {
    const claude = claudeQty[key]
    const gpt = gptQty[key]
    const formula = formulaQty[key]

    const values = [claude, gpt, formula].filter(v => v !== undefined && v > 0)
    if (values.length === 0) return

    const avg = values.reduce((a, b) => a + b, 0) / values.length
    const maxDiff = Math.max(...values) - Math.min(...values)
    const variance = values.length > 1 ? maxDiff / avg : 0

    let confidence: 'high' | 'medium' | 'low'
    let pct: number

    if (variance <= 0.10) {
      confidence = 'high'; pct = 92
    } else if (variance <= 0.25) {
      confidence = 'medium'; pct = 75
    } else {
      confidence = 'low'; pct = 55
    }

    // Use weighted average: formula = 40%, Claude = 35%, GPT = 25%
    let finalQty = 0
    let totalWeight = 0
    if (formula !== undefined) { finalQty += formula * 0.40; totalWeight += 0.40 }
    if (claude !== undefined) { finalQty += claude * 0.35; totalWeight += 0.35 }
    if (gpt !== undefined) { finalQty += gpt * 0.25; totalWeight += 0.25 }
    finalQty = Math.ceil(finalQty / totalWeight)

    result[key] = { qty: finalQty, confidence, pct }
  })

  return { quantities: result }
}

/**
 * Full dual AI takeoff with formula cross-validation.
 */
export async function runDualTakeoff(
  fileUrl: string | null,
  dims: ProjectDimensions,
  assessment: DrawingAssessment
): Promise<DualTakeoffResult> {
  // Fetch PDF for Claude if available
  let pdfBase64: string | null = null
  if (fileUrl && assessment.qualityScore >= 3) {
    try {
      pdfBase64 = await readPdfAsBase64(fileUrl)
    } catch {}
  }

  // Run formula engine first (always available)
  const formulaResult = runFormulaEngine(dims)
  const formulaQty: Record<string, number> = { ...formulaResult.quantities }

  // Run Claude takeoff (required)
  const claudePrompt = CLAUDE_TAKEOFF_PROMPT(dims, assessment)
  const claudeQty: Record<string, number> = {}
  let claudeRawOutput = ''

  const claudeContent: Anthropic.MessageParam['content'] = []
  if (pdfBase64) {
    claudeContent.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } } as unknown as Anthropic.TextBlockParam)
  }
  claudeContent.push({ type: 'text', text: claudePrompt })

  let claudeResp: Anthropic.Message
  try {
    claudeResp = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: claudeContent }],
    })
  } catch (err) {
    throw new AIUnavailableError('Claude takeoff failed', err)
  }
  try {
    const claudeText = claudeResp.content[0]?.type === 'text' ? claudeResp.content[0].text : ''
    claudeRawOutput = claudeText
    const jsonMatch = claudeText.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const sections = JSON.parse(jsonMatch[0]) as { trade: string; items: { itemCode: string; quantity: number }[] }[]
      sections.forEach(s => (s.items || []).forEach(i => { if (typeof i.quantity === 'number') claudeQty[i.itemCode] = i.quantity }))
    }
  } catch (err) {
    console.error('Claude takeoff parse error:', (err as Error)?.message)
  }
  if (Object.keys(claudeQty).length === 0) {
    throw new AIUnavailableError('Claude takeoff returned no usable quantities')
  }

  // Run GPT-4o validation (optional cross-check)
  let gptQty: Record<string, number> = {}
  let gptOk = false
  if (process.env.OPENAI_API_KEY) {
    try {
      const gptResp = await openai.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 3000,
        messages: [
          { role: 'system', content: 'You are a licensed Bahamian quantity surveyor. Output only valid JSON arrays.' },
          { role: 'user', content: GPT_VALIDATION_PROMPT(dims, assessment, claudeRawOutput.slice(0, 2000)) },
        ],
      })
      const gptText = gptResp.choices[0]?.message?.content || ''
      const jsonMatch = gptText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const sections = JSON.parse(jsonMatch[0]) as { trade: string; items: { itemCode: string; quantity: number }[] }[]
        sections.forEach(s => (s.items || []).forEach(i => { if (typeof i.quantity === 'number') gptQty[i.itemCode] = i.quantity }))
      }
      gptOk = Object.keys(gptQty).length > 0
    } catch (err) {
      console.error('GPT-4o validation error:', (err as Error)?.message)
    }
  }
  if (!gptOk) gptQty = {}

  // Cross-validate
  const { quantities: validated } = crossValidate(claudeQty, gptQty, formulaQty)

  // Get prices
  const prices = await getPrices()
  const finishMult = FINISH_MULTIPLIERS[dims.finishLevel] || 1.0

  // Build line items by trade
  const tradeMap: Record<string, LineItem[]> = {}
  
  Object.entries(validated).forEach(([itemCode, { qty, confidence, pct }]) => {
    const trade = ITEM_CATALOG[itemCode]?.trade || 'other'
    if (!tradeMap[trade]) tradeMap[trade] = []

    const basePrice = (prices[itemCode] || 0) * finishMult
    const total = basePrice * qty

    tradeMap[trade].push({
      itemCode,
      description: getItemDescription(itemCode),
      quantity: qty,
      unit: getUnit(itemCode),
      unitPrice: basePrice,
      totalPrice: total,
      confidence,
      confidencePct: pct,
      source: pdfBase64 && assessment.qualityScore >= 4 ? 'measured_from_drawing' : 'calculated_from_area',
      notes: '',
      trade,
    })
  })

  // Build trade sections
  const trades: TradeSection[] = Object.entries(tradeMap)
    .filter(([trade]) => trade !== 'other')
    .map(([trade, items]) => {
      const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0)
      return {
        trade,
        tradeLabel: TRADE_DISPLAY[trade] || trade,
        items,
        subtotalLow: Math.round(subtotal * 0.95),
        subtotalHigh: Math.round(subtotal * 1.10),
      } as TradeSection & { tradeLabel: string }
    })

  // Apply island premium
  const rawMaterialsLow = trades.reduce((s, t) => s + t.subtotalLow, 0)
  const rawMaterialsHigh = trades.reduce((s, t) => s + t.subtotalHigh, 0)
  const materialsCostLow = Math.round(applyIslandPremium(rawMaterialsLow, dims.island))
  const materialsCostHigh = Math.round(applyIslandPremium(rawMaterialsHigh, dims.island))

  // Labour, general conditions (scaffold, equipment, temp services, insurance)
  // and contractor overhead & profit: 90-110% of materials. On Bahamian GC
  // builds these typically make up roughly half of the construction cost.
  const labourEstimateLow = Math.round(materialsCostLow * 0.90)
  const labourEstimateHigh = Math.round(materialsCostHigh * 1.10)

  // Permit fees (Bahamas: ~1.5% of construction cost)
  const permitFees = Math.round((materialsCostLow + labourEstimateLow) * 0.015)

  // Contingency: 10%
  const subtotalLow = materialsCostLow + labourEstimateLow + permitFees
  const subtotalHigh = materialsCostHigh + labourEstimateHigh + permitFees
  const contingency = Math.round(subtotalLow * 0.10)

  // Confidence breakdown
  const allItems = trades.flatMap(t => t.items)
  const highCount = allItems.filter(i => i.confidence === 'high').length
  const medCount = allItems.filter(i => i.confidence === 'medium').length
  const lowCount = allItems.filter(i => i.confidence === 'low').length
  const total = allItems.length || 1

  return {
    trades,
    allItems,
    summary: {
      materialsCostLow,
      materialsCostHigh,
      labourEstimateLow,
      labourEstimateHigh,
      permitFees,
      contingency,
      grandTotalLow: subtotalLow + contingency,
      grandTotalHigh: subtotalHigh + Math.round(subtotalHigh * 0.10),
      islandPremium: dims.island,
    },
    confidence: {
      highPct: Math.round((highCount / total) * 100),
      mediumPct: Math.round((medCount / total) * 100),
      lowPct: Math.round((lowCount / total) * 100),
      overallScore: Math.round(((highCount * 95 + medCount * 75 + lowCount * 55) / total)),
    },
    aiStatus: {
      claude: true,
      gpt: gptOk,
      dualAI: gptOk,
      label: gptOk
        ? 'Dual AI: Claude takeoff cross-checked by GPT-4o and the formula engine'
        : 'Claude takeoff cross-checked by the formula engine (GPT-4o cross-check unavailable)',
    },
  }
}

function getItemDescription(code: string): string {
  return ITEM_CATALOG[code]?.description || code
}

function getUnit(code: string): string {
  return ITEM_CATALOG[code]?.unit || 'each'
}
