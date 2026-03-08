"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    quote:
      "Cadence saw what I couldn't — I was overtraining every easy day. Two weeks of slowing down and my tempo pace dropped by 15 seconds.",
    name: "Sarah M.",
    level: "Intermediate",
    result: "1:38 half marathon",
    meta: "London · 12 weeks",
    avatar: "S",
  },
  {
    quote:
      "The plan adapted after my knee flared up. It didn't just delete sessions — it restructured everything around the injury. No other app does that.",
    name: "Thomas K.",
    level: "Advanced",
    result: "Sub-3:15 marathon",
    meta: "Berlin · 16 weeks",
    avatar: "T",
  },
  {
    quote:
      "I went from not running at all to completing my first 10K. The AI debrief after each run kept me motivated and accountable.",
    name: "Léa R.",
    level: "Beginner",
    result: "First 10K completed",
    meta: "Lyon · 8 weeks",
    avatar: "L",
  },
];

export function Testimonials() {
  return (
    <section className="bg-light-base px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-32" id="proof">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto mb-16 max-w-6xl text-center"
      >
        <div className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-light-text/40">
          Real Runners
        </div>
        <h2 className="mx-auto max-w-[700px] font-display text-[clamp(40px,5.5vw,68px)] font-bold uppercase leading-[0.95] tracking-[-0.01em] text-light-text">
          Results that speak{" "}
          <span className="text-lime-text">for themselves.</span>
        </h2>
      </motion.div>

      <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-3">
        {testimonials.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="group rounded-2xl border border-light-border bg-light-elevated p-7 shadow-[0_0_0_1px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
          >
            {/* Quote */}
            <div className="mb-3 text-3xl font-light leading-none text-light-text/10">
              &ldquo;
            </div>
            <p className="mb-6 text-[14px] leading-[1.7] text-light-muted">
              {t.quote}
            </p>

            {/* User */}
            <div className="flex items-center gap-3 border-t border-light-border pt-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-light-text text-sm font-bold text-light-elevated">
                {t.avatar}
              </div>
              <div>
                <div className="text-[14px] font-semibold text-light-text">{t.name}</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold text-light-text/70">{t.result}</span>
                  <span className="text-light-text/15">&middot;</span>
                  <span className="text-[11px] text-light-muted">{t.level}</span>
                </div>
                <div className="font-mono text-[10px] text-light-text/25">{t.meta}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
