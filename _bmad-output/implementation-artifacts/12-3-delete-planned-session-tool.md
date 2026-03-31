# Story 12.3: Delete Planned Session Tool + Card

Status: ready-for-dev

## Story

As a runner,
I want to ask the coach to remove a session from my plan (e.g., "remove Thursday's session entirely"),
So that I can clean up sessions that no longer make sense without just skipping them.

## Hard Delete vs Soft Delete Decision

**Decision: Soft delete via new `"deleted"` status value.**

Rationale:
1. The `plannedSessions` table uses a `status` union field (`scheduled | completed | skipped | modified | rescheduled`) that governs session lifecycle. Every other coach action (skip, modify, reschedule) mutates status rather than removing the row. Adding `"deleted"` is consistent with this pattern.
2. A hard `ctx.db.delete()` would break referential integrity -- other sessions in the same week reference the plan structure, and analytics/history queries may need to account for removed sessions when computing weekly volume or adherence.
3. Soft delete preserves audit trail: the coach recommended deletion, the user approved it, and the `deletionReason` field records why. This is valuable for plan retrospectives and future AI reasoning.
4. Soft delete is reversible -- a future "undo" feature or admin recovery becomes trivial.
5. The codebase uses hard `ctx.db.delete()` only for admin/account operations (user deletion, invite cleanup). Training data mutations always use status changes.

**Implementation:** Add `v.literal("deleted")` to the `sessionStatus` union in `plannedSessions.ts`. The mutation sets `status: "deleted"` and writes a `deletionReason` field. All existing queries that display sessions to the user (calendar, upcoming, week view) already filter by status and will need a one-line filter addition to exclude `"deleted"` sessions.

## Acceptance Criteria

### AC 1 -- Tool Definition

**Given** the AI action tool registry exists in `packages/backend/convex/ai/tools/actions.ts`
**When** a `proposeDeleteSession` tool is defined
**Then** it uses the Vercel AI SDK `tool()` helper with a Zod input schema accepting:
- `sessionId` (string) -- The Convex ID of the session to delete
- `sessionName` (string) -- Human-readable session name, e.g. "Tempo"
- `sessionType` (string) -- Session type, e.g. "tempo", "easy", "long_run"
- `date` (string) -- Scheduled date as ISO string
- `dayOfWeek` (string) -- Day of week, e.g. "Thursday"
- `duration` (string) -- Duration display, e.g. "45 min"
- `reason` (string) -- Clear explanation of why deletion is recommended

**And** the tool description clearly states this is a destructive/permanent action (session is removed from the plan, not just skipped), and that the runner will see a confirmation card with a warning tone before execution.

### AC 2 -- Convex Mutation

**Given** a `deletePlannedSession` mutation is defined in `packages/backend/convex/training/actionMutations.ts`
**When** it is invoked with `{ sessionId, reason }`
**Then** it:
1. Calls `getAuthenticatedRunner(ctx)` to verify authentication and get the runner
2. Calls `getOwnedSession(ctx, sessionId, runner._id)` to verify ownership (throws `NOT_FOUND` if session doesn't exist or doesn't belong to user; throws `INVALID_STATE` if session is already completed)
3. Checks if session is already deleted (`status === "deleted"`) and returns `{ success: false, error: "Session is already deleted" }` if so
4. Patches the session: `status: "deleted"`, `deletionReason: "Deleted by coach: ${reason}"`
5. Returns `{ success: true }`

### AC 3 -- DeleteSessionCard UI Component

**Given** the coach proposes deleting a session via `proposeDeleteSession`
**When** the `DeleteSessionCard` component renders in the chat
**Then** it displays:
- Session info row: colored dot (by session type), session name, day + date, duration
- A reason block with a **red/destructive-toned background** (`rgba(255,90,90,0.06)`) instead of the orange tone used by SkipSessionCard -- this visually signals that deletion is more severe than skipping
- An "Approve" button labeled **"Delete Session"** with a **red background** (`COLORS.red`) instead of the standard lime -- reinforcing the destructive nature
- A "Reject" button labeled "Keep Session" (instead of the generic "Not now")

**And** the collapsed summary (after acceptance) reads: `"{sessionName} on {dayOfWeek} deleted"`

### AC 4 -- CoachToolRenderer Integration

**Given** a `proposeDeleteSession` tool result arrives in the chat stream
**When** `CoachToolRenderer` evaluates the `toolName`
**Then** it routes to the `DeleteSessionCard` component with the correct props, following the exact same pattern as the existing `proposeSkipSession` -> `SkipSessionCard` dispatch.

