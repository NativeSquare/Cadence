/**
 * Inference Engine for Current State (Story 5.4, 4.6)
 *
 * PURE CALCULATION MODULE - Does NOT write to database.
 * Returns CurrentStateCalculation with raw values + confidence + inferredFrom.
 * The Runner module is responsible for wrapping with full provenance and storing.
 *
 * Story 4.6: Refactored to use Soma component for activity/daily data.
 *
 * Reference: architecture-backend-v2.md#Module-2-Inference-Engine
 */

import type { Doc, Id } from "../_generated/dataModel";
import type { QueryCtx } from "../_generated/server";
import { components } from "../_generated/api";
import {
  type InferenceActivity,
  type InferenceDaily,
  type SomaActivity,
  type SomaDaily,
  type SomaBody,
  transformSomaActivity,
  transformSomaDaily,
  transformSomaBody,
  mergeInferenceDaily,
} from "./somaAdapter";

// =============================================================================
// Types (AC: 5, 6)
// =============================================================================

/**
 * Represents a single inferred value with metadata for provenance.
 * The Runner module will wrap this into FieldValue with full provenance.
 */
export interface InferredValue<T> {
  value: T;
  /** Confidence score 0-1, how reliable is this calculation */
  confidence: number;
  /** Data sources used, e.g., ["activities.last28days", "dailySummaries.last7days"] */
  inferredFrom: string[];
}

/**
 * Training load trend direction
 */
export type TrainingLoadTrend = "building" | "maintaining" | "declining" | "erratic";

/**
 * Injury risk level
 */
export type InjuryRiskLevel = "low" | "moderate" | "elevated" | "high";

/**
 * Overtraining risk level
 */
export type OvertrainingRisk = "none" | "watch" | "caution" | "high";

/**
 * Raw calculation output from the inference engine.
 * Contains values + confidence + sources for each metric.
 * The Runner module wraps these with full provenance before storing.
 */
export interface CurrentStateCalculation {
  // Training load (AC: 1)
  acuteTrainingLoad: InferredValue<number>; // ATL (7-day)
  chronicTrainingLoad: InferredValue<number>; // CTL (42-day)
  trainingStressBalance: InferredValue<number>; // TSB = CTL - ATL
  trainingLoadTrend: InferredValue<TrainingLoadTrend>;

  // Readiness
  readinessScore: InferredValue<number>; // 0-100
  readinessFactors: InferredValue<string[]>;

  // Recent patterns (AC: 3)
  last7DaysVolume: InferredValue<number>; // km
  last7DaysRunCount: InferredValue<number>;
  last28DaysVolume: InferredValue<number>; // km
  last28DaysRunCount: InferredValue<number>;
  consistencyScore: InferredValue<number>; // 0-100

  // Risk (AC: 2)
  injuryRiskLevel: InferredValue<InjuryRiskLevel>;
  injuryRiskFactors: InferredValue<string[]>;
  overtrainingRisk: InferredValue<OvertrainingRisk>;
  volumeChangePercent: InferredValue<number>;
  volumeWithinSafeRange: InferredValue<boolean>;

  // Latest biometrics (AC: 4)
  latestRestingHr?: InferredValue<number>;
  latestHrv?: InferredValue<number>;
  latestWeight?: InferredValue<number>;
  latestSleepScore?: InferredValue<number>;

  // Metadata
  calculatedAt: number;
  dataQuality: DataQualityMetrics;
}

/**
 * Data quality metrics for confidence calculations
 */
export interface DataQualityMetrics {
  /** How many activities were analyzed */
  activitiesCount: number;
  /** Age of oldest activity in days */
  oldestActivityDays: number;
  /** How many daily summaries available */
  dailySummariesCount: number;
  /** Overall data quality assessment */
  quality: "high" | "medium" | "low" | "insufficient";
}

// =============================================================================
// Constants
// =============================================================================

/** Decay constant for ATL (7-day EWMA) */
const ATL_DECAY = 2 / (7 + 1);

/** Decay constant for CTL (42-day EWMA) */
const CTL_DECAY = 2 / (42 + 1);

/** Days to look back for activity analysis */
const ACTIVITY_LOOKBACK_DAYS = 60;

