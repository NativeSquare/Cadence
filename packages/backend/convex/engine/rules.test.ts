/**
 * Unit tests for the deterministic coaching rules.
 *
 * These pure checks back both the manual reschedule/swap actions and the Coach's
 * reschedule policy. The `excludeIds` generalization is the crux: a swap must
 * exclude *both* moving workouts from a destination week's tally so it isn't
 * blocked by phantom double-counting. No Convex deps — runs under vitest.
 */

import { describe, expect, it } from "vitest";

import {
  type PlanWorkoutLite,
  checkMaxQualityPerWeek,
  checkWeeklyVolumeCap,
  isoWeekKey,
} from "./rules";

// June 1 2026 is a Monday → Jun 1–7 is one ISO week; May 25–31 the prior one.
const noon = (ymd: string) => `${ymd}T12:00:00.000Z`;
const distStructure = (meters: number) => ({
  sport: "running",
  blocks: [
    { kind: "step", duration: { type: "distance", meters }, target: { type: "none" } },
  ],
});

describe("isoWeekKey", () => {
  it("groups Monday through Sunday into the same week", () => {
    expect(isoWeekKey(noon("2026-06-01"))).toBe(isoWeekKey(noon("2026-06-07")));
  });
  it("rolls over to the next week on the following Monday", () => {
    expect(isoWeekKey(noon("2026-06-07"))).not.toBe(
      isoWeekKey(noon("2026-06-08")),
    );
  });
});

describe("checkMaxQualityPerWeek", () => {
  const quality = (id: string, ymd: string, type: string): PlanWorkoutLite => ({
    _id: id,
    type,
    status: "planned",
    planned: { date: noon(ymd) },
  });

  it("blocks a third quality session in a week (move)", () => {
    const planWorkouts = [
      quality("m", "2026-06-02", "easy"),
      quality("q1", "2026-06-05", "intervals"),
      quality("q2", "2026-06-06", "tempo"),
    ];
    const err = checkMaxQualityPerWeek({
      excludeIds: new Set(["m"]),
      addedType: "threshold",
      proposedDate: noon("2026-06-03"),
      planWorkouts,
    });
    expect(err?.code).toBe("philosophy.max_quality_sessions_per_week");
  });

  it("does not block a same-week swap of two quality sessions (excludes both)", () => {
    const planWorkouts = [
      quality("a", "2026-06-05", "intervals"),
      quality("b", "2026-06-06", "tempo"),
    ];
    const err = checkMaxQualityPerWeek({
      excludeIds: new Set(["a", "b"]),
      addedType: "intervals",
      proposedDate: noon("2026-06-06"),
      planWorkouts,
    });
    expect(err).toBeNull();
  });

  it("ignores non-quality additions", () => {
    expect(
      checkMaxQualityPerWeek({
        excludeIds: new Set(),
        addedType: "easy",
        proposedDate: noon("2026-06-03"),
        planWorkouts: [],
      }),
    ).toBeNull();
  });
});

describe("checkWeeklyVolumeCap", () => {
  const baseline: PlanWorkoutLite[] = [
    {
      _id: "p1",
      type: "easy",
      status: "completed",
      actual: { date: noon("2026-05-27"), distanceMeters: 10_000 },
    },
    {
      _id: "p2",
      type: "easy",
      status: "completed",
      actual: { date: noon("2026-05-28"), distanceMeters: 10_000 },
    },
  ];

  it("blocks a week exceeding 110% of last week's actual distance", () => {
    const planWorkouts: PlanWorkoutLite[] = [
      ...baseline,
      {
        _id: "add",
        type: "easy",
        status: "planned",
        planned: { date: noon("2026-06-03"), structure: distStructure(10_000) },
      },
      {
        _id: "o1",
        type: "easy",
        status: "planned",
        planned: { date: noon("2026-06-05"), structure: distStructure(15_000) },
      },
    ];
    // prev = 20km, cap = 22km, proposed = 15 + 10 = 25km → blocked.
    const err = checkWeeklyVolumeCap({
      excludeIds: new Set(["add"]),
      addedWorkoutId: "add",
      proposedDate: noon("2026-06-03"),
      planWorkouts,
    });
    expect(err?.code).toBe("philosophy.weekly_volume_increase_cap");
  });

  it("allows a week within the 110% cap", () => {
    const planWorkouts: PlanWorkoutLite[] = [
      ...baseline,
      {
        _id: "add",
        type: "easy",
        status: "planned",
        planned: { date: noon("2026-06-03"), structure: distStructure(10_000) },
      },
      {
        _id: "o1",
        type: "easy",
        status: "planned",
        planned: { date: noon("2026-06-05"), structure: distStructure(5_000) },
      },
    ];
    // proposed = 5 + 10 = 15km ≤ 22km cap.
    expect(
      checkWeeklyVolumeCap({
        excludeIds: new Set(["add"]),
        addedWorkoutId: "add",
        proposedDate: noon("2026-06-03"),
        planWorkouts,
      }),
    ).toBeNull();
  });

  it("skips the cap without a real baseline (fewer than 2 prior completions)", () => {
    const planWorkouts: PlanWorkoutLite[] = [
      baseline[0],
      {
        _id: "add",
        type: "easy",
        status: "planned",
        planned: { date: noon("2026-06-03"), structure: distStructure(50_000) },
      },
    ];
    expect(
      checkWeeklyVolumeCap({
        excludeIds: new Set(["add"]),
        addedWorkoutId: "add",
        proposedDate: noon("2026-06-03"),
        planWorkouts,
      }),
    ).toBeNull();
  });
});
