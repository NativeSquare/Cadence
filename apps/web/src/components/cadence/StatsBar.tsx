"use client";

import { motion } from "framer-motion";

const integrations = [
  { name: "Apple Watch", icon: "⌚" },
  { name: "Garmin", icon: "⊙" },
  { name: "COROS", icon: "◉" },
  { name: "Suunto", icon: "◎" },
  { name: "Strava Sync", icon: "▲" },
  { name: "Apple Health", icon: "♥" },
];

export function StatsBar() {
  return (
    <section className="relative z-30 -mt-8 bg-light-base px-5 pb-16 pt-10 sm:-mt-12 sm:px-8 sm:pb-20 sm:pt-12 lg:-mt-16 lg:px-12 lg:pb-24 lg:pt-14">
      <div className="mx-auto max-w-6xl">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 text-center text-[13px] font-medium uppercase tracking-[0.1em] text-light-text/30"
        >
          Connects with your gear
        </motion.p>
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 lg:gap-14">
          {integrations.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2.5 text-light-text/30 transition-colors hover:text-light-text/60"
            >
              <span className="text-lg">{item.icon}</span>
              <span className="text-[14px] font-medium tracking-tight">{item.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
