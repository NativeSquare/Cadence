"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";
import { useLocale } from "@/lib/i18n";

const ease = [0.16, 1, 0.3, 1] as const;

/* Runner images for bottom strip */
const runnerImages = [
  { src: "https://images.unsplash.com/photo-1594882645126-14020914d58d?w=400&h=500&fit=crop&crop=faces", alt: "Runner stretching" },
  { src: "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=400&h=500&fit=crop&crop=faces", alt: "Trail runner" },
  { src: "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=400&h=500&fit=crop&crop=faces", alt: "Runner training" },
  { src: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=400&h=500&fit=crop&crop=faces", alt: "Runner in park" },
  { src: "https://images.unsplash.com/photo-1486218119243-13883505764c?w=400&h=500&fit=crop&crop=faces", alt: "Marathon runner" },
];

/* Avatar URLs for social proof */
const avatars = [
  "https://images.unsplash.com/photo-1594882645126-14020914d58d?w=80&h=80&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=80&h=80&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=80&h=80&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1502904550040-7534597429ae?w=80&h=80&fit=crop&crop=faces",
];

export function Hero() {
  const { t } = useLocale();
  const waitlistCount = useQuery(api.waitlist.count);
  const displayCount = waitlistCount ?? 31;

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#f3f3f3]">
      {/* ── Subtle texture ── */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.06) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 45%, black 0%, transparent 100%)",
          WebkitMaskImage: "radial-gradient(ellipse 80% 70% at 50% 45%, black 0%, transparent 100%)",
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 mx-auto flex max-w-[720px] flex-col items-center px-5 pt-16 text-center sm:px-8 sm:pt-20">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#e5e5e5] bg-white/70 px-4 py-2 backdrop-blur-sm"
        >
          <div className="relative h-2 w-2">
            <span className="absolute inset-0 rounded-full bg-[#98fe00]" />
            <span className="absolute -inset-0.5 animate-pulseRing rounded-full border border-[#98fe00]" />
          </div>
          <span className="text-[13px] font-medium text-[#797979]">
            {t.hero.badge}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease }}
          className="font-[family-name:var(--font-satoshi)] text-[48px] font-bold leading-[0.9] tracking-[-0.04em] text-[#131313] sm:text-[64px] lg:text-[80px]"
        >
          {t.hero.headline1}
          <br />
          {t.hero.headline2pre}
          <span className="relative inline-block -rotate-1 px-3 py-1">
            <span className="absolute inset-0 -z-10 rounded-sm bg-[#98fe00]" />
            {t.hero.headline2highlight}
          </span>
          {t.hero.headline2post}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease }}
          className="mt-6 max-w-[500px] text-[16px] leading-[1.6] text-[#797979] sm:text-[18px]"
        >
          {t.hero.subtitle}
        </motion.p>

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45, ease }}
          className="mt-8 flex items-center gap-3"
        >
          <div className="flex -space-x-2.5">
            {avatars.map((src, i) => (
              <div
                key={i}
                className="h-8 w-8 overflow-hidden rounded-full border-2 border-white"
              >
                <Image
                  src={src}
                  alt=""
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
          <span className="text-[13px] text-[#797979]">
            {t.hero.socialProofPre}
            <span className="font-semibold text-[#131313]">{displayCount.toLocaleString()}+</span>
            {t.hero.socialProofPost}
          </span>
        </motion.div>

        {/* Waitlist CTA */}
        <WaitlistForm />
      </div>

      {/* ── Runner images — horizontal strip (Rituals style) ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6, ease }}
        className="z-10 mt-12 w-full pb-0 sm:mt-16"
      >
        {/* Edge-to-edge row, images overflow viewport */}
        <div className="flex items-center justify-center gap-3 sm:gap-4">
          {runnerImages.map((img, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 + i * 0.08, duration: 0.5, ease }}
              className={`flex-shrink-0 overflow-hidden rounded-2xl ${
                i === 2
                  ? "h-[220px] w-[170px] sm:h-[280px] sm:w-[210px] lg:h-[320px] lg:w-[240px] shadow-[0_16px_50px_rgba(0,0,0,0.1)]"
                  : "h-[160px] w-[130px] sm:h-[220px] sm:w-[170px] lg:h-[260px] lg:w-[200px]"
              }`}
            >
              <Image
                src={img.src}
                alt={img.alt}
                width={400}
                height={500}
                className="h-full w-full object-cover"
                priority={i === 2}
              />
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}

/* ── Confetti particles ── */
function ConfettiBurst() {
  const particles = Array.from({ length: 24 }, (_, i) => {
    const angle = (i / 24) * 360;
    const distance = 60 + Math.random() * 80;
    const x = Math.cos((angle * Math.PI) / 180) * distance;
    const y = Math.sin((angle * Math.PI) / 180) * distance;
    const colors = ["#98fe00", "#131313", "#e5e5e5", "#98fe00", "#3a3a3a"];
    const color = colors[i % colors.length];
    const size = 4 + Math.random() * 4;
    const rotation = Math.random() * 360;
    return { x, y, color, size, rotation, delay: Math.random() * 0.15 };
  });

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-visible">
      {particles.map((p, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.3, rotate: p.rotation }}
          transition={{ duration: 0.8, delay: p.delay, ease: [0.16, 1, 0.3, 1] }}
          className="absolute left-1/2 top-1/2 rounded-sm"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
          }}
        />
      ))}
    </div>
  );
}

