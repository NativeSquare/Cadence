import { ScrollReveal } from "@/components/landing/scroll-reveal";
import { HeroTerminal } from "@/components/landing/hero-terminal";
import { Marquee } from "@/components/landing/marquee";
import {
  StepCardWaveform,
  StepCardGraph,
  StepCardCalendar,
} from "@/components/landing/step-cards";
import { RadarChart } from "@/components/landing/radar-chart";
import { AuditAccordion } from "@/components/landing/audit-accordion";
import { FaqAccordion } from "@/components/landing/faq-accordion";

export default function Home() {
  return (
    <div className="selection:bg-[#C8FF00]/30 selection:text-white">
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative flex min-h-screen flex-col justify-center overflow-hidden px-5 pb-[60px] pt-[120px] sm:px-8 sm:pb-20 sm:pt-[140px] lg:px-12">
        {/* Glow effects */}
        <div className="pointer-events-none absolute -right-[200px] -top-[200px] h-[800px] w-[800px] bg-[radial-gradient(circle,rgba(200,255,0,0.04)_0%,transparent_60%)]" />
        <div className="pointer-events-none absolute -bottom-[300px] -left-[200px] h-[600px] w-[600px] bg-[radial-gradient(circle,rgba(200,255,0,0.02)_0%,transparent_60%)]" />

        {/* Tag */}
        <div className="mb-8 inline-flex w-fit animate-fadeUp items-center gap-2 rounded-full border border-[#C8FF00]/15 bg-[rgba(200,255,0,0.12)] px-4 py-1.5">
          <div className="relative h-1.5 w-1.5">
            <span className="absolute inset-0 rounded-full bg-[#C8FF00]" />
            <span className="absolute -inset-1 animate-pulseRing rounded-full border border-[#C8FF00]" />
          </div>
          <span className="font-mono text-[11px] font-medium tracking-[0.04em] text-white/70">
            <b className="font-semibold text-[#C8FF00]">12,847</b> runners
            training right now
          </span>
        </div>

        {/* Headline */}
        <h1 className="max-w-[900px] animate-fadeUp animation-delay-100 text-[clamp(52px,7.5vw,96px)] font-light leading-[1.05] tracking-[-0.04em] text-white/[0.92]">
          Your coach sees
          <br />
          what{" "}
          <em className="not-italic font-medium text-[#C8FF00]">
            you can&apos;t.
          </em>
        </h1>

        {/* Sub */}
        <p className="mt-7 max-w-[540px] animate-fadeUp animation-delay-250 text-xl font-light leading-[1.55] tracking-[-0.01em] text-white/45">
          Cadence is an AI running coach that analyzes your data, builds
          adaptive plans, and shows you <em className="not-italic">why</em>{" "}
          every decision was made. Not a template. A real coach.
        </p>

        {/* Actions */}
        <div className="mt-12 flex animate-fadeUp flex-col gap-3.5 animation-delay-400 sm:flex-row">
          <a
            href="#download"
            className="inline-flex items-center justify-center gap-2.5 rounded-[14px] bg-[#C8FF00] px-9 py-[18px] text-[17px] font-semibold tracking-[-0.01em] text-black transition-transform hover:scale-[1.03] active:scale-[0.97]"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                d="M9 2V12M9 12L5 8M9 12L13 8"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 14V15C2 15.55 2.45 16 3 16H15C15.55 16 16 15.55 16 15V14"
                stroke="black"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Download Free
          </a>
          <a
            href="#how"
            className="inline-flex items-center justify-center gap-2.5 rounded-[14px] border border-white/[0.08] bg-white/[0.03] px-9 py-[18px] text-[17px] font-normal tracking-[-0.01em] text-white/70 transition-colors hover:border-white/25 hover:text-white/[0.92]"
          >
            See how it works
          </a>
        </div>

        {/* Terminal */}
        <HeroTerminal />
      </section>

      {/* ═══════════════ MARQUEE ═══════════════ */}
      <Marquee />

      {/* ═══════════════ HOW IT WORKS ═══════════════ */}
      <section
        className="px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-[120px]"
        id="how"
      >
        <ScrollReveal>
          <div className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[#C8FF00]">
            How It Works
          </div>
          <h2 className="mb-5 max-w-[700px] text-[clamp(36px,4.5vw,56px)] font-light leading-[1.1] tracking-[-0.03em] text-white/[0.92]">
            Three minutes to a
            <br />
            <em className="not-italic font-medium text-[#C8FF00]">
              real coaching plan.
            </em>
          </h2>
          <p className="max-w-[520px] text-lg font-light leading-[1.6] tracking-[-0.01em] text-white/45">
            No questionnaire. A conversation. Cadence asks the right questions,
            processes your answers in real time, and builds a plan you can
            actually see the reasoning behind.
          </p>
        </ScrollReveal>

        <div className="mt-16 grid gap-5 lg:grid-cols-3">
          <ScrollReveal delay={1}>
            <StepCardWaveform />
          </ScrollReveal>
          <ScrollReveal delay={2}>
            <StepCardGraph />
          </ScrollReveal>
          <ScrollReveal delay={3}>
            <StepCardCalendar />
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════ THE DIFFERENCE ═══════════════ */}
      <section
        className="px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-[120px]"
        id="features"
      >
        <ScrollReveal>
          <div className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[#C8FF00]">
            The Difference
          </div>
          <h2 className="mb-5 max-w-[700px] text-[clamp(36px,4.5vw,56px)] font-light leading-[1.1] tracking-[-0.03em] text-white/[0.92]">
            Not another{" "}
            <em className="not-italic font-medium text-[#C8FF00]">
              training template.
            </em>
          </h2>
          <p className="max-w-[520px] text-lg font-light leading-[1.6] tracking-[-0.01em] text-white/45">
            Most apps give you a plan and hope for the best. Cadence gives you a
            coach that adapts, explains, and gets smarter over time.
          </p>
        </ScrollReveal>

        <div className="mt-16 grid gap-6 lg:grid-cols-2">
          {/* Them */}
          <ScrollReveal delay={1}>
            <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.015] p-8 md:p-9">
              <div className="mb-6 flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-white/25">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <line
                    x1="3"
                    y1="3"
                    x2="11"
                    y2="11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <line
                    x1="11"
                    y1="3"
                    x2="3"
                    y2="11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
                Other apps
              </div>
              {[
                "Static plan generated once, never changes",
                "Generic template based on distance selection",
                "No explanation for why sessions exist",
                "Miss a run? You're on your own",
                "Same plan whether you ran 20km or 80km last week",
              ].map((text, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 py-3.5 ${i < 4 ? "border-b border-white/[0.08]" : ""}`}
                >
                  <span className="mt-0.5 flex-shrink-0 text-sm text-white/25">
                    →
                  </span>
                  <p className="text-[15px] font-light leading-[1.5] text-white/45">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
          {/* Us */}
          <ScrollReveal delay={2}>
            <div className="rounded-[20px] border border-[#C8FF00]/30 bg-[rgba(200,255,0,0.06)] p-8 md:p-9">
              <div className="mb-6 flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-[#C8FF00]">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M3 7L6 10L11 4"
                    stroke="#C8FF00"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Cadence
              </div>
              {[
                "Plan adapts after every single run you log",
                "Built from your actual GPS data and conversation",
                <>
                  <strong>Decision Audit</strong> — see why every choice was
                  made
                </>,
                "Missed a run? Plan reshapes around it automatically",
                "Knows your injury history, recovery style, and limits",
              ].map((text, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 py-3.5 ${i < 4 ? "border-b border-white/[0.08]" : ""}`}
                >
                  <span className="mt-0.5 flex-shrink-0 text-sm text-[#C8FF00]">
                    →
                  </span>
                  <p className="text-[15px] font-light leading-[1.5] text-white/70">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════ RADAR / DECISION AUDIT ═══════════════ */}
      <section className="px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-[120px]">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          <div>
            <ScrollReveal>
              <div className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[#C8FF00]">
                Visible Intelligence
              </div>
              <h2 className="mb-5 max-w-[700px] text-[clamp(36px,4.5vw,56px)] font-light leading-[1.1] tracking-[-0.03em] text-white/[0.92]">
                Every decision,{" "}
                <em className="not-italic font-medium text-[#C8FF00]">
                  explained.
                </em>
              </h2>
              <p className="max-w-[520px] text-lg font-light leading-[1.6] tracking-[-0.01em] text-white/45">
                Cadence doesn&apos;t hide behind a black box. Your runner
                profile, projected finish, and every coaching choice comes with
                reasoning you can inspect.
              </p>
            </ScrollReveal>

            <ScrollReveal delay={2}>
              <AuditAccordion />
            </ScrollReveal>
          </div>

          <ScrollReveal delay={1}>
            <div className="flex justify-center">
              <RadarChart />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section
        className="px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-[120px]"
        id="proof"
      >
        <ScrollReveal>
          <div className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[#C8FF00]">
            Real Runners
          </div>
          <h2 className="mb-5 max-w-[700px] text-[clamp(36px,4.5vw,56px)] font-light leading-[1.1] tracking-[-0.03em] text-white/[0.92]">
            Results that speak{" "}
            <em className="not-italic font-medium text-[#C8FF00]">
              for themselves.
            </em>
          </h2>
        </ScrollReveal>

        <div className="mt-16 grid gap-4 lg:grid-cols-3">
          {[
            {
              quote:
                "Cadence saw what I couldn't — I was overtraining every easy day. Two weeks of slowing down and my tempo pace dropped by 15 seconds.",
              name: "Sarah M.",
              initial: "S",
              result: "1:38 half marathon",
              meta: "London · 12 weeks",
            },
            {
              quote:
                "The plan adapted after my knee flared up. It didn't just delete sessions — it restructured everything around the injury. No other app does that.",
              name: "Thomas K.",
              initial: "T",
              result: "Sub-3:15 marathon",
              meta: "Berlin · 16 weeks",
            },
            {
              quote:
                "I went from not running at all to completing my first 10K. The decision audit sold me — I finally understand why I'm doing each run.",
              name: "Léa R.",
              initial: "L",
              result: "First 10K completed",
              meta: "Lyon · 8 weeks",
            },
          ].map((t, i) => (
            <ScrollReveal key={i} delay={(i + 1) as 1 | 2 | 3}>
              <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.03] p-7 transition-all hover:-translate-y-1 hover:border-[#C8FF00]/[0.12]">
                <div className="mb-1 text-4xl font-light leading-none text-[#C8FF00] opacity-30">
                  &ldquo;
                </div>
                <p className="mb-6 text-base font-light leading-[1.55] tracking-[-0.01em] text-white/70">
                  {t.quote}
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full border-[1.5px] border-[#C8FF00]/20 bg-[rgba(200,255,0,0.12)] text-sm font-semibold text-[#C8FF00]">
                    {t.initial}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white/[0.92]">
                      {t.name}
                    </div>
                    <div className="font-mono text-xs text-[#C8FF00]">
                      {t.result}
                    </div>
                    <div className="font-mono text-[10px] text-white/25">
                      {t.meta}
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </section>

      {/* ═══════════════ PRICING ═══════════════ */}
      <section
        className="px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-[120px]"
        id="pricing"
      >
        <ScrollReveal>
          <div className="mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[#C8FF00]">
            Pricing
          </div>
          <h2 className="mb-5 max-w-[700px] text-[clamp(36px,4.5vw,56px)] font-light leading-[1.1] tracking-[-0.03em] text-white/[0.92]">
            Start free.{" "}
            <em className="not-italic font-medium text-[#C8FF00]">
              Stay coached.
            </em>
          </h2>
          <p className="max-w-[520px] text-lg font-light leading-[1.6] tracking-[-0.01em] text-white/45">
            7-day free trial, cancel anytime. No credit card required to start.
          </p>
        </ScrollReveal>

        <div className="mx-auto mt-16 grid max-w-[720px] gap-4 lg:grid-cols-2">
          {/* Free trial */}
          <ScrollReveal delay={1} className="h-full">
            <div className="flex h-full flex-col rounded-3xl border border-white/[0.08] bg-white/[0.03] p-8 md:p-10">
              <div className="mb-6 font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-white/25">
                Free Trial
              </div>
              <div className="font-mono text-5xl font-medium tracking-[-0.03em] text-white/[0.92]">
                &euro;0
                <span className="ml-1 text-base font-light text-white/25">
                  /7 days
                </span>
              </div>
              <p className="mb-7 mt-2 text-sm font-light leading-[1.5] text-white/45">
                Full access. See if Cadence is right for you.
              </p>
              <ul className="mb-8 space-y-0">
                {[
                  "Full onboarding conversation",
                  "Runner profile + radar chart",
                  "10-week volume plan",
                  "Weekly structure",
                  "Decision audit",
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2.5 border-b border-white/[0.08] py-2.5 text-sm font-light text-white/70"
                  >
                    <span className="font-mono text-xs font-semibold text-[#C8FF00]">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#download"
                className="mt-auto inline-flex w-full items-center justify-center rounded-[14px] border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-[17px] font-normal tracking-[-0.01em] text-white/70 transition-colors hover:border-white/25 hover:text-white/[0.92]"
              >
                Start Free Trial
              </a>
            </div>
          </ScrollReveal>
          {/* Pro */}
          <ScrollReveal delay={2} className="h-full">
            <div className="flex h-full flex-col rounded-3xl border border-[#C8FF00]/30 bg-gradient-to-b from-[rgba(200,255,0,0.06)] to-white/[0.03] p-8 md:p-10">
              <div className="mb-6 inline-flex w-fit rounded-full bg-[rgba(200,255,0,0.12)] px-3.5 py-1 font-mono text-[10px] font-medium tracking-[0.06em] text-[#C8FF00]">
                RECOMMENDED
              </div>
              <div className="font-mono text-5xl font-medium tracking-[-0.03em] text-white/[0.92]">
                &euro;9.99
                <span className="ml-1 text-base font-light text-white/25">
                  /month
                </span>
              </div>
              <p className="mb-7 mt-2 text-sm font-light leading-[1.5] text-white/45">
                Everything in trial, plus continuous coaching.
              </p>
              <ul className="mb-8 space-y-0">
                {[
                  "Unlimited plan adaptations",
                  "Daily session adjustments",
                  "Injury-responsive reshaping",
                  "Race day predictions",
                  "Priority wearable sync",
                  "Full coaching history",
                ].map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-2.5 border-b border-white/[0.08] py-2.5 text-sm font-light text-white/70"
                  >
                    <span className="font-mono text-xs font-semibold text-[#C8FF00]">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#download"
                className="mt-auto inline-flex w-full items-center justify-center rounded-[14px] bg-[#C8FF00] px-4 py-3.5 text-[17px] font-semibold tracking-[-0.01em] text-black transition-transform hover:scale-[1.03] active:scale-[0.97]"
              >
                Get Started
              </a>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section
        className="px-5 pb-40 pt-16 text-center sm:px-8 sm:pt-20 lg:px-12 lg:pt-[120px]"
        id="download"
      >
        <ScrollReveal>
          <h2 className="mx-auto mb-6 max-w-[680px] text-[clamp(40px,5.5vw,72px)] font-light leading-[1.08] tracking-[-0.04em]">
            Your next PR starts with a{" "}
            <em className="not-italic font-medium text-[#C8FF00]">
              conversation.
            </em>
          </h2>
          <p className="mx-auto mb-12 max-w-[440px] text-lg font-light leading-[1.55] tracking-[-0.01em] text-white/45">
            Download Cadence. Connect your watch or answer a few questions. Get a
            plan you can trust — because you can see how it thinks.
          </p>
          <div className="flex flex-wrap justify-center gap-3.5">
            {/* App Store */}
            <a
              href="#"
              className="inline-flex items-center gap-3 rounded-[14px] bg-white px-8 py-4 text-black transition-transform hover:scale-[1.03]"
            >
              <svg width="22" height="26" viewBox="0 0 22 26" fill="black">
                <path d="M18.07 13.58c-.03-2.84 2.32-4.21 2.43-4.27-1.32-1.93-3.38-2.2-4.11-2.23-1.75-.18-3.42 1.03-4.31 1.03-.9 0-2.28-1.01-3.75-.98-1.93.03-3.71 1.13-4.7 2.85-2.01 3.48-.51 8.63 1.44 11.46.96 1.37 2.1 2.92 3.59 2.87 1.44-.06 1.99-.93 3.73-.93 1.74 0 2.23.93 3.75.9 1.55-.03 2.53-1.4 3.47-2.78 1.1-1.59 1.55-3.14 1.57-3.22-.03-.02-3.02-1.16-3.05-4.6l-.06-.1zM15.18 4.84c.79-.96 1.32-2.3 1.18-3.63-1.14.05-2.52.76-3.34 1.72-.73.85-1.38 2.21-1.2 3.52 1.27.1 2.56-.64 3.36-1.61z" />
              </svg>
              <div className="text-left">
                <div className="text-[10px] font-normal opacity-70">
                  Download on the
                </div>
                <div className="text-[17px] font-semibold tracking-[-0.02em]">
                  App Store
                </div>
              </div>
            </a>
            {/* Google Play */}
            <a
              href="#"
              className="inline-flex items-center gap-3 rounded-[14px] bg-white px-8 py-4 text-black transition-transform hover:scale-[1.03]"
            >
              <svg width="22" height="24" viewBox="0 0 22 24" fill="none">
                <path d="M1 1.5L12.5 12L1 22.5V1.5Z" fill="#4285F4" />
                <path d="M1 1.5L16.5 9L12.5 12L1 1.5Z" fill="#34A853" />
                <path d="M1 22.5L12.5 12L16.5 15L1 22.5Z" fill="#EA4335" />
                <path
                  d="M16.5 9L21 11.5L16.5 15L12.5 12L16.5 9Z"
                  fill="#FBBC05"
                />
              </svg>
              <div className="text-left">
                <div className="text-[10px] font-normal opacity-70">
                  Get it on
                </div>
                <div className="text-[17px] font-semibold tracking-[-0.02em]">
                  Google Play
                </div>
              </div>
            </a>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section
        className="px-5 pb-16 pt-10 text-center sm:px-8 sm:pb-20 lg:px-12 lg:pb-[120px]"
        id="faq"
      >
        <ScrollReveal>
          <div className="mx-auto mb-4 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-[#C8FF00]">
            FAQ
          </div>
          <h2 className="mx-auto max-w-[700px] text-[clamp(36px,4.5vw,56px)] font-light leading-[1.1] tracking-[-0.03em] text-white/[0.92]">
            Questions you might have.
          </h2>
        </ScrollReveal>

        <FaqAccordion />
      </section>
    </div>
  );
}
