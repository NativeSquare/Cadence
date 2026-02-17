// =============================================================================
// Mock Data Generator for Development (Story 4.2)
// =============================================================================
// Generates realistic running activity data for testing the inference engine,
// visualizations, and full flow without real wearable devices.
//
// IMPORTANT: This does NOT replace real HealthKit/Strava integrations.
// Mock data is always tagged with source="mock" and can be cleaned up.

import { Id } from "../_generated/dataModel";

// ─── Types ───────────────────────────────────────────────────────────────────

export type TrainingProfile = "beginner" | "intermediate" | "advanced";

export type RunType = "easy" | "medium" | "long" | "tempo" | "intervals";

export type SessionType =
  | "easy"
  | "tempo"
  | "intervals"
  | "long_run"
  | "recovery"
  | "unstructured";

/** Parameters for a single mock activity */
export type MockActivityParams = {
  runnerId: Id<"runners">;
  userId: Id<"users">;
  startTime: number; // Unix timestamp ms
  runType: RunType;
  profile: TrainingProfile;
};

/** Generated mock activity matching the activities table schema */
export type MockActivity = {
  // Foreign keys
  runnerId: Id<"runners">;
  userId: Id<"users">;

  // Metadata
  externalId: string;
  source: "mock";
  startTime: number;
  endTime: number;
  activityType: "running";
  name: string;

  // Distance & Movement
  distanceMeters: number;
  durationSeconds: number;
  elevationGainMeters: number;
  steps: number;

  // Pace & Speed
  avgPaceSecondsPerKm: number;
  avgSpeedKmh: number;

  // Heart Rate
  avgHeartRate: number;
  maxHeartRate: number;
  minHeartRate: number;

  // Heart Rate Zones (minutes)
  hrZone1Minutes: number;
  hrZone2Minutes: number;
  hrZone3Minutes: number;
  hrZone4Minutes: number;
  hrZone5Minutes: number;

  // Training Load
  calories: number;
  trainingLoad: number;
  perceivedExertion: number;

  // Running Dynamics
  avgCadence: number;

  // Cadence-specific
  sessionType: SessionType;

  // Timestamps
  importedAt: number;
  lastSyncedAt: number;
};

// ─── Profile Configuration ───────────────────────────────────────────────────

type ProfileConfig = {
  runsPerWeek: [number, number]; // [min, max]
  distanceKm: Record<RunType, [number, number]>; // [min, max]
  paceMinPerKm: Record<RunType, [number, number]>; // [min, max]
  restWeekFrequency: number; // Every N weeks
  baseHeartRate: number; // Avg resting HR for profile
};

const PROFILES: Record<TrainingProfile, ProfileConfig> = {
  beginner: {
    runsPerWeek: [2, 3],
    distanceKm: {
      easy: [3, 5],
      medium: [5, 7],
      long: [8, 10],
      tempo: [4, 5],
      intervals: [3, 4],
    },
    paceMinPerKm: {
      easy: [7, 8],
      medium: [6.5, 7],
      long: [7, 7.5],
      tempo: [6, 6.5],
      intervals: [5.5, 6],
    },
    restWeekFrequency: 3,
    baseHeartRate: 75,
  },
  intermediate: {
    runsPerWeek: [4, 5],
    distanceKm: {
      easy: [5, 8],
      medium: [8, 12],
      long: [15, 18],
      tempo: [8, 10],
      intervals: [6, 8],
    },
    paceMinPerKm: {
      easy: [6, 6.5],
      medium: [5.5, 6],
      long: [6, 6.5],
      tempo: [5, 5.5],
      intervals: [4.5, 5],
    },
    restWeekFrequency: 4,
    baseHeartRate: 60,
  },
  advanced: {
    runsPerWeek: [5, 6],
    distanceKm: {
      easy: [8, 10],
      medium: [12, 15],
      long: [20, 25],
      tempo: [12, 15],
      intervals: [8, 10],
    },
    paceMinPerKm: {
      easy: [5, 5.5],
      medium: [4.5, 5],
      long: [5, 5.5],
      tempo: [4, 4.5],
      intervals: [3.5, 4],
    },
    restWeekFrequency: 4,
    baseHeartRate: 50,
  },
};

