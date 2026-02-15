import { Platform } from "react-native";
import {
  isHealthDataAvailable,
  requestAuthorization,
  queryWorkoutSamples,
  queryQuantitySamples,
  WorkoutActivityType,
} from "@kingstinct/react-native-healthkit";
import type { WorkoutProxy } from "@kingstinct/react-native-healthkit";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Aggregated runner data shaped to match the `runners.inferred` schema. */
export type RunnerAggregates = {
  avgWeeklyVolume: number; // km per week
  volumeConsistency: number; // % variance (lower = more consistent)
  easyPaceActual: string | undefined; // "X:XX/km" format
  longRunPattern: string | undefined; // e.g., "weekly" | "biweekly" | "irregular"
  restDayFrequency: number; // avg rest days per week
  trainingLoadTrend: "building" | "maintaining" | "declining" | "erratic";
  estimatedFitness: number | undefined; // VO2max if available
};

export type HealthKitImportResult = {
  totalRuns: number;
  dateRange: { from: Date; to: Date } | null;
  aggregates: RunnerAggregates;
  summary: string; // Human-readable, e.g. "47 runs imported"
};

// ─── HealthKit Availability ──────────────────────────────────────────────────

/** Check if HealthKit is available on this device (iOS only). */
export function checkHealthKitAvailable(): boolean {
  if (Platform.OS !== "ios") return false;
  try {
    return isHealthDataAvailable();
  } catch {
    return false;
  }
}

// ─── Authorization ───────────────────────────────────────────────────────────

const READ_PERMISSIONS = [
  "HKWorkoutTypeIdentifier",
  "HKQuantityTypeIdentifierHeartRate",
  "HKQuantityTypeIdentifierVO2Max",
  "HKQuantityTypeIdentifierActiveEnergyBurned",
  "HKQuantityTypeIdentifierDistanceWalkingRunning",
  "HKQuantityTypeIdentifierRunningSpeed",
] as const;

/** Request read-only authorization for running-related HealthKit data. */
export async function requestHealthKitAuthorization(): Promise<boolean> {
  return requestAuthorization({
    toRead: [...READ_PERMISSIONS],
  });
}

// ─── Data Queries ────────────────────────────────────────────────────────────

/** Query running workouts from the last N days. */
export async function queryRunningWorkouts(
  days: number = 90,
): Promise<WorkoutProxy[]> {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const workouts = await queryWorkoutSamples({
    limit: 0, // 0 or negative = fetch all
    ascending: false,
    filter: {
      workoutActivityType: WorkoutActivityType.running,
      date: {
        startDate,
        endDate: now,
      },
    },
  });

  return workouts;
}

