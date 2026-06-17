import { getAuthUserId } from "@convex-dev/auth/server";
import { defineTable } from "convex/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "../_generated/server";
import { generateFunctions } from "../utils/generateFunctions";
import { migrations } from "../migrations";

const coachTone = v.union(
  v.literal("mentor"),
  v.literal("drillSergeant"),
  v.literal("pragmatic"),
);
const coachPrefs = v.object({
  tone: v.optional(coachTone),
});

// Mirror of the user's RevenueCat "pro" entitlement. The authoritative writer
// is the RevenueCat webhook (server-side); the client also calls
// `syncSubscription` after a purchase/restore so the value is fresh without
// waiting for webhook latency. The client UI gate reads RevenueCat directly —
// this mirror exists so the backend can refuse expensive ops to non-subscribers.
// Dates are canonical UTC ISO 8601 per the FE↔BE date contract.
const subscription = v.object({
  active: v.boolean(),
  productId: v.optional(v.string()),
  expiresAt: v.optional(v.string()), // ISO 8601, when the current period ends
  isTrial: v.optional(v.boolean()),
  willRenew: v.optional(v.boolean()),
  store: v.optional(v.string()), // "APP_STORE" | "PLAY_STORE" | ...
  updatedAt: v.string(), // ISO 8601, when this mirror was last written
});

const documentSchema = {
  // DO NOT REMOVE THESE FIELDS : https://labs.convex.dev/auth/setup/schema#customizing-the-users-table
  name: v.optional(v.string()),
  image: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number()),
  phone: v.optional(v.string()),
  phoneVerificationTime: v.optional(v.number()),
  isAnonymous: v.optional(v.boolean()),

  // other "users" fields...
  bio: v.optional(v.string()),
  birthDate: v.optional(v.string()),
  hasCompletedOnboarding: v.optional(v.boolean()),
  role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
  locale: v.optional(v.union(v.literal("en"), v.literal("fr"))),
  coachPrefs: v.optional(coachPrefs),
  // @deprecated — gated the now-removed autonomous triggers (ADR-0003). No
  // reader remains. Kept only so existing docs validate; delete this line in a
  // follow-up once `unsetCoachInterventionsEnabled` has run in prod (Convex
  // can't drop a field while live docs still carry it).
  coachInterventionsEnabled: v.optional(v.boolean()),

  // Pro subscription mirror (RevenueCat). undefined = never subscribed.
  subscription: v.optional(subscription),

  // Ban fields
  banned: v.optional(v.boolean()),
  banReason: v.optional(v.string()),
  banExpires: v.optional(v.number()), // timestamp in ms, undefined = permanent
};

const partialSchema = {
  // DO NOT REMOVE THESE FIELDS : https://labs.convex.dev/auth/setup/schema#customizing-the-users-table
  name: v.optional(v.string()),
  image: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number()),
  phone: v.optional(v.string()),
  phoneVerificationTime: v.optional(v.number()),
  isAnonymous: v.optional(v.boolean()),

  // other "users" fields...
  bio: v.optional(v.string()),
  birthDate: v.optional(v.string()),
  hasCompletedOnboarding: v.optional(v.boolean()),
  role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
  locale: v.optional(v.union(v.literal("en"), v.literal("fr"))),
  coachPrefs: v.optional(coachPrefs),
  // @deprecated — see documentSchema above (ADR-0003).
  coachInterventionsEnabled: v.optional(v.boolean()),

  // Pro subscription mirror (RevenueCat). undefined = never subscribed.
  subscription: v.optional(subscription),

  // Ban fields
  banned: v.optional(v.boolean()),
  banReason: v.optional(v.string()),
  banExpires: v.optional(v.number()),
};

export const users = defineTable(documentSchema).index("email", ["email"]);

export const {
  get,
  insert,
  patch,
  replace,
  delete: del,
} = generateFunctions("users", documentSchema, partialSchema);

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    return await ctx.db.get(userId);
  },
});

export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();
  },
});

export const setLocale = mutation({
  args: {
    locale: v.union(v.literal("en"), v.literal("fr")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }
    await ctx.db.patch(userId, { locale: args.locale });
  },
});

