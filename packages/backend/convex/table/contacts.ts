import { defineTable } from "convex/server";
import { v } from "convex/values";

export const contacts = defineTable({
  email: v.string(),
  name: v.optional(v.string()),
  source: v.union(
    v.literal("waitlist"),
    v.literal("signup"),
    v.literal("manual"),
    v.literal("import")
  ),
  userId: v.optional(v.id("users")),
  unsubscribed: v.boolean(),
})
  .index("by_email", ["email"])
  .index("by_userId", ["userId"])
  .index("by_source", ["source"])
  .searchIndex("search_email", {
    searchField: "email",
    filterFields: ["source", "unsubscribed"],
  });
