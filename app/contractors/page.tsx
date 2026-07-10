"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Star, Search, SlidersHorizontal } from "lucide-react";

const islands = [
  "All Islands",
  "New Providence",
  "Abaco",
  "Exuma",
  "Eleuthera",
  "Andros",
  "Long Island",
  "Bimini",
  "Grand Bahama",
];

const trades = [
  "All Trades",
  "General",
  "Electrical",
  "Plumbing",
  "Masonry",
  "Roofing",
  "Carpentry",
  "Painting",
  "HVAC",
];

const contractors = [
  {
    id: "1",
    businessName: "Ron Williams Construction",
    contactName: "Ron Williams",
    trades: ["General"],
    islandsServed: ["New Providence", "Grand Bahama"],
    tier: "BUILDER",
    rating: 4.9,
    reviews: 24,
    portfolio: [
      { url: "/placeholder.jpg", description: "Luxury villa renovation, Paradise Island" },
    ],
  },
  {
    id: "2",
    businessName: "Bahamas Electrical Co.",
    contactName: "John Smith",
    trades: ["Electrical"],
    islandsServed: ["Grand Bahama"],
    tier: "VERIFIED",
    rating: 4.8,
    reviews: 18,
    portfolio: [],
  },
  {
    id: "3",
    businessName: "Island Masonry Ltd",
    contactName: "Marcus Johnson",
    trades: ["Masonry"],
    islandsServed: ["Abaco"],
    tier: "VERIFIED",
    rating: 4.7,
    reviews: 31,
    portfolio: [],
  },
  {
    id: "4",
    businessName: "Coastal Plumbing",
    contactName: "David Miller",
    trades: ["Plumbing"],
    islandsServed: ["New Providence", "Exuma"],
    tier: "FREE",
    rating: 4.5,
    reviews: 12,
    portfolio: [],
  },
  {
    id: "5",
    businessName: "Abaco Roofing Experts",
    contactName: "Sarah Brown",
    trades: ["Roofing"],
    islandsServed: ["Abaco", "Eleuthera"],
    tier: "VERIFIED",
    rating: 4.9,
    reviews: 42,
    portfolio: [],
  },
];

export default function ContractorsPage() {
  const [selectedIsland, setSelectedIsland] = useState("All Islands");
  const [selectedTrade, setSelectedTrade] = useState("All Trades");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = contractors.filter((c) => {
    const islandMatch =
      selectedIsland === "All Islands" ||
      c.islandsServed.includes(selectedIsland);
    const tradeMatch =
      selectedTrade === "All Trades" || c.trades.includes(selectedTrade);
    const searchMatch =
      !searchQuery ||
      c.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.trades.some((t) =>
        t.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return islandMatch && tradeMatch && searchMatch;
  });

  return (
    <div className="min-h-screen bg-sand-50 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Contractor Directory
          </h1>
          <p className="mt-2 text-gray-600">
            Browse verified contractors across The Bahamas
          </p>
        </div>

        {/* Filters */}
        <div className="card mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or trade..."
                className="input-field pl-10"
              />
            </div>
            <div className="flex gap-4">
              <select
                value={selectedIsland}
                onChange={(e) => setSelectedIsland(e.target.value)}
                className="select-field"
              >
                {islands.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
              <select
                value={selectedTrade}
                onChange={(e) => setSelectedTrade(e.target.value)}
                className="select-field"
              >
                {trades.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((contractor, index) => (
            <motion.div
              key={contractor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
                  {contractor.businessName[0]}
                </div>
                <div className="flex flex-col items-end gap-1">
                  {contractor.tier === "BUILDER" && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Builder
                    </span>
                  )}
                  {contractor.tier === "VERIFIED" && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                      Verified
                    </span>
                  )}
                </div>
              </div>

              <h3 className="font-semibold text-gray-900 mb-1">
                {contractor.businessName}
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                {contractor.trades.join(", ")}
              </p>

              <div className="flex items-center gap-1 mb-3">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium text-gray-900">
                  {contractor.rating}
                </span>
                <span className="text-sm text-gray-500">
                  ({contractor.reviews} reviews)
                </span>
              </div>

              <div className="flex flex-wrap gap-1 mb-4">
                {contractor.islandsServed.map((island) => (
                  <span
                    key={island}
                    className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                  >
                    <MapPin className="mr-1 h-3 w-3" />
                    {island}
                  </span>
                ))}
              </div>

              <button className="w-full btn-primary text-sm py-2">
                View Profile
              </button>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <SlidersHorizontal className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">
              No contractors found
            </h3>
            <p className="text-gray-600 mt-1">
              Try adjusting your filters or search query
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