/** Days to look back for daily summaries */
const DAILY_SUMMARY_LOOKBACK_DAYS = 7;

/** Milliseconds in a day */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Milliseconds in a week */
const MS_PER_WEEK = 7 * MS_PER_DAY;

// =============================================================================
// Threshold Constants (for maintainability)
// =============================================================================

/** TSB variance threshold for erratic training detection */
const TSB_VARIANCE_ERRATIC_THRESHOLD = 20;

/** TSB change threshold for building/declining trend detection */
const TSB_CHANGE_THRESHOLD = 5;

/** Minimum TSB history length for trend calculation */
const MIN_TSB_HISTORY_FOR_TREND = 7;

/** Minimum TSB history length for high confidence trend */
const MIN_TSB_HISTORY_HIGH_CONFIDENCE = 14;

/** Ramp rate thresholds for injury risk */
const RAMP_RATE_HIGH_RISK = 0.5;
const RAMP_RATE_ELEVATED_RISK = 0.25;
const RAMP_RATE_MODERATE_RISK = 0.1;

/** Safe volume increase threshold (10% rule) */
const SAFE_VOLUME_INCREASE_THRESHOLD = 0.1;

/** Overtraining risk thresholds */
const OVERTRAINING_HIGH_THRESHOLD = 0.5;
const OVERTRAINING_CAUTION_THRESHOLD = 0.3;
const OVERTRAINING_WATCH_THRESHOLD = 0.15;

/** Age threshold for increased injury risk */
const AGE_INCREASED_RISK_THRESHOLD = 45;

/** Data quality thresholds */
const HIGH_QUALITY_ACTIVITY_COUNT = 20;
const HIGH_QUALITY_DAYS = 42;
const MEDIUM_QUALITY_ACTIVITY_COUNT = 10;
const MEDIUM_QUALITY_DAYS = 14;
const MIN_ACTIVITY_COUNT = 3;

/** Freshness confidence decay (days -> confidence) */
const FRESHNESS_CONFIDENCE = {
  today: 1.0,
  yesterday: 0.95,
  within3Days: 0.85,
  within7Days: 0.7,
  older: 0.5,
} as const;

// =============================================================================
// Main Entry Point (AC: 5)
// =============================================================================

/**
 * Calculate current state from historical data.
 *
 * PURE FUNCTION - does NOT write to database.
 * Returns raw calculations with confidence scores.
 * The Runner module is responsible for:
 *   1. Wrapping with full provenance
 *   2. Writing to runners.currentState
 *
 * @param ctx - Query context for database reads and Soma component access
 * @param runnerId - The runner to calculate state for
 * @returns CurrentStateCalculation with all metrics and provenance info
 */
export async function calculateCurrentState(
  ctx: QueryCtx,
  runnerId: Id<"runners">
): Promise<CurrentStateCalculation> {
  // Validate runner exists and get userId for Soma queries
  const runner = await ctx.db.get(runnerId);
  if (!runner) {
    throw new Error(`Runner not found: ${runnerId}`);
  }

  // Soma uses userId as string for queries
  const userId = runner.userId as string;

  // Load historical data from Soma
  const activities = await loadRecentActivities(ctx, userId, ACTIVITY_LOOKBACK_DAYS);
  const dailySummaries = await loadRecentDailySummaries(ctx, userId, DAILY_SUMMARY_LOOKBACK_DAYS);

  // Calculate data quality metrics (affects confidence)
  const dataQuality = calculateDataQuality(activities, dailySummaries);

  // Calculate components (each returns InferredValue with confidence)
  const trainingLoad = calculateTrainingLoad(activities, dataQuality);
  const patterns = calculateRecentPatterns(activities, dataQuality);
  const injuryRisk = calculateInjuryRisk(activities, runner, dataQuality);
  const biometrics = extractLatestBiometrics(dailySummaries);
  const readiness = calculateReadiness(trainingLoad, biometrics, injuryRisk);

  return {
    // Training load
    ...trainingLoad,

    // Readiness
    ...readiness,

    // Patterns
    ...patterns,

    // Risk
    ...injuryRisk,

    // Biometrics
    ...biometrics,

    // Metadata
    calculatedAt: Date.now(),
    dataQuality,
  };
}

