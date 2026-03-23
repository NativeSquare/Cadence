import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
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

// Garmin activity webhook — receives push notifications from Garmin
// when a user completes a workout. Soma ingests the activity, then
// Cadence matches it to a planned session and sends a push notification.
http.route({
  path: "/api/garmin/webhook/activities",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    let payload: unknown;
    try {
      payload = await req.json();
    } catch {
      return new Response("Invalid JSON body", { status: 400 });
    }

    try {
      await ctx.runAction(
        internal.integrations.garmin.webhook.processActivityWebhook,
        { payload },
      );
    } catch (error) {
      // Log but return 200 to prevent Garmin from retrying
      console.error(
        "[garmin:webhook] Processing error:",
        error instanceof Error ? error.message : error,
      );
    }

    return new Response("OK", { status: 200 });
  }),
});

export default http;
