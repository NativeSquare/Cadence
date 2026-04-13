import { defineTable } from "convex/server";
import { v } from "convex/values";

export const broadcastRecipients = defineTable({
  broadcastId: v.id("broadcasts"),
  contactId: v.id("contacts"),
  email: v.string(),
  status: v.union(
    v.literal("pending"),
    v.literal("sent"),
    v.literal("failed")
  ),
  error: v.optional(v.string()),
  sentAt: v.optional(v.number()),
})
  .index("by_broadcastId", ["broadcastId"])
  .index("by_broadcast_status", ["broadcastId", "status"]);
