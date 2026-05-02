/**
 * Calendar Screen Components
 *
 * This module exports all components for the Calendar tab.
 */

export { CalendarScreen } from "./CalendarScreen";
export { MonthView } from "./MonthView";
export { WeekView } from "./WeekView";
export { PhaseTimeline } from "./PhaseTimeline";
export { WeekRow } from "./WeekRow";
export { PhaseBand } from "./PhaseBand";
export { WorkoutCard } from "./WorkoutCard";
export { WatermarkIcon } from "./WatermarkIcon";
export { DiagonalStripes } from "./DiagonalStripes";
export { TodayMarker } from "./TodayMarker";
export { Legend } from "./Legend";
export { DayHeaders } from "./DayHeaders";
// Types
export type {
  CalWorkout,
  CalWorkoutType,
  Phase,
  PhaseName,
  CalendarView,
  CalendarDay,
  PhaseSegment,
  WeekDate,
} from "./types";

// Constants
export {
  WORKOUT_COLORS,
  WORKOUT_LABELS,
  PHASE_COLORS,
  TODAY_KEY,
  MONTH_NAMES,
  DAY_HEADERS,
} from "./constants";

// Helpers
export {
  blendWithBg,
  buildWeeks,
  buildPhaseLookup,
  computePhaseSegments,
  getWeekDates,
  formatDateKey,
  getDaysInMonth,
  getFirstDayOfMonth,
} from "./helpers";
