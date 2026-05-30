/**
 * Pure 5K plan orchestration — the single source of truth for what a 5K plan
 * contains. Both the production generator (`engine/generatePlan.ts` → `generate`)
 * and the admin Playground simulator call this function: the generator persists
 * the result, the simulator renders it. Sharing one core guarantees the
 * simulator shows *exactly* what production produces — no drift.
 *
 * It mirrors the former inline orchestration in `generate` line-for-line, but is
 * decoupled from persistence: instead of writing each workout to the DB, it
 * returns a `FiveKPlanTrace` where every session carries whether it was dropped
 * by the emit guards and why (the key debugging payload).
 *
 * ⚠️ NO convex runtime imports. This file is imported into the admin browser
 * bundle, so its entire transitive runtime graph must stay Convex-free. Keep all
 * `@nativesquare/agoge*` imports `import type` (they erase at build) so
 * `convex/values` never leaks in.
 */

import type { Workout as WorkoutStructure } from "@nativesquare/agoge";
import type { BlockType } from "@nativesquare/agoge/schema";
import {
  addDaysYmd,
  buildRaceStructure,
  buildStructure,
  computeVdot,
  distancePeakKm,
  isoDayOfWeek,
  type Locale,
  type Paces,
  type Schedule,
  type SessionSpec,
  summarizeStructure,
  trainingPaces,
  weeklyVolumeCurve,
  workoutName,
} from "../periodization";
import {
  type FiveKGrid,
  fiveKGrid,
  microcycle5K,
  taperSessions5K,
} from "./fiveK";

// 5K taper volume as a fraction of peak — drives EF duration + warmup scaling
// for the taper's easy days (the taper itself is mostly rest + a short tune-up).
// Single source of truth: `generate` imports it from here.
export const TAPER_VOLUME_FACTOR = 0.6;

const DEFAULT_5K_DISTANCE_M = 5000;

// ---------------------------------------------------------------------------
// Phase-count helpers (moved out of generatePlan.ts so both the generator and
// the simulator share them; `expandPhases` is also used by the non-5K branch).
// ---------------------------------------------------------------------------

/**
 * Split a 5K plan's pre-taper Mon→Sun weeks into base/build/peak. Mirrors the
 * 5K intent of `splitPhases` (peak = 1 spécifique week, build = up to 4, base =
 * the rest) but operates on the week count directly, since the 5K taper is
 * sized in days and created separately by `createBlocks5K`.
 */
export function fiveKPreTaperSplit(preTaperWeeks: number): {
  base: number;
  build: number;
  peak: number;
} {
  if (preTaperWeeks <= 0) return { base: 0, build: 0, peak: 0 };
  if (preTaperWeeks === 1) return { base: 0, build: 0, peak: 1 };
  const peak = 1;
  const build = Math.min(4, preTaperWeeks - peak);
  const base = preTaperWeeks - peak - build;
  return { base, build, peak };
}

export function expandPhases(phases: {
  base: number;
  build: number;
  peak: number;
  taper: number;
}): BlockType[] {
  const out: BlockType[] = [];
  for (let i = 0; i < phases.base; i++) out.push("base");
  for (let i = 0; i < phases.build; i++) out.push("build");
  for (let i = 0; i < phases.peak; i++) out.push("peak");
  for (let i = 0; i < phases.taper; i++) out.push("taper");
  return out;
}

// ---------------------------------------------------------------------------
// Inputs + trace types
// ---------------------------------------------------------------------------

export type BuildFiveKPlanInputs = {
  /** Plan start (YYYY-MM-DD). An input — never `new Date()` inside this fn. */
  planStartYmd: string;
  /** Race day (YYYY-MM-DD). */
  raceYmd: string;
  /** Baseline weekly volume. Replaces `loadBaselineVolume` (which used the clock). */
  currentKm: number;
  schedule: Schedule;
  /** Affects `workoutName` labels only. */
  locale: Locale;
  /** Defaults to 5000; feeds peakKm derivation + race structure. */
  raceDistanceMeters?: number;
  /** Explicit peak weekly km; else derived via `distancePeakKm("5k", dist)`. */
  peakKm?: number;
  /** Pacing resolution priority: `paces` > `vdot` > `targetTimeSeconds`. */
  paces?: Paces;
  vdot?: number;
  targetTimeSeconds?: number;
};

/** Why the emit guards would have dropped a session (instead of persisting it). */
export type DropReason =
  | "before-plan-start"
  | "on-or-after-race"
  | "too-short-no-spec"
  | "structure-empty";

