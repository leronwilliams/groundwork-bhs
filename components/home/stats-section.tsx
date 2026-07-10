"use client";

import { motion } from "framer-motion";
import { HardHat, Users, Building2, BadgeCheck } from "lucide-react";

const stats = [
  { icon: HardHat, value: "120+", label: "Verified contractors" },
  { icon: Users, value: "350+", label: "Projects posted" },
  { icon: Building2, value: "9", label: "Islands served" },
  { icon: BadgeCheck, value: "94%", label: "Match satisfaction" },
];

export function StatsSection() {
  return (
    <section className="py-24 bg-primary-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <stat.icon className="mx-auto h-8 w-8 text-sand-400 mb-4" />
              <div className="text-3xl font-bold text-white">{stat.value}</div>
              <div className="mt-1 text-sm text-primary-200">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
