/**
 * Marathon adapter over the distance-agnostic `planEngine`. Binds the marathon
 * playbook (`MARATHON_PLAYBOOK`) and marathon race pace (`marathonPaceMps`).
 * Sibling of `fiveK.ts` / `tenK.ts` / `halfMarathon.ts`.
 */

import { marathonPaceMps } from "../periodization";
import { MARATHON_PLAYBOOK } from "./marathonPlaybook";
import type { PlanEngineSpec } from "./planEngine";

export const MARATHON_SPEC: PlanEngineSpec = {
  playbook: MARATHON_PLAYBOOK,
  racePaceMps: marathonPaceMps,
};
