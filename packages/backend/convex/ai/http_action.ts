import { streamText, stepCountIs, tool } from "ai";
import { z } from "zod";
import { openai } from "@ai-sdk/openai";
import { Seshat } from "@nativesquare/seshat";
import { httpAction } from "../_generated/server";
import { api, components, internal } from "../_generated/api";
import { ConvexError } from "convex/values";
import { uiTools, actionTools } from "./tools";
import { readAthleteProfile, readUpcomingWorkouts, readActivePlan } from "./tools/reads";
import { buildSystemPrompt } from "./prompts/onboarding_coach";
import { buildCoachOSPrompt } from "./prompts/coach_os";
import { computeAthleteState } from "../plan/state";

const seshat = new Seshat({ component: components.seshat });

// =============================================================================
// LLM Error Types (Story 8.3 - AC#1)
// =============================================================================

/**
 * Granular LLM error codes for better error handling.
 * Source: Story 8.3 Task 1.1
 */
export type LLMErrorCode =
  | "LLM_TIMEOUT"
  | "LLM_RATE_LIMITED"
  | "LLM_MODEL_ERROR"
  | "LLM_NETWORK_ERROR"
  | "LLM_ERROR";

/**
 * Structured error response with user-friendly messaging and debug info.
 * Source: Story 8.3 Task 1.2
 */
export interface LLMErrorResponse {
  code: LLMErrorCode;
  message: string;
  debugInfo: {
    requestId: string;
    timestamp: number;
    details?: string;
  };
  isRetryable: boolean;
}

/**
 * User-friendly error messages per error type.
 * Source: Story 8.3 Dev Notes - User-Friendly Messages
 * @internal Exported for testing
 */
export const ERROR_MESSAGES: Record<LLMErrorCode, string> = {
  LLM_TIMEOUT: "I'm thinking hard but taking too long. Let's try again?",
  LLM_RATE_LIMITED: "I need a moment to catch my breath. Try again in a few seconds.",
  LLM_MODEL_ERROR: "Something went wrong on my end. Let's try that again.",
  LLM_NETWORK_ERROR: "I can't reach my brain right now. Check your connection and retry.",
  LLM_ERROR: "Something unexpected happened. Let's try again.",
};

/**
 * HTTP status codes per error type.
 * @internal Exported for testing
 */
export const ERROR_STATUS_CODES: Record<LLMErrorCode, number> = {
  LLM_TIMEOUT: 504,
  LLM_RATE_LIMITED: 429,
  LLM_MODEL_ERROR: 502,
  LLM_NETWORK_ERROR: 503,
  LLM_ERROR: 500,
};

/**
 * Generate a unique request ID for debugging and support.
 * Source: Story 8.3 Task 1.3
 * @internal Exported for testing
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${random}`;
}

/**
 * Classify error into specific LLM error code.
 * Source: Story 8.3 Task 1.1
 * @internal Exported for testing
 */
export function classifyError(error: unknown): { code: LLMErrorCode; details: string } {
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  const errorName = error instanceof Error ? error.name : "";

  // Timeout detection
  if (
    errorMessage.includes("timeout") ||
    errorMessage.includes("timed out") ||
    errorMessage.includes("deadline") ||
    errorName === "AbortError"
  ) {
    return { code: "LLM_TIMEOUT", details: "Request exceeded timeout limit" };
  }

  // Rate limit detection
  if (
    errorMessage.includes("rate") ||
    errorMessage.includes("rate_limit") ||
    errorMessage.includes("too many requests") ||
    errorMessage.includes("429")
  ) {
    return { code: "LLM_RATE_LIMITED", details: "API rate limit exceeded" };
  }

  // Network error detection
  if (
    errorMessage.includes("network") ||
    errorMessage.includes("fetch") ||
    errorMessage.includes("connection") ||
    errorMessage.includes("econnrefused") ||
    errorMessage.includes("enotfound") ||
    errorMessage.includes("offline") ||
    errorName === "TypeError"
  ) {
    return { code: "LLM_NETWORK_ERROR", details: "Network connection failed" };
  }

  // Model-specific errors (OpenAI)
  if (
    errorMessage.includes("model") ||
    errorMessage.includes("invalid_api_key") ||
    errorMessage.includes("insufficient_quota") ||
    errorMessage.includes("context_length") ||
    errorMessage.includes("content_policy") ||
    errorMessage.includes("server_error") ||
    errorMessage.includes("500") ||
    errorMessage.includes("502") ||
    errorMessage.includes("503")
  ) {
    return { code: "LLM_MODEL_ERROR", details: "AI model returned an error" };
  }

  // Generic fallback
  return { code: "LLM_ERROR", details: error instanceof Error ? error.message : "Unknown error" };
}

/**
 * Build structured LLM error response.
 * Source: Story 8.3 Task 1.2
 */
