/**
 * Coach call profiles — per-use-case bundles of tools, step policy, and
 * persistence/context options for the single `coach` Agent.
 *
 * One Agent, N profiles. Each call site (chat, trigger, future webhook) picks
 * the profile that matches its needs and passes the bundle through to
 * `streamText`. Adding a new trigger = adding an entry here, not a new Agent.
 *
 * - `chat`: interactive turn. Full tool surface, multi-step loop, streams
 *   deltas to the UI, agent auto-saves the prompt + assistant output. Loads
 *   prior thread history as context.
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
import { writingTools } from "./tools/writing";

export const profiles = {
  chat: {
    tools: { ...readingTools, ...writingTools, ...memoryTools },
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
