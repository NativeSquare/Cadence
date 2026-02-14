/**
 * AI Stream Library
 *
 * SSE parser utilities for Vercel AI SDK streaming format.
 * Handles text chunks, tool calls, and reconnection.
 *
 * Source: Story 2.1 - AC#2, AC#4
 */

// =============================================================================
// Types
// =============================================================================

export type TextDelta = {
  type: "text-delta";
  textDelta: string;
};

export type ToolCall = {
  type: "tool-call";
  toolCallId: string;
  toolName: string;
  args: unknown;
};

export type ToolResult = {
  type: "tool-result";
  toolCallId: string;
  toolName: string;
  result: unknown;
};

export type FinishMessage = {
  type: "finish";
  finishReason: "stop" | "tool-calls" | "length" | "content-filter" | "error";
};

export type ErrorMessage = {
  type: "error";
  error: string;
};

export type StreamEvent = TextDelta | ToolCall | ToolResult | FinishMessage | ErrorMessage;

export type MessagePart =
  | { type: "text"; text: string }
  | { type: "tool-call"; toolCallId: string; toolName: string; args: unknown }
  | { type: "tool-result"; toolCallId: string; toolName: string; result: unknown };

export interface StreamMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts: MessagePart[];
  isComplete: boolean;
}

export interface StreamOptions {
  /** Convex HTTP site URL */
  convexSiteUrl: string;
  /** Auth token for authenticated requests */
  authToken: string;
  /** Messages to send to the AI */
  messages: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  /** Conversation ID for persistence */
  conversationId?: string;
  /** Called for each text chunk */
  onTextDelta?: (text: string) => void;
  /** Called when a tool is invoked */
  onToolCall?: (toolCall: ToolCall) => void;
  /** Called when a tool returns a result */
  onToolResult?: (toolResult: ToolResult) => void;
  /** Called when stream finishes */
  onFinish?: (finishReason: string) => void;
  /** Called on error */
  onError?: (error: Error) => void;
  /** Abort signal for cancellation */
  signal?: AbortSignal;
}

// =============================================================================
// SSE Parser
// =============================================================================

/**
 * Parse SSE event data from Vercel AI SDK format
 */
export function parseSSEEvent(data: string): StreamEvent | null {
  if (!data || data === "[DONE]") {
    return null;
  }

  try {
    // Vercel AI SDK uses a specific format: type:data
    // Example: 0:"Hello" (text delta)
    // Example: 9:{"toolCallId":"...","toolName":"...","args":{...}}

    // Check for simple text delta format (0:"text")
    if (data.startsWith('0:"')) {
      const text = data.slice(3, -1); // Remove 0:" and trailing "
      return {
        type: "text-delta",
        textDelta: parseEscapedString(text),
      };
    }

    // Check for tool call (9:{...})
    if (data.startsWith("9:")) {
      const json = JSON.parse(data.slice(2));
      return {
        type: "tool-call",
        toolCallId: json.toolCallId,
        toolName: json.toolName,
        args: json.args,
      };
    }

    // Check for tool result (a:{...})
    if (data.startsWith("a:")) {
      const json = JSON.parse(data.slice(2));
      return {
        type: "tool-result",
        toolCallId: json.toolCallId,
        toolName: json.toolName,
        result: json.result,
      };
    }

    // Check for finish message (d:{...} or e:{...})
    if (data.startsWith("d:") || data.startsWith("e:")) {
      const json = JSON.parse(data.slice(2));
      return {
        type: "finish",
        finishReason: json.finishReason || "stop",
      };
    }

    // Try to parse as JSON for other formats
    const json = JSON.parse(data);
    if (json.type) {
      return json as StreamEvent;
    }

    return null;
  } catch {
    // Non-JSON data, might be raw text
    return null;
  }
}

/**
 * Parse escaped string from AI SDK format
 */
