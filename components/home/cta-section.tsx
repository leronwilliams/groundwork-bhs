"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 bg-sand-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 to-primary-900 px-6 py-16 text-center sm:px-16"
        >
          <div className="relative">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to start your project?
            </h2>
            <p className="mt-4 text-lg text-primary-100 max-w-2xl mx-auto">
              Join hundreds of homeowners who found the perfect contractor through
              Groundwork BHS. It takes less than 5 minutes to post.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/post-project" className="btn-primary bg-white text-primary-900 hover:bg-sand-100">
                Post Your Project
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/contractors" className="btn-secondary bg-white/10 text-white ring-white/20 hover:bg-white/20">
                Browse Contractors
              </Link>
            </div>
            <p className="mt-6 text-sm text-primary-200">
              Free to post. Verified contractors only. No spam.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
