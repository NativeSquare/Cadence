/**
 * 5K adapter over the distance-agnostic `planEngine`. Binds the 5K playbook
 * (`FIVE_K_PLAYBOOK`) and 5K race pace (`fiveKPaceMps`), and re-exports the
 * engine's entry points under their historical 5K names so production
 * (`buildFiveKPlan.ts`) and the tests keep their import paths.
 *
 * All the coaching data lives in `fiveKPlaybook.ts`; all the structural logic
 * lives in `planEngine.ts`. This file is the thin seam between them. 10K is the
 * sibling `tenK.ts`.
 */

import { fiveKPaceMps } from "../periodization";
import { FIVE_K_PLAYBOOK } from "./fiveKPlaybook";
import {
  lastHardDow,
  type MicrocycleArgs,
  microcycle,
  type PlanEngineSpec,
  type PlanGrid,
  planGrid,
  selectBankIndex,
  type TaperSessionsArgs,
  taperDaysForRaceDow as taperDaysForRaceDowGeneric,
  taperSessions,
} from "./planEngine";

export const FIVE_K_SPEC: PlanEngineSpec = {
  playbook: FIVE_K_PLAYBOOK,
  racePaceMps: fiveKPaceMps,
};

// Backward-compatible names + signatures (the spec is bound to 5K here).
export type Microcycle5KArgs = MicrocycleArgs;
export type TaperSessions5KArgs = TaperSessionsArgs;
export type FiveKGrid = PlanGrid;

export const microcycle5K = (args: MicrocycleArgs) =>
  microcycle(FIVE_K_SPEC, args);

export const taperSessions5K = (args: TaperSessionsArgs) =>
  taperSessions(FIVE_K_SPEC, args);

export const fiveKGrid = (planStartYmd: string, raceYmd: string) =>
  planGrid(FIVE_K_SPEC, planStartYmd, raceYmd);

export const taperDaysForRaceDow = (raceDow: number) =>
  taperDaysForRaceDowGeneric(FIVE_K_SPEC, raceDow);

export { lastHardDow, selectBankIndex };
export type { IntensityAnchor } from "./planEngine";
