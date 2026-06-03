/**
 * Invariant / characterization tests for the half-marathon (semi / 21,1 km) plan
 * generator. Like the 10K tests, there's no prior code to diff against, so these
 * pin the half-specific coaching decisions AND the three engine extensions the
 * half is the first consumer of:
 *  - SV2 as distance reps @ T (`intervals_distance`, not `long_with_blocks`);
 *  - the "pics" allure spé as TIME reps @ race pace (`intervals_paced_time`);
 *  - the 2-week affûtage (a `leadWeeks` Mon→Sun "taper" microcycle before the tail);
 *  - the wider long-run warmup (30min) + cooldown (15min) bands and the
 *    `build_early_alt` VMA longue→courte progression.
 */

import { describe, expect, it } from "vitest";

import {
  computeVdot,
  isoDayOfWeek,
  type Schedule,
  type SessionSpec,
  trainingPaces,
} from "../periodization";
import { buildHalfMarathonPlan } from "./buildHalfMarathonPlan";
import { HALF_MARATHON_SPEC } from "./halfMarathon";
import { microcycle } from "./planEngine";

const SCHEDULE_4: Schedule = {
  availableDays: [1, 3, 5, 6],
  sessionsPerWeek: 4,
};
const SCHEDULE_5: Schedule = {
  availableDays: [0, 1, 3, 5, 6],
  sessionsPerWeek: 5,
};
const VDOT_55 = 55;
const PACES_55 = trainingPaces(VDOT_55);

const baseArgs = {
  weekKm: 70,
  peakKm: 75,
  paces: PACES_55,
  vdot: VDOT_55,
};

// Structure discriminators.
const isSv1Long = (s: SessionSpec) =>
  s.type === "long" && s.structureSpec?.kind === "long_with_blocks";
// Half SV2 is distance reps @ T (the new 2a path), not a time block — used by
// fin construction, spécifique, and the affûtage lead week.
const isSv2Dist = (s: SessionSpec) =>
  s.type === "threshold" &&
  s.structureSpec?.kind === "intervals_distance" &&
  s.structureSpec.repIntensity === "T";
// "Début construction" SV2 is instead a TIME block @ T (4×6min…), drawn from
// the dedicated `sv2BuildEarly` bank.
const isSv2Time = (s: SessionSpec) =>
  s.type === "threshold" &&
  s.structureSpec?.kind === "long_with_blocks" &&
  s.structureSpec.workIntensity === "T";
const isVma = (s: SessionSpec) =>
  s.type === "intervals" &&
  s.structureSpec?.kind === "intervals_distance" &&
  s.structureSpec.repIntensity === "I";
const isRacePaceDist = (s: SessionSpec) =>
  s.structureSpec?.kind === "intervals_paced";
const isRacePaceTime = (s: SessionSpec) =>
  s.structureSpec?.kind === "intervals_paced_time";

