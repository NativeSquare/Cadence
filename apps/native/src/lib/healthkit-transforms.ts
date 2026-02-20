// ─── HealthKit → Soma Unified Schema Transforms ─────────────────────────────
//
// App-owned transformations from @kingstinct/react-native-healthkit library
// types directly to Soma's unified (Terra-style) schema shapes.
//
// These functions produce objects ready to spread into soma.ingestX() calls
// alongside connectionId and userId.

// ─── Library Input Types ─────────────────────────────────────────────────────
// Structural interfaces describing what @kingstinct/react-native-healthkit
// query functions return. Only the fields we actually use are listed.

export interface LibQuantitySample {
  uuid: string;
  quantityType: string;
  startDate: string | Date;
  endDate: string | Date;
  quantity: number;
  unit: string;
  sourceRevision?: {
    source?: { name?: string; bundleIdentifier?: string };
  };
  device?: {
    name?: string | null;
    manufacturer?: string | null;
    model?: string | null;
    hardwareVersion?: string | null;
    softwareVersion?: string | null;
  };
}

export interface LibCategorySample {
  uuid: string;
  categoryType: string;
  startDate: string | Date;
  endDate: string | Date;
  value: number;
  sourceRevision?: {
    source?: { name?: string; bundleIdentifier?: string };
  };
  device?: {
    name?: string | null;
    manufacturer?: string | null;
    model?: string | null;
    hardwareVersion?: string | null;
    softwareVersion?: string | null;
  };
}

export type WorkoutRoute = {
  locations: Array<{
    latitude: number;
    longitude: number;
    altitude?: number;
    timestamp: string;
  }>;
};

export interface AthleteCharacteristics {
  biologicalSex?: "female" | "male" | "other" | "notSet";
  dateOfBirth?: string;
  bloodType?: string;
  fitzpatrickSkinType?: number;
  wheelchairUse?: boolean;
}

// ─── HK Category Constants ──────────────────────────────────────────────────

export const HKSleepCategory = {
  InBed: 0,
  AsleepUnspecified: 1,
  Awake: 2,
  AsleepCore: 3,
  AsleepDeep: 4,
  AsleepREM: 5,
} as const;

const HKMenstrualFlowCategory = {
  Unspecified: 1,
  Light: 2,
  Medium: 3,
  Heavy: 4,
  None: 5,
} as const;

// ─── Activity Type Map ───────────────────────────────────────────────────────
// HKWorkoutActivityType raw values → Terra ActivityType enum.
// HK: https://developer.apple.com/documentation/healthkit/hkworkoutactivitytype
// Terra: https://docs.tryterra.co/reference/health-and-fitness-api/data-models#activitytype