// =============================================================================
// Data Loading (Story 4.6: Soma API)
// =============================================================================

/**
 * Load recent activities for a user from Soma component.
 * Transforms Terra schema to flat InferenceActivity format.
 */
async function loadRecentActivities(
  ctx: QueryCtx,
  userId: string,
  days: number
): Promise<InferenceActivity[]> {
  const cutoffDate = new Date(Date.now() - days * MS_PER_DAY);
  const startTime = cutoffDate.toISOString();

  // Query Soma component for activities
  const somaActivities = await ctx.runQuery(
    components.soma.public.listActivities,
    {
      userId,
      startTime,
      order: "asc",
    }
  ) as SomaActivity[];

  // Transform to flat inference format
  return somaActivities.map(transformSomaActivity);
}

/**
 * Load recent daily summaries for a user from Soma component.
 * Combines data from both daily and body endpoints.
 */
async function loadRecentDailySummaries(
  ctx: QueryCtx,
  userId: string,
  days: number
): Promise<InferenceDaily[]> {
  const cutoffDate = new Date(Date.now() - days * MS_PER_DAY);
  const startTime = cutoffDate.toISOString();

  // Query both daily and body endpoints
  const [somaDaily, somaBody] = await Promise.all([
    ctx.runQuery(components.soma.public.listDaily, {
      userId,
      startTime,
      order: "desc",
    }) as Promise<SomaDaily[]>,
    ctx.runQuery(components.soma.public.listBody, {
      userId,
      startTime,
      order: "desc",
    }) as Promise<SomaBody[]>,
  ]);

  // Transform and merge by date
  const dailyByDate = new Map<string, InferenceDaily>();

  // Add daily summaries
  for (const daily of somaDaily) {
    const transformed = transformSomaDaily(daily);
    dailyByDate.set(transformed.date, transformed);
  }

  // Merge body measurements
  for (const body of somaBody) {
    const transformed = transformSomaBody(body);
    if (transformed.date) {
      const existing = dailyByDate.get(transformed.date);
      const merged = mergeInferenceDaily(existing, transformed);
      if (merged) {
        dailyByDate.set(transformed.date, merged);
      }
    }
  }

  // Return sorted by date descending (most recent first)
  return Array.from(dailyByDate.values()).sort((a, b) =>
    b.date.localeCompare(a.date)
  );
}

// =============================================================================
// Data Quality Assessment
// =============================================================================

/**
 * Calculate data quality metrics
 */
function calculateDataQuality(
  activities: InferenceActivity[],
  dailySummaries: InferenceDaily[]
): DataQualityMetrics {
  const activitiesCount = activities.length;
  const dailySummariesCount = dailySummaries.length;

  // Calculate oldest activity age in days
  let oldestActivityDays = 0;
  if (activities.length > 0) {
    const oldestTimestamp = activities[0].startTime; // Already sorted ascending
    oldestActivityDays = Math.floor((Date.now() - oldestTimestamp) / MS_PER_DAY);
  }

  // Determine overall quality
  let quality: "high" | "medium" | "low" | "insufficient";
  if (activitiesCount >= HIGH_QUALITY_ACTIVITY_COUNT && oldestActivityDays >= HIGH_QUALITY_DAYS) {
    quality = "high";
  } else if (activitiesCount >= MEDIUM_QUALITY_ACTIVITY_COUNT && oldestActivityDays >= MEDIUM_QUALITY_DAYS) {
    quality = "medium";
  } else if (activitiesCount >= MIN_ACTIVITY_COUNT) {
    quality = "low";
  } else {
    quality = "insufficient";
  }

  return {
    activitiesCount,
    oldestActivityDays,
    dailySummariesCount,
    quality,
  };
}

// =============================================================================
// Training Load Calculations (AC: 1, 6)
// =============================================================================

interface TrainingLoadResult {
  acuteTrainingLoad: InferredValue<number>;
  chronicTrainingLoad: InferredValue<number>;
  trainingStressBalance: InferredValue<number>;
  trainingLoadTrend: InferredValue<TrainingLoadTrend>;
}

