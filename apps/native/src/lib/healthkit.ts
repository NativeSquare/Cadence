import { Platform, Linking } from "react-native";
import {
  isHealthDataAvailable,
  requestAuthorization,
  queryWorkoutSamples,
  queryQuantitySamples,
  queryCategorySamples,
  WorkoutActivityType,
  getRequestStatusForAuthorization,
  AuthorizationRequestStatus,
  getBiologicalSexAsync,
  getDateOfBirthAsync,
  getBloodTypeAsync,
  getFitzpatrickSkinTypeAsync,
  getWheelchairUseAsync,
} from "@kingstinct/react-native-healthkit";
import {
  mapActivityType,
  buildDeviceData,
  toISO,
  transformSleep,
  transformBody,
  transformDaily,
  transformNutrition,
  transformMenstruation,
  transformAthlete,
} from "./healthkit-transforms";
import type {
  ActivityData,
  SleepData,
  BodyData,
  DailyData,
  NutritionData,
  MenstruationData,
  AthleteData,
  LibQuantitySample,
  LibCategorySample,
  WorkoutRoute,
  AthleteCharacteristics,
} from "./healthkit-transforms";

// Re-export types for consumers
export type {
  ActivityData,
  SleepData,
  BodyData,
  DailyData,
  NutritionData,
  MenstruationData,
  AthleteData,
};

// Infer WorkoutProxy type from the library's return type
type WorkoutProxy = Awaited<ReturnType<typeof queryWorkoutSamples>>[number];

// ─── Types ────────────────────────────────────────────────────────────────────

/** Aggregated runner data shaped to match the `runners.inferred` schema. */
export type RunnerAggregates = {
  avgWeeklyVolume: number;
  volumeConsistency: number;
  easyPaceActual: string | undefined;
  longRunPattern: string | undefined;
  restDayFrequency: number;
  trainingLoadTrend: "building" | "maintaining" | "declining" | "erratic";
  estimatedFitness: number | undefined;
};

