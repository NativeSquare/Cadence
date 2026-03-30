import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "../_generated/server";
import { components } from "../_generated/api";
import { v } from "convex/values";

// =============================================================================
// Internal types for Soma activity shape
// =============================================================================

interface Activity {
  metadata: {
    start_time: string;
    end_time: string;
    type?: number;
  };
  distance_data?: {
    summary?: {
      distance_meters?: number;
    };
  };
  heart_rate_data?: {
    summary?: {
      avg_hr_bpm?: number;
      max_hr_bpm?: number;
      hr_zone_data?: Array<{
        zone?: number;
        duration_seconds?: number;
        name?: string;
      }>;
    };
  };
  movement_data?: {
    avg_pace_minutes_per_kilometer?: number;
  };
}

interface HRZones {
  zone1?: { min: number; max: number };
  zone2?: { min: number; max: number };
  zone3?: { min: number; max: number };
  zone4?: { min: number; max: number };
  zone5?: { min: number; max: number };
}

// =============================================================================
// Constants
// =============================================================================

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const MS_PER_WEEK = 7 * MS_PER_DAY;

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// =============================================================================
// Date helpers
// =============================================================================

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function dayOfWeekIdx(date: Date): number {
  const day = date.getUTCDay();
  return day === 0 ? 6 : day - 1;
}

