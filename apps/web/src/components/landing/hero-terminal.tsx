"use client";

import { useEffect, useRef, useCallback } from "react";

const TERMINAL_LINES = [
  { text: "Connecting to Strava...", color: "text-white/25", delay: 400 },
  { text: "Found 847 activities.", color: "text-white/25", delay: 300 },
  { text: "Analyzing last 12 months...", color: "text-white/25", delay: 500 },
  { text: "", delay: 200, spacer: true },
  { text: "Weekly volume: 42–48km", color: "text-white/70", delay: 300 },
  { text: "Long run avg: 16.2km", color: "text-white/70", delay: 250 },
  { text: "Easy pace: 5:38–5:45/km", color: "text-white/70", delay: 250 },
  { text: "Tempo range: 4:50–5:05/km", color: "text-white/70", delay: 250 },
  { text: "", delay: 200, spacer: true },
  { text: "⚠ Rest days last month: 3", color: "text-[#FF5A5A]", delay: 400 },
  {
    text: "⚠ Easy runs trending too fast",
    color: "text-[#FF8A00]",
    delay: 350,
  },
  { text: "", delay: 200, spacer: true },
  {
    text: "✓ No major injury gaps detected",
    color: "text-[#C8FF00]",
    delay: 300,
  },
  { text: "✓ Consistency: top 15%", color: "text-[#C8FF00]", delay: 300 },
  { text: "", delay: 200, spacer: true },
  {
    text: "✓ Profile confidence: HIGH",
    color: "text-[#C8FF00]",
    delay: 500,
    bold: true,
  },
];

export function HeroTerminal() {
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const typeTerminal = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    // Clear previous timeouts
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];

    let totalDelay = 800;

    TERMINAL_LINES.forEach((line) => {
      totalDelay += line.delay;
      const t = setTimeout(() => {
        if (line.spacer) {
          const spacer = document.createElement("div");
          spacer.style.height = "6px";
          container.appendChild(spacer);
        } else {
          const el = document.createElement("div");
          el.className = `font-mono text-xs leading-[2] tracking-[0.01em] animate-fadeUp ${line.color || ""}`;
          if (line.bold) el.style.fontWeight = "600";
          el.textContent = line.text;
          container.appendChild(el);
        }
        container.scrollTop = container.scrollHeight;
      }, totalDelay);
      timeoutsRef.current.push(t);
    });

    // Loop
    const loopT = setTimeout(typeTerminal, totalDelay + 3000);
    timeoutsRef.current.push(loopT);
  }, []);

  useEffect(() => {
    typeTerminal();
    return () => {
      timeoutsRef.current.forEach(clearTimeout);
    };
  }, [typeTerminal]);

  return (
    <div className="absolute right-12 top-1/2 hidden w-[380px] -translate-y-1/2 animate-fadeUp animation-delay-500 rounded-2xl border border-white/[0.08] bg-black/60 p-6 shadow-[0_40px_80px_rgba(0,0,0,0.5)] backdrop-blur-[40px] lg:block">
      <div className="mb-4 flex items-center gap-2 border-b border-white/[0.08] pb-3">
        <div className="h-2 w-2 rounded-full bg-[#FF5A5A]" />
        <div className="h-2 w-2 rounded-full bg-[#FF8A00]" />
        <div className="h-2 w-2 rounded-full bg-[#C8FF00]" />
        <span className="ml-2 font-mono text-[11px] tracking-[0.04em] text-white/25">
          cadence · analysis
        </span>
      </div>
      <div ref={containerRef} className="min-h-[200px]" />
    </div>
  );
}
