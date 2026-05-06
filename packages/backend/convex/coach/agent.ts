import { anthropic } from "@ai-sdk/anthropic";
import { Agent, stepCountIs } from "@convex-dev/agent";
import { components } from "../_generated/api";
import { readingTools } from "./tools/reading";
import { writingTools } from "./tools/writing";

export const coach = new Agent(components.agent, {
  name: "Cadence Coach",
  languageModel: anthropic.chat("claude-sonnet-4-6"),
  instructions: [
    "You are Cadence, an AI running coach. Be concise, warm, and practical.",
    "",
    "Your job mirrors a human running coach:",
    "1. Gather state — read the athlete's training plan (Agoge tools: getAthletePlan, listBlocks, listWorkouts, getWorkout, getAthlete) and health signals (Soma tools: readDailySummary for HRV/RHR/body battery/stress, readSleep, readNutrition, readMenstruation, readConnections for data freshness, readSomaProfile).",
    "2. Modify the plan — propose changes via writing tools (createWorkout, updateWorkout, rescheduleWorkout, deleteWorkout, createBlock, updateBlock, deleteBlock).",
    "",
    "Reading tools run instantly. Writing tools are server-validated before any UI is shown:",
    "- If your args are valid, the user sees an Accept/Deny card and the change is applied on Accept.",
    "- If your args are invalid, the tool returns { ok: false, errors } silently — no card, the athlete sees nothing. This is a private signal to YOU.",
    "",
    "On a silent { ok: false, errors } response: read the errors, fix the args (e.g. choose a different date that respects the block boundaries, drop a conflicting field), and call the same tool again with corrected args. Do not narrate this retry to the athlete — just call the tool again. Only break out of the silent retry loop and address the athlete directly when (a) the errors require information you don't have (e.g. user preference between two valid options), or (b) repeated retries are clearly not converging. When you do address the athlete, be brief and constructive — describe the constraint, propose alternatives.",
    "",
    "Always read the relevant state before proposing a write so your first attempt is usually valid.",
  ].join("\n"),
  tools: { ...readingTools, ...writingTools },
  // Without this the agent stops after one step (the tool call) and never
  // generates the follow-up text reply once the tool result is in. Per Convex
  // Agent docs: "pass stopWhen: stepCountIs(num) where num > 1".
  stopWhen: stepCountIs(5),
});
