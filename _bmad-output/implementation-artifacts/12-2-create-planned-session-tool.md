# Story 12.2 — Create Planned Session Tool + Card

## User Story

As a runner,
I want to ask the coach to add a new session to my plan (e.g., "add an easy recovery jog on Wednesday"),
So that I can fill gaps or add sessions without manually editing the calendar.

---

## Status: READY FOR IMPLEMENTATION

---

## Acceptance Criteria

| AC | Description |
|----|-------------|
| AC 1 | **Tool definition:** `proposeCreateSession` tool with Zod schema in `actions.ts`. Accepts `scheduledDate`, `sessionType`, `sessionSubtype` (optional), `targetDurationSeconds`, `effortLevel`, `targetPaceMin`/`targetPaceMax` (optional), `justification`. Validates that the date does not conflict with an existing key session on the same day. |
| AC 2 | **Convex mutation:** `createPlannedSession` mutation in `actionMutations.ts`. Creates a new planned session record linked to the user's active plan and `runnerId`. Enforces RBAC via `getAuthenticatedRunner`. Sets status to `"scheduled"` and populates all required fields. |
| AC 3 | **CreateSessionCard UI:** Renders in chat showing session type, date, duration, effort, pace targets (if set), justification. Has Approve/Reject buttons. Approve triggers the `createPlannedSession` mutation. Reject sends rejection feedback to the coach. |
| AC 4 | **CoachToolRenderer integration:** When a `proposeCreateSession` tool result arrives, `CoachToolRenderer.tsx` routes to the new `CreateSessionCard` component. |

---

## Architecture & Security

### RBAC Chain (CRITICAL)
Every mutation follows the same chain — no exceptions:
```
getAuthUserId(ctx) → getAuthenticatedRunner(ctx) → ownership verification
```

For `createPlannedSession`, ownership is verified by:
1. Getting the authenticated runner via `getAuthenticatedRunner(ctx)` (returns runner with `_id`)
2. Querying for the runner's active training plan: `trainingPlans` where `runnerId === runner._id` and `status === "active"`
3. Confirming such a plan exists before inserting the new session

The approval UI card is a UX gate; the RBAC check in the mutation is the security gate — both must pass.

---

## Files to Create / Modify

### New Files

| # | File | Purpose |
|---|------|---------|
| 1 | `apps/native/src/components/app/coach/actions/CreateSessionCard.tsx` | UI card component for the create session proposal |

### Modified Files

| # | File | Change |
|---|------|--------|
| 2 | `packages/backend/convex/ai/tools/actions.ts` | Add `proposeCreateSession` tool definition |
| 3 | `packages/backend/convex/training/actionMutations.ts` | Add `createPlannedSession` mutation |
| 4 | `apps/native/src/components/app/coach/actions/index.ts` | Export `CreateSessionCard` and `CreateSessionProposal` type |
| 5 | `apps/native/src/components/app/coach/actions/types.ts` | Add `CreateSessionProposal` interface, add to `ActionProposal` union |
| 6 | `apps/native/src/components/app/coach/CoachToolRenderer.tsx` | Add `proposeCreateSession` case |
| 7 | `apps/native/src/components/app/coach/CoachChatView.tsx` | Add `createPlannedSession` mutation hook + dispatch case |
| 8 | `packages/backend/convex/ai/prompts/coach_os.ts` | Add `proposeCreateSession` to ACTION_TOOL_INSTRUCTIONS |

---

## Detailed Implementation Specs

### 1. Tool Definition — `proposeCreateSession` in `actions.ts`

**File:** `packages/backend/convex/ai/tools/actions.ts`

Add a new tool following the exact same pattern as existing tools (Zod schema, no execute function — proposal only).

