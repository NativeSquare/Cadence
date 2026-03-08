import { httpRouter } from "convex/server";
import { registerRoutes } from "@nativesquare/soma";
import { httpAction } from "./_generated/server";
import { components } from "./_generated/api";
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

// Soma OAuth callback routes (Garmin OAuth 1.0a).
// Soma handles the token exchange, connection creation, and initial data sync
// inside the callback handler, then redirects to onSuccess.
registerRoutes(http, components.soma, {
  garmin: {
    onSuccess: "cadence://localhost/garmin-oauth",
  },
});

export default http;
