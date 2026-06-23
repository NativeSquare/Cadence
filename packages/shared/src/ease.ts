import type { Workout as WorkoutStructure } from "@nativesquare/agoge";
import { summarizeStructure } from "./workout-summary";

/**
 * The single, shared definition of what the post-session "ease" does to a hard
 * session. Both the Engine mutation (`engine/interventions.applyEase`) and the
 * white-box preview shown in the Mark Done sheet derive from this one function,
 * so the preview can never drift from the mutation it previews.
 *
 * Easing keeps time-on-feet and collapses the structure to a single easy step at
 * RPE 3 — intensity drops, volume holds. Pure: no Convex deps, trivially tested.
 */

/** Effort the eased session is run at — a single easy continuous step. */
export const EASE_RPE = 3;

export type EasedSummary = {
  /** Held time-on-feet in seconds, or 0 when the original had no computable duration. */
  durationSec: number;
  /** Held distance in metres, or 0 when the original had no computable distance. */
  distanceM: number;
};

export type EasedWorkout = {
  type: "easy";
  name: string;
  structure: WorkoutStructure;
  /**
   * The *intended held* volume, for display. Deliberately NOT recomputed by
   * summarising `structure`: an eased step is distance-anchored with an RPE
   * target, which `summarizeStructure` can't convert back to minutes — it would
   * report `durationSec = 0` and drop the very "same time on feet" anchor the
   * preview leans on. So we report what the ease held, here, at the source.
   */
  summary: EasedSummary;
};

/** Nearest 5-minute bucket, floored at 20 minutes — matches Daniels' easy-run sense. */
function round5min(seconds: number): number {
  const min = Math.max(20, Math.round(seconds / 60));
  return Math.round(min / 5) * 5 * 60;
}

function easyName(locale: "en" | "fr", durationSec: number): string {
  const min = Math.round(durationSec / 60);
  return locale === "fr" ? `Facile ${min} min` : `Easy ${min} min`;
}

/** Time-on-feet fallback for a session that has neither computable duration nor distance. */
const FALLBACK_DURATION_SEC = 30 * 60;

/**
 * Compute the eased form of a workout structure: a single easy step at RPE 3,
 * distance-anchored when the original distance is known, otherwise time-anchored
 * on the held (5-min-rounded) duration.
 *
 * `summary` reports `0` for either dimension the original couldn't compute — the
 * caller renders a type-only contrast in that case rather than inventing numbers.
 * `structure` is always valid (falls back to a 30-min easy run) so the mutation
 * never produces an empty prescription.
 */
export function buildEasedWorkout(
  structure: WorkoutStructure,
  locale: "en" | "fr",
): EasedWorkout {
  const original = summarizeStructure(structure);
  const heldDuration =
    original.durationSeconds > 0 ? round5min(original.durationSeconds) : 0;
  const heldDistance =
    original.distanceMeters > 0 ? Math.round(original.distanceMeters) : 0;

  // The mutated step must be valid even when nothing was computable.
  const stepDuration =
    heldDistance > 0
      ? ({ type: "distance", meters: heldDistance } as const)
      : ({
          type: "time",
          seconds: heldDuration > 0 ? heldDuration : FALLBACK_DURATION_SEC,
        } as const);

  const nameDuration = heldDuration > 0 ? heldDuration : FALLBACK_DURATION_SEC;

  const easedStructure: WorkoutStructure = {
    schema_version: 1,
    discipline: "endurance",
    sport: "run",
    blocks: [
      {
        kind: "step",
        intent: "work",
        duration: stepDuration,
        target: { type: "rpe", value: EASE_RPE },
      },
    ],
  };

  return {
    type: "easy",
    name: easyName(locale, nameDuration),
    structure: easedStructure,
    summary: { durationSec: heldDuration, distanceM: heldDistance },
  };
}