describe("microcycle half — phase composition", () => {
  it("base: VMA courte + SV1 long, no SV2, no race-pace", () => {
    const sessions = microcycle(HALF_MARATHON_SPEC, {
      ...baseArgs,
      phase: "base",
      weekIndexInPhase: 0,
      schedule: SCHEDULE_5,
    });
    expect(sessions.some(isSv1Long)).toBe(true);
    const vma = sessions.find(isVma);
    expect(vma).toBeDefined();
    if (vma?.structureSpec?.kind === "intervals_distance") {
      expect(vma.structureSpec.repDistanceM).toBeLessThanOrEqual(400);
    }
    expect(sessions.some(isSv2Dist)).toBe(false);
    expect(sessions.some(isRacePaceDist)).toBe(false);
  });

  it("début construction wk0 uses time-block SV2 @ T (not distance) + VMA longue", () => {
    const sessions = microcycle(HALF_MARATHON_SPEC, {
      ...baseArgs,
      phase: "build",
      weekIndexInPhase: 0,
      schedule: SCHEDULE_5,
    });
    // Early-build SV2 draws the `sv2BuildEarly` TIME-block bank (4×6min…),
    // never the short distance reps the other phases use.
    expect(sessions.some(isSv2Time)).toBe(true);
    expect(sessions.some(isSv2Dist)).toBe(false);
    const vma = sessions.find(isVma);
    expect(vma).toBeDefined();
    if (vma?.structureSpec?.kind === "intervals_distance") {
      expect(vma.structureSpec.repDistanceM).toBeGreaterThanOrEqual(600); // longue
    }
  });

  it("début construction wk1 alternates the VMA slot to courte (≤400m)", () => {
    const sessions = microcycle(HALF_MARATHON_SPEC, {
      ...baseArgs,
      phase: "build",
      weekIndexInPhase: 1,
      schedule: SCHEDULE_5,
    });
    const vma = sessions.find(isVma);
    expect(vma).toBeDefined();
    if (vma?.structureSpec?.kind === "intervals_distance") {
      expect(vma.structureSpec.repDistanceM).toBeLessThanOrEqual(400); // courte
    }
  });

  it("fin construction (build 2+) uses allure spé (distance) + SV2", () => {
    const sessions = microcycle(HALF_MARATHON_SPEC, {
      ...baseArgs,
      phase: "build",
      weekIndexInPhase: 2,
      schedule: SCHEDULE_5,
    });
    expect(sessions.some(isRacePaceDist)).toBe(true);
    // SV2 stays distance-based past début construction (scoping boundary).
    expect(sessions.some(isSv2Dist)).toBe(true);
    expect(sessions.some(isSv2Time)).toBe(false);
  });

  it("pics (peak) uses TIME-based allure spé (3×15min / 4–5×10min)", () => {
    const sessions = microcycle(HALF_MARATHON_SPEC, {
      ...baseArgs,
      phase: "peak",
      weekIndexInPhase: 0,
      schedule: SCHEDULE_4,
      vdot: 60,
      planProgress: 1, // hardest entry → 3×15min
    });
    const rp = sessions.find(isRacePaceTime);
    expect(rp?.structureSpec?.kind).toBe("intervals_paced_time");
    if (rp?.structureSpec?.kind === "intervals_paced_time") {
      expect(rp.structureSpec.workDurationSec).toBe(15 * 60);
      expect(rp.structureSpec.targetPaceMps).toBeGreaterThan(0);
    }
    expect(sessions.some(isSv1Long)).toBe(false);
  });
});

describe("microcycle half — long-run warmup + cooldown bands", () => {
  it("the SV1 long gets a 30min warmup and a 15min cooldown at peak volume", () => {
    const sessions = microcycle(HALF_MARATHON_SPEC, {
      ...baseArgs,
      phase: "base",
      weekIndexInPhase: 0,
      weekKm: 75,
      peakKm: 75, // t = 1 → top of every band
      schedule: SCHEDULE_5,
    });
    const long = sessions.find(isSv1Long);
    expect(long?.structureSpec?.kind).toBe("long_with_blocks");
    if (long?.structureSpec?.kind === "long_with_blocks") {
      expect(long.structureSpec.warmupSec).toBe(30 * 60); // long-run warmup max
      expect(long.structureSpec.cooldownSec).toBe(15 * 60); // long-run cooldown max
    }
    // A non-long session keeps the standard ≤20min warmup / ≤10min cooldown.
    const vma = sessions.find(isVma);
    if (vma?.structureSpec?.kind === "intervals_distance") {
      expect(vma.structureSpec.warmupSec).toBeLessThanOrEqual(20 * 60);
      expect(vma.structureSpec.cooldownSec).toBeLessThanOrEqual(10 * 60);
    }
  });
});

