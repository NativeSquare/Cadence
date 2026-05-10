/**
 * Utility functions for Calendar Tab
 */

import type { BlockDoc } from "@nativesquare/agoge/schema";

/** A single day cell in the calendar grid. */
export interface CalendarDay {
  day: number;
  key: string;
  outside: boolean;
}

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
 * Pre-compute a Map<dateKey, BlockDoc> for O(1) lookups across the calendar grid.
 */
export function buildBlockLookup(blocks: BlockDoc[]): Map<string, BlockDoc> {
  const map = new Map<string, BlockDoc>();
  for (const b of blocks) {
    const start = new Date(b.startDate + "T00:00:00");
    const end = new Date(b.endDate + "T00:00:00");
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      map.set(
        formatDateKey(d.getFullYear(), d.getMonth(), d.getDate()),
        b,
      );
    }
  }
  return map;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/** Monday-first: returns 0-6 where 0=Monday */
function getFirstDayOfMonth(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** Format a Date as a calendar day key ("YYYY-MM-DD" in local time). */
export function dateKey(d: Date): string {
  return formatDateKey(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Build the calendar grid for a given month.
 * Returns an array of weeks, each containing 7 CalendarDay items (Monday-first).
 */
export function buildWeeks(year: number, month: number): CalendarDay[][] {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevMonthDays = getDaysInMonth(prevYear, prevMonth);

  const calendarDays: CalendarDay[] = [];

  for (let i = 0; i < firstDay; i++) {
    const day = prevMonthDays - firstDay + 1 + i;
    calendarDays.push({
      day,
      key: formatDateKey(prevYear, prevMonth, day),
      outside: true,
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push({
      day: i,
      key: formatDateKey(year, month, i),
      outside: false,
    });
  }

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
