/**
 * Constants for Calendar Tab
 */

import { WORKOUT_CATEGORY_COLORS } from "@/lib/design-tokens";
import type { CalWorkoutType, Phase, PhaseName } from "./types";

export const WORKOUT_COLORS: Record<CalWorkoutType, string> = WORKOUT_CATEGORY_COLORS;

export const WORKOUT_LABELS: Record<CalWorkoutType, string> = {
  easy: "Easy",
  specific: "Specific",
  long: "Long Run",
  race: "Race",
};

export const PHASE_COLORS: Record<PhaseName, string> = {
  base: "#6B9E3A",
  build1: "#E8A030",
  build2: "#E87830",
  taper: "#5B9EFF",
  race: "#FF5A5A",
  recovery: "#8BC34A",
  foundation: "#26A69A",
  development: "#AB47BC",
  consolidation: "#FF7043",
};

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const DAY_HEADERS = [
  "Mo",
  "Tu",
  "We",
  "Th",
  "Fr",
  "Sa",
  "Su",
] as const;

export const DAY_HEADERS_FULL = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

const _now = new Date();
export const TODAY_KEY = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}-${String(_now.getDate()).padStart(2, "0")}`;

/**
 * Default training phases placeholder.
 * Replaced at runtime when a real plan is loaded via buildPhasesFromPlan().
 */
export const PHASES: Phase[] = [
  { name: "Base", key: "base", start: "2025-01-06", end: "2025-02-02", color: PHASE_COLORS.base },
  { name: "Build 1", key: "build1", start: "2025-02-03", end: "2025-03-02", color: PHASE_COLORS.build1 },
  { name: "Build 2", key: "build2", start: "2025-03-03", end: "2025-03-30", color: PHASE_COLORS.build2 },
  { name: "Taper", key: "taper", start: "2025-03-31", end: "2025-04-13", color: PHASE_COLORS.taper },
  { name: "Race", key: "race", start: "2025-04-14", end: "2025-04-20", color: PHASE_COLORS.race },
];

