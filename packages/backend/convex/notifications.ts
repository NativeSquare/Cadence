/**
 * Push Notification Infrastructure
 *
 * Backed by @convex-dev/expo-push-notifications. The component handles
 * batching, retries with exponential backoff, Expo receipts, and pruning of
 * DeviceNotRegistered tokens. We just record one token per user and call
 * sendPushNotification.
 */

import { getAuthUserId } from "@convex-dev/auth/server";
import { PushNotifications } from "@convex-dev/expo-push-notifications";
import { ConvexError, v } from "convex/values";
import { components } from "./_generated/api";
import { internalAction, mutation, query } from "./_generated/server";

const pushNotifications = new PushNotifications(components.pushNotifications);

export const recordPushNotificationToken = mutation({
  args: { token: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }
    await pushNotifications.recordToken(ctx, {
      userId,
      pushToken: args.token,
    });
    return null;
  },
});

export const clearPushNotificationToken = mutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    await pushNotifications.removeToken(ctx, { userId });
    return null;
  },
});

export const getPushNotificationStatus = query({
  args: {},
  returns: v.union(
    v.null(),
    v.object({ hasToken: v.boolean(), paused: v.boolean() }),
  ),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await pushNotifications.getStatusForUser(ctx, { userId });
  },
});

export const setPushNotificationsPaused = mutation({
  args: { paused: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new ConvexError({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
    }
    if (args.paused) {
      await pushNotifications.pauseNotificationsForUser(ctx, { userId });
    } else {
      await pushNotifications.unpauseNotificationsForUser(ctx, { userId });
    }
    return null;
  },
});

/**
 * Generic helper — call from any backend code that needs to push to one user.
 */
export const sendToUser = internalAction({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.optional(v.string()),
    data: v.optional(v.any()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await pushNotifications.sendPushNotification(ctx, {
      userId: args.userId,
      notification: {
        title: args.title,
        body: args.body,
        data: args.data,
        sound: "default",
      },
    });
    return null;
  },
});

/**
 * Coach-reply push, scheduled from coach/messages.ts after the assistant
 * finishes streaming. Tap deep-links to the coach tab.
 */
export const sendCoachMessageNotification = internalAction({
  args: {
    userId: v.id("users"),
    threadId: v.string(),
    preview: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await pushNotifications.sendPushNotification(ctx, {
      userId: args.userId,
      notification: {
        title: "Cadence",
        body: args.preview,
        data: { screen: "chat", threadId: args.threadId },
        sound: "default",
      },
    });
    return null;
  },
});

/**
 * Workout-completion push, scheduled from the Soma webhook when an activity
 * matches a planned session. Tap deep-links to the workout detail screen.
 */
export const sendWorkoutCompleteNotification = internalAction({
  args: {
    userId: v.id("users"),
    workoutId: v.string(),
    workoutType: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await pushNotifications.sendPushNotification(ctx, {
      userId: args.userId,
      notification: {
        title: "Run Complete!",
        body: `Your ${args.workoutType} workout is logged. Tap to view.`,
        data: { workoutId: args.workoutId, screen: "workout" },
        sound: "default",
      },
    });
    return null;
  },
});
