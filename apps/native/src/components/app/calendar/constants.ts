/**
 * Constants for Calendar Tab
 */

import { SESSION_TYPE_COLORS } from "@/lib/design-tokens";
import type { CalSessionType, PhaseName } from "./types";

export const SESSION_COLORS: Record<CalSessionType, string> = SESSION_TYPE_COLORS;

export const SESSION_LABELS: Record<CalSessionType, string> = {
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

