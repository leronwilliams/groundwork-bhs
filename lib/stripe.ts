import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia' as const,
})

export const PRICE_IDS = {
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  builder: process.env.STRIPE_BUILDER_PRICE_ID!,
  lead: process.env.STRIPE_LEAD_PRICE_ID!,
  estimate_single: process.env.STRIPE_ESTIMATE_SINGLE_PRICE_ID!,
  estimate_full: process.env.STRIPE_ESTIMATE_FULL_PRICE_ID!,
  boq: process.env.STRIPE_BOQ_PRICE_ID!,
  boq_hardware: process.env.STRIPE_BOQ_HARDWARE_PRICE_ID!,
  boq_quotes: process.env.STRIPE_BOQ_QUOTES_PRICE_ID!,
  permit_prep: process.env.STRIPE_PERMIT_PREP_PRICE_ID!,
  contract: process.env.STRIPE_CONTRACT_PRICE_ID!,
  tax_appeal: process.env.STRIPE_TAX_APPEAL_PRICE_ID!,
} as const

export type PriceKey = keyof typeof PRICE_IDS