const activityTypeMap: Record<number, number> = {
  1: 27,   // AmericanFootball → American Football
  2: 119,  // Archery → Archery
  3: 28,   // AustralianFootball → Australian Football
  4: 10,   // Badminton → Badminton
  5: 11,   // Baseball → Baseball
  6: 12,   // Basketball → Basketball
  7: 108,  // Bowling → Other
  8: 20,   // Boxing → Boxing
  9: 52,   // Climbing → Rock Climbing
  10: 23,  // Cricket → Cricket
  11: 113, // CrossTraining → Crossfit
  12: 106, // Curling → Curling
  13: 1,   // Cycling → Biking
  14: 24,  // Dance → Dancing
  15: 24,  // DanceInspiredTraining → Dancing
  16: 25,  // Elliptical → Elliptical
  17: 37,  // EquestrianSports → Horseback Riding
  18: 26,  // Fencing → Fencing
  19: 131, // Fishing → Fishing
  20: 80,  // FunctionalStrengthTraining → Strength Training
  21: 32,  // Golf → Golf
  22: 33,  // Gymnastics → Gymnastics
  23: 34,  // Handball → Handball
  24: 35,  // Hiking → Hiking
  25: 36,  // Hockey → Hockey
  26: 108, // Hunting → Other
  27: 124, // Lacrosse → Lacrosse
  28: 44,  // MartialArts → Martial Arts
  29: 45,  // MindAndBody → Meditation
  30: 123, // MixedMetabolicCardioTraining → Cardio Training
  31: 129, // PaddleSports → Paddling
  32: 108, // Play → Other
  33: 125, // PreparationAndRecovery → Stretching
  34: 51,  // Racquetball → Racquetball
  35: 53,  // Rowing → Rowing
  36: 55,  // Rugby → Rugby
  37: 8,   // Running → Running
  38: 59,  // Sailing → Sailing
  39: 62,  // SkatingSports → Skating
  40: 65,  // SnowSports → Skiing
  41: 29,  // Soccer → English Football
  42: 120, // Softball → Softball
  43: 76,  // Squash → Squash
  44: 77,  // StairClimbing → Stair Climbing
  45: 81,  // SurfingSports → Surfing
  46: 82,  // Swimming → Swimming
  47: 85,  // TableTennis → Table Tennis
  48: 87,  // Tennis → Tennis
  49: 8,   // TrackAndField → Running
  50: 80,  // TraditionalStrengthTraining → Strength Training
  51: 89,  // Volleyball → Volleyball
  52: 7,   // Walking → Walking
  53: 82,  // WaterFitness → Swimming
  54: 96,  // WaterPolo → Waterpolo
  55: 108, // WaterSports → Other
  56: 44,  // Wrestling → Martial Arts
  57: 100, // Yoga → Yoga
  58: 24,  // Barre → Dancing
  59: 21,  // CoreTraining → Calisthenics
  60: 67,  // CrossCountrySkiing → Cross Country Skiing
  61: 68,  // DownhillSkiing → Downhill Skiing
  62: 125, // Flexibility → Stretching
  63: 114, // HighIntensityIntervalTraining → HIIT
  64: 39,  // JumpRope → Jumping Rope
  65: 42,  // Kickboxing → Kickboxing
  66: 49,  // Pilates → Pilates
  67: 73,  // Snowboarding → Snowboarding
  68: 77,  // Stairs → Stair Climbing
  69: 78,  // StepTraining → Stair Climbing Machine
  70: 98,  // WheelchairWalkPace → Wheelchair
  71: 98,  // WheelchairRunPace → Wheelchair
  72: 45,  // TaiChi → Meditation
  73: 123, // MixedCardio → Cardio Training
  74: 14,  // HandCycling → Handbiking
  75: 30,  // DiscSports → Frisbee
  76: 108, // FitnessGaming → Other
  77: 24,  // CardioDance → Dancing
  78: 24,  // SocialDance → Dancing
  79: 108, // Pickleball → Other
  80: 125, // Cooldown → Stretching
  82: 126, // SwimBikeRun → Triathlon
  83: 108, // Transition → Other
  84: 102, // UnderwaterDiving → Diving
  3000: 108, // Other → Other
};

export function mapActivityType(hkActivityType: number): number {
  return activityTypeMap[hkActivityType] ?? 108;
}

// ─── Sleep Level Map ─────────────────────────────────────────────────────────
// HKCategoryValueSleepAnalysis → Terra SleepLevel enum.
// Terra: 0=Unknown, 1=Awake, 2=Sleeping, 3=OutOfBed, 4=Light, 5=Deep, 6=REM

const sleepLevelMap: Record<number, number> = {
  [HKSleepCategory.InBed]: 2,
  [HKSleepCategory.AsleepUnspecified]: 2,
  [HKSleepCategory.Awake]: 1,
  [HKSleepCategory.AsleepCore]: 4,
  [HKSleepCategory.AsleepDeep]: 5,
  [HKSleepCategory.AsleepREM]: 6,
};

export function mapSleepLevel(hkSleepValue: number): number {
  return sleepLevelMap[hkSleepValue] ?? 0;
}

export function isAsleepCategory(hkSleepValue: number): boolean {
  return (
    hkSleepValue === HKSleepCategory.AsleepUnspecified ||
    hkSleepValue === HKSleepCategory.AsleepCore ||
    hkSleepValue === HKSleepCategory.AsleepDeep ||
    hkSleepValue === HKSleepCategory.AsleepREM
  );
}

// ─── Menstruation Flow Map ───────────────────────────────────────────────────
// HKCategoryValueMenstrualFlow → Terra MenstruationFlow enum.
// Terra: 0=UNKNOWN, 1=NONE, 2=LIGHT, 3=MEDIUM, 4=HEAVY, 5=HAD

