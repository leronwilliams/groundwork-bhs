/**
 * Groundwork BHS — Bahamian Construction Formulas
 * Phase 1.3: Hard-coded, documented, auditable formulas
 * 
 * Every formula here is based on Bahamian construction standards (2024/2025).
 * Sources: Nassau building trades, Bahamian QS practice, Department of Works specs.
 * All quantities include appropriate waste factors.
 */

export interface ProjectDimensions {
  totalFloorArea: number        // sqft
  numberOfFloors: number
  wallHeight: number            // feet (default 9)
  foundationType: 'slab' | 'stem_wall' | 'pile' | 'combined'
  roofType: 'hip' | 'gable' | 'flat' | 'combination'
  roofMaterial: 'galvanize' | 'concrete' | 'tile' | 'metal_standing_seam'
  numberOfDoors: number
  numberOfWindows: number
  numberOfSlidingDoors: number
  numberOfBedrooms: number
  numberOfBathrooms: number
  hasGarage: boolean
  hasPool: boolean
  hasGeneratorRoom: boolean
  hasCoveredPatio: boolean
  patioArea: number
  island: string
  finishLevel: 'basic' | 'standard' | 'premium' | 'luxury'
  specialRequirements: string
}

export interface RebarQuantity {
  fourBar: number    // sticks
  tieWire: number    // lbs
}

export interface RoofingQuantity {
  roofingSheets: number
  roofArea: number
  ridgeCap: number   // linear feet
  screws: number     // individual screws
  screwBoxes: number // 250 per box
}

export interface AggregateQuantity {
  sandYards: number
  gravelYards: number
  fillYards: number
}

export interface PlumbingQuantity {
  pvcPipe4inch: number       // linear feet of 10ft pieces
  cpvcPipeHalfInch: number   // linear feet of 10ft pieces
  fittings: number           // sets (one per wet area)
  fixtures: number           // toilets, sinks, showers per bathroom
}

export interface ElectricalQuantity {
  outlets: number
  circuits: number
  wireRomex14: number     // rolls (50ft each)
  breakerPanel: number
  mainBreaker: '100amp' | '150amp' | '200amp'
}

export interface PaintingQuantity {
  exteriorPaint5Gal: number
  interiorPaint5Gal: number
  primer5Gal: number
}

export interface TilingQuantity {
  floorTiles: number   // sqft
  wallTiles: number    // sqft
  grout: number        // bags
  adhesive: number     // bags
}

// ─── PERIMETER ESTIMATE ──────────────────────────────────────────────────────
/**
 * Estimate building perimeter from floor area.
 * Assumes average aspect ratio of ~1.4:1 (Nassau standard single-storey).
 * For known dimensions, override with actual perimeter.
 */
export function estimatePerimeter(floorArea: number, floors: number = 1): number {
  const footprintPerFloor = floorArea / floors
  // Assume aspect ratio 1.4:1 → length = √(area * 1.4), width = √(area / 1.4)
  const length = Math.sqrt(footprintPerFloor * 1.4)
  const width = Math.sqrt(footprintPerFloor / 1.4)
  return 2 * (length + width)
}

// ─── CONCRETE BLOCKS ─────────────────────────────────────────────────────────
/**
 * Standard 8" hollow block, Bahamas specification.
 * One block covers approximately 0.44 sqft of wall face (8"×16" nominal, ~3% mortar joints).
 * Metric: 12.5 blocks per sqm.
 * Waste factor: 5% for cuts and breakage.
 */
export function calculateBlocks(wallArea: number): number {
  const blocksPerSqM = 12.5
  const wasteFactor = 1.05
  return Math.ceil((wallArea / 10.764) * blocksPerSqM * wasteFactor)
}

// ─── WALL AREA ───────────────────────────────────────────────────────────────
/**
 * Gross wall area minus openings.
 * Standard Bahamian door: 3ft × 7ft = 21 sqft
 * Standard window: 3ft × 4ft = 12 sqft
 * Sliding door: 6ft × 7ft = 42 sqft
 */
export function calculateWallArea(
  perimeter: number,
  height: number,
  doors: number,
  windows: number,
  slidingDoors: number
): number {
  const doorArea = doors * (3 * 7)
  const windowArea = windows * (3 * 4)
  const slidingArea = slidingDoors * (6 * 7)
  return (perimeter * height) - doorArea - windowArea - slidingArea
}

