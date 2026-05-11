import { useCallback, useMemo, useRef, useState } from "react";
import { useAction } from "convex/react";
import { useUIMessages, type UIMessage } from "@convex-dev/agent/react";
import { api } from "@packages/backend/convex/_generated/api";
import { useNetworkOptional } from "@/contexts/network-context";

const MAX_RETRIES = 3;

export interface CoachAttachment {
  url: string;
  mimeType: string;
  kind: "image" | "file";
}

export interface UseCoachAgentOptions {
  threadId?: string;
  maxRetries?: number;
  onError?: (error: Error) => void;
}

export interface UseCoachAgentReturn {
  messages: UIMessage[];
  isStreaming: boolean;
  error: Error | null;
  isOffline: boolean;
  isReconnecting: boolean;
  retryCount: number;
  maxRetries: number;
  isRetriesExhausted: boolean;
  sendMessage: (content: string, attachments?: CoachAttachment[]) => Promise<void>;
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
  const respondToToolApprovalAction = useAction(
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
  const lastPayloadRef = useRef<{ text: string; attachments?: CoachAttachment[] } | null>(null);

  const network = useNetworkOptional();
  const isOffline = network?.isOffline ?? false;

  const messages = useMemo<UIMessage[]>(
    () =>
      results?.filter((m) => m.role === "user" || m.role === "assistant") ?? [],
    [results],
  );

  const isStreaming = useMemo(() => {
    if (sending) return true;
    const last = messages[messages.length - 1];
    if (!last) return false;
    return last.status === "streaming" || last.role === "user";
  }, [sending, messages]);

  const sendMessage = useCallback(
    async (content: string, attachments?: CoachAttachment[]) => {
      if (!threadId) return;
      if (isOffline) return;
      if (sending) return;

      lastPayloadRef.current = { text: content, attachments };
      setSending(true);
      setError(null);

      try {
        await sendAction({
          threadId,
          text: content,
          attachments: attachments && attachments.length > 0 ? attachments : undefined,
        });
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
    const { text, attachments } = lastPayloadRef.current;
    await sendMessage(text, attachments);
  }, [sendMessage]);

  const respondToToolApproval = useCallback(
    async (args: { approvalId: string; approved: boolean; reason?: string }) => {
      if (!threadId) return;
      await respondToToolApprovalAction({ threadId, ...args });
    },
    [threadId, respondToToolApprovalAction],
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
