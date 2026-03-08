"use client";

import { motion } from "framer-motion";
import Image from "next/image";

const ease = [0.16, 1, 0.3, 1] as const;

/* Luminous ellipses — glow only, positioned individually */
const glowEllipses = [
  { pos: { width: "900px", height: "700px", top: "-10%", right: "-5%" }, bg: "radial-gradient(ellipse at center, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 35%, transparent 70%)", blur: 40 },
  { pos: { width: "700px", height: "600px", top: "30%", left: "-15%" }, bg: "radial-gradient(ellipse at center, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 40%, transparent 70%)", blur: 50 },
  { pos: { width: "1000px", height: "500px", bottom: "5%", left: "50%", transform: "translateX(-50%)" }, bg: "radial-gradient(ellipse at center, rgba(204,255,0,0.045) 0%, rgba(255,255,255,0.015) 30%, transparent 65%)", blur: 60 },
  { pos: { width: "400px", height: "400px", top: "15%", right: "15%" }, bg: "radial-gradient(circle at center, rgba(255,255,255,0.09) 0%, transparent 60%)", blur: 30 },
  { pos: { width: "1400px", height: "1000px", top: "-20%", left: "50%", transform: "translateX(-50%)" }, bg: "radial-gradient(ellipse at center, rgba(255,255,255,0.04) 0%, transparent 60%)", blur: 80 },
] as const;

