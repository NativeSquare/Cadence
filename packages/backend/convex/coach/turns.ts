import { createThread, saveMessage } from "@convex-dev/agent";
import { v } from "convex/values";
import { api, components, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { type ActionCtx, internalAction } from "../_generated/server";
import { coach } from "./agent";
import { composeCoachSystem } from "./instructions";
import { profiles } from "./profiles";

type Attachment = {
  url: string;
  mimeType: string;
  kind: "image" | "file";
};

export type TurnSeed =
  | { kind: "text"; text: string }
  | { kind: "multimodal"; text: string; attachments: Attachment[] }
  | { kind: "continue"; promptMessageId: string };

/**
 * Single entry point for "wake the coach up and produce a turn" in chat mode.
 *
 * Every interactive trigger funnels through here — `messages.send` today,
 * any future chat-style trigger tomorrow. It owns the
 * three things every chat turn does — resolve the per-user system prompt,
 * stream the model with the `chat` profile (full tools, multi-step), and
 * notify on reply. The agent auto-saves the prompt + assistant output.
 *
 * Use this plain function from inside an action that's already awaiting the
 * stream. From a mutation/HTTP handler/cron, schedule `internal.coach.turns.run`
 * instead — Convex mutations cannot call actions inline.
 *
 * For coach-initiated narration (daily check-in, reminders, intervention
 * notifications) use `deliverCoachNarration` — it routes through the same
 * Agent but with the `narrate` profile and assistant-only thread semantics.
 */
export async function runCoachTurn(
  ctx: ActionCtx,
  args: { userId: Id<"users">; threadId: string; seed: TurnSeed },
): Promise<void> {
  const system = await buildSystemForUser(ctx, args.userId);
  const userIdStr = args.userId as string;
  const profile = profiles.chat;

  const result = await coach.streamText(
    ctx,
    { threadId: args.threadId, userId: userIdStr },
    { ...seedToInput(args.seed, system), tools: profile.tools, stopWhen: profile.stopWhen },
    { saveStreamDeltas: profile.saveStreamDeltas, storageOptions: profile.storageOptions },
  );

  const preview = (await result.text).trim().slice(0, 140);
  if (!preview) return;
  await ctx.scheduler.runAfter(
    0,
    internal.notifications.sendCoachMessageNotification,
    { userId: args.userId, threadId: args.threadId, preview },
  );
}

/**
 * One-shot, coach-initiated message. Used by all narration triggers.
 *
 * Routes through the same `coach` Agent as chat but with the `narrate`
 * profile: no tools, single step, no prior thread context, and
 * `saveMessages: "none"` so the synthetic user prompt isn't persisted. The
 * assistant text is saved manually as an `agent`-tagged message — the thread
 * shows only the coach speaking, never a fake user turn.
 *
 * The caller provides a deterministic `fallback` string. If the LLM call
 * throws or returns empty, we save the fallback instead so the user always
 * gets a notification. Returns the text that was saved (LLM output or
 * fallback) so callers like weeklyReview can persist it on their own rows.
 *
 * The push notification fires as a consequence of the new assistant message.
 */
export async function deliverCoachNarration(
  ctx: ActionCtx,
  args: {
    userId: Id<"users">;
    threadId: string;
    system: string;
    facts: string;
    fallback: string;
    logTag: string;
  },
): Promise<string> {
  const profile = profiles.narrate;
  const userIdStr = args.userId as string;

  let body = args.fallback;
  try {
    const result = await coach.streamText(
      ctx,
      { threadId: args.threadId, userId: userIdStr },
      {
        prompt: args.facts,
        system: args.system,
        tools: profile.tools,
        stopWhen: profile.stopWhen,
      },
      {
        saveStreamDeltas: profile.saveStreamDeltas,
        storageOptions: profile.storageOptions,
        contextOptions: profile.contextOptions,
      },
    );
    const trimmed = (await result.text).trim();
    if (trimmed.length > 0) body = trimmed;
  } catch (err) {
    console.warn(`[${args.logTag}] Haiku call failed, using fallback`, err);
  }

  await saveMessage(ctx, components.agent, {
    threadId: args.threadId,
    userId: userIdStr,
    message: { role: "assistant", content: body },
    agentName: "Cadence Coach",
  });

  await ctx.scheduler.runAfter(
    0,
    internal.notifications.sendCoachMessageNotification,
    { userId: args.userId, threadId: args.threadId, preview: body.slice(0, 140) },
  );

  return body;
}

/**
 * Find the user's most recent coach thread, or create one. Triggers call this
 * before `deliverCoachNarration` since they have no thread context of their
 * own — they piggyback on whichever thread the user is already in.
 */
export async function ensureCoachThread(
  ctx: ActionCtx,
  userId: Id<"users">,
): Promise<string> {
  const userIdStr = userId as string;
  const existing = await ctx.runQuery(
    components.agent.threads.listThreadsByUserId,
    {
      userId: userIdStr,
      order: "desc",
      paginationOpts: { numItems: 1, cursor: null },
    },
  );
  return (
    existing.page[0]?._id ??
    (await createThread(ctx, components.agent, { userId: userIdStr }))
  );
}

async function buildSystemForUser(
  ctx: ActionCtx,
  userId: Id<"users">,
): Promise<string> {
  const [user, memoryRows] = await Promise.all([
    ctx.runQuery(api.table.users.get, { id: userId }),
    ctx.runQuery(api.table.coachMemories.listForUser, { userId }),
  ]);
  return composeCoachSystem({
    locale: user?.locale ?? null,
    prefs: user?.coachPrefs ?? null,
    memories: memoryRows.map((m) => m.text),
    now: new Date(),
  });
}

function seedToInput(seed: TurnSeed, system: string) {
  switch (seed.kind) {
    case "text":
      return { prompt: seed.text, system };
    case "continue":
      return { promptMessageId: seed.promptMessageId, system };
    case "multimodal": {
      const content: Array<
        | { type: "text"; text: string }
        | { type: "image"; image: string; mediaType?: string }
        | { type: "file"; data: string; mediaType: string }
      > = [{ type: "text", text: seed.text }];
      for (const a of seed.attachments) {
        if (a.kind === "image") {
          content.push({ type: "image", image: a.url, mediaType: a.mimeType });
        } else {
          content.push({ type: "file", data: a.url, mediaType: a.mimeType });
        }
      }
      return { messages: [{ role: "user" as const, content }], system };
    }
  }
}

const vAttachment = v.object({
  url: v.string(),
  mimeType: v.string(),
  kind: v.union(v.literal("image"), v.literal("file")),
});

const vTurnSeed = v.union(
  v.object({ kind: v.literal("text"), text: v.string() }),
  v.object({
    kind: v.literal("multimodal"),
    text: v.string(),
    attachments: v.array(vAttachment),
  }),
  v.object({
    kind: v.literal("continue"),
    promptMessageId: v.string(),
  }),
);

/**
 * Schedulable handle around `runCoachTurn`. Use from mutations, HTTP handlers,
 * crons, and any other non-action context via
 * `ctx.scheduler.runAfter(0, internal.coach.turns.run, { ... })`.
 */
export const run = internalAction({
  args: {
    userId: v.id("users"),
    threadId: v.string(),
    seed: vTurnSeed,
  },
  handler: async (ctx, args) => {
    await runCoachTurn(ctx, args);
  },
});
