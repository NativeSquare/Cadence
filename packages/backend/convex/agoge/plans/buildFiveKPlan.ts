/**
 * 5K plan orchestration — a thin wrapper over the distance-agnostic `buildPlan`,
 * binding the 5K engine spec (`FIVE_K_SPEC`) and 5K defaults. Production
 * (`engine/generatePlan.ts`) and the admin Playground import `buildFiveKPlan` and
 * the trace types from here; the shared core lives in `buildPlan.ts`.
 *
 * ⚠️ NO convex runtime imports (bundled into the admin browser). See `buildPlan.ts`.
 */

import {
  buildPlan,
  type BuildPlanInputs,
  expandPhases,
  type PlanTrace,
  preTaperSplit,
  TAPER_VOLUME_FACTOR,
} from "./buildPlan";
import { FIVE_K_SPEC } from "./fiveK";

const DEFAULT_5K_DISTANCE_M = 5000;

// Backward-compatible re-exports — existing importers (generator, simulator,
// tests, admin) use these names.
export { expandPhases, TAPER_VOLUME_FACTOR };
export type {
  BuildPlanInputs as BuildFiveKPlanInputs,
  DropReason,
  PlanTrace as FiveKPlanTrace,
  TracedSession,
  TracedWeek,
} from "./buildPlan";

/** @deprecated use `preTaperSplit` from `buildPlan` — kept for import stability. */
export const fiveKPreTaperSplit = preTaperSplit;

/** Build the full traced 5K plan. */
export function buildFiveKPlan(inputs: BuildPlanInputs): PlanTrace {
  return buildPlan(
    FIVE_K_SPEC,
    { format: "5k", defaultDistanceMeters: DEFAULT_5K_DISTANCE_M },
    inputs,
  );
}
