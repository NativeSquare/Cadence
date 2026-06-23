import { getAuthUserId } from "@convex-dev/auth/server";
import { defineTable } from "convex/server";
import { ConvexError, v } from "convex/values";
import { deriveCycle } from "../cycle/derive";
import { mutation, query } from "../_generated/server";

/**
 * Cycle Starts — the runner's self-reported menstrual cycle (CONTEXT.md
 * "Cycle — self-reported menstrual data", ADR-0010). Cadence-native, deliberately
 * kept out of Soma: a J1 typed by hand is a *declaration*, not a wearable
 * measurement. The only stored menstrual fact — the equivalent of VDOT on the
 * fitness side. The current Cycle length and Phase are *derived on read* (see
 * `cycle/derive.ts`), never stored.
 *
 * Scope is the start marker only: daily flow is out of scope, and no Soma
 * webhook integration exists yet.
 */
const documentSchema = {
  userId: v.id("users"),
  // Noon-anchored UTC ISO calendar day the period started ("J1") — same
  // date contract as `journalEntry.dayKey`. One row per calendar day.
  dayKey: v.string(),
};

export const cycleStarts = defineTable(documentSchema)
  .index("by_user", ["userId"])
  .index("by_user_dayKey", ["userId", "dayKey"]);

/** Noon-anchored UTC ISO day key for a YMD, matching the date contract. */
function noonDayKey(ymd: string): string {
  return `${ymd.slice(0, 10)}T12:00:00.000Z`;
}

/**
 * Log a Cycle Start. Auth-scoped. Guards mirror the saisie contract:
 * backfill is allowed (past dates), future dates are refused (you can't have
 * started bleeding tomorrow), and a second start the same calendar day is a
 * no-op duplicate. The client clamps the picker and pre-checks duplicates too;
 * these are the authoritative belt-and-suspenders.
 */
export const addCycleStart = mutation({
  args: { dayKey: v.string() },
  handler: async (ctx, { dayKey }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }

    const day = dayKey.slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);
    if (day > today) {
      throw new ConvexError({
        code: "FUTURE_DATE",
        message: "Cannot log a cycle start in the future",
      });
    }

    const normalized = noonDayKey(day);
    const existing = await ctx.db
      .query("cycleStarts")
      .withIndex("by_user_dayKey", (q) =>
        q.eq("userId", userId).eq("dayKey", normalized),
      )
      .first();
    if (existing) {
      throw new ConvexError({
        code: "DUPLICATE",
        message: "A cycle start is already logged for this day",
      });
    }

    return await ctx.db.insert("cycleStarts", { userId, dayKey: normalized });
  },
});

/** Remove a logged Cycle Start. Auth-scoped to the owner. */
export const removeCycleStart = mutation({
  args: { id: v.id("cycleStarts") },
  handler: async (ctx, { id }) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }
    const row = await ctx.db.get(id);
    if (!row || row.userId !== userId) {
      throw new ConvexError({
        code: "NOT_FOUND",
        message: "Cycle start not found",
      });
    }
    await ctx.db.delete(id);
    return null;
  },
});

/**
 * The Cycle page reader: the logged starts (newest first, for the history list)
 * plus the on-read derivation of the current Cycle/Phase. Auth-scoped. Returns
 * null when unauthenticated; an empty-but-non-null shape when there are simply
 * no starts yet (so the page can render its empty state).
 */
export const getCycleOverview = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;

    const rows = await ctx.db
      .query("cycleStarts")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const starts = rows
      .map((r) => ({ id: r._id, dayKey: r.dayKey }))
      .sort((a, b) => (a.dayKey < b.dayKey ? 1 : -1)); // newest first

    const derived = deriveCycle(
      rows.map((r) => r.dayKey),
      noonDayKey(new Date().toISOString()),
    );

    return { starts, derived };
  },
});
