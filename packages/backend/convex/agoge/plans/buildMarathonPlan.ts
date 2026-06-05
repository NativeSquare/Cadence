/**
 * Marathon (42,195 km) plan orchestration — a thin wrapper over the
 * distance-agnostic `buildPlan`, binding the marathon engine spec
 * (`MARATHON_SPEC`) and marathon defaults. Sibling of `buildFiveKPlan.ts` /
 * `buildTenKPlan.ts` / `buildHalfMarathonPlan.ts`. Production
 * (`engine/generatePlan.ts`) calls `buildMarathonPlan`; the shared core lives in
 * `buildPlan.ts`.
 *
 * The marathon's structural divergences (6-week build = 3 début + 3 fin, 3-week
 * affûtage with two lead weeks, endurance longue with AS42 blocks, 3-session
 * floor) live in `MARATHON_PLAYBOOK` + the engine extensions it drives — here we
 * only pass `buildWeeksCap: 6` so `preTaperSplit` allows the longer build.
 *
 * ⚠️ NO convex runtime imports (bundled into the admin browser). See `buildPlan.ts`.
 */

import { buildPlan, type BuildPlanInputs, type PlanTrace } from "./buildPlan";
import { MARATHON_SPEC } from "./marathon";

const DEFAULT_MARATHON_DISTANCE_M = 42195;

/** Build the full traced marathon plan. */
export function buildMarathonPlan(inputs: BuildPlanInputs): PlanTrace {
  return buildPlan(
    MARATHON_SPEC,
    {
      format: "marathon",
      defaultDistanceMeters: DEFAULT_MARATHON_DISTANCE_M,
      buildWeeksCap: 6,
    },
    inputs,
  );
}
