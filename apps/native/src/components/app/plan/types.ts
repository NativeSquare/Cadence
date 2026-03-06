/**
 * Type definitions for Plan Screen components
 * Reference: cadence-full-v9.jsx PLAN array (lines 76-84)
 */

/**
 * Session intensity level determines the visual color
 */
export type SessionIntensity = "key" | "high" | "low" | "rest";

/**
 * Sync status for sessions recorded on external wearables
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
 * Individual training session data
 */
export interface SessionData {
  /** Session type (e.g., "Tempo", "Easy Run", "Intervals", "Rest", "Long Run") */
  type: string;
  /** Distance in kilometers (or "-" for rest days) */
  km: string;
  /** Duration (e.g., "48min", "1h35", or "-" for rest) */
  dur: string;
  /** Whether the session has been completed */
  done: boolean;
  /** Intensity level determines the accent color */
  intensity: SessionIntensity;
  /** Detailed description of the workout */
  desc: string;
  /** Training zone (e.g., "Z4", "Z2", "Z4-5", or "-" for rest) */
  zone: string;
  /** Whether this is today's session */
  today?: boolean;
  /** Sync state for wearable-recorded sessions */
  syncStatus?: SyncStatus;
  /** Source wearable or service (e.g., "garmin", "apple_watch", "strava") */
  syncSource?: string;
  /** Actual recorded values after sync completes */
  syncedData?: SyncedData;
}

/**
 * Primary race goal data for the countdown card
 */
export interface RaceGoalData {
  /** Display name for the race (e.g., "NYC Half Marathon") */
  raceName: string;
  /** Race distance label (e.g., "Half Marathon", "Marathon") */
  raceDistance: string;
  /** Race date as Unix timestamp in ms */
  raceDate: number;
  /** Target finish time formatted (e.g., "1:45:00") */
  targetTime?: string;
  /** Current week number within the training plan */
  currentWeek: number;
  /** Total weeks in the training plan */
  totalWeeks: number;
  /** Current training phase (e.g., "Build", "Peak", "Taper") */
  phase: string;
}

/**
 * Overall plan data for the week
 */
export interface PlanData {
  /** User's display name */
  userName: string;
  /** Current week number in the training plan */
  weekNumber: number;
  /** Current training phase (e.g., "Build", "Peak", "Taper") */
  phase: string;
  /** Array of 7 sessions for the week (Mon-Sun) */
  sessions: SessionData[];
  /** Kilometers completed this week */
  volumeCompleted: number;
  /** Total planned kilometers for the week */
  volumePlanned: number;
  /** Formatted time completed this week (e.g., "2h 45m") */
  timeCompleted: string;
  /** Current streak in days */
  streak: number;
  /** Which of the last 7 days had activity (Mon-Sun for current week) */
  streakDays: boolean[];
  /** Week-over-week volume change percentage */
  weekOverWeekChange: number;
  /** Coach message for today */
  coachMessage: string;
}

/**
 * Day labels for the calendar strip
 */
export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/**
 * Date numbers for the calendar strip (example week)
 */
export const DATES = [17, 18, 19, 20, 21, 22, 23] as const;

/**
 * Index of today in the week (0-6, Thursday = 3)
 */
export const TODAY_INDEX = 3;