```ts
// =============================================================================
// Create Session
// =============================================================================

export const proposeCreateSession = tool({
  description:
    "Propose adding a new session to the runner's plan. Use when the runner asks to add a session, fill a rest day, or add extra training. The runner will see the session details and can accept or reject.",
  inputSchema: z.object({
    scheduledDate: z
      .string()
      .describe("Target date as ISO string, e.g. '2026-04-09'"),
    dayOfWeek: z
      .string()
      .describe("Day of week, e.g. 'Wednesday'"),
    sessionType: z
      .string()
      .describe("Session type: 'easy' | 'tempo' | 'intervals' | 'long_run' | 'recovery' | 'hills' | 'race'"),
    sessionTypeDisplay: z
      .string()
      .describe("Human-readable session type for display, e.g. 'Easy Run'"),
    sessionSubtype: z
      .string()
      .optional()
      .describe("Optional subtype: 'progression' | 'fartlek' | 'hills' | 'track'"),
    targetDurationSeconds: z
      .number()
      .describe("Target duration in seconds, e.g. 2400 for 40 min"),
    targetDurationDisplay: z
      .string()
      .describe("Duration for display, e.g. '40 min'"),
    effortLevel: z
      .number()
      .min(0)
      .max(10)
      .describe("Effort level 0-10"),
    effortDisplay: z
      .string()
      .describe("Effort for display, e.g. '3/10'"),
    targetPaceMin: z
      .string()
      .optional()
      .describe("Faster end of pace range, e.g. '5:30/km'"),
    targetPaceMax: z
      .string()
      .optional()
      .describe("Slower end of pace range, e.g. '6:00/km'"),
    targetPaceDisplay: z
      .string()
      .optional()
      .describe("Pace range for display, e.g. '5:30-6:00/km'"),
    description: z
      .string()
      .describe("Full description of the session"),
    isKeySession: z
      .boolean()
      .describe("Whether this is a quality/key session"),
    justification: z
      .string()
      .describe("Why this session is being added — the coaching rationale"),
  }),
});
```

Add to the `actionTools` export:

```ts
export const actionTools = {
  proposeRescheduleSession,
  proposeModifySession,
  proposeSwapSessions,
  proposeSkipSession,
  proposeCreateSession,       // NEW
};
```

**Key design decisions:**
- Includes both raw values (`targetDurationSeconds`, `effortLevel`) and display strings (`targetDurationDisplay`, `effortDisplay`) — the LLM generates both, matching the existing `plannedSessions` schema pattern
- `description` is required (matches the `plannedSessions` table where `description` is non-optional)
- `isKeySession` is explicit so the LLM signals whether this is a quality session (used for conflict checking)
- `justification` maps to the `justification` field on `plannedSessions`
- `dayOfWeek` is included so the card can display it without parsing the date string

---

### 2. Convex Mutation — `createPlannedSession` in `actionMutations.ts`

**File:** `packages/backend/convex/training/actionMutations.ts`

Follow the exact RBAC + validation pattern from existing mutations.

```ts
// =============================================================================
// Create Session
// =============================================================================

export const createPlannedSession = mutation({
  args: {
    scheduledDate: v.number(),          // Unix timestamp ms
    sessionType: v.string(),
    sessionTypeDisplay: v.string(),
    sessionSubtype: v.optional(v.string()),
    targetDurationSeconds: v.number(),
    targetDurationDisplay: v.string(),
    effortLevel: v.number(),
    effortDisplay: v.string(),
    targetPaceMin: v.optional(v.string()),
    targetPaceMax: v.optional(v.string()),
    targetPaceDisplay: v.optional(v.string()),
    description: v.string(),
    isKeySession: v.boolean(),
    justification: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
    sessionId: v.optional(v.id("plannedSessions")),
  }),
  handler: async (ctx, args) => {
    // ── RBAC ──
    const runner = await getAuthenticatedRunner(ctx);

    // ── Get active plan ──
    const activePlan = await ctx.db
      .query("trainingPlans")
      .withIndex("by_runnerId", (q: any) => q.eq("runnerId", runner._id))
      .filter((q: any) => q.eq(q.field("status"), "active"))
      .first();

    if (!activePlan) {
      return { success: false, error: "No active training plan found" };
    }

    // ── Conflict check: no existing key session on the same day ──
    if (args.isKeySession) {
      const dayStart = new Date(args.scheduledDate);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(args.scheduledDate);
      dayEnd.setUTCHours(23, 59, 59, 999);

      const sameDaySessions = await ctx.db
        .query("plannedSessions")
        .withIndex("by_date", (q: any) =>
          q
            .eq("runnerId", runner._id)
            .gte("scheduledDate", dayStart.getTime())
            .lte("scheduledDate", dayEnd.getTime())
        )
        .collect();

      const hasKeyConflict = sameDaySessions.some(
        (s: any) => s.isKeySession && s.status !== "skipped"
      );

      if (hasKeyConflict) {
        return {
          success: false,
          error:
            "There is already a key session on this day. Consider rescheduling the existing session first.",
        };
      }
    }

    // ── Derive day fields ──
    const date = new Date(args.scheduledDate);
    const dayIdx = date.getUTCDay();
    const dayOfWeek = DAYS_FULL[dayIdx];
    const dayOfWeekShort = DAYS_SHORT[dayIdx];

    // ── Compute week number relative to plan start ──
    const planStart = new Date(activePlan.startDate);
    planStart.setUTCHours(0, 0, 0, 0);
    const diffMs = date.getTime() - planStart.getTime();
    const weekNumber = Math.max(1, Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000)) + 1);

    // ── Insert ──
    const sessionId = await ctx.db.insert("plannedSessions", {
      planId: activePlan._id,
      runnerId: runner._id,

      // Schedule
      weekNumber,
      dayOfWeek,
      dayOfWeekShort,
      scheduledDate: args.scheduledDate,

      // Type
      sessionType: args.sessionType,
      sessionTypeDisplay: args.sessionTypeDisplay,
      sessionSubtype: args.sessionSubtype,
      isKeySession: args.isKeySession,
      isRestDay: false,

      // Duration & Effort
      targetDurationSeconds: args.targetDurationSeconds,
      targetDurationDisplay: args.targetDurationDisplay,
      effortLevel: args.effortLevel,
      effortDisplay: args.effortDisplay,

      // Pace
      targetPaceMin: args.targetPaceMin,
      targetPaceMax: args.targetPaceMax,
      targetPaceDisplay: args.targetPaceDisplay,

      // Description
      description: args.description,

      // Justification
      justification: args.justification,
      physiologicalTarget: derivePhysiologicalTarget(args.sessionType),

      // Flexibility
      isMoveable: true,

      // Status
      status: "scheduled",
      modificationNotes: "Added by coach",
    });

    return { success: true, sessionId };
  },
});
```