/* ── Animated counter ── */
function AnimatedCount({ value }: { value: number }) {
  const [display, setDisplay] = useState(value - 1);

  useEffect(() => {
    const timer = setTimeout(() => setDisplay(value), 400);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <motion.span
      key={display}
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="inline-block font-[family-name:var(--font-satoshi)] text-[40px] font-bold tracking-[-0.02em] text-[#131313] sm:text-[48px]"
    >
      {display.toLocaleString()}
    </motion.span>
  );
}

/* ── Waitlist Form ── */
function WaitlistForm() {
  const { t, locale } = useLocale();
  const joinWaitlist = useMutation(api.waitlist.join);
  const waitlistCount = useQuery(api.waitlist.count);
  const displayCount = waitlistCount ?? 31;
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "success" | "already" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setState("loading");
    try {
      const result = await joinWaitlist({ email, source: "hero", locale });
      setState(result.alreadyJoined ? "already" : "success");
    } catch {
      setState("error");
    }
  };

  const submitted = state === "success" || state === "already";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.6, ease }}
      className="mt-8 w-full max-w-[520px]"
    >
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.form
            key="form"
            onSubmit={handleSubmit}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.hero.inputPlaceholder}
              className="h-[52px] flex-1 rounded-full border border-[#e5e5e5] bg-white px-6 text-[14px] text-[#131313] placeholder:text-[#b4b4b4] outline-none transition-all focus:border-[#131313] focus:ring-1 focus:ring-[#131313]/10"
            />
            <button
              type="submit"
              disabled={state === "loading"}
              className="group relative inline-flex h-[52px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-[#131313] px-7 text-[14px] font-semibold text-white transition-all hover:bg-[#3a3a3a] active:scale-[0.97] disabled:opacity-70"
            >
              <span className="relative z-10">
                {state === "loading" ? t.hero.buttonLoading : t.hero.button}
              </span>
              <svg className="relative z-10" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </motion.form>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="relative flex flex-col items-center gap-4 rounded-3xl border border-[#e5e5e5] bg-white px-8 py-8 shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
          >
            {/* Confetti burst */}
            {state === "success" && <ConfettiBurst />}

            {/* Checkmark with pulse */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#98fe00]">
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#233802" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </motion.svg>
              </div>
              {/* Pulse ring */}
              <motion.div
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="absolute inset-0 rounded-full border-2 border-[#98fe00]"
              />
            </motion.div>

            {/* Title */}
            <p className="text-[18px] font-semibold text-[#131313]">
              {state === "already" ? t.hero.already : t.hero.success}
            </p>

            {/* Counter — you are #N */}
            {state === "success" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="flex flex-col items-center"
              >
                <span className="text-[11px] font-medium tracking-[0.1em] text-[#b4b4b4]">
                  {t.hero.youAreNumber}
                </span>
                <AnimatedCount value={displayCount} />
              </motion.div>
            )}

            {/* Sub text */}
            <p className="max-w-[300px] text-center text-[13px] leading-[1.6] text-[#797979]">
              {state === "already" ? t.hero.alreadySub : t.hero.successSub}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {state === "error" && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 text-center text-[13px] text-red-500"
        >
          {t.hero.error}
        </motion.p>
      )}

      {!submitted && (
        <p className="mt-3 text-center text-[12px] text-[#797979]/60">
          {t.hero.disclaimer}
        </p>
      )}
    </motion.div>
  );
}
