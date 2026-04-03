# Story 12.4: Batch Session Proposal Card

Status: ready-for-dev

## Story

As a runner,
I want the coach to propose multiple session changes at once (e.g., "reschedule my whole week"),
So that complex plan adjustments feel like one decision, not five separate approvals.

## Acceptance Criteria

### AC 1 — Tool Definition

**Given** the AI tool registry exists in `packages/backend/convex/ai/tools/actions.ts`
**When** a `proposeBatchChanges` tool is defined
**Then** it uses the Vercel AI SDK `tool()` helper with a Zod schema accepting:
- `title` (string) — short summary of the batch, e.g. "Reschedule your recovery week"
- `reason` (string) — overall explanation of why these changes are proposed together
- `changes` (array of polymorphic change objects) where each item has:
  - `action` (enum: `"reschedule"` | `"modify"` | `"skip"` | `"create"` | `"delete"`)
  - `sessionId` (optional string) — required for reschedule, modify, skip, delete; absent for create
  - `sessionName` (string) — human-readable name for display
  - `sessionType` (string) — e.g. `"tempo"`, `"easy"`, `"long_run"`
  - `reason` (string) — per-change rationale
  - `details` (object) — action-specific fields (see Zod schema in Tasks section)

**And** the tool validates that:
- At least 2 changes are present (otherwise use individual tools)
- No duplicate `sessionId` values within the batch (except for create which has no sessionId)
- Every non-create change has a `sessionId`

### AC 2 — WeekOverviewCard UI Component

**Given** the coach calls `proposeBatchChanges`
**When** the card renders in the chat
**Then** it displays:
- A header with the batch `title` and change count (e.g. "4 changes")
- The overall `reason` in a styled callout box
- A scrollable list of individual changes, each showing:
  - Action badge (color-coded: reschedule=orange, modify=blue, skip=gray, create=green, delete=red)
  - Session name and type indicator dot
  - A compact summary of what changes (date move, field diff, etc.)
  - Per-change reason text
- An "Approve All" primary button (lime green, matching existing Accept buttons)
- A "Reject All" secondary text link (matching existing "Not now" pattern)
- Optional per-change toggle switches to exclude specific changes from the batch

**And** the card follows the same phase state machine as existing cards: `pending` -> `applying` -> `accepted` | `rejected` | `error`

**And** in the `accepted` state, the card collapses to a one-line summary (same pattern as existing cards)

### AC 3 — Batch Mutation Execution

**Given** the user taps "Approve All" (or "Approve Selected" if toggles are used)
**When** the frontend calls the batch mutation
**Then** a single Convex mutation `executeBatchChanges` executes ALL approved changes atomically:
1. Authenticates via `getAuthUserId` -> `getAuthenticatedRunner` (single RBAC check)
2. For each change, validates the target session via `getOwnedSession` (ownership verification)
3. Applies each change in sequence within the same mutation transaction:
   - `reschedule`: patches `scheduledDate`, `dayOfWeek`, `dayOfWeekShort`, `status` = "rescheduled"
   - `modify`: patches the specified fields, `status` = "modified"
   - `skip`: patches `status` = "skipped", sets `skipReason`
   - `create`: inserts a new `plannedSessions` document
   - `delete`: deletes the `plannedSessions` document (or marks as skipped — see Dev Notes)
4. If ANY change fails validation (ownership, staleness, invalid state), the entire mutation rolls back (Convex transactional guarantee) and returns `{ success: false, error: "..." }`
5. On success, returns `{ success: true, appliedCount: N }`

**And** partial application is never possible — either all approved changes succeed or none do (NFR-R1)

### AC 4 — Coach Prompt Guidance

**Given** the Coach OS prompt in `packages/backend/convex/ai/prompts/coach_os.ts`
**When** `proposeBatchChanges` is available
**Then** the `ACTION_TOOL_INSTRUCTIONS` section includes:
```
- **proposeBatchChanges**: Propose multiple session changes as a single decision. Use when the user's request affects 3+ sessions (e.g., "reschedule my whole week", "make this a recovery week", "swap my hard days"). Each change in the batch needs an action type, target session, and reason.

### When to Use Batch vs. Individual
- **1-2 sessions**: Use individual tools (proposeRescheduleSession, proposeModifySession, etc.)
- **3+ sessions**: Use proposeBatchChanges so the runner approves once instead of N times
- **Mixed actions**: Batch is ideal when combining reschedules + modifications + skips in one request
```

## Tasks / Subtasks

### Task 1: Define the `proposeBatchChanges` AI SDK tool (AC 1)

**File:** `packages/backend/convex/ai/tools/actions.ts`

1.1. Add the following Zod schema and tool definition after the existing `proposeSkipSession` tool:

```ts
// =============================================================================
// Batch Changes
// =============================================================================

/**
 * Action-specific detail schemas for each change type.
 * These mirror the fields from individual tool schemas but are nested
 * inside a single polymorphic changes array.
 */
const rescheduleDetails = z.object({
  currentDate: z.string().describe("Current scheduled date as ISO string, e.g. '2026-04-03'"),
  currentDayOfWeek: z.string().describe("Current day of week, e.g. 'Thursday'"),
  proposedDate: z.string().describe("Proposed new date as ISO string, e.g. '2026-04-04'"),
  proposedDayOfWeek: z.string().describe("Proposed day of week, e.g. 'Friday'"),
  duration: z.string().describe("Session duration display, e.g. '50 min'"),
});

const modifyDetails = z.object({
  changes: z.array(
    z.object({
      field: z.string().describe("The field being changed, e.g. 'targetDurationSeconds'"),
      fieldLabel: z.string().describe("Human-readable label, e.g. 'Duration'"),
      oldValue: z.string().describe("Current value for display"),
      newValue: z.string().describe("Proposed value for display"),
    })
  ).describe("List of fields to change with before/after values"),
});

const skipDetails = z.object({
  date: z.string().describe("Scheduled date as ISO string"),
  dayOfWeek: z.string().describe("Day of week, e.g. 'Wednesday'"),
  duration: z.string().describe("Duration display, e.g. '45 min'"),
  alternative: z.string().optional().describe("Optional alternative suggestion"),
});

const createDetails = z.object({
  date: z.string().describe("Date for the new session as ISO string"),
  dayOfWeek: z.string().describe("Day of week for the new session"),
  duration: z.string().describe("Duration display, e.g. '30 min'"),
  targetDurationSeconds: z.number().describe("Duration in seconds"),
  effortLevel: z.number().describe("Effort 1-10"),
  effortDisplay: z.string().describe("Effort display, e.g. '3/10'"),
  description: z.string().describe("Session description"),
});

const deleteDetails = z.object({
  date: z.string().describe("Scheduled date as ISO string"),
  dayOfWeek: z.string().describe("Day of week"),
  duration: z.string().describe("Duration display"),
});

const batchChangeItem = z.object({
  action: z.enum(["reschedule", "modify", "skip", "create", "delete"]).describe("Type of change"),
  sessionId: z.string().optional().describe("Convex ID of the existing session (required for all actions except 'create')"),
  sessionName: z.string().describe("Human-readable session name for display"),
  sessionType: z.string().describe("Session type, e.g. 'tempo', 'easy', 'long_run'"),
  reason: z.string().describe("Why this specific change is needed"),
  details: z.union([
    rescheduleDetails,
    modifyDetails,
    skipDetails,
    createDetails,
    deleteDetails,
  ]).describe("Action-specific fields — shape depends on the action type"),
});

export const proposeBatchChanges = tool({
  description:
    "Propose multiple session changes as a single batch decision. Use when the user's request affects 3 or more sessions (e.g., 'reschedule my whole week', 'make this a recovery week'). Each change includes an action type, target session, and rationale. The runner sees all changes in one card and can approve or reject the entire batch.",
  inputSchema: z.object({
    title: z.string().describe("Short summary of the batch, e.g. 'Reschedule your recovery week'"),
    reason: z.string().describe("Overall explanation of why these changes are proposed together"),
    changes: z.array(batchChangeItem)
      .min(2)
      .describe("Array of individual changes to apply as a batch"),
  }),
});
```

1.2. Update the `actionTools` export to include the new tool:

```ts
export const actionTools = {
  proposeRescheduleSession,
  proposeModifySession,
  proposeSwapSessions,
  proposeSkipSession,
  proposeBatchChanges,
};
```

1.3. **Do NOT add an `execute` function** — this follows the existing action tool pattern where tools are proposal-only. The frontend renders a confirmation card; execution happens via a separate Convex mutation after user approval.

### Task 2: Add TypeScript types for the batch proposal (AC 2)

**File:** `apps/native/src/components/app/coach/actions/types.ts`

2.1. Add the batch change item types:

```ts
// =============================================================================
// Batch Change Types
// =============================================================================

export interface BatchRescheduleDetails {
  currentDate: string;
  currentDayOfWeek: string;
  proposedDate: string;
  proposedDayOfWeek: string;
  duration: string;
}

export interface BatchModifyDetails {
  changes: Array<{
    field: string;
    fieldLabel: string;
    oldValue: string;
    newValue: string;
  }>;
}

export interface BatchSkipDetails {
  date: string;
  dayOfWeek: string;
  duration: string;
  alternative?: string;
}

export interface BatchCreateDetails {
  date: string;
  dayOfWeek: string;
  duration: string;
  targetDurationSeconds: number;
  effortLevel: number;
  effortDisplay: string;
  description: string;
}

export interface BatchDeleteDetails {
  date: string;
  dayOfWeek: string;
  duration: string;
}

export type BatchChangeDetails =
  | BatchRescheduleDetails
  | BatchModifyDetails
  | BatchSkipDetails
  | BatchCreateDetails
  | BatchDeleteDetails;

export interface BatchChangeItem {
  action: "reschedule" | "modify" | "skip" | "create" | "delete";
  sessionId?: string;
  sessionName: string;
  sessionType: string;
  reason: string;
  details: BatchChangeDetails;
}

export interface BatchProposal {
  type: "batch";
  title: string;
  reason: string;
  changes: BatchChangeItem[];
}
```