/** Full HealthKit import result with all Soma-transformed data types. */
export type HealthKitFullImport = {
  activities: ActivityData[];
  sleep: SleepData[];
  body: BodyData[];
  daily: DailyData[];
  nutrition: NutritionData[];
  menstruation: MenstruationData[];
  athlete: AthleteData | null;
  aggregates: RunnerAggregates;
  totalRuns: number;
  summary: string;
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

// ─── Authorization Status ─────────────────────────────────────────────────────

export type HealthKitAuthStatus =
  | "unknown"
  | "shouldRequest"
  | "unnecessary"
  | "denied"
  | "unavailable";

export async function getHealthKitAuthStatus(): Promise<HealthKitAuthStatus> {
  if (Platform.OS !== "ios") return "unavailable";
  if (!isHealthDataAvailable()) return "unavailable";

  try {
    const status = await getRequestStatusForAuthorization({
      toRead: [...READ_PERMISSIONS],
    });

    switch (status) {
      case AuthorizationRequestStatus.unknown:
        return "unknown";
      case AuthorizationRequestStatus.shouldRequest:
        return "shouldRequest";
      case AuthorizationRequestStatus.unnecessary:
        return "unnecessary";
      default:
        return "unknown";
    }
  } catch {
    return "unknown";
  }
}

export async function checkIfAuthorizationDenied(): Promise<boolean> {
  const status = await getHealthKitAuthStatus();

  if (status === "unnecessary") {
    try {
      const workouts = await queryWorkoutSamples({
        limit: 1,
        ascending: false,
        filter: {
          workoutActivityType: WorkoutActivityType.running,
          date: {
            startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
            endDate: new Date(),
          },
        },
      });
      return false;
    } catch {
      return true;
    }
  }

  return false;
}

/**
 * Open iOS Settings for this app.
 * Note: iOS doesn't support deep linking directly to Health data sharing settings.
 * The user must navigate: Settings → [App Name] → Health → Enable data types.
 */
export function openHealthSettings(): void {
  Linking.openURL("app-settings:");
}

export const PERMISSION_DENIED_GUIDANCE = {
  title: "Apple Health Access Required",
  message:
    "To sync your health data, please enable Apple Health access in Settings.",
  instructions: [
    "Tap 'Open Settings' below",
    "Tap 'Health' in the app settings",
    "Turn on all data types you want to share",
    "Return to this app and tap 'Try Again'",
  ],
  alternativeInstructions: [
    "Open the Health app",
    "Tap your profile picture → Apps",
    "Find and tap 'Cadence'",
    "Enable the data types you want to share",
  ],
};

// ─── Authorization & Permissions ─────────────────────────────────────────────

const READ_PERMISSIONS = [
  // Workouts
  "HKWorkoutTypeIdentifier",

  // Heart & Vitals (used by Body + Activity)
  "HKQuantityTypeIdentifierHeartRate",
  "HKQuantityTypeIdentifierRestingHeartRate",
  "HKQuantityTypeIdentifierHeartRateVariabilitySDNN",
  "HKQuantityTypeIdentifierVO2Max",
  "HKQuantityTypeIdentifierOxygenSaturation",
  "HKQuantityTypeIdentifierRespiratoryRate",
  "HKQuantityTypeIdentifierBloodPressureSystolic",
  "HKQuantityTypeIdentifierBloodPressureDiastolic",
  "HKQuantityTypeIdentifierBloodGlucose",
  "HKQuantityTypeIdentifierBodyTemperature",

  // Body Measurements
  "HKQuantityTypeIdentifierBodyMass",
  "HKQuantityTypeIdentifierHeight",
  "HKQuantityTypeIdentifierBodyMassIndex",
  "HKQuantityTypeIdentifierBodyFatPercentage",
  "HKQuantityTypeIdentifierLeanBodyMass",

  // Activity & Energy
  "HKQuantityTypeIdentifierActiveEnergyBurned",
  "HKQuantityTypeIdentifierBasalEnergyBurned",
  "HKQuantityTypeIdentifierDistanceWalkingRunning",
  "HKQuantityTypeIdentifierDistanceCycling",
  "HKQuantityTypeIdentifierRunningSpeed",
  "HKQuantityTypeIdentifierStepCount",
  "HKQuantityTypeIdentifierFlightsClimbed",
  "HKQuantityTypeIdentifierAppleExerciseTime",
  "HKQuantityTypeIdentifierAppleStandTime",

  // Sleep
  "HKCategoryTypeIdentifierSleepAnalysis",

  // Nutrition
  "HKQuantityTypeIdentifierDietaryEnergyConsumed",
  "HKQuantityTypeIdentifierDietaryProtein",
  "HKQuantityTypeIdentifierDietaryCarbohydrates",
  "HKQuantityTypeIdentifierDietaryFatTotal",
  "HKQuantityTypeIdentifierDietaryWater",

  // Menstruation
  "HKCategoryTypeIdentifierMenstrualFlow",

  // Athlete characteristics (requested via read, queried via getXxx)
  "HKCharacteristicTypeIdentifierBiologicalSex",
  "HKCharacteristicTypeIdentifierDateOfBirth",
] as const;

export async function requestHealthKitAuthorization(): Promise<boolean> {
  return requestAuthorization({
    toRead: [...READ_PERMISSIONS],
  });
}

/** Options for the Library Proxy → Soma Unified activity transform. */
export type WorkoutProxyToSomaActivityOptions = {
  /** Distance in km (e.g. from getStatistic or resolveDistances). */
  distanceKm?: number;
  /** Total energy burned in kcal (e.g. from proxy.totalEnergyBurned?.quantity). */
  totalEnergyBurned?: number;
  /** Routes from proxy.getWorkoutRoutes() to fill position_data and raw_payload. */
  routeData?: WorkoutRoute[];
  /** Heart rate samples in workout window for heart_rate_data (and raw_payload). */
  heartRateSamples?: Array<{ startDate: string; value: number }>;
};

/**
 * Transform a Library WorkoutProxy into the Soma Unified activity ingest shape.
 * Uses all available proxy data; unmapped fields go into raw_payload so nothing is lost.
 */
export function workoutProxyToSomaActivity(
  proxy: WorkoutProxy,
  opts: WorkoutProxyToSomaActivityOptions = {},
): ActivityData {
  const startDate = new Date(proxy.startDate).toISOString();
  const endDate = new Date(proxy.endDate).toISOString();
  const duration = proxy.duration?.quantity ?? 0;
  const totals = proxy as {
    totalEnergyBurned?: { quantity?: number };
    totalDistance?: { quantity?: number };
    totalSwimmingStrokeCount?: { quantity?: number };
    totalFlightsClimbed?: { quantity?: number };
  };
  const energy = opts.totalEnergyBurned ?? totals.totalEnergyBurned?.quantity;
  const totalDistanceRaw = totals.totalDistance?.quantity;
  const distanceMeters =
    opts.distanceKm != null
      ? Math.round(opts.distanceKm * 1000)
      : totalDistanceRaw != null
        ? Math.round(totalDistanceRaw)
        : undefined;
  const flightsClimbed = totals.totalFlightsClimbed?.quantity;
  const strokeCount = totals.totalSwimmingStrokeCount?.quantity;
  const source = proxy.sourceRevision?.source
    ? {
      name: proxy.sourceRevision.source?.name ?? "",
      bundleIdentifier:
        proxy.sourceRevision.source?.bundleIdentifier ?? "",
    }
    : undefined;
  const device = proxy.device
    ? {
      name: proxy.device.name ?? undefined,
      manufacturer: proxy.device.manufacturer ?? undefined,
      model: proxy.device.model ?? undefined,
      hardwareVersion: proxy.device.hardwareVersion ?? undefined,
      softwareVersion: proxy.device.softwareVersion ?? undefined,
    }
    : undefined;

  const heartRateSamples = opts.heartRateSamples;
  const hrValues = heartRateSamples?.map((s) => s.value) ?? [];
  const routeData = opts.routeData;

  const activity: ActivityData = {
    metadata: {
      summary_id: proxy.uuid,
      start_time: startDate,
      end_time: endDate,
      type: mapActivityType(proxy.workoutActivityType ?? 0),
      upload_type: 1,
      name: undefined,
    },
    active_durations_data: {
      activity_seconds: duration,
    },
    calories_data:
      energy != null && energy > 0
        ? { total_burned_calories: Math.round(energy) }
        : undefined,
    device_data: buildDeviceData(source, device),
    distance_data:
      distanceMeters != null ||
      strokeCount != null ||
      flightsClimbed != null
        ? {
          summary: {
            distance_meters: distanceMeters,
            steps: undefined,
            floors_climbed: flightsClimbed,
            swimming:
              strokeCount != null
                ? { num_strokes: strokeCount }
                : undefined,
          },
        }
        : undefined,
    heart_rate_data:
      heartRateSamples && heartRateSamples.length > 0
        ? {
          detailed: {
            hr_samples: heartRateSamples.map((s) => ({
              timestamp: s.startDate,
              bpm: s.value,
            })),
          },
          summary: {
            avg_hr_bpm:
              hrValues.length > 0
                ? hrValues.reduce((a, b) => a + b, 0) / hrValues.length
                : undefined,
            max_hr_bpm: hrValues.length > 0 ? Math.max(...hrValues) : undefined,
            min_hr_bpm: hrValues.length > 0 ? Math.min(...hrValues) : undefined,
          },
        }
        : undefined,
    position_data:
      routeData && routeData.length > 0
        ? {
          position_samples: routeData.flatMap((route) =>
            route.locations.map((loc) => ({
              timestamp: loc.timestamp,
              coords_lat_lng_deg: [loc.latitude, loc.longitude],
            })),
          ),
          start_pos_lat_lng_deg: (() => {
            const first = routeData[0]?.locations[0];
            return first
              ? [first.latitude, first.longitude]
              : undefined;
          })(),
          end_pos_lat_lng_deg: (() => {
            const lastRoute = routeData[routeData.length - 1];
            const last =
              lastRoute?.locations[lastRoute.locations.length - 1];
            return last ? [last.latitude, last.longitude] : undefined;
          })(),
        }
        : undefined,
  };

  // Preserve everything the proxy provides that we don't first-class map
  const raw = proxy as {
    events?: readonly { type: number; startDate: Date; endDate: Date }[];
    activities?: readonly {
      startDate: Date;
      endDate: Date;
      uuid: string;
      duration: number;
    }[];
    metadataAverageMETs?: { quantity?: number };
    metadataElevationAscended?: { quantity?: number };
    metadataElevationDescended?: { quantity?: number };
    metadataIndoorWorkout?: boolean;
    metadataAverageSpeed?: { quantity?: number };
    metadataMaximumSpeed?: { quantity?: number };
  };
  activity.raw_payload = {
    events: raw.events?.map((e) => ({
      type: e.type,
      startDate: new Date(e.startDate).toISOString(),
      endDate: new Date(e.endDate).toISOString(),
    })),
    activities: raw.activities?.map((a) => ({
      startDate: new Date(a.startDate).toISOString(),
      endDate: new Date(a.endDate).toISOString(),
      uuid: a.uuid,
      duration: a.duration,
    })),
    metadataAverageMETs: raw.metadataAverageMETs?.quantity,
    metadataElevationAscended: raw.metadataElevationAscended?.quantity,
    metadataElevationDescended: raw.metadataElevationDescended?.quantity,
    metadataIndoorWorkout: raw.metadataIndoorWorkout,
    metadataAverageSpeed: raw.metadataAverageSpeed?.quantity,
    metadataMaximumSpeed: raw.metadataMaximumSpeed?.quantity,
    routeData:
      routeData?.map((r) => ({
        locations: r.locations.map((loc) => ({
          latitude: loc.latitude,
          longitude: loc.longitude,
          altitude: loc.altitude,
          timestamp: loc.timestamp,
        })),
      })),
  };

  return activity;
}

// ─── Data Queries ────────────────────────────────────────────────────────────

function dateRange(days: number): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  return { startDate, endDate };
}

