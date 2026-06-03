/**
 * Half-marathon adapter over the distance-agnostic `planEngine`. Binds the
 * half-marathon playbook (`HALF_MARATHON_PLAYBOOK`) and half-marathon race pace
 * (`halfMarathonPaceMps`). Sibling of `fiveK.ts` / `tenK.ts`.
 */

import { halfMarathonPaceMps } from "../periodization";
import { HALF_MARATHON_PLAYBOOK } from "./halfMarathonPlaybook";
import type { PlanEngineSpec } from "./planEngine";

export const HALF_MARATHON_SPEC: PlanEngineSpec = {
  playbook: HALF_MARATHON_PLAYBOOK,
  racePaceMps: halfMarathonPaceMps,
};
