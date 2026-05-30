/** Display helpers for the 5K plan playground. All pure, no deps. */

/** Mon→Sun, matching the engine's ISO day-of-week (0=Mon … 6=Sun). */
export const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** ISO day-of-week (0=Mon … 6=Sun) from a YYYY-MM-DD string, UTC-anchored. */
export function isoDow(ymd: string): number {
  const [y, m, d] = ymd.split("-").map(Number);
  const jsDow = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1)).getUTCDay(); // 0=Sun
  return (jsDow + 6) % 7; // shift so Monday=0
}

/** m/s → "m:ss/km" pace label. */
export function mpsToPace(mps: number | undefined): string {
  if (!mps || mps <= 0) return "—";
  const secPerKm = 1000 / mps;
  const min = Math.floor(secPerKm / 60);
  const sec = Math.round(secPerKm % 60);
  return `${min}:${String(sec).padStart(2, "0")}/km`;
}

/** Tailwind classes per phase for badges + calendar cells. */
export const PHASE_STYLES: Record<string, string> = {
  base: "bg-sky-100 text-sky-900 border-sky-200",
  build: "bg-amber-100 text-amber-900 border-amber-200",
  peak: "bg-rose-100 text-rose-900 border-rose-200",
  taper: "bg-emerald-100 text-emerald-900 border-emerald-200",
};

export const DROP_REASON_LABELS: Record<string, string> = {
  "before-plan-start": "Before plan start",
  "on-or-after-race": "On/after race day",
  "too-short-no-spec": "Too short (<500m, no spec)",
  "structure-empty": "Empty structure",
};

export function km(meters: number | undefined): string {
  if (meters === undefined) return "—";
  return `${(meters / 1000).toFixed(1)} km`;
}

/** One-line "what this phase's weekly template is about", for the step narrative. */
export const PHASE_INTENT: Record<string, string> = {
  base: "Easy running + VMA courte every week + an SV1 long run (no long run at 2 sessions/week).",
  build:
    "Threshold (SV2) + SV1 long, plus one alternating quality slot — VMA longue ↔ Mixte in late build.",
  peak: "Race-pace 5K sessions (7×800 @ goal pace) + easy runs only. No SV2, no SV1 long.",
  taper:
    "Mostly rest + one short pace tune-up; a race-eve shakeout for athletes training ≥4 days/week.",
};

/** Map a session's structure spec back to its coaching role label. */
export function roleLabel(spec: {
  type?: string;
  structureSpec?: {
    kind?: string;
    addStrides?: boolean;
    shakeout?: boolean;
    repIntensity?: string;
    repDistanceM?: number;
  };
}): string {
  const s = spec.structureSpec;
  if (!s) return spec.type ?? "session";
  switch (s.kind) {
    case "easy_continuous":
      if (s.shakeout) return "Shakeout 20′";
      return s.addStrides ? "Easy + strides" : "Easy run";
    case "long_with_blocks":
      return "SV1 long run";
    case "mixed":
      return "Mixed (threshold + VMA)";
    case "intervals_distance":
      if (s.repIntensity === "T") return "SV2 threshold";
      if (s.repIntensity === "I")
        return s.repDistanceM === 800 ? "VMA long" : "VMA short";
      return "Intervals";
    case "intervals_paced":
      return s.repDistanceM === 400 ? "Pace tune-up" : "Race-pace 5K";
    default:
      return spec.type ?? "session";
  }
}
