"use client";

import { motion } from "framer-motion";
import { PhoneMockup } from "./ui/PhoneMockup";
import { DashboardScreen, CalendarScreen, DebriefScreen } from "./ui/AppScreen";

const features = [
  {
    tag: "Adaptive Plans",
    title: "A plan that evolves with you.",
    description:
      "No static templates. Cadence builds your training plan from your actual data — and reshapes it after every single run. Missed a session? It adapts. Feeling strong? It pushes you.",
    screen: <DashboardScreen />,
  },
  {
    tag: "Phase System",
    title: "See the bigger picture.",
    description:
      "Your training is structured into phases — Base, Build, Peak, Recovery. Each phase has a clear purpose, and you always know exactly where you stand in your progression.",
    screen: <CalendarScreen />,
  },
  {
    tag: "AI Debrief",
    title: "Your coach talks back.",
    description:
      "After every run, your AI coach analyzes pace consistency, heart rate zones, cadence patterns, and more. You get actionable feedback — not just numbers.",
    screen: <DebriefScreen />,
  },
];

export function FeatureShowcase() {
  return (
    <section className="relative bg-dark-base px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-32" id="features">
      <div className="pointer-events-none absolute inset-0 z-0 dark-dot-texture" />
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto mb-24 max-w-6xl text-center"
      >
        <div className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-lime">
          Your AI Coach
        </div>
        <h2 className="mx-auto max-w-[600px] font-display text-[clamp(40px,5.5vw,68px)] font-bold uppercase leading-[0.95] tracking-[-0.01em] text-white">
          Built to make you{" "}
          <span className="text-lime">faster.</span>
        </h2>
      </motion.div>

      {/* Features */}
      <div className="mx-auto max-w-6xl space-y-32 lg:space-y-44">
        {features.map((feature, i) => (
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
              <div className="mb-4 inline-flex rounded-full border border-dark-border-subtle bg-dark-surface px-3.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-lime">
                {feature.tag}
              </div>
              <h3 className="mb-5 font-display text-[clamp(30px,4vw,48px)] font-bold uppercase leading-[1.05] text-white">
                {feature.title}
              </h3>
              <p className="text-[15px] leading-[1.7] text-white/40">
                {feature.description}
              </p>
            </div>

            {/* Phone mockup in gradient card */}
            <div className="flex-shrink-0">
              <div className="rounded-3xl border border-dark-border bg-gradient-to-br from-dark-card-from to-dark-card-to p-8 shadow-[0_4px_6px_rgba(0,0,0,0.25)]">
                <PhoneMockup>
                  {feature.screen}
                </PhoneMockup>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
