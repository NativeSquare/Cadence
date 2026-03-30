import { v } from "convex/values";

// ─── Athlete ─────────────────────────────────────────────────────────────────
// User identifying/profile information from the wearable provider.
// Maps 1:1 to Terra's Athlete data model.
export const athleteValidator = {
  // Reference to the connections table
  connectionId: v.id("connections"),
  // Host app user ID (denormalized for querying)
  userId: v.string(),
  // Profile fields (all nullable per Terra spec)
  age: v.optional(v.number()),
  country: v.optional(v.string()),
  bio: v.optional(v.string()),
  state: v.optional(v.string()),
  last_name: v.optional(v.string()),
  sex: v.optional(v.string()),
  city: v.optional(v.string()),
  email: v.optional(v.string()),
  date_of_birth: v.optional(v.string()),
  first_name: v.optional(v.string()),
  gender: v.optional(v.string()),
  joined_provider: v.optional(v.string()),
  devices: v.optional(v.array(v.any())),
};
