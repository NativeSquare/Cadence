// Minimal ISO-week helpers. Weeks start Monday at 00:00 UTC.

export function isoWeekStart(d: Date): Date {
  const date = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  const day = date.getUTCDay() || 7;
  if (day !== 1) date.setUTCDate(date.getUTCDate() - (day - 1));
  return date;
}

export function isoWeekKey(d: Date): string {
  const start = isoWeekStart(d);
  return start.toISOString().slice(0, 10);
}

export function lastNWeekStarts(today: Date, count: number): Date[] {
  const current = isoWeekStart(today);
  const out: Date[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const m = new Date(current);
    m.setUTCDate(current.getUTCDate() - i * 7);
    out.push(m);
  }
  return out;
}

export function addWeeks(d: Date, n: number): Date {
  const out = new Date(d);
  out.setUTCDate(out.getUTCDate() + n * 7);
  return out;
}
