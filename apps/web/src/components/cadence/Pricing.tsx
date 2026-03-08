"use client";

import { motion } from "framer-motion";
import { SectionArch } from "./ui/SectionArch";

export function Pricing() {
  return (
    <section className="relative bg-dark-base pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-40 lg:pb-32" id="pricing">
      <div className="pointer-events-none absolute inset-0 z-0 dark-dot-texture" />
      {/* Arch: light into dark */}
      <SectionArch variant="top-into-dark" />

      <div className="px-5 sm:px-8 lg:px-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto mb-16 max-w-6xl text-center"
      >
        <div className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-lime">
          Pricing
        </div>
        <h2 className="mx-auto max-w-[700px] font-display text-[clamp(40px,5.5vw,68px)] font-bold uppercase leading-[0.95] tracking-[-0.01em] text-white">
          Start free.{" "}
          <span className="text-lime">Stay coached.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[420px] text-[15px] leading-[1.7] text-white/40">
          7-day free trial, cancel anytime. No credit card required.
        </p>
      </motion.div>

      <div className="mx-auto grid max-w-[760px] gap-5 lg:grid-cols-2">
        {/* Free trial */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col rounded-2xl border border-dark-border bg-gradient-to-br from-dark-card-from to-dark-card-to p-8 lg:p-10"
        >
          <div className="mb-6 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-white/25">
            Free Trial
          </div>
          <div className="font-mono text-5xl font-medium tracking-tight text-white">
            &euro;0
            <span className="ml-1 text-base font-normal text-white/25">/7 days</span>
          </div>
          <p className="mb-7 mt-3 text-[14px] text-white/35">
            Full access. See if Cadence is right for you.
          </p>
          <ul className="mb-8 space-y-0">
            {[
              "Full onboarding conversation",
              "Runner profile + radar chart",
              "10-week volume plan",
              "Weekly structure",
              "Decision audit",
            ].map((f) => (
              <li
                key={f}
                className="flex items-center gap-2.5 border-b border-dark-border-subtle py-3 text-[13px] text-white/50"
              >
                <span className="text-[11px] text-lime">&#10003;</span>
                {f}
              </li>
            ))}
          </ul>
          <a
            href="#download"
            className="mt-auto flex w-full items-center justify-center rounded-full border border-dark-border bg-transparent px-4 py-3.5 text-[14px] font-medium text-white/60 transition-all hover:border-white/20 hover:text-white no-underline"
          >
            Start Free Trial
          </a>
        </motion.div>

        {/* Pro */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col rounded-2xl border border-lime/20 bg-gradient-to-br from-dark-card-from to-dark-card-to p-8 lg:p-10"
        >
          <div className="mb-6 inline-flex w-fit rounded-full bg-lime/10 px-3.5 py-1.5 font-mono text-[10px] font-medium tracking-[0.06em] text-lime">
            RECOMMENDED
          </div>
          <div className="font-mono text-5xl font-medium tracking-tight text-white">
            &euro;9.99
            <span className="ml-1 text-base font-normal text-white/25">/month</span>
          </div>
          <p className="mb-7 mt-3 text-[14px] text-white/35">
            Everything in trial, plus continuous coaching.
          </p>
          <ul className="mb-8 space-y-0">
            {[
              "Unlimited plan adaptations",
              "Daily session adjustments",
              "Injury-responsive reshaping",
              "Race day predictions",
              "Priority wearable sync",
              "Full coaching history",
            ].map((f) => (
              <li
                key={f}
                className="flex items-center gap-2.5 border-b border-dark-border-subtle py-3 text-[13px] text-white/50"
              >
                <span className="text-[11px] text-lime">&#10003;</span>
                {f}
              </li>
            ))}
          </ul>
          <a
            href="#download"
            className="mt-auto flex w-full items-center justify-center rounded-full bg-lime px-4 py-3.5 text-[14px] font-semibold text-dark-base transition-all hover:scale-[1.02] active:scale-[0.98] no-underline"
          >
            Get Started
          </a>
        </motion.div>
      </div>
      </div>
    </section>
  );
}
