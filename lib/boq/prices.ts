/**
 * Groundwork BHS — Current Nassau Material Prices (2025)
 * Phase 1.4: Price list management
 * 
 * Prices fetched from PriceList table (admin-updatable).
 * Fallback to hardcoded defaults if DB unavailable.
 */

export const DEFAULT_PRICES: Record<string, number> = {
  concrete_block_8:     4.20,
  cement_94lb:          20.00,
  sand:                 80.00,
  gravel:               90.00,
  rebar_4:              22.00,
  tie_wire:              3.50,
  roofing_sheet_26g:    42.00,
  ridge_cap:             8.50,
  roofing_screw:        18.00,  // box of 250
  lumber_2x4x8:         16.00,
  lumber_2x6x8:         22.00,
  plywood_3_4:          85.00,
  pvc_pipe_4inch:       28.00,  // 10ft piece
  cpvc_pipe_half:       12.00,  // 10ft piece
  plumbing_fittings:    45.00,  // set per bathroom
  wire_romex_14:        28.00,  // 50ft roll
  electrical_outlet:     8.50,
  breaker_panel:       285.00,
  exterior_paint_5gal: 110.00,
  interior_paint_5gal:  95.00,
  primer_5gal:          75.00,
  floor_tile_sqft:       4.50,
  wall_tile_sqft:        5.50,
  tile_grout:           22.00,  // 50lb bag
  tile_adhesive:        28.00,  // 50lb bag
  fill_sand:            65.00,
  toilet:              285.00,
  sink_bathroom:       195.00,
  shower_unit:         350.00,
  // Added Oct 2026 (indicative Nassau supply prices, BSD; admin can override
  // any of these by adding a PriceList row with the same itemCode)
  ready_mix_concrete:  285.00,  // per cubic yard, delivered
  concrete_block_6:      3.60,
  roof_tile_square:    650.00,  // per 100 sqft incl. underlayment
  hurricane_strap:       2.75,
  window_impact:       850.00,  // ~3x4 impact-rated, installed frame
  door_exterior:       650.00,  // solid exterior door + frame + hardware
  door_interior:       220.00,  // pre-hung interior door + hardware
  sliding_door_impact: 2400.00, // 6ft impact-rated sliding door
  kitchen_sink:        250.00,
  water_heater:        650.00,  // 40-50 gal electric
  septic_system:      6500.00,  // tank + field, typical residential
  light_fixture:        45.00,
  kitchen_cabinets_lf: 350.00,  // base + wall cabinets + counter, per linear ft
  ceiling_board:        18.00,  // 4x8 1/2" gypsum ceiling board
  plumbing_fittings_set: 350.00, // elbows, tees, valves, traps, cement for one wet area
  electrical_rough_in:   38.00, // per point: box, device/cover, conduit, 12/2 run
  electrical_service:   650.00, // meter base, main disconnect, grounding
  roof_underlayment_square: 85.00, // synthetic underlayment + ice&water at eaves, per 100 sqft
  fascia_soffit_lf:     14.00, // fascia board + vented soffit, per linear ft
}

