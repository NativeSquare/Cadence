/**
 * Plan Screen Components
 *
 * This module exports all components for the Plan/Today tab.
 * Reference: cadence-full-v9.jsx TodayTab component (lines 119-244)
 */

export { PlanScreen } from "./PlanScreen";
export { DateHeader } from "./DateHeader";
export { CalendarStrip } from "./CalendarStrip";
export { TodayCard } from "./TodayCard";
export { SessionPreview } from "./SessionPreview";
export { WeekStatsRow } from "./WeekStatsRow";

// Types
export type { SessionData, PlanData, SessionIntensity } from "./types";
export { DAYS, DATES, TODAY_INDEX } from "./types";

// Utilities
export { getSessionColor, getGreeting, formatDate, formatShortDate } from "./utils";

// Mock data
export { MOCK_PLAN_DATA, MOCK_SESSIONS, MOCK_COACH_MESSAGE } from "./mock-data";

// Hooks
export { useStream } from "./use-stream";