/** Query all workout types (not just running) from the last N days. */
export async function queryAllWorkouts(
  days: number = 90,
): Promise<WorkoutProxy[]> {
  const { startDate, endDate } = dateRange(days);

  return queryWorkoutSamples({
    limit: 0,
    ascending: false,
    filter: {
      date: { startDate, endDate },
    },
  });
}

/** Query running workouts from the last N days (for aggregate calculations). */
export async function queryRunningWorkouts(
  days: number = 90,
): Promise<WorkoutProxy[]> {
  const { startDate, endDate } = dateRange(days);

  return queryWorkoutSamples({
    limit: 0,
    ascending: false,
    filter: {
      workoutActivityType: WorkoutActivityType.running,
      date: { startDate, endDate },
    },
  });
}

/** Query sleep analysis category samples from the last N days. */
async function querySleepSamples(days: number = 90) {
  const { startDate, endDate } = dateRange(days);

  return queryCategorySamples(
    "HKCategoryTypeIdentifierSleepAnalysis",
    {
      limit: 0,
      ascending: false,
      filter: {
        date: { startDate, endDate },
      },
    },
  );
}

/** Quantity types for body metrics. */
const BODY_QUANTITY_TYPES = [
  "HKQuantityTypeIdentifierBodyMass",
  "HKQuantityTypeIdentifierHeight",
  "HKQuantityTypeIdentifierBodyMassIndex",
  "HKQuantityTypeIdentifierBodyFatPercentage",
  "HKQuantityTypeIdentifierLeanBodyMass",
  "HKQuantityTypeIdentifierHeartRate",
  "HKQuantityTypeIdentifierRestingHeartRate",
  "HKQuantityTypeIdentifierHeartRateVariabilitySDNN",
  "HKQuantityTypeIdentifierBloodPressureSystolic",
  "HKQuantityTypeIdentifierBloodPressureDiastolic",
  "HKQuantityTypeIdentifierOxygenSaturation",
  "HKQuantityTypeIdentifierBloodGlucose",
  "HKQuantityTypeIdentifierBodyTemperature",
  "HKQuantityTypeIdentifierRespiratoryRate",
  "HKQuantityTypeIdentifierVO2Max",
] as const;