const menstruationFlowMap: Record<number, number> = {
  [HKMenstrualFlowCategory.Unspecified]: 5,
  [HKMenstrualFlowCategory.Light]: 2,
  [HKMenstrualFlowCategory.Medium]: 3,
  [HKMenstrualFlowCategory.Heavy]: 4,
  [HKMenstrualFlowCategory.None]: 1,
};

export function mapMenstruationFlow(hkFlowValue: number): number {
  return menstruationFlowMap[hkFlowValue] ?? 0;
}

// ─── Utilities ───────────────────────────────────────────────────────────────

export function toISO(date: string | Date): string {
  return date instanceof Date ? date.toISOString() : date;
}

export function diffSeconds(start: string | Date, end: string | Date): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / 1000;
}

export function sampleTimeRange(
  samples: Array<{ startDate: string | Date; endDate: string | Date }>,
): { start_time: string; end_time: string } {
  if (samples.length === 0) {
    const now = new Date().toISOString();
    return { start_time: now, end_time: now };
  }

  let minStart = toISO(samples[0].startDate);
  let maxEnd = toISO(samples[0].endDate);

  for (const s of samples) {
    const start = toISO(s.startDate);
    const end = toISO(s.endDate);
    if (start < minStart) minStart = start;
    if (end > maxEnd) maxEnd = end;
  }

  return { start_time: minStart, end_time: maxEnd };
}

export function buildDeviceData(
  source?: { name?: string } | null,
  device?: {
    name?: string | null;
    manufacturer?: string | null;
    hardwareVersion?: string | null;
    softwareVersion?: string | null;
  } | null,
) {
  if (!source && !device) return undefined;
  return {
    name: (device?.name ?? source?.name) || undefined,
    manufacturer: device?.manufacturer || undefined,
    hardware_version: device?.hardwareVersion || undefined,
    software_version: device?.softwareVersion || undefined,
  };
}

export function filterByType(
  samples: LibQuantitySample[],
  quantityType: string,
): LibQuantitySample[] {
  return samples.filter((s) => s.quantityType === quantityType);
}

export function sumValues(samples: LibQuantitySample[]): number {
  return samples.reduce((acc, s) => acc + s.quantity, 0);
}

export function avgValue(samples: LibQuantitySample[]): number | undefined {
  if (samples.length === 0) return undefined;
  return sumValues(samples) / samples.length;
}

export function minValue(samples: LibQuantitySample[]): number | undefined {
  if (samples.length === 0) return undefined;
  return Math.min(...samples.map((s) => s.quantity));
}

export function maxValue(samples: LibQuantitySample[]): number | undefined {
  if (samples.length === 0) return undefined;
  return Math.max(...samples.map((s) => s.quantity));
}

// ─── Output Types ────────────────────────────────────────────────────────────

export type ActivityData = {
  metadata: {
    summary_id: string;
    start_time: string;
    end_time: string;
    type: number;
    upload_type: number;
    name: string | undefined;
  };
  active_durations_data: {
    activity_seconds: number;
  };
  calories_data?: {
    total_burned_calories: number;
  };
  device_data?: {
    name?: string;
    manufacturer?: string;
    hardware_version?: string;
    software_version?: string;
  };
  distance_data?: {
    summary: {
      distance_meters?: number;
      steps?: number;
      floors_climbed?: number;
      swimming?: { num_strokes: number };
    };
  };
  heart_rate_data?: {
    detailed: {
      hr_samples: Array<{ timestamp: string; bpm: number }>;
    };
    summary: {
      avg_hr_bpm?: number;
      max_hr_bpm?: number;
      min_hr_bpm?: number;
    };
  };
  position_data?: {
    position_samples: Array<{
      timestamp: string;
      coords_lat_lng_deg: number[];
    }>;
    start_pos_lat_lng_deg?: number[];
    end_pos_lat_lng_deg?: number[];
  };
  raw_payload?: Record<string, unknown>;
};

// ─── Transform: Sleep ────────────────────────────────────────────────────────

