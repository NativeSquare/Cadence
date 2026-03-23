import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Expo push notification tokens for each user/device.
 *
 * Supports multiple devices per user. Tokens are upserted on app launch
 * and used by the notification system to send push notifications
 * (e.g., session completion alerts).
 */
export const pushTokens = defineTable({
  userId: v.id("users"),
  token: v.string(),
  platform: v.string(), // "ios" | "android"
})
  .index("by_userId", ["userId"])
  .index("by_token", ["token"]);