/** Query body-related quantity samples from the last N days. */
async function queryBodySamples(days: number = 90) {
  const { startDate, endDate } = dateRange(days);
  const allSamples: Array<Awaited<ReturnType<typeof queryQuantitySamples>>[number]> = [];

  for (const type of BODY_QUANTITY_TYPES) {
    try {
      const samples = await queryQuantitySamples(type as any, {
        limit: 0,
        ascending: false,
        filter: {
          date: { startDate, endDate },
        },
      });
      allSamples.push(...samples);
    } catch {
      // Type may not be available or authorized -- skip silently
    }
  }

  return allSamples;
}

/** Quantity types for daily activity metrics. */
const DAILY_QUANTITY_TYPES = [
  "HKQuantityTypeIdentifierStepCount",
  "HKQuantityTypeIdentifierDistanceWalkingRunning",
  "HKQuantityTypeIdentifierDistanceCycling",
  "HKQuantityTypeIdentifierActiveEnergyBurned",
  "HKQuantityTypeIdentifierBasalEnergyBurned",
  "HKQuantityTypeIdentifierFlightsClimbed",
  "HKQuantityTypeIdentifierAppleExerciseTime",
  "HKQuantityTypeIdentifierAppleStandTime",
  "HKQuantityTypeIdentifierVO2Max",
  "HKQuantityTypeIdentifierHeartRate",
  "HKQuantityTypeIdentifierHeartRateVariabilitySDNN",
] as const;

