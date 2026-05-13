/**
 * Pure periodization math for race plan generation.
 *
 * Daniels VDOT + 80/20 polarized — deterministic, no Convex deps, easy to test.
 *
 * Daniels' equations (Running Formula, 3rd ed.):
 *   v_mpm   = D / (t/60)                                          // m/min
 *   VO2     = -4.60 + 0.182258·v + 0.000104·v²
 *   %VO2max = 0.8 + 0.1894393·exp(-0.012778·t)
 *                 + 0.2989558·exp(-0.1932605·t)                   // t in min
 *   VDOT    = VO2 / %VO2max
 *
 * Inverse (VDOT → velocity at intensity I): quadratic solve in v.
 */

import type {
  Repeat,
  Step,
  Workout as WorkoutStructure,
} from "@nativesquare/agoge";
import type {
  BlockType,
  RaceFormat,
  WorkoutType,
} from "@nativesquare/agoge/schema";

// ---------------------------------------------------------------------------
// VDOT
// ---------------------------------------------------------------------------

export const VDOT_CAP = 70;

export function computeVdot(distanceM: number, timeSeconds: number): number {
  const vMpm = distanceM / (timeSeconds / 60);
  const vo2 = -4.6 + 0.182258 * vMpm + 0.000104 * vMpm * vMpm;
  const tMin = timeSeconds / 60;
  const pct =
    0.8 +
    0.1894393 * Math.exp(-0.012778 * tMin) +
    0.2989558 * Math.exp(-0.1932605 * tMin);
  const vdot = vo2 / pct;
  return Math.min(VDOT_CAP, Math.max(0, vdot));
}

/** Solve `intensity·VDOT = -4.60 + 0.182258·v + 0.000104·v²` for v (m/min). */
function vMpmAtIntensity(vdot: number, intensity: number): number {
  const target = intensity * vdot;
  const a = 0.000104;
  const b = 0.182258;
  const c = -(4.6 + target);
  const disc = b * b - 4 * a * c;
  return (-b + Math.sqrt(disc)) / (2 * a);
}

export function paceMpsAtIntensity(vdot: number, intensity: number): number {
  return vMpmAtIntensity(vdot, intensity) / 60;
}

export type IntensityAnchor = "E" | "M" | "T" | "I" | "R";
export type Paces = Record<IntensityAnchor, number>; // m/s

const INTENSITY: Record<IntensityAnchor, number> = {
  E: 0.7,
  M: 0.84,
  T: 0.88,
  I: 0.98,
  R: 1.1,
};

export function trainingPaces(vdot: number): Paces {
  return {
    E: paceMpsAtIntensity(vdot, INTENSITY.E),
    M: paceMpsAtIntensity(vdot, INTENSITY.M),
    T: paceMpsAtIntensity(vdot, INTENSITY.T),
    I: paceMpsAtIntensity(vdot, INTENSITY.I),
    R: paceMpsAtIntensity(vdot, INTENSITY.R),
  };
}

// ---------------------------------------------------------------------------
// Format-driven volume targets
// ---------------------------------------------------------------------------

export const SUPPORTED_FORMATS = new Set<RaceFormat>([
  "5k",
  "10k",
  "15k",
  "10_miles",
  "half_marathon",
  "marathon",
  "custom",
]);

export function isSupportedFormat(format: RaceFormat | undefined): boolean {
  return format !== undefined && SUPPORTED_FORMATS.has(format);
}

/** Recommended peak weekly km for non-elite training to this distance. */
export function distancePeakKm(
  format: RaceFormat | undefined,
  distanceMeters: number,
): number {
  switch (format) {
    case "5k":
      return 45;
    case "10k":
      return 60;
    case "15k":
    case "10_miles":
      return 70;
    case "half_marathon":
      return 75;
    case "marathon":
      return 90;
    case "custom": {
      // Linear interpolation between known peaks based on distance.
      if (distanceMeters <= 5000) return 45;
      if (distanceMeters >= 42195) return 90;
      const km = distanceMeters / 1000;
      if (km < 10) return 45 + ((km - 5) / 5) * 15; // 5k(45) → 10k(60)
      if (km < 21.1) return 60 + ((km - 10) / 11.1) * 15; // 10k(60) → half(75)
      return 75 + ((km - 21.1) / 21.1) * 15; // half(75) → marathon(90)
    }
    default:
      return 60;
  }
}

/** Taper duration by race format. */
export function taperWeeksForFormat(format: RaceFormat | undefined): number {
  switch (format) {
    case "marathon":
      return 3;
    case "half_marathon":
      return 2;
    default:
      return 1;
  }
}

// ---------------------------------------------------------------------------
// Phase split
// ---------------------------------------------------------------------------

export type PhaseSplit = {
  base: number;
  build: number;
  peak: number;
  taper: number;
};

