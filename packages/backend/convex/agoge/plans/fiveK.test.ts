/**
 * Pure-function tests for the 5K microcycle planner.
 *
 * No Convex deps — runs with any vitest/jest setup. To run: `pnpm vitest`
 * from the backend package once a vitest config is added.
 */

import { describe, expect, it } from "vitest";

import {
  computeVdot,
  fiveKPaceMps,
  splitPhases,
  trainingPaces,
} from "../periodization";
import { microcycle5K } from "./fiveK";

const SCHEDULE_4 = { availableDays: [1, 3, 5, 6], sessionsPerWeek: 4 };
const SCHEDULE_5 = { availableDays: [0, 1, 3, 5, 6], sessionsPerWeek: 5 };
const VDOT_50 = computeVdot(5000, 21 * 60); // ~50 VDOT (21:00 5K)
const PACES_50 = trainingPaces(VDOT_50);

describe("splitPhases(5k)", () => {
  it("12-week 5K → peak=1, taper=1, build=4, base=6", () => {
    expect(splitPhases(12, "5k")).toEqual({
      base: 6,
      build: 4,
      peak: 1,
      taper: 1,
    });
  });

  it("8-week 5K → peak=1, taper=1, build=4, base=2", () => {
    expect(splitPhases(8, "5k")).toEqual({
      base: 2,
      build: 4,
      peak: 1,
      taper: 1,
    });
  });

  it("compressed 5-week 5K → no base, build absorbs remainder", () => {
    const split = splitPhases(5, "5k");
    expect(split.taper).toBe(1);
    expect(split.peak).toBe(1);
    expect(split.base).toBe(0);
    expect(split.build).toBe(3);
  });
});

describe("fiveKPaceMps", () => {
  it("VDOT 50 ≈ 4.0 m/s (5K around 21 min)", () => {
    const v = fiveKPaceMps(VDOT_50);
    expect(v).toBeGreaterThan(3.9);
    expect(v).toBeLessThan(4.05);
  });

  it("returns 0 for invalid vdot", () => {
    expect(fiveKPaceMps(0)).toBe(0);
    expect(fiveKPaceMps(-1)).toBe(0);
  });
});

describe("microcycle5K — base phase", () => {
  it("base week 0 (no VMA): EFs + SV1 long, last role is sv1_long", () => {
    const sessions = microcycle5K({
      phase: "base",
      weekIndexInPhase: 0,
      weekKm: 40,
      schedule: SCHEDULE_4,
      peakKm: 60,
      paces: PACES_50,
      vdot: VDOT_50,
    });
    expect(sessions).toHaveLength(4);
    const lastSpec = sessions[sessions.length - 1]!.structureSpec;
    expect(lastSpec?.kind).toBe("long_with_blocks");
    if (lastSpec?.kind === "long_with_blocks") {
      expect(lastSpec.workIntensity).toBe("M"); // SV1 = M
      expect(lastSpec.reps).toBe(3);
    }
    // No VMA in even-index base week
    const hasVma = sessions.some(
      (s) =>
        s.structureSpec?.kind === "intervals_distance" &&
        s.structureSpec.repIntensity === "I",
    );
    expect(hasVma).toBe(false);
  });

  it("base week 1 (with VMA): one intervals at I", () => {
    const sessions = microcycle5K({
      phase: "base",
      weekIndexInPhase: 1,
      weekKm: 45,
      schedule: SCHEDULE_4,
      peakKm: 60,
      paces: PACES_50,
      vdot: VDOT_50,
    });
    const vma = sessions.find(
      (s) =>
        s.structureSpec?.kind === "intervals_distance" &&
        s.structureSpec.repIntensity === "I",
    );
    expect(vma).toBeDefined();
  });
});

