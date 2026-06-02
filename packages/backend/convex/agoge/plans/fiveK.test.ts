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
  isoDayOfWeek,
  type SessionSpec,
  splitPhases,
  trainingPaces,
} from "../periodization";
import {
  fiveKGrid,
  microcycle5K,
  selectBankIndex,
  taperDaysForRaceDow,
  taperSessions5K,
} from "./fiveK";

const SCHEDULE_2 = { availableDays: [2, 5], sessionsPerWeek: 2 };
const SCHEDULE_4 = { availableDays: [1, 3, 5, 6], sessionsPerWeek: 4 };
const SCHEDULE_5 = { availableDays: [0, 1, 3, 5, 6], sessionsPerWeek: 5 };
const SCHEDULE_6 = { availableDays: [0, 1, 2, 3, 4, 5], sessionsPerWeek: 6 };
const VDOT_50 = computeVdot(5000, 21 * 60); // ~50 VDOT (21:00 5K)
const PACES_50 = trainingPaces(VDOT_50);

const baseArgs = {
  weekKm: 45,
  peakKm: 60,
  paces: PACES_50,
  vdot: VDOT_50,
};

// Discriminators. SV2 and SV1 long are both time-based `long_with_blocks` now —
// they differ by the work intensity (T vs SV1). VMA stays distance-based @ I.
type SpecPeek = {
  structureSpec?: { kind: string; repIntensity?: string; workIntensity?: string };
};
const isVma = (s: SpecPeek) =>
  s.structureSpec?.kind === "intervals_distance" &&
  s.structureSpec.repIntensity === "I";
const isSv2 = (s: SpecPeek) =>
  s.structureSpec?.kind === "long_with_blocks" &&
  s.structureSpec.workIntensity === "T";
const isSv1Long = (s: SpecPeek) =>
  s.structureSpec?.kind === "long_with_blocks" &&
  s.structureSpec.workIntensity === "SV1";

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
  it("has VMA every week + SV1 long (4 sessions)", () => {
    for (const week of [0, 1, 2, 3]) {
      const sessions = microcycle5K({
        ...baseArgs,
        phase: "base",
        weekIndexInPhase: week,
        schedule: SCHEDULE_4,
      });
      expect(sessions).toHaveLength(4);
      expect(sessions.some(isVma)).toBe(true);
      expect(sessions.some(isSv1Long)).toBe(true);
    }
  });

  it("2 sessions/week → easy(+strides) + VMA, no long", () => {
    const sessions = microcycle5K({
      ...baseArgs,
      phase: "base",
      weekIndexInPhase: 0,
      schedule: SCHEDULE_2,
    });
    expect(sessions).toHaveLength(2);
    expect(sessions.some(isVma)).toBe(true);
    expect(sessions.some(isSv1Long)).toBe(false);
    const stridesEasy = sessions.some(
      (s) =>
        s.structureSpec?.kind === "easy_continuous" &&
        s.structureSpec.addStrides === true,
    );
    expect(stridesEasy).toBe(true);
  });

  it("6 sessions/week → exactly two strides easies", () => {
    const sessions = microcycle5K({
      ...baseArgs,
      phase: "base",
      weekIndexInPhase: 0,
      schedule: SCHEDULE_6,
    });
    expect(sessions).toHaveLength(6);
    const stridesCount = sessions.filter(
      (s) =>
        s.structureSpec?.kind === "easy_continuous" &&
        s.structureSpec.addStrides === true,
    ).length;
    expect(stridesCount).toBe(2);
    expect(sessions.some(isVma)).toBe(true);
    expect(sessions.some(isSv1Long)).toBe(true);
  });
});

describe("microcycle5K — build early (weeks 0-1)", () => {
  it("5 sessions: SV2 (T) + VMA courte (I) + SV1 long (SV1)", () => {
    const sessions = microcycle5K({
      ...baseArgs,
      phase: "build",
      weekIndexInPhase: 0,
      weekKm: 50,
      schedule: SCHEDULE_5,
    });
    expect(sessions.some(isSv2)).toBe(true);
    expect(sessions.some(isVma)).toBe(true);
    expect(sessions.some(isSv1Long)).toBe(true);
  });

  it("4 sessions: VMA + SV2, no SV1 long", () => {
    const sessions = microcycle5K({
      ...baseArgs,
      phase: "build",
      weekIndexInPhase: 0,
      weekKm: 50,
      schedule: SCHEDULE_4,
    });
    expect(sessions.some(isVma)).toBe(true);
    expect(sessions.some(isSv2)).toBe(true);
    expect(sessions.some(isSv1Long)).toBe(false);
  });
});

