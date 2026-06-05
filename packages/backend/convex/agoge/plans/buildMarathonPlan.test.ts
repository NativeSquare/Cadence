/**
 * Invariant / characterization tests for the marathon (42,195 km) plan generator.
 * Pin the marathon-specific structure: the 6-week build (3 début + 3 fin), the
 * 3-week affûtage (two lead weeks at 85 %/60 % + a 50 % race-week tail), the
 * mid-week long run in affûtage 2, and the usual trace integrity / hard-day
 * spacing invariants the shared core guarantees.
 */

import { describe, expect, it } from "vitest";

import { computeVdot, isoDayOfWeek, type Schedule } from "../periodization";
import { buildMarathonPlan } from "./buildMarathonPlan";

const SCHEDULE_5: Schedule = {
  availableDays: [0, 1, 3, 5, 6],
  sessionsPerWeek: 5,
};

// ~24 weeks out so the full base/build(×6)/peak/affûtage(×3) layout fits.
const inputs = {
  planStartYmd: "2026-01-05", // Monday
  raceYmd: "2026-06-21", // Sunday, ~24 weeks out
  currentKm: 50,
  schedule: SCHEDULE_5,
  locale: "fr" as const,
  targetTimeSeconds: 200 * 60, // ~3h20 marathon
};

const isEnduranceLongue = (kind: string | undefined) =>
  kind === "intervals_paced_time";

describe("buildMarathonPlan — phase layout", () => {
  it("splits build into 6 weeks (3 début + 3 fin) and a single peak week", () => {
    const trace = buildMarathonPlan(inputs);
    const buildWeeks = trace.weeks.filter((wk) => wk.phase === "build");
    const peakWeeks = trace.weeks.filter((wk) => wk.phase === "peak");
    expect(buildWeeks.length).toBe(6);
    expect(peakWeeks.length).toBe(1);
  });

  it("peaks at 90km (distancePeakKm marathon) and resolves VDOT from the target", () => {
    const trace = buildMarathonPlan(inputs);
    expect(trace.resolved.peakKm).toBe(90);
    expect(trace.resolved.vdot).toBeCloseTo(
      computeVdot(42195, inputs.targetTimeSeconds),
      5,
    );
  });

  it("every build/peak week carries the endurance longue (AS42 blocks)", () => {
    const trace = buildMarathonPlan(inputs);
    const phaseWeeks = trace.weeks.filter(
      (wk) => wk.phase === "build" || wk.phase === "peak",
    );
    for (const wk of phaseWeeks) {
      const hasLongue = wk.sessions.some(
        (s) =>
          !s.dropped &&
          s.spec.type === "long" &&
          isEnduranceLongue(s.spec.structureSpec?.kind),
      );
      expect(hasLongue).toBe(true);
    }
  });
});

describe("buildMarathonPlan — 3-week affûtage", () => {
  it("emits two lead weeks (affûtage 1 & 2) as 'taper'-phase microcycles", () => {
    const trace = buildMarathonPlan(inputs);
    const leadWeeks = trace.weeks.filter((wk) => wk.phase === "taper");
    expect(leadWeeks.length).toBe(2);
  });

  it("scales the two lead weeks at 85% and 60% of plan peak", () => {
    const trace = buildMarathonPlan(inputs);
    const leadWeeks = trace.weeks.filter((wk) => wk.phase === "taper");
    const peak = trace.resolved.planPeakKm;
    expect(leadWeeks[0]!.weekKm).toBeCloseTo(peak * 0.85, 5);
    expect(leadWeeks[1]!.weekKm).toBeCloseTo(peak * 0.6, 5);
  });

  it("places affûtage 2's long run before its last session (mid-week)", () => {
    const trace = buildMarathonPlan(inputs);
    const leadWeeks = trace.weeks.filter((wk) => wk.phase === "taper");
    const affutage2 = leadWeeks[1]!;
    const kept = affutage2.sessions.filter((s) => !s.dropped);
    const longDow = kept.find((s) => s.spec.type === "long")?.dayOfWeek;
    const latestDow = Math.max(...kept.map((s) => s.dayOfWeek));
    expect(longDow).toBeDefined();
    expect(longDow!).toBeLessThan(latestDow); // not the latest day
  });

  it("the race-week tail carries the rappel d'allure and ends on race day", () => {
    const trace = buildMarathonPlan(inputs);
    const tail = trace.taper.sessions.filter((s) => !s.dropped);
    expect(tail.some((s) => s.spec.type === "race_pace")).toBe(true);
    const last = trace.blocks[trace.blocks.length - 1]!;
    expect(last.type).toBe("taper");
    expect(last.endYmd).toBe(inputs.raceYmd);
  });
});

describe("buildMarathonPlan — trace integrity", () => {
  it("every dropped session carries a reason, every kept one a structure", () => {
    const trace = buildMarathonPlan(inputs);
    const all = [
      ...trace.weeks.flatMap((wk) => wk.sessions),
      ...trace.taper.sessions,
    ];
    for (const s of all) {
      if (s.dropped) {
        expect(s.dropReason).toBeDefined();
        expect(s.structure).toBeUndefined();
      } else {
        expect(s.structure).toBeDefined();
        expect(s.workoutName).toBeTruthy();
      }
    }
  });

  it("never schedules two hard sessions on adjacent calendar days, across seams", () => {
    const trace = buildMarathonPlan(inputs);
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

  it("anchors week rows on Monday and ends on race day", () => {
    const trace = buildMarathonPlan(inputs);
    expect(isoDayOfWeek(trace.grid.gridStartYmd)).toBe(0);
    expect(trace.race?.dateYmd).toBe(inputs.raceYmd);
  });
});
