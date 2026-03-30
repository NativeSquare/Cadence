// ─── Shared Utilities ────────────────────────────────────────────────────────
// Pure helper functions used across HealthKit transformer modules.

import type { HKDevice, HKQuantitySample, HKSource } from "./types.js";

/**
 * Compute the difference in seconds between two ISO-8601 timestamps.
 */
export function diffSeconds(start: string, end: string): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / 1000;
}

/**
 * Build the start-of-day and end-of-day ISO-8601 strings for a date.
 */
export function dayRange(date: {
  year: number;
  month: number;
  day: number;
}): { start_time: string; end_time: string } {
  const pad = (n: number) => String(n).padStart(2, "0");
  const dateStr = `${date.year}-${pad(date.month)}-${pad(date.day)}`;
  return {
    start_time: `${dateStr}T00:00:00.000Z`,
    end_time: `${dateStr}T23:59:59.999Z`,
  };
}

/**
 * Find the earliest startDate and latest endDate in an array of samples.
 * Returns ISO-8601 strings. Falls back to provided defaults if array is empty.
 */
export function sampleTimeRange(
  samples: Array<{ startDate: string; endDate: string }>,
  fallback?: { start_time: string; end_time: string },
): { start_time: string; end_time: string } {
  if (samples.length === 0) {
    return (
      fallback ?? {
        start_time: new Date().toISOString(),
        end_time: new Date().toISOString(),
      }
    );
  }

  let minStart = samples[0].startDate;
  let maxEnd = samples[0].endDate;

  for (const s of samples) {
    if (s.startDate < minStart) minStart = s.startDate;
    if (s.endDate > maxEnd) maxEnd = s.endDate;
  }

  return { start_time: minStart, end_time: maxEnd };
}

/**
 * Build a Soma DeviceData object from HealthKit source and device metadata.
 */
export function buildDeviceData(
  source?: HKSource,
  device?: HKDevice,
):
  | {
      name?: string;
      manufacturer?: string;
      hardware_version?: string;
      software_version?: string;
    }
  | undefined {
  if (!source && !device) return undefined;
  return {
    name: device?.name ?? source?.name,
    manufacturer: device?.manufacturer,
    hardware_version: device?.hardwareVersion,
    software_version: device?.softwareVersion,
  };
}

/**
 * Filter an array of HKQuantitySamples by sampleType identifier.
 */
export function filterByType(
  samples: HKQuantitySample[],
  sampleType: string,
): HKQuantitySample[] {
  return samples.filter((s) => s.sampleType === sampleType);
}

/**
 * Sum the values of quantity samples.
 */
export function sumValues(samples: HKQuantitySample[]): number {
  return samples.reduce((acc, s) => acc + s.value, 0);
}

/**
 * Average the values of quantity samples.
 * Returns undefined if the array is empty.
 */
export function avgValue(samples: HKQuantitySample[]): number | undefined {
  if (samples.length === 0) return undefined;
  return sumValues(samples) / samples.length;
}

/**
 * Min value in a set of quantity samples.
 * Returns undefined if the array is empty.
 */
export function minValue(samples: HKQuantitySample[]): number | undefined {
  if (samples.length === 0) return undefined;
  return Math.min(...samples.map((s) => s.value));
}

/**
 * Max value in a set of quantity samples.
 * Returns undefined if the array is empty.
 */
export function maxValue(samples: HKQuantitySample[]): number | undefined {
  if (samples.length === 0) return undefined;
  return Math.max(...samples.map((s) => s.value));
}