/**
 * Split a plan into Base/Build/Peak/Taper week counts.
 * Compressed plans (<6 weeks) skip Base.
 */
export function splitPhases(
  totalWeeks: number,
  format: RaceFormat | undefined,
): PhaseSplit {
  const weeks = Math.max(1, totalWeeks);
  if (weeks <= 2) {
    return { base: 0, build: 0, peak: 0, taper: weeks };
  }
  const taper = Math.min(taperWeeksForFormat(format), Math.max(1, weeks - 2));
  const remaining = weeks - taper;

  if (weeks < 6) {
    // Compressed: skip Base, split remaining 50/50 between Build and Peak.
    const build = Math.max(1, Math.round(remaining / 2));
    const peak = Math.max(1, remaining - build);
    return { base: 0, build, peak, taper };
  }

  // Normal split: 44% Base / 33% Build / 23% Peak of remaining.
  const base = Math.max(1, Math.round(remaining * 0.44));
  const build = Math.max(1, Math.round(remaining * 0.33));
  const peak = Math.max(1, remaining - base - build);
  return { base, build, peak, taper };
}

// ---------------------------------------------------------------------------
// Weekly volume curve
// ---------------------------------------------------------------------------

export type VolumeCurveOpts = {
  weeks: number;
  currentKm: number;
  peakKm: number;
  taperWeeks: number;
  /** Cap weekly growth across the plan as a multiple of currentKm. */
  maxBuildMultiple?: number;
};

/**
 * Per-week target km. Linear ramp from current → peak across pre-taper weeks,
 * with cutbacks every 4th week (-20%), then taper -20/-40/-50%.
 */