## Tasks / Subtasks

### Task 1: Add `"deleted"` status to planned sessions schema (AC 2)

**File:** `packages/backend/convex/table/plannedSessions.ts`

1.1. Add `v.literal("deleted")` to the `sessionStatus` union:
```ts
export const sessionStatus = v.union(
  v.literal("scheduled"),
  v.literal("completed"),
  v.literal("skipped"),
  v.literal("modified"),
  v.literal("rescheduled"),
  v.literal("deleted")       // <-- new
);
```

1.2. Add an optional `deletionReason` field to the table definition, alongside the existing `skipReason` and `modificationNotes`:
```ts
  // If deleted
  deletionReason: v.optional(v.string()),
```
Place it immediately after the `skipReason` field (around line 132).

1.3. Run `npx convex dev` to regenerate types and validate the schema change compiles.

### Task 2: Add `deletePlannedSession` mutation (AC 2)

**File:** `packages/backend/convex/training/actionMutations.ts`

2.1. Add a new section after the `skipSession` mutation (after line 249):
```ts
// =============================================================================
// Delete Session
// =============================================================================

export const deletePlannedSession = mutation({
  args: {
    sessionId: v.id("plannedSessions"),
    reason: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const runner = await getAuthenticatedRunner(ctx);
    const session = await getOwnedSession(ctx, args.sessionId, runner._id);

    if (session.status === "deleted") {
      return { success: false, error: "Session is already deleted" };
    }

    await ctx.db.patch(args.sessionId, {
      status: "deleted" as const,
      deletionReason: `Deleted by coach: ${args.reason}`,
    });

    return { success: true };
  },
});
```

2.2. Note: `getOwnedSession` already handles:
- `NOT_FOUND` if session doesn't exist or `runnerId` doesn't match
- `INVALID_STATE` if session is `"completed"`

No additional guards needed beyond the `"deleted"` idempotency check.

### Task 3: Define `proposeDeleteSession` tool (AC 1)

**File:** `packages/backend/convex/ai/tools/actions.ts`

3.1. Add a new section after `proposeSkipSession` (after line 108):
```ts
// =============================================================================
// Delete Session
// =============================================================================

export const proposeDeleteSession = tool({
  description:
    "Propose permanently removing a session from the plan. This is a destructive action — the session will be deleted, not just skipped. Use when the runner explicitly asks to remove a session entirely, or when a session no longer makes sense in the plan context (e.g., plan restructuring). The runner will see a confirmation card with a warning before execution. Prefer proposeSkipSession if the session might still be relevant later.",
  inputSchema: z.object({
    sessionId: z.string().describe("The Convex ID of the session to delete"),
    sessionName: z.string().describe("Human-readable session name, e.g. 'Tempo'"),
    sessionType: z.string().describe("Session type, e.g. 'tempo', 'easy', 'long_run'"),
    date: z.string().describe("Scheduled date as ISO string"),
    dayOfWeek: z.string().describe("Day of week, e.g. 'Thursday'"),
    duration: z.string().describe("Duration display, e.g. '45 min'"),
    reason: z.string().describe("Clear explanation of why this session should be removed from the plan"),
  }),
});
```

3.2. Add `proposeDeleteSession` to the `actionTools` export:
```ts
export const actionTools = {
  proposeRescheduleSession,
  proposeModifySession,
  proposeSwapSessions,
  proposeSkipSession,
  proposeDeleteSession,  // <-- new
};
```

### Task 4: Add `DeleteProposal` type (AC 3)

**File:** `apps/native/src/components/app/coach/actions/types.ts`

4.1. Add the `DeleteProposal` interface after `SkipProposal`:
```ts
export interface DeleteProposal {
  type: "delete";
  sessionId: string;
  sessionName: string;
  sessionType: string;
  date: string;
  dayOfWeek: string;
  duration: string;
  reason: string;
}
```

4.2. Add `DeleteProposal` to the `ActionProposal` union type:
```ts
export type ActionProposal =
  | RescheduleProposal
  | ModifyProposal
  | SwapProposal
  | SkipProposal
  | DeleteProposal;   // <-- new
```

### Task 5: Create `DeleteSessionCard` component (AC 3)

**File:** `apps/native/src/components/app/coach/actions/DeleteSessionCard.tsx` (new file)

5.1. Create the component following the exact structure of `SkipSessionCard.tsx`, with these key differences:

```tsx
/**
 * DeleteSessionCard
 *
 * Renders a proposal to permanently delete a session from the plan.
 * Uses destructive (red) styling to distinguish from skip (orange).
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME, SESSION_TYPE_COLORS } from "@/lib/design-tokens";
import { getSessionCategory } from "@/lib/design-tokens";
import { ActionCardWrapper } from "./ActionCardWrapper";
import { ActionButtons } from "./ActionButtons";
import { useActionCardState } from "./useActionCardState";
import type { DeleteProposal, ActionCardProps } from "./types";

interface DeleteSessionCardProps extends Omit<ActionCardProps, "phase" | "onAccept" | "onReject"> {
  proposal: DeleteProposal;
  executeMutation: () => Promise<{ success: boolean; error?: string }>;
  onAccepted: () => void;
  onRejected: () => void;
}

export function DeleteSessionCard({
  toolCallId,
  proposal,
  executeMutation,
  onAccepted,
  onRejected,
}: DeleteSessionCardProps) {
  const { phase, errorMessage, accept, reject, retry } = useActionCardState();

  const summary = `${proposal.sessionName} on ${proposal.dayOfWeek} deleted`;

  const handleAccept = () => {
    accept(executeMutation).then(() => onAccepted());
  };

  const handleReject = () => {
    reject();
    onRejected();
  };

  const handleRetry = () => {
    retry(executeMutation).then(() => onAccepted());
  };

  const sessionColor =
    SESSION_TYPE_COLORS[getSessionCategory(proposal.sessionType)] ?? COLORS.ora;

  return (
    <ActionCardWrapper
      phase={phase}
      title="Delete Session"
      summary={summary}
      errorMessage={errorMessage}
    >
      <View style={{ padding: 14, gap: 14 }}>
        {/* Session info */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: sessionColor,
            }}
          />
          <Text style={{ color: LIGHT_THEME.wText, fontSize: 15, fontWeight: "600" }}>
            {proposal.sessionName}
          </Text>
          <Text style={{ color: LIGHT_THEME.wMute, fontSize: 13 }}>
            {proposal.dayOfWeek}, {proposal.date}
          </Text>
          <Text style={{ color: LIGHT_THEME.wMute, fontSize: 13 }}>{proposal.duration}</Text>
        </View>

        {/* Reason — RED tint for destructive warning */}
        <View
          style={{
            backgroundColor: "rgba(255,90,90,0.06)",
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: COLORS.red, fontSize: 12, fontWeight: "600", marginBottom: 2 }}>
            This session will be permanently removed from your plan.
          </Text>
          <Text style={{ color: LIGHT_THEME.wSub, fontSize: 13, lineHeight: 18 }}>
            {proposal.reason}
          </Text>
        </View>
      </View>

      <ActionButtons
        phase={phase}
        onAccept={handleAccept}
        onReject={handleReject}
        onRetry={handleRetry}
        acceptLabel="Delete Session"
        rejectLabel="Keep Session"
      />
    </ActionCardWrapper>
  );
}
```

**Key styling differences from SkipSessionCard:**
- Reason block uses `rgba(255,90,90,0.06)` (red tint) instead of `rgba(255,149,0,0.06)` (orange tint)
- Includes a bold red warning line: "This session will be permanently removed from your plan."
- `acceptLabel` is "Delete Session" (not "Skip Session")
- `rejectLabel` is "Keep Session" (not "Not now") -- clearer user intent for destructive actions

5.2. **Override the accept button color to red.** The `ActionButtons` component currently uses `COLORS.lime` for the accept button. For delete, the accept button must be red to signal destruction. Two approaches:

**Option A (Recommended -- prop-based):** Add an optional `acceptVariant` prop to `ActionButtons`:
```tsx
// In ActionButtons.tsx, add to interface:
acceptVariant?: "default" | "destructive";

// In the accept button style:
style={[
  styles.acceptButton,
  acceptVariant === "destructive" && { backgroundColor: COLORS.red },
]}
```

Then in `DeleteSessionCard`, pass `acceptVariant="destructive"` to `ActionButtons`.

**Option B (Simpler):** Add an optional `acceptColor` prop:
```tsx
acceptColor?: string;
// ...
style={[styles.acceptButton, acceptColor ? { backgroundColor: acceptColor } : undefined]}
```

Then pass `acceptColor={COLORS.red}` from `DeleteSessionCard`.

Go with Option A -- it's more semantic and prevents arbitrary colors from leaking in.

### Task 6: Update ActionButtons for destructive variant (AC 3)

