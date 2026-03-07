/**
 * Mock data for Analytics screen development
 * Reference: cadence-full-v9.jsx lines 402-405
 */

import type { TimeFrame as TF } from "@/components/shared/time-frame-selector";

// =============================================================================
// Race Objectives
// =============================================================================

export type RaceObjective = "5k" | "10k" | "half" | "marathon";

export interface ObjectiveOption {
  id: RaceObjective;
  label: string;
  shortLabel: string;
  planWeeks: number;
}

export const OBJECTIVE_OPTIONS: ObjectiveOption[] = [
  { id: "5k", label: "5K", shortLabel: "5K", planWeeks: 8 },
  { id: "10k", label: "10K", shortLabel: "10K", planWeeks: 10 },
  { id: "half", label: "Half Marathon", shortLabel: "Half", planWeeks: 10 },
  { id: "marathon", label: "Marathon", shortLabel: "Marathon", planWeeks: 16 },
];

export interface RadarTargetProfile {
  label: string;
  value: number;
}

/**
 * Ideal runner profiles per race objective.
 * These represent the target polygon on the dual-radar chart.
 * Order matches the 6 radar axes: Endurance, Speed, Recovery, Consistency, Injury Risk, Race Ready
 */
export const TARGET_PROFILES: Record<RaceObjective, RadarTargetProfile[]> = {
  "5k": [
    { label: "Endurance", value: 60 },
    { label: "Speed", value: 90 },
    { label: "Recovery", value: 70 },
    { label: "Consistency", value: 80 },
    { label: "Injury Risk", value: 75 },
    { label: "Race Ready", value: 85 },
  ],
  "10k": [
    { label: "Endurance", value: 75 },
    { label: "Speed", value: 80 },
    { label: "Recovery", value: 65 },
    { label: "Consistency", value: 80 },
    { label: "Injury Risk", value: 70 },
    { label: "Race Ready", value: 80 },
  ],
  half: [
    { label: "Endurance", value: 85 },
    { label: "Speed", value: 70 },
    { label: "Recovery", value: 70 },
    { label: "Consistency", value: 85 },
    { label: "Injury Risk", value: 65 },
    { label: "Race Ready", value: 80 },
  ],
  marathon: [
    { label: "Endurance", value: 95 },
    { label: "Speed", value: 60 },
    { label: "Recovery", value: 80 },
    { label: "Consistency", value: 90 },
    { label: "Injury Risk", value: 60 },
    { label: "Race Ready", value: 75 },
  ],
};

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
// Prediction Trend (weekly predicted times over training plan)
// =============================================================================

export interface PredictionTrendPoint {
  week: number;
  timeSeconds: number;
}

/**
 * Weekly predicted race times showing improvement over the training plan.
 * Each objective has its own trend data.
 */
export const MOCK_PREDICTION_TRENDS: Record<RaceObjective, PredictionTrendPoint[]> = {
  "5k": [
    { week: 1, timeSeconds: 1140 },
    { week: 2, timeSeconds: 1128 },
    { week: 3, timeSeconds: 1110 },
    { week: 4, timeSeconds: 1098 },
    { week: 5, timeSeconds: 1092 },
    { week: 6, timeSeconds: 1080 },
    { week: 7, timeSeconds: 1074 },
    { week: 8, timeSeconds: 1062 },
  ],
  "10k": [
    { week: 1, timeSeconds: 2380 },
    { week: 2, timeSeconds: 2350 },
    { week: 3, timeSeconds: 2320 },
    { week: 4, timeSeconds: 2300 },
    { week: 5, timeSeconds: 2275 },
    { week: 6, timeSeconds: 2250 },
    { week: 7, timeSeconds: 2230 },
    { week: 8, timeSeconds: 2220 },
    { week: 9, timeSeconds: 2215 },
    { week: 10, timeSeconds: 2210 },
  ],
  half: [
    { week: 1, timeSeconds: 5280 },
    { week: 2, timeSeconds: 5200 },
    { week: 3, timeSeconds: 5140 },
    { week: 4, timeSeconds: 5080 },
    { week: 5, timeSeconds: 5020 },
    { week: 6, timeSeconds: 4980 },
    { week: 7, timeSeconds: 4950 },
    { week: 8, timeSeconds: 4930 },
    { week: 9, timeSeconds: 4910 },
    { week: 10, timeSeconds: 4898 },
  ],
  marathon: [
    { week: 1, timeSeconds: 11100 },
    { week: 2, timeSeconds: 10980 },
    { week: 3, timeSeconds: 10860 },
    { week: 4, timeSeconds: 10740 },
    { week: 5, timeSeconds: 10620 },
    { week: 6, timeSeconds: 10500 },
    { week: 7, timeSeconds: 10440 },
    { week: 8, timeSeconds: 10380 },
    { week: 9, timeSeconds: 10320 },
    { week: 10, timeSeconds: 10260 },
    { week: 11, timeSeconds: 10220 },
    { week: 12, timeSeconds: 10200 },
    { week: 13, timeSeconds: 10185 },
    { week: 14, timeSeconds: 10175 },
    { week: 15, timeSeconds: 10168 },
    { week: 16, timeSeconds: 10162 },
  ],
};

