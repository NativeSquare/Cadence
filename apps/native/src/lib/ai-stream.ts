/**
 * AI Stream Library
 *
 * SSE parser utilities for Vercel AI SDK streaming format.
 * Handles text chunks, tool calls, reconnection, and structured error handling.
 *
 * Source: Story 2.1 - AC#2, AC#4, Story 8.3 - AC#1, AC#2
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

export type StreamCompletionReason = "complete" | "aborted" | "network-error" | "error";

// =============================================================================
// LLM Error Types (Story 8.3 Task 5.3)
// =============================================================================

/**
 * Structured LLM error codes for categorization.
 * Source: Story 8.3 Task 5.2
 */
export type LLMErrorCode =
  | "LLM_TIMEOUT"
  | "LLM_RATE_LIMITED"
  | "LLM_MODEL_ERROR"
  | "LLM_NETWORK_ERROR"
  | "LLM_ERROR";

/**
 * Structured error response from the AI backend.
 * Source: Story 8.3 Task 5.3
 */
export interface LLMErrorResponse {
  code: LLMErrorCode;
  message: string;
  debugInfo?: {
    requestId: string;
    timestamp: number;
    details?: string;
  };
  isRetryable: boolean;
}

/**
 * Extended Error class with LLM-specific error information.
 * Source: Story 8.3 Task 5.3
 */
export class LLMError extends Error {
  readonly code: LLMErrorCode;
  readonly debugInfo?: LLMErrorResponse["debugInfo"];
  readonly isRetryable: boolean;
  readonly httpStatus?: number;

  constructor(
    message: string,
    code: LLMErrorCode,
    options?: {
      debugInfo?: LLMErrorResponse["debugInfo"];
      isRetryable?: boolean;
      httpStatus?: number;
      cause?: Error;
    }
  ) {
    super(message);
    this.name = "LLMError";
    this.code = code;
    this.debugInfo = options?.debugInfo;
    this.isRetryable = options?.isRetryable ?? true;
    this.httpStatus = options?.httpStatus;
    if (options?.cause) {
      this.cause = options.cause;
    }
  }
}

