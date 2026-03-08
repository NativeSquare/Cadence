/**
 * Utility functions for Plan Screen components
 * Reference: cadence-full-v9.jsx bc() function (line 86)
 */

import {
  COLORS,
  LIGHT_THEME,
  SESSION_TYPE_COLORS,
  getSessionCategory,
} from "@/lib/design-tokens";
import type { Id } from "@packages/backend/convex/_generated/dataModel";
import type {
  SessionData,
  SessionIntensity,
  SyncStatus,
  SyncedData,
  RaceGoalData,
} from "./types";

export interface BackendSession {
  _id: Id<"plannedSessions">;
  weekNumber: number;
  sessionTypeDisplay: string;
  targetDurationDisplay: string;
  targetDurationSeconds?: number;
  targetDistanceMeters?: number;
  description: string;
  scheduledDate: number;
  isKeySession: boolean;
  isRestDay: boolean;
  effortLevel?: number;
  effortDisplay: string;
  targetPaceDisplay?: string;
  structureDisplay?: string;
  status: string;
  dayOfWeekShort: string;
}

export interface BackendWeekPlan {
  weekNumber: number;
  phaseName: string;
  volumeKm: number;
  isRecoveryWeek: boolean;
  weekLabel?: string;
}

export interface BackendPlan {
  _id: Id<"trainingPlans">;
  name: string;
  goalType: string;
  targetEvent?: string;
  targetDate?: number;
  targetTime?: number;
  startDate: number;
  durationWeeks: number;
  currentWeek: number;
  coachSummary: string;
  weeklyPlan: BackendWeekPlan[];
}

/**
 * Get the accent color for a session based on its type category.
 * Done sessions keep their type color (no longer overridden to lime)
 * so the 4-color scheme stays consistent across the app.
 */
export function getSessionColor(session: SessionData): string {
  const category = getSessionCategory(session.type);
  return SESSION_TYPE_COLORS[category];
}

/**
 * Get the greeting based on the current time of day
 * @returns "Morning", "Afternoon", or "Evening"
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

/**
 * Format a date to display format (e.g., "Thursday, Feb 20")
 * @param date - Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date = new Date()): string {
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  const dayNum = date.getDate();

  return `${dayName}, ${monthName} ${dayNum}`;
}

/**
 * Get short date format (e.g., "Thu, Feb 20")
 * @param date - Date to format
 * @returns Short formatted date string
 */
export function formatShortDate(date: Date = new Date()): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  const dayNum = date.getDate();

  return `${dayName}, ${monthName} ${dayNum}`;
}

/**
 * Capitalize first letter of a string
 */
function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}

/**
 * Get the display color for a sync status
 */
export function getSyncStatusColor(status: SyncStatus): string {
  switch (status) {
    case "exported":
      return LIGHT_THEME.wText;
    case "syncing":
      return COLORS.ora;
    case "synced":
      return COLORS.lime;
    case "failed":
      return COLORS.red;
    default:
      return LIGHT_THEME.wMute;
  }
}

/**
 * Get the display label for a sync status
 */
export function getSyncStatusLabel(
  status: SyncStatus,
  syncSource?: string,
  syncedData?: SyncedData
): string {
  const source = syncSource ? capitalize(syncSource) : "Watch";
  switch (status) {
    case "exported":
      return `Exported to ${source}`;
    case "syncing":
      return "Syncing\u2026";
    case "synced":
      return syncedData
        ? `Synced \u00B7 ${syncedData.km} km recorded`
        : "Synced";
    case "failed":
      return "Sync failed \u00B7 Retry";
    default:
      return "";
  }
}

// =============================================================================
// Backend → Frontend Transforms
// =============================================================================

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function deriveIntensity(session: BackendSession): SessionIntensity {
  if (session.isRestDay) return "rest";
  if (session.isKeySession) return "key";
  if (session.effortLevel != null && session.effortLevel >= 7) return "high";
  return "low";
}

