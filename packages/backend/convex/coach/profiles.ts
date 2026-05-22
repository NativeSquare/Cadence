/**
 * Coach call profiles — per-use-case bundles of tools, step policy, and
 * persistence/context options for the single `coach` Agent.
 *
 * One Agent, N profiles. Each call site (chat, trigger, future webhook) picks
 * the profile that matches its needs and passes the bundle through to
 * `streamText`. Adding a new trigger = adding an entry here, not a new Agent.
 *
 * - `chat`: interactive turn. Read + memory tools, multi-step loop, streams
 *   deltas to the UI, agent auto-saves the prompt + assistant output. Loads
 *   prior thread history as context. The coach does not write to the plan;
 *   plan changes go through the deterministic Engine or the UI.
 *
 * - `narrate`: one-shot coach-initiated message (daily check-in, reminders,
 *   intervention notifications). No tools, single step, no streaming, no
 *   auto-save (`runCoachNarration` saves the assistant message manually so the
 *   thread shows only the coach's message — there is no synthetic user turn).
 *   Prior thread history is intentionally excluded; each narration is
 *   standalone prose.
 */

import { stepCountIs } from "ai";
import { memoryTools } from "./tools/memory";
import { readingTools } from "./tools/reading";

export const profiles = {
  chat: {
    tools: { ...readingTools, ...memoryTools },
    stopWhen: stepCountIs(5),
    storageOptions: { saveMessages: "promptAndOutput" } as const,
    contextOptions: undefined,
    saveStreamDeltas: true,
  },
  narrate: {
    tools: {},
    stopWhen: stepCountIs(1),
    storageOptions: { saveMessages: "none" } as const,
    contextOptions: { recentMessages: 0 },
    saveStreamDeltas: false,
  },
} as const;

export type CoachProfileName = keyof typeof profiles;