export interface StreamMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  parts: MessagePart[];
  isComplete: boolean;
  /** How the stream ended - useful for resume logic */
  completionReason?: StreamCompletionReason;
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

  // Handle HTTP errors with structured error parsing (Story 8.3 Task 5.2)
  if (!response.ok) {
    const llmError = await parseErrorResponse(response);
    onError?.(llmError);
    throw llmError;
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
        message.completionReason = "complete";
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
      // Clean abort, not an error - could be paused for network loss
      message.isComplete = true;
      message.completionReason = "aborted";
    } else {
      // Convert to structured LLMError (Story 8.3 Task 5.3)
      const llmError = createLLMErrorFromException(error);
      // Check if this is a network-related error
      message.completionReason = llmError.code === "LLM_NETWORK_ERROR" ? "network-error" : "error";
      onError?.(llmError);
      throw llmError;
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
 * Classify HTTP status code into LLM error code.
 * Source: Story 8.3 Task 5.2
 */
function classifyHttpStatus(status: number): LLMErrorCode {
  switch (status) {
    case 408:
    case 504:
      return "LLM_TIMEOUT";
    case 429:
      return "LLM_RATE_LIMITED";
    case 502:
    case 503:
      return "LLM_MODEL_ERROR";
    default:
      if (status >= 500) return "LLM_MODEL_ERROR";
      return "LLM_ERROR";
  }
}

/**
 * Parse error response body from the AI backend.
 * Source: Story 8.3 Task 5.2
 */
async function parseErrorResponse(response: Response): Promise<LLMError> {
  const status = response.status;
  let errorBody: Partial<LLMErrorResponse> = {};

  try {
    errorBody = await response.json();
  } catch {
    // Non-JSON response body
    errorBody = {
      message: `HTTP ${status}: ${response.statusText || "Request failed"}`,
    };
  }

  // Use the error code from the response or classify from HTTP status
  const code = (errorBody.code as LLMErrorCode) || classifyHttpStatus(status);
  const message = errorBody.message || `HTTP ${status}`;

  return new LLMError(message, code, {
    debugInfo: errorBody.debugInfo,
    isRetryable: errorBody.isRetryable ?? code !== "LLM_MODEL_ERROR",
    httpStatus: status,
  });
}

/**
 * Create LLMError from a caught exception.
 * Source: Story 8.3 Task 5.2
 */
function createLLMErrorFromException(error: unknown): LLMError {
  if (error instanceof LLMError) {
    return error;
  }

  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();

  // Classify based on error message
  let code: LLMErrorCode = "LLM_ERROR";

  if (lowerMessage.includes("timeout") || lowerMessage.includes("timed out") || lowerMessage.includes("deadline")) {
    code = "LLM_TIMEOUT";
  } else if (lowerMessage.includes("rate") || lowerMessage.includes("429") || lowerMessage.includes("too many")) {
    code = "LLM_RATE_LIMITED";
  } else if (lowerMessage.includes("network") || lowerMessage.includes("fetch") || lowerMessage.includes("connection") || lowerMessage.includes("offline") || (error instanceof TypeError)) {
    code = "LLM_NETWORK_ERROR";
  } else if (lowerMessage.includes("model") || lowerMessage.includes("500") || lowerMessage.includes("502") || lowerMessage.includes("503")) {
    code = "LLM_MODEL_ERROR";
  }

  // Determine if error is retryable (Story 8.3 fix - smarter model error handling)
  // Most errors are retryable except:
  // - Rate limits (need to wait)
  // - Permanent model errors (invalid key, quota, policy, context length)
  let isRetryable = true;
  if (code === "LLM_RATE_LIMITED") {
    isRetryable = false; // Need to wait, not immediate retry
  } else if (code === "LLM_MODEL_ERROR") {
    // 5xx errors are transient server errors - retryable
    // Other model errors (invalid_api_key, quota, policy) are permanent - not retryable
    const isTransientServerError =
      lowerMessage.includes("500") ||
      lowerMessage.includes("502") ||
      lowerMessage.includes("503") ||
      lowerMessage.includes("server_error");
    const isPermanentError =
      lowerMessage.includes("invalid_api_key") ||
      lowerMessage.includes("insufficient_quota") ||
      lowerMessage.includes("content_policy") ||
      lowerMessage.includes("context_length");
    isRetryable = isTransientServerError && !isPermanentError;
  }

  return new LLMError(message, code, {
    isRetryable,
    cause: error instanceof Error ? error : undefined,
  });
}

/**
 * Check if error is network-related
 */
export function isNetworkError(error: Error): boolean {
  if (error instanceof LLMError) {
    return error.code === "LLM_NETWORK_ERROR";
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("timeout") ||
    message.includes("connection") ||
    message.includes("offline") ||
    message.includes("internet") ||
    error.name === "TypeError" // fetch fails with TypeError on network errors
  );
}

/**
 * Check if we should attempt reconnection based on error type.
 * Source: Story 8.3 Task 5.2
 */
export function shouldReconnect(error: Error): boolean {
  // Use isRetryable from LLMError if available
  if (error instanceof LLMError) {
    // Don't retry rate limits immediately (need to wait)
    if (error.code === "LLM_RATE_LIMITED") {
      return false;
    }
    return error.isRetryable;
  }

  const message = error.message.toLowerCase();

  // Don't retry auth errors
  if (message.includes("unauthorized") || message.includes("401")) {
    return false;
  }

  // Don't retry rate limits immediately
  if (message.includes("rate") || message.includes("429")) {
    return false;
  }

  // Retry network errors and timeouts
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
 * Create a reconnecting stream with exponential backoff.
 * Source: Story 8.3 - AC#2
 */
export async function streamWithReconnect(
  options: StreamOptions & { maxRetries?: number }
): Promise<StreamMessage> {
  const { maxRetries = 3, ...streamOptions } = options;
  let lastError: LLMError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await streamAIResponse(streamOptions);
    } catch (error) {
      // Convert to LLMError for consistent handling (Story 8.3 Task 5.3)
      lastError = error instanceof LLMError
        ? error
        : createLLMErrorFromException(error);

      if (!shouldReconnect(lastError) || attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff: 1s, 2s, 4s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new LLMError("Stream failed after max retries", "LLM_ERROR");
}