// ─── CONCRETE (READY-MIX) ───────────────────────────────────────────────────
/**
 * Structural concrete is supplied ready-mix in New Providence (and batched on
 * site on most Family Islands); it is priced per cubic yard, not as bags.
 * - Floor slab: 4" thick over the ground-floor footprint, +5% waste
 * - Strip footing: 24" wide × 12" deep under the external perimeter
 * - Tie/bond beam: 8" × 12" over the perimeter, once per floor
 * - Block cell fill: one filled cell every 4 ft (≈0.19 ft³ per ft of height)
 * - Suspended floor slab(s) for multi-storey: 6" thick
 */
export function calculateConcreteYards(slabArea: number, perimeter: number, wallHeight: number, floors: number): number {
  const slab = (slabArea * (4 / 12)) / 27
  const footing = (perimeter * 2 * 1) / 27
  const bondBeam = ((perimeter * (8 / 12) * 1) / 27) * floors
  const cellFill = ((perimeter / 4) * wallHeight * floors * 0.19) / 27
  const suspended = floors > 1 ? ((slabArea * (6 / 12)) / 27) * (floors - 1) : 0
  return Math.ceil((slab + footing + bondBeam + cellFill + suspended) * 1.05)
}

// ─── CEMENT ──────────────────────────────────────────────────────────────────
/**
 * Bagged cement (94 lb) is only for site-mixed mortar and render, because
 * slab/footing/beam concrete is ready-mix (see calculateConcreteYards).
 * - Block mortar: 1 bag per 33 blocks (1:3 mix)
 * - Render/plaster (Bahamian standard both faces): 1 bag per 70 sqft at ~1/2"
 * - +10% waste
 * (The previous formula also bagged the whole slab and footing, roughly
 * doubling cement and double-counting concrete.)
 */
export function calculateCementBags(totalBlocks: number, renderArea: number): number {
  return Math.ceil((totalBlocks / 33 + renderArea / 70) * 1.1)
}

// ─── REBAR ────────────────────────────────────────────────────────────────────
/**
 * Rebar for walls (horizontal + vertical) + foundation mesh.
 * Horizontal: every 2ft of wall height across perimeter
 * Vertical: every 4ft of wall length (hurricane tie requirements)
 * Foundation: mat reinforcement both directions
 */
export function calculateRebar(
  wallPerimeter: number,
  wallHeight: number,
  slabArea: number
): RebarQuantity {
  const horizontalBars = Math.ceil((wallHeight / 2) * (wallPerimeter / 10))
  const verticalBars = Math.ceil(wallPerimeter / 4)
  const foundationBars = Math.ceil(slabArea / 50) * 2
  const totalBars = horizontalBars + verticalBars + foundationBars
  return {
    fourBar: totalBars,
    tieWire: Math.ceil(totalBars * 0.5),
  }
}

// ─── ROOFING ──────────────────────────────────────────────────────────────────
/**
 * Roof area = footprint incl. 18" overhang all round × pitch factor
 * (≈5/12–6/12 pitch: hip 1.15, gable 1.12, combination 1.15, flat 1.02).
 * 26g corrugated galvanise 10 ft sheet: ~32" cover width, ≈25 sqft effective
 * after end/side laps, +8% waste. (The previous 7.5 sqft/sheet coverage plus a
 * 1.4 pitch factor gave roughly 3–4× too many sheets.)
 * Screws: ~0.8 per sqft. Ridge/hip cap: ridge + hips.
 */
export function calculateRoofing(floorArea: number, roofType: string, floors: number = 1): RoofingQuantity {
  const pitchFactors: Record<string, number> = { hip: 1.15, gable: 1.12, flat: 1.02, combination: 1.15 }
  const pitchFactor = pitchFactors[roofType] || 1.15
  const footprint = floorArea / floors
  const length = Math.sqrt(footprint * 1.4)
  const width = Math.sqrt(footprint / 1.4)
  const overhang = 1.5
  const roofArea = (length + 2 * overhang) * (width + 2 * overhang) * pitchFactor
  const sheetCoverage = 25
  const wasteFactor = 1.08
  const sheets = Math.ceil((roofArea / sheetCoverage) * wasteFactor)
  const hipLength = roofType === 'hip' || roofType === 'combination' ? 4 * (width / 2) * 1.5 : 0
  const ridgeCap = Math.ceil(((length - (roofType === 'hip' ? width : 0)) + hipLength) * 1.1)
  const screws = Math.ceil(roofArea * 0.8)
  return {
    roofingSheets: sheets,
    roofArea: Math.round(roofArea),
    ridgeCap: Math.max(ridgeCap, Math.ceil(length)),
    screws,
    screwBoxes: Math.ceil(screws / 250),
  }
}

