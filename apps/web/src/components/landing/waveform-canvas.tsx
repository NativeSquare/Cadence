"use client";

import { useEffect, useRef } from "react";

const NUM_BARS = 48;
const BAR_W = 4;
const GAP = 2;

export function WaveformCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const mouseXRef = useRef(-1);
  const phaseRef = useRef(0);
  const animIdRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const art = artRef.current;
    if (!canvas || !art) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Base amplitudes — bell curve shape
    const baseAmps: number[] = [];
    for (let i = 0; i < NUM_BARS; i++) {
      const t = (i / (NUM_BARS - 1)) * 2 - 1;
      baseAmps.push(Math.exp(-t * t * 2.5));
    }

    const card = art.closest("[data-step-card]") as HTMLElement | null;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = art.getBoundingClientRect();
      mouseXRef.current = (e.clientX - rect.left) / rect.width;
    };
    const handleMouseLeave = () => {
      mouseXRef.current = -1;
    };

    card?.addEventListener("mousemove", handleMouseMove);
    card?.addEventListener("mouseleave", handleMouseLeave);

    function resize() {
      const rect = art!.getBoundingClientRect();
      canvas!.width = rect.width * 2;
      canvas!.height = rect.height * 2;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      phaseRef.current += 0.02;
      const phase = phaseRef.current;
      const w = canvas!.width;
      const h = canvas!.height;
      ctx!.clearRect(0, 0, w, h);
      const cy = h * 0.5;
      const totalW = NUM_BARS * (BAR_W + GAP);
      const scale = w / totalW;
      const maxH = h * 0.85;

      for (let i = 0; i < NUM_BARS; i++) {
        const nx = i / (NUM_BARS - 1);
        let amp = baseAmps[i] * (0.7 + 0.3 * Math.sin(phase + i * 0.3));

        if (mouseXRef.current >= 0) {
          const dist = Math.abs(nx - mouseXRef.current);
          const influence = Math.exp(-dist * dist * 40);
          amp = amp * (1 - influence * 0.3) + influence * 1.0;
        }

        const barH = amp * maxH;
        const x = i * (BAR_W + GAP) * scale;
        const bw = BAR_W * scale;

        const grad = ctx!.createLinearGradient(
          0,
          cy - barH / 2,
          0,
          cy + barH / 2
        );
        grad.addColorStop(0, `rgba(200,255,0,${0.5 + amp * 0.5})`);
        grad.addColorStop(1, "rgba(200,255,0,0.02)");

        ctx!.fillStyle = grad;
        ctx!.beginPath();
        const r = bw / 2;
        const top = cy - barH / 2;
        const bot = cy + barH / 2;
        ctx!.moveTo(x + r, top);
        ctx!.lineTo(x + bw - r, top);
        ctx!.quadraticCurveTo(x + bw, top, x + bw, top + r);
        ctx!.lineTo(x + bw, bot - r);
        ctx!.quadraticCurveTo(x + bw, bot, x + bw - r, bot);
        ctx!.lineTo(x + r, bot);
        ctx!.quadraticCurveTo(x, bot, x, bot - r);
        ctx!.lineTo(x, top + r);
        ctx!.quadraticCurveTo(x, top, x + r, top);
        ctx!.fill();
      }

      // Center line
      ctx!.strokeStyle = "rgba(200,255,0,0.1)";
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.moveTo(0, cy);
      ctx!.lineTo(w, cy);
      ctx!.stroke();

      // Pulsing rec dot
      const dotX = w / 2;
      const dotY = h * 0.15;
      const pulseR = 6 + 4 * Math.sin(phase * 2);
      ctx!.fillStyle = `rgba(200,255,0,${0.4 + 0.3 * Math.sin(phase * 2)})`;
      ctx!.beginPath();
      ctx!.arc(dotX, dotY, 6, 0, Math.PI * 2);
      ctx!.fill();
      ctx!.strokeStyle = `rgba(200,255,0,${0.2 * (1 - (pulseR - 6) / 4)})`;
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.arc(dotX, dotY, pulseR * 2, 0, Math.PI * 2);
      ctx!.stroke();

      animIdRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animIdRef.current);
      window.removeEventListener("resize", resize);
      card?.removeEventListener("mousemove", handleMouseMove);
      card?.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={artRef}
      className="pointer-events-auto absolute bottom-0 left-0 right-0 h-[200px] opacity-[0.12] transition-opacity duration-500 group-hover:opacity-25"
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
