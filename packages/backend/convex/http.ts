import { httpRouter, type GenericActionCtx, type GenericDataModel } from "convex/server";
import { httpAction } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { registerRoutes } from "@nativesquare/soma";
import { auth } from "./auth";
import { resend } from "./emails";

const http = httpRouter();

// ---------------------------------------------------------------------------
// Garmin activity → Agoge planned workout reconciliation
// ---------------------------------------------------------------------------

type GarminActivitySummary = {
  activityName?: string;
  activityType?: string;
  startTimeInSeconds?: number;
  startTimeOffsetInSeconds?: number;
  distanceInMeters?: number;
  durationInSeconds?: number;
  averageHeartRateInBeatsPerMinute?: number;
  maxHeartRateInBeatsPerMinute?: number;
};

async function reconcileGarminActivityWithPlannedWorkout(
  ctx: GenericActionCtx<GenericDataModel>,
  userId: string,
  summary: GarminActivitySummary,
  source: "activities" | "activity-details",
) {
  const {
    activityName,
    activityType,
    startTimeInSeconds,
    startTimeOffsetInSeconds = 0,
    distanceInMeters,
    durationInSeconds,
    averageHeartRateInBeatsPerMinute,
    maxHeartRateInBeatsPerMinute,
  } = summary;

  if (!activityName || activityType !== "RUNNING" || !startTimeInSeconds) {
    return;
  }

  const athlete = await ctx.runQuery(
    components.agoge.public.getAthleteByUserId,
    { userId },
  );
  if (!athlete) {
    console.log(`[Reconcile:${source}] no athlete for userId=${userId}`);
    return;
  }

  const activityStartIso = new Date(startTimeInSeconds * 1000).toISOString();
  const localMs = (startTimeInSeconds + startTimeOffsetInSeconds) * 1000;
  const localYmd = new Date(localMs).toISOString().slice(0, 10);

  const planned = await ctx.runQuery(
    components.agoge.public.getPlannedWorkoutsByAthlete,
    {
      athleteId: athlete._id,
      startDate: `${localYmd}T00:00:00.000Z`,
      endDate: `${localYmd}T23:59:59.999Z`,
    },
  );

  const haystack = activityName.toLowerCase();
  const candidates = planned.filter((w) =>
    haystack.includes(w.name.toLowerCase()),
  );

  if (candidates.length === 0) {
    console.log(
      `[Reconcile:${source}] activityName="${activityName}" localDay=${localYmd} — no match (${planned.length} planned)`,
    );
    return;
  }

  // Tiebreak: pick the planned workout whose planned.date is closest to the
  // activity start time. Works for both single- and multi-match.
  const activityStartMs = startTimeInSeconds * 1000;
  const best = candidates.reduce((acc, w) => {
    const accDelta = Math.abs(Date.parse(acc.planned!.date) - activityStartMs);
    const wDelta = Math.abs(Date.parse(w.planned!.date) - activityStartMs);
    return wDelta < accDelta ? w : acc;
  });

  await ctx.runMutation(components.agoge.public.updateWorkout, {
    workoutId: best._id,
    status: "completed",
    actual: {
      date: activityStartIso,
      ...(distanceInMeters !== undefined && { distanceMeters: distanceInMeters }),
      ...(durationInSeconds !== undefined && { durationSeconds: durationInSeconds }),
      ...(averageHeartRateInBeatsPerMinute !== undefined && {
        avgHr: averageHeartRateInBeatsPerMinute,
      }),
      ...(maxHeartRateInBeatsPerMinute !== undefined && {
        maxHr: maxHeartRateInBeatsPerMinute,
      }),
    },
  });

  console.log(
    `[Reconcile:${source}] wrote actual to workoutId=${best._id} (name="${best.name}", candidates=${candidates.length})`,
  );
}

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