describe("buildHalfMarathonPlan — 2-week affûtage", () => {
  const inputs = {
    planStartYmd: "2026-06-01", // Monday
    raceYmd: "2026-09-20", // Sunday, ~16 weeks out
    currentKm: 45,
    schedule: SCHEDULE_5,
    locale: "fr" as const,
    targetTimeSeconds: 100 * 60, // ~1h40 half
  };

  it("emits a leadWeek (affûtage week 1) as a 'taper'-phase microcycle with SV2", () => {
    const trace = buildHalfMarathonPlan(inputs);
    const taperWeeks = trace.weeks.filter((wk) => wk.phase === "taper");
    expect(taperWeeks.length).toBe(1); // exactly one lead week
    const leadSessions = taperWeeks[0]!.sessions.filter((s) => !s.dropped);
    expect(leadSessions.some((s) => isSv2Dist(s.spec))).toBe(true);
  });

  it("the race-week tail (affûtage week 2) carries the rappel d'allure", () => {
    const trace = buildHalfMarathonPlan(inputs);
    const tail = trace.taper.sessions.filter((s) => !s.dropped);
    expect(tail.some((s) => s.spec.type === "race_pace")).toBe(true);
  });

  it("the taper block spans both affûtage weeks and ends on race day", () => {
    const trace = buildHalfMarathonPlan(inputs);
    const last = trace.blocks[trace.blocks.length - 1]!;
    expect(last.type).toBe("taper");
    expect(last.endYmd).toBe(inputs.raceYmd);
    // Taper block opens ~2 weeks before the race (lead week + race-week tail).
    const span = Math.round(
      (Date.parse(`${last.endYmd}T00:00:00Z`) -
        Date.parse(`${last.startYmd}T00:00:00Z`)) /
        86_400_000,
    );
    expect(span).toBeGreaterThanOrEqual(11); // ≥ ~1.5 weeks
  });
});

describe("buildHalfMarathonPlan — trace integrity", () => {
  const inputs = {
    planStartYmd: "2026-06-01",
    raceYmd: "2026-09-20",
    currentKm: 45,
    schedule: SCHEDULE_5,
    locale: "fr" as const,
    targetTimeSeconds: 100 * 60,
  };

  it("every dropped session carries a reason, every kept one a structure", () => {
    const trace = buildHalfMarathonPlan(inputs);
    const all = [
      ...trace.weeks.flatMap((wk) => wk.sessions),
      ...trace.taper.sessions,
    ];
    for (const s of all) {
      if (s.dropped) {
        expect(s.dropReason).toBeDefined();
        expect(s.structure).toBeUndefined();
      } else {
        expect(s.dropReason).toBeUndefined();
        expect(s.structure).toBeDefined();
        expect(s.workoutName).toBeTruthy();
      }
    }
  });

  it("never schedules two hard sessions on adjacent calendar days, across seams", () => {
    const trace = buildHalfMarathonPlan(inputs);
    const hardDates = [
      ...trace.weeks.flatMap((wk) => wk.sessions),
      ...trace.taper.sessions,
    ]
      .filter((s) => !s.dropped && s.spec.type !== "easy")
      .map((s) => s.dateYmd)
      .sort();
    for (let i = 1; i < hardDates.length; i++) {
      const gapDays = Math.round(
        (Date.parse(`${hardDates[i]}T00:00:00Z`) -
          Date.parse(`${hardDates[i - 1]}T00:00:00Z`)) /
          86_400_000,
      );
      expect(gapDays).toBeGreaterThanOrEqual(2);
    }
  });

  it("resolves a VDOT from the half-marathon target time and peaks at 75km", () => {
    const trace = buildHalfMarathonPlan(inputs);
    expect(trace.resolved.vdot).toBeCloseTo(
      computeVdot(21097, inputs.targetTimeSeconds),
      5,
    );
    expect(trace.resolved.peakKm).toBe(75); // distancePeakKm("half_marathon")
  });

  it("anchors week rows on Monday and ends on race day", () => {
    const trace = buildHalfMarathonPlan(inputs);
    expect(isoDayOfWeek(trace.grid.gridStartYmd)).toBe(0); // Monday
    expect(trace.race?.dateYmd).toBe(inputs.raceYmd);
  });
});
