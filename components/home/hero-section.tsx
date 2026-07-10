"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, HardHat, Shield, Zap } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white mb-6">
              <Zap className="h-4 w-4" />
              Now serving all Bahamian islands
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Build better in{" "}
              <span className="text-sand-300">The Bahamas</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-primary-100 max-w-xl">
              Connect with verified contractors across every island. From New Providence 
              to the Family Islands — get matched with skilled professionals for your 
              construction project.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/post-project" className="btn-primary bg-white text-primary-900 hover:bg-sand-100">
                Post Your Project
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link href="/contractors" className="btn-secondary bg-white/10 text-white ring-white/20 hover:bg-white/20">
                Browse Contractors
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-primary-200">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span>Verified contractors</span>
              </div>
              <div className="flex items-center gap-2">
                <HardHat className="h-5 w-5" />
                <span>All islands covered</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="hidden lg:block"
          >
            <div className="relative rounded-2xl bg-white/5 p-8 backdrop-blur-sm border border-white/10">
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-lg bg-white/10 p-4">
                  <div className="h-12 w-12 rounded-full bg-sand-400 flex items-center justify-center text-primary-900 font-bold">R</div>
                  <div>
                    <p className="font-medium text-white">Ron Williams</p>
                    <p className="text-sm text-primary-200">General Contractor · Nassau</p>
                  </div>
                  <span className="ml-auto rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-300">Verified</span>
                </div>
                <div className="flex items-center gap-4 rounded-lg bg-white/10 p-4">
                  <div className="h-12 w-12 rounded-full bg-sand-400 flex items-center justify-center text-primary-900 font-bold">C</div>
                  <div>
                    <p className="font-medium text-white">Caribbean Builders</p>
                    <p className="text-sm text-primary-200">Builder Tier · Abaco</p>
                  </div>
                  <span className="ml-auto rounded-full bg-amber-500/20 px-2 py-1 text-xs font-medium text-amber-300">Builder</span>
                </div>
                <div className="flex items-center gap-4 rounded-lg bg-white/10 p-4">
                  <div className="h-12 w-12 rounded-full bg-sand-400 flex items-center justify-center text-primary-900 font-bold">S</div>
                  <div>
                    <p className="font-medium text-white">Seaside Electric</p>
                    <p className="text-sm text-primary-200">Electrical · Exuma</p>
                  </div>
                  <span className="ml-auto rounded-full bg-green-500/20 px-2 py-1 text-xs font-medium text-green-300">Verified</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