const RUN_NAMES: Record<RunType, string[]> = {
  easy: ["Easy Run", "Recovery Run", "Shake-out Run", "Morning Jog"],
  medium: ["Steady Run", "Aerobic Run", "General Aerobic", "Progression Run"],
  long: ["Long Run", "Weekend Long Run", "Endurance Run", "Sunday Long Run"],
  tempo: ["Tempo Run", "Threshold Run", "Lactate Threshold"],
  intervals: ["Interval Session", "Track Workout", "Speed Work", "Repeats"],
};

// ─── Utility Functions ───────────────────────────────────────────────────────

/** Generate random number in range [min, max] */
function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

/** Generate random integer in range [min, max] */
function randomIntInRange(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 1));
}

/** Pick random element from array */
function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Generate UUID for externalId */
function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── Core Generation Logic ───────────────────────────────────────────────────

/**
 * Calculate heart rate from pace using realistic correlation.
 * Faster pace = higher HR
 */
function calculateHeartRate(
  paceMinPerKm: number,
  profile: TrainingProfile
): { avg: number; max: number; min: number } {
  const config = PROFILES[profile];
  // HR increases as pace decreases (faster = higher HR)
  // Base HR varies by fitness level
  const hrBase = 200 - paceMinPerKm * 10 - (75 - config.baseHeartRate);
  const avgHr = Math.round(hrBase + randomInRange(-5, 5));

  return {
    avg: Math.max(100, Math.min(190, avgHr)),
    max: Math.max(110, Math.min(205, avgHr + randomIntInRange(15, 30))),
    min: Math.max(90, Math.min(avgHr - 20, config.baseHeartRate + 30)),
  };
}

/**
 * Calculate HR zone distribution based on run type.
 * Returns time in minutes for each zone.
 */
function calculateHRZones(
  durationMinutes: number,
  runType: RunType
): { z1: number; z2: number; z3: number; z4: number; z5: number } {
  const d = durationMinutes;

  switch (runType) {
    case "easy":
    case "long":
      // Easy/Long: 5% Zone 1, 75% Zone 2, 20% Zone 3
      return {
        z1: Math.round(d * 0.05),
        z2: Math.round(d * 0.75),
        z3: Math.round(d * 0.2),
        z4: 0,
        z5: 0,
      };
    case "medium":
      // Medium: 5% Zone 1, 50% Zone 2, 40% Zone 3, 5% Zone 4
      return {
        z1: Math.round(d * 0.05),
        z2: Math.round(d * 0.5),
        z3: Math.round(d * 0.4),
        z4: Math.round(d * 0.05),
        z5: 0,
      };
    case "tempo":
      // Tempo: 5% Zone 1, 15% Zone 2, 30% Zone 3, 45% Zone 4, 5% Zone 5
      return {
        z1: Math.round(d * 0.05),
        z2: Math.round(d * 0.15),
        z3: Math.round(d * 0.3),
        z4: Math.round(d * 0.45),
        z5: Math.round(d * 0.05),
      };
    case "intervals":
      // Intervals: 10% Zone 1 (rest), 20% Zone 2 (jog), 20% Zone 3, 30% Zone 4, 20% Zone 5
      return {
        z1: Math.round(d * 0.1),
        z2: Math.round(d * 0.2),
        z3: Math.round(d * 0.2),
        z4: Math.round(d * 0.3),
        z5: Math.round(d * 0.2),
      };
    default:
      return { z1: d * 0.1, z2: d * 0.7, z3: d * 0.2, z4: 0, z5: 0 };
  }
}

/**
 * Calculate calories from distance and pace.
 * ~70 cal/km average, faster = more calories
 */