export type TracedSession = {
  dateYmd: string;
  /** isoDayOfWeek(dateYmd): 0=Mon … 6=Sun — for the calendar grid. */
  dayOfWeek: number;
  spec: SessionSpec;
  dropped: boolean;
  /** Present iff dropped — the key debugging payload. */
  dropReason?: DropReason;
  /** Present iff not dropped. */
  structure?: WorkoutStructure;
  workoutName?: string;
  labelDistanceMeters?: number;
};

export type TracedWeek = {
  weekIndex: number;
  phase: BlockType;
  weekIndexInPhase: number;
  weekKm: number;
  /** Monday: addDaysYmd(gridStartYmd, weekIndex*7). */
  weekStartYmd: string;
  sessions: TracedSession[];
};

export type FiveKPlanTrace = {
  inputs: BuildFiveKPlanInputs;
  resolved: { vdot?: number; paces?: Paces; peakKm: number; planPeakKm: number };
  grid: FiveKGrid;
  preTaperSplit: { base: number; build: number; peak: number };
  phaseByWeek: BlockType[];
  volumeCurve: number[];
  weeks: TracedWeek[];
  taper: { sessions: TracedSession[] };
  race: { dateYmd: string; structure?: WorkoutStructure } | null;
  /** Block layout, mirroring `createBlocks5K`'s date math (no DB). */
  blocks: Array<{ type: BlockType; startYmd: string; endYmd: string }>;
};

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

function resolvePaces(i: BuildFiveKPlanInputs): {
  vdot?: number;
  paces?: Paces;
} {
  if (i.paces) return { vdot: i.vdot, paces: i.paces };
  const vdot =
    i.vdot ??
    (i.targetTimeSeconds && i.targetTimeSeconds > 0
      ? computeVdot(i.raceDistanceMeters ?? DEFAULT_5K_DISTANCE_M, i.targetTimeSeconds)
      : undefined);
  return { vdot, paces: vdot !== undefined ? trainingPaces(vdot) : undefined };
}

type TraceCommon = {
  planStartYmd: string;
  raceYmd: string;
  paces?: Paces;
  locale: Locale;
};

/**
 * Pure mirror of `emitTrainingWorkout` (generatePlan.ts): same guard order, same
 * `buildStructure` arguments, same `summarizeStructure`/`workoutName` calls. The
 * combined date guard is split into two distinct drop reasons for the trace, but
 * the net drop decision is identical.
 */
function traceSession(
  common: TraceCommon,
  dateYmd: string,
  spec: SessionSpec,
): TracedSession {
  const base = { dateYmd, dayOfWeek: isoDayOfWeek(dateYmd), spec };
  if (dateYmd < common.planStartYmd) {
    return { ...base, dropped: true, dropReason: "before-plan-start" };
  }
  if (dateYmd >= common.raceYmd) {
    return { ...base, dropped: true, dropReason: "on-or-after-race" };
  }
  const distanceMeters = Math.round(spec.distanceKm * 1000);
  if (distanceMeters < 500 && !spec.structureSpec) {
    return { ...base, dropped: true, dropReason: "too-short-no-spec" };
  }
  const structure = buildStructure(
    spec.type,
    spec.intensity,
    distanceMeters,
    common.paces,
    spec.structureSpec,
  );
  if (!structure) {
    return { ...base, dropped: true, dropReason: "structure-empty" };
  }
  const labelDistance = summarizeStructure(structure).distanceMeters;
  return {
    ...base,
    dropped: false,
    structure,
    labelDistanceMeters: labelDistance,
    workoutName: workoutName({
      type: spec.type,
      distanceMeters: labelDistance,
      structure,
      locale: common.locale,
    }),
  };
}

/** Pure copy of `createBlocks5K`'s date math (no `ctx.runMutation`). */
function buildBlocks(
  gridStartYmd: string,
  planStartYmd: string,
  taperStartYmd: string,
  raceYmd: string,
  phaseByWeek: BlockType[],
): Array<{ type: BlockType; startYmd: string; endYmd: string }> {
  const blocks: Array<{ type: BlockType; startYmd: string; endYmd: string }> = [];
  const order: BlockType[] = ["base", "build", "peak"];
  for (const phase of order) {
    const startIdx = phaseByWeek.indexOf(phase);
    if (startIdx === -1) continue;
    let endIdx = startIdx;
    while (endIdx + 1 < phaseByWeek.length && phaseByWeek[endIdx + 1] === phase) {
      endIdx++;
    }
    const gridBlockStart = addDaysYmd(gridStartYmd, startIdx * 7);
    const startYmd = gridBlockStart < planStartYmd ? planStartYmd : gridBlockStart;
    const endYmd = addDaysYmd(gridStartYmd, (endIdx + 1) * 7 - 1);
    blocks.push({ type: phase, startYmd, endYmd });
  }
  const taperStart =
    taperStartYmd < planStartYmd ? planStartYmd : taperStartYmd;
  blocks.push({ type: "taper", startYmd: taperStart, endYmd: raceYmd });
  return blocks;
}

