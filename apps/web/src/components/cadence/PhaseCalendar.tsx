"use client";

import { motion } from "framer-motion";

const phases = [
  {
    name: "Base",
    color: "bg-phase-base",
    textColor: "text-phase-base",
    borderColor: "border-phase-base/20",
    weeks: "Weeks 1-4",
    description: "Build your aerobic foundation with easy runs and gradual volume increase.",
  },
  {
    name: "Build",
    color: "bg-phase-build",
    textColor: "text-phase-build",
    borderColor: "border-phase-build/20",
    weeks: "Weeks 5-10",
    description: "Introduce tempo runs, intervals, and race-specific workouts.",
  },
  {
    name: "Peak",
    color: "bg-phase-peak",
    textColor: "text-phase-peak",
    borderColor: "border-phase-peak/20",
    weeks: "Weeks 11-13",
    description: "Sharpen performance with high-intensity, lower volume training.",
  },
  {
    name: "Recovery",
    color: "bg-phase-recovery",
    textColor: "text-phase-recovery",
    borderColor: "border-phase-recovery/20",
    weeks: "Weeks 14-16",
    description: "Taper and recover. Active rest and easy running to absorb gains.",
  },
];

export function PhaseCalendar() {
  return (
    <section className="bg-light-base px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-32" id="how">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 text-center"
        >
          <div className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.12em] text-light-text/40">
            Training Phases
          </div>
          <h2 className="mx-auto max-w-[700px] font-display text-[clamp(40px,5.5vw,68px)] font-bold uppercase leading-[0.95] tracking-[-0.01em] text-light-text">
            Structured for{" "}
            <span className="text-lime-text">results.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-[480px] text-[15px] leading-[1.7] text-light-muted">
            Like a real coach, Cadence structures your season into phases. Each one has a purpose — and you always know where you are.
          </p>
        </motion.div>

        {/* Phase timeline bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 flex gap-1.5 overflow-hidden rounded-2xl"
        >
          <div className="flex-[4] bg-phase-base/15 py-3.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-phase-base">Base</span>
          </div>
          <div className="flex-[6] bg-phase-build/15 py-3.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-phase-build">Build</span>
          </div>
          <div className="flex-[3] bg-phase-peak/15 py-3.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-phase-peak">Peak</span>
          </div>
          <div className="flex-[3] bg-phase-recovery/15 py-3.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-phase-recovery">Recovery</span>
          </div>
        </motion.div>

        {/* Phase cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {phases.map((phase, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={`group rounded-2xl border ${phase.borderColor} bg-light-elevated p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03)] transition-all hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]`}
            >
              <div className="mb-4 flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${phase.color}`} />
                <span className={`font-mono text-[11px] font-semibold uppercase tracking-wider ${phase.textColor}`}>
                  {phase.name}
                </span>
              </div>
              <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-light-text/30">
                {phase.weeks}
              </p>
              <p className="text-[13px] leading-relaxed text-light-muted">
                {phase.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