**File:** `apps/native/src/components/app/coach/actions/ActionButtons.tsx`

6.1. Add `acceptVariant` to the interface:
```ts
interface ActionButtonsProps {
  phase: ActionCardPhase;
  onAccept: () => void;
  onReject: () => void;
  onRetry?: () => void;
  acceptLabel?: string;
  rejectLabel?: string;
  acceptVariant?: "default" | "destructive";  // <-- new
}
```

6.2. Destructure `acceptVariant = "default"` in the component params.

6.3. In the accept button `<TouchableOpacity>`, conditionally override background:
```tsx
style={[
  styles.acceptButton,
  acceptVariant === "destructive" && { backgroundColor: COLORS.red },
]}
```

6.4. For the destructive variant, the label text should be white (not black):
```tsx
<Text
  style={[
    styles.acceptLabel,
    acceptVariant === "destructive" && { color: "#FFFFFF" },
  ]}
>
  {acceptLabel}
</Text>
```

This is needed because `COLORS.red` (#FF5A5A) doesn't have enough contrast with black text but works well with white.

### Task 7: Export from actions barrel (AC 3, AC 4)

**File:** `apps/native/src/components/app/coach/actions/index.ts`

7.1. Add exports:
```ts
export { DeleteSessionCard } from "./DeleteSessionCard";
```

7.2. Add `DeleteProposal` to the type exports:
```ts
export type {
  ActionCardPhase,
  ActionProposal,
  RescheduleProposal,
  ModifyProposal,
  SwapProposal,
  SkipProposal,
  DeleteProposal,    // <-- new
  ActionCardProps,
  ActionResult,
} from "./types";
```

### Task 8: Wire into CoachToolRenderer (AC 4)

**File:** `apps/native/src/components/app/coach/CoachToolRenderer.tsx`

8.1. Add imports:
```ts
import {
  RescheduleSessionCard,
  ModifySessionCard,
  SwapSessionsCard,
  SkipSessionCard,
  DeleteSessionCard,  // <-- new
} from "./actions";
import type {
  RescheduleProposal,
  ModifyProposal,
  SwapProposal,
  SkipProposal,
  DeleteProposal,    // <-- new
} from "./actions";
```

8.2. Add a new case in the switch statement (after `proposeSkipSession`, before `default`):
```tsx
case "proposeDeleteSession":
  return (
    <DeleteSessionCard
      toolCallId={toolCallId}
      proposal={args as DeleteProposal}
      executeMutation={() => executeMutation(toolName, args)}
      onAccepted={() => onAccepted(toolName, args)}
      onRejected={() => onRejected(toolName, args)}
    />
  );
```

### Task 9: Wire mutation dispatch in CoachChatView (AC 4)

**File:** `apps/native/src/components/app/coach/CoachChatView.tsx`

9.1. Add the `useMutation` hook for the new mutation (alongside existing ones, around line 84):
```ts
const deletePlannedSession = useMutation(api.training.actionMutations.deletePlannedSession);
```

9.2. Import `DeleteProposal` type:
```ts
import type { RescheduleProposal, SwapProposal, SkipProposal, DeleteProposal } from "./actions";
```

9.3. Add a new case in `handleExecuteMutation` switch (after `proposeSkipSession`, before `default`):
```ts
case "proposeDeleteSession": {
  const p = args as DeleteProposal;
  return await deletePlannedSession({
    sessionId: p.sessionId as any,
    reason: p.reason,
  });
}
```

9.4. Add `deletePlannedSession` to the `useCallback` dependency array:
```ts
[rescheduleSession, modifySession, swapSessions, skipSession, deletePlannedSession],
```

### Task 10: Filter deleted sessions from UI queries

**File:** `packages/backend/convex/training/queries.ts`

10.1. Review all queries that return planned sessions to the UI (calendar, upcoming, week view). Any query that doesn't already filter by specific statuses should exclude `"deleted"` sessions.

Check these queries:
- `getUpcomingSessions` -- if it queries all non-completed, add `.filter(s => s.status !== "deleted")`
- `getWeekSessions` -- same check
- `getMultiWeekSessions` -- same check
- `readPlannedSessionsForCoach` (from Story 11.2) -- this one should **include** deleted sessions when the coach explicitly asks for them (e.g., `status: "deleted"` filter), but exclude them from default results

10.2. The simplest approach: add a filter at the end of each query's result pipeline:
```ts
.filter(session => session.status !== "deleted")
```

For the coach read tool, include deleted sessions only when `status === "deleted"` is explicitly requested.

## Dev Notes

### RBAC Pattern (Critical)

The mutation follows the exact same RBAC chain as all other action mutations:
```
getAuthUserId(ctx) -> getAuthenticatedRunner(ctx) -> getOwnedSession(ctx, sessionId, runner._id)
```
- `getAuthenticatedRunner` throws `UNAUTHORIZED` if no auth, `RUNNER_NOT_FOUND` if no runner profile
- `getOwnedSession` throws `NOT_FOUND` if session missing or `runnerId` mismatch, `INVALID_STATE` if completed

The approval UI card is a UX gate; the RBAC check is the security gate -- both must pass.

### Tool Description Guidance

The `proposeDeleteSession` tool description explicitly tells the LLM to prefer `proposeSkipSession` when the session might be relevant later. This is important -- delete is the nuclear option. The description reads: "Prefer proposeSkipSession if the session might still be relevant later."

### Existing Status Values and Their Semantics

| Status | Meaning | Who sets it |
|--------|---------|-------------|
| `scheduled` | Default, session is upcoming | Plan generator |
| `completed` | Session was executed | Activity sync |
| `skipped` | Session was intentionally skipped | Coach (via skip mutation) |
| `modified` | Session parameters were changed | Coach (via modify mutation) |
| `rescheduled` | Session was moved to a different date | Coach (via reschedule mutation) |
| `deleted` | **NEW** -- Session was permanently removed from plan | Coach (via delete mutation) |

### Destructive Action UX Pattern

This is the first destructive action card in the system. The visual differentiation from skip is important:

| Aspect | Skip Card | Delete Card |
|--------|-----------|-------------|
| Reason background | `rgba(255,149,0,0.06)` (orange) | `rgba(255,90,90,0.06)` (red) |
| Warning text | None | "This session will be permanently removed from your plan." |
| Accept button bg | `COLORS.lime` (#C8FF00) | `COLORS.red` (#FF5A5A) |
| Accept button text | Black | White |
| Accept label | "Skip Session" | "Delete Session" |
| Reject label | "Not now" | "Keep Session" |

### File Reference Table

| File | Change Type | Purpose |
|------|-------------|---------|
| `packages/backend/convex/table/plannedSessions.ts` | Modify | Add `"deleted"` status + `deletionReason` field |
| `packages/backend/convex/training/actionMutations.ts` | Modify | Add `deletePlannedSession` mutation |
| `packages/backend/convex/ai/tools/actions.ts` | Modify | Add `proposeDeleteSession` tool + export |
| `apps/native/src/components/app/coach/actions/types.ts` | Modify | Add `DeleteProposal` type |
| `apps/native/src/components/app/coach/actions/DeleteSessionCard.tsx` | **New** | Delete card UI component |
| `apps/native/src/components/app/coach/actions/ActionButtons.tsx` | Modify | Add `acceptVariant` prop for destructive styling |
| `apps/native/src/components/app/coach/actions/index.ts` | Modify | Export new component + type |
| `apps/native/src/components/app/coach/CoachToolRenderer.tsx` | Modify | Add `proposeDeleteSession` case |
| `apps/native/src/components/app/coach/CoachChatView.tsx` | Modify | Wire `deletePlannedSession` mutation |
| `packages/backend/convex/training/queries.ts` | Modify | Filter out `"deleted"` sessions from UI queries |

### Testing Checklist

- [ ] Schema change deploys without errors (`npx convex dev`)
- [ ] Mutation rejects unauthenticated requests (no auth -> `UNAUTHORIZED`)
- [ ] Mutation rejects session owned by different runner (-> `NOT_FOUND`)
- [ ] Mutation rejects already-completed session (-> `INVALID_STATE`)
- [ ] Mutation rejects already-deleted session (-> `"Session is already deleted"`)
- [ ] Mutation succeeds: session status becomes `"deleted"`, `deletionReason` is set
- [ ] Deleted session no longer appears in calendar / upcoming / week view queries
- [ ] DeleteSessionCard renders with red-toned warning styling
- [ ] Accept button is red with white text (not lime with black text)
- [ ] Reject button says "Keep Session"
- [ ] Approve flow: card transitions pending -> applying -> accepted, mutation fires, collapsed summary shows
- [ ] Reject flow: card transitions to rejected, collapsed state
- [ ] Error flow: card shows error message, retry button works
- [ ] Coach read tool (Story 11.2) still returns deleted sessions when `status: "deleted"` filter is used
- [ ] LLM prefers skip over delete for non-permanent removals (verify via prompt engineering)
