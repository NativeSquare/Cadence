/**
 * 10K plan orchestration — a thin wrapper over the distance-agnostic `buildPlan`,
 * binding the 10K engine spec (`TEN_K_SPEC`) and 10K defaults. Sibling of
 * `buildFiveKPlan.ts`. Production (`engine/generatePlan.ts`) and the admin
 * Playground call `buildTenKPlan`; the shared core lives in `buildPlan.ts`.
 *
 * ⚠️ NO convex runtime imports (bundled into the admin browser). See `buildPlan.ts`.
 */

import { buildPlan, type BuildPlanInputs, type PlanTrace } from "./buildPlan";
import { TEN_K_SPEC } from "./tenK";

const DEFAULT_10K_DISTANCE_M = 10000;

/** Build the full traced 10K plan. */
export function buildTenKPlan(inputs: BuildPlanInputs): PlanTrace {
  return buildPlan(
    TEN_K_SPEC,
    { format: "10k", defaultDistanceMeters: DEFAULT_10K_DISTANCE_M },
    inputs,
  );
}
