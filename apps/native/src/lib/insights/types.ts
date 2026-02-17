// =============================================================================
// Data Insights Types
// =============================================================================
// TypeScript interfaces for the Data Insights Screen.
// Used to compute and display emotional insights from activity data.

/**
 * Raw activity from Soma/Terra schema.
 * Only includes fields needed for insight computation.
 */
export interface SomaActivity {
  _id: string;
  metadata: {
    start_time: string; // ISO-8601
    end_time: string; // ISO-8601
    name?: string; // "Easy Run", "Long Run", etc.
    city?: string; // "Paris", "London", etc.
  };
  distance_data?: {
    summary?: {
      distance_meters?: number;
      elevation?: {
        gain_actual_meters?: number;
      };
    };
  };
  movement_data?: {
    avg_pace_minutes_per_kilometer?: number;
  };
  heart_rate_data?: {
    summary?: {
      avg_hr_bpm?: number;
    };
  };
}

/**
 * Computed insights from activities.
 * All metrics are derived from a single O(n) pass through the activity array.
 */
export interface ActivityInsights {
  // Counts
  totalRuns: number;

  // Date bounds
  firstRunDate: Date | null;
  lastRunDate: Date | null;
  daysSinceLastRun: number;
  journeyWeeks: number; // weeks between first and last run

  // Volume metrics
  totalDistanceKm: number;
  totalElevationM: number;
  avgDistanceKm: number;
  avgWeeklyKm: number; // totalDistanceKm / journeyWeeks

  // Performance metrics
  fastestPace: number | null; // min/km (lower is faster)
  fastestPaceRun: SomaActivity | null;
  longestDistanceKm: number;
  longestRun: SomaActivity | null;

  // Patterns
  activeWeeksLast12: number; // Weeks with ≥1 run in last 84 days
  topCity: string | null;
  topCityCount: number;

  // Data quality flags
  hasHeartRateData: boolean; // >50% of runs have HR
  hasPaceData: boolean; // >50% of runs have pace
  hasElevationData: boolean; // >30% of runs have elevation
  hasGeoData: boolean; // any run has city
}

/**
 * Line types for insight display.
 * Maps to different visual styles (color, weight).
 */
export type InsightLineType = "sys" | "dat" | "warn" | "pos" | "res" | "sp";

/**
 * Single insight line for display (terminal-style).
 */
export interface InsightLine {
  text: string;
  type: InsightLineType;
}

/**
 * Accent color type for insight cards.
 */
export type AccentColor = "lime" | "white" | "orange";

/**
 * Insight card for card-based display (prototype style).
 * Each card has a big fact, supporting line, and optional coach note.
 */
export interface InsightCard {
  /** Large accent-colored number or fact (e.g., "March 14, 2022", "847 runs") */
  big: string;
  /** Supporting line explaining the big fact */
  sub: string;
  /** Optional coach note with personal touch */
  note: string | null;
  /** Accent color for the big text */
  accent: AccentColor;
}

/**
 * Confidence level based on data quality.
 */
export type ConfidenceLevel = "HIGH" | "MODERATE" | "LOW";