export const PRICE_LIST_SEED = [
  { itemCode: 'concrete_block_8',    itemName: 'Concrete Block 8"',       unit: 'each',   unitPrice: 4.20,  supplier: 'Kelly\'s / RND' },
  { itemCode: 'cement_94lb',         itemName: 'Cement (94lb bag)',        unit: 'bag',    unitPrice: 20.00, supplier: 'Kelly\'s / RND' },
  { itemCode: 'sand',                itemName: 'Sand',                     unit: 'yard',   unitPrice: 80.00, supplier: 'Nassau Sand Co.' },
  { itemCode: 'gravel',              itemName: 'Gravel',                   unit: 'yard',   unitPrice: 90.00, supplier: 'Nassau Sand Co.' },
  { itemCode: 'rebar_4',             itemName: 'Rebar #4 (20ft stick)',    unit: 'stick',  unitPrice: 22.00, supplier: 'Kelly\'s / RND' },
  { itemCode: 'tie_wire',            itemName: 'Tie Wire',                 unit: 'lb',     unitPrice: 3.50,  supplier: 'Kelly\'s / RND' },
  { itemCode: 'roofing_sheet_26g',   itemName: 'Roofing Sheet 26g 10ft',  unit: 'sheet',  unitPrice: 42.00, supplier: 'Kelly\'s / RND' },
  { itemCode: 'ridge_cap',           itemName: 'Ridge Cap',                unit: 'lft',    unitPrice: 8.50,  supplier: 'Kelly\'s / RND' },
  { itemCode: 'roofing_screw',       itemName: 'Roofing Screw (box 250)', unit: 'box',    unitPrice: 18.00, supplier: 'Kelly\'s / RND' },
  { itemCode: 'lumber_2x4x8',        itemName: 'Lumber 2x4x8',            unit: 'piece',  unitPrice: 16.00, supplier: 'Kelly\'s / RND' },
  { itemCode: 'lumber_2x6x8',        itemName: 'Lumber 2x6x8',            unit: 'piece',  unitPrice: 22.00, supplier: 'Kelly\'s / RND' },
  { itemCode: 'plywood_3_4',         itemName: 'Plywood 3/4" sheet',      unit: 'sheet',  unitPrice: 85.00, supplier: 'Kelly\'s / RND' },
  { itemCode: 'pvc_pipe_4inch',      itemName: 'PVC Pipe 4" (10ft)',      unit: 'piece',  unitPrice: 28.00, supplier: 'Plumbing Supply' },
  { itemCode: 'cpvc_pipe_half',      itemName: 'CPVC Pipe 1/2" (10ft)',   unit: 'piece',  unitPrice: 12.00, supplier: 'Plumbing Supply' },
  { itemCode: 'plumbing_fittings',   itemName: 'Plumbing Fittings (set)', unit: 'set',    unitPrice: 45.00, supplier: 'Plumbing Supply' },
  { itemCode: 'wire_romex_14',       itemName: 'Wire Romex 14/2 (50ft)',  unit: 'roll',   unitPrice: 28.00, supplier: 'Electrical Supply' },
  { itemCode: 'electrical_outlet',   itemName: 'Electrical Outlet',        unit: 'each',   unitPrice: 8.50,  supplier: 'Electrical Supply' },
  { itemCode: 'breaker_panel',       itemName: 'Breaker Panel 20-circuit', unit: 'each',   unitPrice: 285.00, supplier: 'Electrical Supply' },
  { itemCode: 'exterior_paint_5gal', itemName: 'Exterior Paint 5gal',     unit: 'bucket', unitPrice: 110.00, supplier: 'Kelly\'s / RND' },
  { itemCode: 'interior_paint_5gal', itemName: 'Interior Paint 5gal',     unit: 'bucket', unitPrice: 95.00, supplier: 'Kelly\'s / RND' },
  { itemCode: 'primer_5gal',         itemName: 'Primer 5gal',             unit: 'bucket', unitPrice: 75.00, supplier: 'Kelly\'s / RND' },
  { itemCode: 'floor_tile_sqft',     itemName: 'Floor Tile (per sqft)',   unit: 'sqft',   unitPrice: 4.50,  supplier: 'Tile Supplier' },
  { itemCode: 'wall_tile_sqft',      itemName: 'Wall Tile (per sqft)',    unit: 'sqft',   unitPrice: 5.50,  supplier: 'Tile Supplier' },
  { itemCode: 'tile_grout',          itemName: 'Tile Grout (50lb bag)',   unit: 'bag',    unitPrice: 22.00, supplier: 'Tile Supplier' },
  { itemCode: 'tile_adhesive',       itemName: 'Tile Adhesive (50lb bag)',unit: 'bag',    unitPrice: 28.00, supplier: 'Tile Supplier' },
  { itemCode: 'fill_sand',           itemName: 'Fill Sand (yard)',        unit: 'yard',   unitPrice: 65.00, supplier: 'Nassau Sand Co.' },
  { itemCode: 'toilet',              itemName: 'Toilet (standard)',        unit: 'each',   unitPrice: 285.00, supplier: 'Plumbing Supply' },
  { itemCode: 'sink_bathroom',       itemName: 'Bathroom Sink',           unit: 'each',   unitPrice: 195.00, supplier: 'Plumbing Supply' },
  { itemCode: 'shower_unit',         itemName: 'Shower Unit',             unit: 'each',   unitPrice: 350.00, supplier: 'Plumbing Supply' },
  { itemCode: 'ready_mix_concrete',  itemName: 'Ready-mix Concrete (yd³)', unit: 'yd3',    unitPrice: 285.00, supplier: 'Ready-mix Supplier' },
  { itemCode: 'concrete_block_6',    itemName: 'Concrete Block 6"',       unit: 'each',   unitPrice: 3.60,  supplier: 'Kelly\'s / RND' },
  { itemCode: 'roof_tile_square',    itemName: 'Roof Tile (per square)',  unit: 'square', unitPrice: 650.00, supplier: 'Roofing Supplier' },
  { itemCode: 'hurricane_strap',     itemName: 'Hurricane Strap',         unit: 'each',   unitPrice: 2.75,  supplier: 'Kelly\'s / RND' },
  { itemCode: 'window_impact',       itemName: 'Impact Window ~3x4',      unit: 'each',   unitPrice: 850.00, supplier: 'Window Supplier' },
  { itemCode: 'door_exterior',       itemName: 'Exterior Door + Hardware',unit: 'each',   unitPrice: 650.00, supplier: 'Kelly\'s / RND' },
  { itemCode: 'door_interior',       itemName: 'Interior Door (pre-hung)',unit: 'each',   unitPrice: 220.00, supplier: 'Kelly\'s / RND' },
  { itemCode: 'sliding_door_impact', itemName: 'Impact Sliding Door 6ft', unit: 'each',   unitPrice: 2400.00, supplier: 'Window Supplier' },
  { itemCode: 'kitchen_sink',        itemName: 'Kitchen Sink + Faucet',   unit: 'each',   unitPrice: 250.00, supplier: 'Plumbing Supply' },
  { itemCode: 'water_heater',        itemName: 'Water Heater 40-50gal',   unit: 'each',   unitPrice: 650.00, supplier: 'Plumbing Supply' },
  { itemCode: 'septic_system',       itemName: 'Septic Tank + Field',     unit: 'each',   unitPrice: 6500.00, supplier: 'Plumbing Supply' },
  { itemCode: 'light_fixture',       itemName: 'Light Fixture',           unit: 'each',   unitPrice: 45.00, supplier: 'Electrical Supply' },
  { itemCode: 'kitchen_cabinets_lf', itemName: 'Kitchen Cabinets + Counter', unit: 'lft', unitPrice: 350.00, supplier: 'Cabinet Supplier' },
  { itemCode: 'plumbing_fittings_set', itemName: 'Plumbing Fittings (set per wet area)', unit: 'set', unitPrice: 350.00, supplier: 'Plumbing Supply' },
  { itemCode: 'electrical_rough_in', itemName: 'Electrical Rough-in (per point)', unit: 'point', unitPrice: 38.00, supplier: 'Electrical Supply' },
  { itemCode: 'electrical_service',  itemName: 'Electrical Service / Meter Base', unit: 'each', unitPrice: 650.00, supplier: 'Electrical Supply' },
  { itemCode: 'roof_underlayment_square', itemName: 'Roof Underlayment (per square)', unit: 'square', unitPrice: 85.00, supplier: 'Roofing Supplier' },
  { itemCode: 'fascia_soffit_lf',    itemName: 'Fascia + Soffit (lft)',   unit: 'lft',    unitPrice: 14.00, supplier: 'Kelly\'s / RND' },
  { itemCode: 'ceiling_board',       itemName: 'Ceiling Board 4x8',       unit: 'sheet',  unitPrice: 18.00, supplier: 'Kelly\'s / RND' },
]

/**
 * Get price list from database, fallback to defaults.
 */
export async function getPrices(): Promise<Record<string, number>> {
  try {
    const { prisma } = await import('@/lib/db')
    const items = await prisma.priceList.findMany()
    // Admin-maintained PriceList rows win; defaults fill any item without a row
    const prices: Record<string, number> = { ...DEFAULT_PRICES }
    items.forEach(item => { prices[item.itemCode] = item.unitPrice })
    return prices
  } catch {
    return DEFAULT_PRICES
  }
}