/**
 * Calculate training load metrics using EWMA
 */
function calculateTrainingLoad(
  activities: InferenceActivity[],
  dataQuality: DataQualityMetrics
): TrainingLoadResult {
  const inferredFrom = ["soma.activities.last60days"];

  // Handle insufficient data
  if (activities.length === 0) {
    return {
      acuteTrainingLoad: { value: 0, confidence: 0, inferredFrom },
      chronicTrainingLoad: { value: 0, confidence: 0, inferredFrom },
      trainingStressBalance: { value: 0, confidence: 0, inferredFrom },
      trainingLoadTrend: { value: "maintaining", confidence: 0, inferredFrom },
    };
  }

  // Group activities by day
  const dailyLoads = groupActivitiesByDay(activities);

  // Calculate daily training stress and run EWMA
  let atl = 0;
  let ctl = 0;
  const tsbHistory: number[] = [];

  for (const dayLoad of dailyLoads) {
    const tss = dayLoad.totalTSS;

    // EWMA formula: newValue = previousValue + decay * (todayLoad - previousValue)
    atl = atl + ATL_DECAY * (tss - atl);
    ctl = ctl + CTL_DECAY * (tss - ctl);
    tsbHistory.push(ctl - atl);
  }

  const tsb = ctl - atl;

  // Determine trend from recent TSB changes
  const trend = determineTrend(tsbHistory);

  // Calculate confidence based on data availability
  const atlConfidence = Math.min(1, dataQuality.oldestActivityDays / 7);
  const ctlConfidence = Math.min(1, dataQuality.oldestActivityDays / 42);

  return {
    acuteTrainingLoad: {
      value: Math.round(atl),
      confidence: atlConfidence,
      inferredFrom,
    },
    chronicTrainingLoad: {
      value: Math.round(ctl),
      confidence: ctlConfidence,
      inferredFrom,
    },
    trainingStressBalance: {
      value: Math.round(tsb),
      confidence: ctlConfidence,
      inferredFrom,
    },
    trainingLoadTrend: {
      value: trend,
      confidence: tsbHistory.length >= MIN_TSB_HISTORY_HIGH_CONFIDENCE ? 0.9 : 0.5,
      inferredFrom,
    },
  };
}

interface DayLoad {
  date: string;
  totalTSS: number;
  activities: InferenceActivity[];
}

/**
 * Group activities by day and calculate daily TSS
 */
function groupActivitiesByDay(activities: InferenceActivity[]): DayLoad[] {
  const dayMap = new Map<string, InferenceActivity[]>();

  for (const activity of activities) {
    const date = new Date(activity.startTime).toISOString().split("T")[0];
    const existing = dayMap.get(date) || [];
    existing.push(activity);
    dayMap.set(date, existing);
  }

  // Fill in missing days with zero load
  const result: DayLoad[] = [];
  const sortedDates = Array.from(dayMap.keys()).sort();

  if (sortedDates.length === 0) return result;

  const startTimestamp = new Date(sortedDates[0]).getTime();
  const endTimestamp = Date.now();
  const dayCount = Math.ceil((endTimestamp - startTimestamp) / MS_PER_DAY) + 1;

  for (let i = 0; i < dayCount; i++) {
    const currentTimestamp = startTimestamp + i * MS_PER_DAY;
    const dateStr = new Date(currentTimestamp).toISOString().split("T")[0];
    const dayActivities = dayMap.get(dateStr) || [];
    const totalTSS = dayActivities.reduce((sum, a) => sum + estimateTSS(a), 0);

    result.push({
      date: dateStr,
      totalTSS,
      activities: dayActivities,
    });
  }

  return result;
}

/**
 * Estimate Training Stress Score for an activity
 */
function estimateTSS(activity: InferenceActivity): number {
  // Use provided training load if available
  if (activity.trainingLoad) {
    return activity.trainingLoad;
  }

  const durationHours = (activity.durationSeconds ?? 0) / 3600;
  const intensityFactor = getIntensityFactor(activity);

  // TSS = (duration_hours) * intensity_factor * 100
  return durationHours * intensityFactor * 100;
}

/**
 * Estimate intensity factor from available data
 */
