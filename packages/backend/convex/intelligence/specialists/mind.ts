import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { Id } from "../../_generated/dataModel";
import type { ActionCtx } from "../../_generated/server";
import { MIND_SPECIALIST_PROMPT } from "../prompts";
import type { SpecialistPerspective } from "./types";

export async function consultMind(
  _ctx: ActionCtx,
  args: { subQuery: string; userId: Id<"users"> },
): Promise<SpecialistPerspective> {
  // TODO: read Memory Store + Narrative Store when those stores exist.
  const memory = null;

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      finding: z.string(),
      reasoning: z.string(),
      confidence: z.enum(["low", "medium", "high"]),
    }),
    system: MIND_SPECIALIST_PROMPT,
    prompt: buildMindPrompt(args.subQuery, memory),
  });

  return { specialist: "mind", ...object };
}

function buildMindPrompt(subQuery: string, memory: unknown): string {
  const memoryBlock =
    memory === null
      ? "(none — Memory Store not yet wired)"
      : JSON.stringify(memory);
  return `Router sub-query: ${subQuery}

Available user memory / utterances: ${memoryBlock}

Respond with a structured finding, reasoning, and confidence.`;
}