// ─── AGGREGATES ──────────────────────────────────────────────────────────────
/**
 * Sand: mortar/render sand, ~1 yd³ per 8 bags of cement (1:3 by volume).
 * Gravel: 3" crushed base under the slab (ready-mix includes its own stone).
 * Fill: 6" compacted fill under the slab.
 */
export function calculateAggregates(slabArea: number, cementBags: number): AggregateQuantity {
  return {
    sandYards: Math.ceil(cementBags / 8),
    gravelYards: Math.ceil((slabArea * 0.25) / 27),
    fillYards: Math.ceil((slabArea * 0.5) / 27),
  }
}

// ─── LUMBER (ROOF STRUCTURE) ─────────────────────────────────────────────────
/**
 * Structural lumber for roof framing.
 * Rafter spacing: 24" o.c. (standard Bahamas)
 * Ridge board + hip/valley pieces + purlins
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function calculateLumber(roofArea: number, _roofType: string): { twoByFour: number; twoBy6: number; plywood: number } {
  const rafterSpacing = 2 // ft on center
  // Total rafter run = roof area / spacing (linear ft). Previously this was
  // multiplied by an extra 8 ft rafter length, overstating lumber ~8×.
  const rafterLf = (roofArea / rafterSpacing) * 1.1
  return {
    twoBy6: Math.ceil(rafterLf / 8),               // 2×6 rafters, priced per 8 ft equivalent
    twoByFour: Math.ceil((rafterLf * 0.35) / 8),   // fascia, blocking, collar ties
    plywood: Math.ceil(roofArea / 32 * 1.08),      // 4×8 roof deck sheets, 8% waste
  }
}

// ─── PLUMBING ─────────────────────────────────────────────────────────────────
/**
 * Rough plumbing estimate by bathroom count.
 * Based on Bahamian standard 2-fixture (toilet + sink) and 3-fixture (+ shower) bathrooms.
 */
export function calculatePlumbing(bathrooms: number, finishLevel: string): PlumbingQuantity {
  const pvcPipePerBath = 40     // linear feet 4" pipe (drains)
  const halfInchPerBath = 60    // linear feet CPVC supply
  // Fittings are priced per SET (one wet area's elbows, tees, valves, traps).
  // Previously 25 individual fittings per bath were each charged as a full set.
  const wetAreas = bathrooms + 2 // + kitchen and laundry
  const finishMultiplier = finishLevel === 'premium' ? 1.2 : finishLevel === 'luxury' ? 1.5 : 1.0
  return {
    pvcPipe4inch: Math.ceil((bathrooms * pvcPipePerBath + 60) / 10),       // drains + 60 ft main to septic, 10ft pieces
    cpvcPipeHalfInch: Math.ceil((wetAreas * halfInchPerBath) / 10),      // supply, 10ft pieces
    fittings: Math.ceil(wetAreas * finishMultiplier),
    fixtures: bathrooms,
  }
}

// ─── ELECTRICAL ───────────────────────────────────────────────────────────────
/**
 * Electrical rough estimate by floor area.
 * NEC-based calculations adapted for Bahamian residential code.
 * Minimum 1 outlet per 12 sqft of usable floor area.
 */
export function calculateElectrical(floorArea: number, finishLevel: string): ElectricalQuantity {
  const outletsPerSqFt = 0.015
  const circuitsPer1000SqFt = 6
  const finishMultiplier = finishLevel === 'premium' ? 1.2 : finishLevel === 'luxury' ? 1.4 : 1.0
  const outlets = Math.ceil(floorArea * outletsPerSqFt * finishMultiplier)
  const circuits = Math.ceil((floorArea / 1000) * circuitsPer1000SqFt)
  return {
    outlets,
    circuits,
    wireRomex14: Math.ceil(floorArea * 0.8 / 50),  // rolls (50ft)
    breakerPanel: 1,
    mainBreaker: floorArea > 2000 ? '200amp' : floorArea > 1200 ? '150amp' : '100amp',
  }
}

// ─── PAINTING ─────────────────────────────────────────────────────────────────
/**
 * Paint calculation: exterior + interior, 2 coats minimum.
 * Coverage: 350 sqft per gallon (standard Bahamian masonry paint).
 * Waste factor: 10% for roller loading and touch-ups.
 */
export function calculatePainting(wallArea: number, ceilingArea: number, coats: number = 2): PaintingQuantity {
  const totalArea = wallArea + ceilingArea
  const coveragePerGallon = 350
  const gallons = Math.ceil((totalArea / coveragePerGallon) * coats * 1.1)
  return {
    exteriorPaint5Gal: Math.ceil((gallons * 0.4) / 5),
    interiorPaint5Gal: Math.ceil((gallons * 0.6) / 5),
    primer5Gal: Math.ceil((gallons * 0.3) / 5),
  }
}

