/**
 * Pure periodization math for race plan generation.
 *
 * Paces come from Daniels VDOT. Volume distribution is 80/20 (easy/quality) in
 * Base, Build, and Taper; Peak shifts pyramidal to add race-specific M-pace
 * volume in the long run. Deterministic, no Convex deps, easy to test.
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

/**
 * 5K-specific race pace in m/s, derived from VDOT via inverse race-time prediction.
 * Slightly faster than I (vVO2max) for elites, slower for beginners — this is
 * "what the runner will actually race at 5K", not a fixed % of VO2max.
 */
export function fiveKPaceMps(vdot: number): number {
  if (!(vdot > 0)) return 0;
  const t = predictRaceTime(vdot, 5000);
  return t > 0 ? 5000 / t : 0;
}

/**
 * Predict the finish time (seconds) for `distanceMeters` at the athlete's
 * current `vdot` — the inverse of `computeVdot`. Race effort means the
 * %VO2max curve is solved as a function of time (not a fixed intensity), so
 * we bisect on t: VDOT(t) is monotonically decreasing at fixed distance, so
 * convergence is clean. Bracket [100s, 30000s] covers everything from a
 * 1:40 5K (above world-class) to a 6-hour marathon walk.
 */
export function predictRaceTime(vdot: number, distanceMeters: number): number {
  if (!(vdot > 0) || !(distanceMeters > 0)) return 0;
  let lo = 100;
  let hi = 30000;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const vMpm = distanceMeters / (mid / 60);
    const vo2 = -4.6 + 0.182258 * vMpm + 0.000104 * vMpm * vMpm;
    const tMin = mid / 60;
    const pct =
      0.8 +
      0.1894393 * Math.exp(-0.012778 * tMin) +
      0.2989558 * Math.exp(-0.1932605 * tMin);
    const guess = vo2 / pct;
    if (guess > vdot) lo = mid;
    else hi = mid;
    if (hi - lo < 0.05) break;
  }
  return (lo + hi) / 2;
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

/**
 * Minimum weeks between plan start and race for the plan to be pedagogically
 * meaningful for this format. `undefined` = no minimum enforced (yet).
 *
 * 5K floor = 4 weeks: that's the shortest split that still produces
 * build=2 + peak=1 + taper=1 (one construction-early + one construction-late
 * + spécifique + taper). Below 4 weeks, the build collapses to 0 or 1 week
 * and the plan has no training value.
 */
