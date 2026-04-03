import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { registerRoutes } from "@nativesquare/soma";
import { auth } from "./auth";
import { resend } from "./emails";
import { streamChat } from "./ai/http_action";

const http = httpRouter();

// Auth routes
auth.addHttpRoutes(http);

// Resend webhook for email delivery tracking
// Set up webhook in Resend dashboard pointing to:
// https://<your-deployment>.convex.site/resend-webhook
// Enable all email.* events and set RESEND_WEBHOOK_SECRET env var
http.route({
  path: "/resend-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    return await resend.handleResendEventWebhook(ctx, req);
  }),
});

// AI Streaming endpoint for conversational coach
// Story 2.1: AI SDK Integration & Streaming Infrastructure
http.route({
  path: "/api/ai/stream",
  method: "POST",
  handler: streamChat,
});

// Soma — Garmin OAuth callback + all webhook endpoints
registerRoutes(http, components.soma, {
  garmin: {
    oauth: {
      redirectTo: "cadence://oauth/garmin/complete",
      onComplete: async (ctx, event) => {
        await ctx.runMutation(
          internal.integrations.garmin.sync.storeGarminUserMapping,
          { cadenceUserId: event.userId },
        );
      },
    },
    webhook: {
      events: {
        activities: async (ctx, event) => {
          const userIds = event.affectedUsers.map((u) => u.userId);
          if (userIds.length === 0) return;
          await ctx.runAction(
            internal.integrations.garmin.webhook.handleActivityIngested,
            { affectedUserIds: userIds },
          );
        },
      },
    },
  },
});

export default http;
