"use client";

import { useEffect, useRef } from "react";

const RADAR_DATA = [
  { label: "endurance", value: 75 },
  { label: "speed", value: 65 },
  { label: "recovery", value: 40 },
  { label: "consistency", value: 85 },
  { label: "injury", value: 55 },
  { label: "ready", value: 50 },
];

const CX = 170;
const CY = 170;
const R = 135;
const N = 6;

function getPoint(i: number, v: number) {
  const a = (Math.PI * 2 * i) / N - Math.PI / 2;
  const rr = (v / 100) * R;
  return { x: CX + rr * Math.cos(a), y: CY + rr * Math.sin(a) };
}

export function RadarChart() {
  const svgRef = useRef<SVGSVGElement>(null);
  const polyRef = useRef<SVGPolygonElement>(null);
  const dotsRef = useRef<SVGGElement>(null);
  const valueRefs = useRef<(SVGTextElement | null)[]>([]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            observer.disconnect();
            let progress = 0;
            const start = performance.now();
            const animate = (now: number) => {
              const elapsed = now - start;
              progress = Math.min(elapsed / 1500, 1);
              const ease = 1 - Math.pow(1 - progress, 3);

              const pts = RADAR_DATA.map((d, i) =>
                getPoint(i, d.value * ease)
              );

              if (polyRef.current) {
                polyRef.current.setAttribute(
                  "points",
                  pts.map((p) => `${p.x},${p.y}`).join(" ")
                );
              }

              // Update dots
              if (dotsRef.current) {
                dotsRef.current.innerHTML = "";
                pts.forEach((p, i) => {
                  const circle = document.createElementNS(
                    "http://www.w3.org/2000/svg",
                    "circle"
                  );
                  circle.setAttribute("cx", String(p.x));
                  circle.setAttribute("cy", String(p.y));
                  circle.setAttribute("r", "4");
                  circle.setAttribute(
                    "fill",
                    RADAR_DATA[i].value < 50 ? "#FF5A5A" : "#C8FF00"
                  );
                  circle.setAttribute("stroke", "#000");
                  circle.setAttribute("stroke-width", "2");
                  dotsRef.current!.appendChild(circle);
                });
              }

              // Update value labels
              const ids = [
                "endurance",
                "speed",
                "recovery",
                "consistency",
                "injury",
                "ready",
              ];
              ids.forEach((_, i) => {
                const el = valueRefs.current[i];
                if (el) {
                  el.textContent = String(
                    Math.round(RADAR_DATA[i].value * ease)
                  );
                }
              });

              if (progress < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(svg);
    return () => observer.disconnect();
  }, []);

  return (
    <svg
      ref={svgRef}
      width="420"
      height="420"
      viewBox="0 0 340 340"
      className="max-w-full"
    >
      {/* Grid rings */}
      <g opacity="0.15">
        <polygon
          points="170,62 263,116 263,224 170,278 77,224 77,116"
          fill="none"
          stroke="white"
          strokeWidth="0.5"
        />
        <polygon
          points="170,89 236,130 236,210 170,251 104,210 104,130"
          fill="none"
          stroke="white"
          strokeWidth="0.5"
        />
        <polygon
          points="170,116 209,143 209,197 170,224 131,197 131,143"
          fill="none"
          stroke="white"
          strokeWidth="0.5"
        />
        <polygon
          points="170,143 183,157 183,183 170,197 157,183 157,157"
          fill="none"
          stroke="white"
          strokeWidth="0.5"
        />
      </g>
      {/* Axis lines */}
      <g opacity="0.1">
        <line
          x1="170"
          y1="170"
          x2="170"
          y2="35"
          stroke="white"
          strokeWidth="0.5"
        />
        <line
          x1="170"
          y1="170"
          x2="287"
          y2="102"
          stroke="white"
          strokeWidth="0.5"
        />
        <line
          x1="170"
          y1="170"
          x2="287"
          y2="238"
          stroke="white"
          strokeWidth="0.5"
        />
        <line
          x1="170"
          y1="170"
          x2="170"
          y2="305"
          stroke="white"
          strokeWidth="0.5"
        />
        <line
          x1="170"
          y1="170"
          x2="53"
          y2="238"
          stroke="white"
          strokeWidth="0.5"
        />
        <line
          x1="170"
          y1="170"
          x2="53"
          y2="102"
          stroke="white"
          strokeWidth="0.5"
        />
      </g>
      {/* Data polygon */}
      <polygon
        ref={polyRef}
        points="170,170 170,170 170,170 170,170 170,170 170,170"
        fill="rgba(200,255,0,0.07)"
        stroke="#C8FF00"
        strokeWidth="1.5"
        style={{ transition: "all 1.5s cubic-bezier(.25,.46,.45,.94)" }}
      />
      {/* Data dots */}
      <g ref={dotsRef} />
      {/* Labels */}
      <text
        x="170"
        y="22"
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontFamily="var(--font-mono)"
        fontSize="10"
        fontWeight="500"
      >
        ENDURANCE
      </text>
      <text
        x="300"
        y="97"
        textAnchor="start"
        fill="rgba(255,255,255,0.5)"
        fontFamily="var(--font-mono)"
        fontSize="10"
        fontWeight="500"
      >
        SPEED
      </text>
      <text
        x="300"
        y="250"
        textAnchor="start"
        fill="rgba(200,255,0,0.6)"
        fontFamily="var(--font-mono)"
        fontSize="10"
        fontWeight="500"
      >
        RECOVERY
      </text>
      <text
        x="170"
        y="326"
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontFamily="var(--font-mono)"
        fontSize="10"
        fontWeight="500"
      >
        CONSISTENCY
      </text>
      <text
        x="40"
        y="250"
        textAnchor="end"
        fill="rgba(255,90,90,0.6)"
        fontFamily="var(--font-mono)"
        fontSize="10"
        fontWeight="500"
      >
        INJURY RISK
      </text>
      <text
        x="40"
        y="97"
        textAnchor="end"
        fill="rgba(255,255,255,0.5)"
        fontFamily="var(--font-mono)"
        fontSize="10"
        fontWeight="500"
      >
        RACE READY
      </text>
      {/* Value labels */}
      <text
        ref={(el) => {
          valueRefs.current[0] = el;
        }}
        x="170"
        y="36"
        textAnchor="middle"
        fill="rgba(255,255,255,0.8)"
        fontFamily="var(--font-mono)"
        fontSize="13"
        fontWeight="500"
      >
        —
      </text>
      <text
        ref={(el) => {
          valueRefs.current[1] = el;
        }}
        x="300"
        y="111"
        textAnchor="start"
        fill="rgba(255,255,255,0.8)"
        fontFamily="var(--font-mono)"
        fontSize="13"
        fontWeight="500"
      >
        —
      </text>
      <text
        ref={(el) => {
          valueRefs.current[2] = el;
        }}
        x="300"
        y="264"
        textAnchor="start"
        fill="rgba(200,255,0,0.8)"
        fontFamily="var(--font-mono)"
        fontSize="13"
        fontWeight="500"
      >
        —
      </text>
      <text
        ref={(el) => {
          valueRefs.current[3] = el;
        }}
        x="170"
        y="312"
        textAnchor="middle"
        fill="rgba(255,255,255,0.8)"
        fontFamily="var(--font-mono)"
        fontSize="13"
        fontWeight="500"
      >
        —
      </text>
      <text
        ref={(el) => {
          valueRefs.current[4] = el;
        }}
        x="40"
        y="264"
        textAnchor="end"
        fill="rgba(255,90,90,0.8)"
        fontFamily="var(--font-mono)"
        fontSize="13"
        fontWeight="500"
      >
        —
      </text>
      <text
        ref={(el) => {
          valueRefs.current[5] = el;
        }}
        x="40"
        y="111"
        textAnchor="end"
        fill="rgba(255,255,255,0.8)"
        fontFamily="var(--font-mono)"
        fontSize="13"
        fontWeight="500"
      >
        —
      </text>
    </svg>
  );
}
