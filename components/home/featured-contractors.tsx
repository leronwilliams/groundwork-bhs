"use client";

import { motion } from "framer-motion";
import { Star, MapPin } from "lucide-react";

const contractors = [
  {
    name: "Ron Williams Construction",
    trade: "General Contractor",
    island: "New Providence",
    rating: 4.9,
    reviews: 24,
    tier: "Builder",
    image: "R",
  },
  {
    name: "Bahamas Electrical Co.",
    trade: "Electrical",
    island: "Grand Bahama",
    rating: 4.8,
    reviews: 18,
    tier: "Verified",
    image: "B",
  },
  {
    name: "Island Masonry Ltd",
    trade: "Masonry",
    island: "Abaco",
    rating: 4.7,
    reviews: 31,
    tier: "Verified",
    image: "I",
  },
];

export function FeaturedContractors() {
  return (
    <section className="py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Featured contractors
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Trusted professionals across The Bahamas
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {contractors.map((contractor, index) => (
            <motion.div
              key={contractor.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-lg">
                  {contractor.image}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">
                      {contractor.name}
                    </h3>
                    {contractor.tier === "Builder" && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        Builder
                      </span>
                    )}
                    {contractor.tier === "Verified" && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{contractor.trade}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    <span className="text-sm text-gray-500">{contractor.island}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-0.5">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {contractor.rating}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      ({contractor.reviews} reviews)
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