2.2. Update the `ActionProposal` union to include `BatchProposal`:

```ts
export type ActionProposal =
  | RescheduleProposal
  | ModifyProposal
  | SwapProposal
  | SkipProposal
  | BatchProposal;
```

### Task 3: Create the `BatchChangesCard` component (AC 2)

**File:** `apps/native/src/components/app/coach/actions/BatchChangesCard.tsx` (new file)

3.1. Component structure and imports:

```tsx
import { useState, useCallback } from "react";
import { View, ScrollView, Switch } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME, SESSION_TYPE_COLORS } from "@/lib/design-tokens";
import { getSessionCategory } from "@/lib/design-tokens";
import {
  ArrowRight,
  CalendarClock,
  Pencil,
  SkipForward,
  Plus,
  Trash2,
} from "lucide-react-native";
import { ActionCardWrapper } from "./ActionCardWrapper";
import { ActionButtons } from "./ActionButtons";
import { useActionCardState } from "./useActionCardState";
import type {
  BatchProposal,
  BatchChangeItem,
  BatchRescheduleDetails,
  BatchModifyDetails,
  BatchSkipDetails,
  BatchCreateDetails,
  BatchDeleteDetails,
  ActionCardProps,
} from "./types";
```

3.2. Action badge component (renders color-coded pill per action type):

```tsx
const ACTION_COLORS: Record<BatchChangeItem["action"], string> = {
  reschedule: COLORS.ora,    // orange — move
  modify: "#60A5FA",         // blue — change
  skip: LIGHT_THEME.wMute,   // gray — skip
  create: COLORS.grn,        // green — add
  delete: COLORS.red,        // red — remove
};

const ACTION_LABELS: Record<BatchChangeItem["action"], string> = {
  reschedule: "Move",
  modify: "Update",
  skip: "Skip",
  create: "Add",
  delete: "Remove",
};

const ACTION_ICONS: Record<BatchChangeItem["action"], React.ComponentType<any>> = {
  reschedule: CalendarClock,
  modify: Pencil,
  skip: SkipForward,
  create: Plus,
  delete: Trash2,
};

function ActionBadge({ action }: { action: BatchChangeItem["action"] }) {
  const color = ACTION_COLORS[action];
  const Icon = ACTION_ICONS[action];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        backgroundColor: `${color}18`, // 10% opacity hex
      }}
    >
      <Icon size={11} color={color} />
      <Text style={{ color, fontSize: 11, fontWeight: "600" }}>
        {ACTION_LABELS[action]}
      </Text>
    </View>
  );
}
```

3.3. Per-change summary renderer (shows compact detail per action type):

```tsx
function ChangeSummary({ change }: { change: BatchChangeItem }) {
  switch (change.action) {
    case "reschedule": {
      const d = change.details as BatchRescheduleDetails;
      return (
        <Text style={{ color: LIGHT_THEME.wSub, fontSize: 13 }}>
          {d.currentDayOfWeek} {d.currentDate} → {d.proposedDayOfWeek} {d.proposedDate}
        </Text>
      );
    }
    case "modify": {
      const d = change.details as BatchModifyDetails;
      const labels = d.changes.map((c) => `${c.fieldLabel}: ${c.oldValue} → ${c.newValue}`);
      return (
        <Text style={{ color: LIGHT_THEME.wSub, fontSize: 13 }}>
          {labels.join(", ")}
        </Text>
      );
    }
    case "skip": {
      const d = change.details as BatchSkipDetails;
      return (
        <Text style={{ color: LIGHT_THEME.wSub, fontSize: 13 }}>
          {d.dayOfWeek} {d.date} — {d.duration}
          {d.alternative ? ` (alt: ${d.alternative})` : ""}
        </Text>
      );
    }
    case "create": {
      const d = change.details as BatchCreateDetails;
      return (
        <Text style={{ color: LIGHT_THEME.wSub, fontSize: 13 }}>
          {d.dayOfWeek} {d.date} — {d.duration}, effort {d.effortDisplay}
        </Text>
      );
    }
    case "delete": {
      const d = change.details as BatchDeleteDetails;
      return (
        <Text style={{ color: LIGHT_THEME.wSub, fontSize: 13 }}>
          {d.dayOfWeek} {d.date} — {d.duration}
        </Text>
      );
    }
  }
}
```

3.4. Single change row component:

