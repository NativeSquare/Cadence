// ─── Sleep Transformer ───────────────────────────────────────────────────────
// Transforms Apple HealthKit sleep analysis samples into the Soma Sleep schema.

import type { HKCategorySample } from "./types.js";
import { HKSleepCategory } from "./types.js";
import { mapSleepLevel, isAsleepCategory } from "./maps/sleep-level.js";
import { diffSeconds, buildDeviceData } from "./utils.js";

/**
 * The output shape of {@link transformSleep}.
 */
export type SleepData = ReturnType<typeof transformSleep>;

/**
 * Transform an array of HealthKit sleep analysis category samples into a
 * Soma Sleep document shape.
 *
 * HealthKit stores sleep as individual `HKCategorySample` records — one per
 * sleep stage segment. This function aggregates them into a single session
 * with computed durations, a hypnogram, and efficiency score.
 *
 * @param samples - Array of HKCategorySample with sampleType "HKCategoryTypeIdentifierSleepAnalysis".
 *                  Should represent a single sleep session (all samples from one night).
 * @returns Soma Sleep fields (without connectionId/userId)
 *
 * @example
 * ```ts
 * const data = transformSleep(hkSleepSamples);
 * await soma.ingestSleep(ctx, { connectionId, userId, ...data });
 * ```
 */
export function transformSleep(samples: HKCategorySample[]) {
  if (samples.length === 0) {
    throw new Error("transformSleep requires at least one sleep sample");
  }

  // Sort by start time
  const sorted = [...samples].sort(
    (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
  );

  const sessionStart = sorted[0].startDate;
  const sessionEnd = sorted[sorted.length - 1].endDate;

  // Compute stage durations
  let deepSeconds = 0;
  let lightSeconds = 0;
  let remSeconds = 0;
  let awakeSeconds = 0;
  let asleepUnspecifiedSeconds = 0;
  let inBedSeconds = 0;
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
      case HKSleepCategory.InBed:
        inBedSeconds += duration;
        break;
    }
  }

  const totalAsleepSeconds =
    deepSeconds + lightSeconds + remSeconds + asleepUnspecifiedSeconds;
  const totalInBedSeconds = diffSeconds(sessionStart, sessionEnd);
  const sleepEfficiency =
    totalInBedSeconds > 0 ? totalAsleepSeconds / totalInBedSeconds : undefined;

  // Build hypnogram
  const hypnogramSamples = sorted
    .filter((s) => s.value !== HKSleepCategory.InBed)
    .map((s) => ({
      timestamp: s.startDate,
      level: mapSleepLevel(s.value),
    }));

  // Determine if this is a nap (< 3 hours)
  const isNap = totalInBedSeconds < 3 * 60 * 60;

  const firstSample = sorted[0];

  return {
    metadata: {
      start_time: sessionStart,
      end_time: sessionEnd,
      summary_id: firstSample.uuid,
      upload_type: 2 as const, // Automatic
      is_nap: isNap,
    },

    device_data: buildDeviceData(firstSample.source, firstSample.device),

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