// ---------------------------------------------------------------------------
// RevenueCat webhook — authoritative mirror of the "pro" entitlement.
// Configure in the RevenueCat dashboard pointing to:
//   https://<your-deployment>.convex.site/revenuecat-webhook
// Set the dashboard's "Authorization header value" and store the same string
// in the REVENUECAT_WEBHOOK_AUTH env var.
// ---------------------------------------------------------------------------

type RevenueCatEvent = {
  type?: string;
  app_user_id?: string;
  product_id?: string;
  expiration_at_ms?: number;
  period_type?: string;
  store?: string;
};

// Events that revoke access outright. Everything else keeps access until the
// reported expiration (e.g. CANCELLATION = auto-renew off, access until period
// end). Refund-driven revocations arrive with an expiration in the past.
const INACTIVE_EVENT_TYPES = new Set([
  "EXPIRATION",
  "SUBSCRIPTION_PAUSED",
]);

http.route({
  path: "/revenuecat-webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const expected = process.env.REVENUECAT_WEBHOOK_AUTH;
    if (expected) {
      if (req.headers.get("Authorization") !== expected) {
        return new Response("Unauthorized", { status: 401 });
      }
    } else {
      console.warn(
        "[RevenueCat] REVENUECAT_WEBHOOK_AUTH not set — webhook is unauthenticated",
      );
    }

    let event: RevenueCatEvent | undefined;
    try {
      const body = (await req.json()) as { event?: RevenueCatEvent };
      event = body.event;
    } catch {
      return new Response("Bad request", { status: 400 });
    }

    // TEST events and anything without an app_user_id are acknowledged & dropped.
    if (!event?.app_user_id || event.type === "TEST") {
      return new Response("Ignored", { status: 200 });
    }

    const expirationMs = event.expiration_at_ms ?? null;
    const active =
      !INACTIVE_EVENT_TYPES.has(event.type ?? "") &&
      (expirationMs == null || expirationMs > Date.now());

    await ctx.runMutation(internal.table.users.applyRevenueCatEvent, {
      appUserId: event.app_user_id,
      active,
      productId: event.product_id ?? undefined,
      expiresAt: expirationMs
        ? new Date(expirationMs).toISOString()
        : undefined,
      isTrial: event.period_type === "TRIAL",
      willRenew: event.type !== "CANCELLATION",
      store: event.store ?? undefined,
    });

    return new Response("OK", { status: 200 });
  }),
});

// Soma webhook endpoints
registerRoutes(http, components.soma, {
  strava: {
    oauth: {
      redirectTo: "cadence://oauth/strava/complete",
      // onComplete: async (ctx, event) => {
      //   await ctx.scheduler.runAfter(0, internal.soma.strava.pullAll, {
      //     userId: event.userId,
      //   });
      // },
    },
    webhook: {
      events: {
        "athlete-deauthorize": true,
      },
    },
  },
  garmin: {
    oauth: {
      redirectTo: "cadence://oauth/garmin/complete",
      onComplete: async (ctx, event) => {
        await ctx.scheduler.runAfter(120_000, internal.soma.garmin.backfillAll, {
          userId: event.userId,
        });
      },
    },
    webhook: {
      events: {
        "activities": {
          autoIngest: false,
          rawPassthrough: true,
          handler: async (ctx, event) => {
            for (const item of event.items) {
              try {
                await reconcileGarminActivityWithPlannedWorkout(
                  ctx,
                  item.userId,
                  item.data as GarminActivitySummary,
                  "activities",
                );
              } catch (err) {
                console.log(
                  `[Reconcile:activities] error: ${(err as Error)?.message ?? String(err)}`,
                );
              }
            }
          },
        },
        // "activity-details": true,
        "blood-pressures": true,
        "body-compositions": true,
        "dailies": true,
        // "epochs": true,
        "health-snapshot": true,
        "sleeps": true,
        "hrv": true,
        "stress": true,
        "pulse-ox": true,
        "respiration": true,
        "skin-temp": true,
        "user-metrics": true,
        "menstrual-cycle-tracking": true,
        "deregistration": true,
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
