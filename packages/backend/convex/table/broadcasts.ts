import { defineTable } from "convex/server";
import { v } from "convex/values";

export const broadcasts = defineTable({
  subject: v.string(),
  bodyHtml: v.string(),
  audienceId: v.optional(v.id("audiences")),
  status: v.union(
    v.literal("draft"),
    v.literal("sending"),
    v.literal("sent"),
    v.literal("failed")
  ),
  sentAt: v.optional(v.number()),
  sentBy: v.optional(v.id("users")),
  recipientCount: v.optional(v.number()),
  sentCount: v.optional(v.number()),
  failedCount: v.optional(v.number()),
  errorMessage: v.optional(v.string()),
  createdBy: v.id("users"),
  updatedAt: v.number(),
}).index("by_status", ["status"]);