**Helper to add** (below existing helpers in the file):

```ts
/** Derive physiological target from session type */
function derivePhysiologicalTarget(sessionType: string): string {
  const map: Record<string, string> = {
    easy: "aerobic_base",
    recovery: "recovery",
    tempo: "lactate_threshold",
    intervals: "vo2max",
    long_run: "aerobic_base",
    hills: "economy",
    race: "race_specific",
  };
  return map[sessionType] ?? "aerobic_base";
}
```

**Key design decisions:**
- `isRestDay` is always `false` — you never "create" a rest day via the coach, rest days are implicit gaps
- `isMoveable` defaults to `true` — coach-added sessions should be flexible
- `physiologicalTarget` is derived from `sessionType` using a helper (this is a required field on the schema)
- `weekNumber` is computed relative to the plan's `startDate`
- `modificationNotes` is set to `"Added by coach"` for audit trail
- Returns the new `sessionId` on success (useful for follow-up actions)
- The conflict check only fires when the new session is `isKeySession: true` — adding an easy run next to a key session is fine

---

### 3. Planned Session Schema Fields Reference

The `plannedSessions` table (from `packages/backend/convex/table/plannedSessions.ts`) requires these fields. The mutation must populate all non-optional fields:

| Field | Type | Required | Source |
|-------|------|----------|--------|
| `planId` | `v.id("trainingPlans")` | YES | Queried from active plan |
| `runnerId` | `v.id("runners")` | YES | From `getAuthenticatedRunner` |
| `weekNumber` | `v.number()` | YES | Computed from plan start date |
| `dayOfWeek` | `v.string()` | YES | Derived from `scheduledDate` |
| `dayOfWeekShort` | `v.string()` | YES | Derived from `scheduledDate` |
| `scheduledDate` | `v.number()` | YES | From tool args (converted to ms) |
| `sessionType` | `v.string()` | YES | From tool args |
| `sessionTypeDisplay` | `v.string()` | YES | From tool args |
| `sessionSubtype` | `v.optional(v.string())` | no | From tool args |
| `isKeySession` | `v.boolean()` | YES | From tool args |
| `isRestDay` | `v.boolean()` | YES | Always `false` |
| `targetDurationSeconds` | `v.optional(v.number())` | no | From tool args |
| `targetDurationDisplay` | `v.string()` | YES | From tool args |
| `effortLevel` | `v.optional(v.number())` | no | From tool args |
| `effortDisplay` | `v.string()` | YES | From tool args |
| `targetPaceMin` | `v.optional(v.string())` | no | From tool args |
| `targetPaceMax` | `v.optional(v.string())` | no | From tool args |
| `targetPaceDisplay` | `v.optional(v.string())` | no | From tool args |
| `description` | `v.string()` | YES | From tool args |
| `justification` | `v.string()` | YES | From tool args |
| `physiologicalTarget` | `v.string()` | YES | Derived from sessionType |
| `isMoveable` | `v.boolean()` | YES | Default `true` |
| `status` | `sessionStatus` | YES | Set to `"scheduled"` |

