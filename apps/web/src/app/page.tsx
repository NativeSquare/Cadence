import {
  ArrowRight,
  Brain,
  ChevronRight,
  Eye,
  Target,
  Watch,
  Zap,
} from "lucide-react";
import Image from "next/image";

/* ─────────────────────────── constants ─────────────────────────── */

const FEATURES = [
  {
    icon: Brain,
    title: "Live Coaching Intelligence",
    description:
      "Real-time narrative coaching that explains every decision in plain language — not just what to do, but why.",
  },
  {
    icon: Target,
    title: "Goal-Anchored Plans",
    description:
      "Periodized training plans tied to your specific race goals, target times, and event dates. Every session has a purpose.",
  },
  {
    icon: Watch,
    title: "Wearable Integration",
    description:
      "Seamlessly syncs with Garmin, COROS, and Apple Watch to analyze training load, heart rate, and recovery in real time.",
  },
  {
    icon: Eye,
    title: "Full Transparency",
    description:
      "No black-box decisions. Cadence shows its reasoning, flags uncertainty, and adapts when the data changes.",
  },
] as const;

const STEPS = [
  {
    step: "01",
    title: "Connect Your Data",
    description:
      "Link your wearable and import your training history. Cadence audits your fitness and builds a complete picture.",
  },
  {
    step: "02",
    title: "Get Your Plan",
    description:
      "Set your race goal and target time. Your AI coach builds a periodized plan and explains every choice it makes.",
  },
  {
    step: "03",
    title: "Train & Evolve",
    description:
      "Each day, Cadence calibrates your next session based on how you're responding — then tells you exactly why.",
  },
] as const;

/* ─────────────────────────── page ─────────────────────────── */

export default function Home() {
  return (
    <div className="selection:bg-[#D4FF3A]/30 selection:text-white">

      {/* ── Hero ── */}
      <section className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-6 pt-16">
        {/* Glow effect */}
        <div className="animate-pulse-glow pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="h-[500px] w-[700px] rounded-full bg-[#D4FF3A]/10 blur-[120px]" />
        </div>

        {/* Grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="animate-slide-up mb-8 inline-flex items-center gap-2 rounded-full border border-[#D4FF3A]/20 bg-[#D4FF3A]/5 px-4 py-1.5 text-sm text-[#D4FF3A]">
            <Zap className="size-3.5" />
            AI-Powered Running Coach
          </div>

          {/* Headline */}
          <h1 className="animate-slide-up animation-delay-200 text-5xl leading-[1.1] font-bold tracking-tight sm:text-6xl md:text-7xl">
            Train Smarter.
            <br />
            <span className="animate-gradient-shift bg-gradient-to-r from-[#D4FF3A] via-[#8DFF1A] to-[#D4FF3A] bg-clip-text text-transparent">
              Race Faster.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="animate-slide-up animation-delay-400 mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[#8E8E93] sm:text-xl">
            Cadence is your AI running coach that doesn&apos;t just tell you
            what to do — it explains{" "}
            <span className="text-white/90">why</span>. Personalized plans,
            wearable intelligence, and transparent reasoning for every session.
          </p>

          {/* CTAs */}
          <div className="animate-slide-up animation-delay-600 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#features"
              className="group inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-[#D4FF3A] to-[#8DFF1A] px-7 text-sm font-semibold text-black transition hover:shadow-[0_0_32px_rgba(212,255,58,0.3)]"
            >
              Explore Features
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#how-it-works"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-white/10 px-7 text-sm font-medium text-white/80 transition hover:border-white/20 hover:text-white"
            >
              How It Works
            </a>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <div className="flex h-8 w-5 items-start justify-center rounded-full border border-white/20 p-1">
            <div className="animate-float h-1.5 w-1 rounded-full bg-[#D4FF3A]" />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="relative px-6 py-32">
        <div className="mx-auto max-w-6xl">
          {/* Section header */}
          <div className="mb-16 max-w-2xl">
            <p className="mb-3 text-sm font-semibold tracking-widest text-[#D4FF3A] uppercase">
              Features
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Coaching that thinks <br className="hidden sm:block" />
              out loud.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-[#8E8E93]">
              Every feature is designed around one principle: you should always
              understand your training as well as your coach does.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid gap-6 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-white/5 bg-[#1C1C1E]/60 p-8 transition hover:border-[#D4FF3A]/10 hover:bg-[#1C1C1E]"
              >
                <div className="mb-5 flex size-12 items-center justify-center rounded-xl bg-[#D4FF3A]/10 text-[#D4FF3A] transition group-hover:bg-[#D4FF3A]/15">
                  <feature.icon className="size-6" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="leading-relaxed text-[#8E8E93]">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="relative px-6 py-32">
        {/* Subtle divider glow */}
        <div className="pointer-events-none absolute top-0 left-1/2 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#D4FF3A]/20 to-transparent" />

        <div className="mx-auto max-w-6xl">
          {/* Section header */}
          <div className="mb-16 text-center">
            <p className="mb-3 text-sm font-semibold tracking-widest text-[#D4FF3A] uppercase">
              How It Works
            </p>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              From first sync to race day.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-[#8E8E93]">
              Three steps to training that adapts to you — and tells you why.
            </p>
          </div>

          {/* Steps */}
          <div className="grid gap-8 md:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.step} className="relative text-center md:text-left">
                <span className="mb-4 inline-block font-mono text-4xl font-bold text-[#D4FF3A]/20">
                  {step.step}
                </span>
                <h3 className="mb-3 text-xl font-semibold">{step.title}</h3>
                <p className="leading-relaxed text-[#8E8E93]">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative px-6 py-32">
        <div className="pointer-events-none absolute top-0 left-1/2 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-[#D4FF3A]/20 to-transparent" />

        <div className="mx-auto max-w-3xl text-center">
          <div className="rounded-3xl border border-white/5 bg-[#1C1C1E]/40 p-12 sm:p-16">
            <Image
              src="/logo.png"
              alt="Cadence logo"
              width={64}
              height={64}
              className="mx-auto mb-6 rounded-2xl"
            />
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to run smarter?
            </h2>
            <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-[#8E8E93]">
              Cadence is coming soon. Be the first to experience AI coaching
              that thinks out loud.
            </p>
            <div className="mt-8">
              <a
                href="https://testflight.apple.com/join/FAYgzVWk"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-[#D4FF3A] to-[#8DFF1A] px-8 text-sm font-semibold text-black transition hover:shadow-[0_0_32px_rgba(212,255,58,0.3)]"
              >
                Get Early Access
                <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
