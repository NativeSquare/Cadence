/**
 * Type definitions for Calendar Tab components
 */

import type { WorkoutCategory } from "@packages/shared/workout-categories";

/** Training phase name for color lookup */
export type PhaseName =
  | "base"
  | "build1"
  | "build2"
  | "taper"
  | "race"
  | "recovery"
  | "foundation"
  | "development"
  | "consolidation";

/** View toggle state */
export type CalendarView = "month" | "week";

/** A single calendar workout */
export interface CalWorkout {
  workoutId: string;
  type: WorkoutCategory;
  label: string;
  km: string;
  dur: string;
  done: boolean;
  today?: boolean;
}

/** A training phase with date range */
export interface Phase {
  name: string;
  key: PhaseName;
  start: string;
  end: string;
  color: string;
}

/** A single day cell in the calendar grid */
export interface CalendarDay {
  day: number;
  key: string;
  outside: boolean;
}

/** A contiguous phase segment within a week row */
export interface PhaseSegment {
  phase: Phase;
  start: number;
  end: number;
  isPhaseStart: boolean;
}

/** Week date info for week view */
export interface WeekDate {
  year: number;
  month: number;
  day: number;
  key: string;
  dayName: string;
}
