/**
 * Plan - Cadence's thin wrapper over the Agoge training component.
 *
 * Cadence does not own training tables. Agoge (`components.agoge`) is the
 * authority for athletes, zones, events, plans, blocks, workouts, and
 * workoutTemplates. This module provides:
 *  - auth-wrapped passthrough queries the frontend consumes
 *  - thin mutation wrappers the AI coach tool-calls into
 *  - plan generation (the "intelligence" that writes rich plans into agoge)
 *  - on-demand compute for derived athlete state (ATL/CTL/TSB, volumes)
 *
 * Whatever agoge doesn't model (coaching prefs, justification audit trails)
 * either lives in agoge's freeform fields (`plan.notes`, `workout.description`,
 * `CompletedWorkout.feelNotes`) or is derived from chat history.
 */

import { Agoge } from "@nativesquare/agoge";
import { components } from "../_generated/api";

export const agoge = new Agoge(components.agoge);
