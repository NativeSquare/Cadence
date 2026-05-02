/**
 * Action Card State Machine Hook
 *
 * Manages the lifecycle of an action proposal card:
 * streaming → pending → applying → accepted | rejected | error | expired
 */

import { useState, useCallback } from "react";
import type { ActionCardPhase } from "./types";

interface UseActionCardStateOptions {
  /** Initial phase (defaults to "pending") */
  initialPhase?: ActionCardPhase;
}

interface UseActionCardStateReturn {
  phase: ActionCardPhase;
  errorMessage: string | undefined;
  /** Transition to "applying" and run the mutation */
  accept: (executeMutation: () => Promise<{ success: boolean; error?: string }>) => Promise<void>;
  /** Transition to "rejected" */
  reject: () => void;
  /** Retry after error */
  retry: (executeMutation: () => Promise<{ success: boolean; error?: string }>) => Promise<void>;
  /** Mark as expired (e.g., workout changed externally) */
  expire: () => void;
}

export function useActionCardState(
  options: UseActionCardStateOptions = {},
): UseActionCardStateReturn {
  const [phase, setPhase] = useState<ActionCardPhase>(options.initialPhase ?? "pending");
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const accept = useCallback(
    async (executeMutation: () => Promise<{ success: boolean; error?: string }>) => {
      if (phase !== "pending") return;
      setPhase("applying");
      setErrorMessage(undefined);

      try {
        const result = await executeMutation();
        if (result.success) {
          setPhase("accepted");
        } else {
          setPhase("error");
          setErrorMessage(result.error ?? "Something went wrong. Try again.");
        }
      } catch (err) {
        setPhase("error");
        setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Try again.");
      }
    },
    [phase],
  );

  const reject = useCallback(() => {
    if (phase !== "pending") return;
    setPhase("rejected");
  }, [phase]);

  const retry = useCallback(
    async (executeMutation: () => Promise<{ success: boolean; error?: string }>) => {
      if (phase !== "error") return;
      setPhase("applying");
      setErrorMessage(undefined);

      try {
        const result = await executeMutation();
        if (result.success) {
          setPhase("accepted");
        } else {
          setPhase("error");
          setErrorMessage(result.error ?? "Something went wrong. Try again.");
        }
      } catch (err) {
        setPhase("error");
        setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Try again.");
      }
    },
    [phase],
  );

  const expire = useCallback(() => {
    if (phase === "accepted" || phase === "rejected") return;
    setPhase("expired");
  }, [phase]);

  return { phase, errorMessage, accept, reject, retry, expire };
}
