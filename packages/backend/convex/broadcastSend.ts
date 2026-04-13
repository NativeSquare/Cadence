"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { resend, buildBroadcastHtml } from "./emails";
import { generateUnsubscribeUrl } from "./unsubscribe";

export const sendAll = internalAction({
  args: { id: v.id("broadcasts") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const broadcast = await ctx.runQuery(internal.broadcasts.getInternal, {
      id: args.id,
    });
    if (!broadcast) throw new Error("Broadcast not found");
    if (!broadcast.audienceId) throw new Error("Broadcast has no audience");

    // Get eligible contacts for this audience
    const contacts = await ctx.runQuery(internal.contacts.listByAudience, {
      audienceId: broadcast.audienceId,
    });
    const eligible = contacts.filter((c) => !c.unsubscribed);

    // Create broadcastRecipient rows for tracking
    if (eligible.length > 0) {
      await ctx.runMutation(internal.broadcasts.createRecipientRows, {
        broadcastId: args.id,
        recipients: eligible.map((c) => ({
          contactId: c._id,
          email: c.email,
        })),
      });
    }

    const isDev = process.env.IS_DEV === "true";
    let sentCount = 0;
    let failedCount = 0;
    let lastError = "";

    for (const contact of eligible) {
      try {
        const unsubscribeUrl = generateUnsubscribeUrl(contact.email);

        if (isDev) {
          console.log(
            `[DEV] Broadcast "${broadcast.subject}" → ${contact.email}`
          );
        } else {
          const html = buildBroadcastHtml(broadcast.bodyHtml, unsubscribeUrl);
          await resend.sendEmail(ctx, {
            from: `Cadence <no-reply@dev.nativesquare.fr>`,
            to: contact.email,
            subject: broadcast.subject,
            html,
            headers: [
              {
                name: "List-Unsubscribe",
                value: `<${unsubscribeUrl}>`,
              },
              {
                name: "List-Unsubscribe-Post",
                value: "List-Unsubscribe=One-Click",
              },
            ],
          });
        }

        sentCount++;
        await ctx.runMutation(internal.broadcasts.updateRecipientStatus, {
          broadcastId: args.id,
          contactId: contact._id,
          status: "sent",
          sentAt: Date.now(),
        });
      } catch (err) {
        failedCount++;
        lastError = err instanceof Error ? err.message : String(err);
        console.error(
          `Failed to send broadcast to ${contact.email}:`,
          lastError
        );
        await ctx.runMutation(internal.broadcasts.updateRecipientStatus, {
          broadcastId: args.id,
          contactId: contact._id,
          status: "failed",
          error: lastError,
        });
      }
    }

    await ctx.runMutation(internal.broadcasts.markSent, {
      id: args.id,
      sentCount,
      failedCount,
      errorMessage: failedCount > 0 ? lastError : undefined,
    });

    return null;
  },
});
