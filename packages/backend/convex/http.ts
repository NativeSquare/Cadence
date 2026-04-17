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

// Soma — Strava + Garmin OAuth callbacks + webhook endpoints
registerRoutes(http, components.soma, {
  strava: {
    oauth: {
      redirectTo: "cadence://oauth/strava/complete",
    },
  },
  garmin: {
    oauth: {
      redirectTo: "cadence://oauth/garmin/complete",
      onComplete: async (ctx, event) => {
        await ctx.runAction(internal.soma.garmin.pullAll, {
          userId: event.userId,
        });
      },
    },
    webhook: {
      events: {
        activities: async (ctx, event) => {
          const userIds = [...new Set(event.items.map((item) => item.userId))];
          if (userIds.length === 0) return;
          await ctx.runAction(
            internal.soma.webhook.handleActivityIngested,
            { affectedUserIds: userIds },
          );
        },
      },
    },
  },
});

// =============================================================================
// Unsubscribe endpoints
// =============================================================================

// GET — user clicks unsubscribe link in email
http.route({
  path: "/unsubscribe",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const token = url.searchParams.get("token");

    if (!email || !token) {
      return new Response("Invalid unsubscribe link.", {
        status: 400,
        headers: { "Content-Type": "text/plain" },
      });
    }

    const success = await ctx.runAction(
      internal.unsubscribe.handleUnsubscribe,
      { email, token }
    );

    if (!success) {
      return new Response("Invalid or expired unsubscribe link.", {
        status: 400,
        headers: { "Content-Type": "text/plain" },
      });
    }

    return new Response(
      `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Unsubscribed</title>
<style>body{margin:0;padding:60px 20px;background:#f3f3f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;text-align:center;}
.card{max-width:420px;margin:0 auto;background:#fff;border-radius:16px;border:1px solid #e5e5e5;padding:40px 32px;}
h1{font-size:22px;color:#131313;margin:0 0 12px;}
p{font-size:14px;color:#797979;line-height:1.6;margin:0;}</style>
</head><body><div class="card"><h1>You've been unsubscribed</h1><p>You will no longer receive marketing emails from Cadence.</p></div></body></html>`,
      {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }
    );
  }),
});

// POST — one-click unsubscribe per RFC 8058
http.route({
  path: "/unsubscribe",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const url = new URL(req.url);
    const email = url.searchParams.get("email");
    const token = url.searchParams.get("token");

    if (!email || !token) {
      return new Response("Bad request", { status: 400 });
    }

    const success = await ctx.runAction(
      internal.unsubscribe.handleUnsubscribe,
      { email, token }
    );

    return new Response(success ? "OK" : "Invalid token", {
      status: success ? 200 : 400,
    });
  }),
});

export default http;