function getIntensityFactor(activity: InferenceActivity): number {
  // Use RPE if available (1-10 scale)
  if (activity.perceivedExertion) {
    return activity.perceivedExertion / 10;
  }

  // Use HR zones if available
  if (activity.avgHeartRate && activity.maxHeartRate && activity.maxHeartRate > 0) {
    const hrPercent = activity.avgHeartRate / activity.maxHeartRate;
    return Math.min(1, hrPercent);
  }

  // Use session type as fallback
  switch (activity.sessionType) {
    case "recovery":
      return 0.5;
    case "easy":
      return 0.6;
    case "long_run":
      return 0.65;
    case "tempo":
      return 0.8;
    case "intervals":
      return 0.9;
    case "race":
      return 1.0;
    default:
      return 0.65; // Default: moderate intensity
  }
}

/**
 * Determine training load trend from TSB history
 */
function determineTrend(tsbHistory: number[]): TrainingLoadTrend {
  if (tsbHistory.length < MIN_TSB_HISTORY_FOR_TREND) return "maintaining";

  const recent = tsbHistory.slice(-MIN_TSB_HISTORY_FOR_TREND);
  const older = tsbHistory.slice(-MIN_TSB_HISTORY_HIGH_CONFIDENCE, -MIN_TSB_HISTORY_FOR_TREND);

  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg =
    older.length > 0
      ? older.reduce((a, b) => a + b, 0) / older.length
      : recentAvg;

  const change = recentAvg - olderAvg;
  const variance = calculateVariance(recent);

  // High variance indicates erratic training
  if (variance > TSB_VARIANCE_ERRATIC_THRESHOLD) return "erratic";

  // TSB changes indicate trend
  // Negative TSB trending more negative = building (loading)
  // Negative TSB trending toward 0 = maintaining/recovering
  // Positive TSB = freshness/declining fitness
  if (change < -TSB_CHANGE_THRESHOLD) return "building";
  if (change > TSB_CHANGE_THRESHOLD) return "declining";
  return "maintaining";
}

/**
 * Calculate variance of an array of numbers
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
}

// =============================================================================
// Injury Risk Calculation (AC: 2, 6)
// =============================================================================

interface InjuryRiskResult {
  injuryRiskLevel: InferredValue<InjuryRiskLevel>;
  injuryRiskFactors: InferredValue<string[]>;
  overtrainingRisk: InferredValue<OvertrainingRisk>;
  volumeChangePercent: InferredValue<number>;
  volumeWithinSafeRange: InferredValue<boolean>;
}

/**
 * Calculate injury risk from activities and runner profile
 */
