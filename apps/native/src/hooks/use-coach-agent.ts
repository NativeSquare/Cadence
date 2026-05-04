import { useCallback, useMemo, useRef, useState } from "react";
import { useAction } from "convex/react";
import { useUIMessages } from "@convex-dev/agent/react";
import { api } from "@packages/backend/convex/_generated/api";
import type { MessagePart } from "@/lib/ai-stream";
import { useNetworkOptional } from "@/contexts/network-context";
import type { ChatMessage, UseAIChatReturn } from "./use-ai-chat";
import { MAX_RETRIES } from "./use-ai-chat";

/**
 * Drop-in replacement for `useAIChat` that talks to the new `convex/coach/`
 * agent backend (`@convex-dev/agent`). Returns the same shape as `useAIChat`
 * so `CoachChatView` swaps with a single import change.
 */

export interface UseCoachAgentOptions {
  threadId?: string;
  maxRetries?: number;
  onError?: (error: Error) => void;
}

export function useCoachAgent(
  options: UseCoachAgentOptions = {},
): UseAIChatReturn {
  const { threadId, maxRetries: maxRetriesOption = MAX_RETRIES, onError } = options;

  const sendAction = useAction(api.coach.messages.send);

  const { results } = useUIMessages(
    api.coach.messages.list,
    threadId ? { threadId } : "skip",
    { initialNumItems: 50, stream: true },
  );

  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [sending, setSending] = useState(false);
  const lastPayloadRef = useRef<{ text: string; imageUrls?: string[] } | null>(null);

  const network = useNetworkOptional();
  const isOffline = network?.isOffline ?? false;

  const messages = useMemo<ChatMessage[]>(() => {
    if (!results) return [];
    return results
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => {
        const parts: MessagePart[] = (m.parts ?? [])
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => ({ type: "text", text: p.text }));
        return {
          id: m.key,
          role: m.role as "user" | "assistant",
          content: m.text ?? "",
          parts: parts.length > 0 ? parts : [{ type: "text", text: m.text ?? "" }],
          isStreaming: m.status === "streaming",
          createdAt: m._creationTime ?? 0,
        };
      });
  }, [results]);

  const isStreaming = useMemo(() => {
    if (sending) return true;
    const last = messages[messages.length - 1];
    if (!last) return false;
    return last.isStreaming || last.role === "user";
  }, [sending, messages]);

  const sendMessage = useCallback(
    async (content: string, imageUrls?: string[]) => {
      if (!threadId) return;
      if (isOffline) return;
      if (sending) return;

      lastPayloadRef.current = { text: content, imageUrls };
      setSending(true);
      setError(null);

      try {
        await sendAction({ threadId, text: content });
        setRetryCount(0);
      } catch (err) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        onError?.(e);
      } finally {
        setSending(false);
      }
    },
    [threadId, sendAction, isOffline, sending, onError],
  );

  const retry = useCallback(async () => {
    if (!lastPayloadRef.current) return;
    setRetryCount((prev) => prev + 1);
    const { text, imageUrls } = lastPayloadRef.current;
    await sendMessage(text, imageUrls);
  }, [sendMessage]);

  const resetRetryCount = useCallback(() => {
    setRetryCount(0);
    setError(null);
  }, []);

  const sendToolDecision = useCallback(async () => {}, []);
  const appendMessage = useCallback(() => {}, []);
  const clearMessages = useCallback(() => {}, []);
  const abort = useCallback(() => {}, []);
  const saveProgress = useCallback(async (): Promise<string | null> => null, []);

  return {
    messages,
    isStreaming,
    error,
    isOffline,
    isReconnecting: false,
    disconnectionDuration: 0,
    retryCount,
    maxRetries: maxRetriesOption,
    isRetriesExhausted: retryCount >= maxRetriesOption,
    sendMessage,
    sendToolDecision,
    appendMessage,
    clearMessages,
    abort,
    retry,
    resetRetryCount,
    saveProgress,
  };
}
