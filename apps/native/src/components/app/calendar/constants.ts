/**
 * Constants and mock data for Calendar Tab
 * Reference: cadence-calendar-final.jsx lines 144-230
 */

import type { CalSession, CalSessionType, Phase, PhaseName } from "./types";

export const SESSION_COLORS: Record<CalSessionType, string> = {
  easy: "#7CB342",
  specific: "#FF9500",
  long: "#5B9EFF",
  race: "#FF5A5A",
};

export const SESSION_LABELS: Record<CalSessionType, string> = {
  easy: "Easy",
  specific: "Specific",
  long: "Long Run",
  race: "Race",
};

export const PHASE_COLORS: Record<PhaseName, string> = {
  base: "#6B9E3A",
  build1: "#E8A030",
  build2: "#E87830",
  taper: "#5B9EFF",
  race: "#FF5A5A",
  recovery: "#8BC34A",
};

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const DAY_HEADERS = [
  "Mo",
  "Tu",
  "We",
  "Th",
  "Fr",
  "Sa",
  "Su",
] as const;

export const DAY_HEADERS_FULL = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;

export const TODAY_KEY = "2026-02-25";

export const PHASES: Phase[] = [
  {
    name: "Base",
    key: "base",
    start: "2026-01-05",
    end: "2026-01-25",
    color: "#6B9E3A",
  },
  {
    name: "Build 1",
    key: "build1",
    start: "2026-01-26",
    end: "2026-02-08",
    color: "#E8A030",
  },
  {
    name: "Build 2",
    key: "build2",
    start: "2026-02-09",
    end: "2026-02-22",
    color: "#E87830",
  },
  {
    name: "Taper",
    key: "taper",
    start: "2026-02-23",
    end: "2026-02-28",
    color: "#5B9EFF",
  },
  {
    name: "Race",
    key: "race",
    start: "2026-03-01",
    end: "2026-03-01",
    color: "#FF5A5A",
  },
  {
    name: "Recovery",
    key: "recovery",
    start: "2026-03-02",
    end: "2026-03-15",
    color: "#8BC34A",
  },
];

export const CAL_SESSIONS: Record<string, CalSession[]> = {
  // Week 1 (Feb 2-8)
  "2026-02-02": [
    { type: "easy", label: "Easy", km: "6", dur: "36'", done: true },
  ],
  "2026-02-03": [
    { type: "specific", label: "Tempo", km: "8.5", dur: "48'", done: true },
  ],
  "2026-02-04": [
    { type: "easy", label: "Easy", km: "5", dur: "30'", done: true },
  ],
  "2026-02-05": [],
  "2026-02-06": [
    {
      type: "specific",
      label: "Intervals",
      km: "10",
      dur: "55'",
      done: true,
    },
  ],
  "2026-02-07": [
    { type: "easy", label: "Easy", km: "6", dur: "36'", done: true },
  ],
  "2026-02-08": [
    { type: "long", label: "Long Run", km: "18", dur: "1h42'", done: true },
  ],
  // Week 2 (Feb 9-15)
  "2026-02-09": [],
  "2026-02-10": [
    { type: "easy", label: "Easy", km: "7", dur: "42'", done: true },
  ],
  "2026-02-11": [
    { type: "specific", label: "Fartlek", km: "9", dur: "50'", done: true },
  ],
  "2026-02-12": [
    { type: "easy", label: "Easy", km: "5.5", dur: "33'", done: true },
  ],
  "2026-02-13": [],
  "2026-02-14": [
    { type: "specific", label: "Tempo", km: "8", dur: "44'", done: true },
  ],
  "2026-02-15": [
    { type: "long", label: "Long Run", km: "20", dur: "1h55'", done: true },
  ],
  // Week 3 (Feb 16-22)
  "2026-02-16": [],
  "2026-02-17": [
    { type: "specific", label: "Tempo", km: "8.5", dur: "48'", done: true },
  ],
  "2026-02-18": [
    { type: "easy", label: "Easy", km: "6", dur: "36'", done: true },
  ],
  "2026-02-19": [
    {
      type: "specific",
      label: "Intervals",
      km: "10.2",
      dur: "55'",
      done: true,
    },
  ],
  "2026-02-20": [
    { type: "easy", label: "Easy", km: "7", dur: "42'", done: true },
  ],
  "2026-02-21": [],
  "2026-02-22": [
    {
      type: "specific",
      label: "Progressive",
      km: "9",
      dur: "50'",
      done: true,
    },
  ],
  // Week 4 (Feb 23-28)
  "2026-02-23": [
    {
      type: "long",
      label: "Long Run",
      km: "16.5",
      dur: "1h35'",
      done: false,
    },
  ],
  "2026-02-24": [],
  "2026-02-25": [
    {
      type: "easy",
      label: "Easy",
      km: "6",
      dur: "36'",
      done: false,
      today: true,
    },
  ],
  "2026-02-26": [
    {
      type: "specific",
      label: "Race Pace",
      km: "10",
      dur: "52'",
      done: false,
    },
  ],
  "2026-02-27": [
    { type: "easy", label: "Easy", km: "5", dur: "30'", done: false },
  ],
  "2026-02-28": [
    { type: "easy", label: "Shakeout", km: "4", dur: "24'", done: false },
  ],
  // March (Race week)
  "2026-03-01": [
    {
      type: "race",
      label: "Semi-Marathon",
      km: "21.1",
      dur: "1h45'",
      done: false,
    },
  ],
  "2026-03-02": [],
  "2026-03-03": [
    { type: "easy", label: "Recovery", km: "4", dur: "28'", done: false },
  ],
  "2026-03-04": [],
  "2026-03-05": [
    { type: "easy", label: "Easy", km: "5", dur: "30'", done: false },
  ],
  "2026-03-06": [],
  "2026-03-07": [
    { type: "easy", label: "Easy", km: "6", dur: "36'", done: false },
  ],
  "2026-03-08": [
    { type: "long", label: "Long Run", km: "14", dur: "1h20'", done: false },
  ],
};