describe("microcycle5K — build early (weeks 0-1)", () => {
  it("contains SV2 (T) + VMA courte (I) + SV1 long (M)", () => {
    const sessions = microcycle5K({
      phase: "build",
      weekIndexInPhase: 0,
      weekKm: 50,
      schedule: SCHEDULE_4,
      peakKm: 60,
      paces: PACES_50,
      vdot: VDOT_50,
    });
    const sv2 = sessions.find(
      (s) =>
        s.structureSpec?.kind === "intervals_distance" &&
        s.structureSpec.repIntensity === "T",
    );
    const vma = sessions.find(
      (s) =>
        s.structureSpec?.kind === "intervals_distance" &&
        s.structureSpec.repIntensity === "I",
    );
    const sv1 = sessions.find(
      (s) => s.structureSpec?.kind === "long_with_blocks",
    );
    expect(sv2).toBeDefined();
    expect(vma).toBeDefined();
    expect(sv1).toBeDefined();
  });
});

describe("microcycle5K — build late", () => {
  it("W1 (weekIndexInPhase=2): VMA longue (5-6×800) + SV2 + long continuous", () => {
    const sessions = microcycle5K({
      phase: "build",
      weekIndexInPhase: 2,
      weekKm: 55,
      schedule: SCHEDULE_4,
      peakKm: 60,
      paces: PACES_50,
      vdot: VDOT_50,
    });
    const vmaLong = sessions.find(
      (s) =>
        s.structureSpec?.kind === "intervals_distance" &&
        s.structureSpec.repIntensity === "I" &&
        s.structureSpec.repDistanceM === 800,
    );
    const sv2 = sessions.find(
      (s) =>
        s.structureSpec?.kind === "intervals_distance" &&
        s.structureSpec.repIntensity === "T",
    );
    const longCont = sessions.find(
      (s) => s.structureSpec?.kind === "long_continuous",
    );
    expect(vmaLong).toBeDefined();
    expect(sv2).toBeDefined();
    expect(longCont).toBeDefined();
  });

  it("W2 (weekIndexInPhase=3): Mixte + SV1 long", () => {
    const sessions = microcycle5K({
      phase: "build",
      weekIndexInPhase: 3,
      weekKm: 55,
      schedule: SCHEDULE_4,
      peakKm: 60,
      paces: PACES_50,
      vdot: VDOT_50,
    });
    const mixed = sessions.find((s) => s.structureSpec?.kind === "mixed");
    const sv1 = sessions.find(
      (s) => s.structureSpec?.kind === "long_with_blocks",
    );
    expect(mixed).toBeDefined();
    expect(sv1).toBeDefined();
  });
});

describe("microcycle5K — peak phase", () => {
  it("includes exactly one race-pace 5K session at 7×800", () => {
    const sessions = microcycle5K({
      phase: "peak",
      weekIndexInPhase: 0,
      weekKm: 50,
      schedule: SCHEDULE_4,
      peakKm: 60,
      paces: PACES_50,
      vdot: VDOT_50,
    });
    const racePaceSessions = sessions.filter(
      (s) => s.structureSpec?.kind === "intervals_paced",
    );
    expect(racePaceSessions).toHaveLength(1);
    const rp = racePaceSessions[0]!.structureSpec;
    if (rp?.kind === "intervals_paced") {
      expect(rp.reps).toBe(7);
      expect(rp.repDistanceM).toBe(800);
      expect(rp.targetPaceMps).toBeGreaterThan(3.9);
    }
  });

  it("rest of peak week is EFs with strides on prior day", () => {
    const sessions = microcycle5K({
      phase: "peak",
      weekIndexInPhase: 0,
      weekKm: 50,
      schedule: SCHEDULE_4,
      peakKm: 60,
      paces: PACES_50,
      vdot: VDOT_50,
    });
    const easies = sessions.filter(
      (s) => s.structureSpec?.kind === "easy_continuous",
    );
    expect(easies.length).toBeGreaterThan(0);
    const hasStrides = easies.some(
      (s) =>
        s.structureSpec?.kind === "easy_continuous" &&
        s.structureSpec.addStrides === true,
    );
    expect(hasStrides).toBe(true);
  });
});

