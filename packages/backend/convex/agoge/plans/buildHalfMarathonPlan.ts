/**
 * Half-marathon (semi / 21,1 km) plan orchestration — a thin wrapper over the
 * distance-agnostic `buildPlan`, binding the half-marathon engine spec
 * (`HALF_MARATHON_SPEC`) and half-marathon defaults. Sibling of
 * `buildFiveKPlan.ts` / `buildTenKPlan.ts`. Production
 * (`engine/generatePlan.ts`) calls `buildHalfMarathonPlan`; the shared core
 * lives in `buildPlan.ts`.
 *
 * ⚠️ NO convex runtime imports (bundled into the admin browser). See `buildPlan.ts`.
 */

import { buildPlan, type BuildPlanInputs, type PlanTrace } from "./buildPlan";
import { HALF_MARATHON_SPEC } from "./halfMarathon";

const DEFAULT_HALF_MARATHON_DISTANCE_M = 21097;

/** Build the full traced half-marathon plan. */
export function buildHalfMarathonPlan(inputs: BuildPlanInputs): PlanTrace {
  return buildPlan(
    HALF_MARATHON_SPEC,
    {
      format: "half_marathon",
      defaultDistanceMeters: DEFAULT_HALF_MARATHON_DISTANCE_M,
    },
    inputs,
  );
}
