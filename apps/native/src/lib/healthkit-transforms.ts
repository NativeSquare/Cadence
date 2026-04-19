// ─── Library → Soma HK Shapers ──────────────────────────────────────────────
//
// Thin converters from @kingstinct/react-native-healthkit output types to
// Soma's raw HK* input types (defined in @nativesquare/soma/healthkit).
// Soma performs the actual transforms to its unified schema server-side.

import type { BiologicalSex as LibBiologicalSex } from "@kingstinct/react-native-healthkit";
import type {
  HKBiologicalSex,
  HKCategorySample,
  HKCharacteristics,
  HKDevice,
  HKQuantitySample,
  HKSource,
  HKWorkout,
  HKWorkoutRoute,
} from "@nativesquare/soma/healthkit";

// ─── Primitive helpers ─────────────────────────────────────────────────────

export function toISO(date: string | Date | number): string {
  if (date instanceof Date) return date.toISOString();
  if (typeof date === "number") return new Date(date).toISOString();
  return new Date(date).toISOString();
}

// ─── Library sample shapes (only the fields we consume) ────────────────────

export interface LibQuantitySample {
  uuid: string;
  quantityType: string;
  startDate: string | Date;
  endDate: string | Date;
  quantity: number;
  unit: string;
  sourceRevision?: {
    source?: { name?: string; bundleIdentifier?: string } | null;
  };
  device?: {
    name?: string | null;
    manufacturer?: string | null;
    model?: string | null;
    hardwareVersion?: string | null;
    softwareVersion?: string | null;
  } | null;
}

export interface LibCategorySample {
  uuid: string;
  categoryType: string;
  startDate: string | Date;
  endDate: string | Date;
  value: number;
  sourceRevision?: {
    source?: { name?: string; bundleIdentifier?: string } | null;
  };
  device?: {
    name?: string | null;
    manufacturer?: string | null;
    model?: string | null;
    hardwareVersion?: string | null;
    softwareVersion?: string | null;
  } | null;
}

export interface LibWorkout {
  uuid: string;
  workoutActivityType: number;
  startDate: string | Date;
  endDate: string | Date;
  duration?: { quantity?: number } | number;
  totalEnergyBurned?: { quantity?: number };
  totalDistance?: { quantity?: number };
  totalSwimmingStrokeCount?: { quantity?: number };
  totalFlightsClimbed?: { quantity?: number };
  sourceRevision?: {
    source?: { name?: string; bundleIdentifier?: string } | null;
  };
  device?: LibQuantitySample["device"];
}

export interface LibWorkoutRoute {
  locations: ReadonlyArray<{
    latitude: number;
    longitude: number;
    altitude?: number;
    date?: string | Date;
    timestamp?: string | Date;
  }>;
}

export interface LibAthleteCharacteristics {
  biologicalSex?: LibBiologicalSex | number;
  dateOfBirth?: Date | string;
  bloodType?: string | number;
  fitzpatrickSkinType?: number;
  wheelchairUse?: boolean | number;
}

// ─── Shapers ───────────────────────────────────────────────────────────────

export function toHKSource(
  sourceRevision?: { source?: { name?: string; bundleIdentifier?: string } | null } | null,
): HKSource | undefined {
  const src = sourceRevision?.source;
  if (!src || !src.name || !src.bundleIdentifier) return undefined;
  return { name: src.name, bundleIdentifier: src.bundleIdentifier };
}

export function toHKDevice(device?: LibQuantitySample["device"]): HKDevice | undefined {
  if (!device) return undefined;
  const out: HKDevice = {};
  if (device.name) out.name = device.name;
  if (device.manufacturer) out.manufacturer = device.manufacturer;
  if (device.model) out.model = device.model;
  if (device.hardwareVersion) out.hardwareVersion = device.hardwareVersion;
  if (device.softwareVersion) out.softwareVersion = device.softwareVersion;
  return Object.keys(out).length > 0 ? out : undefined;
}

export function toHKQuantitySample(s: LibQuantitySample): HKQuantitySample {
  return {
    uuid: s.uuid,
    sampleType: s.quantityType,
    startDate: toISO(s.startDate),
    endDate: toISO(s.endDate),
    value: s.quantity,
    unit: s.unit,
    source: toHKSource(s.sourceRevision),
    device: toHKDevice(s.device),
  };
}

export function toHKCategorySample(s: LibCategorySample): HKCategorySample {
  return {
    uuid: s.uuid,
    sampleType: s.categoryType,
    startDate: toISO(s.startDate),
    endDate: toISO(s.endDate),
    value: s.value,
    source: toHKSource(s.sourceRevision),
    device: toHKDevice(s.device),
  };
}

export function toHKWorkoutRoute(route: LibWorkoutRoute): HKWorkoutRoute {
  return {
    locations: route.locations.map((loc) => ({
      latitude: loc.latitude,
      longitude: loc.longitude,
      altitude: loc.altitude,
      timestamp: toISO(loc.timestamp ?? loc.date ?? new Date()),
    })),
  };
}

export function toHKWorkout(
  w: LibWorkout,
  extras?: {
    heartRateSamples?: LibQuantitySample[];
    routeData?: LibWorkoutRoute[];
    totalDistanceOverride?: number;
  },
): HKWorkout {
  const duration =
    typeof w.duration === "number" ? w.duration : w.duration?.quantity ?? 0;

  return {
    uuid: w.uuid,
    workoutActivityType: w.workoutActivityType,
    startDate: toISO(w.startDate),
    endDate: toISO(w.endDate),
    duration,
    totalEnergyBurned: w.totalEnergyBurned?.quantity,
    totalDistance: extras?.totalDistanceOverride ?? w.totalDistance?.quantity,
    totalSwimmingStrokeCount: w.totalSwimmingStrokeCount?.quantity,
    totalFlightsClimbed: w.totalFlightsClimbed?.quantity,
    source: toHKSource(w.sourceRevision),
    device: toHKDevice(w.device),
    heartRateSamples: extras?.heartRateSamples?.map(toHKQuantitySample),
    routeData: extras?.routeData?.map(toHKWorkoutRoute),
  };
}

// BiologicalSex enum: 0=notSet, 1=female, 2=male, 3=other
const biologicalSexMap: Record<number, HKBiologicalSex> = {
  0: "notSet",
  1: "female",
  2: "male",
  3: "other",
};

export function toHKCharacteristics(
  c: LibAthleteCharacteristics | null,
): HKCharacteristics | undefined {
  if (!c) return undefined;

  const biologicalSex =
    typeof c.biologicalSex === "number"
      ? biologicalSexMap[c.biologicalSex]
      : typeof c.biologicalSex === "string"
        ? (c.biologicalSex as HKBiologicalSex)
        : undefined;

  const out: HKCharacteristics = {};
  if (biologicalSex) out.biologicalSex = biologicalSex;
  if (c.dateOfBirth) out.dateOfBirth = toISO(c.dateOfBirth);
  if (c.bloodType != null) out.bloodType = String(c.bloodType);
  if (typeof c.fitzpatrickSkinType === "number") {
    out.fitzpatrickSkinType = c.fitzpatrickSkinType;
  }
  if (c.wheelchairUse != null) {
    out.wheelchairUse =
      typeof c.wheelchairUse === "boolean"
        ? c.wheelchairUse
        : c.wheelchairUse === 2;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}