/** Query daily-activity quantity samples from the last N days. */
async function queryDailySamples(days: number = 90) {
  const { startDate, endDate } = dateRange(days);
  const allSamples: Array<Awaited<ReturnType<typeof queryQuantitySamples>>[number]> = [];

  for (const type of DAILY_QUANTITY_TYPES) {
    try {
      const samples = await queryQuantitySamples(type as any, {
        limit: 0,
        ascending: false,
        filter: {
          date: { startDate, endDate },
        },
      });
      allSamples.push(...samples);
    } catch {
      // Skip unavailable types
    }
  }

  return allSamples;
}

/** Quantity types for nutrition data. */
const NUTRITION_QUANTITY_TYPES = [
  "HKQuantityTypeIdentifierDietaryEnergyConsumed",
  "HKQuantityTypeIdentifierDietaryProtein",
  "HKQuantityTypeIdentifierDietaryCarbohydrates",
  "HKQuantityTypeIdentifierDietaryFatTotal",
  "HKQuantityTypeIdentifierDietaryWater",
] as const;

/** Query nutrition quantity samples from the last N days. */
async function queryNutritionSamples(days: number = 90) {
  const { startDate, endDate } = dateRange(days);
  const allSamples: Array<Awaited<ReturnType<typeof queryQuantitySamples>>[number]> = [];

  for (const type of NUTRITION_QUANTITY_TYPES) {
    try {
      const samples = await queryQuantitySamples(type as any, {
        limit: 0,
        ascending: false,
        filter: {
          date: { startDate, endDate },
        },
      });
      allSamples.push(...samples);
    } catch {
      // Skip unavailable types
    }
  }

  return allSamples;
}

/** Query menstrual flow category samples from the last N days. */
async function queryMenstruationSamples(days: number = 90) {
  const { startDate, endDate } = dateRange(days);

  try {
    return await queryCategorySamples(
      "HKCategoryTypeIdentifierMenstrualFlow",
      {
        limit: 0,
        ascending: false,
        filter: {
          date: { startDate, endDate },
        },
      },
    );
  } catch {
    return [];
  }
}

/** Get athlete characteristics from HealthKit (static profile data). */
async function getAthleteCharacteristics(): Promise<AthleteCharacteristics | null> {
  try {
    const [biologicalSex, dateOfBirth, bloodType, skinType, wheelchair] =
      await Promise.all([
        getBiologicalSexAsync().catch(() => undefined),
        getDateOfBirthAsync().catch(() => undefined),
        getBloodTypeAsync().catch(() => undefined),
        getFitzpatrickSkinTypeAsync().catch(() => undefined),
        getWheelchairUseAsync().catch(() => undefined),
      ]);

    const sexMap: Record<string, AthleteCharacteristics["biologicalSex"]> = {
      female: "female",
      male: "male",
      other: "other",
    };

    return {
      biologicalSex: sexMap[String(biologicalSex)] ?? "notSet",
      dateOfBirth: dateOfBirth ? dateOfBirth.toISOString() : undefined,
      bloodType: bloodType ? String(bloodType) : undefined,
      fitzpatrickSkinType:
        skinType !== undefined ? Number(skinType) : undefined,
      wheelchairUse:
        wheelchair !== undefined ? Boolean(wheelchair) : undefined,
    };
  } catch {
    return null;
  }
}

