/**
 * Pure-function tests for the shared Readiness core (ADR-0009): the monotonic
 * ratchet that keeps Soma corroborating rather than deciding, and the
 * deterministic z-score / delta / sleep computation that feeds it.
 *
 * No Convex deps — runs with vitest. To run: `pnpm vitest` from the backend package.
 */

import { describe, expect, it } from "vitest";

import {
  type Concern,
  type DailyRecord,
  type SleepRecord,
  computeReadiness,
  ratchetConcern,
} from "@packages/shared/readiness";

describe("ratchetConcern — the corroborate-never-decide invariant", () => {
  // The full truth table from ADR-0009: voice tier × what the LLM emitted.
  const cases: Array<{ voice: Concern; final: Concern; expected: Concern }> = [
    // none can rise one step to watch, never jump to act.
    { voice: "none", final: "none", expected: "none" },
    { voice: "none", final: "watch", expected: "watch" },
    { voice: "none", final: "act", expected: "watch" }, // skip clamped down
    // watch can rise to act, never fall.
    { voice: "watch", final: "none", expected: "watch" }, // downgrade clamped up
    { voice: "watch", final: "watch", expected: "watch" },
    { voice: "watch", final: "act", expected: "act" },
    // act is the ceiling and the floor — never lowered.
    { voice: "act", final: "none", expected: "act" }, // downgrade clamped up
    { voice: "act", final: "watch", expected: "act" }, // downgrade clamped up
    { voice: "act", final: "act", expected: "act" },
  ];

  for (const { voice, final, expected } of cases) {
    it(`voice=${voice}, llm=${final} → ${expected}`, () => {
      expect(ratchetConcern(voice, final)).toBe(expected);
    });
  }

  it("never lets a none→act jump through (hrv_low_v1 cannot return)", () => {
    expect(ratchetConcern("none", "act")).not.toBe("act");
  });

  it("never downgrades below the runner's voice", () => {
    const tiers: Concern[] = ["none", "watch", "act"];
    const rank = (c: Concern) => tiers.indexOf(c);
    for (const voice of tiers) {
      for (const final of tiers) {
        expect(rank(ratchetConcern(voice, final))).toBeGreaterThanOrEqual(
          rank(voice),
        );
      }
    }
  });
});

// --- computeReadiness ------------------------------------------------------

function daily(
  date: string,
  hrv?: number,
  rhr?: number,
): DailyRecord {
  return {
    metadata: { start_time: `${date}T06:00:00.000Z` },
    heart_rate_data: { summary: { avg_hrv_rmssd: hrv, resting_hr_bpm: rhr } },
  };
}

function sleep(
  night: string,
  hours: number,
  score?: number,
): SleepRecord {
  return {
    metadata: { start_time: `${night}T23:00:00.000Z` },
    sleep_durations_data: {
      asleep: { duration_asleep_state_seconds: hours * 3600 },
    },
    data_enrichment: { sleep_score: score },
  };
}

const TARGET = "2026-06-15T12:00:00.000Z";

/** 7 prior days of stable HRV ~50ms / RHR ~48bpm — a usable baseline. */
function baselineDailies(): DailyRecord[] {
  const hrvs = [48, 52, 50, 49, 51, 50, 50];
  const rhrs = [48, 47, 49, 48, 48, 49, 47];
  return hrvs.map((h, i) =>
    daily(`2026-06-${String(8 + i).padStart(2, "0")}`, h, rhrs[i]),
  );
}

describe("computeReadiness", () => {
  it("flags a crashed HRV as a strongly negative z-score", () => {
    const r = computeReadiness({
      dayKey: TARGET,
      dailies: [...baselineDailies(), daily("2026-06-15", 38, 54)],
      sleeps: [sleep("2026-06-14", 5.5, 55)],
    });
    expect(r.noSignal).toBe(false);
    expect(r.hrvZScore).toBeLessThan(-1); // 38ms is well below a ~50ms baseline
    expect(r.restingHrDelta).toBeGreaterThan(0); // elevated RHR
    expect(r.sleepHours).toBe(5.5);
    expect(r.sleepQuality).toBe("poor");
  });

  it("reports a near-zero z-score when today matches the baseline", () => {
    const r = computeReadiness({
      dayKey: TARGET,
      dailies: [...baselineDailies(), daily("2026-06-15", 50, 48)],
      sleeps: [],
    });
    expect(r.hrvZScore).toBeGreaterThan(-1);
    expect(r.hrvZScore).toBeLessThan(1);
  });

  it("withholds the z-score when the baseline is too sparse (<7 samples)", () => {
    const sparse = baselineDailies().slice(0, 4);
    const r = computeReadiness({
      dayKey: TARGET,
      dailies: [...sparse, daily("2026-06-15", 38)],
      sleeps: [],
    });
    expect(r.hrvZScore).toBeUndefined();
  });

  it("is noSignal when nothing is computable", () => {
    expect(computeReadiness({ dayKey: TARGET, dailies: [], sleeps: [] })).toEqual(
      { noSignal: true },
    );
  });

  it("prefers the night that started the evening before the session", () => {
    const r = computeReadiness({
      dayKey: TARGET,
      dailies: [],
      sleeps: [sleep("2026-06-13", 8, 90), sleep("2026-06-14", 6, 70)],
    });
    expect(r.sleepHours).toBe(6); // the 06-14 night, not the older 06-13 one
    expect(r.sleepQuality).toBe("ok");
  });

  it("ignores naps", () => {
    const nap: SleepRecord = {
      metadata: { start_time: "2026-06-14T14:00:00.000Z", is_nap: true },
      sleep_durations_data: { asleep: { duration_asleep_state_seconds: 3600 } },
    };
    const r = computeReadiness({
      dayKey: TARGET,
      dailies: [],
      sleeps: [nap],
    });
    expect(r.sleepHours).toBeUndefined();
    expect(r.noSignal).toBe(true);
  });

  it("does not count today's reading in its own baseline", () => {
    // Baseline all 50ms; today 38ms. If today leaked into the baseline the
    // z-score would be pulled toward 0 — assert it stays strongly negative.
    const r = computeReadiness({
      dayKey: TARGET,
      dailies: [...baselineDailies(), daily("2026-06-15", 38)],
      sleeps: [],
    });
    expect(r.hrvZScore).toBeLessThan(-1.5);
  });
});
