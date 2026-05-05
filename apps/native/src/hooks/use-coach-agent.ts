import { useCallback, useMemo, useRef, useState } from "react";
import { useAction, useMutation } from "convex/react";
import { useUIMessages } from "@convex-dev/agent/react";
import { api } from "@packages/backend/convex/_generated/api";
import type { MessagePart, ToolMessagePart } from "@/lib/ai-stream";
import { useNetworkOptional } from "@/contexts/network-context";
import type { ChatMessage } from "@/components/app/coach/types";

const MAX_RETRIES = 3;

export interface UseCoachAgentOptions {
  threadId?: string;
  maxRetries?: number;
  onError?: (error: Error) => void;
}

export interface UseCoachAgentReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  error: Error | null;
  isOffline: boolean;
  isReconnecting: boolean;
  retryCount: number;
  maxRetries: number;
  isRetriesExhausted: boolean;
  sendMessage: (content: string, imageUrls?: string[]) => Promise<void>;
  retry: () => Promise<void>;
  respondToToolApproval: (args: {
    approvalId: string;
    approved: boolean;
    reason?: string;
  }) => Promise<void>;
}

export function useCoachAgent(
  options: UseCoachAgentOptions = {},
): UseCoachAgentReturn {
  const { threadId, maxRetries: maxRetriesOption = MAX_RETRIES, onError } = options;

  const sendAction = useAction(api.coach.messages.send);
  const respondToToolApprovalMutation = useMutation(
    api.coach.messages.respondToToolApproval,
  );

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
          .map((p): MessagePart | null => {
            if (p.type === "text") {
              return { type: "text", text: p.text };
            }
            if (typeof p.type === "string" && p.type.startsWith("tool-")) {
              const tp = p as unknown as ToolMessagePart;
              return {
                type: tp.type,
                toolCallId: tp.toolCallId,
                state: tp.state,
                input: tp.input,
                output: tp.output,
                errorText: tp.errorText,
                approval: tp.approval,
              };
            }
            return null;
          })
          .filter((p): p is MessagePart => p !== null);
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

  const respondToToolApproval = useCallback(
    async (args: { approvalId: string; approved: boolean; reason?: string }) => {
      if (!threadId) return;
      await respondToToolApprovalMutation({ threadId, ...args });
    },
    [threadId, respondToToolApprovalMutation],
  );

  return {
    messages,
    isStreaming,
    error,
    isOffline,
    isReconnecting: false,
    retryCount,
    maxRetries: maxRetriesOption,
    isRetriesExhausted: retryCount >= maxRetriesOption,
    sendMessage,
    retry,
    respondToToolApproval,
  };
}
