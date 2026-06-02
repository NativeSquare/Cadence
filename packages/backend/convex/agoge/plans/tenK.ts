/**
 * 10K adapter over the distance-agnostic `planEngine`. Binds the 10K playbook
 * (`TEN_K_PLAYBOOK`) and 10K race pace (`tenKPaceMps`). Sibling of `fiveK.ts`.
 */

import { tenKPaceMps } from "../periodization";
import type { PlanEngineSpec } from "./planEngine";
import { TEN_K_PLAYBOOK } from "./tenKPlaybook";

export const TEN_K_SPEC: PlanEngineSpec = {
  playbook: TEN_K_PLAYBOOK,
  racePaceMps: tenKPaceMps,
};
