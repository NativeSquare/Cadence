"use client";

import { motion } from "framer-motion";
import { PhoneMockup } from "./ui/PhoneMockup";
import { DashboardScreen } from "./ui/AppScreen";

export function DownloadCta() {
  return (
    <section className="relative overflow-hidden bg-dark-base px-5 py-20 sm:px-8 sm:py-28 lg:px-12 lg:py-32" id="download">
      <div className="pointer-events-none absolute inset-0 z-0 dark-dot-texture" />
      {/* Radial glow */}
      <div className="pointer-events-none absolute left-1/2 top-[30%] -translate-x-1/2 h-[600px] w-[800px] bg-[radial-gradient(ellipse,rgba(204,255,0,0.05)_0%,transparent_60%)]" />

      <div className="relative z-10 mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2 className="mx-auto mb-6 max-w-[680px] font-display text-[clamp(44px,6.5vw,80px)] font-bold uppercase leading-[0.92] text-white">
            Your next PR starts{" "}
            <span className="text-lime">today.</span>
          </h2>
          <p className="mx-auto mb-12 max-w-[400px] text-[15px] leading-[1.7] text-white/40">
            Download Cadence. Connect your watch. Get a plan you can trust.
          </p>
        </motion.div>

        {/* Download badges */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mb-20 flex flex-wrap justify-center gap-4"
        >
          <a
            href="#"
            className="inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-dark-base transition-transform hover:scale-[1.03] no-underline"
          >
            <svg width="20" height="24" viewBox="0 0 22 26" fill="#121212">
              <path d="M18.07 13.58c-.03-2.84 2.32-4.21 2.43-4.27-1.32-1.93-3.38-2.2-4.11-2.23-1.75-.18-3.42 1.03-4.31 1.03-.9 0-2.28-1.01-3.75-.98-1.93.03-3.71 1.13-4.7 2.85-2.01 3.48-.51 8.63 1.44 11.46.96 1.37 2.1 2.92 3.59 2.87 1.44-.06 1.99-.93 3.73-.93 1.74 0 2.23.93 3.75.9 1.55-.03 2.53-1.4 3.47-2.78 1.1-1.59 1.55-3.14 1.57-3.22-.03-.02-3.02-1.16-3.05-4.6l-.06-.1zM15.18 4.84c.79-.96 1.32-2.3 1.18-3.63-1.14.05-2.52.76-3.34 1.72-.73.85-1.38 2.21-1.2 3.52 1.27.1 2.56-.64 3.36-1.61z" />
            </svg>
            <div className="text-left">
              <div className="text-[10px] font-normal opacity-50">Download on the</div>
              <div className="text-[16px] font-semibold tracking-tight">App Store</div>
            </div>
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-dark-base transition-transform hover:scale-[1.03] no-underline"
          >
            <svg width="20" height="22" viewBox="0 0 22 24" fill="none">
              <path d="M1 1.5L12.5 12L1 22.5V1.5Z" fill="#4285F4" />
              <path d="M1 1.5L16.5 9L12.5 12L1 1.5Z" fill="#34A853" />
              <path d="M1 22.5L12.5 12L16.5 15L1 22.5Z" fill="#EA4335" />
              <path d="M16.5 9L21 11.5L16.5 15L12.5 12L16.5 9Z" fill="#FBBC05" />
            </svg>
            <div className="text-left">
              <div className="text-[10px] font-normal opacity-50">Get it on</div>
              <div className="text-[16px] font-semibold tracking-tight">Google Play</div>
            </div>
          </a>
        </motion.div>

        {/* Phone */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <PhoneMockup>
            <DashboardScreen />
          </PhoneMockup>
        </motion.div>
      </div>

      {/* Arch: dark into light FAQ */}
      <div className="absolute -bottom-px left-0 z-10 w-full">
        <svg className="block w-full" viewBox="0 0 1440 72" fill="none" preserveAspectRatio="none" style={{ height: "72px" }}>
          <path d="M0 0C0 0 360 72 720 72C1080 72 1440 0 1440 0V72H0V0Z" fill="#EDEEF2" />
        </svg>
      </div>
    </section>
  );
}
