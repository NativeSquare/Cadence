/**
 * Type definitions for Plan Screen components
 */

import type { Workout as WorkoutStructure } from "@nativesquare/agoge";
import type { WorkoutType } from "@nativesquare/agoge/schema";

/**
 * Workout intensity level determines the visual color
 */
export type WorkoutIntensity = "key" | "high" | "low" | "rest";

/**
 * Sync status for workouts recorded on external wearables
 */
export type SyncStatus = "planned" | "exported" | "syncing" | "synced" | "failed";

/**
 * Actual data recorded by the wearable after sync
 */
export interface SyncedData {
  /** Actual distance recorded */
  km: string;
  /** Actual duration recorded */
  dur: string;
}

/**
 * Individual training workout data
 */
export interface WorkoutData {
  /** Agoge workout ID (present when loaded from DB) */
  workoutId?: string;
  /** User-facing workout name (e.g., "Tempo", "Easy Run", "Marathon Pace Run").
   * Historically called `type` for legacy reasons — it is the *name*, not the
   * taxonomic kind. Use `kind` for the agoge-defined taxonomy. */
  type: string;
  /** Agoge workout type (`easy` | `threshold` | `intervals` | `long` |
   * `race_pace` | `recovery` | `race` | `test`). Drives the type label and
   * accent color on the home card. */
  kind?: WorkoutType;
  /** Distance in kilometers (or "-" for rest days) */
  km: string;
  /** Duration (e.g., "48min", "1h35", or "-" for rest) */
  dur: string;
  /** Whether the workout has been completed */
  done: boolean;
  /** Persisted `status === "missed"` — the user explicitly marked the
   * workout missed. Drives the red "Missed" badge. */
  missed?: boolean;
  /** Derived: planned date has passed without any user action (still
   * `status === "planned"`). Surfaces an amber "Needs feedback" prompt so
   * the user can triage it as done or missed. */
  needsFeedback?: boolean;
  /** Intensity level determines the accent color */
  intensity: WorkoutIntensity;
  /** Detailed description of the workout */
  desc: string;
  /** Training zone (e.g., "Z4", "Z2", "Z4-5", or "-" for rest) */
  zone: string;
  /** Whether this is today's workout */
  today?: boolean;
  /** Parsed workout structure (warmup/work/recovery/cooldown blocks). Null
   * when the workout has no structured plan — card falls back to volume. */
  structure?: WorkoutStructure | null;
  /** Sync state for wearable-recorded workouts */
  syncStatus?: SyncStatus;
  /** Source wearable or service (e.g., "garmin", "apple_watch", "strava") */
  syncSource?: string;
  /** Actual recorded values after sync completes */
  syncedData?: SyncedData;
  /** True when an active (non-reverted) coach intervention has modified this
   *  workout. Surfaces a "coach adjusted" badge in place of the sync badge. */
  coachAdjusted?: boolean;
}

/**
 * Primary race goal data for the countdown card.
 *
 * Plan-derived fields (currentWeek/totalWeeks/phase/targetTime) are optional —
 * they require a training plan and goal attached to the race. The card renders
 * countdown + name/distance unconditionally and only adds the progress section
 * when those fields are supplied.
 */
export interface RaceGoalData {
  /** Display name for the race (e.g., "NYC Half Marathon") */
  raceName: string;
  /** Race distance label (e.g., "21.1 km", "Marathon") */
  raceDistance: string;
  /** Race date as Unix timestamp in ms */
  raceDate: number;
  /** Race priority; surfaced as a small pill on the card */
  priority?: "A" | "B" | "C";
  /** Target finish time formatted (e.g., "1:45:00") */
  targetTime?: string;
  /** Current week number within the training plan */
  currentWeek?: number;
  /** Total weeks in the training plan */
  totalWeeks?: number;
  /** Current training phase (e.g., "Build", "Peak", "Taper") */
  phase?: string;
}

/**
 * Day labels for the calendar strip
 */
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