```tsx
function ChangeRow({
  change,
  index,
  total,
  enabled,
  onToggle,
  showToggle,
}: {
  change: BatchChangeItem;
  index: number;
  total: number;
  enabled: boolean;
  onToggle: (index: number) => void;
  showToggle: boolean;
}) {
  const sessionColor =
    SESSION_TYPE_COLORS[getSessionCategory(change.sessionType)] ?? COLORS.ora;

  return (
    <View
      style={{
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderBottomWidth: index < total - 1 ? 1 : 0,
        borderBottomColor: LIGHT_THEME.wBrd,
        opacity: enabled ? 1 : 0.4,
      }}
    >
      {/* Top row: badge + session name + optional toggle */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
          <ActionBadge action={change.action} />
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: sessionColor }} />
          <Text
            style={{ color: LIGHT_THEME.wText, fontSize: 14, fontWeight: "600" }}
            numberOfLines={1}
          >
            {change.sessionName}
          </Text>
        </View>
        {showToggle && (
          <Switch
            value={enabled}
            onValueChange={() => onToggle(index)}
            trackColor={{ false: LIGHT_THEME.wBrd, true: COLORS.lime }}
            thumbColor="#fff"
            style={{ transform: [{ scale: 0.75 }] }}
          />
        )}
      </View>

      {/* Change details */}
      <ChangeSummary change={change} />

      {/* Per-change reason */}
      <Text
        style={{
          color: LIGHT_THEME.wMute,
          fontSize: 12,
          marginTop: 4,
          lineHeight: 16,
        }}
      >
        {change.reason}
      </Text>
    </View>
  );
}
```

3.5. Main `BatchChangesCard` component:

```tsx
interface BatchChangesCardProps extends Omit<ActionCardProps, "phase" | "onAccept" | "onReject"> {
  proposal: BatchProposal;
  executeMutation: (enabledIndexes: number[]) => Promise<{ success: boolean; error?: string }>;
  onAccepted: () => void;
  onRejected: () => void;
}

export function BatchChangesCard({
  toolCallId,
  proposal,
  executeMutation,
  onAccepted,
  onRejected,
}: BatchChangesCardProps) {
  const { phase, errorMessage, accept, reject, retry } = useActionCardState();

  // Track which changes are toggled on (default: all on)
  const [enabledFlags, setEnabledFlags] = useState<boolean[]>(
    () => proposal.changes.map(() => true)
  );

  const enabledCount = enabledFlags.filter(Boolean).length;
  const enabledIndexes = enabledFlags
    .map((v, i) => (v ? i : -1))
    .filter((i) => i >= 0);

  // Only show toggles if there are 3+ changes (below that, batch loses its point)
  const showToggles = proposal.changes.length >= 3;

  const handleToggle = useCallback((index: number) => {
    setEnabledFlags((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      // Ensure at least 1 change remains enabled
      if (next.every((v) => !v)) return prev;
      return next;
    });
  }, []);

  const summary = `${enabledCount} change${enabledCount !== 1 ? "s" : ""} applied: ${proposal.title}`;

  const handleAccept = () => {
    accept(() => executeMutation(enabledIndexes)).then(() => onAccepted());
  };

  const handleReject = () => {
    reject();
    onRejected();
  };

  const handleRetry = () => {
    retry(() => executeMutation(enabledIndexes)).then(() => onAccepted());
  };

  const acceptLabel =
    enabledCount === proposal.changes.length
      ? "Approve All"
      : `Approve ${enabledCount} of ${proposal.changes.length}`;

  return (
    <ActionCardWrapper
      phase={phase}
      title={`Batch Plan Changes (${proposal.changes.length})`}
      summary={summary}
      errorMessage={errorMessage}
    >
      <View style={{ maxHeight: 400 }}>
        {/* Overall reason */}
        <View
          style={{
            backgroundColor: "rgba(255,149,0,0.06)",
            paddingHorizontal: 14,
            paddingVertical: 10,
            marginHorizontal: 14,
            marginTop: 14,
            borderRadius: 10,
          }}
        >
          <Text style={{ color: LIGHT_THEME.wSub, fontSize: 13, lineHeight: 18 }}>
            {proposal.reason}
          </Text>
        </View>

        {/* Changes list (scrollable if many) */}
        <ScrollView
          style={{ marginTop: 8 }}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
        >
          {proposal.changes.map((change, i) => (
            <ChangeRow
              key={`${change.sessionId ?? "new"}-${i}`}
              change={change}
              index={i}
              total={proposal.changes.length}
              enabled={enabledFlags[i]}
              onToggle={handleToggle}
              showToggle={showToggles}
            />
          ))}
        </ScrollView>
      </View>

      {/* Action buttons */}
      <ActionButtons
        phase={phase}
        onAccept={handleAccept}
        onReject={handleReject}
        onRetry={handleRetry}
        acceptLabel={acceptLabel}
      />
    </ActionCardWrapper>
  );
}
```

3.6. Export from the actions barrel file (`index.ts`):

```ts
export { BatchChangesCard } from "./BatchChangesCard";
export type {
  // ...existing exports...
  BatchProposal,
  BatchChangeItem,
} from "./types";
```

### Task 4: Create the batch execution mutation (AC 3)

**File:** `packages/backend/convex/training/actionMutations.ts`