describe("microcycle5K — build late (alternation)", () => {
  it("W1 (weekIndexInPhase=2): VMA longue (800m) + SV2 + SV1 long", () => {
    const sessions = microcycle5K({
      ...baseArgs,
      phase: "build",
      weekIndexInPhase: 2,
      weekKm: 55,
      schedule: SCHEDULE_5,
    });
    // The alt slot resolves to VMA longue — a distance @ I session drawn from the
    // VMA-longue bank (600–800m reps; exact entry depends on level/progress).
    const vmaLong = sessions.find(
      (s) =>
        s.structureSpec?.kind === "intervals_distance" &&
        s.structureSpec.repIntensity === "I" &&
        s.structureSpec.repDistanceM >= 500,
    );
    expect(vmaLong).toBeDefined();
    expect(sessions.some(isSv2)).toBe(true);
    expect(sessions.some(isSv1Long)).toBe(true);
    expect(sessions.some((s) => s.structureSpec?.kind === "mixed")).toBe(false);
  });

  it("W2 (weekIndexInPhase=3): Mixte + SV2 + SV1 long", () => {
    const sessions = microcycle5K({
      ...baseArgs,
      phase: "build",
      weekIndexInPhase: 3,
      weekKm: 55,
      schedule: SCHEDULE_5,
    });
    expect(sessions.some((s) => s.structureSpec?.kind === "mixed")).toBe(true);
    expect(sessions.some(isSv2)).toBe(true);
    expect(sessions.some(isSv1Long)).toBe(true);
  });
});