---

### 4. Type Definition — `CreateSessionProposal` in `types.ts`

**File:** `apps/native/src/components/app/coach/actions/types.ts`

Add the new proposal interface:

```ts
export interface CreateSessionProposal {
  type: "create";
  scheduledDate: string;
  dayOfWeek: string;
  sessionType: string;
  sessionTypeDisplay: string;
  sessionSubtype?: string;
  targetDurationSeconds: number;
  targetDurationDisplay: string;
  effortLevel: number;
  effortDisplay: string;
  targetPaceMin?: string;
  targetPaceMax?: string;
  targetPaceDisplay?: string;
  description: string;
  isKeySession: boolean;
  justification: string;
}
```

Update the `ActionProposal` union:

```ts
export type ActionProposal =
  | RescheduleProposal
  | ModifyProposal
  | SwapProposal
  | SkipProposal
  | CreateSessionProposal;   // NEW
```

---

### 5. UI Component — `CreateSessionCard.tsx`

**File:** `apps/native/src/components/app/coach/actions/CreateSessionCard.tsx`

Follows the exact same pattern as `SkipSessionCard.tsx` / `RescheduleSessionCard.tsx`:
- Uses `ActionCardWrapper` for phase-based chrome
- Uses `ActionButtons` for accept/reject/retry
- Uses `useActionCardState` hook for state machine
- Imports from `@/lib/design-tokens` for `COLORS`, `LIGHT_THEME`, `SESSION_TYPE_COLORS`, `getSessionCategory`

```tsx
/**
 * CreateSessionCard
 *
 * Renders a proposal to add a new session to the plan.
 * Shows session type, date, duration, effort, pace (if set), and justification.
 */

import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME, SESSION_TYPE_COLORS } from "@/lib/design-tokens";
import { getSessionCategory } from "@/lib/design-tokens";
import { Plus } from "lucide-react-native";
import { ActionCardWrapper } from "./ActionCardWrapper";
import { ActionButtons } from "./ActionButtons";
import { useActionCardState } from "./useActionCardState";
import type { CreateSessionProposal, ActionCardProps } from "./types";

interface CreateSessionCardProps extends Omit<ActionCardProps, "phase" | "onAccept" | "onReject"> {
  proposal: CreateSessionProposal;
  executeMutation: () => Promise<{ success: boolean; error?: string }>;
  onAccepted: () => void;
  onRejected: () => void;
}

export function CreateSessionCard({
  toolCallId,
  proposal,
  executeMutation,
  onAccepted,
  onRejected,
}: CreateSessionCardProps) {
  const { phase, errorMessage, accept, reject, retry } = useActionCardState();

  const sessionColor =
    SESSION_TYPE_COLORS[getSessionCategory(proposal.sessionType)] ?? COLORS.ora;

  const summary = `${proposal.sessionTypeDisplay} added on ${proposal.dayOfWeek}, ${proposal.scheduledDate}`;

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

  return (
    <ActionCardWrapper
      phase={phase}
      title="New Session"
      summary={summary}
      errorMessage={errorMessage}
    >
      <View style={{ padding: 14, gap: 14 }}>
        {/* Session type chip + date */}
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
            {proposal.sessionTypeDisplay}
          </Text>
          <Text style={{ color: LIGHT_THEME.wMute, fontSize: 13 }}>
            {proposal.dayOfWeek}, {proposal.scheduledDate}
          </Text>
        </View>

        {/* Stats row: duration, effort, pace */}
        <View style={{ flexDirection: "row", gap: 16 }}>
          <View style={{ gap: 2 }}>
            <Text style={{ color: LIGHT_THEME.wMute, fontSize: 11, textTransform: "uppercase" }}>
              Duration
            </Text>
            <Text style={{ color: LIGHT_THEME.wText, fontSize: 15, fontWeight: "600" }}>
              {proposal.targetDurationDisplay}
            </Text>
          </View>

          <View style={{ gap: 2 }}>
            <Text style={{ color: LIGHT_THEME.wMute, fontSize: 11, textTransform: "uppercase" }}>
              Effort
            </Text>
            <Text style={{ color: LIGHT_THEME.wText, fontSize: 15, fontWeight: "600" }}>
              {proposal.effortDisplay}
            </Text>
          </View>

          {proposal.targetPaceDisplay && (
            <View style={{ gap: 2 }}>
              <Text style={{ color: LIGHT_THEME.wMute, fontSize: 11, textTransform: "uppercase" }}>
                Pace
              </Text>
              <Text style={{ color: LIGHT_THEME.wText, fontSize: 15, fontWeight: "600" }}>
                {proposal.targetPaceDisplay}
              </Text>
            </View>
          )}
        </View>

        {/* Description */}
        {proposal.description && (
          <Text style={{ color: LIGHT_THEME.wSub, fontSize: 13, lineHeight: 18 }}>
            {proposal.description}
          </Text>
        )}

        {/* Justification */}
        <View
          style={{
            backgroundColor: "rgba(255,149,0,0.06)",
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: LIGHT_THEME.wSub, fontSize: 13, lineHeight: 18 }}>
            {proposal.justification}
          </Text>
        </View>
      </View>

      <ActionButtons
        phase={phase}
        onAccept={handleAccept}
        onReject={handleReject}
        onRetry={handleRetry}
        acceptLabel="Add Session"
      />
    </ActionCardWrapper>
  );
}
```

