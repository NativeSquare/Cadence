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
export { RaceCountdown } from "./RaceCountdown";
export { WeekInsights } from "./WeekInsights";
export { QuickActions } from "./QuickActions";
export { TrainingPulseCard } from "./TrainingPulseCard";
export { RaceUpgradeCTA } from "./RaceUpgradeCTA";

// Types
export type { WorkoutData, RaceGoalData, WorkoutIntensity } from "./types";
export { DAYS } from "./types";

// Utilities
export { getWorkoutColor, mapRaceToGoalData } from "./utils";