describe("microcycle5K — peak phase", () => {
  it("includes exactly one race-pace 5K session, drawn from the allure-spé bank", () => {
    const sessions = microcycle5K({
      ...baseArgs,
      phase: "peak",
      weekIndexInPhase: 0,
      weekKm: 50,
      schedule: SCHEDULE_4,
    });
    const racePaceSessions = sessions.filter(
      (s) => s.structureSpec?.kind === "intervals_paced",
    );
    expect(racePaceSessions).toHaveLength(1);
    const rp = racePaceSessions[0]!.structureSpec;
    if (rp?.kind === "intervals_paced") {
      // Entry comes from the bank (600/800/1000m); pace is the 5K race pace.
      expect(rp.reps).toBeGreaterThanOrEqual(5);
      expect(rp.repDistanceM).toBeGreaterThanOrEqual(600);
      expect(rp.targetPaceMps).toBeGreaterThan(3.9);
    }
  });

  it("uses race-pace every week (no VMA longue / Mixte at peak)", () => {
    const w1 = microcycle5K({
      ...baseArgs,
      phase: "peak",
      weekIndexInPhase: 1,
      weekKm: 50,
      schedule: SCHEDULE_5,
    });
    expect(
      w1.some((s) => s.structureSpec?.kind === "intervals_paced"),
    ).toBe(true);
    expect(w1.some((s) => s.structureSpec?.kind === "mixed")).toBe(false);
  });

  it("anchors the last race-pace spé to the J-8→J-10 window (Sunday race → Saturday, J-8)", () => {
    // Sunday race (raceDow 6) → 7-day taper; the peak week's Sunday is J-7, so the
    // last spé caps at Saturday (J-8). Window day-of-week = [taperDays−4, taperDays−2]
    // = [3, 5]; with all days available the latest in-window day (Sat, dow 5) wins.
    const sessions = microcycle5K({
      ...baseArgs,
      phase: "peak",
      weekIndexInPhase: 0,
      weekKm: 50,
      schedule: { availableDays: [0, 1, 2, 3, 4, 5, 6], sessionsPerWeek: 5 },
      raceDow: 6,
    });
    const racePaceDays = sessions
      .filter((s) => s.structureSpec?.kind === "intervals_paced")
      .map((s) => s.dayOfWeek);
    expect(Math.max(...racePaceDays)).toBe(5);
  });

  it("anchors the last race-pace spé to Sunday (J-10) for a Wednesday race", () => {
    // Wednesday race (raceDow 2) → 10-day taper; peak Sunday is J-10. Window dow =
    // [taperDays−4, taperDays−2] = [6, 6], so the last spé must land on Sunday.
    const sessions = microcycle5K({
      ...baseArgs,
      phase: "peak",
      weekIndexInPhase: 0,
      weekKm: 50,
      schedule: { availableDays: [0, 1, 2, 3, 4, 5, 6], sessionsPerWeek: 5 },
      raceDow: 2,
    });
    const racePaceDays = sessions
      .filter((s) => s.structureSpec?.kind === "intervals_paced")
      .map((s) => s.dayOfWeek);
    expect(Math.max(...racePaceDays)).toBe(6);
  });

  it("without raceDow the last spé keeps its natural latest-day placement", () => {
    const sessions = microcycle5K({
      ...baseArgs,
      phase: "peak",
      weekIndexInPhase: 0,
      weekKm: 50,
      schedule: { availableDays: [0, 1, 2, 3, 4, 5, 6], sessionsPerWeek: 5 },
    });
    const racePaceDays = sessions
      .filter((s) => s.structureSpec?.kind === "intervals_paced")
      .map((s) => s.dayOfWeek);
    expect(Math.max(...racePaceDays)).toBe(6);
  });

  it("composition per frequency: easy(+strides) + race-pace spé only (no SV2/SV1 long)", () => {
    const isStridesEasy = (s: {
      structureSpec?: { kind: string; addStrides?: boolean };
    }) =>
      s.structureSpec?.kind === "easy_continuous" &&
      s.structureSpec.addStrides === true;
    const isPlainEasy = (s: {
      structureSpec?: { kind: string; addStrides?: boolean };
    }) =>
      s.structureSpec?.kind === "easy_continuous" &&
      s.structureSpec.addStrides === false;
    const isRacePace = (s: { structureSpec?: { kind: string } }) =>
      s.structureSpec?.kind === "intervals_paced";

    // [availableDays, expected strides-easy, plain-easy, spé]
    const cases: [number[], number, number, number][] = [
      [[2, 5], 1, 0, 1], // 2 sessions
      [[1, 3, 5], 1, 1, 1], // 3 sessions
      [[1, 3, 5, 6], 2, 1, 1], // 4 sessions
      [[0, 1, 3, 5, 6], 1, 2, 2], // 5 sessions
      [[0, 1, 2, 3, 4, 5], 1, 3, 2], // 6 sessions
    ];
    for (const [availableDays, strides, plain, spe] of cases) {
      const sessions = microcycle5K({
        ...baseArgs,
        phase: "peak",
        weekIndexInPhase: 0,
        weekKm: 50,
        schedule: { availableDays, sessionsPerWeek: availableDays.length },
      });
      expect(sessions).toHaveLength(availableDays.length);
      expect(sessions.filter(isStridesEasy)).toHaveLength(strides);
      expect(sessions.filter(isPlainEasy)).toHaveLength(plain);
      expect(sessions.filter(isRacePace)).toHaveLength(spe);
      expect(sessions.some(isSv2)).toBe(false);
      expect(sessions.some(isSv1Long)).toBe(false);
    }
  });
});

describe("taperDaysForRaceDow", () => {
  it("Sunday race → 7-day taper (the race-week itself)", () => {
    expect(taperDaysForRaceDow(6)).toBe(7);
  });

  it("Mon/Tue/Wed → extended 8/9/10-day taper", () => {
    expect(taperDaysForRaceDow(0)).toBe(8);
    expect(taperDaysForRaceDow(1)).toBe(9);
    expect(taperDaysForRaceDow(2)).toBe(10);
  });

  it("Thu/Fri/Sat → shortened 4/5/6-day taper", () => {
    expect(taperDaysForRaceDow(3)).toBe(4);
    expect(taperDaysForRaceDow(4)).toBe(5);
    expect(taperDaysForRaceDow(5)).toBe(6);
  });
});