4.1. Add Convex validator types for batch change items:

```ts
const batchRescheduleDetails = v.object({
  currentDate: v.string(),
  currentDayOfWeek: v.string(),
  proposedDate: v.string(),
  proposedDayOfWeek: v.string(),
  duration: v.string(),
});

const batchModifyDetails = v.object({
  changes: v.array(v.object({
    field: v.string(),
    fieldLabel: v.string(),
    oldValue: v.string(),
    newValue: v.string(),
  })),
});

const batchSkipDetails = v.object({
  date: v.string(),
  dayOfWeek: v.string(),
  duration: v.string(),
  alternative: v.optional(v.string()),
});

const batchCreateDetails = v.object({
  date: v.string(),
  dayOfWeek: v.string(),
  duration: v.string(),
  targetDurationSeconds: v.number(),
  effortLevel: v.number(),
  effortDisplay: v.string(),
  description: v.string(),
});

const batchDeleteDetails = v.object({
  date: v.string(),
  dayOfWeek: v.string(),
  duration: v.string(),
});

const batchChangeItem = v.object({
  action: v.union(
    v.literal("reschedule"),
    v.literal("modify"),
    v.literal("skip"),
    v.literal("create"),
    v.literal("delete"),
  ),
  sessionId: v.optional(v.string()),
  sessionName: v.string(),
  sessionType: v.string(),
  reason: v.string(),
  // Details is a loose object since shape varies by action.
  // Validation is done in the handler based on action type.
  details: v.any(),
});
```

4.2. Add the `executeBatchChanges` mutation:

```ts
export const executeBatchChanges = mutation({
  args: {
    title: v.string(),
    changes: v.array(batchChangeItem),
    enabledIndexes: v.array(v.number()),
    reason: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    appliedCount: v.optional(v.number()),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const runner = await getAuthenticatedRunner(ctx);

    // Filter to only enabled changes
    const enabledChanges = args.enabledIndexes
      .filter((i) => i >= 0 && i < args.changes.length)
      .map((i) => args.changes[i]);

    if (enabledChanges.length === 0) {
      return { success: false, error: "No changes selected" };
    }

    // Pre-validate: fetch and verify all existing sessions first
    // (fail fast before mutating anything)
    const sessionCache = new Map<string, any>();
    for (const change of enabledChanges) {
      if (change.action !== "create" && change.sessionId) {
        if (!sessionCache.has(change.sessionId)) {
          const session = await getOwnedSession(ctx, change.sessionId as any, runner._id);
          sessionCache.set(change.sessionId, session);
        }
      }
    }

    // Apply each change within this single transaction
    let appliedCount = 0;

    for (const change of enabledChanges) {
      switch (change.action) {
        case "reschedule": {
          const details = change.details as {
            currentDate: string;
            proposedDate: string;
          };
          const session = sessionCache.get(change.sessionId!);

          // Staleness check
          if (!isSameDay(session.scheduledDate, new Date(details.currentDate).getTime())) {
            throw new ConvexError({
              code: "STALE_DATA",
              message: `Session "${change.sessionName}" has been modified since the proposal. Ask Coach for a new suggestion.`,
            });
          }

          const origDate = new Date(session.scheduledDate);
          const targetDate = new Date(details.proposedDate);
          targetDate.setUTCHours(
            origDate.getUTCHours(),
            origDate.getUTCMinutes(),
            origDate.getUTCSeconds(),
            origDate.getUTCMilliseconds(),
          );
          const dayIdx = targetDate.getUTCDay();

          await ctx.db.patch(change.sessionId as any, {
            scheduledDate: targetDate.getTime(),
            dayOfWeek: DAYS_FULL[dayIdx],
            dayOfWeekShort: DAYS_SHORT[dayIdx],
            status: "rescheduled" as const,
            modificationNotes: `Rescheduled by coach (batch): ${change.reason}`,
          });
          appliedCount++;
          break;
        }

        case "modify": {
          const details = change.details as {
            changes: Array<{ field: string; newValue: string }>;
          };
          const patch: Record<string, any> = {};
          for (const c of details.changes) {
            patch[c.field] = c.newValue;
          }
          patch.status = "modified";
          patch.modificationNotes = `Modified by coach (batch): ${change.reason}`;

          await ctx.db.patch(change.sessionId as any, patch);
          appliedCount++;
          break;
        }

        case "skip": {
          const session = sessionCache.get(change.sessionId!);
          if (session.status === "skipped") {
            throw new ConvexError({
              code: "INVALID_STATE",
              message: `Session "${change.sessionName}" is already skipped`,
            });
          }
          await ctx.db.patch(change.sessionId as any, {
            status: "skipped" as const,
            skipReason: `Skipped by coach (batch): ${change.reason}`,
          });
          appliedCount++;
          break;
        }

        case "create": {
          const details = change.details as {
            date: string;
            dayOfWeek: string;
            duration: string;
            targetDurationSeconds: number;
            effortLevel: number;
            effortDisplay: string;
            description: string;
          };

          // Look up the runner's active plan to get planId
          const plan = await ctx.db
            .query("trainingPlans")
            .withIndex("by_runnerId", (q: any) => q.eq("runnerId", runner._id))
            .order("desc")
            .first();

          if (!plan) {
            throw new ConvexError({
              code: "NO_PLAN",
              message: "No active training plan found",
            });
          }

          const dateObj = new Date(details.date);
          const dayIdx = dateObj.getUTCDay();

          await ctx.db.insert("plannedSessions", {
            planId: plan._id,
            runnerId: runner._id,
            weekNumber: 0, // Coach-created sessions; compute from plan start if needed
            dayOfWeek: DAYS_FULL[dayIdx],
            dayOfWeekShort: DAYS_SHORT[dayIdx],
            scheduledDate: dateObj.getTime(),
            sessionType: change.sessionType,
            sessionTypeDisplay: change.sessionName,
            isKeySession: false,
            isRestDay: change.sessionType === "rest" || change.sessionType === "recovery",
            targetDurationSeconds: details.targetDurationSeconds,
            targetDurationDisplay: details.duration,
            effortLevel: details.effortLevel,
            effortDisplay: details.effortDisplay,
            description: details.description,
            justification: `Added by coach (batch): ${change.reason}`,
            physiologicalTarget: "recovery", // Default; coach can be more specific
            isMoveable: true,
            status: "scheduled" as const,
            modificationNotes: `Created by coach (batch): ${change.reason}`,
          });
          appliedCount++;
          break;
        }

        case "delete": {
          // Soft-delete: mark as skipped with a deletion note.
          // Hard delete (ctx.db.delete) loses audit trail.
          // Use hard delete only if story 12.3 established that pattern.
          await ctx.db.patch(change.sessionId as any, {
            status: "skipped" as const,
            skipReason: `Removed by coach (batch): ${change.reason}`,
          });
          appliedCount++;
          break;
        }
      }
    }

    return { success: true, appliedCount };
  },
});
```

