/**
 * Type definitions for Session Detail components
 * Reference: cadence-full-v10.jsx PLAN array (lines 95-124)
 */

import type { SessionIntensity } from "../plan/types";
import {
  SESSION_TYPE_COLORS,
  getSessionCategory,
  getZoneColor as getZoneColorFromTokens,
} from "@/lib/design-tokens";

/**
 * Session segment (e.g., warm-up, intervals, cool-down)
 */
export interface SessionSegment {
  /** Segment name (e.g., "Warm Up", "Tempo Block 1") */
  name: string;
  /** Distance in kilometers */
  km: string;
  /** Target pace (e.g., "6:00") */
  pace: string;
  /** Training zone (e.g., "Z2", "Z4", "Z4-5") */
  zone: string;
}

/**
 * Extended session data with segments and coach note
 * Extends SessionData from plan/types
 */
export interface SessionDetailData {
  /** Session type (e.g., "Tempo", "Easy Run", "Intervals") */
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
  /** Array of workout segments */
  segments: SessionSegment[];
  /** Coach's personalized note */
  coachNote?: string;
}

/**
 * Zone height mapping for intensity profile chart
 * Reference: cadence-full-v10.jsx line 160
 */
export const ZONE_HEIGHT: Record<string, number> = {
  Z1: 0.15,
  Z2: 0.35,
  "Z2-3": 0.5,
  Z3: 0.6,
  "Z3-4": 0.75,
  Z4: 0.85,
  "Z4-5": 0.95,
  Z5: 1.0,
};

/**
 * Get zone color based on zone string.
 * Uses analytics-style ZONE_COLORS from design-tokens for consistency.
 * @param zone Zone string (e.g., "Z4", "Z2-3")
 * @returns Hex color string
 */
export function getZoneColor(zone: string): string {
  return getZoneColorFromTokens(zone);
}

/**
 * Get session color based on session type category.
 * Uses the centralized 4-color scheme for consistency across the app.
 */
export function getSessionColor(
  _done: boolean,
  _intensity: SessionIntensity,
  sessionType?: string
): string {
  if (sessionType) {
    return SESSION_TYPE_COLORS[getSessionCategory(sessionType)];
  }
  if (_intensity === "rest") return SESSION_TYPE_COLORS.easy;
  if (_intensity === "key") return SESSION_TYPE_COLORS.long;
  if (_intensity === "high") return SESSION_TYPE_COLORS.specific;
  if (_intensity === "low") return SESSION_TYPE_COLORS.easy;
  return "rgba(255,255,255,0.25)";
}
