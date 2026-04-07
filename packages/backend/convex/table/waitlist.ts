import { defineTable } from "convex/server";
import { v } from "convex/values";

export const waitlist = defineTable({
  email: v.string(),
  joinedAt: v.number(),
  source: v.optional(v.string()),
}).index("by_email", ["email"]);