**Key UI decisions:**
- Title is `"New Session"` (distinct from "Schedule Change", "Skip Session", etc.)
- Accept button label is `"Add Session"` (like SkipSessionCard uses `"Skip Session"`)
- Stats row shows Duration, Effort, and conditionally Pace — compact horizontal layout
- Description shows the session details, justification shows the coaching rationale in the orange-tinted box (matching existing card patterns)
- The `Plus` icon import is available if we want to override `ActionCardWrapper`'s default icon in future, but for now the wrapper handles icons via phase

---

### 6. Barrel Export Update — `actions/index.ts`

**File:** `apps/native/src/components/app/coach/actions/index.ts`

Add:

```ts
export { CreateSessionCard } from "./CreateSessionCard";
```

Add to type exports:

```ts
export type {
  // ... existing exports ...
  CreateSessionProposal,
} from "./types";
```

---

### 7. CoachToolRenderer Update

**File:** `apps/native/src/components/app/coach/CoachToolRenderer.tsx`

Add import:

```ts
import {
  RescheduleSessionCard,
  ModifySessionCard,
  SwapSessionsCard,
  SkipSessionCard,
  CreateSessionCard,         // NEW
} from "./actions";
import type {
  RescheduleProposal,
  ModifyProposal,
  SwapProposal,
  SkipProposal,
  CreateSessionProposal,     // NEW
} from "./actions";
```

Add new case in the switch statement (before `default`):

```tsx
case "proposeCreateSession":
  return (
    <CreateSessionCard
      toolCallId={toolCallId}
      proposal={args as CreateSessionProposal}
      executeMutation={() => executeMutation(toolName, args)}
      onAccepted={() => onAccepted(toolName, args)}
      onRejected={() => onRejected(toolName, args)}
    />
  );
```

---

### 8. CoachChatView Mutation Wiring

**File:** `apps/native/src/components/app/coach/CoachChatView.tsx`

Add mutation hook (alongside existing ones at ~line 81-84):

```ts
const createPlannedSession = useMutation(api.training.actionMutations.createPlannedSession);
```

Add import for the type:

```ts
import type { RescheduleProposal, SwapProposal, SkipProposal, CreateSessionProposal } from "./actions";
```

Add case in `handleExecuteMutation` switch (alongside existing cases):

```ts
case "proposeCreateSession": {
  const p = args as CreateSessionProposal;
  return await createPlannedSession({
    scheduledDate: new Date(p.scheduledDate).getTime(),
    sessionType: p.sessionType,
    sessionTypeDisplay: p.sessionTypeDisplay,
    sessionSubtype: p.sessionSubtype,
    targetDurationSeconds: p.targetDurationSeconds,
    targetDurationDisplay: p.targetDurationDisplay,
    effortLevel: p.effortLevel,
    effortDisplay: p.effortDisplay,
    targetPaceMin: p.targetPaceMin,
    targetPaceMax: p.targetPaceMax,
    targetPaceDisplay: p.targetPaceDisplay,
    description: p.description,
    isKeySession: p.isKeySession,
    justification: p.justification,
  });
}
```

