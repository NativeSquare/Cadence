import { streamText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { httpAction } from "../_generated/server";
import { api } from "../_generated/api";
import { ConvexError } from "convex/values";
import { tools } from "./tools";
import { buildSystemPrompt } from "./prompts/onboarding_coach";

/**
 * AI Streaming HTTP Action Endpoint
 *
 * Handles streaming LLM responses with tool-calling capabilities.
 * Uses Vercel AI SDK v6.x with OpenAI provider.
 *
 * Source: Story 2.1 - AC#1, AC#2
 */
export const streamChat = httpAction(async (ctx, request) => {
  // Validate request method
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Validate auth token is present (Convex auth reads it from headers)
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ code: "UNAUTHORIZED", message: "Missing or invalid authorization header" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Validate the token and get user identity
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return new Response(
      JSON.stringify({ code: "UNAUTHORIZED", message: "Invalid authentication token" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Parse request body
  let body: {
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
    conversationId?: string;
  };

  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ code: "INVALID_REQUEST", message: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!body.messages || !Array.isArray(body.messages)) {
    return new Response(
      JSON.stringify({ code: "INVALID_REQUEST", message: "Messages array is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Get runner context for system prompt
    const runner = await ctx.runQuery(api.table.runners.getCurrentRunner, {});

    // Build system prompt with runner context
    const systemPrompt = buildSystemPrompt(runner);

    // Stream response using Vercel AI SDK
    const result = streamText({
      model: openai("gpt-4o"),
      messages: body.messages,
      tools,
      system: systemPrompt,
      stopWhen: stepCountIs(5), // Allow up to 5 tool call rounds
      onStepFinish: async ({ toolCalls }) => {
        // Tool results are handled by the client via stream
        // Persistence happens through tool execution
        if (toolCalls && toolCalls.length > 0) {
          console.log(`[AI] Tool calls executed: ${toolCalls.map((t) => t.toolName).join(", ")}`);
        }
      },
    });

    // Return SSE stream response
    return result.toTextStreamResponse({
      headers: {
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("[AI] Stream error:", error);

    // Handle specific error types
    if (error instanceof ConvexError) {
      return new Response(
        JSON.stringify({ code: error.data.code, message: error.data.message }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check for timeout/rate limit errors
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    if (errorMessage.includes("timeout")) {
      return new Response(
        JSON.stringify({ code: "LLM_TIMEOUT", message: "AI response timed out" }),
        { status: 504, headers: { "Content-Type": "application/json" } }
      );
    }
    if (errorMessage.includes("rate")) {
      return new Response(
        JSON.stringify({ code: "RATE_LIMITED", message: "Too many requests" }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ code: "LLM_ERROR", message: "AI service error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