function computeKm(session: BackendSession): string {
  if (session.isRestDay) return "-";
  if (session.targetDistanceMeters != null) {
    return (session.targetDistanceMeters / 1000).toFixed(1);
  }
  return "-";
}

export function toSessionData(
  session: BackendSession,
  today: Date
): SessionData {
  return {
    sessionId: session._id,
    type: session.sessionTypeDisplay,
    km: computeKm(session),
    dur: session.targetDurationDisplay,
    done: session.status === "completed",
    intensity: deriveIntensity(session),
    desc: session.description,
    zone: session.effortDisplay,
    today: isSameDay(new Date(session.scheduledDate), today),
  };
}

export function buildSessionsByDate(
  sessions: BackendSession[],
  today: Date
): Record<string, SessionData> {
  const result: Record<string, SessionData> = {};
  for (const s of sessions) {
    const date = new Date(s.scheduledDate);
    result[toDateKey(date)] = toSessionData(s, today);
  }
  return result;
}

const GOAL_DISPLAY: Record<string, string> = {
  "5k": "5K",
  "10k": "10K",
  half_marathon: "Half Marathon",
  marathon: "Marathon",
  base_building: "Base Building",
};

function formatTargetTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function buildRaceGoal(plan: BackendPlan): RaceGoalData | null {
  if (!plan.targetDate) return null;

  const currentWeekItem = plan.weeklyPlan.find(
    (w) => w.weekNumber === plan.currentWeek
  );

  return {
    raceName: plan.targetEvent ?? plan.name,
    raceDistance: GOAL_DISPLAY[plan.goalType] ?? plan.goalType,
    raceDate: plan.targetDate,
    targetTime: plan.targetTime ? formatTargetTime(plan.targetTime) : undefined,
    currentWeek: plan.currentWeek,
    totalWeeks: plan.durationWeeks,
    phase: currentWeekItem?.phaseName ?? "Build",
  };
}

export function computeWeekInsights(
  sessions: BackendSession[],
  plan: BackendPlan
): {
  volumeCompleted: number;
  volumePlanned: number;
  timeCompleted: string;
  avgPace: string;
  currentWeekSessions: SessionData[];
} {
  const today = new Date();
  const currentWeekSessions = sessions.filter(
    (s) => s.weekNumber === plan.currentWeek
  );

  const weekPlan = plan.weeklyPlan.find(
    (w) => w.weekNumber === plan.currentWeek
  );
  const volumePlanned = weekPlan?.volumeKm ?? 0;

  const completedSessions = currentWeekSessions.filter(
    (s) => s.status === "completed"
  );
  let totalDistanceM = 0;
  let totalDurationS = 0;
  for (const s of completedSessions) {
    totalDistanceM += s.targetDistanceMeters ?? 0;
    totalDurationS += s.targetDurationSeconds ?? 0;
  }
  const volumeCompleted = Math.round((totalDistanceM / 1000) * 10) / 10;

  const hours = Math.floor(totalDurationS / 3600);
  const mins = Math.round((totalDurationS % 3600) / 60);
  const timeCompleted =
    hours > 0 ? `${hours}h ${mins}m` : mins > 0 ? `${mins}m` : "0m";

  let avgPace = "-:--";
  if (totalDistanceM > 0 && totalDurationS > 0) {
    const paceSecsPerKm = totalDurationS / (totalDistanceM / 1000);
    const paceMin = Math.floor(paceSecsPerKm / 60);
    const paceSec = Math.round(paceSecsPerKm % 60);
    avgPace = `${paceMin}:${String(paceSec).padStart(2, "0")}`;
  }

  const mapped = currentWeekSessions.map((s) => toSessionData(s, today));

  return {
    volumeCompleted,
    volumePlanned,
    timeCompleted,
    avgPace,
    currentWeekSessions: mapped,
  };
}
