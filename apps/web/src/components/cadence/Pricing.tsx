"use client";

import { motion } from "framer-motion";
import { SectionArch } from "./ui/SectionArch";
import { useLocale } from "@/lib/i18n";

export function Pricing() {
  const { t } = useLocale();

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
        <div className="mb-4 font-mono text-[11px] font-medium tracking-[0.12em] text-lime">
          {t.pricing.tag}
        </div>
        <h2 className="mx-auto max-w-[700px] font-[family-name:var(--font-satoshi)] tracking-[-0.04em] text-[clamp(40px,5.5vw,68px)] font-bold leading-[0.95] tracking-[-0.01em] text-white">
          {t.pricing.headlinePre}
          <span className="text-lime">{t.pricing.headlineHighlight}</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[420px] text-[15px] leading-[1.7] text-white/40">
          {t.pricing.subtitle}
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
          <div className="mb-6 font-mono text-[10px] font-medium tracking-[0.08em] text-white/25">
            {t.pricing.freeTrialLabel}
          </div>
          <div className="font-mono text-5xl font-medium tracking-tight text-white">
            {t.pricing.freeTrialPrice}
            <span className="ml-1 text-base font-normal text-white/25">{t.pricing.freeTrialPeriod}</span>
          </div>
          <p className="mb-7 mt-3 text-[14px] text-white/35">
            {t.pricing.freeTrialDescription}
          </p>
          <ul className="mb-8 space-y-0">
            {t.pricing.freeTrialFeatures.map((f) => (
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
            {t.pricing.freeTrialButton}
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
            {t.pricing.proLabel}
          </div>
          <div className="font-mono text-5xl font-medium tracking-tight text-white">
            {t.pricing.proPrice}
            <span className="ml-1 text-base font-normal text-white/25">{t.pricing.proPeriod}</span>
          </div>
          <p className="mb-7 mt-3 text-[14px] text-white/35">
            {t.pricing.proDescription}
          </p>
          <ul className="mb-8 space-y-0">
            {t.pricing.proFeatures.map((f) => (
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
            {t.pricing.proButton}
          </a>
        </motion.div>
      </div>
      </div>
    </section>
  );
}
