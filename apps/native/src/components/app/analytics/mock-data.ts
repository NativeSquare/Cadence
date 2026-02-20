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

/** Day labels */
export const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

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
