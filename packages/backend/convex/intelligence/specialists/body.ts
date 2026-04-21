import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { Id } from "../../_generated/dataModel";
import type { ActionCtx } from "../../_generated/server";
import { BODY_SPECIALIST_PROMPT } from "../prompts";
import type { SpecialistPerspective } from "./types";

export async function consultBody(
  _ctx: ActionCtx,
  args: { subQuery: string; userId: Id<"users"> },
): Promise<SpecialistPerspective> {
  // TODO: read Signal Store (Soma) + archetype priors when those stores exist.
  const signals = null;

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: z.object({
      finding: z.string(),
      reasoning: z.string(),
      confidence: z.enum(["low", "medium", "high"]),
    }),
    system: BODY_SPECIALIST_PROMPT,
    prompt: buildBodyPrompt(args.subQuery, signals),
  });

  return { specialist: "body", ...object };
}

function buildBodyPrompt(subQuery: string, signals: unknown): string {
  const signalsBlock =
    signals === null
      ? "(none — Signal Store not yet wired)"
      : JSON.stringify(signals);
  return `Router sub-query: ${subQuery}

Available Soma signals: ${signalsBlock}

Respond with a structured finding, reasoning, and confidence.`;
}
