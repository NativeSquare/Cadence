/**
 * Mock data for Plan Screen
 * Reference: cadence-full-v9.jsx PLAN array (lines 76-84) and COACH_MSG (line 85)
 *
 * This mock data will be replaced by Convex queries in production.
 */

import type { PlanData, RaceGoalData, WorkoutData } from "./types";

const REST_DAY: WorkoutData = {
  type: "Rest",
  km: "-",
  dur: "-",
  done: false,
  intensity: "rest",
  desc: "Active recovery. Walk or stretch.",
  zone: "-",
};

const REST_DONE: WorkoutData = { ...REST_DAY, done: true };

/**
 * Mock 7-day training plan for the current week.
 * 4 running sessions + 3 rest days. TODAY_INDEX (3) points to Easy Run.
 */
export const MOCK_SESSIONS: WorkoutData[] = [
  {
    type: "Tempo",
    km: "8.5",
    dur: "48min",
    done: true,
    intensity: "high",
    desc: "4x2km @ 4:55 with 90s recovery",
    zone: "Z4",
    syncStatus: "synced",
    syncSource: "garmin",
    syncedData: { km: "8.6", dur: "47min" },
  },
  REST_DONE,
  {
    type: "Intervals",
    km: "10.2",
    dur: "55min",
    done: true,
    intensity: "high",
    desc: "8x800m @ 4:30 with 400m jog",
    zone: "Z4-5",
    syncStatus: "synced",
    syncSource: "garmin",
    syncedData: { km: "10.3", dur: "54min" },
  },
  {
    type: "Easy Run",
    km: "7.0",
    dur: "42min",
    done: false,
    intensity: "low",
    desc: "Conversation pace, flat route",
    zone: "Z2",
    today: true,
  },
  REST_DAY,
  REST_DAY,
  {
    type: "Long Run",
    km: "16.5",
    dur: "1h35",
    done: false,
    intensity: "key",
    desc: "Steady with last 3km at HM pace",
    zone: "Z2-3",
  },
];

// ---------------------------------------------------------------------------
// Multi-week calendar data (2 weeks before → 2 weeks after)
// ---------------------------------------------------------------------------

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

const WEEK_MINUS_2: WorkoutData[] = [
  { type: "Tempo", km: "7.5", dur: "43min", done: true, intensity: "high", desc: "3x2km @ 5:00 with 90s recovery", zone: "Z4" },
  REST_DONE,
  { type: "Easy Run", km: "6.0", dur: "36min", done: true, intensity: "low", desc: "Recovery pace, conversational", zone: "Z2" },
  REST_DONE,
  { type: "Intervals", km: "8.0", dur: "45min", done: true, intensity: "high", desc: "6x800m @ 4:35 with 400m jog", zone: "Z4-5" },
  REST_DONE,
  { type: "Long Run", km: "14.0", dur: "1h20", done: true, intensity: "key", desc: "Aerobic base, even splits", zone: "Z2-3" },
];

const WEEK_MINUS_1: WorkoutData[] = [
  { type: "Easy Run", km: "6.5", dur: "38min", done: true, intensity: "low", desc: "Shake-out jog, stay relaxed", zone: "Z2" },
  REST_DONE,
  { type: "Tempo", km: "9.0", dur: "50min", done: true, intensity: "high", desc: "5x1.5km @ 4:50 with 60s recovery", zone: "Z4" },
  REST_DONE,
  { type: "Progressive", km: "7.5", dur: "42min", done: true, intensity: "high", desc: "Last 3km at tempo effort", zone: "Z3-4" },
  REST_DONE,
  { type: "Long Run", km: "15.0", dur: "1h28", done: true, intensity: "key", desc: "Negative split, pick up last 5km", zone: "Z2-3" },
];

const WEEK_PLUS_1: WorkoutData[] = [
  { type: "Easy Run", km: "6.0", dur: "35min", done: false, intensity: "low", desc: "Relaxed effort, flat terrain", zone: "Z2" },
  REST_DAY,
  { type: "Tempo", km: "9.5", dur: "52min", done: false, intensity: "high", desc: "4x2km @ 4:45 with 90s recovery", zone: "Z4" },
  REST_DAY,
  { type: "Intervals", km: "10.5", dur: "56min", done: false, intensity: "high", desc: "10x600m @ 4:20 with 300m jog", zone: "Z4-5" },
  REST_DAY,
  { type: "Long Run", km: "17.0", dur: "1h40", done: false, intensity: "key", desc: "Last 5km at marathon pace", zone: "Z2-3" },
];

const WEEK_PLUS_2: WorkoutData[] = [
  { type: "Progressive", km: "8.0", dur: "44min", done: false, intensity: "high", desc: "Build from easy to tempo over 8km", zone: "Z3-4" },
  REST_DAY,
  { type: "Easy Run", km: "6.5", dur: "38min", done: false, intensity: "low", desc: "Recovery pace, stay comfortable", zone: "Z2" },
  REST_DAY,
  { type: "Tempo", km: "10.0", dur: "54min", done: false, intensity: "high", desc: "5x1.8km @ 4:50 with 75s recovery", zone: "Z4" },
  REST_DAY,
  { type: "Long Run", km: "18.0", dur: "1h48", done: false, intensity: "key", desc: "Steady state, final long effort", zone: "Z2-3" },
];

function buildCalendarSessions(): Record<string, WorkoutData> {
  const today = new Date();
  const currentMonday = getMonday(today);
  const result: Record<string, WorkoutData> = {};

  const allWeeks: WorkoutData[][] = [
    WEEK_MINUS_2,
    WEEK_MINUS_1,
    MOCK_SESSIONS,
    WEEK_PLUS_1,
    WEEK_PLUS_2,
  ];

  for (let w = 0; w < allWeeks.length; w++) {
    const weekMonday = new Date(currentMonday);
    weekMonday.setDate(currentMonday.getDate() + (w - 2) * 7);

    for (let d = 0; d < 7; d++) {
      const date = new Date(weekMonday);
      date.setDate(weekMonday.getDate() + d);
      result[toDateKey(date)] = allWeeks[w][d];
    }
  }

  return result;
}

export const MOCK_CALENDAR_SESSIONS = buildCalendarSessions();

/**
 * Mock coach message for today
 * Reference: cadence-full-v9.jsx line 85
 */
export const MOCK_COACH_MESSAGE =
  "Easy day. Yesterday's intervals were demanding - your legs need low-stress miles to absorb that work. Keep it honest.";

/**
 * Mock primary race goal — 42 days out, week 4 of a 12-week half marathon plan
 */
export const MOCK_RACE_GOAL: RaceGoalData = {
  raceName: "NYC Half Marathon",
  raceDistance: "Half Marathon",
  raceDate: Date.now() + 42 * 24 * 60 * 60 * 1000,
  targetTime: "1:45:00",
  currentWeek: 4,
  totalWeeks: 12,
  phase: "Build",
};

/**
 * Complete mock plan data
 */
export const MOCK_PLAN_DATA: PlanData = {
  userName: "Alex",
  weekNumber: 4,
  phase: "Build",
  sessions: MOCK_SESSIONS,
  volumeCompleted: 18.7,
  volumePlanned: 42.2,
  timeCompleted: "2h 25m",
  avgPace: "5:12",
  weekOverWeekChange: 8,
  coachMessage: MOCK_COACH_MESSAGE,
};
