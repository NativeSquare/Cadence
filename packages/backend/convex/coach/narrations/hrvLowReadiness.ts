/**
 * Narration: HRV-low readiness intervention.
 *
 * One-shot voice for the Engine's HRV adaptation. The Engine has already
 * modified the workout and recorded the intervention row (see
 * `engine/checkHrv.ts`) — this just turns the deterministic facts into prose
 * in the user's locale and tone, saves it to the coach thread, and patches
 * the body onto the intervention row so the workout detail card can render
 * it.
 *
 * Routes through `deliverCoachNarration` (narrate profile): Haiku writes the
 * notification, the agent saves it as an assistant message, and the push
 * fires as a consequence. No tools, single step, no prior context.
 */

import { v } from "convex/values";
import { api, internal } from "../../_generated/api";
import { internalAction } from "../../_generated/server";
import { composeNarrationSystem } from "../instructions";
import { deliverCoachNarration, ensureCoachThread } from "../turns";

const MISSION =
  "You are Cadence, an AI running coach. You just auto-modified the athlete's next high-intensity workout because their HRV is down. You're notifying them after the fact — you don't ask permission, you tell them what you did and why.";

function buildFacts(args: {
  originalName: string;
  originalType: string;
  newDurationMin: number;
  hrvToday: number;
  hrvBaseline14d: number;
  sleepHoursLastNight: number | undefined;
}): string {
  const sleepLine =
    args.sleepHoursLastNight !== undefined
      ? `Sleep last night: ${args.sleepHoursLastNight.toFixed(1)} h.`
      : "Sleep data unavailable.";
  return [
    `HRV today: ${args.hrvToday.toFixed(0)} ms`,
    `HRV 14-day baseline: ${args.hrvBaseline14d.toFixed(0)} ms`,
    sleepLine,
    `Original session: "${args.originalName}" (type: ${args.originalType})`,
    `Replaced with: easy Z2 run, ${args.newDurationMin} minutes`,
  ].join("\n");
}

function fallbackNotification(
  locale: "en" | "fr",
  args: {
    originalName: string;
    newDurationMin: number;
    hrvToday: number;
    hrvBaseline14d: number;
  },
): string {
  const today = Math.round(args.hrvToday);
  const base = Math.round(args.hrvBaseline14d);
  if (locale === "fr") {
    return `HRV à ${today} ms vs base ${base}. J'ai remplacé ${args.originalName} par un Z2 facile de ${args.newDurationMin} min.`;
  }
  return `HRV at ${today} ms vs baseline ${base}. I swapped ${args.originalName} for an easy Z2 of ${args.newDurationMin} min.`;
}

export const sendForIntervention = internalAction({
  args: { interventionId: v.id("coachInterventions") },
  returns: v.null(),
  handler: async (ctx, { interventionId }): Promise<null> => {
    const intervention = await ctx.runQuery(
      internal.engine.checkHrv.getIntervention,
      { interventionId },
    );
    if (!intervention) return null;
    const user = await ctx.runQuery(api.table.users.get, {
      id: intervention.userId,
    });
    const locale: "en" | "fr" = user?.locale === "fr" ? "fr" : "en";
    const tone = user?.coachPrefs?.tone ?? "mentor";

    const newDurationMin = Math.round(
      (intervention.newDurationSeconds ?? 30 * 60) / 60,
    );

    const threadId = await ensureCoachThread(ctx, intervention.userId);
    const body = await deliverCoachNarration(ctx, {
      userId: intervention.userId,
      threadId,
      system: composeNarrationSystem({ locale, tone, mission: MISSION }),
      facts: buildFacts({
        originalName: intervention.originalName,
        originalType: intervention.originalType,
        newDurationMin,
        hrvToday: intervention.signals.hrvToday,
        hrvBaseline14d: intervention.signals.hrvBaseline14d,
        sleepHoursLastNight: intervention.signals.sleepHoursLastNight,
      }),
      fallback: fallbackNotification(locale, {
        originalName: intervention.originalName,
        newDurationMin,
        hrvToday: intervention.signals.hrvToday,
        hrvBaseline14d: intervention.signals.hrvBaseline14d,
      }),
      logTag: "hrvLowReadiness",
    });

    // Persist the prose on the intervention row so the workout detail card
    // can render it (see coach-intervention-card.tsx).
    await ctx.runMutation(
      internal.engine.checkHrv.setInterventionNotificationText,
      { interventionId, body },
    );
    return null;
  },
});
