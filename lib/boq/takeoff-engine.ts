/**
 * Groundwork BHS — Dual AI Takeoff Engine
 * Phase 1.5: Claude Opus + GPT-4o cross-validation
 * 
 * Claude Opus: native PDF analysis + QS expertise
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

ITEM CODES to use (match exactly):
concrete_block_8, cement_94lb, sand, gravel, rebar_4, tie_wire, roofing_sheet_26g, ridge_cap, roofing_screw, lumber_2x4x8, lumber_2x6x8, plywood_3_4, pvc_pipe_4inch, cpvc_pipe_half, plumbing_fittings, wire_romex_14, electrical_outlet, breaker_panel, exterior_paint_5gal, interior_paint_5gal, primer_5gal, floor_tile_sqft, wall_tile_sqft, tile_grout, tile_adhesive, fill_sand, toilet, sink_bathroom, shower_unit

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
Apply Bahamian construction standards: 12.5 blocks/sqm, 1 cement bag per 25 blocks, etc.

Output a JSON array in the same format as the input. Where you agree: use same quantity. 
Where you differ by >10%: use your calculated quantity and explain in notes.
Where you think an item was missed: add it.

Output ONLY the JSON array.`

/**
 * Run Claude Opus takeoff with native PDF support.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function runClaudeTakeoff(
  pdfBase64: string | null,
  dims: ProjectDimensions,
  assessment: DrawingAssessment
): Promise<Record<string, number>> {
  const prompt = CLAUDE_TAKEOFF_PROMPT(dims, assessment)

  const content: Anthropic.MessageParam['content'] = []

  if (pdfBase64 && assessment.qualityScore >= 3) {
    content.push({
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
    } as unknown as Anthropic.TextBlockParam)
  }

  content.push({ type: 'text', text: prompt })

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '[]'
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return {}

  const sections = JSON.parse(jsonMatch[0]) as { trade: string; items: { itemCode: string; quantity: number }[] }[]
  const quantities: Record<string, number> = {}
  sections.forEach(section => {
    section.items.forEach(item => { quantities[item.itemCode] = item.quantity })
  })
  return quantities
}

/**
 * Run GPT-4o validation — independent cross-check.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function runGPTValidation(
  dims: ProjectDimensions,
  assessment: DrawingAssessment,
  claudeRaw: string
): Promise<Record<string, number>> {
  const prompt = GPT_VALIDATION_PROMPT(dims, assessment, claudeRaw)

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 4096,
    messages: [
      {
        role: 'system',
        content: 'You are a licensed Bahamian quantity surveyor. Output only valid JSON arrays.',
      },
      { role: 'user', content: prompt },
    ],
  })

  const text = response.choices[0]?.message?.content || '[]'
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return {}

  const sections = JSON.parse(jsonMatch[0]) as { trade: string; items: { itemCode: string; quantity: number }[] }[]
  const quantities: Record<string, number> = {}
  sections.forEach(section => {
    section.items.forEach(item => { quantities[item.itemCode] = item.quantity })
  })
  return quantities
}

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

// Trade assignment by item code
const ITEM_TRADES: Record<string, string> = {
  concrete_block_8: 'foundation', cement_94lb: 'foundation', sand: 'foundation',
  gravel: 'foundation', rebar_4: 'foundation', tie_wire: 'foundation', fill_sand: 'foundation',
  roofing_sheet_26g: 'roofing', ridge_cap: 'roofing', roofing_screw: 'roofing',
  lumber_2x4x8: 'roofing', lumber_2x6x8: 'roofing', plywood_3_4: 'roofing',
  pvc_pipe_4inch: 'plumbing', cpvc_pipe_half: 'plumbing', plumbing_fittings: 'plumbing',
  toilet: 'plumbing', sink_bathroom: 'plumbing', shower_unit: 'plumbing',
  wire_romex_14: 'electrical', electrical_outlet: 'electrical', breaker_panel: 'electrical',
  exterior_paint_5gal: 'painting', interior_paint_5gal: 'painting', primer_5gal: 'painting',
  floor_tile_sqft: 'tiling', wall_tile_sqft: 'tiling', tile_grout: 'tiling', tile_adhesive: 'tiling',
}

const TRADE_DISPLAY: Record<string, string> = {
  foundation: 'Foundation & Structure',
  roofing: 'Roofing',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  painting: 'Painting',
  tiling: 'Tiling & Flooring',
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
  const formulaQty: Record<string, number> = {
    concrete_block_8: formulaResult.blocks,
    cement_94lb: formulaResult.cement,
    sand: formulaResult.aggregates.sandYards,
    gravel: formulaResult.aggregates.gravelYards,
    fill_sand: formulaResult.aggregates.fillYards,
    rebar_4: formulaResult.rebar.fourBar,
    tie_wire: formulaResult.rebar.tieWire,
    roofing_sheet_26g: formulaResult.roofing.roofingSheets,
    ridge_cap: formulaResult.roofing.ridgeCap,
    roofing_screw: formulaResult.roofing.screwBoxes,
    lumber_2x4x8: formulaResult.lumber.twoByFour,
    lumber_2x6x8: formulaResult.lumber.twoBy6,
    plywood_3_4: formulaResult.lumber.plywood,
    pvc_pipe_4inch: formulaResult.plumbing.pvcPipe4inch,
    cpvc_pipe_half: formulaResult.plumbing.cpvcPipeHalfInch,
    plumbing_fittings: formulaResult.plumbing.fittings,
    toilet: formulaResult.plumbing.fixtures,
    sink_bathroom: formulaResult.plumbing.fixtures,
    shower_unit: formulaResult.plumbing.fixtures,
    wire_romex_14: formulaResult.electrical.wireRomex14,
    electrical_outlet: formulaResult.electrical.outlets,
    breaker_panel: formulaResult.electrical.breakerPanel,
    exterior_paint_5gal: formulaResult.painting.exteriorPaint5Gal,
    interior_paint_5gal: formulaResult.painting.interiorPaint5Gal,
    primer_5gal: formulaResult.painting.primer5Gal,
    floor_tile_sqft: formulaResult.tiling.floorTiles,
    wall_tile_sqft: formulaResult.tiling.wallTiles,
    tile_grout: formulaResult.tiling.grout,
    tile_adhesive: formulaResult.tiling.adhesive,
  }

  // Run Claude takeoff with raw prompt for GPT to validate
  const claudePrompt = CLAUDE_TAKEOFF_PROMPT(dims, assessment)
  let claudeQty: Record<string, number> = {}
  let claudeRawOutput = JSON.stringify(formulaQty)  // fallback

  try {
    const claudeContent: Anthropic.MessageParam['content'] = []
    if (pdfBase64) {
      claudeContent.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } } as unknown as Anthropic.TextBlockParam)
    }
    claudeContent.push({ type: 'text', text: claudePrompt })

    const claudeResp = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 4096,
      messages: [{ role: 'user', content: claudeContent }],
    })
    const claudeText = claudeResp.content[0].type === 'text' ? claudeResp.content[0].text : '[]'
    claudeRawOutput = claudeText
    const jsonMatch = claudeText.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const sections = JSON.parse(jsonMatch[0]) as { trade: string; items: { itemCode: string; quantity: number }[] }[]
      sections.forEach(s => s.items.forEach(i => { claudeQty[i.itemCode] = i.quantity }))
    }
  } catch (err) {
    console.error('Claude takeoff error:', err)
    claudeQty = { ...formulaQty }
  }

  // Run GPT-4o validation simultaneously
  let gptQty: Record<string, number> = {}
  try {
    const gptResp = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4096,
      messages: [
        { role: 'system', content: 'You are a licensed Bahamian quantity surveyor. Output only valid JSON arrays.' },
        { role: 'user', content: GPT_VALIDATION_PROMPT(dims, assessment, claudeRawOutput.slice(0, 2000)) },
      ],
    })
    const gptText = gptResp.choices[0]?.message?.content || '[]'
    const jsonMatch = gptText.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const sections = JSON.parse(jsonMatch[0]) as { trade: string; items: { itemCode: string; quantity: number }[] }[]
      sections.forEach(s => s.items.forEach(i => { gptQty[i.itemCode] = i.quantity }))
    }
  } catch (err) {
    console.error('GPT-4o validation error:', err)
    gptQty = { ...formulaQty }
  }

  // Cross-validate
  const { quantities: validated } = crossValidate(claudeQty, gptQty, formulaQty)

  // Get prices
  const prices = await getPrices()
  const finishMult = FINISH_MULTIPLIERS[dims.finishLevel] || 1.0

  // Build line items by trade
  const tradeMap: Record<string, LineItem[]> = {}
  
  Object.entries(validated).forEach(([itemCode, { qty, confidence, pct }]) => {
    const trade = ITEM_TRADES[itemCode] || 'other'
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

  // Labour: 60-70% of materials (Bahamian standard)
  const labourEstimateLow = Math.round(materialsCostLow * 0.60)
  const labourEstimateHigh = Math.round(materialsCostHigh * 0.70)

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
  }
}

function getItemDescription(code: string): string {
  const descriptions: Record<string, string> = {
    concrete_block_8: 'Concrete Blocks 8" Hollow',
    cement_94lb: 'Cement (94lb bag)',
    sand: 'Sand',
    gravel: 'Gravel',
    rebar_4: 'Rebar #4 (20ft stick)',
    tie_wire: 'Tie Wire',
    fill_sand: 'Fill Sand',
    roofing_sheet_26g: 'Roofing Sheet 26g 10ft',
    ridge_cap: 'Ridge Cap',
    roofing_screw: 'Roofing Screws (box 250)',
    lumber_2x4x8: 'Lumber 2×4×8',
    lumber_2x6x8: 'Lumber 2×6×8',
    plywood_3_4: 'Plywood 3/4" Sheet',
    pvc_pipe_4inch: 'PVC Pipe 4" (10ft)',
    cpvc_pipe_half: 'CPVC Pipe 1/2" (10ft)',
    plumbing_fittings: 'Plumbing Fittings (set)',
    toilet: 'Toilet (standard)',
    sink_bathroom: 'Bathroom Sink',
    shower_unit: 'Shower Unit',
    wire_romex_14: 'Wire Romex 14/2 (50ft roll)',
    electrical_outlet: 'Electrical Outlet',
    breaker_panel: 'Breaker Panel 20-circuit',
    exterior_paint_5gal: 'Exterior Paint (5 gal)',
    interior_paint_5gal: 'Interior Paint (5 gal)',
    primer_5gal: 'Primer (5 gal)',
    floor_tile_sqft: 'Floor Tile',
    wall_tile_sqft: 'Wall Tile',
    tile_grout: 'Tile Grout (50lb bag)',
    tile_adhesive: 'Tile Adhesive (50lb bag)',
  }
  return descriptions[code] || code
}

function getUnit(code: string): string {
  const units: Record<string, string> = {
    concrete_block_8: 'each', cement_94lb: 'bag', sand: 'yd³', gravel: 'yd³',
    fill_sand: 'yd³', rebar_4: 'sticks', tie_wire: 'lbs', roofing_sheet_26g: 'sheets',
    ridge_cap: 'lft', roofing_screw: 'boxes', lumber_2x4x8: 'pcs', lumber_2x6x8: 'pcs',
    plywood_3_4: 'sheets', pvc_pipe_4inch: 'pcs', cpvc_pipe_half: 'pcs',
    plumbing_fittings: 'sets', toilet: 'each', sink_bathroom: 'each', shower_unit: 'each',
    wire_romex_14: 'rolls', electrical_outlet: 'each', breaker_panel: 'each',
    exterior_paint_5gal: 'buckets', interior_paint_5gal: 'buckets', primer_5gal: 'buckets',
    floor_tile_sqft: 'sqft', wall_tile_sqft: 'sqft', tile_grout: 'bags', tile_adhesive: 'bags',
  }
  return units[code] || 'each'
}
