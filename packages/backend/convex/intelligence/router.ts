import { anthropic } from "@ai-sdk/anthropic";
import { generateText, stepCountIs, tool } from "ai";
import { v } from "convex/values";
import { z } from "zod";
import { internal } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";
import { ActionCtx, internalAction } from "../_generated/server";
import {
  proposeModifySession,
  proposeRescheduleSession,
  proposeSkipSession,
  proposeSwapSessions,
} from "../ai/tools/actions";
import type { RouterContext } from "./context";
import { CRAFTSPERSON_SYSTEM_PROMPT } from "./prompts";
import { consultBody } from "./specialists/body";
import { consultMind } from "./specialists/mind";
import type { SpecialistPerspective } from "./specialists/types";

export type RouterToolCall = {
  toolCallId: string;
  toolName: string;
  args: unknown;
};

const PROPOSAL_TOOL_NAMES = new Set([
  "proposeModifySession",
  "proposeRescheduleSession",
  "proposeSwapSessions",
  "proposeSkipSession",
]);

function buildRouterPrompt(
  event: Doc<"events">,
  context: RouterContext,
): string {
  return `EVENT
  source: ${event.source}
  type: ${event.type}
  occurredAt: ${new Date(event.occurredAt).toISOString()}
  payload: ${JSON.stringify(event.payload)}

CONTEXT
  profile: ${context.profile === null ? "(no runner profile)" : JSON.stringify(context.profile)}
  plan: ${context.plan === null ? "(no active plan)" : JSON.stringify(context.plan)}

Decide whether to consult Body, Mind, both, or neither with focused sub-queries. Then call your emission tool (emit_reply for reactive chat, emit_decision for proactive) to finalize.`;
}

type RouterDecision = {
  text: string;
  shouldPush: boolean;
  reason: string;
  perspectives: SpecialistPerspective[];
  toolCalls: RouterToolCall[];
};

async function runRouter(
  ctx: ActionCtx,
  event: Doc<"events">,
  context: RouterContext,
): Promise<RouterDecision> {
  const isReactive = event.source === "chat";

  const consultationTools = {
    consult_body: tool({
      description:
        "Consult Body specialist — Soma signals, physiology, training science.",
      inputSchema: z.object({
        subQuery: z
          .string()
          .describe("Focused question for the Body specialist."),
      }),
      execute: ({ subQuery }) =>
        consultBody(ctx, { subQuery, userId: event.userId }),
    }),
    consult_mind: tool({
      description: "Consult Mind specialist — user utterances, memory, feel.",
      inputSchema: z.object({
        subQuery: z
          .string()
          .describe("Focused question for the Mind specialist."),
      }),
      execute: ({ subQuery }) =>
        consultMind(ctx, { subQuery, userId: event.userId }),
    }),
  };

  const emitReply = tool({
    description:
      "Emit your reply to the athlete. Call this exactly once after consulting specialists. The athlete is talking to you — a reply is always delivered.",
    inputSchema: z.object({
      text: z
        .string()
        .describe("Your reply to the athlete, in Craftsperson voice."),
    }),
    execute: async (input) => input,
  });

  const emitDecision = tool({
    description:
      "Emit your final decision. Call this exactly once, after consulting specialists.",
    inputSchema: z.object({
      text: z
        .string()
        .describe(
          "Your candidate message in Craftsperson voice. Always write what you WOULD say, even if you decide not to push — this is the audit trail.",
        ),
      shouldPush: z
        .boolean()
        .describe(
          "True to deliver the message to the athlete now. False to stay silent.",
        ),
      reason: z
        .string()
        .describe(
          "One sentence explaining the push/silence decision. Required in both cases.",
        ),
    }),
    execute: async (input) => input,
  });

  const result = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    system: CRAFTSPERSON_SYSTEM_PROMPT,
    prompt: buildRouterPrompt(event, context),
    tools: {
      ...consultationTools,
      proposeModifySession,
      proposeRescheduleSession,
      proposeSwapSessions,
      proposeSkipSession,
      ...(isReactive
        ? { emit_reply: emitReply }
        : { emit_decision: emitDecision }),
    },
    stopWhen: stepCountIs(8),
  });

  const perspectives: SpecialistPerspective[] = [];
  const toolCalls: RouterToolCall[] = [];
  let replyText: string | null = null;
  let decision: { text: string; shouldPush: boolean; reason: string } | null =
    null;

  for (const step of result.steps) {
    for (const call of step.toolCalls ?? []) {
      if (PROPOSAL_TOOL_NAMES.has(call.toolName)) {
        toolCalls.push({
          toolCallId: call.toolCallId,
          toolName: call.toolName,
          args: (call as { input: unknown }).input,
        });
      }
    }
    for (const tr of step.toolResults ?? []) {
      if (tr.toolName === "consult_body" || tr.toolName === "consult_mind") {
        perspectives.push(tr.output as SpecialistPerspective);
      } else if (tr.toolName === "emit_reply") {
        replyText = (tr.output as { text: string }).text;
      } else if (tr.toolName === "emit_decision") {
        decision = tr.output as {
          text: string;
          shouldPush: boolean;
          reason: string;
        };
      }
    }
  }

  if (isReactive) {
    return {
      text: replyText ?? "",
      shouldPush: true,
      reason: replyText === null ? "router_did_not_emit_reply" : "reactive_reply",
      perspectives,
      toolCalls,
    };
  }

  return decision
    ? { ...decision, perspectives, toolCalls }
    : {
        text: "",
        shouldPush: false,
        reason: "router_did_not_emit_decision",
        perspectives,
        toolCalls,
      };
}

export const route = internalAction({
  args: { eventId: v.id("events") },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.runQuery(internal.intelligence.events.getById, {
      eventId,
    });
    if (!event) return;

    const context = await ctx.runQuery(
      internal.intelligence.context.loadRouterContext,
      { userId: event.userId, occurredAt: event.occurredAt },
    );
    const { text, shouldPush, reason, perspectives, toolCalls } =
      await runRouter(ctx, event, context);

    console.log(
      `[router] ${event.type} → push=${shouldPush}, reason="${reason}", tools=${toolCalls.length}`,
    );

    await ctx.runMutation(internal.intelligence.candidates.push, {
      userId: event.userId,
      eventId,
      text,
      shouldPush,
      reason,
      perspectives,
      toolCalls,
    });

    if (shouldPush) {
      await ctx.runMutation(internal.intelligence.delivery.deliverCandidate, {
        userId: event.userId,
        text,
        toolCalls,
      });
    }
  },
});