export function transformSleep(samples: LibCategorySample[]) {
  if (samples.length === 0) {
    throw new Error("transformSleep requires at least one sleep sample");
  }

  const sorted = [...samples].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  const sessionStart = toISO(sorted[0].startDate);
  const sessionEnd = toISO(sorted[sorted.length - 1].endDate);

  let deepSeconds = 0;
  let lightSeconds = 0;
  let remSeconds = 0;
  let awakeSeconds = 0;
  let asleepUnspecifiedSeconds = 0;
  let wakeupEvents = 0;
  let remEvents = 0;

  for (const sample of sorted) {
    const duration = diffSeconds(sample.startDate, sample.endDate);

    switch (sample.value) {
      case HKSleepCategory.AsleepDeep:
        deepSeconds += duration;
        break;
      case HKSleepCategory.AsleepCore:
        lightSeconds += duration;
        break;
      case HKSleepCategory.AsleepREM:
        remSeconds += duration;
        remEvents++;
        break;
      case HKSleepCategory.Awake:
        awakeSeconds += duration;
        wakeupEvents++;
        break;
      case HKSleepCategory.AsleepUnspecified:
        asleepUnspecifiedSeconds += duration;
        break;
    }
  }

  const totalAsleepSeconds =
    deepSeconds + lightSeconds + remSeconds + asleepUnspecifiedSeconds;
  const totalInBedSeconds = diffSeconds(sessionStart, sessionEnd);
  const sleepEfficiency =
    totalInBedSeconds > 0 ? totalAsleepSeconds / totalInBedSeconds : undefined;

  const hypnogramSamples = sorted
    .filter((s) => s.value !== HKSleepCategory.InBed)
    .map((s) => ({
      timestamp: toISO(s.startDate),
      level: mapSleepLevel(s.value),
    }));

  const isNap = totalInBedSeconds < 3 * 60 * 60;

  return {
    metadata: {
      start_time: sessionStart,
      end_time: sessionEnd,
      summary_id: sorted[0].uuid,
      upload_type: 2 as const,
      is_nap: isNap,
    },

    device_data: buildDeviceData(
      sorted[0].sourceRevision?.source,
      sorted[0].device,
    ),

    sleep_durations_data: {
      asleep: {
        duration_asleep_state_seconds: totalAsleepSeconds,
        duration_deep_sleep_state_seconds:
          deepSeconds > 0 ? deepSeconds : undefined,
        duration_light_sleep_state_seconds:
          lightSeconds > 0 ? lightSeconds : undefined,
        duration_REM_sleep_state_seconds:
          remSeconds > 0 ? remSeconds : undefined,
        num_REM_events: remEvents > 0 ? remEvents : undefined,
      },
      awake: {
        duration_awake_state_seconds:
          awakeSeconds > 0 ? awakeSeconds : undefined,
        num_wakeup_events: wakeupEvents > 0 ? wakeupEvents : undefined,
      },
      hypnogram_samples:
        hypnogramSamples.length > 0 ? hypnogramSamples : undefined,
      other: {
        duration_in_bed_seconds: totalInBedSeconds,
      },
      sleep_efficiency: sleepEfficiency,
    },
  };
}

// ─── Transform: Body ─────────────────────────────────────────────────────────

