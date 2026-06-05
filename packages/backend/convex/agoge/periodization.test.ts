/**
 * Pure-function tests for VDOT-derived training paces, focused on the Easy (E)
 * slowdown that makes EF / warmup / cooldown / recovery jogs easier.
 *
 * No Convex deps — runs with vitest. To run: `pnpm vitest` from the backend package.
 */

import { describe, expect, it } from "vitest";

import {
  computeVdot,
  easySlowdownFraction,
  isSupportedFormat,
  minimumPlanWeeksForFormat,
  paceMpsAtIntensity,
  trainingPaces,
} from "./periodization";

/** m/s for a given pace expressed in seconds per km. */
const mpsAt = (secPerKm: number) => 1000 / secPerKm;

describe("minimumPlanWeeksForFormat", () => {
  it("floors the marathon at 10 weeks and the 5K at 4", () => {
    expect(minimumPlanWeeksForFormat("marathon")).toBe(10);
    expect(minimumPlanWeeksForFormat("5k")).toBe(4);
  });

  it("leaves 10K and half-marathon without an enforced floor", () => {
    expect(minimumPlanWeeksForFormat("10k")).toBeUndefined();
    expect(minimumPlanWeeksForFormat("half_marathon")).toBeUndefined();
  });
});

describe("isSupportedFormat", () => {
  it("supports exactly the four dedicated distances", () => {
    expect(isSupportedFormat("5k")).toBe(true);
    expect(isSupportedFormat("10k")).toBe(true);
    expect(isSupportedFormat("half_marathon")).toBe(true);
    expect(isSupportedFormat("marathon")).toBe(true);
  });

  it("rejects formats that relied on the removed general generator", () => {
    expect(isSupportedFormat("15k")).toBe(false);
    expect(isSupportedFormat("10_miles")).toBe(false);
    expect(isSupportedFormat("custom")).toBe(false);
    expect(isSupportedFormat(undefined)).toBe(false);
  });
});

describe("easySlowdownFraction", () => {
  it("slows faster easy paces more (first-match cascade, top to bottom)", () => {
    expect(easySlowdownFraction(mpsAt(400))).toBe(0.05); // 6:40 → slower than 6:30
    expect(easySlowdownFraction(mpsAt(375))).toBe(0.1); // 6:15 → 6:00–6:30
    expect(easySlowdownFraction(mpsAt(345))).toBe(0.13); // 5:45 → 5:30–6:00
    expect(easySlowdownFraction(mpsAt(315))).toBe(0.18); // 5:15 → 5:00–5:30
    expect(easySlowdownFraction(mpsAt(285))).toBe(0.2); // 4:45 → 4:30–5:00
    expect(easySlowdownFraction(mpsAt(255))).toBe(0.23); // 4:15 → 4:00–4:30
    expect(easySlowdownFraction(mpsAt(225))).toBe(0.25); // 3:45 → faster than 4:00
    expect(easySlowdownFraction(mpsAt(180))).toBe(0.25); // 3:00 → plafond
  });

  it("treats each threshold as 'strictly slower than' (boundary falls to next band)", () => {
    // Exactly 6:30/km is NOT slower than 6:30 → next band (6:00–6:30) → 10%.
    expect(easySlowdownFraction(mpsAt(6.5 * 60))).toBe(0.1);
    // Exactly 4:00/km is NOT slower than 4:00 → plafond → 25%.
    expect(easySlowdownFraction(mpsAt(4 * 60))).toBe(0.25);
  });

  it("returns 0 for non-positive speeds", () => {
    expect(easySlowdownFraction(0)).toBe(0);
    expect(easySlowdownFraction(-1)).toBe(0);
  });
});

describe("trainingPaces — Easy slowdown", () => {
  const VDOT_50 = computeVdot(5000, 21 * 60); // ~50 VDOT (21:00 5K)

  it("slows E by the matched fraction; leaves M/T/I/R as raw VDOT paces", () => {
    const rawE = paceMpsAtIntensity(VDOT_50, 0.7);
    const fraction = easySlowdownFraction(rawE);
    const paces = trainingPaces(VDOT_50);

    expect(fraction).toBeGreaterThan(0); // ~5:07/km → 18%
    expect(paces.E).toBeLessThan(rawE);
    expect(paces.E).toBeCloseTo(rawE / (1 + fraction), 6);

    // Other anchors are untouched by the slowdown.
    expect(paces.M).toBeCloseTo(paceMpsAtIntensity(VDOT_50, 0.84), 6);
    expect(paces.T).toBeCloseTo(paceMpsAtIntensity(VDOT_50, 0.88), 6);
    expect(paces.I).toBeCloseTo(paceMpsAtIntensity(VDOT_50, 0.98), 6);
    expect(paces.R).toBeCloseTo(paceMpsAtIntensity(VDOT_50, 1.1), 6);
  });

  it("keys the slowdown off the raw (pre-adjustment) easy pace", () => {
    // A slow runner (raw E slower than 6:30/km) gets only 5%.
    const VDOT_SLOW = computeVdot(5000, 32 * 60); // raw E well above 6:30/km
    const rawSlowE = paceMpsAtIntensity(VDOT_SLOW, 0.7);
    expect(1000 / rawSlowE).toBeGreaterThan(6.5 * 60);
    expect(trainingPaces(VDOT_SLOW).E).toBeCloseTo(rawSlowE / 1.05, 6);
  });
});

describe("trainingPaces — SV1 zone", () => {
  it("centres SV1 on the fast edge of the raw VDOT-E band (rawE × 1.08)", () => {
    const VDOT_50 = computeVdot(5000, 21 * 60);
    const rawE = paceMpsAtIntensity(VDOT_50, 0.7);
    expect(trainingPaces(VDOT_50).SV1).toBeCloseTo(rawE * 1.08, 6);
  });

  it("keeps the Easy and SV1 fourchettes separated for every runner", () => {
    const E_BAND = 0.08; // ±8% around the slowed Easy pace
    const SV1_SEC = 8; // ±8 sec/km around the SV1 point pace
    // 5K times spanning beginners (slowest E tier, 5% slowdown) to elites
    // (25% ceiling) — every slowdown tier is crossed in this range.
    for (let t = 14 * 60; t <= 34 * 60; t += 30) {
      const p = trainingPaces(computeVdot(5000, t));
      // The fast edge of Easy must stay strictly slower than the slow edge of SV1.
      const easyFastMps = p.E * (1 + E_BAND);
      const sv1SlowMps = 1000 / (1000 / p.SV1 + SV1_SEC);
      expect(easyFastMps).toBeLessThan(sv1SlowMps);
      // Pace order (slower = lower m/s): E < SV1 < M.
      expect(p.E).toBeLessThan(p.SV1);
      expect(p.SV1).toBeLessThan(p.M);
    }
  });
});