**Key design decision:** The entire mutation handler runs in a single Convex transaction. If any `getOwnedSession` throws (ownership failure), any staleness check throws, or any `db.patch`/`db.insert` fails, the entire transaction rolls back automatically. This is Convex's built-in transactional guarantee — no explicit rollback code needed.

### Task 5: Wire the batch card into `CoachToolRenderer` (AC 2)

**File:** `apps/native/src/components/app/coach/CoachToolRenderer.tsx`

5.1. Add import:

```ts
import { BatchChangesCard } from "./actions";
import type { BatchProposal } from "./actions";
```

5.2. Add case to the switch statement:

```ts
case "proposeBatchChanges":
  return (
    <BatchChangesCard
      toolCallId={toolCallId}
      proposal={args as BatchProposal}
      executeMutation={(enabledIndexes) =>
        executeMutation(toolName, { ...(args as any), enabledIndexes })
      }
      onAccepted={() => onAccepted(toolName, args)}
      onRejected={() => onRejected(toolName, args)}
    />
  );
```

### Task 6: Wire the batch mutation in `CoachChatView` (AC 3)

**File:** `apps/native/src/components/app/coach/CoachChatView.tsx`

6.1. Add the mutation hook:

```ts
const executeBatchChanges = useMutation(api.training.actionMutations.executeBatchChanges);
```

6.2. Add a new case in `handleExecuteMutation`:

```ts
case "proposeBatchChanges": {
  const p = args as BatchProposal & { enabledIndexes?: number[] };
  const enabledIndexes = p.enabledIndexes ?? p.changes.map((_, i) => i);
  return await executeBatchChanges({
    title: p.title,
    changes: p.changes.map((c) => ({
      action: c.action,
      sessionId: c.sessionId,
      sessionName: c.sessionName,
      sessionType: c.sessionType,
      reason: c.reason,
      details: c.details,
    })),
    enabledIndexes,
    reason: p.reason,
  });
}
```

6.3. Update the `isActionTool` helper to match the new tool (it already works since `proposeBatchChanges` starts with `"propose"`):

```ts
const isActionTool = (toolName: string) => toolName.startsWith("propose");
// ^ This already covers proposeBatchChanges — no change needed
```

### Task 7: Update Coach OS prompt (AC 4)

**File:** `packages/backend/convex/ai/prompts/coach_os.ts`

7.1. Update the `ACTION_TOOL_INSTRUCTIONS` constant. Add the batch tool entry and the "when to use batch" guidance after the existing tool list:

```ts
const ACTION_TOOL_INSTRUCTIONS = `## Action Tools (Schedule & Session Changes)
When the runner asks to change their schedule or modify sessions, use these proposal tools. Each one renders a confirmation card — the runner must accept before changes are applied.