export function transformBody(
  samples: LibQuantitySample[],
  timeRange?: { start_time: string; end_time: string },
) {
  const range = timeRange ?? sampleTimeRange(samples);

  const hrSamples = filterByType(samples, "HKQuantityTypeIdentifierHeartRate");
  const hrvSamples = filterByType(samples, "HKQuantityTypeIdentifierHeartRateVariabilitySDNN");
  const restingHrSamples = filterByType(samples, "HKQuantityTypeIdentifierRestingHeartRate");
  const hasHeartData =
    hrSamples.length > 0 || hrvSamples.length > 0 || restingHrSamples.length > 0;

  const systolicSamples = filterByType(samples, "HKQuantityTypeIdentifierBloodPressureSystolic");
  const diastolicSamples = filterByType(samples, "HKQuantityTypeIdentifierBloodPressureDiastolic");

  const bpSamples: Array<{
    timestamp?: string;
    systolic_bp?: number;
    diastolic_bp?: number;
  }> = [];
  for (const sys of systolicSamples) {
    const dia = diastolicSamples.find(
      (d) => toISO(d.startDate) === toISO(sys.startDate),
    );
    bpSamples.push({
      timestamp: toISO(sys.startDate),
      systolic_bp: sys.quantity,
      diastolic_bp: dia?.quantity,
    });
  }

  const spo2Samples = filterByType(samples, "HKQuantityTypeIdentifierOxygenSaturation");
  const vo2Samples = filterByType(samples, "HKQuantityTypeIdentifierVO2Max");
  const hasOxygenData = spo2Samples.length > 0 || vo2Samples.length > 0;

  const tempSamples = filterByType(samples, "HKQuantityTypeIdentifierBodyTemperature");
  const glucoseSamples = filterByType(samples, "HKQuantityTypeIdentifierBloodGlucose");

  const weightSamples = filterByType(samples, "HKQuantityTypeIdentifierBodyMass");
  const heightSamples = filterByType(samples, "HKQuantityTypeIdentifierHeight");
  const bmiSamples = filterByType(samples, "HKQuantityTypeIdentifierBodyMassIndex");
  const bodyFatSamples = filterByType(samples, "HKQuantityTypeIdentifierBodyFatPercentage");
  const leanMassSamples = filterByType(samples, "HKQuantityTypeIdentifierLeanBodyMass");
  const hasMeasurements =
    weightSamples.length > 0 ||
    heightSamples.length > 0 ||
    bmiSamples.length > 0 ||
    bodyFatSamples.length > 0 ||
    leanMassSamples.length > 0;

  const firstSample = samples[0] as LibQuantitySample | undefined;

  return {
    metadata: {
      start_time: range.start_time,
      end_time: range.end_time,
    },

    device_data: buildDeviceData(
      firstSample?.sourceRevision?.source,
      firstSample?.device,
    ),

    heart_data: hasHeartData
      ? {
          heart_rate_data:
            hrSamples.length > 0
              ? {
                  detailed: {
                    hr_samples: hrSamples.map((s) => ({
                      timestamp: toISO(s.startDate),
                      bpm: s.quantity,
                    })),
                    hrv_samples_sdnn:
                      hrvSamples.length > 0
                        ? hrvSamples.map((s) => ({
                            timestamp: toISO(s.startDate),
                            hrv_sdnn: s.quantity,
                          }))
                        : undefined,
                  },
                  summary: {
                    avg_hr_bpm: avgValue(hrSamples),
                    max_hr_bpm: maxValue(hrSamples),
                    min_hr_bpm: minValue(hrSamples),
                    resting_hr_bpm: avgValue(restingHrSamples),
                    avg_hrv_sdnn: avgValue(hrvSamples),
                  },
                }
              : undefined,
        }
      : undefined,

    blood_pressure_data:
      bpSamples.length > 0
        ? { blood_pressure_samples: bpSamples }
        : undefined,

    oxygen_data: hasOxygenData
      ? {
          avg_saturation_percentage:
            avgValue(spo2Samples) != null
              ? avgValue(spo2Samples)! * 100
              : undefined,
          saturation_samples:
            spo2Samples.length > 0
              ? spo2Samples.map((s) => ({
                  timestamp: toISO(s.startDate),
                  percentage: s.quantity * 100,
                }))
              : undefined,
          vo2_samples:
            vo2Samples.length > 0
              ? vo2Samples.map((s) => ({
                  timestamp: toISO(s.startDate),
                  vo2max_ml_per_min_per_kg: s.quantity,
                }))
              : undefined,
          vo2max_ml_per_min_per_kg:
            vo2Samples.length > 0
              ? vo2Samples[vo2Samples.length - 1].quantity
              : undefined,
        }
      : undefined,

    temperature_data:
      tempSamples.length > 0
        ? {
            body_temperature_samples: tempSamples.map((s) => ({
              timestamp: toISO(s.startDate),
              temperature_celsius: s.quantity,
            })),
          }
        : undefined,

    glucose_data:
      glucoseSamples.length > 0
        ? {
            blood_glucose_samples: glucoseSamples.map((s) => ({
              timestamp: toISO(s.startDate),
              blood_glucose_mg_per_dL: s.quantity,
            })),
            day_avg_blood_glucose_mg_per_dL: avgValue(glucoseSamples),
          }
        : undefined,

    measurements_data: hasMeasurements
      ? {
          measurements: [
            {
              measurement_time: toISO(
                (
                  weightSamples[0] ??
                  heightSamples[0] ??
                  bmiSamples[0] ??
                  bodyFatSamples[0] ??
                  leanMassSamples[0]
                )?.startDate ?? new Date(),
              ),
              weight_kg:
                weightSamples.length > 0
                  ? weightSamples[weightSamples.length - 1].quantity
                  : undefined,
              height_cm:
                heightSamples.length > 0
                  ? heightSamples[heightSamples.length - 1].quantity * 100
                  : undefined,
              BMI:
                bmiSamples.length > 0
                  ? bmiSamples[bmiSamples.length - 1].quantity
                  : undefined,
              bodyfat_percentage:
                bodyFatSamples.length > 0
                  ? bodyFatSamples[bodyFatSamples.length - 1].quantity * 100
                  : undefined,
              lean_mass_g:
                leanMassSamples.length > 0
                  ? leanMassSamples[leanMassSamples.length - 1].quantity * 1000
                  : undefined,
            },
          ],
        }
      : undefined,
  };
}

