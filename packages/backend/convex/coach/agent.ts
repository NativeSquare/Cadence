import { anthropic } from "@ai-sdk/anthropic";
import { Agent, stepCountIs } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { readingTools } from "./tools/reading";
import { writingTools } from "./tools/writing";

export const coach = new Agent(components.agent, {
  name: "Cadence Coach",
  languageModel: anthropic.chat("claude-sonnet-4-6"),
  instructions:
    "You are Cadence, an AI running coach. Be concise, warm, and practical. " +
    "Use reading tools freely to gather context. " +
    "Use writing tools to propose changes — the user will see a card to Accept or Deny.",
  tools: { ...readingTools, ...writingTools },
  // Without this the agent stops after one step (the tool call) and never
  // generates the follow-up text reply once the tool result is in. Per Convex
  // Agent docs: "pass stopWhen: stepCountIs(num) where num > 1".
  stopWhen: stepCountIs(5),
});
