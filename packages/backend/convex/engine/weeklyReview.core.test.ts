/**
 * Unit tests for the weekly-review pure core. No Convex deps — runs under
 * vitest, the guard-rail on the deterministic coaching policy.
 */

import type { Workout as WorkoutStructure } from "@nativesquare/agoge";
import type { WorkoutType } from "@nativesquare/agoge/schema";
import { describe, expect, it } from "vitest";

import {
  AUTO_MISS_GRACE_MS,
  type ClosedSession,
  evaluateWeeklyReview,
  type RawClosedWorkout,
  reconcileClosedWeek,
  SCALE_TIER1,
  SCALE_TIER2,
  scaleStructure,
  sessionRole,
  type UpcomingSession,
} from "./weeklyReview.core";

let nextId = 0;
function closed(
  type: WorkoutType,
  status: "completed" | "missed",
  plannedKm: number,
): ClosedSession {
  return { workoutId: `c${nextId++}`, type, status, plannedKm };
}
function upcoming(type: WorkoutType, plannedKm: number): UpcomingSession {
  return { workoutId: `u${nextId++}`, type, plannedKm };
}

describe("sessionRole", () => {
  it("treats long + quality as key, easy/recovery as filler", () => {
    expect(sessionRole("long")).toBe("key");
    expect(sessionRole("threshold")).toBe("key");
    expect(sessionRole("intervals")).toBe("key");
    expect(sessionRole("race_pace")).toBe("key");
    expect(sessionRole("test")).toBe("key");
    expect(sessionRole("easy")).toBe("filler");
    expect(sessionRole("recovery")).toBe("filler");
  });
});

describe("evaluateWeeklyReview", () => {
  it("Tier 0 — week completed, no change, no drops", () => {
    const d = evaluateWeeklyReview({
      closed: [
        closed("long", "completed", 10),
        closed("threshold", "completed", 6),
        closed("easy", "completed", 5),
      ],
      upcoming: [upcoming("long", 11), upcoming("easy", 5)],
      prevWeekAdjusted: false,
    });
    expect(d.tier).toBe(0);
    expect(d.scaleFactor).toBe(1);
    expect(d.dropWorkoutIds).toEqual([]);
    expect(d.signals.completionRatio).toBe(1);
  });

  it("Tier 1 — one missed key session scales the upcoming week, no drops", () => {
    const d = evaluateWeeklyReview({
      closed: [
        closed("long", "completed", 10),
        closed("threshold", "missed", 6),
        closed("easy", "completed", 5),
      ],
      upcoming: [upcoming("long", 11), upcoming("easy", 5)],
      prevWeekAdjusted: false,
    });
    expect(d.tier).toBe(1);
    expect(d.scaleFactor).toBe(SCALE_TIER1);
    expect(d.dropWorkoutIds).toEqual([]);
    expect(d.signals.keyMissed).toBe(1);
  });

  it("Tier 1 — low completion (between thresholds) with no key miss", () => {
    // 7/10 completed = 0.7 → below TIER1_COMPLETION (0.85), above TIER2 (0.6).
    const d = evaluateWeeklyReview({
      closed: [
        closed("long", "completed", 7),
        closed("easy", "missed", 3),
      ],
      upcoming: [upcoming("long", 8)],
      prevWeekAdjusted: false,
    });
    expect(d.tier).toBe(1);
    expect(d.signals.keyMissed).toBe(0);
  });

  it("Tier 2 — two missed key sessions deload + drop filler", () => {
    const d = evaluateWeeklyReview({
      closed: [
        closed("long", "missed", 10),
        closed("threshold", "missed", 6),
        closed("easy", "completed", 5),
      ],
      upcoming: [
        upcoming("long", 11),
        upcoming("threshold", 6),
        upcoming("easy", 5),
        upcoming("recovery", 4),
      ],
      prevWeekAdjusted: false,
    });
    expect(d.tier).toBe(2);
    expect(d.scaleFactor).toBe(SCALE_TIER2);
    // Only the two filler sessions are dropped; key work is kept (scaled).
    expect(d.dropWorkoutIds).toHaveLength(2);
  });

  it("Tier 2 — very low completion even without 2 key misses", () => {
    // 4/14 = 0.29 → below TIER2_COMPLETION.
    const d = evaluateWeeklyReview({
      closed: [
        closed("long", "missed", 10),
        closed("easy", "completed", 4),
      ],
      upcoming: [upcoming("long", 11), upcoming("easy", 5)],
      prevWeekAdjusted: false,
    });
    expect(d.tier).toBe(2);
  });

  it("streak — a slip (Tier 1) escalates to Tier 2 after a prior down week", () => {
    const base = {
      closed: [
        closed("long", "completed", 10),
        closed("threshold", "missed", 6),
        closed("easy", "completed", 5),
      ],
      upcoming: [upcoming("long", 11), upcoming("easy", 5)],
    };
    const noStreak = evaluateWeeklyReview({ ...base, prevWeekAdjusted: false });
    const withStreak = evaluateWeeklyReview({ ...base, prevWeekAdjusted: true });
    expect(noStreak.tier).toBe(1);
    expect(withStreak.tier).toBe(2);
    expect(withStreak.signals.streakEscalated).toBe(true);
    expect(withStreak.signals.baseTier).toBe(1);
  });

  it("streak — a clean week (Tier 0) is never escalated", () => {
    const d = evaluateWeeklyReview({
      closed: [closed("long", "completed", 10)],
      upcoming: [upcoming("long", 11)],
      prevWeekAdjusted: true,
    });
    expect(d.tier).toBe(0);
  });

  it("empty closed week is treated as on-track (never act on absence)", () => {
    const d = evaluateWeeklyReview({
      closed: [],
      upcoming: [upcoming("long", 11)],
      prevWeekAdjusted: false,
    });
    expect(d.tier).toBe(0);
    expect(d.signals.completionRatio).toBe(1);
  });
});

