/**
 * HRV analytics — per-day HRV (RMSSD) for the Analytics screen.
 *
 * Reads from `soma.listDaily` and keeps the rows for which a provider reported
 * `heart_rate_data.summary.avg_hrv_rmssd`. When multiple daily records exist
 * for the same calendar date, the last non-zero reading wins (mirrors how
 * `analytics/daily.ts` reconciles steps / resting HR).
 *
 * Note: the readiness *trigger* uses its own internal query
 * (`soma.getHrvReadiness`) that computes the live z-score and excludes today
 * from the baseline. This query is for chart rendering only — it returns the
 * raw daily values; the card draws the baseline overlay client-side.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "../_generated/server";
import { soma } from "../soma/index";

type SoughtDaily = {
  metadata: { start_time: string };
  heart_rate_data?: { summary?: { avg_hrv_rmssd?: number } };
};

export const list = query({
  args: { startDate: v.optional(v.string()), endDate: v.optional(v.string()) },
  handler: async (
    ctx,
    { startDate, endDate },
  ): Promise<{ date: string; hrvRmssd: number }[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const raw = (await soma.listDaily(ctx, {
      userId,
      startTime: startDate,
      endTime: endDate,
      order: "asc",
    })) as SoughtDaily[];

    const byDate = new Map<string, number>();
    for (const d of raw) {
      const hrv = d.heart_rate_data?.summary?.avg_hrv_rmssd;
      if (typeof hrv !== "number" || !Number.isFinite(hrv) || hrv <= 0) continue;
      byDate.set(d.metadata.start_time.slice(0, 10), hrv);
    }

    return Array.from(byDate.entries())
      .map(([date, hrvRmssd]) => ({ date, hrvRmssd }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  },
});
