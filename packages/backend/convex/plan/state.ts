/**
 * Pure compute of derived athlete state (ATL, CTL, TSB, volumes) from raw
 * completed activities. No storage — called on demand by whichever query
 * needs the numbers. If perf becomes an issue, memoize at the query layer.
 *
 * ATL: 7-day exponentially weighted training load (acute fatigue).
 * CTL: 42-day EWM training load (chronic fitness).
 * TSB: CTL - ATL (positive = fresh, negative = fatigued).
 */

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ATL_TC = 7;
const CTL_TC = 42;

export type CompletedActivity = {
  startTime: number;
  durationSec?: number;
  distance?: number;
  trainingLoad?: number;
};

export type AthleteState = {
  atl: number;
  ctl: number;
  tsb: number;
  last7DayVolumeMeters: number;
  last28DayVolumeMeters: number;
  volumeChangePercent: number;
  activityCount7d: number;
  activityCount28d: number;
};

function dailyBuckets(
  activities: CompletedActivity[],
  now: number,
  days: number,
): number[] {
  const buckets = new Array(days).fill(0) as number[];
  for (const a of activities) {
    const dayOffset = Math.floor((now - a.startTime) / MS_PER_DAY);
    if (dayOffset < 0 || dayOffset >= days) continue;
    const load = a.trainingLoad ?? fallbackLoad(a);
    buckets[days - 1 - dayOffset] += load;
  }
  return buckets;
}

function fallbackLoad(a: CompletedActivity): number {
  if (a.durationSec && a.distance) {
    return Math.round((a.durationSec / 60) * 0.7);
  }
  return 0;
}

function ewma(values: number[], timeConstant: number): number {
  if (values.length === 0) return 0;
  const alpha = 2 / (timeConstant + 1);
  let current = 0;
  for (const v of values) current = alpha * v + (1 - alpha) * current;
  return current;
}

function sumBetween(
  activities: CompletedActivity[],
  now: number,
  days: number,
  field: "distance",
): number {
  const cutoff = now - days * MS_PER_DAY;
  let total = 0;
  for (const a of activities) {
    if (a.startTime < cutoff) continue;
    total += a[field] ?? 0;
  }
  return total;
}

export function computeAthleteState(
  activities: CompletedActivity[],
  now: number = Date.now(),
): AthleteState {
  const days = Math.max(ATL_TC * 2, CTL_TC + 7);
  const buckets = dailyBuckets(activities, now, days);
  const atl = ewma(buckets.slice(-ATL_TC * 2), ATL_TC);
  const ctl = ewma(buckets, CTL_TC);

  const vol7 = sumBetween(activities, now, 7, "distance");
  const vol28 = sumBetween(activities, now, 28, "distance");
  const priorWeekCutoff = now - 14 * MS_PER_DAY;
  const priorWeek = activities.reduce(
    (s, a) =>
      a.startTime < priorWeekCutoff || a.startTime >= now - 7 * MS_PER_DAY
        ? s
        : s + (a.distance ?? 0),
    0,
  );
  const volumeChangePercent =
    priorWeek > 0 ? ((vol7 - priorWeek) / priorWeek) * 100 : 0;

  const count7 = activities.filter(
    (a) => a.startTime >= now - 7 * MS_PER_DAY,
  ).length;
  const count28 = activities.filter(
    (a) => a.startTime >= now - 28 * MS_PER_DAY,
  ).length;

  return {
    atl: Math.round(atl * 10) / 10,
    ctl: Math.round(ctl * 10) / 10,
    tsb: Math.round((ctl - atl) * 10) / 10,
    last7DayVolumeMeters: Math.round(vol7),
    last28DayVolumeMeters: Math.round(vol28),
    volumeChangePercent: Math.round(volumeChangePercent * 10) / 10,
    activityCount7d: count7,
    activityCount28d: count28,
  };
}
