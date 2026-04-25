import { paginationOptsValidator } from "convex/server";
import { ConvexError, v } from "convex/values";
import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAdmin } from "./table/admin";

const CONTACT_BASE_COUNT = 31;

// =============================================================================
// Public (no auth required)
// =============================================================================

/** Public contact count for the landing page. */
export const count = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    let count = 0;
    for await (const _entry of ctx.db.query("contacts")) {
      count++;
    }
    return CONTACT_BASE_COUNT + count;
  },
});

/** Public action: join the waitlist / sign up as a contact. */
export const join = action({
  args: {
    email: v.string(),
    source: v.optional(v.string()),
    locale: v.optional(v.union(v.literal("en"), v.literal("fr"))),
  },
  returns: v.object({
    success: v.boolean(),
    alreadyJoined: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    const locale = args.locale ?? "en";

    const isNew = await ctx.runMutation(internal.contacts.recordJoin, {
      email,
      source: args.source,
    });

    if (isNew) {
      await ctx.scheduler.runAfter(0, internal.emails.sendWaitlistEmail, {
        to: email,
        locale,
      });
      return { success: true, alreadyJoined: false };
    }

    return { success: true, alreadyJoined: true };
  },
});

// =============================================================================
// Admin Queries
// =============================================================================

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    if (args.search && args.search.trim().length > 0) {
      return await ctx.db
        .query("contacts")
        .withSearchIndex("search_email", (q) =>
          q.search("email", args.search!)
        )
        .paginate(args.paginationOpts);
    }

    return await ctx.db
      .query("contacts")
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const get = query({
  args: { id: v.id("contacts") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.get(args.id);
  },
});

export const getStats = query({
  args: {},
  returns: v.object({
    total: v.number(),
    withUserId: v.number(),
    unsubscribed: v.number(),
  }),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("contacts").collect();
    return {
      total: all.length,
      withUserId: all.filter((c) => c.userId !== undefined).length,
      unsubscribed: all.filter((c) => c.unsubscribed).length,
    };
  },
});

// =============================================================================
// Mutations
// =============================================================================

export const create = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  returns: v.id("contacts"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const email = args.email.toLowerCase().trim();

    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existing) {
      throw new ConvexError({
        message: "A contact with this email already exists",
      });
    }

    return await ctx.db.insert("contacts", {
      email,
      name: args.name,
      source: "manual",
      unsubscribed: false,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("contacts"),
    name: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const contact = await ctx.db.get(args.id);
    if (!contact) throw new ConvexError({ message: "Contact not found" });

    await ctx.db.patch(args.id, { name: args.name });
    return null;
  },
});

export const toggleUnsubscribe = mutation({
  args: { id: v.id("contacts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const contact = await ctx.db.get(args.id);
    if (!contact) throw new ConvexError({ message: "Contact not found" });

    await ctx.db.patch(args.id, { unsubscribed: !contact.unsubscribed });
    return null;
  },
});

// =============================================================================
// Internal
// =============================================================================

/** Record a public join (waitlist signup). Returns true if new, false if already existed. */
export const recordJoin = internalMutation({
  args: {
    email: v.string(),
    source: v.optional(v.string()),
  },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const email = args.email.toLowerCase().trim();
    const existing = await ctx.db
      .query("contacts")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existing) return false;

    const contactId = await ctx.db.insert("contacts", {
      email,
      source: "waitlist",
      unsubscribed: false,
    });

    // Auto-add to "Waitlist" audience if it exists
    const allAudiences = await ctx.db.query("audiences").collect();
    const waitlistAudience = allAudiences.find((a) => a.name === "Waitlist");
    if (waitlistAudience) {
      await ctx.db.insert("audienceMembers", {
        audienceId: waitlistAudience._id,
        contactId,
      });
    }

    return true;
  },
});

/** Get all contacts belonging to an audience (used by broadcast send). */
export const listByAudience = internalQuery({
  args: { audienceId: v.id("audiences") },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("audienceMembers")
      .withIndex("by_audienceId", (q) => q.eq("audienceId", args.audienceId))
      .collect();

    const contacts = await Promise.all(
      members.map((m) => ctx.db.get(m.contactId))
    );

    return contacts
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .map((c) => ({
        _id: c._id,
        email: c.email,
        unsubscribed: c.unsubscribed,
      }));
  },
});

/** Set a contact as unsubscribed by email (used by unsubscribe endpoint). */
export const processUnsubscribe = internalMutation({
  args: { email: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const contact = await ctx.db
      .query("contacts")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (contact) {
      await ctx.db.patch(contact._id, { unsubscribed: true });
    }
    return null;
  },
});
