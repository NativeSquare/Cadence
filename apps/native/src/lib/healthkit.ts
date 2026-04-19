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
import type {
  HKCategorySample,
  HKCharacteristics,
  HKQuantitySample,
  HKWorkout,
} from "@nativesquare/soma/healthkit";
import {
  toHKCategorySample,
  toHKCharacteristics,
  toHKQuantitySample,
  toHKWorkout,
  toISO,
  type LibAthleteCharacteristics,
  type LibCategorySample,
  type LibQuantitySample,
} from "./healthkit-transforms";

// ─── Collected Data Shape ────────────────────────────────────────────────────

/**
 * HealthKit data collected on-device, shaped into Soma's raw HK types and
 * ready to send straight to the `soma.healthkit.syncAll` mutation.
 */
export type HealthKitCollectedData = {
  workouts: HKWorkout[];
  sleepSessions: HKCategorySample[][];
  bodySamples: HKQuantitySample[];
  dailySamples: HKQuantitySample[];
  nutritionSamples: HKQuantitySample[];
  menstruationSamples: HKCategorySample[];
  characteristics?: HKCharacteristics;
  summary: string;
};

// ─── HealthKit Availability ──────────────────────────────────────────────────

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
      await queryWorkoutSamples({
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

  // Heart & Vitals
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

  // Athlete characteristics
  "HKCharacteristicTypeIdentifierBiologicalSex",
  "HKCharacteristicTypeIdentifierDateOfBirth",
] as const;

export async function requestHealthKitAuthorization(): Promise<boolean> {
  return requestAuthorization({
    toRead: [...READ_PERMISSIONS],
  });
}

// ─── Query helpers ───────────────────────────────────────────────────────────

function dateRange(days: number): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  return { startDate, endDate };
}

async function queryAllWorkouts(days: number) {
  const { startDate, endDate } = dateRange(days);
  return queryWorkoutSamples({
    limit: 0,
    ascending: false,
    filter: { date: { startDate, endDate } },
  });
}

async function querySleepSamples(days: number) {
  const { startDate, endDate } = dateRange(days);
  return queryCategorySamples("HKCategoryTypeIdentifierSleepAnalysis", {
    limit: 0,
    ascending: false,
    filter: { date: { startDate, endDate } },
  });
}

async function queryQuantitySamplesByTypes(
  types: readonly string[],
  days: number,
): Promise<LibQuantitySample[]> {
  const { startDate, endDate } = dateRange(days);
  const all: LibQuantitySample[] = [];
  for (const type of types) {
    try {
      const samples = await queryQuantitySamples(type as any, {
        limit: 0,
        ascending: false,
        filter: { date: { startDate, endDate } },
      });
      all.push(...(samples as unknown as LibQuantitySample[]));
    } catch {
      // Type may not be available or authorized -- skip silently
    }
  }
  return all;
}

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

const NUTRITION_QUANTITY_TYPES = [
  "HKQuantityTypeIdentifierDietaryEnergyConsumed",
  "HKQuantityTypeIdentifierDietaryProtein",
  "HKQuantityTypeIdentifierDietaryCarbohydrates",
  "HKQuantityTypeIdentifierDietaryFatTotal",
  "HKQuantityTypeIdentifierDietaryWater",
] as const;

async function queryMenstruationSamples(days: number) {
  const { startDate, endDate } = dateRange(days);
  try {
    return await queryCategorySamples("HKCategoryTypeIdentifierMenstrualFlow", {
      limit: 0,
      ascending: false,
      filter: { date: { startDate, endDate } },
    });
  } catch {
    return [];
  }
}

async function getAthleteCharacteristics(): Promise<LibAthleteCharacteristics | null> {
  try {
    const [biologicalSex, dateOfBirth, bloodType, skinType, wheelchair] =
      await Promise.all([
        getBiologicalSexAsync().catch(() => undefined),
        getDateOfBirthAsync().catch(() => undefined),
        getBloodTypeAsync().catch(() => undefined),
        getFitzpatrickSkinTypeAsync().catch(() => undefined),
        getWheelchairUseAsync().catch(() => undefined),
      ]);

    return {
      biologicalSex,
      dateOfBirth: dateOfBirth ?? undefined,
      bloodType: bloodType != null ? String(bloodType) : undefined,
      fitzpatrickSkinType:
        skinType !== undefined ? Number(skinType) : undefined,
      wheelchairUse:
        wheelchair !== undefined ? Boolean(wheelchair) : undefined,
    };
  } catch {
    return null;
  }
}

// ─── Session Grouping ────────────────────────────────────────────────────────

/**
 * Group sleep category samples into individual sessions.
 * A new session starts when there is a gap > 2 hours between samples.
 */
