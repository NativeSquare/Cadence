/**
 * Narration: daily-evaluation interventions.
 *
 * One-shot voice for the Engine's daily ruleset. Engine has already modified
 * the workout and recorded the intervention row (see
 * `engine/dailyEvaluation.ts`); this turns the deterministic facts into prose
 * in the user's locale and tone, posts it to the coach thread, and patches
 * the body onto the intervention row so the workout detail card can render it.
 *
 * Branches on `ruleId` because the Coach has to speak to the *cause* — HRV
 * down vs. weekly adherence — even though the *action* (swap to easy) is the
 * same in both cases.
 */

import { v } from "convex/values";
import { api, internal } from "../../_generated/api";
import { internalAction } from "../../_generated/server";
import { composeNarrationSystem } from "../instructions";
import { deliverCoachNarration, ensureCoachThread } from "../turns";

const MISSION_HRV =
  "You are Cadence, an AI running coach. You just auto-modified the athlete's next high-intensity workout because their HRV is down. You're notifying them after the fact — you don't ask permission, you tell them what you did and why.";

const MISSION_ADHERENCE =
  "You are Cadence, an AI running coach. The athlete has missed two or more quality sessions this week. You just swapped their next quality session for an easy run to keep the week salvageable instead of stacking more intensity onto a missed-load week. You're notifying them after the fact — you don't ask permission, you tell them what you did and why.";

function buildHrvFacts(args: {
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

function buildAdherenceFacts(args: {
  originalName: string;
  originalType: string;
  newDurationMin: number;
  missedCount: number;
}): string {
  return [
    `Missed quality sessions this week: ${args.missedCount}`,
    `Original next quality session: "${args.originalName}" (type: ${args.originalType})`,
    `Replaced with: easy Z2 run, ${args.newDurationMin} minutes (same volume, dropped intensity)`,
  ].join("\n");
}

function fallbackHrv(
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

function fallbackAdherence(
  locale: "en" | "fr",
  args: {
    originalName: string;
    newDurationMin: number;
    missedCount: number;
  },
): string {
  if (locale === "fr") {
    return `${args.missedCount} séances de qualité manquées cette semaine. J'ai remplacé ${args.originalName} par un Z2 facile de ${args.newDurationMin} min pour sauver la semaine.`;
  }
  return `${args.missedCount} missed quality sessions this week. I swapped ${args.originalName} for an easy Z2 of ${args.newDurationMin} min to salvage the week.`;
}

export const sendForIntervention = internalAction({
  args: { interventionId: v.id("coachInterventions") },
  returns: v.null(),
  handler: async (ctx, { interventionId }): Promise<null> => {
    const intervention = await ctx.runQuery(
      internal.engine.interventions.getIntervention,
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

    let mission: string;
    let facts: string;
    let fallback: string;

    if (intervention.ruleId === "adherence_low_v1") {
      const missedCount = intervention.signals.weekMissedQualityCount ?? 0;
      mission = MISSION_ADHERENCE;
      facts = buildAdherenceFacts({
        originalName: intervention.originalName,
        originalType: intervention.originalType,
        newDurationMin,
        missedCount,
      });
      fallback = fallbackAdherence(locale, {
        originalName: intervention.originalName,
        newDurationMin,
        missedCount,
      });
    } else {
      // hrv_low_v1 (and any future HRV-driven rules)
      const hrvToday = intervention.signals.hrvToday ?? 0;
      const hrvBaseline14d = intervention.signals.hrvBaseline14d ?? 0;
      mission = MISSION_HRV;
      facts = buildHrvFacts({
        originalName: intervention.originalName,
        originalType: intervention.originalType,
        newDurationMin,
        hrvToday,
        hrvBaseline14d,
        sleepHoursLastNight: intervention.signals.sleepHoursLastNight,
      });
      fallback = fallbackHrv(locale, {
        originalName: intervention.originalName,
        newDurationMin,
        hrvToday,
        hrvBaseline14d,
      });
    }

    const threadId = await ensureCoachThread(ctx, intervention.userId);
    const body = await deliverCoachNarration(ctx, {
      userId: intervention.userId,
      threadId,
      system: composeNarrationSystem({ locale, tone, mission }),
      facts,
      fallback,
      logTag: `dailyEvaluation:${intervention.ruleId}`,
    });

    await ctx.runMutation(
      internal.engine.interventions.setInterventionNotificationText,
      { interventionId, body },
    );
    return null;
  },
});
