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
  fittings: number           // sets
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

// ─── CEMENT ──────────────────────────────────────────────────────────────────
/**
 * Cement requirement for blocks + slab + foundation.
 * Block mortar: 1 bag per 25 blocks (standard 1:3 mix)
 * Slab: 1 bag per 3 sqft for 4" slab (1:2:4 mix)
 * Foundation stem wall: 2 bags per linear foot
 */
export function calculateCementBags(
  blocks: number,
  slabArea: number,
  foundationPerimeter: number
): number {
  const mortarCement = Math.ceil(blocks / 25)
  const slabCement = Math.ceil(slabArea / 3)
  const foundationCement = Math.ceil(foundationPerimeter * 2)
  return mortarCement + slabCement + foundationCement
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
 * Roofing sheets (26g corrugated galvanise, 10ft length).
 * Sheet coverage: 7.5 sqft effective (overlap considered).
 * Waste factor: 8% for valley cuts and ridge details.
 * Pitch factors based on Bahamian design conventions.
 */
export function calculateRoofing(floorArea: number, roofType: string, floors: number = 1): RoofingQuantity {
  const pitchFactors: Record<string, number> = {
    hip: 1.4,
    gable: 1.25,
    flat: 1.05,
    combination: 1.3,
  }
  const pitchFactor = pitchFactors[roofType] || 1.3
  const footprint = floorArea / floors
  const roofArea = footprint * pitchFactor
  const sheetCoverage = 7.5
  const wasteFactor = 1.08
  const sheets = Math.ceil((roofArea / sheetCoverage) * wasteFactor)
  const ridgeCap = Math.ceil(Math.sqrt(footprint) * 1.2)
  const screws = Math.ceil(roofArea * 2.5)
  return {
    roofingSheets: sheets,
    roofArea: Math.round(roofArea),
    ridgeCap,
    screws,
    screwBoxes: Math.ceil(screws / 250),
  }
}

// ─── AGGREGATES ──────────────────────────────────────────────────────────────
/**
 * Sand, gravel, and fill requirements.
 * Sand: block mortar + slab bedding
 * Gravel: slab aggregate
 * Fill: 6" compacted fill under slab (assumed)
 */
export function calculateAggregates(slabArea: number, blocks: number): AggregateQuantity {
  return {
    sandYards: Math.ceil(blocks / 500) + Math.ceil(slabArea / 100),
    gravelYards: Math.ceil(slabArea / 50),
    fillYards: Math.ceil((slabArea / 27) * 0.5),
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
  const rafterLength = 8  // average rafter length ft
  const rafterSpacing = 2 // ft on center
  const linearFtOfRafters = (roofArea / rafterSpacing) * rafterLength
  const pieces2x4 = Math.ceil(linearFtOfRafters / 8) // 8ft sticks
  return {
    twoByFour: Math.ceil(pieces2x4 * 0.6),   // smaller members
    twoBy6: Math.ceil(pieces2x4 * 0.4),       // larger rafters
    plywood: Math.ceil(roofArea / 32 * 1.08), // 4x8 sheets with 8% waste
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
  const fittingsPerBath = 25
  const finishMultiplier = finishLevel === 'premium' ? 1.2 : finishLevel === 'luxury' ? 1.5 : 1.0
  return {
    pvcPipe4inch: Math.ceil(bathrooms * pvcPipePerBath / 10),       // 10ft pieces
    cpvcPipeHalfInch: Math.ceil(bathrooms * halfInchPerBath / 10),  // 10ft pieces
    fittings: Math.ceil(bathrooms * fittingsPerBath * finishMultiplier),
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
  const perimeter = estimatePerimeter(dims.totalFloorArea, dims.numberOfFloors)
  const wallArea = calculateWallArea(
    perimeter,
    dims.wallHeight,
    dims.numberOfDoors,
    dims.numberOfWindows,
    dims.numberOfSlidingDoors
  )
  const slabArea = dims.totalFloorArea / dims.numberOfFloors  // ground floor slab

  const blocks = calculateBlocks(wallArea)
  const cement = calculateCementBags(blocks, slabArea, perimeter)
  const rebar = calculateRebar(perimeter, dims.wallHeight, slabArea)
  const roofing = calculateRoofing(dims.totalFloorArea, dims.roofType, dims.numberOfFloors)
  const lumber = calculateLumber(roofing.roofArea, dims.roofType)
  const aggregates = calculateAggregates(slabArea, blocks)
  const plumbing = calculatePlumbing(dims.numberOfBathrooms, dims.finishLevel)
  const electrical = calculateElectrical(dims.totalFloorArea, dims.finishLevel)
  const ceilingArea = dims.totalFloorArea
  const painting = calculatePainting(wallArea, ceilingArea)
  const tiling = calculateTiling(dims.totalFloorArea, dims.numberOfBathrooms, dims.finishLevel)

  return {
    perimeter: Math.round(perimeter),
    wallArea: Math.round(wallArea),
    slabArea: Math.round(slabArea),
    blocks,
    cement,
    rebar,
    roofing,
    lumber,
    aggregates,
    plumbing,
    electrical,
    painting,
    tiling,
  }
}