- **proposeRescheduleSession**: Move a session to a different date. Include the session ID, both dates, and a clear reason.
- **proposeModifySession**: Change session details (type, duration, effort, pace). Provide a list of changes with old/new values.
- **proposeSwapSessions**: Swap two sessions' dates (e.g., swap Thursday's tempo with Friday's easy run).
- **proposeSkipSession**: Skip a session with a reason and optional alternative.
- **proposeBatchChanges**: Propose multiple session changes as a single decision. Each change needs an action type (reschedule, modify, skip, create, delete), target session ID, and reason.

### When to Use Batch vs. Individual Tools
- **1-2 sessions**: Use individual tools (proposeRescheduleSession, proposeModifySession, etc.)
- **3+ sessions**: Use proposeBatchChanges so the runner approves once instead of N times
- **Mixed actions**: Batch is ideal when combining reschedules + modifications + skips in one request (e.g., "make this a recovery week" might skip a hard session, reduce effort on another, and reschedule a third)

### Rules for Action Tools
1. **One proposal at a time** — propose a single action or a single batch, wait for acceptance or rejection before proposing more
2. **Always explain why** — include a clear reason so the runner understands the rationale
3. **Use real session IDs** — reference sessions from the Upcoming Sessions context below
4. **Respect isMoveable** — prefer moving sessions flagged as moveable; warn if moving a non-moveable session
5. **After rejection** — ask the runner what they'd prefer instead
6. **After acceptance** — acknowledge the change naturally and briefly
7. **Don't propose changes to completed or skipped sessions**
8. **Consider downstream impact** — if moving a hard session next to another hard session, note the recovery concern`;
```

### Task 8: Update exports and barrel files

**Files:**
- `apps/native/src/components/app/coach/actions/index.ts`
- `apps/native/src/components/app/coach/actions/types.ts`

8.1. In `index.ts`, add:

```ts
export { BatchChangesCard } from "./BatchChangesCard";
```

And add `BatchProposal`, `BatchChangeItem` to the type exports.

8.2. Verify that `CoachToolRenderer.tsx` imports from the barrel file correctly.

## Dev Notes

### Convex Transactional Guarantees (Critical for AC 3)

Convex mutations are fully transactional. Every `db.patch`, `db.insert`, and `db.delete` call within a single mutation handler either ALL succeed or ALL roll back. This is confirmed by the existing `swapSessions` mutation in `actionMutations.ts` which performs two `db.patch` calls in one handler. The batch mutation leverages this same guarantee — no explicit transaction management or try/catch rollback logic is needed.

If any operation within `executeBatchChanges` throws (via `ConvexError` from `getOwnedSession`, staleness checks, or Convex internal errors), the entire mutation is rolled back and the error propagates to the client. The `useActionCardState` hook catches this and transitions the card to the `error` phase.

### Polymorphic `details` Field Design

The `details` field uses `z.union` on the Zod side and `v.any()` on the Convex validator side. This is intentional:
- **Zod side (tool schema)**: The LLM sees the full union type with descriptions, so it generates correctly shaped details per action type. However, because the LLM fills a single `details` field and the action is a separate field, the Zod union acts as documentation rather than strict runtime discrimination. The handler must cast based on `action`.
- **Convex side (mutation args)**: Using `v.any()` for `details` avoids the complexity of a Convex discriminated union validator. Runtime validation happens in the switch statement.

An alternative design considered was a discriminated union with `z.discriminatedUnion("action", [...])` at the top level of each change item. This was rejected because:
1. The AI SDK tool schema serialization works best with flat unions
2. Runtime validation in the mutation handler is straightforward
3. It matches the existing pattern where action tools pass display-oriented args that the mutation interprets

### Per-Change Toggles (AC 2 Optional)

The toggle switches let the user deselect specific changes. Design constraints:
- At least 1 change must remain enabled (prevent empty batch approval)
- Toggles only appear when 3+ changes are present (below that, individual tools should have been used)
- The `enabledIndexes` array is passed to the mutation so it knows which changes to apply
- The "Approve" button label dynamically updates: "Approve All" vs. "Approve 3 of 5"

### Create and Delete Actions

Stories 12.2 and 12.3 (prerequisites) define individual `proposeCreateSession` and `proposeDeleteSession` tools with their own cards and mutations. The batch tool reuses their logic inline:

- **Create**: The batch mutation inserts a new `plannedSessions` document. It needs to look up the runner's active `trainingPlan` to get the `planId` foreign key. The `weekNumber` is set to 0 for coach-created sessions (or computed from the plan's start date if needed). Many fields use sensible defaults; the LLM provides the essential ones (date, type, duration, effort, description).
- **Delete**: Two strategies were considered:
  - **Soft delete** (mark as `skipped` with a deletion note) — preserves audit trail, simpler
  - **Hard delete** (`ctx.db.delete(sessionId)`) — removes from DB entirely
  
  The story uses soft delete by default. If story 12.3 establishes hard delete as the pattern, update the `"delete"` case in the batch mutation to match.

### Conflict Validation Logic

The batch mutation validates potential conflicts before and during execution:

1. **Duplicate session check**: The Zod schema description tells the LLM not to include the same sessionId twice, but the mutation should also guard against it. Add a Set-based check at the start of the handler:
   ```ts
   const sessionIds = enabledChanges
     .filter((c) => c.sessionId)
     .map((c) => c.sessionId!);
   if (new Set(sessionIds).size !== sessionIds.length) {
     return { success: false, error: "Duplicate session IDs in batch" };
   }
   ```

2. **State validation**: `getOwnedSession` already rejects completed sessions. The handler additionally checks for already-skipped sessions before applying a skip.

3. **Staleness check**: For reschedule actions, the `currentDate` is compared against the actual `scheduledDate` (same `isSameDay` logic as the individual `rescheduleSession` mutation). If any session has been modified since the proposal, the entire batch fails.

4. **Date conflict detection**: The tool description instructs the LLM to "validate all changes can be applied without conflicts." The LLM is responsible for not scheduling two sessions on the same day. If the product later requires server-side date collision detection, a post-loop check can query `plannedSessions.by_date` for the affected date range.

### Batch Size Limits

For safety, consider adding a maximum batch size (e.g., 10 changes). This prevents:
- Overly complex proposals that confuse the user
- Mutation timeouts from too many db operations
- LLM hallucination generating dozens of changes

Add `z.array(batchChangeItem).min(2).max(10)` to the tool schema.

### Streaming Behavior

The existing `http_action.ts` uses `stopWhen: stepCountIs(5)` to limit multi-step tool calls. A single `proposeBatchChanges` call counts as one tool call (one step), unlike individual tools which would each be a separate step. This means batch is more efficient from a step-budget perspective.

The `CoachToolRenderer` already handles the streaming → call state transition. Since `proposeBatchChanges` returns `null` during streaming (via the `if (state === "streaming") return null` guard), the card only appears once the full args are parsed.

### RBAC Security Model

The batch mutation enforces the same RBAC chain as individual mutations:
1. `getAuthUserId(ctx)` — verify authentication
2. `getAuthenticatedRunner(ctx)` — resolve runner, verify exists
3. `getOwnedSession(ctx, sessionId, runner._id)` — per-session ownership check

This happens once at the top of the mutation (authentication) and once per session (ownership). The approval card is a UX gate; the RBAC checks in the mutation are the security gate. Both must pass.

### Existing Patterns Reference

| Pattern | File | Notes |
|---------|------|-------|
| Tool definition (no execute) | `actions.ts` lines 16-34 | `proposeBatchChanges` follows this |
| Card component structure | `RescheduleSessionCard.tsx` | Wrapper + content + ActionButtons |
| State machine hook | `useActionCardState.ts` | Reused as-is |
| Mutation RBAC helpers | `actionMutations.ts` lines 34-67 | `getAuthenticatedRunner`, `getOwnedSession` |
| Multi-write mutation | `actionMutations.ts` lines 177-219 | `swapSessions` does 2 patches |
| Tool dispatch | `CoachToolRenderer.tsx` switch | Add new case |
| Mutation wiring | `CoachChatView.tsx` lines 158-212 | Add new case |
| Coach prompt tool docs | `coach_os.ts` lines 131-147 | Update `ACTION_TOOL_INSTRUCTIONS` |

### File Manifest

```
MODIFY  packages/backend/convex/ai/tools/actions.ts          — Add proposeBatchChanges tool definition
MODIFY  packages/backend/convex/training/actionMutations.ts   — Add executeBatchChanges mutation
MODIFY  packages/backend/convex/ai/prompts/coach_os.ts        — Update ACTION_TOOL_INSTRUCTIONS
CREATE  apps/native/src/components/app/coach/actions/BatchChangesCard.tsx  — New card component
MODIFY  apps/native/src/components/app/coach/actions/types.ts  — Add batch types
MODIFY  apps/native/src/components/app/coach/actions/index.ts  — Export BatchChangesCard
MODIFY  apps/native/src/components/app/coach/CoachToolRenderer.tsx — Add proposeBatchChanges case
MODIFY  apps/native/src/components/app/coach/CoachChatView.tsx — Wire executeBatchChanges mutation
```

### Testing Checklist

- [ ] Coach uses `proposeBatchChanges` when user says "reschedule my whole week"
- [ ] Coach uses individual tools for "move tomorrow's run to Friday" (single session)
- [ ] BatchChangesCard renders all change types with correct badges and summaries
- [ ] Approve All executes all changes atomically
- [ ] Toggling off 2 of 5 changes, then approving, only applies 3
- [ ] If one session was externally modified (stale), entire batch fails with clear error
- [ ] Reject All transitions card to rejected state and notifies LLM
- [ ] Card collapses to summary in accepted/rejected states
- [ ] RBAC: unauthenticated request fails with UNAUTHORIZED
- [ ] RBAC: attempting to batch-modify another user's sessions fails with NOT_FOUND
- [ ] Completed sessions in the batch cause the entire batch to fail (getOwnedSession guard)
- [ ] Empty enabledIndexes returns error, not a silent no-op
