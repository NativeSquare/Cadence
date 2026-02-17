// =============================================================================
// Insight Computation
// =============================================================================
// Computes activity insights in a single O(n) pass.
// Performance: <10ms for 1000 activities.

import type { SomaActivity, ActivityInsights } from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

/**
 * Compute insights from activities in O(n) single pass.
 * Handles missing data gracefully - all fields are optional.
 */
export function computeInsights(activities: SomaActivity[]): ActivityInsights {
  const now = Date.now();
  const twelveWeeksAgo = now - 12 * MS_PER_WEEK;

  // Initialize accumulators
  let totalDistanceM = 0;
  let totalElevationM = 0;
  let fastestPace: number | null = null;
  let fastestPaceRun: SomaActivity | null = null;
  let longestDistanceM = 0;
  let longestRun: SomaActivity | null = null;
  let firstRunTs = Infinity;
  let lastRunTs = 0;
  let paceCount = 0;
  let hrCount = 0;
  let elevCount = 0;

  const cityFreq = new Map<string, number>();
  const activeWeekSet = new Set<string>();

  // Single pass through all activities
  for (const activity of activities) {
    const startTs = new Date(activity.metadata.start_time).getTime();
    const endTs = new Date(activity.metadata.end_time).getTime();
    const distanceM = activity.distance_data?.summary?.distance_meters ?? 0;
    const elevM = activity.distance_data?.summary?.elevation?.gain_actual_meters;
    let pace = activity.movement_data?.avg_pace_minutes_per_kilometer;
    const hr = activity.heart_rate_data?.summary?.avg_hr_bpm;
    const city = activity.metadata.city;

    // Fallback: compute pace from distance/duration if not provided
    if (pace === undefined && distanceM > 0 && endTs > startTs) {
      const durationMin = (endTs - startTs) / 60000;
      const distKm = distanceM / 1000;
      if (distKm > 0) {
        pace = durationMin / distKm;
      }
    }

    // Accumulate totals
    totalDistanceM += distanceM;
    if (elevM !== undefined && elevM > 0) {
      totalElevationM += elevM;
      elevCount++;
    }

    // Track date bounds
    if (startTs < firstRunTs) firstRunTs = startTs;
    if (startTs > lastRunTs) lastRunTs = startTs;

    // Track extremes
    if (distanceM > longestDistanceM) {
      longestDistanceM = distanceM;
      longestRun = activity;
    }
    if (pace !== undefined && pace > 0 && pace < 20) {
      // Sanity check: pace should be < 20 min/km
      paceCount++;
      if (fastestPace === null || pace < fastestPace) {
        fastestPace = pace;
        fastestPaceRun = activity;
      }
    }

    // Track HR presence
    if (hr !== undefined && hr > 0) hrCount++;

    // Track city frequency
    if (city) {
      cityFreq.set(city, (cityFreq.get(city) ?? 0) + 1);
    }

    // Track active weeks in last 12 weeks
    if (startTs >= twelveWeeksAgo) {
      activeWeekSet.add(getISOWeek(new Date(startTs)));
    }
  }

  // Derive computed metrics
  const totalRuns = activities.length;
  const firstRunDate = firstRunTs < Infinity ? new Date(firstRunTs) : null;
  const lastRunDate = lastRunTs > 0 ? new Date(lastRunTs) : null;
  const daysSinceLastRun = lastRunDate
    ? Math.floor((now - lastRunTs) / MS_PER_DAY)
    : Infinity;
  const journeyWeeks =
    firstRunDate && lastRunDate
      ? Math.max(1, (lastRunTs - firstRunTs) / MS_PER_WEEK)
      : 1;

  const totalDistanceKm = totalDistanceM / 1000;
  const avgDistanceKm = totalRuns > 0 ? totalDistanceKm / totalRuns : 0;
  const avgWeeklyKm = totalDistanceKm / journeyWeeks;
  const longestDistanceKm = longestDistanceM / 1000;

  // Find top city
  let topCity: string | null = null;
  let topCityCount = 0;
  for (const [city, count] of cityFreq) {
    if (count > topCityCount) {
      topCity = city;
      topCityCount = count;
    }
  }

  return {
    totalRuns,
    firstRunDate,
    lastRunDate,
    daysSinceLastRun,
    journeyWeeks,
    totalDistanceKm,
    totalElevationM,
    avgDistanceKm,
    avgWeeklyKm,
    fastestPace,
    fastestPaceRun,
    longestDistanceKm,
    longestRun,
    activeWeeksLast12: activeWeekSet.size,
    topCity,
    topCityCount,
    hasHeartRateData: totalRuns > 0 && hrCount > totalRuns * 0.5,
    hasPaceData: totalRuns > 0 && paceCount > totalRuns * 0.5,
    hasElevationData: totalRuns > 0 && elevCount > totalRuns * 0.3,
    hasGeoData: cityFreq.size > 0,
  };
}

/**
 * Get ISO week string (YYYY-Www) for a date.
 * Used to count unique active weeks.
 */
function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // Set to nearest Thursday (ISO week starts Monday, week 1 has Jan 4)
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((d.getTime() - week1.getTime()) / MS_PER_DAY - 3 + ((week1.getDay() + 6) % 7)) / 7
    );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}
