import { streamText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { Seshat } from "@nativesquare/seshat";
import { httpAction } from "../_generated/server";
import { api, components, internal } from "../_generated/api";
import { ConvexError } from "convex/values";
import { tools as uiTools } from "./tools";
import { buildSystemPrompt } from "./prompts/onboarding_coach";
import { buildCoachOSPrompt } from "./prompts/coach_os";

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

  let body: {
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
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
    const [user, runner, providers] = await Promise.all([
      ctx.runQuery(api.table.users.currentUser, {}),
      ctx.runQuery(api.table.runners.getCurrentRunner, {}),
      ctx.runQuery(api.integrations.connections.getConnectedProviders, {}),
    ]);

    if (!user) {
      return new Response(
        JSON.stringify({ code: "UNAUTHORIZED", message: "User not found" }),
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const userId = user._id as string;
    const isOnboarding = !user.hasCompletedOnboarding;

    const currentMessage = body.messages
      .filter((m) => m.role === "user")
      .at(-1)?.content;

    const [memoryContext, memoryTools] = await Promise.all([
      seshat.assembleMemoryContext(ctx, { userId, currentMessage }),
      seshat.getMemoryTools(ctx, { userId }),
    ]);

    const systemPrompt = isOnboarding
      ? buildSystemPrompt(runner, providers)
      : buildCoachOSPrompt(runner, providers, memoryContext);

    const allTools = { ...uiTools, ...memoryTools };

    const result = streamText({
      model: openai("gpt-4o"),
      messages: body.messages,
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
              content: m.content,
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

