import { cronJobs } from "convex/server";
import { v } from "convex/values";
import { Seshat, formatDate } from "@nativesquare/seshat";
import { components, internal } from "./_generated/api";
import {
  internalAction,
  internalMutation,
  internalQuery,
} from "./_generated/server";

const seshat = new Seshat({ component: components.seshat });

const crons = cronJobs();

// Clean up old emails from the resend component every hour
crons.interval(
  "cleanup-old-emails",
  { hours: 1 },
  internal.crons.cleanupResendEmails,
);

// Generate daily log summaries every day at 5:00 AM UTC
crons.cron(
  "generate-daily-logs",
  "0 5 * * *",
  internal.crons.generateDailyLogs,
);

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const FOUR_WEEKS_MS = 4 * ONE_WEEK_MS;

export const cleanupResendEmails = internalMutation({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    await ctx.scheduler.runAfter(0, components.resend.lib.cleanupOldEmails, {
      olderThan: ONE_WEEK_MS,
    });
    await ctx.scheduler.runAfter(
      0,
      components.resend.lib.cleanupAbandonedEmails,
      { olderThan: FOUR_WEEKS_MS },
    );
    return null;
  },
});

// =============================================================================
// Daily Log Generation
// =============================================================================

/**
 * Find conversations that had activity yesterday.
 * Returns userId + conversationId pairs for log generation.
 */
export const getYesterdayActiveConversations = internalQuery({
  args: {
    startOfDay: v.number(),
    endOfDay: v.number(),
  },
  returns: v.array(
    v.object({
      userId: v.id("users"),
      conversationId: v.id("conversations"),
    }),
  ),
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .collect();

    const active: Array<{
      userId: typeof conversations[0]["userId"];
      conversationId: typeof conversations[0]["_id"];
    }> = [];

    for (const conv of conversations) {
      if (conv.updatedAt >= args.startOfDay && conv.updatedAt <= args.endOfDay) {
        active.push({
          userId: conv.userId,
          conversationId: conv._id,
        });
      }
    }

    return active;
  },
});

/**
 * Load messages for a conversation within a time window.
 */
export const getMessagesForDateRange = internalQuery({
  args: {
    conversationId: v.id("conversations"),
    startTime: v.number(),
    endTime: v.number(),
  },
  returns: v.array(
    v.object({
      role: v.string(),
      content: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation_time", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .order("asc")
      .collect();

    return messages
      .filter(
        (m) =>
          !m.archived &&
          m.createdAt >= args.startTime &&
          m.createdAt <= args.endTime,
      )
      .map((m) => ({ role: m.role, content: m.content }));
  },
});

/**
 * Generate daily log summaries for all users who had conversations yesterday.
 * Runs as a cron action: queries yesterday's messages, summarizes via LLM,
 * and writes daily logs to Seshat.
 */
export const generateDailyLogs = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfDay = new Date(yesterday);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(yesterday);
    endOfDay.setHours(23, 59, 59, 999);
    const dateStr = formatDate(yesterday);

    const activeConversations = await ctx.runQuery(
      internal.crons.getYesterdayActiveConversations,
      {
        startOfDay: startOfDay.getTime(),
        endOfDay: endOfDay.getTime(),
      },
    );

    if (activeConversations.length === 0) {
      console.log("[DailyLogs] No conversations yesterday, skipping.");
      return null;
    }

    const { generateText } = await import("ai");
    const { openai } = await import("@ai-sdk/openai");

    const processed = new Set<string>();

    for (const { userId, conversationId } of activeConversations) {
      const userIdStr = userId as string;
      if (processed.has(userIdStr)) continue;
      processed.add(userIdStr);

      try {
        const existingLog = await seshat.getDailyLog(ctx, {
          userId: userIdStr,
          date: dateStr,
        });
        if (existingLog) continue;

        const messages = await ctx.runQuery(
          internal.crons.getMessagesForDateRange,
          {
            conversationId,
            startTime: startOfDay.getTime(),
            endTime: endOfDay.getTime(),
          },
        );

        if (messages.length === 0) continue;

        const conversationText = messages
          .map((m) => `[${m.role}] ${m.content}`)
          .join("\n");

        const { text: summary } = await generateText({
          model: openai("gpt-4o-mini"),
          system:
            "Summarize the following coaching conversation into a concise daily log entry. " +
            "Focus on: training completed, key insights discussed, decisions made, emotional state, " +
            "and anything noteworthy. Write in third person, past tense. Be factual and brief.",
          prompt: conversationText,
          maxOutputTokens: 500,
        });

        await seshat.writeDailyLog(ctx, {
          userId: userIdStr,
          date: dateStr,
          content: summary,
        });

        console.log(`[DailyLogs] Generated log for user ${userIdStr} on ${dateStr}`);
      } catch (error) {
        console.error(
          `[DailyLogs] Failed for user ${userIdStr}:`,
          error,
        );
      }
    }

    return null;
  },
});

export default crons;
