/**
 * Characterization tests for the marathon (42,195 km) microcycle composition —
 * the marathon-specific engine extensions it's the first consumer of:
 *  - the "endurance longue" = a long run (`type: "long"`) with marathon-pace
 *    (AS42) TIME blocks (`intervals_paced_time`) and the long-run warmup/cooldown
 *    bands;
 *  - the `marathon_build_early_alt` slot (SV2 weeks 0 & 2 ↔ VMA longue week 1);
 *  - the 3-week build split (buildEarly = weeks 0–2, buildLate = 3–5);
 *  - the 3-session floor for build/peak/taper (base keeps the athlete's count).
 */

import { describe, expect, it } from "vitest";

import {
  type Schedule,
  type SessionSpec,
  trainingPaces,
} from "../periodization";
import { MARATHON_SPEC } from "./marathon";
import { microcycle } from "./planEngine";

const SCHEDULE_2: Schedule = { availableDays: [2, 5], sessionsPerWeek: 2 };
const SCHEDULE_5: Schedule = {
  availableDays: [0, 1, 3, 5, 6],
  sessionsPerWeek: 5,
};
const VDOT_50 = 50;
const PACES_50 = trainingPaces(VDOT_50);

const baseArgs = {
  weekKm: 80,
  peakKm: 90,
  paces: PACES_50,
  vdot: VDOT_50,
};

// The marathon "endurance longue": a long run with AS42 time blocks inside.
const isEnduranceLongue = (s: SessionSpec) =>
  s.type === "long" && s.structureSpec?.kind === "intervals_paced_time";
const isSv1Long = (s: SessionSpec) =>
  s.type === "long" && s.structureSpec?.kind === "long_with_blocks";
const isSv2Time = (s: SessionSpec) =>
  s.type === "threshold" &&
  s.structureSpec?.kind === "long_with_blocks" &&
  s.structureSpec.workIntensity === "T";
const isVma = (s: SessionSpec) =>
  s.type === "intervals" &&
  s.structureSpec?.kind === "intervals_distance" &&
  s.structureSpec.repIntensity === "I";

describe("microcycle marathon — phase composition", () => {
  it("base: SV1 long + VMA courte, no AS42 blocks, no SV2", () => {
    const sessions = microcycle(MARATHON_SPEC, {
      ...baseArgs,
      phase: "base",
      weekIndexInPhase: 0,
      schedule: SCHEDULE_5,
    });
    expect(sessions.some(isSv1Long)).toBe(true);
    expect(sessions.some(isVma)).toBe(true);
    expect(sessions.some(isEnduranceLongue)).toBe(false);
    expect(sessions.some(isSv2Time)).toBe(false);
  });

  it("base long run uses the wide marathon bands (35min warmup, 25min cooldown)", () => {
    const sessions = microcycle(MARATHON_SPEC, {
      ...baseArgs,
      phase: "base",
      weekIndexInPhase: 0,
      weekKm: 90,
      peakKm: 90, // t = 1 → top of every band
      schedule: SCHEDULE_5,
    });
    const long = sessions.find(isSv1Long);
    expect(long?.structureSpec?.kind).toBe("long_with_blocks");
    if (long?.structureSpec?.kind === "long_with_blocks") {
      expect(long.structureSpec.warmupSec).toBe(35 * 60);
      expect(long.structureSpec.cooldownSec).toBe(25 * 60);
    }
  });

  it("début construction wk0 = SV2 + endurance longue (AS42 blocks @ marathon pace)", () => {
    const sessions = microcycle(MARATHON_SPEC, {
      ...baseArgs,
      phase: "build",
      weekIndexInPhase: 0,
      schedule: SCHEDULE_5,
    });
    expect(sessions.some(isSv2Time)).toBe(true);
    const longue = sessions.find(isEnduranceLongue);
    expect(longue).toBeDefined();
    if (longue?.structureSpec?.kind === "intervals_paced_time") {
      expect(longue.structureSpec.targetPaceMps).toBeGreaterThan(0);
    }
    expect(sessions.some(isVma)).toBe(false); // week 0 is SV2, not VMA
  });

  it("début construction wk1 swaps the alt slot to VMA longue (≥500m)", () => {
    const sessions = microcycle(MARATHON_SPEC, {
      ...baseArgs,
      phase: "build",
      weekIndexInPhase: 1,
      schedule: SCHEDULE_5,
    });
    const vma = sessions.find(isVma);
    expect(vma).toBeDefined();
    if (vma?.structureSpec?.kind === "intervals_distance") {
      expect(vma.structureSpec.repDistanceM).toBeGreaterThanOrEqual(500);
    }
    expect(sessions.some(isSv2Time)).toBe(false);
    expect(sessions.some(isEnduranceLongue)).toBe(true);
  });

  it("début construction wk2 is back to SV2 (3-week early split)", () => {
    const sessions = microcycle(MARATHON_SPEC, {
      ...baseArgs,
      phase: "build",
      weekIndexInPhase: 2,
      schedule: SCHEDULE_5,
    });
    expect(sessions.some(isSv2Time)).toBe(true);
    expect(sessions.some(isEnduranceLongue)).toBe(true);
  });

  it("fin construction (build wk3) = SV2 + endurance longue, no VMA", () => {
    const sessions = microcycle(MARATHON_SPEC, {
      ...baseArgs,
      phase: "build",
      weekIndexInPhase: 3,
      schedule: SCHEDULE_5,
    });
    expect(sessions.some(isSv2Time)).toBe(true);
    expect(sessions.some(isEnduranceLongue)).toBe(true);
    expect(sessions.some(isVma)).toBe(false);
  });

  it("peak (spécifique) = SV2 + the biggest endurance longue", () => {
    const sessions = microcycle(MARATHON_SPEC, {
      ...baseArgs,
      phase: "peak",
      weekIndexInPhase: 0,
      schedule: SCHEDULE_5,
      planProgress: 1,
    });
    expect(sessions.some(isSv2Time)).toBe(true);
    expect(sessions.some(isEnduranceLongue)).toBe(true);
    expect(sessions.some(isSv1Long)).toBe(false);
  });
});

describe("microcycle marathon — 3-session floor", () => {
  it("build raises a 2-day schedule to 3 sessions", () => {
    const sessions = microcycle(MARATHON_SPEC, {
      ...baseArgs,
      phase: "build",
      weekIndexInPhase: 0,
      schedule: { availableDays: [1, 3, 5], sessionsPerWeek: 2 },
    });
    expect(sessions.length).toBe(3);
  });

  it("cannot exceed available days (only 2 available → stays 2)", () => {
    const sessions = microcycle(MARATHON_SPEC, {
      ...baseArgs,
      phase: "build",
      weekIndexInPhase: 0,
      schedule: SCHEDULE_2,
    });
    expect(sessions.length).toBe(2);
  });

  it("base keeps the athlete's own count (no floor)", () => {
    const sessions = microcycle(MARATHON_SPEC, {
      ...baseArgs,
      phase: "base",
      weekIndexInPhase: 0,
      schedule: { availableDays: [1, 3, 5], sessionsPerWeek: 2 },
    });
    expect(sessions.length).toBe(2);
  });
});
