/**
 * Soma ↔ Cadence adapter.
 *
 * Single entry point for every translation between Soma's Terra-based schema
 * and Cadence's flat domain shapes.
 *
 *   import { fromSoma, toSoma, type CadenceActivity } from "<path>/soma/adapter";
 *   const activity = fromSoma.activity(somaActivity);
 *   const workout = toSoma.plannedWorkout(plannedSession);
 */

export * as fromSoma from "./fromSoma";
export * as toSoma from "./toSoma";

export type {
  CadenceActivity,
  CadenceDailyBiometrics,
  CadencePlannedWorkoutInput,
  CadencePlannedWorkoutStructureSegment,
  SessionType,
} from "./types";

export { TERRA_ACTIVITY_TYPES } from "./types";
