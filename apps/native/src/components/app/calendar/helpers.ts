/**
 * Utility functions for Calendar Tab
 * Reference: cadence-calendar-final.jsx lines 204-237, 302-309
 */

import type {
  Phase,
  CalendarDay,
  WeekDate,
  PhaseSegment,
} from "./types";
import { DAY_HEADERS_FULL } from "./constants";

/**
 * Blend hex color with off-white background (#F8F8F6) to produce a solid RGB color.
 * NEVER use alpha/rgba for backgrounds on light content areas — always pre-blend.
 */
export function blendWithBg(
  hex: string,
  opacity: number,
  bg = [248, 248, 246]
): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const rr = Math.round(r * opacity + bg[0] * (1 - opacity));
  const gg = Math.round(g * opacity + bg[1] * (1 - opacity));
  const bb = Math.round(b * opacity + bg[2] * (1 - opacity));
  return `rgb(${rr},${gg},${bb})`;
}

/**
 * Pre-compute a Map<dateKey, Phase> for O(1) lookups.
 * Called once with useMemo — avoids scanning PHASES for every date.
 */
export function buildPhaseLookup(phases: Phase[]): Map<string, Phase> {
  const map = new Map<string, Phase>();
  for (const p of phases) {
    const start = new Date(p.start + "T00:00:00");
    const end = new Date(p.end + "T00:00:00");
    for (
      let d = new Date(start);
      d <= end;
      d.setDate(d.getDate() + 1)
    ) {
      map.set(
        formatDateKey(d.getFullYear(), d.getMonth(), d.getDate()),
        p
      );
    }
  }
  return map;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Monday-first: returns 0-6 where 0=Monday */
export function getFirstDayOfMonth(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

export function formatDateKey(
  year: number,
  month: number,
  day: number
): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Build the calendar grid for a given month.
 * Returns an array of weeks, each containing 7 CalendarDay items (Monday-first).
 */
export function buildWeeks(
  year: number,
  month: number
): CalendarDay[][] {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonthDays = getDaysInMonth(prevYear, prevMonth);

  const calendarDays: CalendarDay[] = [];

  // Previous month trailing days
  for (let i = 0; i < firstDay; i++) {
    const day = prevMonthDays - firstDay + 1 + i;
    calendarDays.push({
      day,
      key: formatDateKey(prevYear, prevMonth, day),
      outside: true,
    });
  }

  // Current month
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      key: formatDateKey(year, month, i),
      outside: false,
    });
  }

  // Next month leading days
  const remaining = 7 - (calendarDays.length % 7);
  if (remaining < 7) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    for (let i = 1; i <= remaining; i++) {
      calendarDays.push({
        day: i,
        key: formatDateKey(nextYear, nextMonth, i),
        outside: true,
      });
    }
  }

  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }
  return weeks;
}

/**
 * Compute contiguous phase segments for a week row.
 * Each segment spans consecutive days with the same phase.
 */
export function computePhaseSegments(
  week: CalendarDay[],
  phaseLookup: Map<string, Phase>
): PhaseSegment[] {
  const segments: PhaseSegment[] = [];
  let current: PhaseSegment | null = null;

  week.forEach((d, di) => {
    const phase = d.outside ? undefined : phaseLookup.get(d.key);
    if (phase) {
      if (current && current.phase.name === phase.name) {
        current.end = di;
      } else {
        if (current) segments.push(current);
        current = {
          phase,
          start: di,
          end: di,
          isPhaseStart: d.key === phase.start,
        };
      }
    } else {
      if (current) {
        segments.push(current);
        current = null;
      }
    }
  });
  if (current) segments.push(current);
  return segments;
}

/**
 * Get the 7 WeekDate objects for the week containing the given date key.
 */
export function getWeekDates(dateKey: string): WeekDate[] {
  const d = new Date(dateKey + "T00:00:00");
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(d);
  monday.setDate(d.getDate() - diff);

  const dates: WeekDate[] = [];
  for (let i = 0; i < 7; i++) {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    dates.push({
      year: dd.getFullYear(),
      month: dd.getMonth(),
      day: dd.getDate(),
      key: formatDateKey(dd.getFullYear(), dd.getMonth(), dd.getDate()),
      dayName: DAY_HEADERS_FULL[i],
    });
  }
  return dates;
}
