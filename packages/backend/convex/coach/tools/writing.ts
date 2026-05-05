/**
 * Writing tools — proposed write, gated by user Accept/Deny in chat.
 *
 * Every entry in this object MUST be created with `needsApproval: true`.
 * The framework pauses before `execute()` runs, streams a `tool-approval-request`
 * part to the UI, and only invokes `execute()` after the user accepts via
 * `coach.messages.respondToToolApproval`. On deny, `execute()` never runs.
 *
 * Therefore `execute()` is the real DB write — no separate "draft" stage.
 */

import { createTool } from "@convex-dev/agent";
import { z } from "zod";

export const writingTools = {
  /**
   * Mock writing tool — verifies the approval round-trip end-to-end.
   * Trigger from chat: "remember that I prefer morning runs".
   * On Accept the execute() runs; on Deny it never runs.
   */
  addCoachNote: createTool({
    description:
      "Save a note about the user's training preferences or context. " +
      "The user will see a card and must Accept before the note is saved.",
    inputSchema: z.object({
      note: z
        .string()
        .min(1)
        .max(500)
        .describe("The preference or context to remember, in plain prose."),
    }),
    needsApproval: true,
    execute: async (ctx, { note }) => {
      console.log(
        `[addCoachNote mock] userId=${ctx.userId} threadId=${ctx.threadId} note=${JSON.stringify(note)}`,
      );
      return {
        saved: true,
        note,
        savedAt: new Date().toISOString(),
      };
    },
  }),
};