function calculateInjuryRisk(
  activities: InferenceActivity[],
  runner: Doc<"runners"> | null,
  dataQuality: DataQualityMetrics
): InjuryRiskResult {
  const riskFactors: string[] = [];
  const inferredFrom: string[] = ["soma.activities.last28days"];

  // Calculate weekly volumes
  const currentWeekVolume = getWeekVolume(activities, 0);
  const week1Ago = getWeekVolume(activities, 1);
  const week2Ago = getWeekVolume(activities, 2);
  const week3Ago = getWeekVolume(activities, 3);
  const week4Ago = getWeekVolume(activities, 4);
  const fourWeekAvg = (week1Ago + week2Ago + week3Ago + week4Ago) / 4;

  // Calculate ramp rate (acute:chronic workload ratio approximation)
  const rampRate = fourWeekAvg > 0 ? (currentWeekVolume - fourWeekAvg) / fourWeekAvg : 0;
  const rampRatePercent = Math.round(rampRate * 100);

  // Base risk from ramp rate
  let riskScore = 0;
  if (rampRate > RAMP_RATE_HIGH_RISK) {
    riskScore = 3;
    riskFactors.push("Volume increased >50% this week");
  } else if (rampRate > RAMP_RATE_ELEVATED_RISK) {
    riskScore = 2;
    riskFactors.push("Volume increased 25-50% this week");
  } else if (rampRate > RAMP_RATE_MODERATE_RISK) {
    riskScore = 1;
    riskFactors.push("Volume increased 10-25% this week");
  }

  // Factor: injury history (from runner profile)
  if (runner?.health?.pastInjuries?.length) {
    riskScore += 1;
    riskFactors.push("History of past injuries");
    inferredFrom.push("runner.health.pastInjuries");
  }

  // Factor: current pain (from runner profile)
  if (runner?.health?.currentPain?.length) {
    riskScore += 1.5;
    riskFactors.push("Currently experiencing pain");
    inferredFrom.push("runner.health.currentPain");
  }

  // Factor: age (from runner profile)
  const age = runner?.physical?.age;
  if (age && age > AGE_INCREASED_RISK_THRESHOLD) {
    riskScore += 0.5;
    riskFactors.push(`Age over ${AGE_INCREASED_RISK_THRESHOLD}`);
    inferredFrom.push("runner.physical.age");
  }

  // Factor: slow recovery style
  if (runner?.health?.recoveryStyle === "slow") {
    riskScore += 0.5;
    riskFactors.push("Slow recovery pattern");
    inferredFrom.push("runner.health.recoveryStyle");
  }

  // Map score to level
  const level: InjuryRiskLevel =
    riskScore >= 3
      ? "high"
      : riskScore >= 2
        ? "elevated"
        : riskScore >= 1
          ? "moderate"
          : "low";

  // Determine overtraining risk
  const overtraining: OvertrainingRisk =
    rampRate > OVERTRAINING_HIGH_THRESHOLD
      ? "high"
      : rampRate > OVERTRAINING_CAUTION_THRESHOLD
        ? "caution"
        : rampRate > OVERTRAINING_WATCH_THRESHOLD
          ? "watch"
          : "none";

  // Volume within safe range (10% rule)
  const volumeWithinSafe = rampRate <= SAFE_VOLUME_INCREASE_THRESHOLD;

  // Confidence based on data availability
  const confidence = dataQuality.oldestActivityDays >= 28 ? 0.9 : 0.6;

  return {
    injuryRiskLevel: {
      value: level,
      confidence,
      inferredFrom,
    },
    injuryRiskFactors: {
      value: riskFactors,
      confidence,
      inferredFrom,
    },
    overtrainingRisk: {
      value: overtraining,
      confidence,
      inferredFrom,
    },
    volumeChangePercent: {
      value: rampRatePercent,
      confidence,
      inferredFrom: ["soma.activities.last5weeks"],
    },
    volumeWithinSafeRange: {
      value: volumeWithinSafe,
      confidence,
      inferredFrom: ["soma.activities.last5weeks"],
    },
  };
}

/**
 * Get weekly volume in km for a specific week ago
 * @param weeksAgo 0 = current week, 1 = last week, etc.
 */
function getWeekVolume(activities: InferenceActivity[], weeksAgo: number): number {
  const now = Date.now();
  const weekEnd = now - weeksAgo * MS_PER_WEEK;
  const weekStart = weekEnd - MS_PER_WEEK;

  return activities
    .filter((a) => a.startTime >= weekStart && a.startTime < weekEnd)
    .reduce((sum, a) => sum + (a.distanceMeters ?? 0) / 1000, 0);
}

// =============================================================================
// Pattern Analysis (AC: 3, 6)
// =============================================================================

interface PatternResult {
  last7DaysVolume: InferredValue<number>;
  last7DaysRunCount: InferredValue<number>;
  last28DaysVolume: InferredValue<number>;
  last28DaysRunCount: InferredValue<number>;
  consistencyScore: InferredValue<number>;
}

/**
 * Calculate recent training patterns
 */
