import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Maps Garmin user IDs to Cadence user IDs.
 *
 * Populated during Garmin OAuth connection. Used by the Garmin webhook
 * handler to resolve which Cadence user an incoming activity belongs to,
 * so we can match it to a planned session and send a push notification.
 */
export const garminUserMappings = defineTable({
  garminUserId: v.string(),
  cadenceUserId: v.id("users"),
}).index("by_garminUserId", ["garminUserId"]);
