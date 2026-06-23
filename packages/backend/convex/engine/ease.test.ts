/**
 * Pure-function tests for the shared ease core. This is the single definition of
 * what the post-session ease does — both `applyEase` (the Engine mutation) and
 * the white-box before/after preview in the Mark Done sheet derive from it, so
 * pinning its behaviour here pins both.
 *
 * No Convex deps — runs with vitest. To run: `pnpm vitest` from the backend package.
 */

import type { Workout as WorkoutStructure } from "@nativesquare/agoge";
import { describe, expect, it } from "vitest";

import { EASE_RPE, buildEasedWorkout } from "@packages/shared/ease";

/** A 6×800m interval session: 10' w/u, 6×(800m @ ~3:20/km + 90s jog), 10' c/d. */
const intervals: WorkoutStructure = {
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
      count: 6,
      children: [
        {
          kind: "step",
          intent: "work",
          duration: { type: "distance", meters: 800 },
          // 5.0 m/s midpoint → 160s per 800m rep.
          target: { type: "pace_range", min_speed_mps: 5, max_speed_mps: 5 },
        },
        {
          kind: "step",
          intent: "recovery",
          duration: { type: "time", seconds: 90 },
          target: { type: "rpe", value: 2 },
        },
      ],
    },
    {
      kind: "step",
      intent: "cooldown",
      duration: { type: "time", seconds: 600 },
      target: { type: "rpe", value: 3 },
    },
  ],
};

/** A 25-minute steady tempo by feel: one time step, no pace target. */
const timeOnly: WorkoutStructure = {
  schema_version: 1,
  discipline: "endurance",
  sport: "run",
  blocks: [
    {
      kind: "step",
      intent: "work",
      duration: { type: "time", seconds: 1500 },
      target: { type: "rpe", value: 7 },
    },
  ],
};

/** An open-ended session: nothing computable (no distance, no time). */
const openOnly: WorkoutStructure = {
  schema_version: 1,
  discipline: "endurance",
  sport: "run",
  blocks: [{ kind: "step", intent: "work", duration: { type: "open" } }],
};

describe("buildEasedWorkout", () => {
  it("collapses a structured session to one easy RPE step", () => {
    const eased = buildEasedWorkout(intervals, "en");
    expect(eased.type).toBe("easy");
    expect(eased.structure.blocks).toHaveLength(1);
    const [step] = eased.structure.blocks;
    expect(step).toMatchObject({
      kind: "step",
      intent: "work",
      target: { type: "rpe", value: EASE_RPE },
    });
  });

  it("holds time-on-feet (5-min-rounded) and distance for the preview", () => {
    // 600 + 6×(160 + 90) + 600 = 2700s on feet; 6×800 = 4800m.
    const eased = buildEasedWorkout(intervals, "en");
    expect(eased.summary).toEqual({ durationSec: 2700, distanceM: 4800 });
  });

  it("anchors the eased step on distance when distance is known", () => {
    const [step] = buildEasedWorkout(intervals, "en").structure.blocks;
    expect(step).toMatchObject({ duration: { type: "distance", meters: 4800 } });
  });

  it("anchors on time when only duration is known", () => {
    const eased = buildEasedWorkout(timeOnly, "en");
    expect(eased.summary).toEqual({ durationSec: 1500, distanceM: 0 });
    const [step] = eased.structure.blocks;
    expect(step).toMatchObject({ duration: { type: "time", seconds: 1500 } });
  });

  it("reports zero volume but still builds a valid 30-min fallback when nothing is computable", () => {
    const eased = buildEasedWorkout(openOnly, "en");
    // Zeroed summary → the UI shows a type-only contrast, not invented numbers.
    expect(eased.summary).toEqual({ durationSec: 0, distanceM: 0 });
    // The mutation must never produce an empty prescription.
    const [step] = eased.structure.blocks;
    expect(step).toMatchObject({ duration: { type: "time", seconds: 1800 } });
  });

  it("names the eased run in the runner's locale", () => {
    expect(buildEasedWorkout(intervals, "en").name).toBe("Easy 45 min");
    expect(buildEasedWorkout(intervals, "fr").name).toBe("Facile 45 min");
  });
});
