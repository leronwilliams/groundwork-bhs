/**
 * BOQ item catalog: description, unit and trade for every item code the
 * formula engine and AI takeoff use. Prices live in prices.ts / PriceList.
 */
export const ITEM_CATALOG: Record<string, { description: string; unit: string; trade: string }> = {
  ready_mix_concrete:  { description: 'Ready-mix Concrete (slab, footings, beams, cell fill)', unit: 'yd³', trade: 'foundation' },
  concrete_block_8:    { description: 'Concrete Blocks 8" Hollow (external walls)', unit: 'each', trade: 'foundation' },
  concrete_block_6:    { description: 'Concrete Blocks 6" (interior partitions)', unit: 'each', trade: 'foundation' },
  cement_94lb:         { description: 'Cement 94lb (mortar & render)', unit: 'bag', trade: 'foundation' },
  sand:                { description: 'Sand (mortar & render)', unit: 'yd³', trade: 'foundation' },
  gravel:              { description: 'Gravel (slab base course)', unit: 'yd³', trade: 'foundation' },
  fill_sand:           { description: 'Fill Sand (under slab)', unit: 'yd³', trade: 'foundation' },
  rebar_4:             { description: 'Rebar #4 (20ft stick)', unit: 'sticks', trade: 'foundation' },
  tie_wire:            { description: 'Tie Wire', unit: 'lbs', trade: 'foundation' },
  roofing_sheet_26g:   { description: 'Roofing Sheet 26g 10ft', unit: 'sheets', trade: 'roofing' },
  roof_tile_square:    { description: 'Roof Tile incl. underlayment', unit: 'squares', trade: 'roofing' },
  ridge_cap:           { description: 'Ridge / Hip Cap', unit: 'lft', trade: 'roofing' },
  roofing_screw:       { description: 'Roofing Screws (box 250)', unit: 'boxes', trade: 'roofing' },
  lumber_2x4x8:        { description: 'Lumber 2×4 (8ft equiv.)', unit: 'pcs', trade: 'roofing' },
  lumber_2x6x8:        { description: 'Lumber 2×6 rafters (8ft equiv.)', unit: 'pcs', trade: 'roofing' },
  plywood_3_4:         { description: 'Plywood 3/4" Roof Deck', unit: 'sheets', trade: 'roofing' },
  roof_underlayment_square: { description: 'Roof Underlayment', unit: 'squares', trade: 'roofing' },
  fascia_soffit_lf:    { description: 'Fascia + Vented Soffit', unit: 'lft', trade: 'roofing' },
  hurricane_strap:     { description: 'Hurricane Straps', unit: 'each', trade: 'roofing' },
  window_impact:       { description: 'Impact Windows (~3×4)', unit: 'each', trade: 'openings' },
  door_exterior:       { description: 'Exterior Doors + Hardware', unit: 'each', trade: 'openings' },
  door_interior:       { description: 'Interior Doors (pre-hung)', unit: 'each', trade: 'openings' },
  sliding_door_impact: { description: 'Impact Sliding Doors 6ft', unit: 'each', trade: 'openings' },
  pvc_pipe_4inch:      { description: 'PVC Pipe 4" (10ft)', unit: 'pcs', trade: 'plumbing' },
  cpvc_pipe_half:      { description: 'CPVC Pipe 1/2" (10ft)', unit: 'pcs', trade: 'plumbing' },
  plumbing_fittings_set: { description: 'Plumbing Fittings & Valves (set per wet area)', unit: 'sets', trade: 'plumbing' },
  toilet:              { description: 'Toilet (standard)', unit: 'each', trade: 'plumbing' },
  sink_bathroom:       { description: 'Bathroom Sink', unit: 'each', trade: 'plumbing' },
  shower_unit:         { description: 'Shower Unit', unit: 'each', trade: 'plumbing' },
  kitchen_sink:        { description: 'Kitchen Sink + Faucet', unit: 'each', trade: 'plumbing' },
  water_heater:        { description: 'Water Heater 40–50 gal', unit: 'each', trade: 'plumbing' },
  septic_system:       { description: 'Septic Tank + Disposal Field', unit: 'each', trade: 'plumbing' },
  wire_romex_14:       { description: 'Wire Romex 14/2 (50ft roll)', unit: 'rolls', trade: 'electrical' },
  electrical_outlet:   { description: 'Electrical Outlets', unit: 'each', trade: 'electrical' },
  breaker_panel:       { description: 'Breaker Panel 20-circuit', unit: 'each', trade: 'electrical' },
  electrical_rough_in: { description: 'Electrical Rough-in (box, device, conduit, wire per point)', unit: 'points', trade: 'electrical' },
  electrical_service:  { description: 'Electrical Service / Meter Base / Grounding', unit: 'each', trade: 'electrical' },
  light_fixture:       { description: 'Light Fixtures', unit: 'each', trade: 'electrical' },
  kitchen_cabinets_lf: { description: 'Kitchen Cabinets + Countertop', unit: 'lft', trade: 'kitchen' },
  ceiling_board:       { description: 'Ceiling Board 4×8', unit: 'sheets', trade: 'kitchen' },
  exterior_paint_5gal: { description: 'Exterior Paint (5 gal)', unit: 'buckets', trade: 'painting' },
  interior_paint_5gal: { description: 'Interior Paint (5 gal)', unit: 'buckets', trade: 'painting' },
  primer_5gal:         { description: 'Primer (5 gal)', unit: 'buckets', trade: 'painting' },
  floor_tile_sqft:     { description: 'Floor Tile', unit: 'sqft', trade: 'tiling' },
  wall_tile_sqft:      { description: 'Wall Tile', unit: 'sqft', trade: 'tiling' },
  tile_grout:          { description: 'Tile Grout (50lb bag)', unit: 'bags', trade: 'tiling' },
  tile_adhesive:       { description: 'Tile Adhesive (50lb bag)', unit: 'bags', trade: 'tiling' },
}

export const TRADE_DISPLAY: Record<string, string> = {
  foundation: 'Foundation & Structure',
  roofing: 'Roofing',
  openings: 'Doors & Windows',
  plumbing: 'Plumbing & Septic',
  electrical: 'Electrical',
  kitchen: 'Kitchen & Ceilings',
  painting: 'Painting',
  tiling: 'Tiling & Flooring',
}

export const BOQ_DISCLAIMER =
  'Budget estimate, not a quantity surveyor\'s quote. Quantities are calculated from the dimensions you entered ' +
  '(and your plans, where readable) using standard Bahamian construction ratios and indicative Nassau supply prices. ' +
  'It excludes land, design/architect and engineering fees, site clearing, utility connection charges, furniture, ' +
  'appliances, A/C and landscaping. Get a QS or licensed contractor quote before committing funds.'
