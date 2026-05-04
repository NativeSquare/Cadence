import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@packages/backend/convex/_generated/api";

/**
 * Resolves (or lazily creates) the active agent thread for the current user.
 * Drop-in shape replacement for `useCoachChat` while we develop the new
 * `convex/coach/` agent backend alongside the legacy `convex/cadence/` chat.
 */

export type CoachAgentThreadPhase = "loading" | "ready" | "error";

export interface UseCoachAgentThreadReturn {
  phase: CoachAgentThreadPhase;
  threadId: string | undefined;
}

export function useCoachAgentThread(): UseCoachAgentThreadReturn {
  const active = useQuery(api.coach.threads.getActive);
  const getOrCreate = useMutation(api.coach.threads.getOrCreate);

  const [threadId, setThreadId] = useState<string>();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (threadId) return;
    if (active === undefined) return;

    if (active) {
      setThreadId(active._id);
      return;
    }

    getOrCreate({})
      .then((id) => setThreadId(id))
      .catch(() => setError(true));
  }, [active, getOrCreate, threadId]);

  const phase: CoachAgentThreadPhase = error
    ? "error"
    : threadId
      ? "ready"
      : "loading";

  return { phase, threadId };
}
