import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const join = mutation({
  args: {
    email: v.string(),
    source: v.optional(v.string()),
    locale: v.optional(v.union(v.literal("en"), v.literal("fr"))),
  },
  returns: v.object({
    success: v.boolean(),
    alreadyJoined: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();

    // Check if already on waitlist
    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (existing) {
      return { success: true, alreadyJoined: true };
    }

    // Insert into waitlist
    await ctx.db.insert("waitlist", {
      email,
      joinedAt: Date.now(),
      source: args.source,
    });

    // Send welcome email (fire and forget)
    await ctx.scheduler.runAfter(0, internal.emails.sendWaitlistEmail, {
      to: email,
      locale: args.locale ?? "en",
    });

    return { success: true, alreadyJoined: false };
  },
});

const WAITLIST_BASE_COUNT = 31;

export const count = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    let count = 0;
    const iter = ctx.db.query("waitlist");
    for await (const _entry of iter) {
      count++;
    }
    return WAITLIST_BASE_COUNT + count;
  },
});
