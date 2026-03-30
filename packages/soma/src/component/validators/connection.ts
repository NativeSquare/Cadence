import { v } from "convex/values";

// ─── Connection ──────────────────────────────────────────────────────────────
// Represents a link between a host app user and a wearable provider.
// Provider-agnostic: Soma doesn't care if data comes via Terra, direct API, etc.
// One document per user-provider pair.
export const connectionValidator = {
  // Host app's user identifier (their user ID, Clerk ID, etc.)
  userId: v.string(),
  // The wearable provider: "FITBIT", "GARMIN", "APPLE", "OURA", etc.
  provider: v.string(),
  // The provider's external user ID (e.g. Garmin's userId for webhook mapping)
  providerUserId: v.optional(v.string()),
  // Whether the connection is active
  active: v.optional(v.boolean()),
  // ISO-8601 timestamp of last data update
  lastDataUpdate: v.optional(v.string()),
};
