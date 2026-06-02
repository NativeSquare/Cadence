/**
 * Invariant / characterization tests for the 10K plan generator.
 *
 * Unlike `buildFiveKPlan.test.ts` (an equivalence oracle against the former 5K
 * orchestration), there's no prior 10K code to diff against — so these tests pin
 * the 10K-specific coaching decisions: the per-phase session composition, the
 * race-pace bank routing (fin construction → moderate, pics → big), the wider
 * long-run warmup band, and the shared structural guarantees (trace integrity,
 * Mon→Sun blocks, no back-to-back hard days across week seams).
 */

import { describe, expect, it } from "vitest";

import {
  computeVdot,
  isoDayOfWeek,
  type Schedule,
  type SessionSpec,
  trainingPaces,
} from "../periodization";
import { buildTenKPlan } from "./buildTenKPlan";
import { microcycle } from "./planEngine";
import { TEN_K_SPEC } from "./tenK";

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
  weekKm: 55,
  peakKm: 60,
  paces: PACES_55,
  vdot: VDOT_55,
};

// Structure discriminators.
const isSv1Long = (s: SessionSpec) =>
  s.type === "long" && s.structureSpec?.kind === "long_with_blocks";
const isSv2 = (s: SessionSpec) =>
  s.type === "threshold" &&
  s.structureSpec?.kind === "long_with_blocks" &&
  s.structureSpec.workIntensity === "T";
const isVma = (s: SessionSpec) =>
  s.structureSpec?.kind === "intervals_distance";
const isRacePace = (s: SessionSpec) =>
  s.structureSpec?.kind === "intervals_paced";

describe("microcycle 10K — phase composition", () => {
  it("base mirrors the 5K base: VMA courte + SV1 long, no SV2, no race-pace", () => {
    const sessions = microcycle(TEN_K_SPEC, {
      ...baseArgs,
      phase: "base",
      weekIndexInPhase: 0,
      schedule: SCHEDULE_5,
    });
    expect(sessions.some(isSv1Long)).toBe(true);
    const vma = sessions.find(isVma);
    expect(vma).toBeDefined();
    if (vma?.structureSpec?.kind === "intervals_distance") {
      expect(vma.structureSpec.repDistanceM).toBeLessThanOrEqual(400); // VMA courte
    }
    expect(sessions.some(isSv2)).toBe(false);
    expect(sessions.some(isRacePace)).toBe(false);
  });

  it("début construction (build 0–1) uses SV2 + VMA longue", () => {
    const sessions = microcycle(TEN_K_SPEC, {
      ...baseArgs,
      phase: "build",
      weekIndexInPhase: 0,
      schedule: SCHEDULE_5,
    });
    expect(sessions.some(isSv2)).toBe(true);
    const vma = sessions.find(isVma);
    expect(vma).toBeDefined();
    if (vma?.structureSpec?.kind === "intervals_distance") {
      expect(vma.structureSpec.repDistanceM).toBeGreaterThanOrEqual(600); // VMA longue
    }
    expect(sessions.some(isRacePace)).toBe(false);
  });

  it("fin construction (build 2+) uses race-pace + VMA courte", () => {
    const sessions = microcycle(TEN_K_SPEC, {
      ...baseArgs,
      phase: "build",
      weekIndexInPhase: 2,
      schedule: SCHEDULE_5,
    });
    expect(sessions.some(isRacePace)).toBe(true);
    const vma = sessions.find(isVma);
    if (vma?.structureSpec?.kind === "intervals_distance") {
      expect(vma.structureSpec.repDistanceM).toBeLessThanOrEqual(400); // VMA courte
    }
  });

  it("pics (peak) is race-pace + easy, no SV2 / SV1 long", () => {
    const sessions = microcycle(TEN_K_SPEC, {
      ...baseArgs,
      phase: "peak",
      weekIndexInPhase: 0,
      schedule: SCHEDULE_4,
      planProgress: 1,
    });
    expect(sessions.some(isRacePace)).toBe(true);
    expect(sessions.some(isSv1Long)).toBe(false);
    expect(sessions.some(isSv2)).toBe(false);
  });
});

