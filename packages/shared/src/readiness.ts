/**
 * Readiness — the runner's pre-session recovery state, derived deterministically
 * from Soma, and the monotonic ratchet that lets it corroborate (never originate)
 * a post-session Concern tier. See CONTEXT.md ("Readiness", "Concern tier") and
 * ADR-0009.
 *
 * Pure: no Convex deps, trivially tested. The fetch lives in the
 * `journal.deriveAndCommit` action; this only turns raw Soma rows into the
 * normalized block, and clamps the LLM's tier to the invariant.
 *
 * HRV is read as a z-score, NOT a raw value: 45ms means nothing in the absolute
 * (it's deeply individual), but "−1.8 standard deviations below your own 14-day
 * baseline" is interpretable and personal. Same idea for resting HR (a delta vs
 * baseline). Body battery / stress are deliberately excluded — they are
 * real-time and contaminated by the just-finished run, so they carry no
 * pre-session readiness signal.
 */

export type Concern = "none" | "watch" | "act";

export type Readiness = {
  /** Today's HRV expressed as standard deviations from the 14-day baseline. */
  hrvZScore?: number;
  /** Today's resting HR minus the 14-day baseline mean, in bpm (positive = elevated). */
  restingHrDelta?: number;
  /** Last night's sleep, in hours. */
  sleepHours?: number;
  /** Banded sleep quality from the provider's sleep score, when present. */
  sleepQuality?: "poor" | "ok" | "good";
  /**
   * No usable readiness signal — wearable absent or too sparse (<7 samples /
   * 14 days). Recorded explicitly: "we had no signal" is itself restitution
   * context, and it tells the triage to stay voice-only.
   */
  noSignal: boolean;
};

/** Minimal subset of a Soma daily-summary row this module reads. */
export type DailyRecord = {
  metadata: { start_time: string };
  heart_rate_data?: {
    summary?: { avg_hrv_rmssd?: number; resting_hr_bpm?: number };
  };
};

/** Minimal subset of a Soma sleep-session row this module reads. */
export type SleepRecord = {
  metadata: { start_time: string; is_nap?: boolean };
  sleep_durations_data?: { asleep?: { duration_asleep_state_seconds?: number } };
  data_enrichment?: { sleep_score?: number };
  scores?: { sleep?: number };
};

const WINDOW_DAYS = 14;
const MIN_SAMPLES = 7;

// ---------------------------------------------------------------------------
// The ratchet — the invariant that keeps Soma corroborating, never deciding.
// ---------------------------------------------------------------------------

const TIER_ORDER: Concern[] = ["none", "watch", "act"];

/**
 * Clamp the LLM's readiness-aware tier (`final`) so Readiness can only ratchet
 * the voice-only tier UP by at most one step, never skip (`none → act` is
 * impossible), and never downgrade. This is the structural guarantee — not a
 * prompt hope — that the removed `hrv_low_v1` autonomous trigger cannot return
 * by accident (ADR-0003 / ADR-0009).
 */
export function ratchetConcern(voice: Concern, final: Concern): Concern {
  const v = TIER_ORDER.indexOf(voice);
  const f = TIER_ORDER.indexOf(final);
  const clamped = Math.min(Math.max(f, v), Math.min(2, v + 1));
  return TIER_ORDER[clamped];
}

// ---------------------------------------------------------------------------
// Readiness computation
// ---------------------------------------------------------------------------

function ymd(iso: string): string {
  return iso.slice(0, 10);
}