// ─── Sleep Session Grouping ──────────────────────────────────────────────────

/**
 * Group sleep category samples into individual sessions.
 * A new session starts when there is a gap > 2 hours between samples.
 */
function groupSleepSessions(
  rawSamples: LibCategorySample[],
): LibCategorySample[][] {
  if (rawSamples.length === 0) return [];

  const sorted = [...rawSamples].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  const sessions: LibCategorySample[][] = [];
  let currentSession: LibCategorySample[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prevEnd = new Date(sorted[i - 1].endDate).getTime();
    const curStart = new Date(sorted[i].startDate).getTime();
    const gapHours = (curStart - prevEnd) / (1000 * 60 * 60);

    if (gapHours > 2) {
      sessions.push(currentSession);
      currentSession = [sorted[i]];
    } else {
      currentSession.push(sorted[i]);
    }
  }
  sessions.push(currentSession);

  return sessions;
}

// ─── Daily Sample Grouping ───────────────────────────────────────────────────

/**
 * Group quantity samples by calendar day (local time).
 * Returns a map of "YYYY-MM-DD" → samples.
 */
function groupSamplesByDay(
  samples: LibQuantitySample[],
): Map<string, LibQuantitySample[]> {
  const dayMap = new Map<string, LibQuantitySample[]>();

  for (const sample of samples) {
    const day = toISO(sample.startDate).slice(0, 10); // "YYYY-MM-DD"
    const existing = dayMap.get(day);
    if (existing) {
      existing.push(sample);
    } else {
      dayMap.set(day, [sample]);
    }
  }

  return dayMap;
}

// ─── Transform Orchestration ─────────────────────────────────────────────────

/**
 * Transform workout proxies to Soma Unified activity shape.
 * Preserves events, metadata, and raw_payload via workoutProxyToSomaActivity.
 */
function transformAllWorkouts(
  workouts: WorkoutProxy[],
  distanceMap: Map<string, number>,
): ActivityData[] {
  return workouts.map((proxy) => {
    const totals = proxy as { totalEnergyBurned?: { quantity?: number } };
    return workoutProxyToSomaActivity(proxy, {
      distanceKm: distanceMap.get(proxy.uuid),
      totalEnergyBurned: totals.totalEnergyBurned?.quantity,
    });
  });
}

function transformAllSleep(
  rawSamples: LibCategorySample[],
): SleepData[] {
  const sessions = groupSleepSessions(rawSamples);
  return sessions.map((session) => transformSleep(session));
}

function transformAllBody(
  rawSamples: LibQuantitySample[],
): BodyData[] {
  if (rawSamples.length === 0) return [];
  return [transformBody(rawSamples)];
}

function transformAllDaily(
  rawSamples: LibQuantitySample[],
): DailyData[] {
  if (rawSamples.length === 0) return [];

  const dayGroups = groupSamplesByDay(rawSamples);

  const results: DailyData[] = [];
  for (const [dayStr, daySamples] of dayGroups) {
    const timeRange = {
      start_time: `${dayStr}T00:00:00.000Z`,
      end_time: `${dayStr}T23:59:59.999Z`,
    };
    results.push(transformDaily(daySamples, timeRange));
  }

  return results;
}

function transformAllNutrition(
  rawSamples: LibQuantitySample[],
): NutritionData[] {
  if (rawSamples.length === 0) return [];

  const dayGroups = groupSamplesByDay(rawSamples);

  const results: NutritionData[] = [];
  for (const [dayStr, daySamples] of dayGroups) {
    const timeRange = {
      start_time: `${dayStr}T00:00:00.000Z`,
      end_time: `${dayStr}T23:59:59.999Z`,
    };
    results.push(transformNutrition(daySamples, timeRange));
  }

  return results;
}