// ─── TILING ───────────────────────────────────────────────────────────────────
/**
 * Floor and wall tile quantities.
 * Waste factor: 12% for straight cuts, 15% for diagonal patterns.
 * Wall tile: 80 sqft per bathroom (standard 3-sided shower + splash).
 */
export function calculateTiling(
  floorArea: number,
  bathroomCount: number,
  finishLevel: string
): TilingQuantity {
  const wasteFactor = finishLevel === 'luxury' ? 1.15 : 1.12
  const bathTileArea = bathroomCount * 80
  return {
    floorTiles: Math.ceil(floorArea * wasteFactor),
    wallTiles: Math.ceil(bathTileArea * wasteFactor),
    grout: Math.ceil((floorArea + bathTileArea) / 50),
    adhesive: Math.ceil((floorArea + bathTileArea) / 40),
  }
}

// ─── ISLAND PREMIUM ───────────────────────────────────────────────────────────
/**
 * Family Island transport and logistics premium on materials.
 * Premiums based on barge freight rates and limited local supply.
 * Source: Bahamian contractor surveys 2024.
 */
export function applyIslandPremium(costs: number, island: string): number {
  const normalizedIsland = island.toLowerCase()
  const premiums: Record<string, number> = {
    'new providence': 1.0,
    'nassau': 1.0,
    'grand bahama': 1.12,
    'freeport': 1.12,
    'abaco': 1.28,
    'marsh harbour': 1.28,
    'eleuthera': 1.30,
    'harbour island': 1.32,
    'exuma': 1.32,
    'andros': 1.35,
    'long island': 1.33,
    'bimini': 1.25,
    'cat island': 1.35,
    'san salvador': 1.38,
    'inagua': 1.40,
    'berry islands': 1.30,
  }
  const key = Object.keys(premiums).find(k => normalizedIsland.includes(k))
  return costs * (key ? premiums[key] : 1.30)  // default 30% for unlisted islands
}

// ─── FINISH LEVEL MULTIPLIERS ─────────────────────────────────────────────────
export const FINISH_MULTIPLIERS: Record<string, number> = {
  basic: 0.85,
  standard: 1.0,
  premium: 1.3,
  luxury: 1.75,
}

// ─── MASTER FORMULA ENGINE ────────────────────────────────────────────────────
/**
 * Run all formulas from confirmed dimensions.
 * Returns complete quantity takeoff for all trades.
 * This is the formula baseline — AI output is cross-validated against this.
 */
