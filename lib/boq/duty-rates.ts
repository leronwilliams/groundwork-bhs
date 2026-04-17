/**
 * Customs duty rates for construction materials — The Bahamas
 * Source: Bahamian Tariff Act (rates approximate, verify with Customs)
 * Updated: 2025
 */

export interface DutyInfo {
  dutyPct: number       // percentage (0-45)
  vatPct: number        // always 10 in Bahamas
  exemptEligible: boolean  // eligible for first-time homeowner exemption
  importedTypically: boolean  // typically imported vs locally sourced
  notes: string
}

export const DUTY_RATES: Record<string, DutyInfo> = {
  concrete_block_8:    { dutyPct: 0,  vatPct: 10, exemptEligible: true,  importedTypically: false, notes: 'Locally manufactured — no duty' },
  cement_94lb:         { dutyPct: 0,  vatPct: 10, exemptEligible: true,  importedTypically: true,  notes: 'Essential material — duty-free' },
  sand:                { dutyPct: 0,  vatPct: 10, exemptEligible: false, importedTypically: false, notes: 'Local resource — no duty' },
  gravel:              { dutyPct: 0,  vatPct: 10, exemptEligible: false, importedTypically: false, notes: 'Local resource — no duty' },
  fill_sand:           { dutyPct: 0,  vatPct: 10, exemptEligible: false, importedTypically: false, notes: 'Local resource — no duty' },
  rebar_4:             { dutyPct: 5,  vatPct: 10, exemptEligible: true,  importedTypically: true,  notes: 'Steel rebar: 0-10% duty, avg 5%' },
  tie_wire:            { dutyPct: 10, vatPct: 10, exemptEligible: true,  importedTypically: true,  notes: 'Imported steel product' },
  roofing_sheet_26g:   { dutyPct: 12, vatPct: 10, exemptEligible: true,  importedTypically: true,  notes: 'Galvanize: 10-15% duty, avg 12%' },
  ridge_cap:           { dutyPct: 12, vatPct: 10, exemptEligible: true,  importedTypically: true,  notes: 'Galvanize accessory: ~12% duty' },
  roofing_screw:       { dutyPct: 10, vatPct: 10, exemptEligible: true,  importedTypically: true,  notes: 'Fasteners: ~10% duty' },
  lumber_2x4x8:        { dutyPct: 10, vatPct: 10, exemptEligible: true,  importedTypically: true,  notes: 'Rough lumber: 10% duty' },
  lumber_2x6x8:        { dutyPct: 10, vatPct: 10, exemptEligible: true,  importedTypically: true,  notes: 'Rough lumber: 10% duty' },
  plywood_3_4:         { dutyPct: 25, vatPct: 10, exemptEligible: true,  importedTypically: true,  notes: 'Finished/processed wood: 25% duty' },
  pvc_pipe_4inch:      { dutyPct: 10, vatPct: 10, exemptEligible: true,  importedTypically: true,  notes: 'PVC plumbing: 10% duty' },
  cpvc_pipe_half:      { dutyPct: 10, vatPct: 10, exemptEligible: true,  importedTypically: true,  notes: 'CPVC supply pipe: 10% duty' },
  plumbing_fittings:   { dutyPct: 10, vatPct: 10, exemptEligible: true,  importedTypically: true,  notes: 'Plumbing fittings: 10% duty' },
  wire_romex_14:       { dutyPct: 15, vatPct: 10, exemptEligible: true,  importedTypically: true,  notes: 'Electrical wire: 10-25%, avg 15%' },
  electrical_outlet:   { dutyPct: 20, vatPct: 10, exemptEligible: true,  importedTypically: true,  notes: 'Electrical fittings: 10-25%, avg 20%' },
  breaker_panel:       { dutyPct: 20, vatPct: 10, exemptEligible: true,  importedTypically: true,  notes: 'Electrical panel: ~20% duty' },
  exterior_paint_5gal: { dutyPct: 30, vatPct: 10, exemptEligible: false, importedTypically: true,  notes: 'Paint: 25-35% duty' },
  interior_paint_5gal: { dutyPct: 30, vatPct: 10, exemptEligible: false, importedTypically: true,  notes: 'Paint: 25-35% duty' },
  primer_5gal:         { dutyPct: 30, vatPct: 10, exemptEligible: false, importedTypically: true,  notes: 'Primer: 25-35% duty' },
  floor_tile_sqft:     { dutyPct: 35, vatPct: 10, exemptEligible: false, importedTypically: true,  notes: 'Ceramic/porcelain tile: 25-45%, avg 35%' },
  wall_tile_sqft:      { dutyPct: 35, vatPct: 10, exemptEligible: false, importedTypically: true,  notes: 'Ceramic/porcelain tile: 25-45%, avg 35%' },
  tile_grout:          { dutyPct: 25, vatPct: 10, exemptEligible: false, importedTypically: true,  notes: 'Tile accessories: ~25% duty' },
  tile_adhesive:       { dutyPct: 25, vatPct: 10, exemptEligible: false, importedTypically: true,  notes: 'Tile adhesive: ~25% duty' },
  toilet:              { dutyPct: 25, vatPct: 10, exemptEligible: false, importedTypically: true,  notes: 'Sanitaryware: ~25% duty' },
  sink_bathroom:       { dutyPct: 25, vatPct: 10, exemptEligible: false, importedTypically: true,  notes: 'Sanitaryware: ~25% duty' },
  shower_unit:         { dutyPct: 25, vatPct: 10, exemptEligible: false, importedTypically: true,  notes: 'Sanitaryware: ~25% duty' },
}

