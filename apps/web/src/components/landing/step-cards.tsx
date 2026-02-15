"use client";

import { useState } from "react";
import { WaveformCanvas } from "./waveform-canvas";

/* ─── Step Card 1: Connect or talk ─── */
export function StepCardWaveform() {
  return (
    <StepCardWrapper number="01">
      <div className="relative z-2 mb-6 flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#C8FF00]/15 bg-[rgba(200,255,0,0.12)]">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path
            d="M11 1C5.48 1 1 5.48 1 11C1 16.52 5.48 21 11 21C16.52 21 21 16.52 21 11"
            stroke="#C8FF00"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M14 8L11 11L8 8"
            stroke="#C8FF00"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="relative z-2 text-xl font-semibold tracking-[-0.02em] text-white/[0.92]">
        Connect or talk
      </div>
      <p className="relative z-2 mt-2.5 text-[15px] font-light leading-[1.6] text-white/45">
        Link your Strava, Apple Health, or Garmin for instant analysis. No
        wearable? No problem — the coach asks you directly.
      </p>
      <WaveformCanvas />
    </StepCardWrapper>
  );
}

/* ─── Step Card 2: See the analysis ─── */
export function StepCardGraph() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`group relative overflow-hidden rounded-[20px] border bg-white/[0.03] px-8 pb-[220px] pt-10 transition-colors ${
        isHovered
          ? "step-card-hover border-[#C8FF00]/30 bg-[rgba(200,255,0,0.06)]"
          : "border-white/[0.08]"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute right-6 top-5 font-mono text-[64px] font-semibold leading-none tracking-[-0.04em] text-[#C8FF00]/[0.06]">
        02
      </div>
      <div className="relative z-2 mb-6 flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#C8FF00]/15 bg-[rgba(200,255,0,0.12)]">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path
            d="M3 17L7 13L10 16L15 10L19 14"
            stroke="#C8FF00"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x="1"
            y="1"
            width="20"
            height="20"
            rx="4"
            stroke="#C8FF00"
            strokeWidth="1.5"
          />
        </svg>
      </div>
      <div className="relative z-2 text-xl font-semibold tracking-[-0.02em] text-white/[0.92]">
        See the analysis
      </div>
      <p className="relative z-2 mt-2.5 text-[15px] font-light leading-[1.6] text-white/45">
        Watch your data being processed in real time. Radar chart, volume plan,
        weekly structure, projected finish — all generated from your actual
        profile.
      </p>
      {/* Graph art */}
      <div className="pointer-events-auto absolute bottom-0 left-0 right-0 h-[200px] opacity-[0.12] transition-opacity duration-500 group-hover:opacity-25">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 400 200"
          preserveAspectRatio="none"
          fill="none"
        >
          <defs>
            <linearGradient id="graph-fill-1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C8FF00" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#C8FF00" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="graph-fill-2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5B9EFF" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#5B9EFF" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="graph-fill-3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FF8A00" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#FF8A00" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Grid lines */}
          <g opacity="0.06">
            <line x1="0" y1="40" x2="400" y2="40" stroke="white" strokeWidth="0.5" />
            <line x1="0" y1="80" x2="400" y2="80" stroke="white" strokeWidth="0.5" />
            <line x1="0" y1="120" x2="400" y2="120" stroke="white" strokeWidth="0.5" />
            <line x1="0" y1="160" x2="400" y2="160" stroke="white" strokeWidth="0.5" />
          </g>
          {/* Orange curve */}
          <path
            className="graph-line"
            d="M0,130 C40,125 60,110 100,105 C140,100 160,115 200,95 C240,75 280,85 320,70 C360,55 380,60 400,50"
            stroke="#FF8A00"
            strokeWidth="1.5"
            opacity="0.5"
            style={{ transitionDelay: "0.3s" }}
          />
          <path
            className="graph-fill"
            d="M0,130 C40,125 60,110 100,105 C140,100 160,115 200,95 C240,75 280,85 320,70 C360,55 380,60 400,50 L400,200 L0,200 Z"
            fill="url(#graph-fill-3)"
          />
          {/* Blue curve */}
          <path
            className="graph-line"
            d="M0,90 C30,95 70,110 110,100 C150,90 170,60 210,75 C250,90 290,55 330,65 C370,75 390,50 400,55"
            stroke="#5B9EFF"
            strokeWidth="1.5"
            opacity="0.6"
            style={{ transitionDelay: "0.15s" }}
          />
          <path
            className="graph-fill"
            d="M0,90 C30,95 70,110 110,100 C150,90 170,60 210,75 C250,90 290,55 330,65 C370,75 390,50 400,55 L400,200 L0,200 Z"
            fill="url(#graph-fill-2)"
            style={{ transitionDelay: "0.4s" }}
          />
          {/* Lime curve */}
          <path
            className="graph-line"
            d="M0,160 C30,150 60,140 100,120 C140,100 170,110 210,85 C250,60 290,70 330,45 C370,20 390,30 400,20"
            stroke="#C8FF00"
            strokeWidth="2"
            opacity="0.9"
          />
          <path
            className="graph-fill"
            d="M0,160 C30,150 60,140 100,120 C140,100 170,110 210,85 C250,60 290,70 330,45 C370,20 390,30 400,20 L400,200 L0,200 Z"
            fill="url(#graph-fill-1)"
            style={{ transitionDelay: "0.3s" }}
          />
          {/* Data dots */}
          <circle className="graph-dot-glow" cx="100" cy="120" fill="#C8FF00" opacity="0.1" style={{ transitionDelay: "0.8s" }} />
          <circle className="graph-dot" cx="100" cy="120" fill="#C8FF00" stroke="#000" strokeWidth="2" style={{ transitionDelay: "0.8s" }} />
          <circle className="graph-dot-glow" cx="210" cy="85" fill="#C8FF00" opacity="0.1" style={{ transitionDelay: "1s" }} />
          <circle className="graph-dot" cx="210" cy="85" fill="#C8FF00" stroke="#000" strokeWidth="2" style={{ transitionDelay: "1s" }} />
          <circle className="graph-dot-glow" cx="330" cy="45" fill="#C8FF00" opacity="0.1" style={{ transitionDelay: "1.2s" }} />
          <circle className="graph-dot" cx="330" cy="45" fill="#C8FF00" stroke="#000" strokeWidth="2" style={{ transitionDelay: "1.2s" }} />
          {/* Labels */}
          <g className="graph-label" style={{ transitionDelay: "1s" }}>
            <rect x="72" y="100" width="56" height="16" rx="4" fill="rgba(0,0,0,0.7)" stroke="#C8FF00" strokeWidth="0.5" />
            <text x="100" y="112" textAnchor="middle" fill="#C8FF00" fontFamily="var(--font-mono)" fontSize="8" fontWeight="500">42 km/wk</text>
          </g>
          <g className="graph-label" style={{ transitionDelay: "1.2s" }}>
            <rect x="182" y="65" width="56" height="16" rx="4" fill="rgba(0,0,0,0.7)" stroke="#C8FF00" strokeWidth="0.5" />
            <text x="210" y="77" textAnchor="middle" fill="#C8FF00" fontFamily="var(--font-mono)" fontSize="8" fontWeight="500">48 km/wk</text>
          </g>
          <g className="graph-label" style={{ transitionDelay: "1.4s" }}>
            <rect x="302" y="25" width="56" height="16" rx="4" fill="rgba(0,0,0,0.7)" stroke="#C8FF00" strokeWidth="0.5" />
            <text x="330" y="37" textAnchor="middle" fill="#C8FF00" fontFamily="var(--font-mono)" fontSize="8" fontWeight="500">55 km/wk</text>
          </g>
        </svg>
      </div>
    </div>
  );
}

/* ─── Step Card 3: Train with reasoning ─── */
export function StepCardCalendar() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`group relative overflow-hidden rounded-[20px] border bg-white/[0.03] px-8 pb-[220px] pt-10 transition-colors ${
        isHovered
          ? "step-card-hover border-[#C8FF00]/30 bg-[rgba(200,255,0,0.06)]"
          : "border-white/[0.08]"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute right-6 top-5 font-mono text-[64px] font-semibold leading-none tracking-[-0.04em] text-[#C8FF00]/[0.06]">
        03
      </div>
      <div className="relative z-2 mb-6 flex h-12 w-12 items-center justify-center rounded-[14px] border border-[#C8FF00]/15 bg-[rgba(200,255,0,0.12)]">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path
            d="M11 1V11L16 16"
            stroke="#C8FF00"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="11" cy="11" r="10" stroke="#C8FF00" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="relative z-2 text-xl font-semibold tracking-[-0.02em] text-white/[0.92]">
        Train with reasoning
      </div>
      <p className="relative z-2 mt-2.5 text-[15px] font-light leading-[1.6] text-white/45">
        Every session has a &quot;why.&quot; The plan adapts after each run.
        Missed a session? Got injured? The plan reshapes itself.
      </p>
      {/* Calendar art */}
      <div className="pointer-events-auto absolute bottom-0 left-0 right-0 h-[200px] opacity-[0.12] transition-opacity duration-500 group-hover:opacity-25">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 400 200"
          preserveAspectRatio="xMidYMid meet"
          fill="none"
        >
          <defs>
            <linearGradient id="cal-lime" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#C8FF00" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#C8FF00" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="cal-rest" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0.08" />
              <stop offset="100%" stopColor="white" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {/* Calendar frame */}
          <rect x="40" y="16" width="320" height="172" rx="12" fill="none" stroke="white" strokeWidth="0.5" opacity="0.08" />
          <rect x="40" y="16" width="320" height="32" rx="12" fill="white" opacity="0.03" />
          <text x="200" y="37" textAnchor="middle" fill="white" opacity="0.25" fontFamily="var(--font-mono)" fontSize="10" fontWeight="500" letterSpacing="0.08em">WEEK 4 · BUILD PHASE</text>
          {/* Day headers */}
          {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d, i) => (
            <text key={d} x={68 + i * 46} y="63" textAnchor="middle" fill="white" opacity="0.2" fontFamily="var(--font-mono)" fontSize="8" letterSpacing="0.06em">{d}</text>
          ))}
          {/* MON — Tempo */}
          <g className="cal-cell">
            <rect x="46" y="70" width="44" height="110" rx="8" fill="url(#cal-lime)" stroke="#C8FF00" strokeWidth="0.5" opacity="0.7" />
            <text x="68" y="90" textAnchor="middle" fill="#C8FF00" fontFamily="var(--font-mono)" fontSize="8" fontWeight="500" opacity="0.9">TEMPO</text>
            <text x="68" y="104" textAnchor="middle" fill="#C8FF00" fontFamily="var(--font-mono)" fontSize="7" opacity="0.5">50 min</text>
            <rect x="56" y="115" width="24" height="3" rx="1.5" fill="#C8FF00" opacity="0.3" />
            <rect x="56" y="115" width="17" height="3" rx="1.5" fill="#C8FF00" opacity="0.6" />
            <circle cx="68" cy="164" r="3" fill="#C8FF00" opacity="0.5" />
          </g>
          {/* TUE — Easy */}
          <g className="cal-cell">
            <rect x="92" y="70" width="44" height="110" rx="8" fill="url(#cal-rest)" stroke="white" strokeWidth="0.5" opacity="0.4" />
            <text x="114" y="90" textAnchor="middle" fill="white" fontFamily="var(--font-mono)" fontSize="8" fontWeight="500" opacity="0.3">EASY</text>
            <text x="114" y="104" textAnchor="middle" fill="white" fontFamily="var(--font-mono)" fontSize="7" opacity="0.2">40 min</text>
          </g>
          {/* WED — Intervals */}
          <g className="cal-cell">
            <rect x="138" y="70" width="44" height="110" rx="8" fill="url(#cal-lime)" stroke="#C8FF00" strokeWidth="0.5" opacity="0.7" />
            <text x="160" y="88" textAnchor="middle" fill="#C8FF00" fontFamily="var(--font-mono)" fontSize="7.5" fontWeight="500" opacity="0.9">INTER-</text>
            <text x="160" y="98" textAnchor="middle" fill="#C8FF00" fontFamily="var(--font-mono)" fontSize="7.5" fontWeight="500" opacity="0.9">VALS</text>
            <text x="160" y="112" textAnchor="middle" fill="#C8FF00" fontFamily="var(--font-mono)" fontSize="7" opacity="0.5">55 min</text>
            <rect x="148" y="122" width="6" height="14" rx="2" fill="#C8FF00" opacity="0.4" />
            <rect x="157" y="126" width="6" height="10" rx="2" fill="#C8FF00" opacity="0.3" />
            <rect x="166" y="120" width="6" height="16" rx="2" fill="#C8FF00" opacity="0.5" />
            <circle cx="160" cy="164" r="3" fill="#C8FF00" opacity="0.5" />
          </g>
          {/* THU — Rest */}
          <g className="cal-cell">
            <rect x="184" y="70" width="44" height="110" rx="8" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="4 3" opacity="0.15" />
            <text x="206" y="93" textAnchor="middle" fill="white" fontFamily="var(--font-mono)" fontSize="8" fontWeight="500" opacity="0.2">REST</text>
            <line x1="196" y1="110" x2="216" y2="110" stroke="white" strokeWidth="0.5" opacity="0.1" />
          </g>
          {/* FRI — Easy */}
          <g className="cal-cell">
            <rect x="230" y="70" width="44" height="110" rx="8" fill="url(#cal-rest)" stroke="white" strokeWidth="0.5" opacity="0.4" />
            <text x="252" y="90" textAnchor="middle" fill="white" fontFamily="var(--font-mono)" fontSize="8" fontWeight="500" opacity="0.3">EASY</text>
            <text x="252" y="104" textAnchor="middle" fill="white" fontFamily="var(--font-mono)" fontSize="7" opacity="0.2">35 min</text>
          </g>
          {/* SAT — Rest */}
          <g className="cal-cell">
            <rect x="276" y="70" width="44" height="110" rx="8" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="4 3" opacity="0.15" />
            <text x="298" y="93" textAnchor="middle" fill="white" fontFamily="var(--font-mono)" fontSize="8" fontWeight="500" opacity="0.2">REST</text>
            <line x1="288" y1="110" x2="308" y2="110" stroke="white" strokeWidth="0.5" opacity="0.1" />
          </g>
          {/* SUN — Long Run */}
          <g className="cal-cell">
            <rect x="322" y="70" width="44" height="110" rx="8" fill="url(#cal-lime)" stroke="#C8FF00" strokeWidth="0.5" opacity="0.7" />
            <text x="344" y="86" textAnchor="middle" fill="#C8FF00" fontFamily="var(--font-mono)" fontSize="7.5" fontWeight="500" opacity="0.9">LONG</text>
            <text x="344" y="96" textAnchor="middle" fill="#C8FF00" fontFamily="var(--font-mono)" fontSize="7.5" fontWeight="500" opacity="0.9">RUN</text>
            <text x="344" y="110" textAnchor="middle" fill="#C8FF00" fontFamily="var(--font-mono)" fontSize="7" opacity="0.5">90 min</text>
            <rect x="332" y="122" width="24" height="3" rx="1.5" fill="#C8FF00" opacity="0.3" />
            <rect x="332" y="122" width="20" height="3" rx="1.5" fill="#C8FF00" opacity="0.6" />
            <circle cx="344" cy="164" r="3" fill="#C8FF00" opacity="0.5" />
          </g>
        </svg>
      </div>
    </div>
  );
}

/* ─── Shared wrapper ─── */
function StepCardWrapper({
  number,
  children,
}: {
  number: string;
  children: React.ReactNode;
}) {
  return (
    <div
      data-step-card
      className="group relative overflow-hidden rounded-[20px] border border-white/[0.08] bg-white/[0.03] px-8 pb-[220px] pt-10 transition-colors hover:border-[#C8FF00]/30 hover:bg-[rgba(200,255,0,0.06)]"
    >
      <div className="absolute right-6 top-5 font-mono text-[64px] font-semibold leading-none tracking-[-0.04em] text-[#C8FF00]/[0.06]">
        {number}
      </div>
      {children}
    </div>
  );
}