function transformAllMenstruation(
  rawSamples: LibCategorySample[],
): MenstruationData[] {
  if (rawSamples.length === 0) return [];
  return [transformMenstruation(rawSamples)];
}

function transformAthleteData(
  characteristics: AthleteCharacteristics | null,
): AthleteData | null {
  if (!characteristics) return null;
  return transformAthlete(characteristics);
}

// ─── Aggregate Calculations (kept for Runner profile) ────────────────────────

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
    // Fall through
  }

  const durationSeconds = workout.duration?.quantity ?? 0;
  if (workout.metadataAverageSpeed?.quantity && durationSeconds > 0) {
    const distanceMeters =
      workout.metadataAverageSpeed.quantity * durationSeconds;
    return distanceMeters / 1000;
  }

  return 0;
}

async function resolveDistances(
  workouts: WorkoutProxy[],
): Promise<Map<string, number>> {
  const distanceMap = new Map<string, number>();
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

async function queryVO2Max(): Promise<number | undefined> {
  try {
    const samples = await queryQuantitySamples(
      "HKQuantityTypeIdentifierVO2Max",
      { limit: 1, ascending: false },
    );
    if (samples.length > 0) {
      return samples[0].quantity;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export async function calculateRunnerAggregates(
  workouts: WorkoutProxy[],
  vo2max?: number,
  distanceMap?: Map<string, number>,
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

  const sorted = [...workouts].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  const distances =
    distanceMap ?? (await resolveDistances(sorted));

  const weeklyVolumes = calculateWeeklyVolumes(sorted, distances);
  const avgWeeklyVolume =
    weeklyVolumes.length > 0
      ? weeklyVolumes.reduce((sum, v) => sum + v, 0) / weeklyVolumes.length
      : 0;
  const volumeConsistency = calculateCoefficientOfVariation(weeklyVolumes);
  const easyPaceActual = estimateEasyPace(sorted, distances);
  const longRunPattern = detectLongRunPattern(sorted, distances);
  const restDayFrequency = calculateRestDayFrequency(sorted);
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

// ─── Aggregate Helpers ───────────────────────────────────────────────────────

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
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split("T")[0];
}

function calculateCoefficientOfVariation(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  if (mean === 0) return 0;
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return (stdDev / mean) * 100;
}

function estimateEasyPace(
  workouts: WorkoutProxy[],
  distances: Map<string, number>,
): string | undefined {
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
      paces.push(durationMin / distanceKm);
    }
  }
  if (paces.length === 0) return undefined;

  paces.sort((a, b) => a - b);
  const medianPace = paces[Math.floor(paces.length / 2)];
  return formatPace(medianPace);
}

function formatPace(minPerKm: number): string {
  const mins = Math.floor(minPerKm);
  const secs = Math.round((minPerKm - mins) * 60);
  return `${mins}:${secs.toString().padStart(2, "0")}/km`;
}

function detectLongRunPattern(
  workouts: WorkoutProxy[],
  distanceMap: Map<string, number>,
): string | undefined {
  if (workouts.length < 3) return undefined;
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

  const longRunDates = longRuns
    .map((w) => new Date(w.startDate).getTime())
    .sort((a, b) => a - b);
  let totalGapDays = 0;
  for (let i = 1; i < longRunDates.length; i++) {
    totalGapDays +=
      (longRunDates[i] - longRunDates[i - 1]) / (1000 * 60 * 60 * 24);
  }
  const avgGap = totalGapDays / (longRunDates.length - 1);

  if (avgGap <= 9) return "weekly";
  if (avgGap <= 18) return "biweekly";
  return "irregular";
}

function calculateRestDayFrequency(workouts: WorkoutProxy[]): number {
  if (workouts.length === 0) return 7;
  const firstDate = new Date(workouts[0].startDate);
  const lastDate = new Date(workouts[workouts.length - 1].startDate);
  const totalDays =
    (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24) + 1;
  if (totalDays <= 0) return 7;

  const activeDays = new Set(
    workouts.map((w) => new Date(w.startDate).toISOString().split("T")[0]),
  );
  const totalWeeks = totalDays / 7;
  const restDays = totalDays - activeDays.size;
  return Math.max(0, Math.min(7, restDays / totalWeeks));
}

function detectTrainingLoadTrend(
  weeklyVolumes: number[],
): "building" | "maintaining" | "declining" | "erratic" {
  if (weeklyVolumes.length < 3) return "maintaining";
  const recentWeeks = weeklyVolumes.slice(-4);
  const previousWeeks = weeklyVolumes.slice(-8, -4);
  if (previousWeeks.length === 0) return "maintaining";

  const recentAvg =
    recentWeeks.reduce((sum, v) => sum + v, 0) / recentWeeks.length;
  const previousAvg =
    previousWeeks.reduce((sum, v) => sum + v, 0) / previousWeeks.length;
  if (previousAvg === 0) return recentAvg > 0 ? "building" : "maintaining";

  const changePercent = ((recentAvg - previousAvg) / previousAvg) * 100;
  const recentCV = calculateCoefficientOfVariation(recentWeeks);
  if (recentCV > 40) return "erratic";
  if (changePercent > 10) return "building";
  if (changePercent < -10) return "declining";
  return "maintaining";
}

// ─── Main Import Function ────────────────────────────────────────────────────

/**
 * Full HealthKit import pipeline — fetches and transforms all 7 data types:
 * 1. Request authorization (expanded permissions)
 * 2. Query all data types in parallel
 * 3. Transform each batch to Soma unified schema
 * 4. Calculate runner aggregates (for profile, from running workouts only)
 * 5. Return structured result
 */
export async function importAllHealthKitData(
  days: number = 90,
): Promise<HealthKitFullImport> {
  await requestHealthKitAuthorization();

  // Query all data types in parallel
  const [
    allWorkouts,
    runningWorkouts,
    sleepRaw,
    bodyRaw,
    dailyRaw,
    nutritionRaw,
    menstruationRaw,
    athleteRaw,
    vo2max,
  ] = await Promise.all([
    queryAllWorkouts(days),
    queryRunningWorkouts(days),
    querySleepSamples(days),
    queryBodySamples(days),
    queryDailySamples(days),
    queryNutritionSamples(days),
    queryMenstruationSamples(days),
    getAthleteCharacteristics(),
    queryVO2Max(),
  ]);

  // Resolve distances for all workouts once (used for activity enrichment and aggregates)
  const distanceMap = await resolveDistances(allWorkouts);

  // Transform workouts and calculate aggregates
  const activities = transformAllWorkouts(allWorkouts, distanceMap);
  const aggregates = await calculateRunnerAggregates(runningWorkouts, vo2max, distanceMap);

  const sleep = transformAllSleep(sleepRaw);
  const body = transformAllBody(bodyRaw);
  const daily = transformAllDaily(dailyRaw);
  const nutrition = transformAllNutrition(nutritionRaw);
  const menstruation = transformAllMenstruation(menstruationRaw);
  const athlete = transformAthleteData(athleteRaw);

  const totalRuns = runningWorkouts.length;
  const totalActivities = activities.length;
  const parts: string[] = [];
  if (totalActivities > 0)
    parts.push(
      `${totalActivities} workout${totalActivities === 1 ? "" : "s"}`,
    );
  if (sleep.length > 0)
    parts.push(`${sleep.length} sleep session${sleep.length === 1 ? "" : "s"}`);
  if (daily.length > 0)
    parts.push(`${daily.length} daily summar${daily.length === 1 ? "y" : "ies"}`);
  if (body.length > 0) parts.push("body metrics");
  if (nutrition.length > 0) parts.push("nutrition data");
  if (menstruation.length > 0) parts.push("menstruation data");
  if (athlete) parts.push("athlete profile");

  const summary =
    parts.length > 0 ? `Imported ${parts.join(", ")}` : "No health data found";

  if (__DEV__) {
    console.log(
      `[HealthKit] Import complete: ${activities.length} activities, ${totalRuns} runs`,
    );
  }

  return {
    activities,
    sleep,
    body,
    daily,
    nutrition,
    menstruation,
    athlete,
    aggregates,
    totalRuns,
    summary,
  };
}
