/**
 * Pure derivation core for the self-reported menstrual cycle (CONTEXT.md
 * "Cycle — self-reported menstrual data", ADR-0010).
 *
 * The ONLY stored fact is a **Cycle Start** (a calendar day the runner declared
 * her period began — "J1"). Everything here — current **Cycle** length, current
 * cycle day, current **Phase** — is *derived on read* from the sequence of
 * starts, exactly as paces derive from the single stored VDOT. Nothing here is
 * persisted.
 *
 * No Convex deps — pure, runs under vitest. Keep it that way so the derivation
 * stays trivially testable and reusable (the eventual cross with the
 * post-session ressenti will read it). To run: `pnpm vitest` from the backend.
 */

export type CyclePhase = "menstrual" | "follicular" | "ovulatory" | "luteal";

/** Fallback cycle length until enough Cycle Starts have accrued. */
export const DEFAULT_CYCLE_LENGTH_DAYS = 28;
/** Assumed menstrual-phase (bleeding) length — flow isn't logged, so it's fixed. */
export const DEFAULT_PERIOD_LENGTH_DAYS = 5;
/** The luteal phase is the stable ~14 days; ovulation = cycle length − this. */
export const LUTEAL_LENGTH_DAYS = 14;
/** Median is taken over at most the most-recent N observed cycles. */
const MEDIAN_WINDOW = 6;
const MS_PER_DAY = 86_400_000;

export type CycleDerivation = {
  /** YMD of the most recent logged start, or null when nothing is logged. */
  lastStartYmd: string | null;
  /** 1-based day within the current cycle (1 == the start day). Null if no starts. */
  cycleDay: number | null;
  /** Current derived phase, or null when nothing is logged. */
  phase: CyclePhase | null;
  /**
   * True while the derivation leans on the default cycle length (fewer than two
   * observed cycles) — the page flags the phase as an estimate, the same
   * honest-about-thin-history posture as Readiness's `noSignal`.
   */
  phaseIsEstimate: boolean;
  /** Median of recent observed cycles, or the default when history is thin. */
  cycleLengthDays: number;
  /** Count of observed start-to-start spans (n starts → n−1 cycles). */
  observedCycles: number;
};

/** Calendar day (YMD) of a (possibly noon-anchored) day key. */
function ymd(dayKey: string): string {
  return dayKey.slice(0, 10);
}

function ymdToUtcMs(s: string): number {
  const [y, m, d] = ymd(s)
    .split("-")
    .map((p) => Number.parseInt(p, 10));
  return Date.UTC(y, m - 1, d);
}

/** Whole calendar days from `aYmd` to `bYmd` (negative if b precedes a). */
function daysBetween(aYmd: string, bYmd: string): number {
  return Math.round((ymdToUtcMs(bYmd) - ymdToUtcMs(aYmd)) / MS_PER_DAY);
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Map a 1-based cycle day to a phase, given the cycle length. Ovulation is
 * placed at `cycleLength − 14` (clamped just past the menstrual window), with a
 * ±1-day ovulatory window around it; everything after is luteal — including an
 * overdue day count past the expected length (no next-period prediction is made,
 * so "overdue" simply reads as still-luteal).
 */
export function phaseForDay(
  cycleDay: number,
  cycleLengthDays: number,
): CyclePhase {
  const ovulationDay = Math.max(
    DEFAULT_PERIOD_LENGTH_DAYS + 1,
    cycleLengthDays - LUTEAL_LENGTH_DAYS,
  );
  if (cycleDay <= DEFAULT_PERIOD_LENGTH_DAYS) return "menstrual";
  if (cycleDay < ovulationDay - 1) return "follicular";
  if (cycleDay <= ovulationDay + 1) return "ovulatory";
  return "luteal";
}

/**
 * Derive the current Cycle/Phase from the runner's Cycle Starts.
 *
 * @param startDayKeys day keys of logged starts, any order (deduped internally).
 * @param todayDayKey  the current day key (noon-anchored UTC ISO or YMD).
 */
export function deriveCycle(
  startDayKeys: string[],
  todayDayKey: string,
): CycleDerivation {
  const starts = [...new Set(startDayKeys.map(ymd))].sort();
  const today = ymd(todayDayKey);

  const spans: number[] = [];
  for (let i = 1; i < starts.length; i++) {
    spans.push(daysBetween(starts[i - 1], starts[i]));
  }
  const observedCycles = spans.length;
  const recentSpans = spans.slice(-MEDIAN_WINDOW);
  const cycleLengthDays =
    recentSpans.length > 0
      ? Math.round(median(recentSpans))
      : DEFAULT_CYCLE_LENGTH_DAYS;

  if (starts.length === 0) {
    return {
      lastStartYmd: null,
      cycleDay: null,
      phase: null,
      phaseIsEstimate: true,
      cycleLengthDays,
      observedCycles,
    };
  }

  const lastStartYmd = starts[starts.length - 1];
  // cycleDay 1 == the start day itself. Clamp to ≥1 in case `today` precedes the
  // last start (shouldn't happen — adds forbid future dates — but stay sane).
  const cycleDay = Math.max(1, daysBetween(lastStartYmd, today) + 1);

  return {
    lastStartYmd,
    cycleDay,
    phase: phaseForDay(cycleDay, cycleLengthDays),
    phaseIsEstimate: observedCycles < 2,
    cycleLengthDays,
    observedCycles,
  };
}