describe("reconcileClosedWeek (auto-miss + grace)", () => {
  const NOW = 1_000_000_000_000;
  function raw(
    type: RawClosedWorkout["type"],
    status: string,
    agoMs: number,
    plannedKm = 5,
  ): RawClosedWorkout {
    return {
      workoutId: `w${nextId++}`,
      type,
      status,
      plannedDateMs: NOW - agoMs,
      plannedKm,
    };
  }
  const HOUR = 60 * 60 * 1000;

  it("auto-misses a planned session past the grace window", () => {
    const { closed, autoMissedWorkoutIds } = reconcileClosedWeek(
      [raw("threshold", "planned", AUTO_MISS_GRACE_MS + HOUR)],
      NOW,
    );
    expect(autoMissedWorkoutIds).toHaveLength(1);
    expect(closed[0]?.status).toBe("missed");
  });

  it("holds a Sunday session logged Monday as pending (within grace)", () => {
    // ~18h ago = a Sunday-noon session seen by a Monday-06:00 review.
    const { closed, autoMissedWorkoutIds } = reconcileClosedWeek(
      [raw("long", "planned", 18 * HOUR)],
      NOW,
    );
    expect(autoMissedWorkoutIds).toEqual([]);
    expect(closed).toEqual([]); // invisible to the assessment, not a miss
  });

  it("never auto-misses or counts the race", () => {
    const { closed, autoMissedWorkoutIds } = reconcileClosedWeek(
      [raw("race", "planned", AUTO_MISS_GRACE_MS + 100 * HOUR)],
      NOW,
    );
    expect(autoMissedWorkoutIds).toEqual([]);
    expect(closed).toEqual([]);
  });

  it("carries completed and explicitly-missed sessions through verbatim", () => {
    const { closed, autoMissedWorkoutIds } = reconcileClosedWeek(
      [
        raw("long", "completed", 30 * HOUR),
        raw("threshold", "missed", 30 * HOUR),
      ],
      NOW,
    );
    expect(autoMissedWorkoutIds).toEqual([]); // already missed, not newly auto-missed
    expect(closed.map((c) => c.status).sort()).toEqual(["completed", "missed"]);
  });

  it("a within-grace pending session does not drag completion down", () => {
    // One completed key + one within-grace pending → completion 100%, Tier 0.
    const { closed } = reconcileClosedWeek(
      [
        raw("long", "completed", 50 * HOUR, 10),
        raw("threshold", "planned", 10 * HOUR, 6),
      ],
      NOW,
    );
    const d = evaluateWeeklyReview({
      closed,
      upcoming: [],
      prevWeekAdjusted: false,
    });
    expect(d.signals.completionRatio).toBe(1);
    expect(d.tier).toBe(0);
  });
});

describe("scaleStructure", () => {
  const structure: WorkoutStructure = {
    schema_version: 1,
    discipline: "endurance",
    sport: "run",
    blocks: [
      {
        kind: "step",
        intent: "warmup",
        duration: { type: "time", seconds: 600 },
        target: { type: "rpe", value: 3 },
      },
      {
        kind: "repeat",
        count: 4,
        children: [
          {
            kind: "step",
            intent: "work",
            duration: { type: "distance", meters: 1000 },
            target: { type: "rpe", value: 9 },
          },
          {
            kind: "step",
            intent: "recovery",
            duration: { type: "time", seconds: 120 },
            target: { type: "rpe", value: 2 },
          },
        ],
      },
    ],
  };

  it("scales leaf durations but keeps shape, count, and targets", () => {
    const scaled = scaleStructure(structure, 0.5);
    const warmup = scaled.blocks[0];
    expect(warmup.kind).toBe("step");
    if (warmup.kind === "step" && warmup.duration.type === "time") {
      expect(warmup.duration.seconds).toBe(300);
    }
    const repeat = scaled.blocks[1];
    expect(repeat.kind).toBe("repeat");
    if (repeat.kind === "repeat") {
      expect(repeat.count).toBe(4); // rep count untouched
      const work = repeat.children[0];
      if (work.kind === "step" && work.duration.type === "distance") {
        expect(work.duration.meters).toBe(500);
        expect(work.target).toEqual({ type: "rpe", value: 9 }); // target untouched
      }
    }
  });

  it("factor 1 is a no-op on values", () => {
    const scaled = scaleStructure(structure, 1);
    expect(scaled).toEqual(structure);
  });
});
