"use client";

import { useState } from "react";

const AUDIT_ITEMS = [
  {
    question: "Why 8% volume cap instead of 10%?",
    answer:
      "Shin splint history combined with \"push through\" recovery style creates elevated risk. Conservative loading protects long-term consistency — your most valuable asset.",
  },
  {
    question: "Why two rest days, not one?",
    answer:
      "Only 3 rest days last month signals recovery debt. One rest day maintains the status quo — two allows actual adaptation. Non-negotiable until your recovery metrics improve.",
  },
  {
    question: "Why slow down the easy pace?",
    answer:
      "Current 5:40/km is above your aerobic threshold. True recovery running requires actually recovering — at 6:00-6:15, you'll build the same aerobic base without the residual fatigue.",
  },
];

export function AuditAccordion() {
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <div className="mt-12 max-w-[560px]">
      {AUDIT_ITEMS.map((item, i) => (
        <div
          key={i}
          onClick={() => setOpenIndex(openIndex === i ? -1 : i)}
          className={`mb-2 cursor-pointer overflow-hidden rounded-[14px] border transition-colors ${
            openIndex === i
              ? "border-[#C8FF00]/30 bg-[rgba(200,255,0,0.06)]"
              : "border-white/[0.08] bg-white/[0.03] hover:border-[#C8FF00]/30"
          }`}
        >
          <div className="flex items-center gap-3 px-5 py-[18px] text-[15px] font-medium text-white/[0.92]">
            <span
              className={`font-mono text-xs transition-all ${
                openIndex === i
                  ? "rotate-90 text-[#C8FF00]"
                  : "text-white/25"
              }`}
            >
              ▸
            </span>
            {item.question}
          </div>
          {openIndex === i && (
            <div className="px-5 pb-[18px] pl-11 text-sm font-light leading-[1.6] text-white/45">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
