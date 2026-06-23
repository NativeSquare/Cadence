/**
 * Pure-function tests for the Cycle derivation core (ADR-0010): cycle day, phase
 * boundaries, the median-of-recent cycle length, and the honest "estimate"
 * flag while history is thin. No Convex deps — runs with vitest.
 *
 * To run: `pnpm vitest` from the backend package.
 */

import { describe, expect, it } from "vitest";

import {
  DEFAULT_CYCLE_LENGTH_DAYS,
  deriveCycle,
  phaseForDay,
} from "./derive";

const noon = (ymd: string) => `${ymd}T12:00:00.000Z`;

describe("deriveCycle — empty history", () => {
  it("returns nulls and the default length when nothing is logged", () => {
    const d = deriveCycle([], noon("2026-06-23"));
    expect(d.cycleDay).toBeNull();
    expect(d.phase).toBeNull();
    expect(d.lastStartYmd).toBeNull();
    expect(d.observedCycles).toBe(0);
    expect(d.cycleLengthDays).toBe(DEFAULT_CYCLE_LENGTH_DAYS);
    expect(d.phaseIsEstimate).toBe(true);
  });
});

describe("deriveCycle — a single start (no observed cycle)", () => {
  it("knows the cycle day for certain but flags the phase as an estimate", () => {
    // Started 3 days ago → day 4.
    const d = deriveCycle([noon("2026-06-20")], noon("2026-06-23"));
    expect(d.lastStartYmd).toBe("2026-06-20");
    expect(d.cycleDay).toBe(4);
    expect(d.observedCycles).toBe(0);
    expect(d.cycleLengthDays).toBe(DEFAULT_CYCLE_LENGTH_DAYS);
    expect(d.phaseIsEstimate).toBe(true);
    expect(d.phase).toBe("menstrual"); // day 4 ≤ 5
  });

  it("counts the start day itself as day 1", () => {
    const d = deriveCycle([noon("2026-06-23")], noon("2026-06-23"));
    expect(d.cycleDay).toBe(1);
    expect(d.phase).toBe("menstrual");
  });
});

describe("deriveCycle — cycle length is the median of recent spans", () => {
  it("takes the median, so one aberrant cycle doesn't deform it", () => {
    // Spans: 28, 27, 60 (travel/illness outlier), 29 → median of [27,28,29,60] = 28.5 → 29
    const starts = [
      noon("2026-01-01"),
      noon("2026-01-29"), // +28
      noon("2026-02-25"), // +27
      noon("2026-04-26"), // +60 outlier
      noon("2026-05-25"), // +29
    ];
    const d = deriveCycle(starts, noon("2026-05-30"));
    expect(d.observedCycles).toBe(4);
    expect(d.cycleLengthDays).toBe(29);
    expect(d.phaseIsEstimate).toBe(false);
  });

  it("flags an estimate with exactly one observed cycle", () => {
    const d = deriveCycle(
      [noon("2026-05-01"), noon("2026-05-29")],
      noon("2026-06-10"),
    );
    expect(d.observedCycles).toBe(1);
    expect(d.cycleLengthDays).toBe(28);
    expect(d.phaseIsEstimate).toBe(true);
  });

  it("ignores duplicate day keys", () => {
    const d = deriveCycle(
      [noon("2026-05-01"), noon("2026-05-01"), noon("2026-05-29")],
      noon("2026-06-01"),
    );
    expect(d.observedCycles).toBe(1);
  });
});

describe("phaseForDay — boundaries for a 28-day cycle (ovulation day 14)", () => {
  it("maps each phase window", () => {
    expect(phaseForDay(1, 28)).toBe("menstrual");
    expect(phaseForDay(5, 28)).toBe("menstrual");
    expect(phaseForDay(6, 28)).toBe("follicular");
    expect(phaseForDay(12, 28)).toBe("follicular");
    expect(phaseForDay(13, 28)).toBe("ovulatory"); // 14 ± 1
    expect(phaseForDay(14, 28)).toBe("ovulatory");
    expect(phaseForDay(15, 28)).toBe("ovulatory");
    expect(phaseForDay(16, 28)).toBe("luteal");
    expect(phaseForDay(28, 28)).toBe("luteal");
  });

  it("treats an overdue day count (past the expected length) as still luteal", () => {
    expect(phaseForDay(35, 28)).toBe("luteal");
  });

  it("keeps ovulation past the menstrual window for very short cycles", () => {
    // 21-day cycle → ovulation = 7, so the ovulatory window is days 6–8 and the
    // follicular phase is squeezed out entirely (a short cycle = short follicular).
    expect(phaseForDay(5, 21)).toBe("menstrual");
    expect(phaseForDay(6, 21)).toBe("ovulatory");
    expect(phaseForDay(7, 21)).toBe("ovulatory");
    expect(phaseForDay(9, 21)).toBe("luteal");
  });
});