/** Query the most recent VO2max sample. */
async function queryVO2Max(): Promise<number | undefined> {
  try {
    const samples = await queryQuantitySamples(
      "HKQuantityTypeIdentifierVO2Max",
      {
        limit: 1,
        ascending: false,
      },
    );

    if (samples.length > 0) {
      return samples[0].quantity;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

// ─── Aggregate Calculations ──────────────────────────────────────────────────

/** Fetch distance in km for a workout using its statistics. */
async function getWorkoutDistanceKmAsync(
  workout: WorkoutProxy,
): Promise<number> {
  try {
    const stat = await workout.getStatistic(
      "HKQuantityTypeIdentifierDistanceWalkingRunning",
      "km",
    );
    if (stat?.sumQuantity?.quantity) {
      return stat.sumQuantity.quantity;
    }
  } catch {
    // Fall through to speed-based estimation
  }

  // Fallback: estimate from average speed * duration
  const durationSeconds = workout.duration?.quantity ?? 0;
  if (workout.metadataAverageSpeed?.quantity && durationSeconds > 0) {
    const distanceMeters =
      workout.metadataAverageSpeed.quantity * durationSeconds;
    return distanceMeters / 1000;
  }

  return 0;
}

/** Batch-fetch distances for all workouts. */
async function resolveDistances(
  workouts: WorkoutProxy[],
): Promise<Map<string, number>> {
  const distanceMap = new Map<string, number>();

  // Process in parallel batches of 10 to avoid overwhelming the system
  const batchSize = 10;
  for (let i = 0; i < workouts.length; i += batchSize) {
    const batch = workouts.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((w) => getWorkoutDistanceKmAsync(w)),
    );
    batch.forEach((w, idx) => {
      distanceMap.set(w.uuid, results[idx]);
    });
  }

  return distanceMap;
}

/**
 * Calculate runner aggregates from raw workout data.
 * All calculations happen on-device — no data leaves the phone until
 * the user's runner profile is updated in Convex.
 */
export async function calculateRunnerAggregates(
  workouts: WorkoutProxy[],
  vo2max?: number,
): Promise<RunnerAggregates> {
  if (workouts.length === 0) {
    return {
      avgWeeklyVolume: 0,
      volumeConsistency: 0,
      easyPaceActual: undefined,
      longRunPattern: undefined,
      restDayFrequency: 7,
      trainingLoadTrend: "maintaining",
      estimatedFitness: vo2max,
    };
  }

  // Sort workouts by date ascending
  const sorted = [...workouts].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  // Resolve distances for all workouts (async, batched)
  const distances = await resolveDistances(sorted);

  // ─── Weekly volume calculation ─────────────────────────────────────
  const weeklyVolumes = calculateWeeklyVolumes(sorted, distances);
  const avgWeeklyVolume =
    weeklyVolumes.length > 0
      ? weeklyVolumes.reduce((sum, v) => sum + v, 0) / weeklyVolumes.length
      : 0;

  // ─── Volume consistency (coefficient of variation) ─────────────────
  const volumeConsistency = calculateCoefficientOfVariation(weeklyVolumes);

  // ─── Easy pace estimation ──────────────────────────────────────────
  const easyPaceActual = estimateEasyPace(sorted, distances);

  // ─── Long run pattern ──────────────────────────────────────────────
  const longRunPattern = detectLongRunPattern(sorted, distances);

  // ─── Rest day frequency ────────────────────────────────────────────
  const restDayFrequency = calculateRestDayFrequency(sorted);

  // ─── Training load trend ───────────────────────────────────────────
  const trainingLoadTrend = detectTrainingLoadTrend(weeklyVolumes);

  return {
    avgWeeklyVolume: Math.round(avgWeeklyVolume * 10) / 10,
    volumeConsistency: Math.round(volumeConsistency),
    easyPaceActual,
    longRunPattern,
    restDayFrequency: Math.round(restDayFrequency * 10) / 10,
    trainingLoadTrend,
    estimatedFitness: vo2max,
  };
}

// ─── Helper: Weekly Volumes ──────────────────────────────────────────────────

function calculateWeeklyVolumes(
  workouts: WorkoutProxy[],
  distances: Map<string, number>,
): number[] {
  if (workouts.length === 0) return [];

  const weekMap = new Map<string, number>();

  for (const workout of workouts) {
    const date = new Date(workout.startDate);
    const weekKey = getISOWeekKey(date);
    const distanceKm = distances.get(workout.uuid) ?? 0;
    weekMap.set(weekKey, (weekMap.get(weekKey) ?? 0) + distanceKm);
  }

  return Array.from(weekMap.values());
}

function getISOWeekKey(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // Get the Monday of this week
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

// ─── Helper: Coefficient of Variation ────────────────────────────────────────

function calculateCoefficientOfVariation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  if (mean === 0) return 0;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return (stdDev / mean) * 100;
}

// ─── Helper: Easy Pace Estimation ────────────────────────────────────────────

function estimateEasyPace(
  workouts: WorkoutProxy[],
  distances: Map<string, number>,
): string | undefined {
  // Filter for runs that are likely "easy" — between 30-75 min duration
  const easyRuns = workouts.filter((w) => {
    const durationMin = (w.duration?.quantity ?? 0) / 60;
    return durationMin >= 30 && durationMin <= 75;
  });

  if (easyRuns.length === 0) return undefined;

  const paces: number[] = [];
  for (const run of easyRuns) {
    const distanceKm = distances.get(run.uuid) ?? 0;
    const durationMin = (run.duration?.quantity ?? 0) / 60;
    if (distanceKm > 0 && durationMin > 0) {
      paces.push(durationMin / distanceKm); // min/km
    }
  }

  if (paces.length === 0) return undefined;

  // Take the median pace as the "easy pace"
  paces.sort((a, b) => a - b);
  const medianPace = paces[Math.floor(paces.length / 2)];

  return formatPace(medianPace);
}

function formatPace(minPerKm: number): string {
  const mins = Math.floor(minPerKm);
  const secs = Math.round((minPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")}/km`;
}

// ─── Helper: Long Run Pattern ────────────────────────────────────────────────

function detectLongRunPattern(
  workouts: WorkoutProxy[],
  distanceMap: Map<string, number>,
): string | undefined {
  if (workouts.length < 3) return undefined;

  // A "long run" is any run > 1.5x the average distance
  const validDistances = workouts
    .map((w) => distanceMap.get(w.uuid) ?? 0)
    .filter((d) => d > 0);

  if (validDistances.length < 3) return undefined;

  const avgDistance =
    validDistances.reduce((sum, d) => sum + d, 0) / validDistances.length;
  const longRunThreshold = avgDistance * 1.5;

  const longRuns = workouts.filter(
    (w) => (distanceMap.get(w.uuid) ?? 0) >= longRunThreshold,
  );

  if (longRuns.length < 2) return undefined;

  // Calculate average days between long runs
  const longRunDates = longRuns
    .map((w) => new Date(w.startDate).getTime())
    .sort((a, b) => a - b);

  let totalGapDays = 0;
  for (let i = 1; i < longRunDates.length; i++) {
    totalGapDays += (longRunDates[i] - longRunDates[i - 1]) / (1000 * 60 * 60 * 24);
  }
  const avgGap = totalGapDays / (longRunDates.length - 1);

  if (avgGap <= 9) return "weekly";
  if (avgGap <= 18) return "biweekly";
  return "irregular";
}

// ─── Helper: Rest Day Frequency ──────────────────────────────────────────────

function calculateRestDayFrequency(workouts: WorkoutProxy[]): number {
  if (workouts.length === 0) return 7;

  const firstDate = new Date(workouts[0].startDate);
  const lastDate = new Date(workouts[workouts.length - 1].startDate);
  const totalDays =
    (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24) + 1;

  if (totalDays <= 0) return 7;

  // Count unique days with workouts
  const activeDays = new Set(
    workouts.map((w) => new Date(w.startDate).toISOString().split("T")[0]),
  );

  const totalWeeks = totalDays / 7;
  const restDays = totalDays - activeDays.size;
  const restDaysPerWeek = restDays / totalWeeks;

  return Math.max(0, Math.min(7, restDaysPerWeek));
}

// ─── Helper: Training Load Trend ─────────────────────────────────────────────

function detectTrainingLoadTrend(
  weeklyVolumes: number[],
): "building" | "maintaining" | "declining" | "erratic" {
  if (weeklyVolumes.length < 3) return "maintaining";

  // Compare last 4 weeks to previous 4 weeks
  const recentWeeks = weeklyVolumes.slice(-4);
  const previousWeeks = weeklyVolumes.slice(-8, -4);

  if (previousWeeks.length === 0) return "maintaining";

  const recentAvg =
    recentWeeks.reduce((sum, v) => sum + v, 0) / recentWeeks.length;
  const previousAvg =
    previousWeeks.reduce((sum, v) => sum + v, 0) / previousWeeks.length;

  if (previousAvg === 0) return recentAvg > 0 ? "building" : "maintaining";

  const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;

  // Check for erratic pattern (high CV in recent weeks)
  const recentCV = calculateCoefficientOfVariation(recentWeeks);
  if (recentCV > 40) return "erratic";

  if (changePercent > 10) return "building";
  if (changePercent < -10) return "declining";
  return "maintaining";
}

// ─── Main Import Function ────────────────────────────────────────────────────

/**
 * Full HealthKit import pipeline:
 * 1. Request authorization
 * 2. Query running workouts (last 90 days)
 * 3. Query VO2max
 * 4. Calculate aggregates
 * 5. Return structured result
 */
export async function importHealthKitData(): Promise<HealthKitImportResult> {
  // Request authorization
  await requestHealthKitAuthorization();

  // Query data in parallel
  const [workouts, vo2max] = await Promise.all([
    queryRunningWorkouts(90),
    queryVO2Max(),
  ]);

  // Calculate aggregates (async — fetches distance stats per workout)
  const aggregates = await calculateRunnerAggregates(workouts, vo2max);

  // Build date range
  let dateRange: { from: Date; to: Date } | null = null;
  if (workouts.length > 0) {
    const dates = workouts.map((w) => new Date(w.startDate).getTime());
    dateRange = {
      from: new Date(Math.min(...dates)),
      to: new Date(Math.max(...dates)),
    };
  }

  // Human-readable summary
  const summary =
    workouts.length > 0
      ? `${workouts.length} run${workouts.length === 1 ? "" : "s"} imported`
      : "No recent runs found";

  return {
    totalRuns: workouts.length,
    dateRange,
    aggregates,
    summary,
  };
}
