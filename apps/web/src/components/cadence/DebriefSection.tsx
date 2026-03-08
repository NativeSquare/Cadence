"use client";

import { motion } from "framer-motion";
import { PhoneMockup } from "./ui/PhoneMockup";
import { DebriefScreen } from "./ui/AppScreen";
import { SectionArch } from "./ui/SectionArch";

const chatMessages = [
  {
    role: "coach" as const,
    text: "Nice tempo session today! Your pace was remarkably consistent — only 0.3% variation across all splits.",
  },
  {
    role: "coach" as const,
    text: "Heart rate stayed in Zone 3 for 82% of the run. That's exactly where you should be for tempo work.",
  },
  {
    role: "user" as const,
    text: "My legs felt heavy in the last 2km though.",
  },
  {
    role: "coach" as const,
    text: "That's normal at this point in Build phase. Your cumulative fatigue is at 64%. Tomorrow is a recovery day — I've adjusted the pace down by 15 sec/km.",
  },
];

export function DebriefSection() {
  return (
    <section className="relative bg-dark-base pt-28 pb-20 sm:pt-36 sm:pb-28 lg:pt-40 lg:pb-32">
      <div className="pointer-events-none absolute inset-0 z-0 dark-dot-texture" />
      {/* Arch: light hanging into dark at top */}
      <SectionArch variant="top-into-dark" />

      <div className="px-5 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center gap-16 lg:flex-row lg:gap-24">
            {/* Phone in gradient card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="flex-shrink-0"
            >
              <div className="rounded-3xl border border-dark-border bg-gradient-to-br from-dark-card-from to-dark-card-to p-8 shadow-[0_4px_6px_rgba(0,0,0,0.25)]">
                <PhoneMockup>
                  <DebriefScreen />
                </PhoneMockup>
              </div>
            </motion.div>

            {/* Content */}
            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-lime">
                  Post-Run Debrief
                </div>
                <h2 className="mb-5 font-display text-[clamp(36px,4.5vw,56px)] font-bold uppercase leading-[1.05] text-white">
                  What happens after{" "}
                  <span className="text-lime">every run.</span>
                </h2>
                <p className="mb-10 max-w-[440px] text-[15px] leading-[1.7] text-white/40">
                  Your AI coach analyzes every session in real time. Pace consistency, heart rate zones, cadence patterns — then gives you feedback that actually helps you improve.
                </p>
              </motion.div>

              {/* Chat */}
              <div className="space-y-3">
                {chatMessages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[400px] rounded-2xl px-4 py-3 text-[13px] leading-relaxed ${
                        msg.role === "coach"
                          ? "border border-dark-border bg-gradient-to-br from-dark-card-from to-dark-card-to text-white/65"
                          : "bg-dark-elevated text-white/50"
                      }`}
                    >
                      {msg.role === "coach" && (
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-lime" />
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-lime/60">Coach IA</span>
                        </div>
                      )}
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Arch: dark into light at bottom */}
      <div className="absolute -bottom-px left-0 z-10 w-full">
        <svg className="block w-full" viewBox="0 0 1440 72" fill="none" preserveAspectRatio="none" style={{ height: "72px" }}>
          <path d="M0 0C0 0 360 72 720 72C1080 72 1440 0 1440 0V72H0V0Z" fill="#EDEEF2" />
        </svg>
      </div>
    </section>
  );
}
