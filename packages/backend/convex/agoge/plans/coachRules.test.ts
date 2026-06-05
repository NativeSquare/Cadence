/**
 * Behavioural tests for coach Mathieu Bert's progression & variety rules
 * (WhatsApp, 2026-06-05), asserted across all four distance builders:
 *
 *  R1 — the long endurance run never grows more than 10%/week and progresses
 *       steadily (build/peak especially).
 *  R2 — the taper keeps its volume drop but its easy runs differ (one shorter,
 *       one longer), never two identical.
 *  R3 — base easy runs ramp ~40min → 1h by base-week index, independent of
 *       weekly volume (extra base volume goes to the long run).
 *  R4 — no easy distance repeats in a plan (best-effort + distance jitter), and
 *       the long run draws varied sessions rather than the same one each week.
 *
 * No Convex deps — runs under vitest.
 */

import { describe, expect, it } from "vitest";

import type { Schedule } from "../periodization";
import type { BuildPlanInputs } from "./buildPlan";
import { buildFiveKPlan } from "./buildFiveKPlan";
import { buildHalfMarathonPlan } from "./buildHalfMarathonPlan";
import { buildMarathonPlan } from "./buildMarathonPlan";
import { buildTenKPlan } from "./buildTenKPlan";
import type { PlanTrace, TracedSession } from "./buildPlan";

const SCHEDULE_5: Schedule = {
  availableDays: [0, 1, 3, 4, 6],
  sessionsPerWeek: 5,
};

/** A long (~18-week) plan so base/build/peak all have several weeks. */
const inputs = (currentKm: number): BuildPlanInputs => ({
  planStartYmd: "2026-01-05", // Monday
  raceYmd: "2026-05-10", // Sunday, ~18 weeks out
  currentKm,
  schedule: SCHEDULE_5,
  locale: "fr",
  vdot: 50,
});

const BUILDERS: Array<{
  name: string;
  build: (i: BuildPlanInputs) => PlanTrace;
  currentKm: number;
}> = [
  { name: "5K", build: buildFiveKPlan, currentKm: 30 },
  { name: "10K", build: buildTenKPlan, currentKm: 35 },
  { name: "half", build: buildHalfMarathonPlan, currentKm: 45 },
  { name: "marathon", build: buildMarathonPlan, currentKm: 55 },
];

// --- helpers ----------------------------------------------------------------

const kept = (wk: { sessions: TracedSession[] }) =>
  wk.sessions.filter((s) => !s.dropped);

/** Long run per week (in week order), as displayed distance in metres. */
function longRunMeters(trace: PlanTrace): { phase: string; m: number }[] {
  return trace.weeks.flatMap((wk) => {
    const long = kept(wk).find((s) => s.spec.type === "long");
    return long?.labelDistanceMeters !== undefined
      ? [{ phase: wk.phase, m: long.labelDistanceMeters }]
      : [];
  });
}

/** A stable signature of a long run's WORK blocks (ignores the flexed lead-in). */
function longRunSignature(s: TracedSession): string {
  const k = s.spec.structureSpec;
  if (k?.kind === "long_with_blocks") {
    return `t:${k.reps}x${k.workDurationSec}/${k.recoveryDurationSec}`;
  }
  if (k?.kind === "intervals_paced_time") {
    return `p:${k.reps}x${k.workDurationSec}/${k.recoverySec}`;
  }
  return "?";
}

/** Easy runs in the base/build/peak weeks (the taper shakeout is elsewhere). */
function weekEasies(trace: PlanTrace): TracedSession[] {
  return trace.weeks.flatMap((wk) =>
    kept(wk).filter(
      (s) =>
        s.spec.type === "easy" &&
        s.spec.structureSpec?.kind === "easy_continuous",
    ),
  );
}

// --- R1: long run ≤ 10%/week + progressive -----------------------------------

describe("R1 — long run grows ≤10%/week and progresses", () => {
  for (const { name, build, currentKm } of BUILDERS) {
    it(`${name}: no week-over-week long-run jump above 10%`, () => {
      const longs = longRunMeters(build(inputs(currentKm)));
      expect(longs.length).toBeGreaterThan(4);
      for (let i = 1; i < longs.length; i++) {
        const ratio = longs[i]!.m / longs[i - 1]!.m;
        // 10% + a small margin for 0.1 km display rounding.
        expect(ratio).toBeLessThanOrEqual(1.11);
      }
    });

    it(`${name}: the long run peaks well above its starting length`, () => {
      // Compare within base/build/peak — the taper/affûtage long runs are
      // deliberately shortened, so they're excluded from the "progression".
      const longs = longRunMeters(build(inputs(currentKm))).filter(
        (l) => l.phase !== "taper",
      );
      const peak = Math.max(...longs.map((l) => l.m));
      expect(peak).toBeGreaterThan(longs[0]!.m);
    });

    it(`${name}: never regresses through base/build/peak`, () => {
      const longs = longRunMeters(build(inputs(currentKm))).filter(
        (l) => l.phase !== "taper",
      );
      for (let i = 1; i < longs.length; i++) {
        // Held or grown — extra volume lands here, cutbacks don't shrink it.
        expect(longs[i]!.m).toBeGreaterThanOrEqual(longs[i - 1]!.m * 0.97);
      }
    });
  }
});