function calculateCalories(distanceKm: number, paceMinPerKm: number): number {
  // Faster pace burns more calories per km
  const caloriesPerKm = 60 + (7 - paceMinPerKm) * 5;
  return Math.round(distanceKm * Math.max(55, Math.min(90, caloriesPerKm)));
}

/**
 * Calculate training stress score (TSS) from duration and intensity.
 */
function calculateTrainingLoad(
  durationMinutes: number,
  runType: RunType
): number {
  const intensityFactors: Record<RunType, number> = {
    easy: 0.6,
    medium: 0.75,
    long: 0.65,
    tempo: 0.9,
    intervals: 1.0,
  };
  const factor = intensityFactors[runType];
  // TSS = (duration / 60) * IF^2 * 100
  return Math.round((durationMinutes / 60) * factor * factor * 100);
}

/**
 * Map run type to session type for training classification.
 */
function runTypeToSessionType(runType: RunType): SessionType {
  const mapping: Record<RunType, SessionType> = {
    easy: "easy",
    medium: "unstructured",
    long: "long_run",
    tempo: "tempo",
    intervals: "intervals",
  };
  return mapping[runType];
}

/**
 * Map run type to perceived exertion (RPE 1-10).
 */
function getPerceivedExertion(runType: RunType): number {
  const rpeRanges: Record<RunType, [number, number]> = {
    easy: [3, 4],
    medium: [5, 6],
    long: [5, 7],
    tempo: [7, 8],
    intervals: [8, 9],
  };
  const [min, max] = rpeRanges[runType];
  return randomIntInRange(min, max);
}

// ─── Main Generation Function ────────────────────────────────────────────────

/**
 * Generate a single mock activity with realistic correlations.
 */
export function generateMockActivity(params: MockActivityParams): MockActivity {
  const { runnerId, userId, startTime, runType, profile } = params;
  const config = PROFILES[profile];

  // Distance and pace
  const [distMin, distMax] = config.distanceKm[runType];
  const distanceKm = randomInRange(distMin, distMax);
  const distanceMeters = Math.round(distanceKm * 1000);

  const [paceMin, paceMax] = config.paceMinPerKm[runType];
  const paceMinPerKm = randomInRange(paceMin, paceMax);
  const avgPaceSecondsPerKm = Math.round(paceMinPerKm * 60);

  // Duration from distance and pace
  const durationMinutes = distanceKm * paceMinPerKm;
  const durationSeconds = Math.round(durationMinutes * 60);

  // End time
  const endTime = startTime + durationSeconds * 1000;

  // Heart rate
  const hr = calculateHeartRate(paceMinPerKm, profile);

  // HR zones
  const zones = calculateHRZones(durationMinutes, runType);

  // Derived metrics
  const calories = calculateCalories(distanceKm, paceMinPerKm);
  const trainingLoad = calculateTrainingLoad(durationMinutes, runType);

  // Steps: ~1400 steps/km average
  const stepsPerKm = 1300 + randomIntInRange(0, 200);
  const steps = Math.round(distanceKm * stepsPerKm);

  // Elevation: varies by run type
  const elevationBase = runType === "long" ? 20 : runType === "intervals" ? 5 : 10;
  const elevationGainMeters = Math.round(
    distanceKm * elevationBase * randomInRange(0.5, 1.5)
  );

  // Speed from pace
  const avgSpeedKmh = 60 / paceMinPerKm;

  // Cadence: 160-185 spm typical
  const avgCadence = 165 + randomIntInRange(-5, 15);

  const now = Date.now();

  return {
    runnerId,
    userId,
    externalId: `mock-${generateUUID()}`,
    source: "mock",
    startTime,
    endTime,
    activityType: "running",
    name: randomPick(RUN_NAMES[runType]),
    distanceMeters,
    durationSeconds,
    elevationGainMeters,
    steps,
    avgPaceSecondsPerKm,
    avgSpeedKmh: Math.round(avgSpeedKmh * 10) / 10,
    avgHeartRate: hr.avg,
    maxHeartRate: hr.max,
    minHeartRate: hr.min,
    hrZone1Minutes: zones.z1,
    hrZone2Minutes: zones.z2,
    hrZone3Minutes: zones.z3,
    hrZone4Minutes: zones.z4,
    hrZone5Minutes: zones.z5,
    calories,
    trainingLoad,
    perceivedExertion: getPerceivedExertion(runType),
    avgCadence,
    sessionType: runTypeToSessionType(runType),
    importedAt: now,
    lastSyncedAt: now,
  };
}

