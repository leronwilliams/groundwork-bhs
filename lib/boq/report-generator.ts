/**
 * Groundwork BHS — BOQ PDF Report Generator
 * Phase 1.6: Professional PDF with jsPDF
 * 
 * Cover page + executive summary + itemised trades + savings page
 */

import type { DualTakeoffResult } from './takeoff-engine'
import type { ProjectDimensions } from './formulas'

function fmtCurrency(n: number): string {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function confidenceMark(level: 'high' | 'medium' | 'low'): string {
  return level === 'high' ? '✓ Hi' : level === 'medium' ? '~ Med' : '! Low'
}

export async function generateBOQReport(
  result: DualTakeoffResult,
  dims: ProjectDimensions,
  projectName: string = 'Construction Project'
): Promise<Uint8Array> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  
  const NAVY = [6, 13, 26] as [number, number, number]
  const CYAN = [0, 212, 245] as [number, number, number]
  const AMBER = [245, 166, 35] as [number, number, number]
  const WHITE = [255, 255, 255] as [number, number, number]
  const LIGHT = [240, 244, 255] as [number, number, number]
  const GREY = [100, 110, 130] as [number, number, number]
  const GREEN = [5, 150, 105] as [number, number, number]
  const RED = [220, 38, 38] as [number, number, number]
  const now = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  // ─── PAGE 1: COVER ────────────────────────────────────────────────────────
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, 210, 297, 'F')

  // Header band
  doc.setFillColor(...CYAN)
  doc.rect(0, 0, 210, 2, 'F')

  // Logo area
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.setTextColor(...CYAN)
  doc.text('GROUNDWORK BHS', 20, 30)
  doc.setFontSize(10)
  doc.setTextColor(...GREY as [number, number, number])
  doc.text('The Bahamas Construction & Property Platform', 20, 38)

  // Main title
  doc.setFontSize(36)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...WHITE)
  doc.text('Bill of', 20, 80)
  doc.text('Quantities', 20, 95)

  // Cyan line
  doc.setFillColor(...CYAN)
  doc.rect(20, 100, 80, 0.5, 'F')

  // Project details
  doc.setFontSize(13)
  doc.setTextColor(...LIGHT)
  doc.text(projectName, 20, 115)
  doc.setFontSize(10)
  doc.setTextColor(...GREY as [number, number, number])
  doc.text(dims.island + ' | ' + dims.totalFloorArea + ' sqft | ' + dims.numberOfFloors + ' Floor' + (dims.numberOfFloors > 1 ? 's' : ''), 20, 123)
  doc.text(dims.finishLevel.charAt(0).toUpperCase() + dims.finishLevel.slice(1) + ' Finish | Generated: ' + now, 20, 131)

  // Confidence badge
  const overallScore = result.confidence.overallScore
  const badgeColor = overallScore >= 85 ? GREEN : overallScore >= 70 ? AMBER : RED
  doc.setFillColor(...badgeColor)
  doc.roundedRect(20, 145, 70, 18, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...WHITE)
  doc.text('Overall Accuracy: ' + overallScore + '%', 24, 157)

  // Accuracy engine note
  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GREY as [number, number, number])
  const engineNote = [
    'This BOQ was generated using Groundwork\'s 4-Layer Accuracy Engine.',
    'Dual AI validation: Claude Opus + GPT-4o Vision.',
    'Formula-verified against Bahamian construction standards.',
  ]
  doc.text(engineNote, 20, 175)

  // Grand total callout
  doc.setFillColor(11, 22, 40)
  doc.roundedRect(20, 195, 170, 40, 3, 3, 'F')
  doc.setDrawColor(...CYAN)
  doc.setLineWidth(0.5)
  doc.roundedRect(20, 195, 170, 40, 3, 3, 'S')
  doc.setFontSize(10)
  doc.setTextColor(...GREY as [number, number, number])
  doc.text('ESTIMATED PROJECT COST RANGE', 28, 208)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...CYAN)
  doc.text(fmtCurrency(result.summary.grandTotalLow) + ' – ' + fmtCurrency(result.summary.grandTotalHigh), 28, 224)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GREY as [number, number, number])
  doc.text('Materials + Labour + Permits + Contingency | Island premium applied', 28, 231)

  // Disclaimer
  doc.setFontSize(7.5)
  doc.text('This is a preliminary estimate only. Engage a licensed QS for formal certification before contractor tendering.', 20, 265)
  doc.text('Prices based on 2025 Nassau market rates. Family Island transport premium applied where applicable.', 20, 271)

  // Bottom band
  doc.setFillColor(...CYAN)
  doc.rect(0, 295, 210, 2, 'F')

  // ─── PAGE 2: EXECUTIVE SUMMARY ────────────────────────────────────────────
  doc.addPage()
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, 210, 297, 'F')
  doc.setFillColor(...CYAN)
  doc.rect(0, 0, 210, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...CYAN)
  doc.text('Executive Summary', 20, 20)
  doc.setFillColor(...CYAN)
  doc.rect(20, 23, 170, 0.3, 'F')

  // Project table
  let y = 35
  const projectRows = [
    ['Project Location', dims.island],
    ['Total Floor Area', dims.totalFloorArea + ' sqft'],
    ['Number of Floors', String(dims.numberOfFloors)],
    ['Wall Height', dims.wallHeight + ' ft'],
    ['Foundation', dims.foundationType.replace('_', ' ')],
    ['Roof Type', dims.roofType],
    ['Finish Level', dims.finishLevel.charAt(0).toUpperCase() + dims.finishLevel.slice(1)],
    ['Bedrooms / Bathrooms', dims.numberOfBedrooms + ' bed / ' + dims.numberOfBathrooms + ' bath'],
  ]
  projectRows.forEach((row, i) => {
    doc.setFillColor(i % 2 === 0 ? 11 : 14, i % 2 === 0 ? 22 : 30, i % 2 === 0 ? 40 : 56)
    doc.rect(20, y, 170, 7, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...GREY as [number, number, number])
    doc.text(row[0], 25, y + 5)
    doc.setTextColor(...LIGHT)
    doc.text(row[1], 120, y + 5)
    y += 7
  })

  y += 10
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...CYAN)
  doc.text('Cost Breakdown', 20, y)
  y += 8

  const costRows = [
    ['Materials Cost', fmtCurrency(result.summary.materialsCostLow), fmtCurrency(result.summary.materialsCostHigh)],
    ['Labour Estimate', fmtCurrency(result.summary.labourEstimateLow), fmtCurrency(result.summary.labourEstimateHigh)],
    ['Permit & Professional Fees', fmtCurrency(result.summary.permitFees), fmtCurrency(result.summary.permitFees)],
    ['Contingency (10%)', fmtCurrency(result.summary.contingency), fmtCurrency(Math.round(result.summary.grandTotalHigh * 0.1))],
  ]

  // Header
  doc.setFillColor(...NAVY)
  doc.rect(20, y, 170, 7, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(...CYAN)
  doc.text('Cost Category', 25, y + 5)
  doc.text('Low Estimate', 115, y + 5)
  doc.text('High Estimate', 155, y + 5)
  y += 7

  costRows.forEach((row, i) => {
    doc.setFillColor(i % 2 === 0 ? 11 : 14, i % 2 === 0 ? 22 : 30, i % 2 === 0 ? 40 : 56)
    doc.rect(20, y, 170, 7, 'F')
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...LIGHT)
    doc.text(row[0], 25, y + 5)
    doc.text(row[1], 115, y + 5)
    doc.text(row[2], 155, y + 5)
    y += 7
  })

  // Grand total row
  doc.setFillColor(...CYAN)
  doc.rect(20, y, 170, 9, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...NAVY)
  doc.text('GRAND TOTAL', 25, y + 6)
  doc.text(fmtCurrency(result.summary.grandTotalLow), 112, y + 6)
  doc.text(fmtCurrency(result.summary.grandTotalHigh), 152, y + 6)
  y += 15

  // Confidence breakdown
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...CYAN)
  doc.text('Accuracy Breakdown', 20, y)
  y += 8

  const confRows = [
    ['✓ High Confidence (90%+)', result.confidence.highPct + '% of items', 'Confirmed by formula + AI cross-validation', GREEN],
    ['~ Medium Confidence (70-89%)', result.confidence.mediumPct + '% of items', 'Estimated from area ratios, recommend verification', AMBER],
    ['! Low Confidence (<70%)', result.confidence.lowPct + '% of items', 'Industry standard ratio only, QS review recommended', RED],
  ]

  confRows.forEach(([label, pct, desc, color], i) => {
    doc.setFillColor(i % 2 === 0 ? 11 : 14, i % 2 === 0 ? 22 : 30, i % 2 === 0 ? 40 : 56)
    doc.rect(20, y, 170, 9, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...(color as [number, number, number]))
    doc.text(label as string, 25, y + 4)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...LIGHT)
    doc.text(pct as string, 95, y + 4)
    doc.setFontSize(7)
    doc.setTextColor(...GREY as [number, number, number])
    doc.text(desc as string, 25, y + 8)
    y += 10
  })

  doc.setFillColor(...CYAN)
  doc.rect(0, 295, 210, 2, 'F')

  // ─── PAGES 3+: TRADE SECTIONS ─────────────────────────────────────────────
  const TRADE_LABELS: Record<string, string> = {
    foundation: 'Foundation & Structure',
    roofing: 'Roofing',
    plumbing: 'Plumbing',
    electrical: 'Electrical',
    painting: 'Painting',
    tiling: 'Tiling & Flooring',
    joinery: 'Joinery & Carpentry',
    landscaping: 'Landscaping',
    other: 'Other Items',
  }

  for (const trade of result.trades) {
    doc.addPage()
    doc.setFillColor(...NAVY)
    doc.rect(0, 0, 210, 297, 'F')
    doc.setFillColor(...CYAN)
    doc.rect(0, 0, 210, 2, 'F')

    const tradeLabel = TRADE_LABELS[trade.trade] || trade.trade.toUpperCase()
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(16)
    doc.setTextColor(...CYAN)
    doc.text(tradeLabel, 20, 20)
    doc.setFillColor(...CYAN)
    doc.rect(20, 23, 170, 0.3, 'F')

    y = 32
    // Table header
    doc.setFillColor(0, 20, 40)
    doc.rect(20, y, 170, 7, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...CYAN)
    doc.text('Description', 23, y + 5)
    doc.text('Unit', 100, y + 5)
    doc.text('Qty', 118, y + 5)
    doc.text('Unit $', 135, y + 5)
    doc.text('Total $', 155, y + 5)
    doc.text('Conf', 178, y + 5)
    y += 7

    trade.items.forEach((item, i) => {
      if (y > 265) {
        doc.addPage()
        doc.setFillColor(...NAVY)
        doc.rect(0, 0, 210, 297, 'F')
        y = 20
      }
      doc.setFillColor(i % 2 === 0 ? 11 : 14, i % 2 === 0 ? 22 : 30, i % 2 === 0 ? 40 : 56)
      doc.rect(20, y, 170, 7, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(8)
      doc.setTextColor(...LIGHT)
      doc.text(item.description.slice(0, 32), 23, y + 5)
      doc.text(item.unit, 100, y + 5)
      doc.text(item.quantity.toLocaleString(), 118, y + 5)
      doc.text('$' + item.unitPrice.toFixed(2), 135, y + 5)
      doc.text(fmtCurrency(item.totalPrice), 155, y + 5)

      const confColor = item.confidence === 'high' ? GREEN : item.confidence === 'medium' ? AMBER : RED
      doc.setTextColor(...confColor)
      doc.setFont('helvetica', 'bold')
      doc.text(confidenceMark(item.confidence), 178, y + 5)
      y += 7
    })

    // Trade subtotal
    y += 2
    doc.setFillColor(0, 40, 60)
    doc.rect(20, y, 170, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...CYAN)
    doc.text(tradeLabel.toUpperCase() + ' TOTAL:', 23, y + 5.5)
    doc.text(fmtCurrency(trade.subtotalLow) + ' – ' + fmtCurrency(trade.subtotalHigh), 135, y + 5.5)
    y += 12

    doc.setFillColor(...CYAN)
    doc.rect(0, 295, 210, 2, 'F')
  }

  // ─── FINAL PAGE: SAVINGS OPPORTUNITIES ────────────────────────────────────
  doc.addPage()
  doc.setFillColor(...NAVY)
  doc.rect(0, 0, 210, 297, 'F')
  doc.setFillColor(...CYAN)
  doc.rect(0, 0, 210, 2, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...AMBER)
  doc.text('Savings Opportunities', 20, 20)
  doc.setFillColor(...AMBER)
  doc.rect(20, 23, 170, 0.3, 'F')

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...LIGHT)
  doc.text('Price comparison is available for all ' + result.allItems.length + ' material items in this BOQ.', 20, 35)
  doc.text('Nassau hardware stores typically vary by 8–25% on the same materials.', 20, 43)

  const estimatedSavings = Math.round(result.summary.materialsCostLow * 0.15)
  doc.setFillColor(14, 30, 56)
  doc.roundedRect(20, 52, 170, 25, 3, 3, 'F')
  doc.setDrawColor(...AMBER)
  doc.roundedRect(20, 52, 170, 25, 3, 3, 'S')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...AMBER)
  doc.text('Estimated Savings from Hardware Store Comparison:', 25, 63)
  doc.setFontSize(16)
  doc.text(fmtCurrency(Math.round(estimatedSavings * 0.7)) + ' – ' + fmtCurrency(estimatedSavings), 25, 72)

  y = 90
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...CYAN)
  doc.text('Available Services to Maximise Your Savings:', 20, y)
  y += 12

  const services = [
    ['BOQ + Hardware Store Comparison', '$275', 'Live prices from registered Nassau hardware stores. Cheapest option per item highlighted.'],
    ['BOQ + Hardware Store Quotes', '$375', 'We contact stores directly. Real quotes returned in 48 hours. Average saving: $4,000–$12,000.'],
    ['Professional BOQ Review', '$650', 'Licensed QS reviews and validates this BOQ. Formal document with QS stamp for tendering.'],
  ]

  services.forEach((svc) => {
    doc.setFillColor(11, 22, 40)
    doc.roundedRect(20, y, 170, 22, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...CYAN)
    doc.text(svc[0], 25, y + 8)
    doc.setTextColor(...AMBER)
    doc.text(svc[1], 175, y + 8, { align: 'right' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...GREY as [number, number, number])
    const lines = doc.splitTextToSize(svc[2], 145)
    doc.text(lines, 25, y + 15)
    y += 28
  })

  y += 5
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...GREY as [number, number, number])
  doc.text('Visit www.groundworksbhs.com to order. Delivered within 48 hours.', 20, y)

  // Disclaimer
  doc.setFontSize(7)
  doc.text('DISCLAIMER: This BOQ is a preliminary estimate prepared by Groundwork BHS using AI quantity takeoff cross-validated against Bahamian', 20, 270)
  doc.text('construction standards. It does not constitute a formal valuation or professional QS certification. Always engage a licensed QS before', 20, 275)
  doc.text('contract award for projects exceeding $100,000. © 2026 Groundwork BHS | groundworksbhs.com', 20, 280)

  doc.setFillColor(...CYAN)
  doc.rect(0, 295, 210, 2, 'F')

  return doc.output('arraybuffer') as unknown as Uint8Array
}