function dateKey(d: Date): string {
  return `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// =============================================================================
// Aggregation: distance & pace from an activity
// =============================================================================

function distanceKm(a: Activity): number {
  return (a.distance_data?.summary?.distance_meters ?? 0) / 1000;
}

function paceMinPerKm(a: Activity): number | null {
  return a.movement_data?.avg_pace_minutes_per_kilometer ?? null;
}

// =============================================================================
// Volume by timeframe
// =============================================================================

interface TimeframeBucket {
  values: number[];
  labels: string[];
}

function aggregateVolumeByTimeframe(
  activities: Activity[],
  now: Date,
): Record<string, TimeframeBucket> {
  const parsed = activities.map((a) => ({
    ms: new Date(a.metadata.start_time).getTime(),
    date: new Date(a.metadata.start_time),
    km: distanceKm(a),
  }));

  const weekStartMs = getMonday(now).getTime();

  // --- 7d (current week, Mon–Sun) ---
  const d7 = new Array<number>(7).fill(0);
  for (const p of parsed) {
    if (p.ms >= weekStartMs && p.ms < weekStartMs + MS_PER_WEEK) {
      d7[dayOfWeekIdx(p.date)] += p.km;
    }
  }

  // --- 1mo (last 4 full weeks) ---
  const mo1Start = weekStartMs - 3 * MS_PER_WEEK;
  const mo1 = new Array<number>(4).fill(0);
  for (const p of parsed) {
    if (p.ms >= mo1Start && p.ms < weekStartMs + MS_PER_WEEK) {
      const idx = Math.floor((p.ms - mo1Start) / MS_PER_WEEK);
      if (idx >= 0 && idx < 4) mo1[idx] += p.km;
    }
  }

  // --- 3mo (last 12 weeks) ---
  const mo3Start = weekStartMs - 11 * MS_PER_WEEK;
  const mo3 = new Array<number>(12).fill(0);
  for (const p of parsed) {
    if (p.ms >= mo3Start && p.ms < weekStartMs + MS_PER_WEEK) {
      const idx = Math.floor((p.ms - mo3Start) / MS_PER_WEEK);
      if (idx >= 0 && idx < 12) mo3[idx] += p.km;
    }
  }

  // --- 6mo (last 26 weeks) ---
  const mo6Start = weekStartMs - 25 * MS_PER_WEEK;
  const mo6 = new Array<number>(26).fill(0);
  const mo6Labels = new Array<string>(26).fill("");
  for (let i = 0; i < 26; i++) {
    const bucketDate = new Date(mo6Start + i * MS_PER_WEEK);
    if (bucketDate.getUTCDate() <= 7) {
      mo6Labels[i] = MONTH_ABBR[bucketDate.getUTCMonth()];
    }
  }
  for (const p of parsed) {
    if (p.ms >= mo6Start && p.ms < weekStartMs + MS_PER_WEEK) {
      const idx = Math.floor((p.ms - mo6Start) / MS_PER_WEEK);
      if (idx >= 0 && idx < 26) mo6[idx] += p.km;
    }
  }

  // --- 1yr (last 12 calendar months) ---
  const yr1 = new Array<number>(12).fill(0);
  const yr1Labels = new Array<string>(12).fill("");
  const curMonth = now.getUTCMonth();
  const curYear = now.getUTCFullYear();
  for (let i = 0; i < 12; i++) {
    let m = curMonth - 11 + i;
    let y = curYear;
    while (m < 0) { m += 12; y--; }
    yr1Labels[i] = MONTH_ABBR[m];
  }
  for (const p of parsed) {
    const am = p.date.getUTCMonth();
    const ay = p.date.getUTCFullYear();
    const monthDiff = (ay - curYear) * 12 + (am - curMonth);
    const idx = monthDiff + 11;
    if (idx >= 0 && idx < 12) yr1[idx] += p.km;
  }

  const r = (arr: number[]) => arr.map(round1);
  return {
    "7d": { values: r(d7), labels: [...DAY_LABELS] },
    "1mo": { values: r(mo1), labels: ["W1", "W2", "W3", "W4"] },
    "3mo": {
      values: r(mo3),
      labels: Array.from({ length: 12 }, (_, i) => `W${i + 1}`),
    },
    "6mo": { values: r(mo6), labels: mo6Labels },
    "1yr": { values: r(yr1), labels: yr1Labels },
  };
}

// =============================================================================
// Volume stats (current week)
// =============================================================================

interface VolumeStats {
  currentVolume: number;
  plannedVolume: number;
  weekOverWeekChange: number;
  streak: number;
  streakDays: boolean[];
}

function computeVolumeStats(
  activities: Activity[],
  sessions: Array<{ weekNumber: number; targetDistanceMeters?: number }>,
  currentWeek: number,
  now: Date,
): VolumeStats {
  const weekStartMs = getMonday(now).getTime();
  const prevWeekStartMs = weekStartMs - MS_PER_WEEK;

  let curVol = 0;
  let prevVol = 0;
  const activityDates = new Set<string>();

  for (const a of activities) {
    const ms = new Date(a.metadata.start_time).getTime();
    const km = distanceKm(a);
    if (ms >= weekStartMs && ms < weekStartMs + MS_PER_WEEK) curVol += km;
    else if (ms >= prevWeekStartMs && ms < weekStartMs) prevVol += km;
    activityDates.add(dateKey(new Date(a.metadata.start_time)));
  }

  const plannedVolume = sessions
    .filter((s) => s.weekNumber === currentWeek)
    .reduce((sum, s) => sum + ((s.targetDistanceMeters ?? 0) / 1000), 0);

  const wow = prevVol > 0
    ? Math.round(((curVol - prevVol) / prevVol) * 100)
    : 0;

  let streak = 0;
  const check = new Date(now);
  check.setUTCHours(0, 0, 0, 0);
  while (activityDates.has(dateKey(check))) {
    streak++;
    check.setUTCDate(check.getUTCDate() - 1);
  }

  const streakDays: boolean[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    streakDays.push(activityDates.has(dateKey(d)));
  }

  return {
    currentVolume: round1(curVol),
    plannedVolume: round1(plannedVolume),
    weekOverWeekChange: wow,
    streak,
    streakDays,
  };
}

// =============================================================================
// Daily km for current week
// =============================================================================

function computeDailyKm(activities: Activity[], weekStartMs: number): number[] {
  const daily = new Array<number>(7).fill(0);
  for (const a of activities) {
    const ms = new Date(a.metadata.start_time).getTime();
    if (ms >= weekStartMs && ms < weekStartMs + MS_PER_WEEK) {
      daily[dayOfWeekIdx(new Date(a.metadata.start_time))] += distanceKm(a);
    }
  }
  return daily.map(round1);
}

// =============================================================================
// Daily zone splits (current week) — percentages per day
// =============================================================================

function computeDailyZones(
  activities: Activity[],
  weekStartMs: number,
): Array<{ z2: number; z3: number; z4: number }> {
  const buckets = Array.from({ length: 7 }, () => ({
    total: 0, z1: 0, z2: 0, z3: 0, z4: 0, z5: 0,
  }));

  for (const a of activities) {
    const ms = new Date(a.metadata.start_time).getTime();
    if (ms < weekStartMs || ms >= weekStartMs + MS_PER_WEEK) continue;
    const idx = dayOfWeekIdx(new Date(a.metadata.start_time));
    const zones = a.heart_rate_data?.summary?.hr_zone_data;
    if (!zones?.length) continue;
    for (const z of zones) {
      const dur = z.duration_seconds ?? 0;
      const zn = z.zone ?? 0;
      buckets[idx].total += dur;
      if (zn <= 2) buckets[idx].z2 += dur;
      else if (zn === 3) buckets[idx].z3 += dur;
      else if (zn >= 4) buckets[idx].z4 += dur;
    }
  }

  return buckets.map((b) => {
    if (b.total === 0) return { z2: 0, z3: 0, z4: 0 };
    return {
      z2: Math.round((b.z2 / b.total) * 100),
      z3: Math.round((b.z3 / b.total) * 100),
      z4: Math.round((b.z4 / b.total) * 100),
    };
  });
}

// =============================================================================
// Multi-week zone evolution
// =============================================================================

function computeMultiWeekZones(
  activities: Activity[],
  startMs: number,
  numWeeks: number,
): Array<{ week: number; z2: number; z3: number; z4: number }> {
  const weeks = Array.from({ length: numWeeks }, () => ({
    total: 0, z2: 0, z3: 0, z4: 0,
  }));

  for (const a of activities) {
    const ms = new Date(a.metadata.start_time).getTime();
    const wIdx = Math.floor((ms - startMs) / MS_PER_WEEK);
    if (wIdx < 0 || wIdx >= numWeeks) continue;
    const zones = a.heart_rate_data?.summary?.hr_zone_data;
    if (!zones?.length) continue;
    for (const z of zones) {
      const dur = z.duration_seconds ?? 0;
      const zn = z.zone ?? 0;
      weeks[wIdx].total += dur;
      if (zn <= 2) weeks[wIdx].z2 += dur;
      else if (zn === 3) weeks[wIdx].z3 += dur;
      else if (zn >= 4) weeks[wIdx].z4 += dur;
    }
  }

  return weeks.map((w, i) => ({
    week: i + 1,
    z2: w.total > 0 ? Math.round((w.z2 / w.total) * 100) : 0,
    z3: w.total > 0 ? Math.round((w.z3 / w.total) * 100) : 0,
    z4: w.total > 0 ? Math.round((w.z4 / w.total) * 100) : 0,
  }));
}

// =============================================================================
// Zone breakdown (overall distribution across recent activities)
// =============================================================================

function computeZoneBreakdown(
  activities: Activity[],
  hrZones?: HRZones,
): Array<{ zone: string; label: string; percentage: number; bpmRange: string; color: string }> {
  const totals = { z1: 0, z2: 0, z3: 0, z4: 0, z5: 0, all: 0 };
  for (const a of activities) {
    const zones = a.heart_rate_data?.summary?.hr_zone_data;
    if (!zones?.length) continue;
    for (const z of zones) {
      const dur = z.duration_seconds ?? 0;
      totals.all += dur;
      const zn = z.zone ?? 0;
      if (zn === 1) totals.z1 += dur;
      else if (zn === 2) totals.z2 += dur;
      else if (zn === 3) totals.z3 += dur;
      else if (zn === 4) totals.z4 += dur;
      else if (zn === 5) totals.z5 += dur;
    }
  }

  const pct = (v: number) =>
    totals.all > 0 ? Math.round((v / totals.all) * 100) : 0;

  const fmt = (z: { min: number; max: number } | undefined, fallback: string) => {
    if (!z) return fallback;
    return `${z.min}\u2013${z.max} bpm`;
  };

  return [
    {
      zone: "Z5", label: "VO2max", percentage: pct(totals.z5),
      bpmRange: hrZones?.zone5 ? `>${hrZones.zone5.min} bpm` : ">185 bpm",
      color: "#FF5A5A",
    },
    {
      zone: "Z4", label: "Threshold", percentage: pct(totals.z4),
      bpmRange: fmt(hrZones?.zone4, "170\u2013184 bpm"), color: "#FF9500",
    },
    {
      zone: "Z3", label: "Tempo", percentage: pct(totals.z3),
      bpmRange: fmt(hrZones?.zone3, "152\u2013169 bpm"), color: "#C8FF00",
    },
    {
      zone: "Z2", label: "Aerobic", percentage: pct(totals.z2),
      bpmRange: fmt(hrZones?.zone2, "135\u2013151 bpm"), color: "#A8D900",
    },
    {
      zone: "Z1", label: "Easy", percentage: pct(totals.z1),
      bpmRange: hrZones?.zone1 ? `<${hrZones.zone1.max} bpm` : "<134 bpm",
      color: "#5B9EFF",
    },
  ];
}

// =============================================================================
// Weekly volumes & paces for chart lines
// =============================================================================

function computeWeeklyVolumes(
  activities: Activity[],
  startMs: number,
  numWeeks: number,
): number[] {
  const vols = new Array<number>(numWeeks).fill(0);
  for (const a of activities) {
    const ms = new Date(a.metadata.start_time).getTime();
    const wIdx = Math.floor((ms - startMs) / MS_PER_WEEK);
    if (wIdx >= 0 && wIdx < numWeeks) vols[wIdx] += distanceKm(a);
  }
  return vols.map(round1);
}

function computeWeeklyPaces(
  activities: Activity[],
  startMs: number,
  numWeeks: number,
): number[] {
  const sums = Array.from({ length: numWeeks }, () => ({
    totalPace: 0, count: 0,
  }));
  for (const a of activities) {
    const ms = new Date(a.metadata.start_time).getTime();
    const wIdx = Math.floor((ms - startMs) / MS_PER_WEEK);
    const pace = paceMinPerKm(a);
    if (wIdx >= 0 && wIdx < numWeeks && pace !== null && pace > 0) {
      sums[wIdx].totalPace += pace;
      sums[wIdx].count++;
    }
  }
  return sums.map((s) =>
    s.count > 0 ? round1(s.totalPace / s.count) : 0
  );
}

// =============================================================================
// Stats grid
// =============================================================================

interface StatsResult {
  totalDistance: number;
  totalPlanned: number;
  sessions: number;
  sessionsPlanned: number;
  longestRun: number;
  longestRunWeek: number;
}

function computeStats(
  activities: Activity[],
  sessions: Array<{
    status: string;
    targetDistanceMeters?: number;
    weekNumber: number;
    isRestDay: boolean;
  }>,
  planStartMs: number | null,
): StatsResult {
  const scoped = planStartMs
    ? activities.filter(
        (a) => new Date(a.metadata.start_time).getTime() >= planStartMs,
      )
    : activities;

  let totalDistance = 0;
  let longestRun = 0;
  let longestRunMs = 0;
  for (const a of scoped) {
    const km = distanceKm(a);
    totalDistance += km;
    if (km > longestRun) {
      longestRun = km;
      longestRunMs = new Date(a.metadata.start_time).getTime();
    }
  }

  const nonRestSessions = sessions.filter((s) => !s.isRestDay);
  const totalPlanned = nonRestSessions.reduce(
    (sum, s) => sum + ((s.targetDistanceMeters ?? 0) / 1000),
    0,
  );
  const completed = nonRestSessions.filter(
    (s) => s.status === "completed",
  ).length;
  const longestRunWeek =
    planStartMs && longestRunMs > 0
      ? Math.floor((longestRunMs - planStartMs) / MS_PER_WEEK) + 1
      : 0;

  return {
    totalDistance: round1(totalDistance),
    totalPlanned: round1(totalPlanned),
    sessions: completed,
    sessionsPlanned: nonRestSessions.length,
    longestRun: round1(longestRun),
    longestRunWeek: Math.max(longestRunWeek, 0),
  };
}

// =============================================================================
// Plan progress
// =============================================================================

function normalizePhase(phaseName: string): string {
  const lower = phaseName.toLowerCase();
  if (lower.includes("taper")) return "taper";
  if (lower.includes("race")) return "race";
  if (lower.includes("peak")) return "peak";
  return "build";
}

function buildPlanProgress(
  weeklyPlan: Array<{ weekNumber: number; phaseName: string }>,
  currentWeek: number,
  sessionsByWeek: Map<number, Array<{ status: string; isRestDay: boolean }>>,
): Array<{ week: number; completed: boolean; current: boolean; phase: string }> {
  return weeklyPlan.map((w) => {
    const weekSessions = sessionsByWeek.get(w.weekNumber) ?? [];
    const nonRest = weekSessions.filter((s) => !s.isRestDay);
    const allDone =
      nonRest.length > 0 && nonRest.every((s) => s.status === "completed");
    return {
      week: w.weekNumber,
      completed: w.weekNumber < currentWeek ? allDone || w.weekNumber < currentWeek : allDone,
      current: w.weekNumber === currentWeek,
      phase: normalizePhase(w.phaseName),
    };
  });
}

// =============================================================================
// Return validator
// =============================================================================

const timeframeEntryV = v.object({
  values: v.array(v.number()),
  labels: v.array(v.string()),
});

const analyticsReturnValidator = v.object({
  planProgress: v.array(
    v.object({
      week: v.number(),
      completed: v.boolean(),
      current: v.boolean(),
      phase: v.string(),
    }),
  ),
  currentWeek: v.number(),

  volumeStats: v.object({
    currentVolume: v.number(),
    plannedVolume: v.number(),
    weekOverWeekChange: v.number(),
    streak: v.number(),
    streakDays: v.array(v.boolean()),
  }),

  dayLabels: v.array(v.string()),
  todayIndex: v.number(),

  dailyKm: v.array(v.number()),
  dailyZones: v.array(
    v.object({ z2: v.number(), z3: v.number(), z4: v.number() }),
  ),

  multiWeekZones: v.array(
    v.object({
      week: v.number(),
      z2: v.number(),
      z3: v.number(),
      z4: v.number(),
    }),
  ),

  weeklyVolumes: v.array(v.number()),
  weeklyPaces: v.array(v.number()),

  volumeByTimeframe: v.record(v.string(), timeframeEntryV),

  stats: v.object({
    totalDistance: v.number(),
    totalPlanned: v.number(),
    sessions: v.number(),
    sessionsPlanned: v.number(),
    longestRun: v.number(),
    longestRunWeek: v.number(),
  }),

  zoneBreakdown: v.array(
    v.object({
      zone: v.string(),
      label: v.string(),
      percentage: v.number(),
      bpmRange: v.string(),
      color: v.string(),
    }),
  ),

  radarData: v.array(v.object({ label: v.string(), value: v.number() })),
});

// =============================================================================
// Main composite query
// =============================================================================

export const getAnalyticsScreenData = query({
  args: {},
  returns: v.union(v.null(), analyticsReturnValidator),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!runner) return null;

    // --- Active training plan (optional) ---
    const plan = await ctx.db
      .query("trainingPlans")
      .withIndex("by_runnerId", (q) => q.eq("runnerId", runner._id))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    // --- Fetch activities from Soma (last year) ---
    const oneYearAgo = new Date();
    oneYearAgo.setUTCFullYear(oneYearAgo.getUTCFullYear() - 1);

    let activities: Activity[] = [];
    try {
      const rawActivities = await ctx.runQuery(
        components.soma.public.listActivities,
        {
          userId: userId as string,
          startTime: oneYearAgo.toISOString(),
          order: "asc",
        },
      );
      activities = rawActivities as unknown as Activity[];
    } catch {
      // Soma component unavailable or query failed — proceed with empty activities
      console.warn("Failed to fetch activities from Soma, using empty list");
    }

    // --- Fetch planned sessions (if plan exists) ---
    type SessionRow = {
      weekNumber: number;
      targetDistanceMeters?: number;
      status: string;
      isRestDay: boolean;
    };
    let allSessions: SessionRow[] = [];
    if (plan) {
      const rows = await ctx.db
        .query("plannedSessions")
        .withIndex("by_planId", (q) => q.eq("planId", plan._id))
        .collect();
      allSessions = rows.map((s) => ({
        weekNumber: s.weekNumber,
        targetDistanceMeters: s.targetDistanceMeters ?? undefined,
        status: s.status,
        isRestDay: s.isRestDay,
      }));
    }

    // --- Derived timestamps ---
    const now = new Date();
    const weekStartMs = getMonday(now).getTime();
    const todayIndex = dayOfWeekIdx(now);

    let currentWeek = 0;
    let numWeeks = 12;
    let planStartMs: number | null = null;

    if (plan) {
      planStartMs = plan.startDate;
      currentWeek = Math.max(
        1,
        Math.min(
          plan.durationWeeks,
          Math.floor((Date.now() - plan.startDate) / MS_PER_WEEK) + 1,
        ),
      );
      numWeeks = plan.durationWeeks;
    }

    const chartStartMs = planStartMs ?? weekStartMs - (numWeeks - 1) * MS_PER_WEEK;

    // --- Plan progress ---
    const sessionsByWeek = new Map<number, SessionRow[]>();
    for (const s of allSessions) {
      const arr = sessionsByWeek.get(s.weekNumber) ?? [];
      arr.push(s);
      sessionsByWeek.set(s.weekNumber, arr);
    }

    const planProgress = plan
      ? buildPlanProgress(plan.weeklyPlan, currentWeek, sessionsByWeek)
      : [];

    // --- Radar data from plan snapshot or runner state ---
    let radarData: Array<{ label: string; value: number }> = [];
    if (plan?.runnerSnapshot?.profileRadar) {
      radarData = plan.runnerSnapshot.profileRadar.map((r) => ({
        label: r.label,
        value: r.value,
      }));
    }

    // --- HR zones for zone breakdown ---
    const hrZones = runner.currentState?.hrZones as HRZones | undefined;

    return {
      planProgress,
      currentWeek,

      volumeStats: computeVolumeStats(
        activities, allSessions, currentWeek, now,
      ),

      dayLabels: [...DAY_LABELS],
      todayIndex,

      dailyKm: computeDailyKm(activities, weekStartMs),
      dailyZones: computeDailyZones(activities, weekStartMs),

      multiWeekZones: computeMultiWeekZones(
        activities, chartStartMs, numWeeks,
      ),

      weeklyVolumes: computeWeeklyVolumes(
        activities, chartStartMs, numWeeks,
      ),
      weeklyPaces: computeWeeklyPaces(
        activities, chartStartMs, numWeeks,
      ),

      volumeByTimeframe: aggregateVolumeByTimeframe(activities, now),

      stats: computeStats(activities, allSessions, planStartMs),

      zoneBreakdown: computeZoneBreakdown(activities, hrZones),

      radarData,
    };
  },
});