// --- R3: base easy ramp 40min → 1h, volume-independent -----------------------

describe("R3 — base easy runs ramp ~40min → 1h by base-week index", () => {
  for (const { name, build, currentKm } of BUILDERS) {
    it(`${name}: base easy mean duration is non-decreasing and banded`, () => {
      const trace = build(inputs(currentKm));
      const baseWeeks = trace.weeks.filter((wk) => wk.phase === "base");
      const means = baseWeeks.map((wk) => {
        const durs = kept(wk)
          .filter((s) => s.spec.structureSpec?.kind === "easy_continuous")
          .map((s) =>
            s.spec.structureSpec?.kind === "easy_continuous"
              ? s.spec.structureSpec.durationSec
              : 0,
          );
        return durs.reduce((a, b) => a + b, 0) / durs.length;
      });
      expect(means.length).toBeGreaterThan(2);
      // Within a sane band (≥ ~35min, ≤ ~1h15 incl. the in-week spread + marathon).
      for (const m of means) {
        expect(m).toBeGreaterThanOrEqual(35 * 60);
        expect(m).toBeLessThanOrEqual(75 * 60);
      }
      // Ramps up across base (allowing the symmetric spread's small wobble).
      expect(means[means.length - 1]!).toBeGreaterThan(means[0]!);
    });
  }
});

// --- R4: easy-distance uniqueness + long-run variety -------------------------

describe("R4 — sessions don't repeat", () => {
  for (const { name, build, currentKm } of BUILDERS) {
    it(`${name}: easy distances are varied — best-effort, no heavy repeats`, () => {
      // The coach asks for variety "si possible" (best-effort + distance jitter).
      // With ~50 easies clustered in a narrow easy-pace band, forcing every one
      // to a unique 0.1 km value would drag some far off target, so we assert
      // strong variety rather than perfect uniqueness: most are distinct and no
      // single distance is reused more than twice.
      const easies = weekEasies(build(inputs(currentKm)));
      expect(easies.length).toBeGreaterThan(8);
      const buckets = easies.map((s) =>
        Math.round((s.labelDistanceMeters ?? 0) / 100),
      );
      const counts = new Map<number, number>();
      for (const b of buckets) counts.set(b, (counts.get(b) ?? 0) + 1);
      const maxRepeat = Math.max(...counts.values());
      expect(maxRepeat).toBeLessThanOrEqual(2);
      expect(counts.size).toBeGreaterThanOrEqual(
        Math.ceil(buckets.length * 0.85),
      );
    });

    it(`${name}: the long run draws several different sessions`, () => {
      const longs = build(inputs(currentKm)).weeks.flatMap((wk) =>
        kept(wk).filter((s) => s.spec.type === "long"),
      );
      const distinct = new Set(longs.map(longRunSignature));
      // Best-effort dedup pulls fresh entries beyond the level window, so a long
      // plan shows real variety rather than the same long run every week.
      expect(distinct.size).toBeGreaterThanOrEqual(5);
    });
  }
});

// --- R2: taper keeps its drop but varies the easies --------------------------

describe("R2 — taper easies differ in length", () => {
  for (const { name, build, currentKm } of BUILDERS) {
    it(`${name}: taper easy distances are distinct`, () => {
      const trace = build(inputs(currentKm));
      // Regular taper easies (exclude the fixed race-eve shakeout = shortest).
      const taperEasies = trace.taper.sessions
        .filter(
          (s) =>
            !s.dropped &&
            s.spec.type === "easy" &&
            s.spec.structureSpec?.kind === "easy_continuous",
        )
        .map((s) => ({
          s,
          dur:
            s.spec.structureSpec?.kind === "easy_continuous"
              ? s.spec.structureSpec.durationSec
              : 0,
        }));
      if (taperEasies.length < 2) return; // nothing to vary
      const shakeoutDur = Math.min(...taperEasies.map((e) => e.dur));
      const regular = taperEasies
        .filter((e) => e.dur !== shakeoutDur)
        .map((e) => Math.round((e.s.labelDistanceMeters ?? 0) / 100));
      expect(new Set(regular).size).toBe(regular.length);
    });
  }
});