// =============================================================================
// Health Metrics
// =============================================================================

export type HealthMetricKey =
  | "restingHr"
  | "hrv"
  | "sleepScore"
  | "weight"
  | "calories"
  | "spo2";

export interface HealthMetric {
  metricKey: HealthMetricKey;
  label: string;
  value: number;
  unit?: string;
  subtitle?: string;
  trend?: "improving" | "stable" | "declining";
}

export interface HealthMetricStyle {
  color: string;
  colorDim: string;
}

export const HEALTH_METRIC_STYLES: Record<HealthMetricKey, HealthMetricStyle> = {
  restingHr: { color: "#FF5A5A", colorDim: "rgba(255,90,90,0.12)" },
  hrv: { color: "#A855F7", colorDim: "rgba(168,85,247,0.12)" },
  sleepScore: { color: "#5B9EFF", colorDim: "rgba(91,158,255,0.12)" },
  weight: { color: "#14B8A6", colorDim: "rgba(20,184,166,0.12)" },
  calories: { color: "#FF9500", colorDim: "rgba(255,149,0,0.12)" },
  spo2: { color: "#38BDF8", colorDim: "rgba(56,189,248,0.12)" },
};

export const MOCK_HEALTH_METRICS: HealthMetric[] = [
  {
    metricKey: "restingHr",
    label: "Resting HR",
    value: 52,
    unit: "bpm",
    subtitle: "-2 bpm this month",
    trend: "improving",
  },
  {
    metricKey: "hrv",
    label: "HRV",
    value: 48,
    unit: "ms",
    subtitle: "+3 ms this month",
    trend: "improving",
  },
  {
    metricKey: "sleepScore",
    label: "Sleep Score",
    value: 82,
    subtitle: "Consistent",
    trend: "stable",
  },
  {
    metricKey: "weight",
    label: "Body Weight",
    value: 72,
    unit: "kg",
    subtitle: "-0.5 kg this month",
    trend: "improving",
  },
  {
    metricKey: "calories",
    label: "Calories",
    value: 2450,
    unit: "kcal",
    subtitle: "Daily avg",
    trend: "stable",
  },
  {
    metricKey: "spo2",
    label: "SpO2",
    value: 97,
    unit: "%",
    subtitle: "Normal range",
    trend: "stable",
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
// Zone Breakdown (Strava-style horizontal bars)
// =============================================================================

export interface ZoneBreakdownData {
  zone: string;
  label: string;
  percentage: number;
  bpmRange: string;
  color: string;
}

export type { TimeFrame } from "@/components/shared/time-frame-selector";

/** @deprecated Use TimeFrame from shared/time-frame-selector instead */
export type ZonePeriod = "7d" | "1mo" | "3mo" | "6mo" | "1yr";

export const MOCK_ZONE_BREAKDOWN: ZoneBreakdownData[] = [
  { zone: "Z5", label: "VO2max", percentage: 2, bpmRange: ">185 bpm", color: "#FF5A5A" },
  { zone: "Z4", label: "Threshold", percentage: 12, bpmRange: "170–184 bpm", color: "#FF9500" },
  { zone: "Z3", label: "Tempo", percentage: 18, bpmRange: "152–169 bpm", color: "#C8FF00" },
  { zone: "Z2", label: "Aerobic", percentage: 52, bpmRange: "135–151 bpm", color: "#A8D900" },
  { zone: "Z1", label: "Easy", percentage: 16, bpmRange: "<134 bpm", color: "#5B9EFF" },
];

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

// =============================================================================
// Volume By Time Frame (bar chart data)
// =============================================================================

export const MOCK_VOLUME_BY_TIMEFRAME: Record<TF, number[]> = {
  "7d": [8.5, 6.0, 10.2, 7.0, 0, 9.0, 16.5],
  "1mo": [36, 45, 48, 52],
  "3mo": [32, 38, 41, 36, 45, 48, 52, 44, 57, 24.7, 40, 46],
  "6mo": [
    28, 30, 32, 34, 29, 36, 38, 35, 41, 39, 36, 42, 45,
    48, 52, 44, 47, 50, 53, 46, 57, 54, 49, 51, 48, 24.7,
  ],
  "1yr": [120, 135, 148, 162, 155, 170, 185, 178, 192, 180, 165, 105],
};

export const VOLUME_X_LABELS: Record<TF, string[]> = {
  "7d": ["M", "T", "W", "T", "F", "S", "S"],
  "1mo": ["W1", "W2", "W3", "W4"],
  "3mo": ["W1", "W2", "W3", "W4", "W5", "W6", "W7", "W8", "W9", "W10", "W11", "W12"],
  "6mo": [
    "", "", "", "Oct", "", "", "", "", "", "", "", "", "Nov",
    "", "", "", "", "", "", "", "", "", "", "", "Dec", "",
  ],
  "1yr": ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"],
};

export const VOLUME_UNIT_LABELS: Record<TF, string> = {
  "7d": "km today",
  "1mo": "km this month",
  "3mo": "km total",
  "6mo": "km total",
  "1yr": "km this year",
};
