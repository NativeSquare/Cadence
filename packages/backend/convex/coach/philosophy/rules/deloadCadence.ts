import { loadPlanWorkouts, summarizeByIsoWeek } from "../aggregates";
import type { PhilosophyRule } from "../types";

const WINDOW_WEEKS = 5;
const DELOAD_DROP_RATIO = 0.75;
const MIN_WEEK_VOLUME_M = 10_000;

export const deloadCadence: PhilosophyRule<unknown> = {
  id: "deload_cadence",
  description:
    "Across the active plan, every rolling 5-week window must contain at least one deload week (≥25% volume drop from its predecessor).",
  severity: "warn",
  triggers: ["block.create", "block.update"],
  check: async (_input, context, qctx) => {
    const plan = context.activePlan;
    if (!plan) return null;

    const planWorkouts = await loadPlanWorkouts(qctx, plan._id);
    const planned = planWorkouts.filter(
      (w) =>
        w.status === "planned" ||
        w.status === "missed" ||
        w.status === "skipped",
    );
    const weeks = summarizeByIsoWeek(planned, "planned");
    const ordered = [...weeks.values()].sort((a, b) =>
      a.weekStart.localeCompare(b.weekStart),
    );
    if (ordered.length < WINDOW_WEEKS + 1) return null;

    for (let i = WINDOW_WEEKS; i < ordered.length; i++) {
      const window = ordered.slice(i - WINDOW_WEEKS, i + 1);
      const allHighVolume = window.every(
        (w) => w.distanceMeters >= MIN_WEEK_VOLUME_M,
      );
      if (!allHighVolume) continue;
      const hasDeload = window.some((w, idx) => {
        if (idx === 0) return false;
        const prev = window[idx - 1];
        return w.distanceMeters <= prev.distanceMeters * DELOAD_DROP_RATIO;
      });
      if (!hasDeload) {
        const span = `${window[0].isoWeekKey} → ${window[window.length - 1].isoWeekKey}`;
        return {
          code: "_overridden_by_runner",
          message:
            `No deload week detected across ${span}. Insert a recovery week ` +
            `with ≥25% volume drop within the next 5-week stretch to support ` +
            `adaptation.`,
        };
      }
    }
    return null;
  },
};