function ymdMinusDays(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/** Sample standard deviation (n−1). Returns 0 for fewer than two points. */
function stdDev(xs: number[], m: number): number {
  if (xs.length < 2) return 0;
  const variance =
    xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(variance);
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function sleepScoreBand(score?: number): "poor" | "ok" | "good" | undefined {
  if (typeof score !== "number" || !Number.isFinite(score)) return undefined;
  if (score < 60) return "poor";
  if (score < 80) return "ok";
  return "good";
}

/**
 * Reconcile possibly-multiple daily rows per calendar date into one value each
 * for HRV and resting HR — last non-zero reading wins (mirrors
 * `analytics/daily.ts` / `analytics/hrv.ts`). Assumes ascending input but sorts
 * defensively.
 */
function reconcileDailies(
  dailies: DailyRecord[],
): Map<string, { hrv?: number; rhr?: number }> {
  const sorted = [...dailies].sort((a, b) =>
    a.metadata.start_time < b.metadata.start_time ? -1 : 1,
  );
  const byDate = new Map<string, { hrv?: number; rhr?: number }>();
  for (const d of sorted) {
    const date = ymd(d.metadata.start_time);
    const cur = byDate.get(date) ?? {};
    const hrv = d.heart_rate_data?.summary?.avg_hrv_rmssd;
    if (typeof hrv === "number" && Number.isFinite(hrv) && hrv > 0) {
      cur.hrv = hrv;
    }
    const rhr = d.heart_rate_data?.summary?.resting_hr_bpm;
    if (typeof rhr === "number" && Number.isFinite(rhr) && rhr > 0) {
      cur.rhr = rhr;
    }
    byDate.set(date, cur);
  }
  return byDate;
}

/**
 * Compute the normalized Readiness block for a workout's day from the trailing
 * 14-day window of Soma daily summaries and sleep sessions. Each dimension is
 * computed independently and left unset when its baseline is too sparse; the
 * block is `noSignal` only when nothing at all is computable.
 */
export function computeReadiness(args: {
  /** The workout's calendar-day anchor (any ISO string; only the date is used). */
  dayKey: string;
  dailies: DailyRecord[];
  sleeps: SleepRecord[];
}): Readiness {
  const target = ymd(args.dayKey);
  const windowStart = ymdMinusDays(target, WINDOW_DAYS);
  const byDate = reconcileDailies(args.dailies);

  // Baseline = readings strictly before the target day, within the window.
  const baselineHrv: number[] = [];
  const baselineRhr: number[] = [];
  for (const [date, { hrv, rhr }] of Array.from(byDate)) {
    if (date >= target || date < windowStart) continue;
    if (typeof hrv === "number") baselineHrv.push(hrv);
    if (typeof rhr === "number") baselineRhr.push(rhr);
  }

  const today = byDate.get(target);

  let hrvZScore: number | undefined;
  if (typeof today?.hrv === "number" && baselineHrv.length >= MIN_SAMPLES) {
    const m = mean(baselineHrv);
    const s = stdDev(baselineHrv, m);
    if (s > 0) hrvZScore = round1((today.hrv - m) / s);
  }

  let restingHrDelta: number | undefined;
  if (typeof today?.rhr === "number" && baselineRhr.length >= MIN_SAMPLES) {
    restingHrDelta = Math.round(today.rhr - mean(baselineRhr));
  }

  const { sleepHours, sleepQuality } = pickLastNight(args.sleeps, target);

  const noSignal =
    hrvZScore === undefined &&
    restingHrDelta === undefined &&
    sleepHours === undefined;

  return { hrvZScore, restingHrDelta, sleepHours, sleepQuality, noSignal };
}

/**
 * The night's sleep most relevant to the workout day: prefer the night that
 * started the evening before (the typical "last night" for a daytime run),
 * falling back to a session started on the workout day itself, then the latest
 * session on or before it. Naps and zero-duration rows are ignored.
 */
function pickLastNight(
  sleeps: SleepRecord[],
  target: string,
): { sleepHours?: number; sleepQuality?: "poor" | "ok" | "good" } {
  const usable = sleeps
    .filter((s) => !s.metadata.is_nap)
    .map((s) => ({
      night: ymd(s.metadata.start_time),
      startTime: s.metadata.start_time,
      sec: s.sleep_durations_data?.asleep?.duration_asleep_state_seconds,
      score: s.data_enrichment?.sleep_score ?? s.scores?.sleep,
    }))
    .filter((s) => typeof s.sec === "number" && s.sec > 0 && s.night <= target)
    .sort((a, b) => (a.startTime < b.startTime ? -1 : 1));

  if (usable.length === 0) return {};

  const prevNight = ymdMinusDays(target, 1);
  const chosen =
    usable.find((s) => s.night === prevNight) ??
    usable.find((s) => s.night === target) ??
    usable[usable.length - 1];

  return {
    sleepHours: round1((chosen.sec as number) / 3600),
    sleepQuality: sleepScoreBand(chosen.score),
  };
}
