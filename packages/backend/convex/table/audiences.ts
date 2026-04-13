import { defineTable } from "convex/server";
import { v } from "convex/values";

export const audiences = defineTable({
  name: v.string(),
  description: v.optional(v.string()),
  createdBy: v.id("users"),
});
