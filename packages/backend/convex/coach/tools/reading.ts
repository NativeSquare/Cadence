/**
 * Reading tools — auto-execute, no user approval.
 *
 * Every entry in this object MUST be created with `needsApproval: false`.
 * If a tool needs approval, put it in `./writing.ts` instead.
 */

import { createTool } from "@convex-dev/agent";
import { z } from "zod";

export const readingTools = {
  /**
   * Mock reading tool — verifies the auto-execute path end-to-end.
   * Trigger from chat: "what time is it?"
   */
  getServerTime: createTool({
    description:
      "Returns the current server time as an ISO 8601 string. " +
      "Use this when the user asks about the current time or date.",
    inputSchema: z.object({
      timezone: z
        .string()
        .optional()
        .describe(
          "IANA timezone name, e.g. 'Europe/Paris'. Defaults to UTC.",
        ),
    }),
    needsApproval: false,
    execute: async (_ctx, { timezone }) => {
      const tz = timezone ?? "UTC";
      const now = new Date();
      let formatted: string;
      try {
        formatted = now.toLocaleString("en-US", { timeZone: tz });
      } catch {
        formatted = now.toLocaleString("en-US", { timeZone: "UTC" });
      }
      return {
        iso: now.toISOString(),
        timezone: tz,
        formatted,
      };
    },
  }),
};