describe("microcycle 10K — race-pace bank routing", () => {
  it("pics draws from the big bank (can reach the 2000m rep)", () => {
    const sessions = microcycle(TEN_K_SPEC, {
      ...baseArgs,
      phase: "peak",
      weekIndexInPhase: 0,
      schedule: SCHEDULE_4,
      vdot: 60, // level 1 → window top
      planProgress: 1, // → hardest entry: 3×2000m
    });
    const rp = sessions.find(isRacePace);
    expect(rp?.structureSpec?.kind).toBe("intervals_paced");
    if (rp?.structureSpec?.kind === "intervals_paced") {
      expect(rp.structureSpec.repDistanceM).toBe(2000);
    }
  });

  it("fin construction draws from the moderate bank (reps ≤ 1.5km, never 2000m)", () => {
    const sessions = microcycle(TEN_K_SPEC, {
      ...baseArgs,
      phase: "build",
      weekIndexInPhase: 2,
      schedule: SCHEDULE_5,
      vdot: 60,
      planProgress: 1,
    });
    const rp = sessions.find(isRacePace);
    expect(rp?.structureSpec?.kind).toBe("intervals_paced");
    if (rp?.structureSpec?.kind === "intervals_paced") {
      expect(rp.structureSpec.repDistanceM).toBeLessThanOrEqual(1500);
    }
  });
});

describe("microcycle 10K — long-run warmup band", () => {
  it("the SV1 long warmup can exceed 20min (up to 30) while others stay ≤20", () => {
    const sessions = microcycle(TEN_K_SPEC, {
      ...baseArgs,
      phase: "base",
      weekIndexInPhase: 0,
      weekKm: 60,
      peakKm: 60, // t = 1 → top of every warmup band
      schedule: SCHEDULE_5,
    });
    const long = sessions.find(isSv1Long);
    expect(long?.structureSpec?.kind).toBe("long_with_blocks");
    if (long?.structureSpec?.kind === "long_with_blocks") {
      expect(long.structureSpec.warmupSec).toBe(30 * 60); // long-run band max
    }
    // Every non-long session keeps the standard 15–20min warmup band.
    for (const s of sessions) {
      if (isSv1Long(s)) continue;
      const ss = s.structureSpec;
      if (
        ss &&
        (ss.kind === "long_with_blocks" ||
          ss.kind === "intervals_distance" ||
          ss.kind === "intervals_paced" ||
          ss.kind === "mixed")
      ) {
        expect(ss.warmupSec).toBeLessThanOrEqual(20 * 60);
      }
    }
  });
});

describe("buildTenKPlan — trace integrity", () => {
  const inputs = {
    planStartYmd: "2026-06-01",
    raceYmd: "2026-08-30", // Sunday
    currentKm: 35,
    schedule: SCHEDULE_5,
    locale: "fr" as const,
    targetTimeSeconds: 42 * 60, // ~42:00 10K
  };

  it("every dropped session carries a reason, every kept one a structure", () => {
    const trace = buildTenKPlan(inputs);
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

  it("lays out base → build → peak → taper blocks ending on race day", () => {
    const trace = buildTenKPlan(inputs);
    const types = trace.blocks.map((b) => b.type);
    expect(types).toContain("build");
    expect(types).toContain("peak");
    expect(types[types.length - 1]).toBe("taper");
    expect(trace.blocks[trace.blocks.length - 1]!.endYmd).toBe(inputs.raceYmd);
    // build splits 2 début + 2 fin → exactly 4 build weeks for a 12-week plan.
    expect(trace.preTaperSplit.build).toBe(4);
    expect(trace.preTaperSplit.peak).toBe(1);
  });

  it("never schedules two hard sessions on adjacent calendar days, across week seams", () => {
    const trace = buildTenKPlan(inputs);
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

  it("resolves a VDOT from the 10K target time", () => {
    const trace = buildTenKPlan(inputs);
    expect(trace.resolved.vdot).toBeCloseTo(
      computeVdot(10000, inputs.targetTimeSeconds),
      5,
    );
    expect(trace.resolved.peakKm).toBe(60); // distancePeakKm("10k")
  });
});

// Sanity: the grid anchors on the plan-start week's Monday.
describe("buildTenKPlan — grid", () => {
  it("anchors week rows on Monday and ends the taper on race day", () => {
    const trace = buildTenKPlan({
      planStartYmd: "2026-06-01",
      raceYmd: "2026-08-30",
      currentKm: 30,
      schedule: SCHEDULE_4,
      locale: "en",
      vdot: 50,
    });
    expect(isoDayOfWeek(trace.grid.gridStartYmd)).toBe(0); // Monday
    expect(trace.race?.dateYmd).toBe("2026-08-30");
  });
});
