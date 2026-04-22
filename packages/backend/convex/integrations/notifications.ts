/**
 * Push Notification Infrastructure
 *
 * - Token registration (called from the native app on launch)
 * - Session completion notification (called from the Garmin webhook handler)
 *
 * Uses the Expo Push API to deliver notifications to iOS/Android devices.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError, v } from "convex/values";
import { internal } from "../_generated/api";
import {
  internalAction,
  internalQuery,
  mutation,
} from "../_generated/server";

// ─── Token Registration ──────────────────────────────────────────────────────

/**
 * Register or update an Expo push token for the current user.
 * Called from the native app on each launch.
 */
export const registerPushToken = mutation({
  args: {
    token: v.string(),
    platform: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }

    // Upsert by token — a given device token belongs to exactly one user
    const existing = await ctx.db
      .query("pushTokens")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();

    if (existing) {
      // Token already registered — update userId/platform if changed
      if (existing.userId !== userId || existing.platform !== args.platform) {
        await ctx.db.patch(existing._id, {
          userId,
          platform: args.platform,
        });
      }
    } else {
      await ctx.db.insert("pushTokens", {
        userId,
        token: args.token,
        platform: args.platform,
      });
    }

    return null;
  },
});

// ─── Internal Helpers ─────────────────────────────────────────────────────────

export const getTokensForUser = internalQuery({
  args: { userId: v.id("users") },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    const tokens = await ctx.db
      .query("pushTokens")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    return tokens.map((t) => t.token);
  },
});

// ─── Send Notification ────────────────────────────────────────────────────────

/**
 * Send a push notification congratulating the user on completing a session.
 * Includes deep-link data so tapping opens the debrief screen.
 */
export const sendSessionCompleteNotification = internalAction({
  args: {
    userId: v.id("users"),
    workoutId: v.string(),
    sessionType: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const TAG = "[Notification]";

    console.log(
      `\n${TAG} ── Sending push notification ──\n` +
        `    User: ${args.userId}\n` +
        `    Session: ${args.sessionType} (${args.workoutId})\n` +
        `    Deep link: screen=debrief`,
    );

    const tokens = await ctx.runQuery(
      internal.integrations.notifications.getTokensForUser,
      { userId: args.userId },
    );

    if (tokens.length === 0) {
      console.log(`${TAG} ✗ No push tokens registered for this user. Notification skipped.`);
      return null;
    }

    console.log(`${TAG} Found ${tokens.length} device token${tokens.length === 1 ? "" : "s"}`);

    const messages = tokens.map((token) => ({
      to: token,
      title: "Run Complete!",
      body: `Your ${args.sessionType} session is logged. Tap to debrief.`,
      data: {
        workoutId: args.workoutId,
        screen: "debrief",
      },
      sound: "default" as const,
    }));

    try {
      const response = await fetch(
        "https://exp.host/--/api/v2/push/send",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(messages),
        },
      );

      if (!response.ok) {
        const body = await response.text();
        console.error(
          `${TAG} ✗ Expo Push API returned ${response.status}: ${body}`,
        );
      } else {
        console.log(
          `${TAG} ✓ Push sent! Title: "Run Complete!" Body: "Your ${args.sessionType} session is logged. Tap to debrief."`,
        );
      }
    } catch (err) {
      console.error(
        `${TAG} ✗ Failed to send: ${err instanceof Error ? err.message : err}`,
      );
    }

    return null;
  },
});