// ─── Transform: Daily ────────────────────────────────────────────────────────

export function transformDaily(
  samples: LibQuantitySample[],
  timeRange?: { start_time: string; end_time: string },
) {
  const range = timeRange ?? sampleTimeRange(samples);

  const stepSamples = filterByType(samples, "HKQuantityTypeIdentifierStepCount");
  const walkRunDistSamples = filterByType(samples, "HKQuantityTypeIdentifierDistanceWalkingRunning");
  const cyclingDistSamples = filterByType(samples, "HKQuantityTypeIdentifierDistanceCycling");
  const activeEnergySamples = filterByType(samples, "HKQuantityTypeIdentifierActiveEnergyBurned");
  const basalEnergySamples = filterByType(samples, "HKQuantityTypeIdentifierBasalEnergyBurned");
  const flightsSamples = filterByType(samples, "HKQuantityTypeIdentifierFlightsClimbed");
  const exerciseTimeSamples = filterByType(samples, "HKQuantityTypeIdentifierAppleExerciseTime");
  const standTimeSamples = filterByType(samples, "HKQuantityTypeIdentifierAppleStandTime");

  const hrSamples = filterByType(samples, "HKQuantityTypeIdentifierHeartRate");
  const hrvSamples = filterByType(samples, "HKQuantityTypeIdentifierHeartRateVariabilitySDNN");
  const restingHrSamples = filterByType(samples, "HKQuantityTypeIdentifierRestingHeartRate");
  const vo2Samples = filterByType(samples, "HKQuantityTypeIdentifierVO2Max");

  const totalSteps = sumValues(stepSamples);
  const totalDistanceMeters =
    sumValues(walkRunDistSamples) + sumValues(cyclingDistSamples);
  const activeCalories = sumValues(activeEnergySamples);
  const basalCalories = sumValues(basalEnergySamples);
  const floorsClimbed = sumValues(flightsSamples);
  const exerciseMinutes = sumValues(exerciseTimeSamples);
  const standMinutes = sumValues(standTimeSamples);

  const firstSample = samples[0] as LibQuantitySample | undefined;

  return {
    metadata: {
      start_time: range.start_time,
      end_time: range.end_time,
      upload_type: 1 as const,
    },

    device_data: buildDeviceData(
      firstSample?.sourceRevision?.source,
      firstSample?.device,
    ),

    active_durations_data: {
      activity_seconds: exerciseMinutes * 60,
      standing_seconds: standMinutes * 60,
    },

    calories_data: {
      BMR_calories: basalCalories > 0 ? basalCalories : undefined,
      net_activity_calories: activeCalories > 0 ? activeCalories : undefined,
      total_burned_calories:
        activeCalories + basalCalories > 0
          ? activeCalories + basalCalories
          : undefined,
    },

    distance_data: {
      steps: totalSteps > 0 ? totalSteps : undefined,
      distance_meters: totalDistanceMeters > 0 ? totalDistanceMeters : undefined,
      floors_climbed: floorsClimbed > 0 ? floorsClimbed : undefined,
      detailed:
        stepSamples.length > 0
          ? {
              step_samples: stepSamples.map((s) => ({
                timestamp: toISO(s.startDate),
                steps: s.quantity,
              })),
              distance_samples:
                walkRunDistSamples.length > 0
                  ? walkRunDistSamples.map((s) => ({
                      timestamp: toISO(s.startDate),
                      distance_meters: s.quantity,
                    }))
                  : undefined,
              floors_climbed_samples:
                flightsSamples.length > 0
                  ? flightsSamples.map((s) => ({
                      timestamp: toISO(s.startDate),
                      floors_climbed: s.quantity,
                    }))
                  : undefined,
            }
          : undefined,
    },

    heart_rate_data:
      hrSamples.length > 0
        ? {
            detailed: {
              hr_samples: hrSamples.map((s) => ({
                timestamp: toISO(s.startDate),
                bpm: s.quantity,
              })),
              hrv_samples_sdnn:
                hrvSamples.length > 0
                  ? hrvSamples.map((s) => ({
                      timestamp: toISO(s.startDate),
                      hrv_sdnn: s.quantity,
                    }))
                  : undefined,
            },
            summary: {
              avg_hr_bpm: avgValue(hrSamples),
              max_hr_bpm: maxValue(hrSamples),
              min_hr_bpm: minValue(hrSamples),
              resting_hr_bpm: avgValue(restingHrSamples),
              avg_hrv_sdnn: avgValue(hrvSamples),
            },
          }
        : undefined,

    oxygen_data:
      vo2Samples.length > 0
        ? {
            vo2max_ml_per_min_per_kg:
              vo2Samples[vo2Samples.length - 1].quantity,
            vo2_samples: vo2Samples.map((s) => ({
              timestamp: toISO(s.startDate),
              vo2max_ml_per_min_per_kg: s.quantity,
            })),
          }
        : undefined,
  };
}

