/**
 * Type definitions for Plan Screen components
 * Reference: cadence-full-v9.jsx PLAN array (lines 76-84)
 */

/**
 * Session intensity level determines the visual color
 */
export type SessionIntensity = "key" | "high" | "low" | "rest";

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
  /** Current streak in days */
  streak: number;
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