function parseEscapedString(str: string): string {
  return str
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

// =============================================================================
// Stream Reader
// =============================================================================

/**
 * Read SSE stream from Vercel AI SDK endpoint
 */
export async function streamAIResponse(options: StreamOptions): Promise<StreamMessage> {
  const {
    convexSiteUrl,
    authToken,
    messages,
    conversationId,
    onTextDelta,
    onToolCall,
    onToolResult,
    onFinish,
    onError,
    signal,
  } = options;

  const url = `${convexSiteUrl}/api/ai/stream`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      messages,
      conversationId,
    }),
    signal,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: "Unknown error" }));
    const error = new Error(errorBody.message || `HTTP ${response.status}`);
    onError?.(error);
    throw error;
  }

  // Initialize message state
  const message: StreamMessage = {
    id: generateMessageId(),
    role: "assistant",
    content: "",
    parts: [],
    isComplete: false,
  };

  // Current text part being built
  let currentTextPart: { type: "text"; text: string } | null = null;

  // Read the stream
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Finalize any pending text part
        if (currentTextPart && currentTextPart.text) {
          message.parts.push(currentTextPart);
        }
        message.isComplete = true;
        onFinish?.("stop");
        break;
      }

      buffer += decoder.decode(value, { stream: true });

      // Process complete lines
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Handle SSE format (data: prefix)
        const dataMatch = trimmed.match(/^data:\s*(.*)$/);
        const data = dataMatch ? dataMatch[1] : trimmed;

        const event = parseSSEEvent(data);
        if (!event) continue;

        switch (event.type) {
          case "text-delta":
            message.content += event.textDelta;
            onTextDelta?.(event.textDelta);

            // Build text part
            if (!currentTextPart) {
              currentTextPart = { type: "text", text: "" };
            }
            currentTextPart.text += event.textDelta;
            break;

          case "tool-call":
            // Finalize any pending text part before tool call
            if (currentTextPart && currentTextPart.text) {
              message.parts.push(currentTextPart);
              currentTextPart = null;
            }

            const toolCallPart: MessagePart = {
              type: "tool-call",
              toolCallId: event.toolCallId,
              toolName: event.toolName,
              args: event.args,
            };
            message.parts.push(toolCallPart);
            onToolCall?.(event);
            break;

          case "tool-result":
            const toolResultPart: MessagePart = {
              type: "tool-result",
              toolCallId: event.toolCallId,
              toolName: event.toolName,
              result: event.result,
            };
            message.parts.push(toolResultPart);
            onToolResult?.(event);
            break;

          case "finish":
            // Finalize any pending text part
            if (currentTextPart && currentTextPart.text) {
              message.parts.push(currentTextPart);
              currentTextPart = null;
            }
            message.isComplete = true;
            onFinish?.(event.finishReason);
            break;

          case "error":
            const error = new Error(event.error);
            onError?.(error);
            throw error;
        }
      }
    }
  } catch (error) {
    if (signal?.aborted) {
      // Clean abort, not an error
      message.isComplete = true;
    } else {
      onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  } finally {
    reader.releaseLock();
  }

  return message;
}

// =============================================================================
// Utilities
// =============================================================================

/**
 * Generate a unique message ID
 */
function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Check if we should attempt reconnection
 */
export function shouldReconnect(error: Error): boolean {
  const message = error.message.toLowerCase();

  // Don't retry auth errors
  if (message.includes("unauthorized") || message.includes("401")) {
    return false;
  }

  // Don't retry rate limits immediately
  if (message.includes("rate") || message.includes("429")) {
    return false;
  }

  // Retry network errors
  if (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("timeout") ||
    message.includes("connection")
  ) {
    return true;
  }

  return false;
}

/**
 * Create a reconnecting stream with exponential backoff
 */
export async function streamWithReconnect(
  options: StreamOptions & { maxRetries?: number }
): Promise<StreamMessage> {
  const { maxRetries = 3, ...streamOptions } = options;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await streamAIResponse(streamOptions);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (!shouldReconnect(lastError) || attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Stream failed");
}
