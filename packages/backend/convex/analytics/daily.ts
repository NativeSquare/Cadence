/**
 * Daily analytics — wraps `soma.listDaily` and projects per-day summaries
 * the Analytics screen renders. Aggregates by calendar date because some
 * providers emit multiple daily records per day; we sum steps and pick the
 * latest non-zero resting HR.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "../_generated/server";
import { soma } from "../soma/index";

type SoughtDaily = {
  metadata: { start_time: string; end_time: string };
  distance_data?: { steps?: number };
  heart_rate_data?: { summary?: { resting_hr_bpm?: number } };
};

export const list = query({
  args: { startDate: v.optional(v.string()), endDate: v.optional(v.string()) },
  handler: async (
    ctx,
    { startDate, endDate },
  ): Promise<
    { date: string; steps: number; restingHr?: number }[]
  > => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const raw = (await soma.listDaily(ctx, {
      userId,
      startTime: startDate,
      endTime: endDate,
      order: "asc",
    })) as SoughtDaily[];

    const buckets = new Map<
      string,
      { steps: number; restingHr?: number }
    >();

    for (const d of raw) {
      const date = d.metadata.start_time.slice(0, 10);
      const cur = buckets.get(date) ?? { steps: 0, restingHr: undefined };
      const steps = d.distance_data?.steps;
      if (typeof steps === "number" && steps > 0) cur.steps += steps;
      const rhr = d.heart_rate_data?.summary?.resting_hr_bpm;
      if (typeof rhr === "number" && rhr > 0) cur.restingHr = rhr;
      buckets.set(date, cur);
    }

    return Array.from(buckets.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  },
});
