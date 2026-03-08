"use client";

import { motion } from "framer-motion";
import { useState } from "react";

const faqs = [
  {
    q: "How does Cadence differ from Strava or Nike Run Club?",
    a: "Strava and NRC are trackers — they record what you did. Cadence is a coach — it tells you what to do next and why. Every plan adapts in real time based on your actual performance data.",
  },
  {
    q: "Do I need a smartwatch to use Cadence?",
    a: "No. You can manually log runs or answer questions about your sessions. However, connecting a watch (Apple Watch, Garmin, COROS) gives the AI much richer data to work with.",
  },
  {
    q: "How does the AI build my plan?",
    a: "Cadence analyzes your running history, goals, available days, and current fitness level. It uses periodization principles (Base → Build → Peak → Recovery) and adjusts the plan after every session.",
  },
  {
    q: "What happens if I miss a training day?",
    a: "The plan reshapes automatically. Cadence doesn't just skip the session — it recalculates your weekly volume, adjusts upcoming intensity, and keeps you on track for your goal.",
  },
  {
    q: "Is it suitable for beginners?",
    a: "Absolutely. Cadence adapts to all levels. Whether you're running your first 5K or training for an ultra, the AI calibrates to your current fitness and progresses you safely.",
  },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="relative bg-light-base px-5 py-20 pb-32 sm:px-8 sm:py-28 sm:pb-36 lg:px-12 lg:py-32 lg:pb-40" id="faq">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="mb-14 text-center"
      >
        <div className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-light-text/40">
          FAQ
        </div>
        <h2 className="mx-auto max-w-[700px] font-display text-[clamp(40px,5.5vw,68px)] font-bold uppercase leading-[0.95] tracking-[-0.01em] text-light-text">
          Questions you might have.
        </h2>
      </motion.div>

      <div className="mx-auto max-w-[720px] space-y-2.5">
        {faqs.map((faq, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ duration: 0.4, delay: i * 0.04, ease: [0.16, 1, 0.3, 1] }}
          >
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="flex w-full items-center justify-between rounded-2xl border border-light-border bg-light-elevated px-6 py-5 text-left shadow-[0_0_0_1px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_4px_16px_rgba(0,0,0,0.05)]"
            >
              <span className="pr-4 text-[15px] font-medium text-light-text/80">{faq.q}</span>
              <span
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium transition-all duration-300 ${
                  open === i
                    ? "bg-light-text text-light-elevated rotate-45"
                    : "bg-light-base text-light-text/30"
                }`}
              >
                +
              </span>
            </button>
            <div
              className={`overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
                open === i ? "max-h-[300px]" : "max-h-0"
              }`}
            >
              <p className="px-6 pb-2 pt-3 text-[14px] leading-[1.7] text-light-muted">
                {faq.a}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Arch: light into dark footer */}
      <div className="absolute -bottom-px left-0 z-10 w-full">
        <svg className="block w-full" viewBox="0 0 1440 72" fill="none" preserveAspectRatio="none" style={{ height: "72px" }}>
          <path d="M0 72C0 72 360 0 720 0C1080 0 1440 72 1440 72V72H0V72Z" fill="#121212" />
        </svg>
      </div>
    </section>
  );
}
