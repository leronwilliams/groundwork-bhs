"use client";

import { motion } from "framer-motion";
import { Check, X, Star, Zap } from "lucide-react";
import Link from "next/link";

const tiers = [
  {
    name: "Free",
    description: "Get started and try the platform",
    price: "$0",
    period: "/month",
    features: [
      "Create contractor profile",
      "List 1 trade specialty",
      "Basic lead notifications",
      "View project summaries",
      "Pay per lead ($15-$75)",
    ],
    notIncluded: [
      "Priority lead matching",
      "Free leads",
      "Discounted lead pricing",
      "Featured directory placement",
      "BOQ tool access",
    ],
    cta: "Get Started",
    href: "/sign-up",
    popular: false,
  },
  {
    name: "Verified",
    description: "Build trust with homeowners",
    price: "$25",
    period: "/month",
    features: [
      "Everything in Free",
      "Verified badge on profile",
      "Business license display",
      "Insurance certificate display",
      "Portfolio showcase",
      "Client reviews",
    ],
    notIncluded: [
      "Priority lead matching",
      "Free leads",
      "Discounted lead pricing",
      "BOQ tool access",
    ],
    cta: "Get Verified",
    href: "/sign-up",
    popular: false,
  },
  {
    name: "Builder",
    description: "Maximize your project pipeline",
    price: "$49",
    period: "/month",
    features: [
      "Everything in Verified",
      "Priority lead matching",
      "3 free leads per month",
      "50% off additional leads",
      "Featured directory placement",
      "Builder badge on profile",
      "BOQ tool access",
      "Dedicated account support",
    ],
    notIncluded: [],
    cta: "Become a Builder",
    href: "/sign-up",
    popular: true,
  },
];

const leadPrices = [
  { budget: "Under $50k", price: "$15" },
  { budget: "$50k–$100k", price: "$25" },
  { budget: "$100k–$250k", price: "$35" },
  { budget: "$250k–$500k", price: "$50" },
  { budget: "$500k+", price: "$75" },
  { budget: "Prefer not to say", price: "$25" },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-sand-50">
      {/* Hero */}
      <div className="bg-gradient-to-br from-primary-900 to-primary-800 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-primary-100 max-w-2xl mx-auto">
            Choose the plan that fits your business. No hidden fees, cancel
            anytime.
          </p>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl bg-white p-8 shadow-sm ring-1 ${
                tier.popular
                  ? "ring-primary-600 shadow-lg"
                  : "ring-gray-200"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center rounded-full bg-primary-600 px-4 py-1 text-xs font-medium text-white">
                    <Zap className="mr-1 h-3 w-3" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-lg font-semibold text-gray-900">
                  {tier.name}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {tier.description}
                </p>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-gray-900">
                    {tier.price}
                  </span>
                  <span className="text-sm text-gray-500">{tier.period}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="h-5 w-5 flex-shrink-0 text-green-600" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
                {tier.notIncluded.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <X className="h-5 w-5 flex-shrink-0 text-gray-300" />
                    <span className="text-sm text-gray-400">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={tier.href}
                className={`block w-full text-center rounded-lg px-4 py-3 text-sm font-semibold transition-colors ${
                  tier.popular
                    ? "bg-primary-600 text-white hover:bg-primary-700"
                    : "bg-gray-50 text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-100"
                }`}
              >
                {tier.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lead Pricing */}
      <div className="mx-auto max-w-4xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Lead Pricing
          </h2>
          <p className="text-gray-600 mb-6">
            Pay only for the leads you want. Price varies by project budget.
            Builder tier gets 3 free leads/month, then 50% off.
          </p>
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Project Budget
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Lead Price
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Builder Price
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {leadPrices.map((row) => (
                  <tr key={row.budget}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {row.budget}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 text-right font-medium">
                      {row.price}
                    </td>
                    <td className="px-6 py-4 text-sm text-primary-600 text-right font-medium">
                      {row.price === "$15"
                        ? "$7.50"
                        : row.price === "$25"
                        ? "$12.50"
                        : row.price === "$35"
                        ? "$17.50"
                        : row.price === "$50"
                        ? "$25"
                        : row.price === "$75"
                        ? "$37.50"
                        : "$12.50"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