describe("fiveKGrid", () => {
  it("anchors the week grid to the Monday of the plan-start week", () => {
    // 2026-06-04 is a Thursday → grid starts Monday 2026-06-01.
    const grid = fiveKGrid("2026-06-04", "2026-08-30"); // race Sunday
    expect(grid.gridStartYmd).toBe("2026-06-01");
  });

  it("Sunday race → taper opens on the race-week Monday (7 days)", () => {
    // Race Sunday 2026-08-30 → taper Mon 2026-08-24 .. Sun 2026-08-30.
    const grid = fiveKGrid("2026-06-01", "2026-08-30");
    expect(grid.taperDays).toBe(7);
    expect(grid.taperStartYmd).toBe("2026-08-24");
    expect(isoDayOfWeek(grid.taperStartYmd)).toBe(0); // Monday
  });

  it("Wednesday race → 10-day taper opening a Monday in the prior week", () => {
    // Race Wed 2026-09-02 → taper opens Mon 2026-08-24 (10 days inclusive).
    const grid = fiveKGrid("2026-06-01", "2026-09-02");
    expect(grid.taperDays).toBe(10);
    expect(grid.taperStartYmd).toBe("2026-08-24");
    expect(isoDayOfWeek(grid.taperStartYmd)).toBe(0);
  });

  it("Thursday race → 4-day taper opening the race-week Monday", () => {
    // Race Thu 2026-09-03 → taper opens Mon 2026-08-31 (4 days inclusive).
    const grid = fiveKGrid("2026-06-01", "2026-09-03");
    expect(grid.taperDays).toBe(4);
    expect(grid.taperStartYmd).toBe("2026-08-31");
    expect(isoDayOfWeek(grid.taperStartYmd)).toBe(0);
  });

  it("pre-taper weeks are whole Mon→Sun weeks before the taper", () => {
    const grid = fiveKGrid("2026-06-01", "2026-08-30"); // 13-week span, Sun race
    // gridStart 2026-06-01 → taperStart 2026-08-24 = 12 weeks.
    expect(grid.preTaperWeeks).toBe(12);
  });
});

describe("taperSessions5K", () => {
  const taperArgs = {
    weekKm: 27,
    peakKm: 45,
    paces: PACES_50,
    vdot: VDOT_50,
    schedule: { availableDays: [0, 1, 2, 3, 4, 5, 6], sessionsPerWeek: 5 },
  };

  // The rappel d'allure tune-up is the only paced session in the taper; its exact
  // reps/distance are drawn from the rappel bank by the athlete's level.
  const findTune = (out: { spec: SessionSpec; dateYmd: string }[]) =>
    out.find((s) => s.spec.structureSpec?.kind === "intervals_paced");

  it("places the rappel d'allure in the J-5→J-4 window (Sunday race → J-5)", () => {
    const out = taperSessions5K({
      ...taperArgs,
      taperStartYmd: "2026-08-24",
      raceYmd: "2026-08-30", // Sunday
    });
    const tune = findTune(out);
    expect(tune).toBeDefined();
    // All days available → window {Tue J-5, Wed J-4}; ties prefer more rest → J-5.
    expect(tune?.dateYmd).toBe("2026-08-25"); // Tuesday, 5 days before the race
  });

  it("falls back to the closest day when the athlete trains neither J-4 nor J-5", () => {
    // Trains Mon/Thu only. Sunday race → taper Mon 08-24 (J-6) .. Sat (eve). Pool:
    // Mon 08-24 (J-6) and Thu 08-27 (J-3); both 1 day off the window, ties prefer
    // more rest → Monday (J-6).
    const out = taperSessions5K({
      ...taperArgs,
      schedule: { availableDays: [0, 3], sessionsPerWeek: 2 },
      taperStartYmd: "2026-08-24",
      raceYmd: "2026-08-30",
    });
    const tune = findTune(out);
    expect(tune?.dateYmd).toBe("2026-08-24");
  });

  it("pins the 20-min strides shakeout to race-eve and never touches race day", () => {
    const raceYmd = "2026-08-30"; // Sunday → eve Saturday 2026-08-29
    const out = taperSessions5K({
      ...taperArgs,
      taperStartYmd: "2026-08-24",
      raceYmd,
    });
    const shakeout = out.find(
      (s) =>
        s.spec.structureSpec?.kind === "easy_continuous" &&
        s.spec.structureSpec.addStrides === true &&
        s.spec.structureSpec.durationSec === 20 * 60,
    );
    expect(shakeout?.dateYmd).toBe("2026-08-29");
    // Nothing on or after race day.
    expect(out.every((s) => s.dateYmd < raceYmd)).toBe(true);
  });

  it("spans both calendar weeks for an extended (Wednesday) taper", () => {
    // 10-day taper: Mon 2026-08-24 .. Tue 2026-09-01 (race Wed 2026-09-02).
    const raceYmd = "2026-09-02";
    const out = taperSessions5K({
      ...taperArgs,
      taperStartYmd: "2026-08-24",
      raceYmd,
    });
    expect(out.length).toBeGreaterThan(0);
    expect(out.every((s) => s.dateYmd >= "2026-08-24" && s.dateYmd < raceYmd)).toBe(
      true,
    );
    // Shakeout on race-eve Tuesday 2026-09-01.
    const shakeout = out.find(
      (s) =>
        s.spec.structureSpec?.kind === "easy_continuous" &&
        s.spec.structureSpec.durationSec === 20 * 60,
    );
    expect(shakeout?.dateYmd).toBe("2026-09-01");
  });

  it("counts the race as a session: race week holds at most sessionsPerWeek − 1 trainings", () => {
    // 4 sessions/week, Sunday race. Without the cap the week would carry 4
    // trainings (shakeout + tune-up + 2 easies) + the race = 5 outings; the race
    // is the 4th session, so training in the race's calendar week is capped to 3.
    const raceYmd = "2026-08-30"; // Sunday → race-week Monday 2026-08-24
    const out = taperSessions5K({
      ...taperArgs,
      schedule: { availableDays: [0, 1, 2, 3, 4, 5, 6], sessionsPerWeek: 4 },
      taperStartYmd: "2026-08-24",
      raceYmd,
    });
    const raceWeek = out.filter((s) => s.dateYmd >= "2026-08-24");
    expect(raceWeek.length).toBe(3);
    // The two highest-priority touches survive the cap.
    expect(findTune(out)).toBeDefined();
    expect(
      out.some(
        (s) =>
          s.spec.structureSpec?.kind === "easy_continuous" &&
          s.spec.structureSpec.addStrides === true &&
          s.spec.structureSpec.durationSec === 20 * 60,
      ),
    ).toBe(true);
  });

  it("low-frequency athletes (≤3 sessions/week) get no shakeout", () => {
    const out = taperSessions5K({
      ...taperArgs,
      schedule: { availableDays: [1, 3, 5], sessionsPerWeek: 3 },
      taperStartYmd: "2026-08-24",
      raceYmd: "2026-08-30",
    });
    const shakeout = out.find(
      (s) =>
        s.spec.structureSpec?.kind === "easy_continuous" &&
        s.spec.structureSpec.durationSec === 20 * 60,
    );
    expect(shakeout).toBeUndefined();
  });
});