// ─── Transform: Nutrition ────────────────────────────────────────────────────

export function transformNutrition(
  samples: LibQuantitySample[],
  timeRange?: { start_time: string; end_time: string },
) {
  const range = timeRange ?? sampleTimeRange(samples);

  const sum = (type: string) => {
    const filtered = filterByType(samples, type);
    return filtered.length > 0 ? sumValues(filtered) : undefined;
  };

  const calories = sum("HKQuantityTypeIdentifierDietaryEnergyConsumed");
  const protein = sum("HKQuantityTypeIdentifierDietaryProtein");
  const carbs = sum("HKQuantityTypeIdentifierDietaryCarbohydrates");
  const fat = sum("HKQuantityTypeIdentifierDietaryFatTotal");
  const saturatedFat = sum("HKQuantityTypeIdentifierDietaryFatSaturated");
  const fiber = sum("HKQuantityTypeIdentifierDietaryFiber");
  const sugar = sum("HKQuantityTypeIdentifierDietarySugar");
  const cholesterol = sum("HKQuantityTypeIdentifierDietaryCholesterol");
  const sodium = sum("HKQuantityTypeIdentifierDietarySodium");

  const calcium = sum("HKQuantityTypeIdentifierDietaryCalcium");
  const iron = sum("HKQuantityTypeIdentifierDietaryIron");
  const potassium = sum("HKQuantityTypeIdentifierDietaryPotassium");
  const vitaminA = sum("HKQuantityTypeIdentifierDietaryVitaminA");
  const vitaminB6 = sum("HKQuantityTypeIdentifierDietaryVitaminB6");
  const vitaminB12 = sum("HKQuantityTypeIdentifierDietaryVitaminB12");
  const vitaminC = sum("HKQuantityTypeIdentifierDietaryVitaminC");
  const vitaminD = sum("HKQuantityTypeIdentifierDietaryVitaminD");
  const vitaminE = sum("HKQuantityTypeIdentifierDietaryVitaminE");
  const vitaminK = sum("HKQuantityTypeIdentifierDietaryVitaminK");
  const zinc = sum("HKQuantityTypeIdentifierDietaryZinc");
  const magnesium = sum("HKQuantityTypeIdentifierDietaryMagnesium");
  const manganese = sum("HKQuantityTypeIdentifierDietaryManganese");
  const copper = sum("HKQuantityTypeIdentifierDietaryCopper");
  const selenium = sum("HKQuantityTypeIdentifierDietarySelenium");
  const chromium = sum("HKQuantityTypeIdentifierDietaryChromium");
  const folate = sum("HKQuantityTypeIdentifierDietaryFolate");
  const biotin = sum("HKQuantityTypeIdentifierDietaryBiotin");
  const niacin = sum("HKQuantityTypeIdentifierDietaryNiacin");
  const phosphorus = sum("HKQuantityTypeIdentifierDietaryPhosphorus");
  const riboflavin = sum("HKQuantityTypeIdentifierDietaryRiboflavin");
  const thiamin = sum("HKQuantityTypeIdentifierDietaryThiamin");
  const caffeine = sum("HKQuantityTypeIdentifierDietaryCaffeine");
  const iodine = sum("HKQuantityTypeIdentifierDietaryIodine");
  const chloride = sum("HKQuantityTypeIdentifierDietaryChloride");
  const pantothenicAcid = sum("HKQuantityTypeIdentifierDietaryPanthothenicAcid");
  const monoFat = sum("HKQuantityTypeIdentifierDietaryFatMonounsaturated");
  const polyFat = sum("HKQuantityTypeIdentifierDietaryFatPolyunsaturated");

  const waterSamples = filterByType(samples, "HKQuantityTypeIdentifierDietaryWater");
  const waterMl =
    waterSamples.length > 0 ? sumValues(waterSamples) * 1000 : undefined;

  const hasMacros =
    calories != null || protein != null || carbs != null || fat != null;
  const hasMicros =
    calcium != null || iron != null || vitaminC != null || zinc != null || magnesium != null;

  return {
    metadata: {
      start_time: range.start_time,
      end_time: range.end_time,
    },

    summary: {
      macros: hasMacros
        ? {
            calories,
            protein_g: protein,
            carbohydrates_g: carbs,
            fat_g: fat,
            saturated_fat_g: saturatedFat,
            fiber_g: fiber,
            sugar_g: sugar,
            cholesterol_mg: cholesterol,
            sodium_mg: sodium,
          }
        : undefined,
      micros: hasMicros
        ? {
            calcium_mg: calcium,
            iron_mg: iron,
            potassium_mg: potassium,
            vitamin_A_mg: vitaminA,
            vitamin_B6_mg: vitaminB6,
            vitamin_B12_mg: vitaminB12,
            vitamin_C_mg: vitaminC,
            vitamin_D_mg: vitaminD,
            vitamin_E_mg: vitaminE,
            vitamin_K_mg: vitaminK,
            zinc_mg: zinc,
            magnesium_mg: magnesium,
            manganese_mg: manganese,
            copper_mg: copper,
            selenium_mg: selenium,
            chromium_mg: chromium,
            folate_mg: folate,
            biotin_mg: biotin,
            niacin_mg: niacin,
            phosphorus_mg: phosphorus,
            riboflavin_mg: riboflavin,
            thiamin_mg: thiamin,
            caffeine_mg: caffeine,
            iodine_mg: iodine,
            chloride_mg: chloride,
            pantothenic_acid_mg: pantothenicAcid,
            monounsaturated_fat_g: monoFat,
            polyunsaturated_fat_g: polyFat,
          }
        : undefined,
      water_ml: waterMl,
    },
  };
}

