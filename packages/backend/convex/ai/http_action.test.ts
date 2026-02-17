/**
 * LLM Error Classification Tests (Story 8.3)
 *
 * Tests for error classification, user-friendly messages, and request ID generation.
 * Tests actual production code via imports - no duplication.
 *
 * Source: Story 8.3 - AC#1 (error classification), AC#1 (user-friendly messages)
 */

import { describe, it, expect } from "vitest";
import {
  classifyError,
  generateRequestId,
  ERROR_MESSAGES,
  ERROR_STATUS_CODES,
  type LLMErrorCode,
} from "./http_action";

// =============================================================================
// Test Fixtures
// =============================================================================

/**
 * LLM Error codes that should be recognized
 */
const LLM_ERROR_CODES: LLMErrorCode[] = [
  "LLM_TIMEOUT",
  "LLM_RATE_LIMITED",
  "LLM_MODEL_ERROR",
  "LLM_NETWORK_ERROR",
  "LLM_ERROR",
];

// =============================================================================
// Tests: Error Classification (Story 8.3 Task 1.1)
// =============================================================================

describe("LLM Error Classification", () => {
  describe("Timeout Detection", () => {
    it("should classify timeout errors", () => {
      const result = classifyError(new Error("Request timeout exceeded"));
      expect(result.code).toBe("LLM_TIMEOUT");
    });

    it("should classify 'timed out' errors", () => {
      const result = classifyError(new Error("The request timed out"));
      expect(result.code).toBe("LLM_TIMEOUT");
    });

    it("should classify deadline errors", () => {
      const result = classifyError(new Error("Deadline exceeded"));
      expect(result.code).toBe("LLM_TIMEOUT");
    });

    it("should classify AbortError as timeout", () => {
      const error = new Error("Aborted");
      error.name = "AbortError";
      const result = classifyError(error);
      expect(result.code).toBe("LLM_TIMEOUT");
    });
  });

  describe("Rate Limit Detection", () => {
    it("should classify rate limit errors", () => {
      const result = classifyError(new Error("Rate limit exceeded"));
      expect(result.code).toBe("LLM_RATE_LIMITED");
    });

    it("should classify rate_limit errors", () => {
      const result = classifyError(new Error("Error: rate_limit_exceeded"));
      expect(result.code).toBe("LLM_RATE_LIMITED");
    });

    it("should classify 429 errors", () => {
      const result = classifyError(new Error("HTTP 429: Too many requests"));
      expect(result.code).toBe("LLM_RATE_LIMITED");
    });

    it("should classify 'too many requests' errors", () => {
      const result = classifyError(new Error("Too many requests, please slow down"));
      expect(result.code).toBe("LLM_RATE_LIMITED");
    });
  });

  describe("Network Error Detection", () => {
    it("should classify network errors", () => {
      const result = classifyError(new Error("Network request failed"));
      expect(result.code).toBe("LLM_NETWORK_ERROR");
    });

    it("should classify fetch errors", () => {
      const result = classifyError(new Error("Fetch failed"));
      expect(result.code).toBe("LLM_NETWORK_ERROR");
    });

    it("should classify connection errors", () => {
      const result = classifyError(new Error("Connection refused"));
      expect(result.code).toBe("LLM_NETWORK_ERROR");
    });

    it("should classify ECONNREFUSED errors", () => {
      const result = classifyError(new Error("ECONNREFUSED"));
      expect(result.code).toBe("LLM_NETWORK_ERROR");
    });

    it("should classify ENOTFOUND errors", () => {
      const result = classifyError(new Error("getaddrinfo ENOTFOUND api.openai.com"));
      expect(result.code).toBe("LLM_NETWORK_ERROR");
    });

    it("should classify offline errors", () => {
      const result = classifyError(new Error("Device is offline"));
      expect(result.code).toBe("LLM_NETWORK_ERROR");
    });

    it("should classify TypeError as network error", () => {
      const error = new TypeError("Failed to fetch");
      const result = classifyError(error);
      expect(result.code).toBe("LLM_NETWORK_ERROR");
    });
  });

  describe("Model Error Detection", () => {
    it("should classify model errors", () => {
      const result = classifyError(new Error("Model not found"));
      expect(result.code).toBe("LLM_MODEL_ERROR");
    });

    it("should classify invalid API key errors", () => {
      const result = classifyError(new Error("invalid_api_key: Incorrect API key"));
      expect(result.code).toBe("LLM_MODEL_ERROR");
    });

    it("should classify quota errors", () => {
      const result = classifyError(new Error("insufficient_quota: You exceeded your quota"));
      expect(result.code).toBe("LLM_MODEL_ERROR");
    });

    it("should classify context length errors", () => {
      const result = classifyError(new Error("context_length_exceeded: Too many tokens"));
      expect(result.code).toBe("LLM_MODEL_ERROR");
    });

    it("should classify content policy errors", () => {
      const result = classifyError(new Error("content_policy_violation: Request flagged"));
      expect(result.code).toBe("LLM_MODEL_ERROR");
    });

    it("should classify server errors", () => {
      const result = classifyError(new Error("server_error: Internal error"));
      expect(result.code).toBe("LLM_MODEL_ERROR");
    });

    it("should classify 500 errors", () => {
      const result = classifyError(new Error("HTTP 500: Internal Server Error"));
      expect(result.code).toBe("LLM_MODEL_ERROR");
    });

    it("should classify 502 errors", () => {
      const result = classifyError(new Error("HTTP 502: Bad Gateway"));
      expect(result.code).toBe("LLM_MODEL_ERROR");
    });

    it("should classify 503 errors", () => {
      const result = classifyError(new Error("HTTP 503: Service Unavailable"));
      expect(result.code).toBe("LLM_MODEL_ERROR");
    });
  });

  describe("Generic Error Fallback", () => {
    it("should fallback to LLM_ERROR for unknown errors", () => {
      const result = classifyError(new Error("Something weird happened"));
      expect(result.code).toBe("LLM_ERROR");
    });

    it("should handle string errors", () => {
      const result = classifyError("String error message");
      expect(result.code).toBe("LLM_ERROR");
    });

    it("should handle null errors", () => {
      const result = classifyError(null);
      expect(result.code).toBe("LLM_ERROR");
    });

    it("should handle undefined errors", () => {
      const result = classifyError(undefined);
      expect(result.code).toBe("LLM_ERROR");
    });
  });
});

