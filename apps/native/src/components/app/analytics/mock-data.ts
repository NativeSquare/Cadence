/**
 * Mock data for Analytics screen development
 * Reference: cadence-full-v9.jsx lines 402-405
 */

/** Weekly volume data (km) for 10 weeks */
export const MOCK_VOLUME_DATA = [32, 38, 41, 36, 45, 48, 52, 44, 57, 24.7];

/** Weekly average pace (min/km) for 10 weeks */
export const MOCK_PACE_DATA = [5.45, 5.38, 5.30, 5.32, 5.22, 5.18, 5.15, 5.20, 5.10, 5.12];

/** Daily KM for current week (Mon-Sun) */
export const MOCK_WEEKLY_KM = [8.5, 6.0, 10.2, 7.0, 0, 9.0, 16.5];

/** Daily zone split for current week */
export const MOCK_ZONE_DATA = [
  { z2: 30, z3: 0, z4: 70 },   // Mon - mostly hard
  { z2: 100, z3: 0, z4: 0 },  // Tue - easy
  { z2: 20, z3: 10, z4: 70 }, // Wed - tempo
  { z2: 100, z3: 0, z4: 0 },  // Thu - easy
  { z2: 0, z3: 0, z4: 0 },    // Fri - rest
  { z2: 30, z3: 40, z4: 30 }, // Sat - mixed
  { z2: 70, z3: 20, z4: 10 }, // Sun - long run
];

/** Multi-week zone data for COROS-style evolution */
export const MOCK_MULTI_WEEK_ZONE_DATA: WeekZoneData[] = [
  { week: 1, z2: 65, z3: 20, z4: 15 },
  { week: 2, z2: 60, z3: 22, z4: 18 },
  { week: 3, z2: 55, z3: 25, z4: 20 },
  { week: 4, z2: 58, z3: 22, z4: 20 },
  { week: 5, z2: 52, z3: 28, z4: 20 },
  { week: 6, z2: 50, z3: 25, z4: 25 },
  { week: 7, z2: 48, z3: 27, z4: 25 },
  { week: 8, z2: 55, z3: 20, z4: 25 },
  { week: 9, z2: 60, z3: 25, z4: 15 },
  { week: 10, z2: 70, z3: 20, z4: 10 },
];

/** Day labels */
export const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

/** Week labels for multi-week view */
export const WEEK_LABELS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10"];

/** Current day index (0-6, Sunday = 6) */
export const TODAY_INDEX = 6;

/** Current week number */
export const CURRENT_WEEK = 4;

/** Plan progress data */
export interface PlanWeek {
  week: number;
  completed: boolean;
  current: boolean;
  phase: "build" | "peak" | "taper" | "race";
}

export const PLAN_PROGRESS: PlanWeek[] = [
  { week: 1, completed: true, current: false, phase: "build" },
  { week: 2, completed: true, current: false, phase: "build" },
  { week: 3, completed: true, current: false, phase: "build" },
  { week: 4, completed: true, current: true, phase: "build" },
  { week: 5, completed: false, current: false, phase: "build" },
  { week: 6, completed: false, current: false, phase: "peak" },
  { week: 7, completed: false, current: false, phase: "peak" },
  { week: 8, completed: false, current: false, phase: "peak" },
  { week: 9, completed: false, current: false, phase: "taper" },
  { week: 10, completed: false, current: false, phase: "race" },
];

/** Phase colors matching prototype */
export const PHASE_COLORS = {
  build: "#A8D900", // barHigh
  peak: "#C8FF00",  // lime
  taper: "#5B9EFF", // barRest/blu
  race: "#FF5A5A",  // red
} as const;

/** Stats data */
export const MOCK_STATS = {
  totalDistance: 387,
  totalPlanned: 520,
  sessions: 31,
  sessionsPlanned: 48,
  longestRun: 18.2,
  longestRunWeek: 3,
  avgHR: 148,
  avgHRChange: -4,
};

/** Volume and streak data */
export const MOCK_VOLUME_STATS = {
  currentVolume: 24.7,
  plannedVolume: 57.2,
  percentComplete: 43,
  weekOverWeekChange: 8, // +8%
  streak: 12,
  streakDays: [true, true, true, true, true, false, false], // last 7 days
};

// =============================================================================
// Race Predictions
// =============================================================================

export interface RacePrediction {
  distance: string;
  timeSeconds: number;
  timeFormatted: string;
  pacePerKm: string;
}

export const MOCK_PREDICTIONS: RacePrediction[] = [
  { distance: "5K", timeSeconds: 1062, timeFormatted: "17:42", pacePerKm: "3:32/km" },
  { distance: "10K", timeSeconds: 2210, timeFormatted: "36:50", pacePerKm: "3:41/km" },
  { distance: "Half Marathon", timeSeconds: 4898, timeFormatted: "1:21:38", pacePerKm: "3:53/km" },
  { distance: "Marathon", timeSeconds: 10162, timeFormatted: "2:49:22", pacePerKm: "4:01/km" },
];

export const MOCK_VDOT = 45;

// =============================================================================
// Health Metrics
// =============================================================================

export interface HealthMetric {
  label: string;
  value: number;
  unit?: string;
  subtitle?: string;
  trend?: "improving" | "stable" | "declining";
  dark?: boolean;
}

export const MOCK_HEALTH_METRICS: HealthMetric[] = [
  {
    label: "Resting HR",
    value: 52,
    unit: "bpm",
    subtitle: "-2 bpm this month",
    trend: "improving",
  },
  {
    label: "HRV",
    value: 48,
    unit: "ms",
    subtitle: "+3 ms this month",
    trend: "improving",
    dark: true,
  },
  {
    label: "Sleep Score",
    value: 82,
    subtitle: "Consistent",
    trend: "stable",
  },
  {
    label: "Readiness",
    value: 74,
    subtitle: "Good to train",
    trend: "stable",
    dark: true,
  },
];

// =============================================================================
// Multi-week Zone Data
// =============================================================================

export interface WeekZoneData {
  week: number;
  z2: number;
  z3: number;
  z4: number;
}

// =============================================================================
// Volume Evolution (Strava-style)
// =============================================================================

export interface VolumeWeekDetail {
  week: number;
  volume: number;
  target: number;
  changePercent: number;
}

export const MOCK_VOLUME_EVOLUTION: VolumeWeekDetail[] = [
  { week: 1, volume: 32, target: 30, changePercent: 0 },
  { week: 2, volume: 38, target: 35, changePercent: 18.8 },
  { week: 3, volume: 41, target: 40, changePercent: 7.9 },
  { week: 4, volume: 36, target: 38, changePercent: -12.2 },
  { week: 5, volume: 45, target: 42, changePercent: 25.0 },
  { week: 6, volume: 48, target: 45, changePercent: 6.7 },
  { week: 7, volume: 52, target: 48, changePercent: 8.3 },
  { week: 8, volume: 44, target: 40, changePercent: -15.4 },
  { week: 9, volume: 57, target: 52, changePercent: 29.5 },
  { week: 10, volume: 24.7, target: 55, changePercent: -56.7 },
];
