"use client";

import { motion } from "framer-motion";
import { useLocale } from "@/lib/i18n";

const featureScreenshots = [
  "/screenshots/welcome_screen.png",
  "/screenshots/monthly-view.png",
  "/screenshots/chat-coach.png",
];

export function FeatureShowcase() {
  const { t } = useLocale();

  return (
    <section className="relative bg-dark-base px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-32" id="features">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto mb-24 max-w-6xl text-center"
      >
        <div className="mb-4 font-mono text-[11px] font-medium tracking-[0.12em] text-lime">
          {t.featureShowcase.tag}
        </div>
        <h2 className="mx-auto max-w-[600px] font-[family-name:var(--font-satoshi)] tracking-[-0.04em] text-[clamp(40px,5.5vw,68px)] font-bold leading-[0.95] text-white">
          {t.featureShowcase.headlinePre}
          <span className="text-lime">{t.featureShowcase.headlineHighlight}</span>
        </h2>
      </motion.div>

      {/* Features */}
      <div className="mx-auto max-w-6xl space-y-32 lg:space-y-44">
        {t.featureShowcase.features.map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={`flex flex-col items-center gap-14 lg:gap-24 ${
              i % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"
            }`}
          >
            {/* Text */}
            <div className="flex-1 lg:max-w-[460px]">
              <div className="mb-4 inline-flex rounded-full border border-dark-border-subtle bg-dark-surface px-3.5 py-1.5 font-mono text-[10px] font-semibold tracking-[0.08em] text-lime">
                {feature.tag}
              </div>
              <h3 className="mb-5 font-[family-name:var(--font-satoshi)] tracking-[-0.04em] text-[clamp(30px,4vw,48px)] font-bold leading-[1.05] text-white">
                {feature.title}
              </h3>
              <p className="text-[15px] leading-[1.7] text-white/40">
                {feature.description}
              </p>
            </div>

            {/* iPhone mockup with real screenshot */}
            <div className="flex-shrink-0">
              <div className="rounded-3xl border border-dark-border bg-gradient-to-br from-dark-card-from to-dark-card-to p-6 shadow-[0_4px_6px_rgba(0,0,0,0.25)] sm:p-8">
                <IPhoneMockup src={featureScreenshots[i]} alt={feature.title} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ── iPhone Mockup with screenshot ── */
function IPhoneMockup({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative mx-auto w-[240px] sm:w-[280px]">
      {/* Phone frame */}
      <div className="relative overflow-hidden rounded-[40px] border-[3px] border-[#3a3a3a] bg-black shadow-2xl shadow-black/50">
        {/* Screenshot — the screenshots already include the status bar */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="block w-full rounded-[37px]"
        />
      </div>

      {/* Side buttons */}
      <div className="absolute -left-[2px] top-[100px] h-[28px] w-[3px] rounded-l-sm bg-[#3a3a3a]" />
      <div className="absolute -left-[2px] top-[140px] h-[44px] w-[3px] rounded-l-sm bg-[#3a3a3a]" />
      <div className="absolute -left-[2px] top-[190px] h-[44px] w-[3px] rounded-l-sm bg-[#3a3a3a]" />
      <div className="absolute -right-[2px] top-[150px] h-[56px] w-[3px] rounded-r-sm bg-[#3a3a3a]" />
    </div>
  );
}