export function runFormulaEngine(dims: ProjectDimensions) {
  const floors = Math.max(1, dims.numberOfFloors || 1)
  const perimeter = estimatePerimeter(dims.totalFloorArea, floors)
  const bedrooms = Math.max(0, dims.numberOfBedrooms || 0)
  const bathrooms = Math.max(0, dims.numberOfBathrooms || 0)
  const totalDoors = Math.max(0, dims.numberOfDoors || 0)
  // Doors: the wizard asks for a total; at least 2 are exterior, and every
  // bedroom/bathroom plus one closet/utility door needs an interior door.
  const exteriorDoors = Math.min(Math.max(2, Math.ceil(totalDoors * 0.3)), Math.max(totalDoors, 2))
  const interiorDoors = Math.max(totalDoors - exteriorDoors, bedrooms + bathrooms + 1)
  const windows = Math.max(0, dims.numberOfWindows || 0)
  const slidingDoors = Math.max(0, dims.numberOfSlidingDoors || 0)

  const extWallArea = Math.max(0, calculateWallArea(perimeter * floors, dims.wallHeight, exteriorDoors, windows, slidingDoors))
  // Interior block partitions ≈ 60% of the external perimeter per floor, less interior door openings
  const intWallArea = Math.max(0, perimeter * 0.6 * dims.wallHeight * floors - interiorDoors * 21)
  const wallArea = extWallArea
  const slabArea = dims.totalFloorArea / floors  // ground floor slab

  const blocks = calculateBlocks(extWallArea)
  const interiorBlocks = calculateBlocks(intWallArea)
  const renderArea = extWallArea * 2 + intWallArea * 2
  const cement = calculateCementBags(blocks + interiorBlocks, renderArea)
  const concreteYards = calculateConcreteYards(slabArea, perimeter, dims.wallHeight, floors)
  const rebar = calculateRebar(perimeter * floors, dims.wallHeight, slabArea)
  const roofing = calculateRoofing(dims.totalFloorArea, dims.roofType, floors)
  const lumber = calculateLumber(roofing.roofArea, dims.roofType)
  const aggregates = calculateAggregates(slabArea, cement)
  const plumbing = calculatePlumbing(bathrooms, dims.finishLevel)
  const electrical = calculateElectrical(dims.totalFloorArea, dims.finishLevel)
  const ceilingArea = dims.totalFloorArea
  const painting = calculatePainting(extWallArea + intWallArea * 2, ceilingArea)
  const tiling = calculateTiling(dims.totalFloorArea, bathrooms, dims.finishLevel)

  const metalRoof = !dims.roofMaterial || dims.roofMaterial === 'galvanize' || dims.roofMaterial === 'metal_standing_seam'
  const rafters = Math.ceil(roofing.roofArea / 2 / 10) // ~10 ft average rafter

  const quantities: Record<string, number> = {
    // Foundation & structure
    ready_mix_concrete: concreteYards + (dims.roofMaterial === 'concrete' ? Math.ceil((roofing.roofArea * 0.5) / 27) : 0),
    concrete_block_8: blocks,
    concrete_block_6: interiorBlocks,
    cement_94lb: cement,
    sand: aggregates.sandYards,
    gravel: aggregates.gravelYards,
    fill_sand: aggregates.fillYards,
    rebar_4: rebar.fourBar,
    tie_wire: rebar.tieWire,
    // Roofing
    ...(metalRoof ? {
      roofing_sheet_26g: roofing.roofingSheets,
      ridge_cap: roofing.ridgeCap,
      roofing_screw: roofing.screwBoxes,
    } : dims.roofMaterial === 'tile' ? {
      roof_tile_square: Math.ceil((roofing.roofArea / 100) * 1.1),
    } : {}),
    ...(dims.roofMaterial === 'concrete' ? {} : {
      roof_underlayment_square: Math.ceil((roofing.roofArea / 100) * 1.1),
      fascia_soffit_lf: Math.ceil((2 * (Math.sqrt((dims.totalFloorArea / floors) * 1.4) + Math.sqrt((dims.totalFloorArea / floors) / 1.4)) + 12) * 1.05),
      lumber_2x4x8: lumber.twoByFour,
      lumber_2x6x8: lumber.twoBy6,
      plywood_3_4: lumber.plywood,
      hurricane_strap: rafters * 2,
    }),
    // Doors & windows
    window_impact: windows,
    door_exterior: exteriorDoors,
    door_interior: interiorDoors,
    sliding_door_impact: slidingDoors,
    // Plumbing
    pvc_pipe_4inch: plumbing.pvcPipe4inch,
    cpvc_pipe_half: plumbing.cpvcPipeHalfInch,
    plumbing_fittings_set: plumbing.fittings,
    toilet: plumbing.fixtures,
    sink_bathroom: plumbing.fixtures,
    shower_unit: plumbing.fixtures,
    kitchen_sink: 1,
    water_heater: 1,
    septic_system: 1,
    // Electrical
    wire_romex_14: electrical.wireRomex14,
    electrical_outlet: electrical.outlets,
    breaker_panel: electrical.breakerPanel,
    electrical_rough_in: electrical.outlets + Math.ceil(dims.totalFloorArea / 100), // box, switch/cover, conduit & 12/2 per point
    electrical_service: 1,
    light_fixture: Math.ceil(dims.totalFloorArea / 100),
    // Kitchen & finishes
    kitchen_cabinets_lf: dims.totalFloorArea > 2000 ? 26 : 18,
    ceiling_board: Math.ceil((ceilingArea / 32) * 1.1),
    // Painting
    exterior_paint_5gal: painting.exteriorPaint5Gal,
    interior_paint_5gal: painting.interiorPaint5Gal,
    primer_5gal: painting.primer5Gal,
    // Tiling
    floor_tile_sqft: tiling.floorTiles,
    wall_tile_sqft: tiling.wallTiles,
    tile_grout: tiling.grout,
    tile_adhesive: tiling.adhesive,
  }

  return {
    perimeter: Math.round(perimeter),
    wallArea: Math.round(wallArea),
    slabArea: Math.round(slabArea),
    blocks,
    interiorBlocks,
    cement,
    concreteYards,
    rebar,
    roofing,
    lumber,
    aggregates,
    plumbing,
    electrical,
    painting,
    tiling,
    openings: { exteriorDoors, interiorDoors, windows, slidingDoors },
    quantities,
  }
}