/**
 * Build the full traced 5K plan. Reproduces the orchestration formerly inlined
 * in `generate`'s 5K branch: grid → pre-taper split → phaseByWeek → volume curve
 * → per-week microcycles → taper → race.
 */
export function buildFiveKPlan(inputs: BuildFiveKPlanInputs): FiveKPlanTrace {
  const { planStartYmd, raceYmd, currentKm, schedule, locale } = inputs;
  const raceDistanceMeters = inputs.raceDistanceMeters ?? DEFAULT_5K_DISTANCE_M;
  const { vdot, paces } = resolvePaces(inputs);
  const peakKm = inputs.peakKm ?? distancePeakKm("5k", raceDistanceMeters);

  const grid = fiveKGrid(planStartYmd, raceYmd);
  const { gridStartYmd, taperStartYmd, preTaperWeeks } = grid;

  const preTaperSplit = fiveKPreTaperSplit(preTaperWeeks);
  const phaseByWeek = expandPhases({ ...preTaperSplit, taper: 0 });
  const maxBuildMultiple = preTaperWeeks + 1 < 6 ? 1.2 : 2.5;
  const volumeCurve = weeklyVolumeCurve({
    weeks: preTaperWeeks,
    currentKm,
    peakKm,
    taperWeeks: 0,
    maxBuildMultiple,
  });
  const planPeakKm = Math.max(currentKm, ...volumeCurve);

  const common: TraceCommon = { planStartYmd, raceYmd, paces, locale };

  const weeks: TracedWeek[] = [];
  let weekIndexInPhase = 0;
  let prevPhase: BlockType | undefined;
  for (let w = 0; w < preTaperWeeks; w++) {
    const phase = phaseByWeek[w];
    if (!phase) continue;
    const weekKm = volumeCurve[w] ?? 0;
    const weekStartYmd = addDaysYmd(gridStartYmd, w * 7); // a Monday

    if (phase === prevPhase) {
      weekIndexInPhase += 1;
    } else {
      weekIndexInPhase = 0;
      prevPhase = phase;
    }

    const sessions = microcycle5K({
      phase,
      weekIndexInPhase,
      weekKm,
      schedule,
      peakKm: planPeakKm,
      paces,
      vdot,
      // Peak only: anchors the last race-pace spé to J-8→J-10 before the race.
      raceDow: isoDayOfWeek(raceYmd),
    });

    const traced: TracedSession[] = sessions.map((session) => {
      // weekStart is a Monday, so day-of-week (0=Mon) is the offset directly.
      const dateYmd = addDaysYmd(weekStartYmd, session.dayOfWeek);
      return traceSession(common, dateYmd, session);
    });

    weeks.push({
      weekIndex: w,
      phase,
      weekIndexInPhase,
      weekKm,
      weekStartYmd,
      sessions: traced,
    });
  }

  // Taper: variable-length tail laid out over absolute dates.
  const taperList = taperSessions5K({
    taperStartYmd,
    raceYmd,
    weekKm: planPeakKm * TAPER_VOLUME_FACTOR,
    peakKm: planPeakKm,
    schedule,
    paces,
    vdot,
  });
  const taperSessions = taperList.map(({ spec, dateYmd }) =>
    traceSession(common, dateYmd, spec),
  );

  // Race day: emitted as its own workout in production.
  const raceStructure = buildRaceStructure({
    distanceMeters: raceDistanceMeters,
    goalSeconds: inputs.targetTimeSeconds,
  });

  return {
    inputs,
    resolved: { vdot, paces, peakKm, planPeakKm },
    grid,
    preTaperSplit,
    phaseByWeek,
    volumeCurve,
    weeks,
    taper: { sessions: taperSessions },
    race: raceStructure
      ? { dateYmd: raceYmd, structure: raceStructure }
      : null,
    blocks: buildBlocks(
      gridStartYmd,
      planStartYmd,
      taperStartYmd,
      raceYmd,
      phaseByWeek,
    ),
  };
}
