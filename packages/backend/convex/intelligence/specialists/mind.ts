import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { z } from "zod";
import { internal } from "../../_generated/api";
import type { Doc, Id } from "../../_generated/dataModel";
import type { ActionCtx } from "../../_generated/server";
import { MIND_SPECIALIST_PROMPT } from "../prompts";
import type { SpecialistPerspective } from "./types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const HISTORY_WINDOW_DAYS = 30;

type UtteranceSignal = {
  role: "user" | "assistant" | "system";
  content: string;
  at: string;
};

export async function consultMind(
  ctx: ActionCtx,
  args: { subQuery: string; userId: Id<"users"> },
): Promise<SpecialistPerspective> {
  const utterances = await loadRecentUtterances(ctx, args.userId);

  const { object } = await generateObject({
    model: anthropic("claude-haiku-4-5-20251001"),
    schema: z.object({
      finding: z.string(),
      reasoning: z.string(),
      confidence: z.enum(["low", "medium", "high"]),
    }),
    system: MIND_SPECIALIST_PROMPT,
    prompt: buildMindPrompt(args.subQuery, utterances),
  });

  return { specialist: "mind", ...object };
}

async function loadRecentUtterances(
  ctx: ActionCtx,
  userId: Id<"users">,
): Promise<UtteranceSignal[]> {
  const since = Date.now() - HISTORY_WINDOW_DAYS * MS_PER_DAY;
  const msgs = await ctx.runQuery(internal.ai.messages.listRecentForUser, {
    userId,
    since,
  });
  return msgs.map(projectUtterance);
}

function projectUtterance(msg: Doc<"messages">): UtteranceSignal {
  return {
    role: msg.role,
    content: msg.content,
    at: new Date(msg.createdAt).toISOString(),
  };
}

function buildMindPrompt(
  subQuery: string,
  utterances: UtteranceSignal[],
): string {
  const block =
    utterances.length === 0
      ? "(empty — no recent conversation in the window)"
      : JSON.stringify(utterances, null, 2);

  return `Router sub-query: ${subQuery}

Recent conversation (last ${HISTORY_WINDOW_DAYS}d, active conversation only, oldest first):
${block}

Respond with a structured finding, reasoning, and confidence.`;
}
