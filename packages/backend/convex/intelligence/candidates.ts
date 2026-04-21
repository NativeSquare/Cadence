import { defineTable } from "convex/server";
import { v } from "convex/values";
import { internalMutation } from "../_generated/server";

const perspectiveValidator = v.object({
  specialist: v.union(v.literal("body"), v.literal("mind")),
  finding: v.string(),
  reasoning: v.string(),
  confidence: v.union(
    v.literal("low"),
    v.literal("medium"),
    v.literal("high"),
  ),
});

const toolCallValidator = v.object({
  toolCallId: v.string(),
  toolName: v.string(),
  args: v.any(),
});

export const candidateFields = {
  userId: v.id("users"),
  eventId: v.id("events"),
  text: v.string(),
  shouldPush: v.boolean(),
  reason: v.string(),
  perspectives: v.array(perspectiveValidator),
  toolCalls: v.array(toolCallValidator),
};

export const candidates = defineTable(candidateFields).index("by_user", [
  "userId",
]);

export const push = internalMutation({
  args: candidateFields,
  handler: async (ctx, args) => {
    return await ctx.db.insert("candidates", args);
  },
});
