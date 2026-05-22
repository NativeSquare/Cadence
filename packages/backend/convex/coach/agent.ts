import { anthropic } from "@ai-sdk/anthropic";
import { Agent } from "@convex-dev/agent";
import { components } from "../_generated/api";

/**
 * The single Coach agent — identity only (model + name).
 *
 * Per-use-case policy (tools, step budget, persistence, history loading,
 * streaming) lives in `./profiles.ts`. The per-user system prompt is composed
 * in `./instructions.ts` and applied at call time by `./turns.ts`.
 *
 * Every call site must pick a profile and pass `system`. A naked
 * `coach.streamText` would run with no tools, no system prompt, and the AI
 * SDK's default `stepCountIs(1)` — that's intentional, so new callers route
 * through `runCoachTurn` or `deliverCoachNarration` instead of bypassing them.
 */
export const coach = new Agent(components.agent, {
  name: "Cadence Coach",
  languageModel: anthropic.chat("claude-haiku-4-5-20251001"),
});