describe("microcycle5K — strides assignment", () => {
  it("every quality-bearing phase week schedules at least one strides easy", () => {
    const sessions = microcycle5K({
      ...baseArgs,
      phase: "build",
      weekIndexInPhase: 0,
      weekKm: 50,
      schedule: SCHEDULE_5,
    });
    const hasStrides = sessions.some(
      (s) =>
        s.structureSpec?.kind === "easy_continuous" &&
        s.structureSpec.addStrides === true,
    );
    expect(hasStrides).toBe(true);
  });
});

describe("microcycle5K — day spacing", () => {
  it("places the SV1 long on the latest available day", () => {
    const sessions = microcycle5K({
      ...baseArgs,
      phase: "base",
      weekIndexInPhase: 0,
      schedule: SCHEDULE_5, // [0,1,3,5,6]
    });
    const long = sessions.find(isSv1Long);
    expect(long?.dayOfWeek).toBe(6); // latest day
  });

  it("does not place two hard sessions on adjacent days when avoidable", () => {
    // 5 sessions, 2 qualities + 1 long across [0,1,3,5,6] → spread 0 / 3 / 6.
    const sessions = microcycle5K({
      ...baseArgs,
      phase: "build",
      weekIndexInPhase: 2,
      weekKm: 55,
      schedule: SCHEDULE_5,
    });
    const hardDays = sessions
      .filter((s) => s.structureSpec?.kind !== "easy_continuous")
      .map((s) => s.dayOfWeek)
      .sort((a, b) => a - b);
    for (let i = 1; i < hardDays.length; i++) {
      expect(hardDays[i]! - hardDays[i - 1]!).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("microcycle5K — EF duration constraint", () => {
  it("easy_continuous durationSec clamps within [30min, 50min]", () => {
    const sessionsHigh = microcycle5K({
      ...baseArgs,
      phase: "base",
      weekIndexInPhase: 0,
      weekKm: 60,
      schedule: SCHEDULE_4,
    });
    const easyHigh = sessionsHigh.find(
      (s) => s.structureSpec?.kind === "easy_continuous",
    );
    if (easyHigh?.structureSpec?.kind === "easy_continuous") {
      expect(easyHigh.structureSpec.durationSec).toBeLessThanOrEqual(50 * 60);
      expect(easyHigh.structureSpec.durationSec).toBeGreaterThanOrEqual(30 * 60);
    }

    const sessionsLow = microcycle5K({
      ...baseArgs,
      phase: "base",
      weekIndexInPhase: 0,
      weekKm: 10,
      schedule: SCHEDULE_4,
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
      ...baseArgs,
      phase: "build",
      weekIndexInPhase: 0,
      weekKm: 50,
      schedule: SCHEDULE_4,
    });
    const sv2 = sessions.find(isSv2);
    if (sv2?.structureSpec?.kind === "long_with_blocks") {
      expect(sv2.structureSpec.warmupSec).toBeGreaterThanOrEqual(15 * 60);
      expect(sv2.structureSpec.warmupSec).toBeLessThanOrEqual(20 * 60);
      expect(sv2.structureSpec.cooldownSec).toBeGreaterThanOrEqual(5 * 60);
      expect(sv2.structureSpec.cooldownSec).toBeLessThanOrEqual(10 * 60);
    }
  });
});

describe("selectBankIndex", () => {
  it("single-entry (or empty) bank always returns 0", () => {
    expect(selectBankIndex(1, 0, 0)).toBe(0);
    expect(selectBankIndex(1, 1, 1)).toBe(0);
    expect(selectBankIndex(0, 0.5, 0.5)).toBe(0);
  });

  it("level 0 + progress 0 → easiest (0); level 1 + progress 1 → hardest (len−1)", () => {
    for (const len of [2, 3, 8, 11, 15]) {
      expect(selectBankIndex(len, 0, 0)).toBe(0);
      expect(selectBankIndex(len, 1, 1)).toBe(len - 1);
    }
  });

  it("stays in bounds for any level/progress", () => {
    for (const len of [2, 5, 8, 15]) {
      for (const level of [-1, 0, 0.3, 0.7, 1, 2]) {
        for (const progress of [-1, 0, 0.4, 0.9, 1, 2]) {
          const idx = selectBankIndex(len, level, progress);
          expect(idx).toBeGreaterThanOrEqual(0);
          expect(idx).toBeLessThanOrEqual(len - 1);
        }
      }
    }
  });

  it("is non-decreasing in progress (level fixed)", () => {
    const len = 11;
    let prev = -1;
    for (const p of [0, 0.25, 0.5, 0.75, 1]) {
      const idx = selectBankIndex(len, 0.5, p);
      expect(idx).toBeGreaterThanOrEqual(prev);
      prev = idx;
    }
  });

  it("is non-decreasing in level (progress fixed) — fitter athletes start higher", () => {
    const len = 11;
    let prev = -1;
    for (const lvl of [0, 0.25, 0.5, 0.75, 1]) {
      const idx = selectBankIndex(len, lvl, 0.5);
      expect(idx).toBeGreaterThanOrEqual(prev);
      prev = idx;
    }
  });
});

describe("microcycle5K — bank progression", () => {
  it("draws a harder SV1 long late in the plan than early (same athlete)", () => {
    const early = microcycle5K({
      ...baseArgs,
      phase: "base",
      weekIndexInPhase: 0,
      schedule: SCHEDULE_4,
      planProgress: 0,
    }).find(isSv1Long);
    const late = microcycle5K({
      ...baseArgs,
      phase: "base",
      weekIndexInPhase: 0,
      schedule: SCHEDULE_4,
      planProgress: 1,
    }).find(isSv1Long);

    expect(early?.structureSpec?.kind).toBe("long_with_blocks");
    expect(late?.structureSpec?.kind).toBe("long_with_blocks");
    if (
      early?.structureSpec?.kind === "long_with_blocks" &&
      late?.structureSpec?.kind === "long_with_blocks"
    ) {
      // Progress walks up the bank → a different (later, harder) entry is drawn.
      const earlyWork = early.structureSpec.reps * early.structureSpec.workDurationSec;
      const lateWork = late.structureSpec.reps * late.structureSpec.workDurationSec;
      expect(lateWork).toBeGreaterThan(earlyWork);
    }
  });
});