// ─── Training Block Generation ───────────────────────────────────────────────

/**
 * Generate a training week with realistic structure.
 */
export function generateTrainingWeek(
  runnerId: Id<"runners">,
  userId: Id<"users">,
  profile: TrainingProfile,
  weekStartDate: Date,
  weekNumber: number
): MockActivity[] {
  const config = PROFILES[profile];
  const isRestWeek = weekNumber % config.restWeekFrequency === 0;

  // Determine runs this week
  const [minRuns, maxRuns] = config.runsPerWeek;
  const runsThisWeek = isRestWeek
    ? Math.max(2, minRuns - 1)
    : randomIntInRange(minRuns, maxRuns);

  const activities: MockActivity[] = [];
  const runDays: number[] = [];

  // Distribute runs across the week (avoid consecutive days for hard sessions)
  const availableDays = [0, 1, 2, 3, 4, 5, 6]; // Sun-Sat
  for (let i = 0; i < runsThisWeek; i++) {
    const dayIndex = randomIntInRange(0, availableDays.length - 1);
    runDays.push(availableDays.splice(dayIndex, 1)[0]);
  }
  runDays.sort((a, b) => a - b);

  // Generate activities for each run day
  for (let i = 0; i < runDays.length; i++) {
    const dayOffset = runDays[i];
    const runDate = new Date(weekStartDate);
    runDate.setDate(runDate.getDate() + dayOffset);

    // Randomize start time (6am - 7pm)
    const startHour = randomIntInRange(6, 19);
    const startMinute = randomIntInRange(0, 59);
    runDate.setHours(startHour, startMinute, 0, 0);

    // Determine run type
    let runType: RunType;
    if (!isRestWeek && i === runDays.length - 1) {
      // Last run of week is usually long run (unless rest week)
      runType = "long";
    } else if (!isRestWeek && Math.random() < 0.15 && profile !== "beginner") {
      // 15% chance of tempo/intervals for non-beginners
      runType = Math.random() < 0.5 ? "tempo" : "intervals";
    } else if (Math.random() < 0.3) {
      runType = "medium";
    } else {
      runType = "easy";
    }

    // Rest week: only easy runs
    if (isRestWeek) {
      runType = "easy";
    }

    activities.push(
      generateMockActivity({
        runnerId,
        userId,
        startTime: runDate.getTime(),
        runType,
        profile,
      })
    );
  }

  return activities;
}

/**
 * Generate a training block spanning multiple weeks.
 */
export function generateTrainingBlock(
  runnerId: Id<"runners">,
  userId: Id<"users">,
  profile: TrainingProfile,
  weeks: number,
  endDate?: Date
): MockActivity[] {
  const activities: MockActivity[] = [];
  const end = endDate ?? new Date();

  // Start from weeks ago
  const startDate = new Date(end);
  startDate.setDate(startDate.getDate() - weeks * 7);

  // Reset to start of week (Sunday)
  const dayOfWeek = startDate.getDay();
  startDate.setDate(startDate.getDate() - dayOfWeek);
  startDate.setHours(0, 0, 0, 0);

  for (let week = 0; week < weeks; week++) {
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() + week * 7);

    const weekActivities = generateTrainingWeek(
      runnerId,
      userId,
      profile,
      weekStart,
      week + 1
    );
    activities.push(...weekActivities);
  }

  // Sort by start time
  activities.sort((a, b) => a.startTime - b.startTime);

  return activities;
}
