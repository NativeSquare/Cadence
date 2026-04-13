import { defineTable } from "convex/server";
import { v } from "convex/values";

export const audienceMembers = defineTable({
  audienceId: v.id("audiences"),
  contactId: v.id("contacts"),
})
  .index("by_audienceId", ["audienceId"])
  .index("by_contactId", ["contactId"])
  .index("by_audience_contact", ["audienceId", "contactId"]);
