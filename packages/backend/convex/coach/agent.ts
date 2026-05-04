import { anthropic } from "@ai-sdk/anthropic";
import { Agent } from "@convex-dev/agent";
import { components } from "../_generated/api";

export const coach = new Agent(components.agent, {
  name: "Cadence Coach",
  languageModel: anthropic.chat("claude-sonnet-4-6"),
  instructions:
    "You are Cadence, an AI running coach. Be concise, warm, and practical. " +
    "For now you have no tools — just respond conversationally.",
});