function calculateRecentPatterns(
  activities: InferenceActivity[],
  dataQuality: DataQualityMetrics
): PatternResult {
  const now = Date.now();
  const cutoff7Days = now - 7 * MS_PER_DAY;
  const cutoff28Days = now - 28 * MS_PER_DAY;

  // Filter activities for each time window
  const last7DaysActivities = activities.filter((a) => a.startTime >= cutoff7Days);
  const last28DaysActivities = activities.filter((a) => a.startTime >= cutoff28Days);

  // Calculate volumes (convert meters to km)
  const last7DaysVolume = last7DaysActivities.reduce(
    (sum, a) => sum + (a.distanceMeters ?? 0) / 1000,
    0
  );
  const last28DaysVolume = last28DaysActivities.reduce(
    (sum, a) => sum + (a.distanceMeters ?? 0) / 1000,
    0
  );

  // Calculate run counts
  const last7DaysRunCount = last7DaysActivities.length;
  const last28DaysRunCount = last28DaysActivities.length;

  // Calculate consistency score (0-100)
  // Based on variance in weekly volumes over 4 weeks
  const consistencyScore = calculateConsistencyScore(activities);

  const inferredFrom = ["soma.activities.last28days"];
  const confidence =
    dataQuality.quality === "high"
      ? 0.95
      : dataQuality.quality === "medium"
        ? 0.8
        : 0.5;

  return {
    last7DaysVolume: {
      value: Math.round(last7DaysVolume * 10) / 10, // Round to 1 decimal
      confidence: Math.min(1, dataQuality.activitiesCount / 3), // Need at least 3 activities
      inferredFrom: ["soma.activities.last7days"],
    },
    last7DaysRunCount: {
      value: last7DaysRunCount,
      confidence: 1, // Always confident about counts
      inferredFrom: ["soma.activities.last7days"],
    },
    last28DaysVolume: {
      value: Math.round(last28DaysVolume * 10) / 10,
      confidence,
      inferredFrom,
    },
    last28DaysRunCount: {
      value: last28DaysRunCount,
      confidence: 1,
      inferredFrom,
    },
    consistencyScore: {
      value: consistencyScore,
      confidence: dataQuality.oldestActivityDays >= 28 ? 0.9 : 0.5,
      inferredFrom,
    },
  };
}

/**
 * Calculate consistency score based on weekly volume variance
 */
function calculateConsistencyScore(activities: InferenceActivity[]): number {
  // Get weekly volumes for last 4 weeks
  const weeklyVolumes = [
    getWeekVolume(activities, 0),
    getWeekVolume(activities, 1),
    getWeekVolume(activities, 2),
    getWeekVolume(activities, 3),
  ];

  // If no activity, return 0
  const totalVolume = weeklyVolumes.reduce((a, b) => a + b, 0);
  if (totalVolume === 0) return 0;

  // Calculate coefficient of variation (CV)
  const mean = totalVolume / 4;
  const variance = calculateVariance(weeklyVolumes);
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? stdDev / mean : 0;

  // Convert CV to consistency score (lower CV = higher consistency)
  // CV of 0 = 100% consistent, CV of 1 = 0% consistent
  const score = Math.max(0, Math.min(100, Math.round((1 - cv) * 100)));
  return score;
}

// =============================================================================
// Biometrics Extraction (AC: 4, 6)
// =============================================================================

interface BiometricsResult {
  latestRestingHr?: InferredValue<number>;
  latestHrv?: InferredValue<number>;
  latestWeight?: InferredValue<number>;
  latestSleepScore?: InferredValue<number>;
}

/**
 * Extract latest biometrics from daily summaries
 */
function extractLatestBiometrics(
  dailySummaries: InferenceDaily[]
): BiometricsResult {
  const result: BiometricsResult = {};
  const inferredFrom = ["soma.daily.last7days", "soma.body.last7days"];

  // Summaries are already sorted by date descending (most recent first)
  for (const summary of dailySummaries) {
    // Resting HR
    if (!result.latestRestingHr && summary.restingHeartRate) {
      result.latestRestingHr = {
        value: summary.restingHeartRate,
        confidence: calculateFreshnessConfidence(summary.date),
        inferredFrom,
      };
    }

    // HRV
    if (!result.latestHrv && summary.hrvMs) {
      result.latestHrv = {
        value: summary.hrvMs,
        confidence: calculateFreshnessConfidence(summary.date),
        inferredFrom,
      };
    }

    // Weight
    if (!result.latestWeight && summary.weight) {
      result.latestWeight = {
        value: summary.weight,
        confidence: calculateFreshnessConfidence(summary.date),
        inferredFrom,
      };
    }

    // Sleep score
    if (!result.latestSleepScore && summary.sleepScore) {
      result.latestSleepScore = {
        value: summary.sleepScore,
        confidence: calculateFreshnessConfidence(summary.date),
        inferredFrom,
      };
    }

    // Stop if we have all values
    if (
      result.latestRestingHr &&
      result.latestHrv &&
      result.latestWeight &&
      result.latestSleepScore
    ) {
      break;
    }
  }

  return result;
}