export function weeklyVolumeCurve(opts: VolumeCurveOpts): number[] {
  const { weeks, currentKm, taperWeeks } = opts;
  const maxBuild = opts.maxBuildMultiple ?? 2.5;
  const cap = currentKm * maxBuild;
  const peak = Math.max(currentKm, Math.min(opts.peakKm, cap));
  const preTaper = Math.max(0, weeks - taperWeeks);

  const curve: number[] = [];
  for (let i = 0; i < preTaper; i++) {
    const t = preTaper === 1 ? 1 : i / (preTaper - 1);
    let km = currentKm + (peak - currentKm) * t;
    // Cutback every 4th week (weeks index 3, 7, 11, ...): drop 20%.
    if (i > 0 && (i + 1) % 4 === 0 && i !== preTaper - 1) {
      km = km * 0.8;
    }
    curve.push(round1(km));
  }

  const taperFactors = [0.8, 0.6, 0.5];
  for (let i = 0; i < taperWeeks; i++) {
    const factor = taperFactors[i] ?? taperFactors[taperFactors.length - 1];
    curve.push(round1(peak * factor));
  }

  return curve;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ---------------------------------------------------------------------------
// Microcycle (weekly session distribution)
// ---------------------------------------------------------------------------

export type SessionSpec = {
  type: WorkoutType;
  intensity: IntensityAnchor;
  distanceKm: number;
  /** 0=Mon, 1=Tue, 3=Thu, 5=Sat */
  dayOffset: 0 | 1 | 3 | 5;
};

const DAY_EASY1 = 0 as const;
const DAY_QUALITY = 1 as const;
const DAY_EASY2 = 3 as const;
const DAY_LONG = 5 as const;

/** 4 sessions/week: Mon easy / Tue quality / Thu easy / Sat long. */
export function microcycle(phase: BlockType, weekKm: number): SessionSpec[] {
  const km = Math.max(0, weekKm);
  switch (phase) {
    case "base":
      // 1 long + 3 easy; no quality.
      return [
        { type: "easy", intensity: "E", distanceKm: round1(km * 0.25), dayOffset: DAY_EASY1 },
        { type: "easy", intensity: "E", distanceKm: round1(km * 0.23), dayOffset: DAY_QUALITY },
        { type: "easy", intensity: "E", distanceKm: round1(km * 0.22), dayOffset: DAY_EASY2 },
        { type: "long", intensity: "E", distanceKm: round1(km * 0.3), dayOffset: DAY_LONG },
      ];
    case "build":
      // 1 long + 1 threshold + 2 easy.
      return [
        { type: "easy", intensity: "E", distanceKm: round1(km * 0.25), dayOffset: DAY_EASY1 },
        { type: "threshold", intensity: "T", distanceKm: round1(km * 0.2), dayOffset: DAY_QUALITY },
        { type: "easy", intensity: "E", distanceKm: round1(km * 0.25), dayOffset: DAY_EASY2 },
        { type: "long", intensity: "E", distanceKm: round1(km * 0.3), dayOffset: DAY_LONG },
      ];
    case "peak":
      // 1 long (with race-pace block) + 1 intervals + 1 threshold + 1 easy.
      return [
        { type: "easy", intensity: "E", distanceKm: round1(km * 0.25), dayOffset: DAY_EASY1 },
        { type: "intervals", intensity: "I", distanceKm: round1(km * 0.2), dayOffset: DAY_QUALITY },
        { type: "threshold", intensity: "T", distanceKm: round1(km * 0.2), dayOffset: DAY_EASY2 },
        { type: "long", intensity: "M", distanceKm: round1(km * 0.35), dayOffset: DAY_LONG },
      ];
    case "taper":
      // 1 long (reduced) + 1 short quality + 2 easy. Volume is already cut at week level.
      return [
        { type: "easy", intensity: "E", distanceKm: round1(km * 0.25), dayOffset: DAY_EASY1 },
        { type: "threshold", intensity: "T", distanceKm: round1(km * 0.2), dayOffset: DAY_QUALITY },
        { type: "easy", intensity: "E", distanceKm: round1(km * 0.25), dayOffset: DAY_EASY2 },
        { type: "long", intensity: "E", distanceKm: round1(km * 0.3), dayOffset: DAY_LONG },
      ];
    default:
      // Fallback for recovery/maintenance/transition: all easy.
      return [
        { type: "easy", intensity: "E", distanceKm: round1(km * 0.25), dayOffset: DAY_EASY1 },
        { type: "easy", intensity: "E", distanceKm: round1(km * 0.25), dayOffset: DAY_QUALITY },
        { type: "easy", intensity: "E", distanceKm: round1(km * 0.25), dayOffset: DAY_EASY2 },
        { type: "easy", intensity: "E", distanceKm: round1(km * 0.25), dayOffset: DAY_LONG },
      ];
  }
}

// ---------------------------------------------------------------------------
// Structured workout builder
// ---------------------------------------------------------------------------

const WARMUP_M = 2000;
const COOLDOWN_M = 1000;

// ± tolerance around the point pace per intensity anchor. Tighter for hard
// efforts (T/I) where pace discipline drives the adaptation; looser at E.
const PACE_BAND: Record<IntensityAnchor, number> = {
  E: 0.08,
  M: 0.04,
  T: 0.03,
  I: 0.03,
  R: 0.04,
};

function paceTarget(
  intensity: IntensityAnchor,
  paces: Paces | undefined,
): Step["target"] {
  if (!paces) return { type: "none" };
  const v = paces[intensity];
  const band = PACE_BAND[intensity];
  return {
    type: "pace_range",
    min_speed_mps: round2(v * (1 - band)),
    max_speed_mps: round2(v * (1 + band)),
  };
}

function distanceStep(
  intent: Step["intent"],
  meters: number,
  intensity: IntensityAnchor,
  paces: Paces | undefined,
): Step {
  return {
    kind: "step",
    intent,
    duration: { type: "distance", meters: Math.round(meters) },
    target: paceTarget(intensity, paces),
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Build a FIT-shaped Workout for a single session. Returns undefined for
 * continuous efforts where the top-level distance + pace already say it all
 * (plain easy/recovery runs, base/build/taper long runs).
 */
export function buildStructure(
  type: WorkoutType,
  intensity: IntensityAnchor,
  totalMeters: number,
  paces: Paces | undefined,
): WorkoutStructure | undefined {
  if (totalMeters < 500) return undefined;

  const blocks: (Step | Repeat)[] = (() => {
    switch (type) {
      case "long": {
        // Only peak-phase long runs carry a structured M-pace block.
        if (intensity !== "M" || totalMeters < 8000) return [];
        const work = Math.max(2000, totalMeters - WARMUP_M - COOLDOWN_M);
        return [
          distanceStep("warmup", WARMUP_M, "E", paces),
          distanceStep("work", work, "M", paces),
          distanceStep("cooldown", COOLDOWN_M, "E", paces),
        ];
      }

      case "threshold": {
        const workBudget = Math.max(2000, totalMeters - WARMUP_M - COOLDOWN_M);
        const repDist = 1200;
        const recDist = 400;
        const reps = clamp(Math.round(workBudget / (repDist + recDist)), 3, 5);
        return [
          distanceStep("warmup", WARMUP_M, "E", paces),
          {
            kind: "repeat",
            count: reps,
            children: [
              distanceStep("work", repDist, "T", paces),
              distanceStep("recovery", recDist, "E", paces),
            ],
          },
          distanceStep("cooldown", COOLDOWN_M, "E", paces),
        ];
      }

      case "intervals": {
        const workBudget = Math.max(2000, totalMeters - WARMUP_M - COOLDOWN_M);
        const repDist = 1000;
        const recDist = 400;
        const reps = clamp(Math.round(workBudget / (repDist + recDist)), 4, 6);
        return [
          distanceStep("warmup", WARMUP_M, "E", paces),
          {
            kind: "repeat",
            count: reps,
            children: [
              distanceStep("work", repDist, "I", paces),
              distanceStep("recovery", recDist, "E", paces),
            ],
          },
          distanceStep("cooldown", COOLDOWN_M, "E", paces),
        ];
      }

      case "race_pace": {
        const work = Math.max(2000, totalMeters - WARMUP_M - COOLDOWN_M);
        return [
          distanceStep("warmup", WARMUP_M, "E", paces),
          distanceStep("work", work, "M", paces),
          distanceStep("cooldown", COOLDOWN_M, "E", paces),
        ];
      }

      case "progression":
        return [
          distanceStep("active", totalMeters * 0.4, "E", paces),
          distanceStep("active", totalMeters * 0.3, "M", paces),
          distanceStep("active", totalMeters * 0.3, "T", paces),
        ];

      default:
        return [];
    }
  })();

  if (blocks.length === 0) return undefined;

  return {
    schema_version: 1,
    discipline: "endurance",
    sport: "run",
    blocks,
  };
}

export type StructureSummary = {
  distanceMeters: number;
  durationSeconds?: number;
  avgPaceMps?: number;
};

/**
 * Walk a structure tree and return total distance + distance-weighted
 * duration/pace. Duration/pace are omitted if any step lacks a pace target
 * or uses a non-distance duration (we can't aggregate cleanly).
 */
export function summarizeStructure(
  structure: WorkoutStructure,
): StructureSummary {
  let totalMeters = 0;
  let totalSeconds = 0;
  let timeKnown = true;

  const visit = (block: Step | Repeat, multiplier: number): void => {
    if (block.kind === "repeat") {
      for (const child of block.children) {
        visit(child, multiplier * block.count);
      }
      return;
    }
    if (block.duration.type !== "distance") {
      timeKnown = false;
      return;
    }
    const meters = block.duration.meters * multiplier;
    totalMeters += meters;
    if (block.target?.type === "pace_range") {
      const speed =
        (block.target.min_speed_mps + block.target.max_speed_mps) / 2;
      if (speed > 0) {
        totalSeconds += meters / speed;
        return;
      }
    }
    timeKnown = false;
  };

  for (const block of structure.blocks) visit(block, 1);

  const distanceMeters = Math.round(totalMeters);
  if (!timeKnown || totalSeconds <= 0) return { distanceMeters };
  return {
    distanceMeters,
    durationSeconds: Math.round(totalSeconds),
    avgPaceMps: round2(totalMeters / totalSeconds),
  };
}

// ---------------------------------------------------------------------------
// Date math
// ---------------------------------------------------------------------------

/** Add `days` to a YYYY-MM-DD calendar date, returning YYYY-MM-DD. */
export function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map((p) => Number.parseInt(p, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/** Days between two YYYY-MM-DD calendar dates. */
export function daysBetweenYmd(from: string, to: string): number {
  const [yf, mf, df] = from.split("-").map((p) => Number.parseInt(p, 10));
  const [yt, mt, dt] = to.split("-").map((p) => Number.parseInt(p, 10));
  const a = Date.UTC(yf, mf - 1, df);
  const b = Date.UTC(yt, mt - 1, dt);
  return Math.round((b - a) / 86_400_000);
}

/** Noon-UTC instant for a calendar day — avoids timezone edge cases. */
export function ymdToNoonUtc(ymd: string): string {
  return `${ymd}T12:00:00.000Z`;
}

// ---------------------------------------------------------------------------
// Workout name localization
// ---------------------------------------------------------------------------

export type Locale = "en" | "fr";

const NAME_BY_TYPE: Record<WorkoutType, { en: string; fr: string }> = {
  easy: { en: "Easy run", fr: "Course facile" },
  long: { en: "Long run", fr: "Sortie longue" },
  tempo: { en: "Tempo run", fr: "Tempo" },
  threshold: { en: "Threshold", fr: "Seuil" },
  intervals: { en: "Intervals", fr: "Intervalles" },
  vo2max: { en: "VO2 max", fr: "VO2 max" },
  fartlek: { en: "Fartlek", fr: "Fartlek" },
  progression: { en: "Progression run", fr: "Course progressive" },
  race_pace: { en: "Race pace", fr: "Allure de course" },
  recovery: { en: "Recovery run", fr: "Récupération" },
  strides: { en: "Strides", fr: "Lignes droites" },
  hills: { en: "Hill repeats", fr: "Côtes" },
  race: { en: "Race", fr: "Course" },
  test: { en: "Fitness test", fr: "Test de forme" },
  cross_training: { en: "Cross-training", fr: "Cross-training" },
  strength: { en: "Strength", fr: "Renforcement" },
  rest: { en: "Rest", fr: "Repos" },
  other: { en: "Workout", fr: "Séance" },
};

export function workoutName(type: WorkoutType, locale: Locale): string {
  return NAME_BY_TYPE[type][locale];
}
