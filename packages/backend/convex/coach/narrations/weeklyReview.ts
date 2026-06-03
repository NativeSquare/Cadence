/**
 * Narration: weekly plan review.
 *
 * The Engine has already reshaped the upcoming week and recorded the review row
 * (see engine/weeklyReview.ts). This turns the deterministic facts into prose
 * in the athlete's locale + tone, posts it to the coach thread, and patches the
 * body onto the review row.
 *
 * Branches on tier because the Coach speaks to the cause — a single slip (hold
 * back the progression) vs. a rough stretch (a full recovery week) — even when
 * the mechanism (less volume next week) rhymes.
 */

import { v } from "convex/values";
import { api, internal } from "../../_generated/api";
import { internalAction } from "../../_generated/server";
import { composeNarrationSystem } from "../instructions";
import { deliverCoachNarration, ensureCoachThread } from "../turns";

const MISSION_SLIP =
  "You are Cadence, an AI running coach. Last week slipped a bit, so you held back the planned progression and made the upcoming week a touch lighter instead of piling more on. You're notifying the athlete after the fact — you don't ask permission, you tell them what you did and why, and you keep it encouraging.";

const MISSION_DELOAD =
  "You are Cadence, an AI running coach. Last week (or two in a row) went off the rails, so you turned the upcoming week into a recovery week: less volume and the easy filler runs dropped, keeping the key sessions lighter. You're notifying the athlete after the fact — you don't ask permission, you tell them what you did and why, and you reassure them that backing off now protects the goal.";

function buildFacts(args: {
  tier: number;
  keyMissed: number;
  keyTotal: number;
  completionPct: number;
  reductionPct: number;
  droppedCount: number;
  streakEscalated: boolean;
}): string {
  const lines = [
    `Missed key sessions last week: ${args.keyMissed}/${args.keyTotal}`,
    `Week completion: ${args.completionPct}%`,
  ];
  if (args.streakEscalated) lines.push("Second down week in a row.");
  if (args.reductionPct > 0)
    lines.push(`Upcoming week volume reduced by ${args.reductionPct}%.`);
  if (args.droppedCount > 0)
    lines.push(`Dropped ${args.droppedCount} easy filler run(s) from the week.`);
  return lines.join("\n");
}

function fallback(
  locale: "en" | "fr",
  args: { tier: number; reductionPct: number; droppedCount: number },
): string {
  if (locale === "fr") {
    if (args.tier >= 2) {
      const drop =
        args.droppedCount > 0
          ? ` et retiré ${args.droppedCount} footing(s) facile(s)`
          : "";
      return `Semaine compliquée. J'ai allégé la semaine qui vient en semaine de récup : volume réduit de ${args.reductionPct}%${drop}. On recule un peu pour mieux avancer.`;
    }
    return `La semaine dernière a un peu glissé. J'ai retenu la progression et allégé la semaine qui vient de ${args.reductionPct}%. On garde le rythme.`;
  }
  if (args.tier >= 2) {
    const drop =
      args.droppedCount > 0
        ? ` and dropped ${args.droppedCount} easy run(s)`
        : "";
    return `Rough week. I turned the upcoming week into a recovery week: volume down ${args.reductionPct}%${drop}. Backing off now protects the goal.`;
  }
  return `Last week slipped a little. I held the progression and eased the upcoming week by ${args.reductionPct}%. We keep the rhythm.`;
}

export const sendForReview = internalAction({
  args: { reviewId: v.id("weeklyReviews") },
  returns: v.null(),
  handler: async (ctx, { reviewId }): Promise<null> => {
    const review = await ctx.runQuery(internal.engine.weeklyReview.getReview, {
      reviewId,
    });
    if (!review || !review.changed) return null;

    const user = await ctx.runQuery(api.table.users.get, { id: review.userId });
    const locale: "en" | "fr" = user?.locale === "fr" ? "fr" : "en";
    const tone = user?.coachPrefs?.tone ?? "mentor";

    const reductionPct = Math.round((1 - review.scaleFactor) * 100);
    const completionPct = Math.round(review.signals.completionRatio * 100);
    const droppedCount = review.droppedWorkoutIds.length;

    const mission = review.tier >= 2 ? MISSION_DELOAD : MISSION_SLIP;
    const facts = buildFacts({
      tier: review.tier,
      keyMissed: review.signals.keyMissed,
      keyTotal: review.signals.keyTotal,
      completionPct,
      reductionPct,
      droppedCount,
      streakEscalated: review.signals.streakEscalated,
    });
    const fb = fallback(locale, { tier: review.tier, reductionPct, droppedCount });

    const threadId = await ensureCoachThread(ctx, review.userId);
    const body = await deliverCoachNarration(ctx, {
      userId: review.userId,
      threadId,
      system: composeNarrationSystem({ locale, tone, mission }),
      facts,
      fallback: fb,
      logTag: `weeklyReview:tier${review.tier}`,
    });

    await ctx.runMutation(
      internal.engine.weeklyReview.setReviewNotificationText,
      { reviewId, body },
    );
    return null;
  },
});
