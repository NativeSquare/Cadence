import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./table/admin";

// =============================================================================
// Queries
// =============================================================================

/** List all audiences with member counts. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const audiences = await ctx.db.query("audiences").order("desc").collect();

    return await Promise.all(
      audiences.map(async (a) => {
        const members = await ctx.db
          .query("audienceMembers")
          .withIndex("by_audienceId", (q) => q.eq("audienceId", a._id))
          .collect();
        return { ...a, memberCount: members.length };
      })
    );
  },
});

/** Get a single audience with its member count. */
export const get = query({
  args: { id: v.id("audiences") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const audience = await ctx.db.get(args.id);
    if (!audience) return null;

    const members = await ctx.db
      .query("audienceMembers")
      .withIndex("by_audienceId", (q) => q.eq("audienceId", audience._id))
      .collect();

    return { ...audience, memberCount: members.length };
  },
});

/** List audience members with contact details (paginated). */
export const listMembers = query({
  args: {
    audienceId: v.id("audiences"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const memberships = await ctx.db
      .query("audienceMembers")
      .withIndex("by_audienceId", (q) => q.eq("audienceId", args.audienceId))
      .paginate(args.paginationOpts);

    const page = await Promise.all(
      memberships.page.map(async (m) => {
        const contact = await ctx.db.get(m.contactId);
        return { ...m, contact };
      })
    );

    return { ...memberships, page };
  },
});

/** Get the count of non-unsubscribed members in an audience. */
export const getEligibleCount = query({
  args: { audienceId: v.id("audiences") },
  returns: v.number(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const members = await ctx.db
      .query("audienceMembers")
      .withIndex("by_audienceId", (q) => q.eq("audienceId", args.audienceId))
      .collect();

    let count = 0;
    for (const member of members) {
      const contact = await ctx.db.get(member.contactId);
      if (contact && !contact.unsubscribed) count++;
    }
    return count;
  },
});

// =============================================================================
// Mutations
// =============================================================================

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.id("audiences"),
  handler: async (ctx, args) => {
    const { userId } = await requireAdmin(ctx);
    return await ctx.db.insert("audiences", {
      name: args.name,
      description: args.description,
      createdBy: userId,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("audiences"),
    name: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const audience = await ctx.db.get(args.id);
    if (!audience) throw new ConvexError({ message: "Audience not found" });

    await ctx.db.patch(args.id, {
      name: args.name,
      description: args.description,
    });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("audiences") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const audience = await ctx.db.get(args.id);
    if (!audience) throw new ConvexError({ message: "Audience not found" });

    // Delete all memberships for this audience
    const members = await ctx.db
      .query("audienceMembers")
      .withIndex("by_audienceId", (q) => q.eq("audienceId", args.id))
      .collect();
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    await ctx.db.delete(args.id);
    return null;
  },
});

export const addMember = mutation({
  args: {
    audienceId: v.id("audiences"),
    contactId: v.id("contacts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existing = await ctx.db
      .query("audienceMembers")
      .withIndex("by_audience_contact", (q) =>
        q.eq("audienceId", args.audienceId).eq("contactId", args.contactId)
      )
      .first();
    if (existing) {
      throw new ConvexError({ message: "Contact is already in this audience" });
    }

    await ctx.db.insert("audienceMembers", {
      audienceId: args.audienceId,
      contactId: args.contactId,
    });
    return null;
  },
});

export const removeMember = mutation({
  args: {
    audienceId: v.id("audiences"),
    contactId: v.id("contacts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const membership = await ctx.db
      .query("audienceMembers")
      .withIndex("by_audience_contact", (q) =>
        q.eq("audienceId", args.audienceId).eq("contactId", args.contactId)
      )
      .first();
    if (!membership) {
      throw new ConvexError({ message: "Contact is not in this audience" });
    }

    await ctx.db.delete(membership._id);
    return null;
  },
});
