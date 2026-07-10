"use client";

import { motion } from "framer-motion";
import { ClipboardList, Users, Handshake } from "lucide-react";

const steps = [
  {
    icon: ClipboardList,
    title: "Post Your Project",
    description:
      "Tell us what you need — renovation, new build, repairs. Share details, timeline, and budget in minutes.",
  },
  {
    icon: Users,
    title: "Get Matched",
    description:
      "Our system matches you with verified contractors who serve your island and specialize in your project type.",
  },
  {
    icon: Handshake,
    title: "Hire & Build",
    description:
      "Review contractor profiles, compare quotes, and hire with confidence. Pay nothing to post.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-sand-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How it works
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            From idea to groundbreaking in three simple steps
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="card text-center"
            >
              <div className="mx-auto h-14 w-14 rounded-full bg-primary-100 flex items-center justify-center mb-6">
                <step.icon className="h-7 w-7 text-primary-600" />
              </div>
              <div className="text-sm font-semibold text-primary-600 mb-2">
                Step {index + 1}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
