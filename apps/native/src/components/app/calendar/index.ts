/**
 * Calendar Screen Components
 *
 * This module exports all components for the Calendar tab.
 * Reference: cadence-calendar-final.jsx CalendarTab component
 */

export { CalendarScreen } from "./CalendarScreen";
export { MonthView } from "./MonthView";
export { WeekView } from "./WeekView";
export { PhaseTimeline } from "./PhaseTimeline";
export { WeekRow } from "./WeekRow";
export { PhaseBand } from "./PhaseBand";
export { SessionCard } from "./SessionCard";
export { WatermarkIcon } from "./WatermarkIcon";
export { DiagonalStripes } from "./DiagonalStripes";
export { TodayMarker } from "./TodayMarker";
export { Legend } from "./Legend";
export { DayHeaders } from "./DayHeaders";

// Types
export type {
  CalSession,
  CalSessionType,
  Phase,
  PhaseName,
  CalendarView,
  CalendarDay,
  PhaseSegment,
  WeekDate,
} from "./types";

// Constants
export {
  SESSION_COLORS,
  SESSION_LABELS,
  PHASE_COLORS,
  CAL_SESSIONS,
  PHASES,
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