export function minimumPlanWeeksForFormat(
  format: RaceFormat | undefined,
): number | undefined {
  if (format === "5k") return 4;
  return undefined;
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
 *
 * 5K override: build = 4 (2 early + 2 late), peak = 1 (race-specific week),
 * base = remaining. Compressed 5K plans clamp build/peak first, base last.
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

  if (format === "5k") {
    // 5K targets: peak = 1 (spécifique), build = 4 (2 début + 2 fin), base = rest.
    // Below 6 total weeks, compress build/peak first.
    if (remaining <= 1) {
      return { base: 0, build: 0, peak: remaining, taper };
    }
    if (remaining <= 2) {
      return { base: 0, build: 1, peak: 1, taper };
    }
    if (remaining <= 5) {
      // Not enough for full 4-week build — split remaining as build + 1 peak.
      const peak = 1;
      const build = remaining - peak;
      return { base: 0, build, peak, taper };
    }
    const peak = 1;
    const build = 4;
    const base = remaining - build - peak;
    return { base, build, peak, taper };
  }

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
// Fitness plan shape
// ---------------------------------------------------------------------------

export type FitnessIntent =
  | "start_running"
  | "restart_running"
  | "build_base"
  | "maintain_fitness";

export type FitnessShape = {
  weeks: number;
  startKm: number;
  endKm: number;
};

/**
 * Length + volume bookends per fitness intent. `start_running` ignores the
 * athlete's baseline (the fallback is meaningless for someone who isn't yet
 * a runner) and uses a hardcoded floor; the others ramp off recent volume.
 */
export function fitnessPlanShape(
  intent: FitnessIntent,
  baselineKm: number,
): FitnessShape {
  switch (intent) {
    case "start_running":
      return { weeks: 8, startKm: 10, endKm: 20 };
    case "restart_running":
      return { weeks: 8, startKm: baselineKm * 0.5, endKm: baselineKm };
    case "build_base":
      return { weeks: 12, startKm: baselineKm, endKm: baselineKm * 1.4 };
    case "maintain_fitness":
      return { weeks: 4, startKm: baselineKm, endKm: baselineKm };
  }
}

/**
 * Per-week target km. Linear ramp `startKm → endKm` with a -20% cutback every
 * 4th week (skipping the last week). No taper — fitness plans don't peak.
 */
export function fitnessVolumeCurve(shape: FitnessShape): number[] {
  const { weeks, startKm, endKm } = shape;
  const curve: number[] = [];
  for (let i = 0; i < weeks; i++) {
    const t = weeks === 1 ? 1 : i / (weeks - 1);
    let km = startKm + (endKm - startKm) * t;
    if ((i + 1) % 4 === 0 && i !== weeks - 1) {
      km = km * 0.8;
    }
    curve.push(round1(km));
  }
  return curve;
}

// ---------------------------------------------------------------------------
// Microcycle (weekly session distribution)
// ---------------------------------------------------------------------------

export type SessionSpec = {
  type: WorkoutType;
  intensity: IntensityAnchor;
  distanceKm: number;
  /** ISO day-of-week: 0=Mon … 6=Sun. */
  dayOfWeek: number;
  /** 0-based week index within the current phase block. Used by per-distance
   * planners to vary content week-over-week (e.g. SV1 alternating with a
   * non-quality long in 5K build-late). */
  weekIndexInPhase?: number;
  /** When set, `buildStructure` ignores type/intensity/distance and uses this
   * spec verbatim. Set by per-distance planners (5K, 10K, ...). */
  structureSpec?: StructureSpec;
};

export type Schedule = {
  /** ISO day-of-week (0=Mon … 6=Sun). Deduped + sorted internally. */
  availableDays: number[];
  /** Target sessions/week. Clamped to availableDays.length. */
  sessionsPerWeek: number;
};

/** Used when an athlete has no recorded schedule yet (legacy plans). */
export const DEFAULT_SCHEDULE: Schedule = {
  availableDays: [1, 2, 3, 5], // Tue, Wed, Thu, Sat — preserves prior behaviour
  sessionsPerWeek: 4,
};

type Role = "easy" | "long" | "threshold" | "intervals";

/**
 * Pick which day-of-week slots receive a session this week.
 * Spreads picks evenly across `availableDays` to maximise recovery gaps —
 * e.g. with 7 days available and 3 sessions/week, returns [Mon, Thu, Sun].
 */
export function pickTrainingDays(schedule: Schedule): number[] {
  const sorted = [...new Set(schedule.availableDays)]
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .sort((a, b) => a - b);
  if (sorted.length === 0) return [];
  const n = Math.max(1, Math.min(schedule.sessionsPerWeek, sorted.length));
  if (n === sorted.length) return sorted;
  if (n === 1) return [sorted[sorted.length - 1]!]; // single session → long-run only
  const picked: number[] = [];
  for (let i = 0; i < n; i++) {
    const idx = Math.round((i * (sorted.length - 1)) / (n - 1));
    picked.push(sorted[idx]!);
  }
  return [...new Set(picked)].sort((a, b) => a - b);
}

/**
 * Lay out session roles across `n` picked days, indexed earliest → latest.
 * Long always lands on the latest pick; quality sits with a recovery gap
 * from long when possible.
 */
function rolesForPhase(phase: BlockType, n: number): Role[] {
  if (n === 0) return [];
  const roles: Role[] = Array.from({ length: n }, () => "easy" as Role);
  roles[n - 1] = "long";
  if (n === 1) return roles;

  switch (phase) {
    case "peak":
      // intervals + threshold, both qualities. Spread them out when there's room.
      if (n >= 4) {
        roles[1] = "intervals";
        roles[n >= 6 ? n - 3 : 2] = "threshold";
      } else if (n === 3) {
        roles[0] = "intervals";
        roles[1] = "threshold";
      } else {
        // n === 2
        roles[0] = "threshold";
      }
      return roles;
    case "build":
    case "taper":
      roles[n >= 4 ? 1 : 0] = "threshold";
      return roles;
    case "base":
    default:
      return roles; // long + easies
  }
}

/**
 * Build the week's session list for `phase` at `weekKm`, placed on the
 * athlete's `schedule`. Volume is split: long ≈ 30 % (35 % in peak), each
 * quality ≈ 20 %, easies share what's left. If a role's normal share has
 * nowhere to land (e.g. 1 session/week), it folds into the long run.
 *
 * Generic algorithm — distance-specific philosophies live in `./plans/<dist>.ts`
 * and are dispatched at the engine layer (`engine/generatePlan.ts`), not here.
 */
export function microcycle(
  phase: BlockType,
  weekKm: number,
  schedule: Schedule = DEFAULT_SCHEDULE,
): SessionSpec[] {
  const km = Math.max(0, weekKm);
  const days = pickTrainingDays(schedule);
  if (days.length === 0) return [];
  const roles = rolesForPhase(phase, days.length);

  const longFracBase = phase === "peak" ? 0.35 : 0.30;
  const qualityFrac = roles.includes("threshold") ? 0.20 : 0;
  const intervalsFrac = roles.includes("intervals") ? 0.20 : 0;
  const easyCount = roles.filter((r) => r === "easy").length;
  const remainder = Math.max(0, 1 - longFracBase - qualityFrac - intervalsFrac);
  const easyFrac = easyCount > 0 ? remainder / easyCount : 0;
  // When there are no easies the unallocated share folds back into the long.
  const longFrac = easyCount > 0 ? longFracBase : longFracBase + remainder;

  return roles.map((role, i) => {
    const dayOfWeek = days[i]!;
    switch (role) {
      case "long":
        return {
          type: "long",
          intensity: phase === "peak" ? "M" : "E",
          distanceKm: round1(km * longFrac),
          dayOfWeek,
        };
      case "threshold":
        return {
          type: "threshold",
          intensity: "T",
          distanceKm: round1(km * qualityFrac),
          dayOfWeek,
        };
      case "intervals":
        return {
          type: "intervals",
          intensity: "I",
          distanceKm: round1(km * intervalsFrac),
          dayOfWeek,
        };
      case "easy":
        return {
          type: "easy",
          intensity: "E",
          distanceKm: round1(km * easyFrac),
          dayOfWeek,
        };
    }
  });
}

/** ISO day-of-week (0=Mon … 6=Sun) for a YYYY-MM-DD calendar date. */
export function isoDayOfWeek(ymd: string): number {
  const [y, m, d] = ymd.split("-").map((p) => Number.parseInt(p, 10));
  // JS getUTCDay returns 0=Sun..6=Sat → convert to ISO 0=Mon..6=Sun.
  return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
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

// RPE fallback when no paces are available (e.g. fitness plans with no VDOT).
// Borg CR10-flavoured: conversational at E, all-out at R.
const RPE_BY_INTENSITY: Record<IntensityAnchor, number> = {
  E: 3,
  M: 6,
  T: 7,
  I: 9,
  R: 10,
};

function paceTarget(
  intensity: IntensityAnchor,
  paces: Paces | undefined,
): Step["target"] {
  if (!paces) return { type: "rpe", value: RPE_BY_INTENSITY[intensity] };
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

function timeStep(
  intent: Step["intent"],
  seconds: number,
  intensity: IntensityAnchor,
  paces: Paces | undefined,
): Step {
  return {
    kind: "step",
    intent,
    duration: { type: "time", seconds: Math.round(seconds) },
    target: paceTarget(intensity, paces),
  };
}

function pacedDistanceStep(
  intent: Step["intent"],
  meters: number,
  paceMps: number,
): Step {
  const band = 0.02;
  return {
    kind: "step",
    intent,
    duration: { type: "distance", meters: Math.round(meters) },
    target:
      paceMps > 0
        ? {
            type: "pace_range",
            min_speed_mps: round2(paceMps * (1 - band)),
            max_speed_mps: round2(paceMps * (1 + band)),
          }
        : { type: "rpe", value: 9 },
  };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Distance-specific session shape. Lets a per-distance planner (5K, 10K, etc.)
 * own exactly which intervals/recoveries to emit, instead of stretching the
 * generic shape-by-type-and-distance logic in `buildStructure` below.
 *
 * Recoveries are time-based (the right unit for an interval rest); warmup/cooldown
 * are time-based too so they scale to the runner's E pace, not a fixed distance.
 */
export type StructureSpec =
  | { kind: "easy_continuous"; durationSec: number; addStrides?: boolean }
  | { kind: "long_continuous"; durationSec: number }
  | {
      kind: "long_with_blocks";
      warmupSec: number;
      cooldownSec: number;
      reps: number;
      workDurationSec: number;
      recoveryDurationSec: number;
      workIntensity: IntensityAnchor; // M for SV1, T for SV2-tempo, etc.
    }
  | {
      kind: "intervals_distance";
      warmupSec: number;
      cooldownSec: number;
      reps: number;
      repDistanceM: number;
      repIntensity: IntensityAnchor;
      recoverySec: number;
    }
  | {
      kind: "intervals_paced";
      warmupSec: number;
      cooldownSec: number;
      reps: number;
      repDistanceM: number;
      targetPaceMps: number; // explicit pace (e.g. 5K race pace from VDOT)
      recoverySec: number;
    }
  | {
      kind: "mixed";
      warmupSec: number;
      cooldownSec: number;
      first: {
        reps: number;
        repDistanceM: number;
        repIntensity: IntensityAnchor;
        recoverySec: number;
      };
      second: {
        reps: number;
        repDistanceM: number;
        repIntensity: IntensityAnchor;
        recoverySec: number;
      };
      bridgeSec: number; // recovery between the two blocks
    };

const STRIDES_REPS = 6;
const STRIDES_DISTANCE_M = 100;
const STRIDES_RECOVERY_M = 100;

function stridesRepeat(paces: Paces | undefined): Repeat {
  return {
    kind: "repeat",
    count: STRIDES_REPS,
    children: [
      distanceStep("active", STRIDES_DISTANCE_M, "R", paces),
      distanceStep("recovery", STRIDES_RECOVERY_M, "E", paces),
    ],
  };
}

/**
 * Build a structure from a per-distance planner's `StructureSpec`. This is
 * the path used by 5K (and future 10K/Half/Marathon) modules. The generic
 * `buildStructure` switch on `type` stays as the fallback for any caller
 * that hasn't been migrated.
 */
export function buildFromSpec(
  spec: StructureSpec,
  paces: Paces | undefined,
): WorkoutStructure | undefined {
  const blocks: (Step | Repeat)[] = (() => {
    switch (spec.kind) {
      case "easy_continuous": {
        const out: (Step | Repeat)[] = [
          timeStep("work", spec.durationSec, "E", paces),
        ];
        if (spec.addStrides) out.push(stridesRepeat(paces));
        return out;
      }
      case "long_continuous":
        return [timeStep("work", spec.durationSec, "E", paces)];
      case "long_with_blocks":
        return [
          timeStep("warmup", spec.warmupSec, "E", paces),
          {
            kind: "repeat",
            count: spec.reps,
            children: [
              timeStep("work", spec.workDurationSec, spec.workIntensity, paces),
              timeStep("recovery", spec.recoveryDurationSec, "E", paces),
            ],
          },
          timeStep("cooldown", spec.cooldownSec, "E", paces),
        ];
      case "intervals_distance":
        return [
          timeStep("warmup", spec.warmupSec, "E", paces),
          {
            kind: "repeat",
            count: spec.reps,
            children: [
              distanceStep("work", spec.repDistanceM, spec.repIntensity, paces),
              timeStep("recovery", spec.recoverySec, "E", paces),
            ],
          },
          timeStep("cooldown", spec.cooldownSec, "E", paces),
        ];
      case "intervals_paced":
        return [
          timeStep("warmup", spec.warmupSec, "E", paces),
          {
            kind: "repeat",
            count: spec.reps,
            children: [
              pacedDistanceStep("work", spec.repDistanceM, spec.targetPaceMps),
              timeStep("recovery", spec.recoverySec, "E", paces),
            ],
          },
          timeStep("cooldown", spec.cooldownSec, "E", paces),
        ];
      case "mixed":
        return [
          timeStep("warmup", spec.warmupSec, "E", paces),
          {
            kind: "repeat",
            count: spec.first.reps,
            children: [
              distanceStep(
                "work",
                spec.first.repDistanceM,
                spec.first.repIntensity,
                paces,
              ),
              timeStep("recovery", spec.first.recoverySec, "E", paces),
            ],
          },
          timeStep("recovery", spec.bridgeSec, "E", paces),
          {
            kind: "repeat",
            count: spec.second.reps,
            children: [
              distanceStep(
                "work",
                spec.second.repDistanceM,
                spec.second.repIntensity,
                paces,
              ),
              timeStep("recovery", spec.second.recoverySec, "E", paces),
            ],
          },
          timeStep("cooldown", spec.cooldownSec, "E", paces),
        ];
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

/**
 * Build a FIT-shaped Workout for a single session. Every training session gets
 * a structure — continuous efforts (easy, recovery, sub-peak long) collapse to
 * a single `work` step so device export and UI breakdown work uniformly.
 * Returns undefined only for sessions too short to bother with (< 500m).
 *
 * If a `spec` is provided, delegates to `buildFromSpec` and ignores the
 * type/intensity/totalMeters shape. Per-distance modules (5K, 10K, etc.)
 * pass a spec; the legacy generic path keeps the type-based switch.
 */
export function buildStructure(
  type: WorkoutType,
  intensity: IntensityAnchor,
  totalMeters: number,
  paces: Paces | undefined,
  spec?: StructureSpec,
): WorkoutStructure | undefined {
  if (spec) return buildFromSpec(spec, paces);
  if (totalMeters < 500) return undefined;

  const blocks: (Step | Repeat)[] = (() => {
    switch (type) {
      case "long": {
        // Peak-phase long runs carry a structured M-pace block; everything
        // else is a single continuous easy effort.
        if (intensity !== "M" || totalMeters < 8000) {
          return [distanceStep("work", totalMeters, intensity, paces)];
        }
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

      case "easy":
      case "recovery":
        return [distanceStep("work", totalMeters, intensity, paces)];

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

/**
 * Race-day structure: a single `work` step over the race distance. Target is
 * a goal-pace band when a time goal exists, otherwise RPE 10 (race effort).
 * No warmup/cooldown — those are pre/post-race routine, not the race itself.
 */
export function buildRaceStructure(args: {
  distanceMeters: number;
  goalSeconds?: number;
}): WorkoutStructure | undefined {
  if (args.distanceMeters < 500) return undefined;
  const target: Step["target"] =
    args.goalSeconds && args.goalSeconds > 0
      ? (() => {
          const v = args.distanceMeters / args.goalSeconds;
          const band = 0.02;
          return {
            type: "pace_range",
            min_speed_mps: round2(v * (1 - band)),
            max_speed_mps: round2(v * (1 + band)),
          };
        })()
      : { type: "rpe", value: 10 };
  return {
    schema_version: 1,
    discipline: "endurance",
    sport: "run",
    blocks: [
      {
        kind: "step",
        intent: "work",
        duration: { type: "distance", meters: Math.round(args.distanceMeters) },
        target,
      },
    ],
  };
}

/**
 * A 5K time trial: easy warmup + 5km all-out (RPE 10) + easy cooldown. Used
 * as a baseline workout when the runner has no time goal — the result lets
 * downstream code compute VDOT and re-pace the rest of the plan.
 */
export function buildTestStructure(): WorkoutStructure {
  return {
    schema_version: 1,
    discipline: "endurance",
    sport: "run",
    blocks: [
      {
        kind: "step",
        intent: "warmup",
        duration: { type: "distance", meters: 2000 },
        target: { type: "none" },
      },
      {
        kind: "step",
        intent: "work",
        duration: { type: "distance", meters: 5000 },
        target: { type: "rpe", value: 10 },
      },
      {
        kind: "step",
        intent: "cooldown",
        duration: { type: "distance", meters: 1000 },
        target: { type: "none" },
      },
    ],
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
// Workout name (structure-aware summary)
// ---------------------------------------------------------------------------

export type Locale = "en" | "fr";

const TYPE_LABEL: Record<WorkoutType, { en: string; fr: string }> = {
  easy: { en: "Easy", fr: "Facile" },
  long: { en: "Long", fr: "Long" },
  threshold: { en: "Threshold", fr: "Seuil" },
  intervals: { en: "Intervals", fr: "Intervalles" },
  race_pace: { en: "Race pace", fr: "Allure de course" },
  recovery: { en: "Recovery", fr: "Récup" },
  race: { en: "Race", fr: "Course" },
  test: { en: "Fitness test", fr: "Test" },
};

const WITH: Record<Locale, string> = { en: "w/", fr: "avec" };

function formatKm(meters: number): string {
  const km = Math.round((meters / 1000) * 10) / 10;
  return Number.isInteger(km) ? `${km} km` : `${km.toFixed(1)} km`;
}

function formatRepMeters(meters: number): string {
  return `${Math.round(meters)}m`;
}

function formatPaceMinPerKm(mps: number): string {
  const secPerKm = 1000 / mps;
  let min = Math.floor(secPerKm / 60);
  let sec = Math.round(secPerKm - min * 60);
  if (sec === 60) {
    min += 1;
    sec = 0;
  }
  return `${min}:${sec.toString().padStart(2, "0")}`;
}

function paceFromStep(step: Step): number | undefined {
  if (step.target?.type !== "pace_range") return undefined;
  return (step.target.min_speed_mps + step.target.max_speed_mps) / 2;
}

/**
 * Build a human-readable summary name for a generated workout.
 *
 *   "5 km - Easy"                       continuous easy/recovery/long
 *   "5×1200m @ 3:42"                    threshold/intervals (repeat)
 *   "20 km - Long w/ 8 km @ 5:00"       long run with M-pace block
 *   "8 km @ 5:00"                       race-pace tune-up
 *   "12 km - Progression"               progression
 *
 * Pace clause omitted when there's no goal time.
 */
export function workoutName(args: {
  type: WorkoutType;
  distanceMeters: number;
  structure?: WorkoutStructure;
  locale: Locale;
}): string {
  const { type, distanceMeters, structure, locale } = args;
  const label = TYPE_LABEL[type][locale];
  const totalKm = formatKm(distanceMeters);

  // Repeat-based session (threshold, intervals): "N×{dist} @ {pace}".
  const repeat = structure?.blocks.find(
    (b): b is Repeat => b.kind === "repeat",
  );
  if (repeat) {
    const work = repeat.children.find((c) => c.intent === "work");
    if (work && work.duration.type === "distance") {
      const dist = formatRepMeters(work.duration.meters);
      const pace = paceFromStep(work);
      return pace
        ? `${repeat.count}×${dist} @ ${formatPaceMinPerKm(pace)}`
        : `${repeat.count}×${dist} - ${label}`;
    }
  }

  // Single work step (long w/ M block, race_pace).
  const workStep = structure?.blocks.find(
    (b): b is Step => b.kind === "step" && b.intent === "work",
  );
  if (workStep && workStep.duration.type === "distance") {
    const workKm = formatKm(workStep.duration.meters);
    const pace = paceFromStep(workStep);
    if (type === "long") {
      return pace
        ? `${totalKm} - ${label} ${WITH[locale]} ${workKm} @ ${formatPaceMinPerKm(pace)}`
        : `${totalKm} - ${label}`;
    }
    return pace ? `${workKm} @ ${formatPaceMinPerKm(pace)}` : `${workKm} - ${label}`;
  }

  // No structure (or no work block) → "{km} - {Label}".
  return `${totalKm} - ${label}`;
}