export const setCoachPrefs = mutation({
  args: {
    prefs: coachPrefs,
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }
    await ctx.db.patch(userId, { coachPrefs: args.prefs });
  },
});

// Client mirror of the RevenueCat "pro" entitlement, written after a purchase,
// restore, or CustomerInfo update. The RevenueCat webhook is the authoritative
// writer; this keeps the value fresh without waiting on webhook latency.
export const syncSubscription = mutation({
  args: {
    active: v.boolean(),
    productId: v.optional(v.string()),
    expiresAt: v.optional(v.string()),
    isTrial: v.optional(v.boolean()),
    willRenew: v.optional(v.boolean()),
    store: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }
    await ctx.db.patch(userId, {
      subscription: { ...args, updatedAt: new Date().toISOString() },
    });
  },
});

// Authoritative subscription writer, called by the RevenueCat webhook
// (`/revenuecat-webhook` in http.ts). `appUserId` is the RevenueCat
// app_user_id, which we set to the Convex user id at logIn. Unknown ids are
// logged and ignored (e.g. anonymous purchases before identify, or stale ids).
export const applyRevenueCatEvent = internalMutation({
  args: {
    appUserId: v.string(),
    active: v.boolean(),
    productId: v.optional(v.string()),
    expiresAt: v.optional(v.string()),
    isTrial: v.optional(v.boolean()),
    willRenew: v.optional(v.boolean()),
    store: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = ctx.db.normalizeId("users", args.appUserId);
    if (!userId || !(await ctx.db.get(userId))) {
      console.warn(`[RevenueCat] no user for app_user_id=${args.appUserId}`);
      return;
    }
    await ctx.db.patch(userId, {
      subscription: {
        active: args.active,
        productId: args.productId,
        expiresAt: args.expiresAt,
        isTrial: args.isTrial,
        willRenew: args.willRenew,
        store: args.store,
        updatedAt: new Date().toISOString(),
      },
    });
  },
});

// Server-side entitlement check. Gate expensive operations (AI coach calls,
// etc.) on this so non-subscribers can't drive backend cost. An active
// subscription whose `expiresAt` is in the past is treated as lapsed.
export async function hasPro(
  ctx: { db: { get: (id: Id<"users">) => Promise<Doc<"users"> | null> } },
  userId: Id<"users">,
): Promise<boolean> {
  const user = await ctx.db.get(userId);
  const sub = user?.subscription;
  if (!sub?.active) return false;
  if (sub.expiresAt && Date.parse(sub.expiresAt) < Date.now()) return false;
  return true;
}

// Entitlement check callable from actions, which have no `ctx.db`. Resolve the
// user id in the action (via getAuthUserId) and pass it here over runQuery, then
// throw when this returns false. See `hasPro` for the actual rule.
export const checkPro = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => hasPro(ctx, userId),
});

/**
 * One-shot cleanup: strip the deprecated `coachInterventionsEnabled` field from
 * every user doc. It gated the autonomous triggers removed in ADR-0003 and has
 * no reader. Run this against the live deployment, then delete the field line
 * from the schema in a follow-up:
 *   npx convex run migrations:runAll \
 *     '{fn: "table/users:unsetCoachInterventionsEnabled"}'
 */
export const unsetCoachInterventionsEnabled = migrations.define({
  table: "users",
  migrateOne: async (ctx, doc) => {
    if (doc.coachInterventionsEnabled !== undefined) {
      await ctx.db.patch(doc._id, { coachInterventionsEnabled: undefined });
    }
  },
});

export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }

    // Delete all auth sessions for this user
    const sessions = await ctx.db
      .query("authSessions")
      .withIndex("userId", (q) => q.eq("userId", userId))
      .collect();
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    // Delete all auth accounts for this user
    const accounts = await ctx.db
      .query("authAccounts")
      .withIndex("userIdAndProvider", (q) => q.eq("userId", userId))
      .collect();
    for (const account of accounts) {
      await ctx.db.delete(account._id);
    }

    // Delete the user document
    await ctx.db.delete(userId);

    return { success: true };
  },
});
