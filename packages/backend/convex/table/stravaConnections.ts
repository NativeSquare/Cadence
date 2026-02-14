import { defineTable } from "convex/server";
import { v } from "convex/values";
import { generateFunctions } from "../utils/generateFunctions";

const documentSchema = {
  userId: v.id("users"),
  athleteId: v.number(),
  accessToken: v.string(),
  refreshToken: v.string(),
  expiresAt: v.number(),
  scopes: v.string(),
  athleteFirstName: v.optional(v.string()),
  athleteLastName: v.optional(v.string()),
  athleteProfileImage: v.optional(v.string()),
};

const partialSchema = {
  userId: v.optional(v.id("users")),
  athleteId: v.optional(v.number()),
  accessToken: v.optional(v.string()),
  refreshToken: v.optional(v.string()),
  expiresAt: v.optional(v.number()),
  scopes: v.optional(v.string()),
  athleteFirstName: v.optional(v.string()),
  athleteLastName: v.optional(v.string()),
  athleteProfileImage: v.optional(v.string()),
};

export const stravaConnections = defineTable(documentSchema)
  .index("by_userId", ["userId"])
  .index("by_athleteId", ["athleteId"]);

export const {
  get,
  insert,
  patch,
  replace,
  delete: del,
} = generateFunctions("stravaConnections", documentSchema, partialSchema);