/**
 * Calculate confidence based on data freshness
 */
function calculateFreshnessConfidence(dateStr: string): number {
  const dataDate = new Date(dateStr);
  const daysSinceData = Math.floor((Date.now() - dataDate.getTime()) / MS_PER_DAY);

  // Full confidence for today, decreasing over time
  if (daysSinceData === 0) return FRESHNESS_CONFIDENCE.today;
  if (daysSinceData === 1) return FRESHNESS_CONFIDENCE.yesterday;
  if (daysSinceData <= 3) return FRESHNESS_CONFIDENCE.within3Days;
  if (daysSinceData <= 7) return FRESHNESS_CONFIDENCE.within7Days;
  return FRESHNESS_CONFIDENCE.older;
}

// =============================================================================
// Readiness Calculation
// =============================================================================

interface ReadinessResult {
  readinessScore: InferredValue<number>;
  readinessFactors: InferredValue<string[]>;
}

/**
 * Calculate readiness score from training load, biometrics, and risk
 */
function calculateReadiness(
  trainingLoad: TrainingLoadResult,
  biometrics: BiometricsResult,
  injuryRisk: InjuryRiskResult
): ReadinessResult {
  const factors: string[] = [];
  let score = 70; // Start at baseline
  const inferredFrom: string[] = [];

  // Factor: TSB (training stress balance)
  const tsb = trainingLoad.trainingStressBalance.value;
  if (tsb > 10) {
    score += 15;
    factors.push("well_rested");
    inferredFrom.push("trainingStressBalance");
  } else if (tsb > 0) {
    score += 5;
    factors.push("good_recovery");
    inferredFrom.push("trainingStressBalance");
  } else if (tsb < -20) {
    score -= 15;
    factors.push("accumulated_fatigue");
    inferredFrom.push("trainingStressBalance");
  } else if (tsb < -10) {
    score -= 5;
    factors.push("mild_fatigue");
    inferredFrom.push("trainingStressBalance");
  }

  // Factor: Sleep score
  if (biometrics.latestSleepScore) {
    const sleepScore = biometrics.latestSleepScore.value;
    if (sleepScore >= 85) {
      score += 10;
      factors.push("good_sleep");
    } else if (sleepScore < 60) {
      score -= 10;
      factors.push("poor_sleep");
    }
    inferredFrom.push("soma.daily.sleepScore");
  }

  // Factor: HRV
  if (biometrics.latestHrv) {
    // Note: HRV interpretation requires baseline comparison
    // For now, just note that we have the data
    inferredFrom.push("soma.body.hrv");
  }

  // Factor: Injury risk
  if (injuryRisk.injuryRiskLevel.value === "high") {
    score -= 15;
    factors.push("high_injury_risk");
  } else if (injuryRisk.injuryRiskLevel.value === "elevated") {
    score -= 10;
    factors.push("elevated_injury_risk");
  }
  inferredFrom.push("injuryRiskLevel");

  // Factor: Volume change
  if (!injuryRisk.volumeWithinSafeRange.value) {
    score -= 5;
    factors.push("rapid_volume_increase");
    inferredFrom.push("volumeChangePercent");
  }

  // Clamp score to 0-100
  score = Math.max(0, Math.min(100, Math.round(score)));

  // Calculate confidence based on available data
  const dataPoints = [
    trainingLoad.trainingStressBalance.confidence,
    biometrics.latestSleepScore?.confidence ?? 0,
    biometrics.latestHrv?.confidence ?? 0,
    injuryRisk.injuryRiskLevel.confidence,
  ];
  const avgConfidence = dataPoints.reduce((a, b) => a + b, 0) / dataPoints.length;

  return {
    readinessScore: {
      value: score,
      confidence: avgConfidence,
      inferredFrom,
    },
    readinessFactors: {
      value: factors,
      confidence: avgConfidence,
      inferredFrom,
    },
  };
}
