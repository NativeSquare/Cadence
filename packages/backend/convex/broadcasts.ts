import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAdmin } from "./table/admin";

// =============================================================================
// Queries
// =============================================================================

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const broadcasts = await ctx.db
      .query("broadcasts")
      .order("desc")
      .collect();

    // Enrich with audience name
    return await Promise.all(
      broadcasts.map(async (b) => {
        let audienceName: string | undefined;
        if (b.audienceId) {
          const audience = await ctx.db.get(b.audienceId);
          audienceName = audience?.name;
        }
        return { ...b, audienceName };
      })
    );
  },
});

export const get = query({
  args: { id: v.id("broadcasts") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const broadcast = await ctx.db.get(args.id);
    if (!broadcast) return null;

    let audienceName: string | undefined;
    if (broadcast.audienceId) {
      const audience = await ctx.db.get(broadcast.audienceId);
      audienceName = audience?.name;
    }
    return { ...broadcast, audienceName };
  },
});

/** Paginated list of recipients for a sent broadcast. */
export const getRecipients = query({
  args: {
    broadcastId: v.id("broadcasts"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("broadcastRecipients")
      .withIndex("by_broadcastId", (q) =>
        q.eq("broadcastId", args.broadcastId)
      )
      .paginate(args.paginationOpts);
  },
});

// =============================================================================
// Mutations
// =============================================================================

export const create = mutation({
  args: {
    subject: v.string(),
    bodyHtml: v.string(),
    audienceId: v.optional(v.id("audiences")),
  },
  returns: v.id("broadcasts"),
  handler: async (ctx, args) => {
    const { userId } = await requireAdmin(ctx);
    return await ctx.db.insert("broadcasts", {
      subject: args.subject,
      bodyHtml: args.bodyHtml,
      audienceId: args.audienceId,
      status: "draft",
      createdBy: userId,
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("broadcasts"),
    subject: v.string(),
    bodyHtml: v.string(),
    audienceId: v.optional(v.id("audiences")),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const broadcast = await ctx.db.get(args.id);
    if (!broadcast) throw new Error("Broadcast not found");
    if (broadcast.status !== "draft") {
      throw new Error("Only drafts can be edited");
    }
    await ctx.db.patch(args.id, {
      subject: args.subject,
      bodyHtml: args.bodyHtml,
      audienceId: args.audienceId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const remove = mutation({
  args: { id: v.id("broadcasts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const broadcast = await ctx.db.get(args.id);
    if (!broadcast) throw new Error("Broadcast not found");
    if (broadcast.status !== "draft") {
      throw new Error("Only drafts can be deleted");
    }
    await ctx.db.delete(args.id);
    return null;
  },
});

export const initiateSend = mutation({
  args: { id: v.id("broadcasts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { userId } = await requireAdmin(ctx);
    const broadcast = await ctx.db.get(args.id);
    if (!broadcast) throw new Error("Broadcast not found");
    if (broadcast.status !== "draft") {
      throw new Error("Only drafts can be sent");
    }
    if (!broadcast.audienceId) {
      throw new Error("Select an audience before sending");
    }

    // Count eligible recipients (audience members minus unsubscribed)
    const members = await ctx.db
      .query("audienceMembers")
      .withIndex("by_audienceId", (q) =>
        q.eq("audienceId", broadcast.audienceId!)
      )
      .collect();

    let recipientCount = 0;
    for (const member of members) {
      const contact = await ctx.db.get(member.contactId);
      if (contact && !contact.unsubscribed) recipientCount++;
    }

    if (recipientCount === 0) {
      throw new Error("No eligible recipients in this audience");
    }

    await ctx.db.patch(args.id, {
      status: "sending",
      sentBy: userId,
      sentAt: Date.now(),
      recipientCount,
      sentCount: 0,
      failedCount: 0,
      updatedAt: Date.now(),
    });

    await ctx.scheduler.runAfter(0, internal.broadcastSend.sendAll, {
      id: args.id,
    });

    return null;
  },
});

/** Send a test email with the broadcast content to a single address. */
export const testSend = mutation({
  args: {
    subject: v.string(),
    bodyHtml: v.string(),
    testEmail: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.scheduler.runAfter(0, internal.emails.sendBroadcastEmail, {
      to: args.testEmail,
      subject: `[TEST] ${args.subject}`,
      bodyHtml: args.bodyHtml,
    });
    return null;
  },
});

// =============================================================================
// Internal
// =============================================================================

export const markSent = internalMutation({
  args: {
    id: v.id("broadcasts"),
    sentCount: v.number(),
    failedCount: v.number(),
    errorMessage: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const status =
      args.sentCount === 0 && args.failedCount > 0 ? "failed" : "sent";
    await ctx.db.patch(args.id, {
      status,
      sentCount: args.sentCount,
      failedCount: args.failedCount,
      errorMessage: args.errorMessage,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Internal query used by the sendAll action. */
export const getInternal = internalQuery({
  args: { id: v.id("broadcasts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/** Batch-insert broadcastRecipient rows with status "pending". */
export const createRecipientRows = internalMutation({
  args: {
    broadcastId: v.id("broadcasts"),
    recipients: v.array(
      v.object({
        contactId: v.id("contacts"),
        email: v.string(),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const r of args.recipients) {
      await ctx.db.insert("broadcastRecipients", {
        broadcastId: args.broadcastId,
        contactId: r.contactId,
        email: r.email,
        status: "pending",
      });
    }
    return null;
  },
});

/** Update a single recipient's delivery status. */
export const updateRecipientStatus = internalMutation({
  args: {
    broadcastId: v.id("broadcasts"),
    contactId: v.id("contacts"),
    status: v.union(v.literal("sent"), v.literal("failed")),
    sentAt: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const recipient = await ctx.db
      .query("broadcastRecipients")
      .withIndex("by_broadcastId", (q) =>
        q.eq("broadcastId", args.broadcastId)
      )
      .filter((q) => q.eq(q.field("contactId"), args.contactId))
      .first();

    if (recipient) {
      await ctx.db.patch(recipient._id, {
        status: args.status,
        sentAt: args.sentAt,
        error: args.error,
      });
    }
    return null;
  },
});
