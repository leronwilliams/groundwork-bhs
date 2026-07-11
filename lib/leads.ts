/**
 * Shared lead dispatch logic.
 *
 * Matches contractors by trade + island, creates the ContractorLead record,
 * and emails each matched contractor an anonymous lead notification.
 *
 * Used by BOTH:
 *   - POST /api/leads              (Builder tier: free, direct dispatch)
 *   - POST /api/webhooks/stripe    (Free/Pro tier: dispatch after paid lead order)
 *
 * This function does NOT enforce payment — callers own the tier/payment gate.
 * Extracted verbatim from the original /api/leads matching logic so behaviour
 * is unchanged; it is now reusable for paid-lead fulfilment.
 */

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { sendLeadToContractor } from '@/lib/lead-emails'

export interface LeadBrief {
  island: string
  projectType?: string | null
  tradesNeeded: string[]
  budget?: string | null
  timeline?: string | null
  notes?: string | null
}

export interface DispatchResult {
  leadId: string
  matchedContractors: number
  emailsSent: number
  contractors: { contractor: string; sent: boolean; error?: string }[]
}

export async function createAndDispatchLead(params: {
  dbUserId: string | null
  clientName?: string | null
  orderId?: string | null
  brief: LeadBrief
  baseUrl: string
}): Promise<DispatchResult> {
  const { dbUserId, clientName, orderId, brief, baseUrl } = params
  const { island, projectType, tradesNeeded, budget, timeline, notes } = brief

  // Match contractors by trade AND island — no cross-island leads.
  const islandKey = island.toLowerCase()
  const allContractors = await prisma.contractor.findMany({
    where: {
      listingStatus: 'active',
      island: { contains: islandKey.includes('nassau') ? 'nassau' : islandKey, mode: 'insensitive' },
    },
  })

  const tradeTerms = tradesNeeded.map(t => t.toLowerCase())
  const matched = allContractors.filter(c =>
    tradeTerms.some(trade =>
      c.trade?.toLowerCase().includes(trade) ||
      c.description?.toLowerCase().includes(trade) ||
      trade.includes(c.trade?.toLowerCase() || '')
    )
  )

  // Always record the lead — even when nothing matches right now.
  const lead = await prisma.contractorLead.create({
    data: {
      orderId: orderId || null,
      userId: dbUserId || 'guest',
      projectBrief: { projectType: projectType || null, notes: notes || null } as Prisma.InputJsonValue,
      island,
      tradesNeeded,
      budget: budget || null,
      timeline: timeline || null,
      contractorsSent: matched.map(c => c.id),
      status: 'sent',
    },
  })

  if (matched.length === 0) {
    return { leadId: lead.id, matchedContractors: 0, emailsSent: 0, contractors: [] }
  }

  // First name only — never share the client's full name with contractors.
  const clientFirstName = clientName?.split(' ')[0] || 'Client'

  const results: DispatchResult['contractors'] = []
  for (const contractor of matched) {
    const expressInterestUrl = `${baseUrl}/api/leads/express-interest?leadId=${lead.id}&contractorId=${contractor.id}&token=${Buffer.from(`${lead.id}:${contractor.id}`).toString('base64')}`

    const r = await sendLeadToContractor(
      contractor.email || 'noreply@placeholder.com',
      contractor.name,
      {
        leadId: lead.id,
        clientFirstName,
        island,
        projectType: projectType || 'Construction Project',
        trades: tradesNeeded,
        budget: budget || 'Not specified',
        timeline: timeline || 'Flexible',
        notes: notes || undefined,
        expressInterestUrl,
      }
    )
    results.push({ contractor: contractor.name, ...r })
  }

  return {
    leadId: lead.id,
    matchedContractors: matched.length,
    emailsSent: results.filter(r => r.sent).length,
    contractors: results,
  }
}
