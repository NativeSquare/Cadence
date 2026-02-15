"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    question: "How is Cadence different from a static training plan?",
    answer:
      "A static plan is written once and never changes. Cadence rebuilds your plan after every run you log. Missed a session, felt tired, or ran faster than expected — the plan reshapes itself the same day. It's closer to having a real coach on call than following a PDF.",
  },
  {
    question: "Do I need a smartwatch or running watch?",
    answer:
      "No. If you have a Strava, Apple Health, or Garmin account, Cadence pulls your data automatically for a more precise plan. If you don't, the onboarding conversation collects everything it needs through a few targeted questions. You'll still get a personalized plan — the confidence intervals are just wider until you start logging runs.",
  },
  {
    question: "What's the Decision Audit?",
    answer:
      'Every coaching choice Cadence makes comes with an explanation you can inspect. "Why 8% volume cap?" → "Shin splint history + push-through recovery style = elevated risk." No other running app shows its reasoning. If you disagree, you can tell the coach and it will adapt.',
  },
  {
    question: "Can I use Cadence for any distance?",
    answer:
      "Yes — from your first 5K to ultra marathons. The coaching engine doesn't apply a template based on distance. It builds from your actual fitness data, history, and goals. A first-time 10K runner and an experienced marathoner get fundamentally different plans, even if they're both 16 weeks out.",
  },
  {
    question: "What happens if I get injured mid-plan?",
    answer:
      "Tell the coach. It won't just delete sessions — it restructures the entire remaining plan around the injury. Volume drops, intensity shifts, and recovery sessions are added based on what you report. When you come back, the ramp-up is conservative and monitored.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. The 7-day trial is completely free — no credit card required to start. After that, it's €9.99/month with no lock-in. Cancel from your app store settings whenever you want. Your training history stays accessible even after cancellation.",
  },
  {
    question: "Is my running data private?",
    answer:
      "Your data is yours. Cadence uses your running history and profile exclusively to build your coaching plan. It's never shared with third parties, never used to train models for other users, and never sold. You can export or delete everything at any time.",
  },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="mx-auto mt-16 max-w-[720px] text-left">
      {FAQ_ITEMS.map((item, i) => (
        <div
          key={i}
          className={`border-b border-white/[0.08] ${openIndex === i ? "faq-open" : ""}`}
        >
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="flex w-full items-center justify-between py-6 text-left transition-opacity hover:opacity-80"
          >
            <span className="pr-5 text-[17px] font-medium tracking-[-0.01em] text-white/[0.92]">
              {item.question}
            </span>
            <div className="faq-arrow-icon flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-white/[0.06] font-mono text-sm text-white/25">
              +
            </div>
          </button>
          <div className="faq-answer">
            <p className="max-w-[600px] pb-6 text-[15px] font-light leading-[1.65] text-white/45">
              {item.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
