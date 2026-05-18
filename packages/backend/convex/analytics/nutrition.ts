/**
 * Nutrition analytics — wraps `soma.listNutrition` and aggregates per
 * calendar day (records can arrive as multiple summaries within a day).
 * Returns `{ date: ymd, calories, carbs_g, protein_g, fat_g }`.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "../_generated/server";
import { soma } from "../soma/index";

type Macros = {
  calories?: number;
  carbohydrates_g?: number;
  protein_g?: number;
  fat_g?: number;
};

type SoughtNutrition = {
  metadata: { start_time: string; end_time: string };
  summary?: { macros?: Macros };
  meals?: { macros?: Macros }[];
};

export const list = query({
  args: { startDate: v.optional(v.string()), endDate: v.optional(v.string()) },
  handler: async (
    ctx,
    { startDate, endDate },
  ): Promise<
    {
      date: string;
      calories: number;
      carbs_g: number;
      protein_g: number;
      fat_g: number;
    }[]
  > => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const raw = (await soma.listNutrition(ctx, {
      userId,
      startTime: startDate,
      endTime: endDate,
      order: "asc",
    })) as SoughtNutrition[];

    const buckets = new Map<
      string,
      { calories: number; carbs_g: number; protein_g: number; fat_g: number }
    >();

    for (const n of raw) {
      const date = n.metadata.start_time.slice(0, 10);
      const macros = totalMacros(n);
      const cur = buckets.get(date) ?? {
        calories: 0,
        carbs_g: 0,
        protein_g: 0,
        fat_g: 0,
      };
      cur.calories += macros.calories ?? 0;
      cur.carbs_g += macros.carbohydrates_g ?? 0;
      cur.protein_g += macros.protein_g ?? 0;
      cur.fat_g += macros.fat_g ?? 0;
      buckets.set(date, cur);
    }

    return Array.from(buckets.entries())
      .map(([date, v]) => ({ date, ...v }))
      .sort((a, b) => (a.date < b.date ? -1 : 1));
  },
});

// Provider summaries are often complete on their own; when missing, fall
// back to summing the meals array.
function totalMacros(n: SoughtNutrition): Macros {
  const summary = n.summary?.macros;
  if (summary) return summary;
  const out: Macros = {
    calories: 0,
    carbohydrates_g: 0,
    protein_g: 0,
    fat_g: 0,
  };
  for (const m of n.meals ?? []) {
    out.calories! += m.macros?.calories ?? 0;
    out.carbohydrates_g! += m.macros?.carbohydrates_g ?? 0;
    out.protein_g! += m.macros?.protein_g ?? 0;
    out.fat_g! += m.macros?.fat_g ?? 0;
  }
  return out;
}