describe("microcycle5K — taper", () => {
  it("includes one short tune-up at 5K pace + EFs", () => {
    const sessions = microcycle5K({
      phase: "taper",
      weekIndexInPhase: 0,
      weekKm: 25,
      schedule: SCHEDULE_4,
      peakKm: 60,
      paces: PACES_50,
      vdot: VDOT_50,
    });
    const tune = sessions.find(
      (s) =>
        s.structureSpec?.kind === "intervals_paced" &&
        s.structureSpec.repDistanceM === 400,
    );
    expect(tune).toBeDefined();
  });
});

describe("microcycle5K — strides positioning", () => {
  it("EF before a quality session is flagged addStrides=true", () => {
    const sessions = microcycle5K({
      phase: "build",
      weekIndexInPhase: 0,
      weekKm: 50,
      schedule: SCHEDULE_5,
      peakKm: 60,
      paces: PACES_50,
      vdot: VDOT_50,
    });
    // Build early with 5 sessions → [EF, SV2, VMA short, SV1 long, ...]
    // wait, rolesBuildEarly returns [EF, SV2, VMA, long] for slots>=4. Slot=5 → easies = 5-3=2, so [EF, EF, SV2, VMA, long]
    // applyStrides should flag the EF immediately before SV2
    const easyBeforeQuality = sessions.find(
      (s, i) =>
        s.structureSpec?.kind === "easy_continuous" &&
        s.structureSpec.addStrides === true &&
        i + 1 < sessions.length &&
        sessions[i + 1]!.structureSpec?.kind !== "easy_continuous",
    );
    expect(easyBeforeQuality).toBeDefined();
  });
});

describe("microcycle5K — EF duration constraint", () => {
  it("easy_continuous durationSec clamps within [30min, 50min]", () => {
    // Test with high volume → should hit max (50min)
    const sessionsHigh = microcycle5K({
      phase: "base",
      weekIndexInPhase: 0,
      weekKm: 60,
      schedule: SCHEDULE_4,
      peakKm: 60,
      paces: PACES_50,
      vdot: VDOT_50,
    });
    const easyHigh = sessionsHigh.find(
      (s) => s.structureSpec?.kind === "easy_continuous",
    );
    if (easyHigh?.structureSpec?.kind === "easy_continuous") {
      expect(easyHigh.structureSpec.durationSec).toBeLessThanOrEqual(50 * 60);
      expect(easyHigh.structureSpec.durationSec).toBeGreaterThanOrEqual(30 * 60);
    }

    // Test with low volume → should hit min (30min)
    const sessionsLow = microcycle5K({
      phase: "base",
      weekIndexInPhase: 0,
      weekKm: 10,
      schedule: SCHEDULE_4,
      peakKm: 60,
      paces: PACES_50,
      vdot: VDOT_50,
    });
    const easyLow = sessionsLow.find(
      (s) => s.structureSpec?.kind === "easy_continuous",
    );
    if (easyLow?.structureSpec?.kind === "easy_continuous") {
      expect(easyLow.structureSpec.durationSec).toBeGreaterThanOrEqual(30 * 60);
      expect(easyLow.structureSpec.durationSec).toBeLessThan(35 * 60);
    }
  });
});

describe("microcycle5K — warmup/cooldown scaling", () => {
  it("warmup is 15-20min, cooldown is 5-10min", () => {
    const sessions = microcycle5K({
      phase: "build",
      weekIndexInPhase: 0,
      weekKm: 50,
      schedule: SCHEDULE_4,
      peakKm: 60,
      paces: PACES_50,
      vdot: VDOT_50,
    });
    const sv2 = sessions.find(
      (s) =>
        s.structureSpec?.kind === "intervals_distance" &&
        s.structureSpec.repIntensity === "T",
    );
    if (sv2?.structureSpec?.kind === "intervals_distance") {
      expect(sv2.structureSpec.warmupSec).toBeGreaterThanOrEqual(15 * 60);
      expect(sv2.structureSpec.warmupSec).toBeLessThanOrEqual(20 * 60);
      expect(sv2.structureSpec.cooldownSec).toBeGreaterThanOrEqual(5 * 60);
      expect(sv2.structureSpec.cooldownSec).toBeLessThanOrEqual(10 * 60);
    }
  });
});