function buildErrorResponse(requestId: string, error: unknown): LLMErrorResponse {
  const { code, details } = classifyError(error);

  return {
    code,
    message: ERROR_MESSAGES[code],
    debugInfo: {
      requestId,
      timestamp: Date.now(),
      details,
    },
    isRetryable: code !== "LLM_MODEL_ERROR" || !details.includes("content_policy"),
  };
}

/**
 * Create HTTP Response from LLM error.
 */
function createErrorResponse(requestId: string, error: unknown): Response {
  const errorResponse = buildErrorResponse(requestId, error);
  const statusCode = ERROR_STATUS_CODES[errorResponse.code];

  // Server-side logging with request ID (Story 8.3 Task 1.3)
  console.error(`[AI] Stream error [${requestId}]:`, {
    code: errorResponse.code,
    details: errorResponse.debugInfo.details,
    timestamp: new Date(errorResponse.debugInfo.timestamp).toISOString(),
  });

  return new Response(JSON.stringify(errorResponse), {
    status: statusCode,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * AI Streaming HTTP Action Endpoint
 *
 * Handles streaming LLM responses with tool-calling capabilities.
 * Uses Vercel AI SDK v6.x with OpenAI provider.
 *
 * Source: Story 2.1 - AC#1, AC#2
 */
export const streamChat = httpAction(async (ctx, request) => {
  const requestId = generateRequestId();

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ code: "UNAUTHORIZED", message: "Missing or invalid authorization header" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return new Response(
      JSON.stringify({ code: "UNAUTHORIZED", message: "Invalid authentication token" }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  /** User/assistant message content: plain text or multimodal parts (text + image) */
  type MessageContent =
    | string
    | Array<
      | { type: "text"; text: string }
      | { type: "file"; url: string; mediaType?: string }
    >;

  let body: {
    messages: Array<{ role: "user" | "assistant" | "system"; content: MessageContent }>;
    conversationId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ code: "INVALID_REQUEST", message: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  if (!body.messages || !Array.isArray(body.messages)) {
    return new Response(
      JSON.stringify({ code: "INVALID_REQUEST", message: "Messages array is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  console.log(`[AI] Stream request started [${requestId}]`);

  try {
    const [user, athlete, connections, upcomingWorkouts] = await Promise.all([
      ctx.runQuery(api.table.users.currentUser, {}),
      ctx.runQuery(api.plan.reads.getAthlete, {}),
      ctx.runQuery(api.soma.index.listConnections, {}),
      (async () => {
        const today = new Date();
        const fourteenOut = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
        return await ctx.runQuery(api.plan.reads.listWorkoutsInRange, {
          startDate: today.toISOString().slice(0, 10),
          endDate: fourteenOut.toISOString().slice(0, 10),
        });
      })(),
    ]);

    const isActive = (provider: string) =>
      connections.some((c: { provider: string; active?: boolean }) =>
        c.provider === provider && (c.active ?? false),
      );
    const providers = {
      strava: { connected: isActive("STRAVA") },
      garmin: { connected: isActive("GARMIN") },
      healthkit: { connected: isActive("HEALTHKIT") },
    };

    if (!user) {
      return new Response(
        JSON.stringify({ code: "UNAUTHORIZED", message: "User not found" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const userId = user._id as string;
    const isOnboarding = !user.hasCompletedOnboarding;

    /** Normalize content to string for memory/compaction (multimodal → text summary) */
    const contentToString = (c: MessageContent): string =>
      typeof c === "string"
        ? c
        : c
          .map((p) =>
            p.type === "text" ? p.text : "[Image attached]"
          )
          .join(" ");

    const currentMessage = body.messages
      .filter((m) => m.role === "user")
      .at(-1)?.content;
    const currentMessageStr =
      currentMessage !== undefined ? contentToString(currentMessage) : undefined;

    const [memoryContext, memoryTools] = await Promise.all([
      seshat.assembleMemoryContext(ctx, { userId, currentMessage: currentMessageStr }),
      seshat.getMemoryTools(ctx, { userId }),
    ]);

    type AgogeWorkout = {
      _id: string;
      scheduledDate: string;
      name: string;
      description?: string;
      status: "planned" | "completed" | "missed" | "skipped";
      planned?: { durationSeconds?: number; distanceMeters?: number };
    };
    const upcomingForPrompt = (upcomingWorkouts as AgogeWorkout[]).map((w) => ({
      _id: w._id,
      scheduledDate: w.scheduledDate,
      name: w.name,
      description: w.description,
      status: w.status,
      plannedDurationSeconds: w.planned?.durationSeconds,
      plannedDistanceMeters: w.planned?.distanceMeters,
    }));

    const systemPrompt = isOnboarding
      ? buildSystemPrompt(athlete, providers)
      : buildCoachOSPrompt(athlete, providers, memoryContext, upcomingForPrompt);

    // Server-executed read tool: closes over ctx to fetch athlete profile + derived state on demand
    const readAthleteProfileWithCtx = tool({
      description:
        readAthleteProfile.description ??
        "Fetch the athlete's agoge profile and derived state.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          if (!user) {
            throw new ConvexError({
              code: "UNAUTHORIZED",
              message: "Must be authenticated",
            });
          }
          const freshAthlete = await ctx.runQuery(api.plan.reads.getAthlete, {});
          if (!freshAthlete) {
            throw new ConvexError({
              code: "NOT_FOUND",
              message: "Athlete profile not found",
            });
          }
          const ninetyDaysAgoMs = Date.now() - 90 * 24 * 60 * 60 * 1000;
          const activities = await ctx.runQuery(
            components.soma.public.listActivities,
            {
              userId,
              startTime: new Date(ninetyDaysAgoMs).toISOString(),
              order: "desc",
            },
          );
          const state = computeAthleteState(
            (activities as Array<{
              startTime: string | number;
              durationSec?: number;
              distance?: number;
              trainingLoad?: number;
            }>).map((a) => ({
              startTime:
                typeof a.startTime === "string"
                  ? Date.parse(a.startTime)
                  : a.startTime,
              durationSec: a.durationSec,
              distance: a.distance,
              trainingLoad: a.trainingLoad,
            })),
          );
          return { athlete: freshAthlete, state };
        } catch (error) {
          if (error instanceof ConvexError) throw error;
          console.error(`[AI] [${requestId}] readAthleteProfile execute error:`, error);
          return { error: "Failed to fetch athlete profile", code: "INTERNAL_ERROR" };
        }
      },
    });

    const readUpcomingWorkoutsWithCtx = tool({
      description: readUpcomingWorkouts.description ?? "Look up upcoming workouts.",
      inputSchema: readUpcomingWorkouts.inputSchema,
      execute: async (args) => {
        const today = new Date();
        const fourteenOut = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
        const workouts = (await ctx.runQuery(
          api.plan.reads.listWorkoutsInRange,
          {
            startDate: args.startDate ?? today.toISOString().slice(0, 10),
            endDate: args.endDate ?? fourteenOut.toISOString().slice(0, 10),
          },
        )) as Array<{
          status: "planned" | "completed" | "missed" | "skipped";
          [k: string]: unknown;
        }>;
        return args.status
          ? workouts.filter((w) => w.status === args.status)
          : workouts;
      },
    });

    const readActivePlanWithCtx = tool({
      description: readActivePlan.description ?? "Read the athlete's active plan.",
      inputSchema: z.object({}),
      execute: async () => {
        const plan = await ctx.runQuery(api.plan.reads.getActivePlan, {});
        return plan ? { plan } : { plan: null };
      },
    });

    const allTools = isOnboarding
      ? { ...uiTools, ...memoryTools }
      : {
          ...uiTools,
          ...actionTools,
          ...memoryTools,
          readAthleteProfile: readAthleteProfileWithCtx,
          readUpcomingWorkouts: readUpcomingWorkoutsWithCtx,
          readActivePlan: readActivePlanWithCtx,
        };

    const result = streamText({
      model: openai("gpt-4o"),
      messages: body.messages as Parameters<typeof streamText>[0]["messages"] & {},
      tools: allTools,
      system: systemPrompt,
      stopWhen: stepCountIs(5),
      onStepFinish: async ({ toolCalls }) => {
        if (toolCalls && toolCalls.length > 0) {
          console.log(
            `[AI] [${requestId}] Tool calls: ${toolCalls.map((t) => t.toolName).join(", ")}`,
          );
        }
      },
      onFinish: async ({ usage }) => {
        try {
          const compactionResult = await seshat.afterResponse(ctx, {
            userId,
            tokensUsed: usage.totalTokens ?? 0,
            messages: body.messages.map((m) => ({
              role: m.role,
              content: contentToString(m.content),
            })),
          });

          if (compactionResult.compacted) {
            console.log(
              `[AI] [${requestId}] Compaction triggered, summary length: ${compactionResult.summary.length}, ` +
              `archived before index ${compactionResult.archivedBeforeIndex}`,
            );

            if (body.conversationId) {
              const keepCount =
                body.messages.length - compactionResult.archivedBeforeIndex;
              await ctx.runMutation(internal.ai.messages.archiveMessages, {
                conversationId: body.conversationId as any,
                keepCount,
              });
            }
          }
        } catch (error) {
          console.error(`[AI] [${requestId}] afterResponse error:`, error);
        }
      },
    });

    return result.toUIMessageStreamResponse({
      headers: {
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Request-Id": requestId,
      },
    });
  } catch (error) {
    if (error instanceof ConvexError) {
      console.error(`[AI] ConvexError [${requestId}]:`, error.data);
      return new Response(
        JSON.stringify({
          code: error.data.code || "VALIDATION_ERROR",
          message: error.data.message || "Request validation failed",
          debugInfo: { requestId, timestamp: Date.now() },
          isRetryable: false,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    return createErrorResponse(requestId, error);
  }
});