/**
 * Calculate landed cost (Nassau price + duty + VAT for imported items).
 * For locally sourced items, VAT is already included in Nassau price.
 */
export function calculateLandedCost(
  itemCode: string,
  nassauPrice: number,
  isFirstTimeHomeowner: boolean = false
): {
  nassauPrice: number
  dutyAmount: number
  vatAmount: number
  landedCost: number
  dutySaving: number        // saving if exemption applies
  effectiveCost: number    // cost after exemption (if eligible)
} {
  const duty = DUTY_RATES[itemCode]

  // Locally sourced or no duty info: VAT already in Nassau price
  if (!duty || !duty.importedTypically || duty.dutyPct === 0) {
    return {
      nassauPrice,
      dutyAmount: 0,
      vatAmount: 0,
      landedCost: nassauPrice,
      dutySaving: 0,
      effectiveCost: nassauPrice,
    }
  }

  // Imported item: duty + VAT on top of CIF value (approximated from Nassau price)
  // Nassau retail ≈ CIF × (1 + duty + VAT) × margin
  // We reverse-engineer to show the duty component
  const approxCIF = nassauPrice / (1 + duty.dutyPct / 100 + duty.vatPct / 100) / 1.15
  const dutyAmount = Math.round(approxCIF * duty.dutyPct / 100)
  const vatAmount = Math.round(approxCIF * duty.vatPct / 100)

  const dutySaving = (isFirstTimeHomeowner && duty.exemptEligible) ? dutyAmount : 0
  const effectiveCost = nassauPrice - dutySaving

  return { nassauPrice, dutyAmount, vatAmount, landedCost: nassauPrice, dutySaving, effectiveCost }
}

/**
 * Calculate total duty savings for a full BOQ if first-time homeowner exemption applies.
 */
export function calculateTotalDutySavings(
  lineItems: Array<{ itemCode: string; quantity: number; unitPrice: number }>
): { totalDuty: number; exemptibleDuty: number; potentialSaving: number } {
  let totalDuty = 0
  let exemptibleDuty = 0

  lineItems.forEach(item => {
    const duty = DUTY_RATES[item.itemCode]
    if (!duty || !duty.importedTypically || duty.dutyPct === 0) return

    const totalPrice = item.unitPrice * item.quantity
    const approxCIF = totalPrice / (1 + duty.dutyPct / 100 + duty.vatPct / 100) / 1.15
    const dutyAmount = approxCIF * duty.dutyPct / 100

    totalDuty += dutyAmount
    if (duty.exemptEligible) exemptibleDuty += dutyAmount
  })

  return {
    totalDuty: Math.round(totalDuty),
    exemptibleDuty: Math.round(exemptibleDuty),
    potentialSaving: Math.round(exemptibleDuty),
  }
}