export function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-dark-base">
      {/* ── Glow ellipses (z-1) ── */}
      {glowEllipses.map((e, i) => (
        <div
          key={i}
          className="pointer-events-none absolute z-[1]"
          style={{ ...e.pos, background: e.bg, filter: `blur(${e.blur}px)` }}
        />
      ))}

      {/* ── Single dot texture layer (z-2), masked by union of ellipses ── */}
      <div
        className="pointer-events-none absolute inset-0 z-[2]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 0.8px, transparent 0.8px)",
          backgroundSize: "16px 16px",
          backgroundAttachment: "fixed",
          maskImage: [
            /* top-right glow — 900×700, top:-10% right:-5% → center ≈ 74%, 29% */
            "radial-gradient(ellipse 450px 350px at 74% 29%, black 0%, transparent 70%)",
            /* mid-left glow — 700×600, top:30% left:-15% → center ≈ 9%, 63% */
            "radial-gradient(ellipse 350px 300px at 9% 63%, black 0%, transparent 65%)",
            /* bottom-center lime — 1000×500, bottom:5% centered → center ≈ 50%, 72% */
            "radial-gradient(ellipse 500px 250px at 50% 72%, black 0%, transparent 55%)",
            /* accent near text — 400×400, top:15% right:15% → center ≈ 71%, 37% */
            "radial-gradient(circle 200px at 71% 37%, black 0%, transparent 60%)",
            /* deep bg — 1400×1000, top:-20% centered → center ≈ 50%, 36% */
            "radial-gradient(ellipse 700px 500px at 50% 36%, black 0%, transparent 60%)",
          ].join(", "),
          WebkitMaskImage: [
            "radial-gradient(ellipse 450px 350px at 74% 29%, black 0%, transparent 70%)",
            "radial-gradient(ellipse 350px 300px at 9% 63%, black 0%, transparent 65%)",
            "radial-gradient(ellipse 500px 250px at 50% 72%, black 0%, transparent 55%)",
            "radial-gradient(circle 200px at 71% 37%, black 0%, transparent 60%)",
            "radial-gradient(ellipse 700px 500px at 50% 36%, black 0%, transparent 60%)",
          ].join(", "),
          maskComposite: "add" as unknown as string,
          WebkitMaskComposite: "source-over",
        }}
      />

      {/* ── Vertical grid lines ── */}
      <div className="pointer-events-none absolute left-1/2 top-0 z-[4] hidden h-[180%] w-px -translate-x-1/2 bg-[rgba(54,54,54,0.3)] lg:block" />
      <div className="pointer-events-none absolute right-[80px] top-0 z-[4] hidden h-[180%] w-px bg-[rgba(54,54,54,0.18)] lg:block" />
      <div className="pointer-events-none absolute left-[80px] top-0 z-[4] hidden h-[180%] w-px bg-[rgba(54,54,54,0.12)] lg:block" />

      {/* ── Content ── */}
      <div className="relative z-10 mx-auto flex max-w-[1200px] flex-col px-5 pb-16 pt-[160px] sm:px-8 lg:flex-row lg:items-center lg:gap-[80px] lg:px-12 lg:pb-24 lg:pt-[200px] xl:gap-[120px]">
        {/* ── LEFT: Runner images ── */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, ease, delay: 0.1 }}
          className="relative mb-14 flex-shrink-0 lg:mb-0 lg:w-[520px]"
        >
          {/* Main runner image */}
          <div className="relative overflow-hidden rounded-3xl border border-white/[0.06] shadow-[0_30px_60px_rgba(0,0,0,0.5)]">
            <Image
              src="https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&h=1000&fit=crop&crop=faces"
              alt="Runner using Cadence app"
              width={800}
              height={1000}
              className="h-[400px] w-full object-cover sm:h-[480px] lg:h-[540px]"
              priority
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-dark-base/80 via-transparent to-dark-base/20" />

            {/* Overlay app badge */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6, ease }}
              className="absolute bottom-6 left-6 right-6 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-dark-surface/90 px-4 py-3 backdrop-blur-md"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#121212" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-white">Tempo Run completed</p>
                <p className="text-[11px] text-white/40">9.2 km &middot; 5:18 /km &middot; Build Phase</p>
              </div>
              <span className="font-mono text-[13px] font-semibold text-lime">+12%</span>
            </motion.div>
          </div>

          {/* Secondary runner image - floating offset */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8, ease }}
            className="absolute -bottom-8 -right-6 hidden w-[200px] overflow-hidden rounded-2xl border border-white/[0.06] shadow-[0_20px_40px_rgba(0,0,0,0.5)] sm:block"
          >
            <Image
              src="https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=500&fit=crop&crop=faces"
              alt="Runner training with Cadence"
              width={400}
              height={500}
              className="h-[240px] w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-dark-base/60 to-transparent" />
            <div className="absolute bottom-3 left-3 rounded-lg bg-dark-surface/80 px-2.5 py-1.5 backdrop-blur-sm">
              <span className="font-mono text-[11px] font-medium text-lime">168 bpm</span>
            </div>
          </motion.div>

          {/* Third runner - circle avatar */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7, duration: 0.6, ease }}
            className="absolute -left-4 top-[60px] hidden overflow-hidden rounded-full border-2 border-dark-base shadow-lg lg:block"
          >
            <Image
              src="https://images.unsplash.com/photo-1594882645126-14020914d58d?w=120&h=120&fit=crop&crop=faces"
              alt="Cadence runner"
              width={120}
              height={120}
              className="h-[64px] w-[64px] object-cover"
            />
          </motion.div>
        </motion.div>

        {/* ── RIGHT: Text content (Cryptik-style slide-in) ── */}
        <motion.div
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.15 }}
          className="flex-1 lg:max-w-[520px]"
        >
          {/* Badge pill with gradient border (Cryptik-style) */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5, ease }}
            className="relative mb-7 inline-flex overflow-hidden rounded-lg p-px"
          >
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-lime via-lime/30 to-dark-surface" />
            <div className="relative overflow-hidden flex items-center gap-2.5 rounded-[7px] bg-dark-elevated px-3.5 py-2">
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.5) 0.6px, transparent 0.6px)",
                  backgroundSize: "6px 6px",
                }}
              />
              <div className="relative h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-lime" />
                <span className="absolute -inset-1 animate-pulseRing rounded-full border border-lime" />
              </div>
              <span className="relative text-[12px] font-semibold uppercase tracking-[0.04em] text-white/60">
                AI Running Coach
              </span>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.25, ease }}
            className="bg-clip-text font-display text-[clamp(44px,6vw,72px)] font-bold uppercase leading-[0.92] tracking-[-0.02em] text-transparent"
            style={{
              backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.45) 0%, #ffffff 35%, #ffffff 55%, rgba(255,255,255,0.6) 100%)",
            }}
          >
            Run smarter.
            <br />
            Race{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(90deg, #CCFF00, #b8e600)" }}>
              faster.
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease }}
            className="mt-6 max-w-[420px] text-[15px] leading-[1.7] text-white/40"
          >
            Your AI coach analyzes your data, builds adaptive plans, and gets smarter with every run. Join 50,000+ runners training with purpose.
          </motion.p>

          {/* Stats row (Cryptik-style) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.6, ease }}
            className="mt-8 flex items-center gap-6"
          >
            <div>
              <div className="font-mono text-[22px] font-semibold tracking-tight text-white">50K+</div>
              <div className="text-[13px] text-white/30">Runners</div>
            </div>
            <div className="h-[40px] w-px bg-dark-border" />
            <div>
              <div className="font-mono text-[22px] font-semibold tracking-tight text-white">4.9<span className="text-lime">★</span></div>
              <div className="text-[13px] text-white/30">App Store</div>
            </div>
            <div className="h-[40px] w-px bg-dark-border" />
            <div>
              <div className="font-mono text-[22px] font-semibold tracking-tight text-white">87%</div>
              <div className="text-[13px] text-white/30">Improve in 8w</div>
            </div>
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6, ease }}
            className="mt-10 flex flex-col gap-3 sm:flex-row"
          >
            <a
              href="#download"
              className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full bg-lime px-8 py-4 text-[14px] font-semibold uppercase tracking-[0.02em] text-dark-base transition-transform hover:scale-[1.03] active:scale-[0.97] no-underline"
            >
              <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span className="relative z-10">Download Free</span>
            </a>
            <a
              href="#how"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-dark-border bg-transparent px-8 py-4 text-[14px] font-medium text-white/50 transition-all hover:border-white/20 hover:text-white no-underline"
            >
              See how it works
            </a>
          </motion.div>
        </motion.div>
      </div>

      {/* ── Diagonal transition (oblique cut from top-left to bottom-right) ── */}
      <div className="absolute bottom-0 left-0 z-20 w-full">
        <svg
          className="block w-full"
          viewBox="0 0 1440 200"
          fill="none"
          preserveAspectRatio="none"
          style={{ height: "clamp(100px, 14vw, 200px)" }}
        >
          {/* Diagonal: starts ~40% from left at the top, goes to bottom-right */}
          <path
            d="M0 200V120L1440 0V200H0Z"
            fill="#EDEEF2"
          />
        </svg>
      </div>
    </section>
  );
}