function groupSleepSessions(
  rawSamples: HKCategorySample[],
): HKCategorySample[][] {
  if (rawSamples.length === 0) return [];

  const sorted = [...rawSamples].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  const sessions: HKCategorySample[][] = [];
  let currentSession: HKCategorySample[] = [sorted[0]];

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

// ─── Workout enrichment (routes + heart-rate samples) ────────────────────────

type WorkoutProxy = Awaited<ReturnType<typeof queryWorkoutSamples>>[number];

async function loadRouteData(proxy: WorkoutProxy) {
  try {
    const routes = await proxy.getWorkoutRoutes();
    return routes.map((r) => ({
      locations: r.locations.map((loc) => ({
        latitude: loc.latitude,
        longitude: loc.longitude,
        altitude: loc.altitude,
        timestamp: loc.date ? toISO(loc.date) : new Date().toISOString(),
      })),
    }));
  } catch {
    return undefined;
  }
}

async function loadHeartRateSamples(
  proxy: WorkoutProxy,
): Promise<LibQuantitySample[] | undefined> {
  try {
    const startDate = new Date(proxy.startDate);
    const endDate = new Date(proxy.endDate);
    const samples = await queryQuantitySamples(
      "HKQuantityTypeIdentifierHeartRate",
      {
        limit: 0,
        ascending: true,
        filter: { date: { startDate, endDate } },
      },
    );
    return samples as unknown as LibQuantitySample[];
  } catch {
    return undefined;
  }
}

async function proxyToHKWorkout(proxy: WorkoutProxy): Promise<HKWorkout> {
  const [routeData, heartRateSamples] = await Promise.all([
    loadRouteData(proxy),
    loadHeartRateSamples(proxy),
  ]);
  return toHKWorkout(proxy as any, { routeData, heartRateSamples });
}

// ─── Main Import ─────────────────────────────────────────────────────────────

/**
 * Fetch all HealthKit data over the last `days`, shape it into Soma's raw
 * HK types, and return a payload ready to send to `api.soma.healthkit.syncAll`.
 */
export async function importAllHealthKitData(
  days: number = 90,
): Promise<HealthKitCollectedData> {
  await requestHealthKitAuthorization();

  const [
    workoutProxies,
    sleepRaw,
    bodyRaw,
    dailyRaw,
    nutritionRaw,
    menstruationRaw,
    athleteRaw,
  ] = await Promise.all([
    queryAllWorkouts(days),
    querySleepSamples(days),
    queryQuantitySamplesByTypes(BODY_QUANTITY_TYPES, days),
    queryQuantitySamplesByTypes(DAILY_QUANTITY_TYPES, days),
    queryQuantitySamplesByTypes(NUTRITION_QUANTITY_TYPES, days),
    queryMenstruationSamples(days),
    getAthleteCharacteristics(),
  ]);

  const workouts = await Promise.all(workoutProxies.map(proxyToHKWorkout));

  const sleepShaped = (sleepRaw as unknown as LibCategorySample[]).map(
    toHKCategorySample,
  );
  const sleepSessions = groupSleepSessions(sleepShaped);

  const bodySamples = bodyRaw.map(toHKQuantitySample);
  const dailySamples = dailyRaw.map(toHKQuantitySample);
  const nutritionSamples = nutritionRaw.map(toHKQuantitySample);
  const menstruationSamples = (
    menstruationRaw as unknown as LibCategorySample[]
  ).map(toHKCategorySample);
  const characteristics = toHKCharacteristics(athleteRaw);

  const parts: string[] = [];
  if (workouts.length > 0)
    parts.push(`${workouts.length} workout${workouts.length === 1 ? "" : "s"}`);
  if (sleepSessions.length > 0)
    parts.push(
      `${sleepSessions.length} sleep session${sleepSessions.length === 1 ? "" : "s"}`,
    );
  if (dailySamples.length > 0) parts.push("daily activity");
  if (bodySamples.length > 0) parts.push("body metrics");
  if (nutritionSamples.length > 0) parts.push("nutrition data");
  if (menstruationSamples.length > 0) parts.push("menstruation data");
  if (characteristics) parts.push("athlete profile");

  const summary =
    parts.length > 0 ? `Imported ${parts.join(", ")}` : "No health data found";

  if (__DEV__) {
    console.log(
      `[HealthKit] Import complete: ${workouts.length} workouts, ${sleepSessions.length} sleep sessions`,
    );
  }

  return {
    workouts,
    sleepSessions,
    bodySamples,
    dailySamples,
    nutritionSamples,
    menstruationSamples,
    characteristics,
    summary,
  };
}