// =============================================================================
// Tests: Request ID Generation (Story 8.3 Task 1.3)
// =============================================================================

describe("Request ID Generation", () => {
  it("should generate request IDs with correct prefix", () => {
    const requestId = generateRequestId();
    expect(requestId).toMatch(/^req_/);
  });

  it("should generate unique request IDs", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateRequestId());
    }
    expect(ids.size).toBe(100);
  });

  it("should generate request IDs of consistent format", () => {
    const requestId = generateRequestId();
    // Format: req_{timestamp}_{random}
    const parts = requestId.split("_");
    expect(parts.length).toBe(3);
    expect(parts[0]).toBe("req");
    expect(parts[1].length).toBeGreaterThan(0);
    expect(parts[2].length).toBe(6);
  });
});

// =============================================================================
// Tests: Error Response Structure (Story 8.3 Task 1.2)
// =============================================================================

describe("Error Response Structure", () => {
  it("should have user-friendly messages for all error codes", () => {
    for (const code of LLM_ERROR_CODES) {
      expect(ERROR_MESSAGES[code]).toBeDefined();
      expect(ERROR_MESSAGES[code].length).toBeGreaterThan(0);
    }
  });

  it("should have friendly, non-technical messages", () => {
    for (const code of LLM_ERROR_CODES) {
      const message = ERROR_MESSAGES[code];
      // Messages should not contain technical jargon
      expect(message).not.toMatch(/error code/i);
      expect(message).not.toMatch(/exception/i);
      expect(message).not.toMatch(/stack trace/i);
      expect(message).not.toMatch(/HTTP \d{3}/);
    }
  });

  it("should provide actionable messages with retry option", () => {
    for (const code of LLM_ERROR_CODES) {
      const message = ERROR_MESSAGES[code];
      // Most messages should suggest retry
      if (code !== "LLM_MODEL_ERROR") {
        expect(message.toLowerCase()).toMatch(/try|retry|again/);
      }
    }
  });
});

// =============================================================================
// Tests: HTTP Status Codes
// =============================================================================

describe("HTTP Status Codes", () => {
  it("should map LLM_TIMEOUT to 504 Gateway Timeout", () => {
    expect(ERROR_STATUS_CODES["LLM_TIMEOUT"]).toBe(504);
  });

  it("should map LLM_RATE_LIMITED to 429 Too Many Requests", () => {
    expect(ERROR_STATUS_CODES["LLM_RATE_LIMITED"]).toBe(429);
  });

  it("should map LLM_MODEL_ERROR to 502 Bad Gateway", () => {
    expect(ERROR_STATUS_CODES["LLM_MODEL_ERROR"]).toBe(502);
  });

  it("should map LLM_NETWORK_ERROR to 503 Service Unavailable", () => {
    expect(ERROR_STATUS_CODES["LLM_NETWORK_ERROR"]).toBe(503);
  });

  it("should map LLM_ERROR to 500 Internal Server Error", () => {
    expect(ERROR_STATUS_CODES["LLM_ERROR"]).toBe(500);
  });
});
