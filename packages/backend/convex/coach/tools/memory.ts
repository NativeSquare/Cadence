/**
 * Memory tool — silent write, no approval card.
 *
 * Sits between reading.ts (auto-execute, no DB write) and writing.ts (DB
 * write gated by approval). The coach uses this to record stable facts about
 * the athlete that don't change turn-to-turn. Every row inserted here is
 * appended verbatim to the athlete's system prompt on every future turn, and
 * is shown verbatim in the in-app Context sheet — so the user always sees
 * what the coach is being told. No notification, no inline pill: the Context
 * sheet is the only surface.
 */

import { createTool } from "@convex-dev/agent";
import { z } from "zod";
import { api } from "../../_generated/api";

export const memoryTools = {
  rememberAboutAthlete: createTool({
    description:
      "Record a stable fact about the athlete to use across all future " +
      "conversations. Use sparingly for things that won't change turn-to-turn: " +
      "preferences (e.g. 'prefers morning runs', 'hates treadmill intervals'), " +
      "life context (e.g. 'works night shifts on Tuesdays', 'father of two young " +
      "kids', 'lives at 1,500 m altitude'), long-term goals (e.g. 'wants to run " +
      "an ultra by 2027'), injury history (e.g. 'recurring left Achilles " +
      "tendinopathy, flares with sudden volume jumps'), and similar identity-" +
      "level facts the athlete has shared.\n\n" +
      "Do NOT use for: today's signals (HRV, sleep, body battery), single-" +
      "session events (yesterday's run, a one-off missed workout), or anything " +
      "that's already readable via the Agoge/Soma tools (current plan, current " +
      "block, recent workouts, profile fields). Those are looked up live.\n\n" +
      "Write the memory in the second person as advice-to-future-self: short, " +
      "one sentence, declarative. Example: 'Trains Tue/Thu/Sat/Sun; works late " +
      "Mon and Wed.' The athlete will see the exact text you write — keep it " +
      "respectful and accurate. There is no undo: if a memory is wrong, you " +
      "can only add a new one stating the correction.",
    inputSchema: z.object({
      text: z
        .string()
        .min(1)
        .max(280)
        .describe(
          "The memory to store, verbatim. One short sentence. Athlete-facing.",
        ),
    }),
    needsApproval: false,
    execute: async (ctx, { text }): Promise<{ ok: true }> => {
      await ctx.runMutation(api.table.coachMemories.addForCurrentUser, {
        text,
      });
      return { ok: true };
    },
  }),
};