---

### 9. Coach OS Prompt Update

**File:** `packages/backend/convex/ai/prompts/coach_os.ts`

In the `ACTION_TOOL_INSTRUCTIONS` constant, add the new tool to the list (after `proposeSkipSession`):

```
- **proposeCreateSession**: Add a new session to the plan. Provide the date, session type, duration, effort, and a justification. Check that adding a key session won't conflict with an existing key session on the same day.
```

Add to the Rules section:

```
9. **Don't create duplicate sessions** — check existing sessions on the target date before proposing a new one
10. **Fill gaps thoughtfully** — when adding a session, consider the surrounding days' load and recovery needs
```

---

## Implementation Order

1. **Backend first:** Add `proposeCreateSession` tool definition in `actions.ts`
2. **Backend:** Add `createPlannedSession` mutation + `derivePhysiologicalTarget` helper in `actionMutations.ts`
3. **Frontend types:** Add `CreateSessionProposal` to `types.ts`
4. **Frontend card:** Create `CreateSessionCard.tsx`
5. **Frontend barrel:** Update `actions/index.ts`
6. **Frontend routing:** Update `CoachToolRenderer.tsx`
7. **Frontend wiring:** Update `CoachChatView.tsx` with mutation hook + dispatch case
8. **Prompt:** Update `coach_os.ts` with new tool instructions

Steps 1-2 can be done in parallel with steps 3-6. Step 7 depends on step 2 (needs the mutation to exist for Convex codegen). Step 8 is independent.

---

## Testing Checklist

- [ ] **Tool appears in LLM tool list:** Verify `proposeCreateSession` is registered and the LLM can call it
- [ ] **Card renders correctly:** Ask coach "add an easy 30-minute jog on Wednesday" and verify the card shows type, date, duration, effort, justification
- [ ] **Approve flow:** Accept the card, verify a new `plannedSessions` document is created with correct `planId`, `runnerId`, `status: "scheduled"`, and all fields populated
- [ ] **Reject flow:** Reject the card, verify no document is created, coach receives rejection feedback
- [ ] **RBAC enforcement:** Verify mutation fails gracefully if no authenticated user (returns UNAUTHORIZED error)
- [ ] **No active plan:** Verify mutation returns `{ success: false, error: "No active training plan found" }` when there is no active plan
- [ ] **Key session conflict:** Ask coach to add a tempo run on a day that already has an interval session — verify the mutation returns the conflict error
- [ ] **Non-key session no conflict:** Add an easy run on a day with an existing key session — verify it succeeds (no conflict for non-key sessions)
- [ ] **Week number calculation:** Verify the `weekNumber` is correctly computed relative to the plan's `startDate`
- [ ] **Retry after error:** Simulate a failure, verify the error state renders, tap Retry, verify it recovers
- [ ] **Haptic feedback:** Verify haptic fires when card first appears
- [ ] **Collapsed states:** After accept/reject, card collapses to summary line (handled by `ActionCardWrapper`)

---

## Technical Notes

### Why no `sessionId` in the tool args
Unlike all other action tools (reschedule, modify, swap, skip), this tool does NOT take a `sessionId` — it creates a new record. This is the fundamental difference.

### Why `isRestDay` is always false
The `plannedSessions` schema has `isRestDay: v.boolean()`. Rest days in the plan are explicit records with `isRestDay: true`. But when a user asks the coach to "add a session," they are by definition adding an active session, not a rest day. The coach would never propose creating a rest day — rest days are the absence of a session.

### Why `physiologicalTarget` is derived, not LLM-supplied
The `physiologicalTarget` field is a required schema field that maps to internal enum values (`"aerobic_base"`, `"lactate_threshold"`, `"vo2max"`, `"economy"`, `"recovery"`). Rather than asking the LLM to produce this internal value (risking invalid strings), we derive it deterministically from `sessionType`. This is safe because the mapping is 1:1 and covers all session types.

### Conflict check scope
The conflict check only prevents adding a key session when another key session already exists on the same day. Adding a non-key session (easy, recovery) alongside a key session is perfectly valid and common in training plans. The check uses the `by_date` index on `plannedSessions` for efficient range queries.
