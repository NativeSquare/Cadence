import { anthropic } from "@ai-sdk/anthropic";
import { Agent, stepCountIs } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { FALLBACK_INSTRUCTIONS } from "./instructions";
import { readingTools } from "./tools/reading";
import { writingTools } from "./tools/writing";

export const coach = new Agent(components.agent, {
  name: "Cadence Coach",
  languageModel: anthropic.chat("claude-sonnet-4-6"),
  // The default `instructions` is a fallback used only when a call site forgets
  // to pass a `system` override. The real per-user prompt is composed in
  // `messages.ts` via `composeCoachSystem({ locale, prefs })`.
  instructions: FALLBACK_INSTRUCTIONS,
  tools: { ...readingTools, ...writingTools },
  // Without this the agent stops after one step (the tool call) and never
  // generates the follow-up text reply once the tool result is in. Per Convex
  // Agent docs: "pass stopWhen: stepCountIs(num) where num > 1".
  stopWhen: stepCountIs(5),
});
