import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { type ActionCtx, internalAction } from "../_generated/server";
import { coach } from "./agent";
import { composeCoachSystem } from "./instructions";

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
 * Single entry point for "wake the coach up and produce a turn."
 *
 * Every trigger funnels through here: user chat (`messages.send`),
 * tool-approval continuation, and any future trigger (webhooks, crons,
 * proactive nudges). It owns the three things every turn does — resolve the
 * per-user system prompt, stream the model, and notify on reply.
 *
 * Use this plain function from inside an action that's already awaiting the
 * stream. From a mutation/HTTP handler/cron, schedule `internal.coach.turns.run`
 * instead — Convex mutations cannot call actions inline.
 */
export async function runCoachTurn(
  ctx: ActionCtx,
  args: { userId: Id<"users">; threadId: string; seed: TurnSeed },
): Promise<void> {
  const system = await buildSystemForUser(ctx, args.userId);
  const userIdStr = args.userId as string;

  const result = await coach.streamText(
    ctx,
    { threadId: args.threadId, userId: userIdStr },
    seedToInput(args.seed, system),
    { saveStreamDeltas: true },
  );

  const preview = (await result.text).trim().slice(0, 140);
  if (!preview) return;
  await ctx.scheduler.runAfter(
    0,
    internal.notifications.sendCoachMessageNotification,
    { userId: args.userId, threadId: args.threadId, preview },
  );
}

async function buildSystemForUser(
  ctx: ActionCtx,
  userId: Id<"users">,
): Promise<string> {
  const user = await ctx.runQuery(api.table.users.get, { id: userId });
  return composeCoachSystem({
    locale: user?.locale ?? null,
    prefs: user?.coachPrefs ?? null,
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