// ─── Transform: Menstruation ─────────────────────────────────────────────────

export function transformMenstruation(
  samples: LibCategorySample[],
  timeRange?: { start_time: string; end_time: string },
) {
  if (samples.length === 0) {
    throw new Error(
      "transformMenstruation requires at least one menstrual flow sample",
    );
  }

  const range = timeRange ?? sampleTimeRange(samples);

  return {
    metadata: {
      start_time: range.start_time,
      end_time: range.end_time,
    },

    menstruation_data: {
      menstruation_flow: samples.map((s) => ({
        timestamp: toISO(s.startDate),
        flow: mapMenstruationFlow(s.value),
      })),
    },
  };
}

// ─── Transform: Athlete ──────────────────────────────────────────────────────

export function transformAthlete(characteristics: AthleteCharacteristics) {
  const sexMap: Record<string, string> = {
    female: "female",
    male: "male",
    other: "other",
  };

  return {
    sex:
      characteristics.biologicalSex &&
      characteristics.biologicalSex !== "notSet"
        ? sexMap[characteristics.biologicalSex]
        : undefined,
    date_of_birth: characteristics.dateOfBirth,
  };
}

// ─── Derived Output Types ────────────────────────────────────────────────────

export type SleepData = ReturnType<typeof transformSleep>;
export type BodyData = ReturnType<typeof transformBody>;
export type DailyData = ReturnType<typeof transformDaily>;
export type NutritionData = ReturnType<typeof transformNutrition>;
export type MenstruationData = ReturnType<typeof transformMenstruation>;
export type AthleteData = ReturnType<typeof transformAthlete>;
