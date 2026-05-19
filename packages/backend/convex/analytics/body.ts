/**
 * Body analytics — wraps `soma.listBody` and projects per-day measurements
 * (weight, body fat %) the Analytics screen renders. When a day carries
 * multiple measurements (e.g. morning + evening weigh-in) we keep the
 * latest one by `measurement_time`.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "../_generated/server";
import { soma } from "../soma/index";

type Measurement = {
  measurement_time?: string;
  weight_kg?: number;
  bodyfat_percentage?: number;
};

type SoughtBody = {
  metadata: { start_time: string; end_time: string };
  measurements_data?: { measurements?: Measurement[] };
};

export const list = query({
  args: { startDate: v.optional(v.string()), endDate: v.optional(v.string()) },
  handler: async (
    ctx,
    { startDate, endDate },
  ): Promise<
    { date: string; weightKg?: number; bodyFatPct?: number }[]
  > => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const raw = (await soma.listBody(ctx, {
      userId,
      startTime: startDate,
      endTime: endDate,
      order: "asc",
    })) as SoughtBody[];

    type Bucket = {
      weightKg?: number;
      bodyFatPct?: number;
      weightAt?: number;
      bodyFatAt?: number;
    };
    const buckets = new Map<string, Bucket>();

    for (const b of raw) {
      const baseDate = b.metadata.start_time.slice(0, 10);
      for (const m of b.measurements_data?.measurements ?? []) {
        const date = (m.measurement_time ?? b.metadata.start_time).slice(0, 10);
        const at = Date.parse(m.measurement_time ?? b.metadata.start_time);
        const cur = buckets.get(date) ?? buckets.get(baseDate) ?? {};
        if (
          typeof m.weight_kg === "number" &&
          m.weight_kg > 0 &&
          (cur.weightAt === undefined || at >= cur.weightAt)
        ) {
          cur.weightKg = m.weight_kg;
          cur.weightAt = at;
        }
        if (
          typeof m.bodyfat_percentage === "number" &&
          m.bodyfat_percentage > 0 &&
          (cur.bodyFatAt === undefined || at >= cur.bodyFatAt)
        ) {
          cur.bodyFatPct = m.bodyfat_percentage;
          cur.bodyFatAt = at;
        }
        buckets.set(date, cur);
      }
    }

    return Array.from(buckets.entries())
      .flatMap(([date, b]) =>
        b.weightKg === undefined && b.bodyFatPct === undefined
          ? []
          : [{ date, weightKg: b.weightKg, bodyFatPct: b.bodyFatPct }],
      )
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  },
});
