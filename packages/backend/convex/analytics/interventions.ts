/**
 * Coach-intervention analytics — list of decision-log rows that fall inside
 * the chart's time window, so the Analytics cards can overlay a marker on
 * the chart that owns each trigger's signal.
 *
 * Surface is intentionally narrow: only the fields a chart marker / tap sheet
 * needs to render. Workout-detail UI keeps using `activeForWorkout`.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { query } from "../_generated/server";

export const list = query({
  args: {
    startMs: v.number(),
    endMs: v.optional(v.number()),
  },
  handler: async (ctx, { startMs, endMs }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const upperBound = endMs ?? Date.now();
    const rows = await ctx.db
      .query("coachInterventions")
      .withIndex("by_userId_firedAt", (q) =>
        q.eq("userId", userId).gte("firedAt", startMs),
      )
      .collect();

    return rows
      .filter((r) => r.firedAt <= upperBound)
      .sort((a, b) => a.firedAt - b.firedAt)
      .map((r) => ({
        _id: r._id,
        ruleId: r.ruleId,
        firedAt: r.firedAt,
        signals: r.signals,
        originalType: r.originalType,
        originalName: r.originalName,
        originalDistanceMeters: r.originalDistanceMeters,
        originalDurationSeconds: r.originalDurationSeconds,
        newType: r.newType,
        newName: r.newName,
        newDistanceMeters: r.newDistanceMeters,
        newDurationSeconds: r.newDurationSeconds,
        notificationBody: r.notificationBody,
        revertedAt: r.revertedAt,
      }));
  },
});
