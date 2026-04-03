# Story 12.1 — Audit and Extend Existing Action Tools

## Story

**As a** runner,
**I want** the existing session action tools (reschedule, modify, swap, skip) to work reliably within the expanded coach toolset,
**So that** the full set of plan modification capabilities is consistent and complete.

---

## Status: READY FOR IMPLEMENTATION

## Audit Findings

### File Inventory

| Layer | File | Purpose |
|-------|------|---------|
| Tool schemas (LLM) | `packages/backend/convex/ai/tools/actions.ts` | 4 Zod-based `tool()` definitions — proposal-only, no `execute` |
| Tool index | `packages/backend/convex/ai/tools/index.ts` | Exports `actionTools` dict, combined with `uiTools` for `streamText` |
| Mutations (RBAC) | `packages/backend/convex/training/actionMutations.ts` | 4 Convex mutations: `rescheduleSession`, `modifySession`, `swapSessions`, `skipSession` |
| Coach prompt | `packages/backend/convex/ai/prompts/coach_os.ts` | `ACTION_TOOL_INSTRUCTIONS` block + `buildSessionContext()` |
| HTTP endpoint | `packages/backend/convex/ai/http_action.ts` | `streamChat` — merges `actionTools` into `allTools` for non-onboarding |
| Tool renderer | `apps/native/src/components/app/coach/CoachToolRenderer.tsx` | Switch-case router: tool name -> card component |
| Card types | `apps/native/src/components/app/coach/actions/types.ts` | TS interfaces for proposals + `ActionCardPhase` state machine |
| State hook | `apps/native/src/components/app/coach/actions/useActionCardState.ts` | `pending -> applying -> accepted/error/rejected/expired` |
| Shared buttons | `apps/native/src/components/app/coach/actions/ActionButtons.tsx` | Accept/Reject/Retry button row |
| Shared wrapper | `apps/native/src/components/app/coach/actions/ActionCardWrapper.tsx` | Phase-colored border + header + collapsed states |
| RescheduleCard | `apps/native/src/components/app/coach/actions/RescheduleSessionCard.tsx` | Current -> Proposed date visualization |
| ModifyCard | `apps/native/src/components/app/coach/actions/ModifySessionCard.tsx` | Diff view with strikethrough old / green new |
| SwapCard | `apps/native/src/components/app/coach/actions/SwapSessionsCard.tsx` | Side-by-side session chips with swap icon |
| SkipCard | `apps/native/src/components/app/coach/actions/SkipSessionCard.tsx` | Session info + reason + optional alternative |
| Chat view | `apps/native/src/components/app/coach/CoachChatView.tsx` | Wires mutations, accept/reject handlers, sends feedback to LLM |
| DB schema | `packages/backend/convex/table/plannedSessions.ts` | Full session fields incl. status, modificationNotes, skipReason |

---

### AC 1 — Audit Results: What Works Well

#### RBAC Chain: PASS
All 4 mutations in `actionMutations.ts` follow the correct pattern:
```
getAuthUserId(ctx) -> getAuthenticatedRunner(ctx) -> getOwnedSession(ctx, sessionId, runner._id)
```
- `getAuthenticatedRunner` (line 34): queries `runners.by_userId`, throws `UNAUTHORIZED` / `RUNNER_NOT_FOUND`
- `getOwnedSession` (line 53): `ctx.db.get(sessionId)`, checks `session.runnerId !== runnerId`, throws `NOT_FOUND`. Also blocks completed sessions (`INVALID_STATE`).

#### Staleness Checks: PASS (reschedule, swap) / N/A (modify, skip)
- `rescheduleSession` (line 89): `isSameDay(session.scheduledDate, args.expectedCurrentDate)` — returns error message if stale.
- `swapSessions` (line 195): same check on both sessions.
- `modifySession`: no staleness check — acceptable because the changes object is field-level, not date-dependent.
- `skipSession` (line 238): checks `session.status === "skipped"` to prevent double-skip.

#### Zod Schemas: PASS
All 4 tools have complete Zod schemas with `.describe()` on every field. The LLM receives rich context about what to provide.

#### UI Cards: PASS
All 4 cards render correctly with:
- Phase-based styling via `ActionCardWrapper`
- Accept/Reject/Retry buttons via `ActionButtons`
- Proper state management via `useActionCardState` hook
- Collapsed summary after accept/reject
- Error display with retry option

#### Rejection Flow: PASS
`CoachChatView.tsx` line 225-231: `handleActionRejected` sends `"I declined the change to {name}."` back to the LLM via `sendMessage()`. The coach prompt (line 145) instructs: "After rejection — ask the runner what they'd prefer instead."

#### Acceptance Flow: PASS
`CoachChatView.tsx` line 215-221: `handleActionAccepted` sends `"I confirmed the change to {name}."` back to the LLM.

---

### AC 1 — Audit Results: Issues Found

#### ISSUE 1 (Medium): `proposeModifySession` field-to-mutation mapping is lossy

**Location:** `CoachChatView.tsx` lines 172-181

The LLM produces a `changes` array with display-oriented string values:
```ts
// What the LLM emits (actions.ts Zod schema):
changes: [{ field: "targetDurationSeconds", fieldLabel: "Duration", oldValue: "50 min", newValue: "40 min" }]
```

The frontend mapping blindly passes the display string as the mutation value:
```ts
const changes: Record<string, any> = {};
for (const c of p.changes) {
  changes[c.field] = c.newValue; // "40 min" goes into targetDurationSeconds (expects number!)
}
```

But the mutation (`modifySession`, line 128) expects typed values:
```ts
changes: v.object({
  targetDurationSeconds: v.optional(v.number()),  // expects 2400, not "40 min"
  effortLevel: v.optional(v.number()),             // expects 6, not "6/10"
  ...
})
```

**Risk:** The Convex validator will reject string values for numeric fields. This means `proposeModifySession` is effectively broken for numeric fields (duration, effort, distance, heart rate zone). It would only work for string fields like `description`, `targetPaceDisplay`, `sessionType`.

**Fix:** The LLM tool schema must include both a display value (for the card) and a typed value (for the mutation). OR the frontend must parse display strings back to typed values. The cleanest approach: add `typedValue` to the changes schema.

#### ISSUE 2 (Medium): `proposeModifySession` schema lacks `actualChanges` for mutation

The current tool schema only has display-oriented `changes` with `oldValue`/`newValue` as strings. There is no mechanism to carry the actual typed values that the mutation needs.

**Location:** `packages/backend/convex/ai/tools/actions.ts` lines 40-58

**Fix:** Add a `typedNewValue` field to each change entry, or add a separate `mutationPayload` object to the schema.

#### ISSUE 3 (Low): Swap sessions — no status update

**Location:** `actionMutations.ts` lines 203-218

`rescheduleSession` sets `status: "rescheduled"`, `skipSession` sets `status: "skipped"`, `modifySession` sets `status: "modified"` — but `swapSessions` does NOT set a status on either session. Swapped sessions remain in their original status (likely `"scheduled"`), which means there's no audit trail that a swap happened (except `modificationNotes`).

**Fix:** Add `status: "rescheduled"` to both patches in `swapSessions`.

#### ISSUE 4 (Low): `handleActionAccepted` fires before mutation confirms

**Location:** `RescheduleSessionCard.tsx` line 43-44 (same pattern in all 4 cards)

```ts
const handleAccept = () => {
  accept(executeMutation).then(() => onAccepted());
};
```

`accept()` is async — it sets phase to `applying`, runs the mutation, then sets `accepted`. But `onAccepted` fires unconditionally after the promise resolves (including after error, since `accept` catches errors internally and sets `error` phase without rethrowing). This means `onAccepted` (which sends "I confirmed the change" to the LLM) fires even when the mutation failed.

**Fix:** `onAccepted` should only fire when `phase === "accepted"`. Either check phase after await, or have `accept()` return a boolean.

#### ISSUE 5 (Low): `handleActionRejected` does not extract sessionName for swap

**Location:** `CoachChatView.tsx` line 227

```ts
const name = (args as { sessionName?: string })?.sessionName ?? "session";
```

For `proposeSwapSessions`, the args shape is `{ sessionA: { sessionName: ... }, sessionB: { sessionName: ... } }` — there's no top-level `sessionName`. So the rejection message will always say "I declined the change to session." instead of naming the sessions.

**Fix:** Special-case the swap tool name to extract both session names.

#### ISSUE 6 (Cosmetic): Tool descriptions could be more specific for LLM selection

The current `ACTION_TOOL_INSTRUCTIONS` in `coach_os.ts` (lines 131-147) are adequate but could be improved for disambiguation with new tools from stories 12.2-12.4. For example, the LLM might confuse "modify session" (change details) with "reschedule session" (change date) when the user says "change my tempo run."

---

## AC 2 — Extensions Required

### Extension 1: Fix `proposeModifySession` Schema + Frontend Mapping

Add a `typedNewValue` to each change entry so the LLM provides both the display string and the actual typed value.

### Extension 2: Add status to `swapSessions` mutation

### Extension 3: Fix `onAccepted` callback to only fire on success

### Extension 4: Fix swap rejection message to include session names

---

## AC 3 — Tool Naming & Description Consistency

Update `ACTION_TOOL_INSTRUCTIONS` in `coach_os.ts` and tool `.description` strings in `actions.ts` to be precise enough that the LLM selects the right tool when stories 12.2-12.4 add new tools (e.g., `proposeAddSession`, `proposeDeleteSession`, `proposeAdjustPlanWeek`).

---

## AC 4 — Rejection Handling

Current implementation already sends rejection back to the LLM. The coach prompt instruction "After rejection — ask the runner what they'd prefer instead" is present. No code changes needed for basic rejection flow, but we should verify the rejection message carries enough context.

---

## Tasks

### Task 1: Fix `proposeModifySession` Schema — Add Typed Values

**Files:**
- `packages/backend/convex/ai/tools/actions.ts` (lines 40-58)
- `apps/native/src/components/app/coach/actions/types.ts` (lines 39-50)
- `apps/native/src/components/app/coach/CoachChatView.tsx` (lines 172-181)

**Subtask 1.1: Update Zod schema in `actions.ts`**

Change the `changes` array item from:
```ts
z.object({
  field: z.string().describe("The field being changed, e.g. 'targetDurationSeconds'"),
  fieldLabel: z.string().describe("Human-readable label, e.g. 'Duration'"),
  oldValue: z.string().describe("Current value for display, e.g. '50 min'"),
  newValue: z.string().describe("Proposed value for display, e.g. '40 min'"),
})
```
to:
```ts
z.object({
  field: z.string().describe("The database field being changed, e.g. 'targetDurationSeconds'"),
  fieldLabel: z.string().describe("Human-readable label for display, e.g. 'Duration'"),
  oldValue: z.string().describe("Current value formatted for display, e.g. '50 min'"),
  newValue: z.string().describe("Proposed value formatted for display, e.g. '40 min'"),
  typedNewValue: z.union([z.string(), z.number()]).describe(
    "The actual typed value for the database field. Use number for numeric fields (e.g. 2400 for targetDurationSeconds, 6 for effortLevel, 5000 for targetDistanceMeters), string for text fields (e.g. 'tempo' for sessionType)."
  ),
})
```

**Subtask 1.2: Update TS type in `types.ts`**

Add `typedNewValue: string | number` to the `ModifyProposal.changes` array item type.

**Subtask 1.3: Update frontend mapping in `CoachChatView.tsx`**

Change the modify case in `handleExecuteMutation`:
```ts
case "proposeModifySession": {
  const p = args as { sessionId: string; changes: Array<{ field: string; typedNewValue: string | number }>; reason: string };
  const changes: Record<string, any> = {};
  for (const c of p.changes) {
    changes[c.field] = c.typedNewValue;
  }
  return await modifySession({
    sessionId: p.sessionId as any,
    changes,
    reason: p.reason,
  });
}
```

---

### Task 2: Add Status to `swapSessions` Mutation

**File:** `packages/backend/convex/training/actionMutations.ts` (lines 203-218)

Add `status: "rescheduled" as const` to both `ctx.db.patch` calls in `swapSessions`:

```ts
await ctx.db.patch(args.sessionAId, {
  scheduledDate: sessionB.scheduledDate,
  dayOfWeek: sessionB.dayOfWeek,
  dayOfWeekShort: sessionB.dayOfWeekShort,
  status: "rescheduled" as const,
  modificationNotes: `Swapped with ${sessionB.sessionTypeDisplay} by coach: ${args.reason}`,
});

await ctx.db.patch(args.sessionBId, {
  scheduledDate: sessionA.scheduledDate,
  dayOfWeek: sessionA.dayOfWeek,
  dayOfWeekShort: sessionA.dayOfWeekShort,
  status: "rescheduled" as const,
  modificationNotes: `Swapped with ${sessionA.sessionTypeDisplay} by coach: ${args.reason}`,
});
```

---

### Task 3: Fix `onAccepted` Firing on Error

**Files:** All 4 card components in `apps/native/src/components/app/coach/actions/`

**Subtask 3.1: Update `useActionCardState` to return success from `accept()`**

**File:** `apps/native/src/components/app/coach/actions/useActionCardState.ts`

Change `accept` to return `boolean`:
```ts
const accept = useCallback(
  async (executeMutation: () => Promise<{ success: boolean; error?: string }>): Promise<boolean> => {
    if (phase !== "pending") return false;
    setPhase("applying");
    setErrorMessage(undefined);

    try {
      const result = await executeMutation();
      if (result.success) {
        setPhase("accepted");
        return true;
      } else {
        setPhase("error");
        setErrorMessage(result.error ?? "Something went wrong. Try again.");
        return false;
      }
    } catch (err) {
      setPhase("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Try again.");
      return false;
    }
  },
  [phase],
);
```

Same for `retry` — return `boolean`.

**Subtask 3.2: Update all 4 cards to conditionally call `onAccepted`**

In each card (RescheduleSessionCard, ModifySessionCard, SwapSessionsCard, SkipSessionCard), change:
```ts
const handleAccept = () => {
  accept(executeMutation).then(() => onAccepted());
};
```
to:
```ts
const handleAccept = () => {
  accept(executeMutation).then((success) => {
    if (success) onAccepted();
  });
};
```
Same for `handleRetry`.

---

### Task 4: Fix Swap Rejection Message

**File:** `apps/native/src/components/app/coach/CoachChatView.tsx` (lines 225-231)

Update `handleActionRejected`:
```ts
const handleActionRejected = useCallback(
  (toolName: string, args: unknown) => {
    let name: string;
    if (toolName === "proposeSwapSessions") {
      const p = args as SwapProposal;
      name = `${p.sessionA.sessionName} / ${p.sessionB.sessionName} swap`;
    } else {
      name = (args as { sessionName?: string })?.sessionName ?? "session";
    }
    persistUserMessage(`[Declined: ${toolName} for ${name}]`);
    sendMessage(`I declined the change to ${name}.`);
  },
  [sendMessage, persistUserMessage],
);
```

Apply the same fix to `handleActionAccepted`:
```ts
const handleActionAccepted = useCallback(
  (toolName: string, args: unknown) => {
    let name: string;
    if (toolName === "proposeSwapSessions") {
      const p = args as SwapProposal;
      name = `${p.sessionA.sessionName} / ${p.sessionB.sessionName} swap`;
    } else {
      name = (args as { sessionName?: string })?.sessionName ?? "session";
    }
    persistUserMessage(`[Confirmed: ${toolName} for ${name}]`);
    sendMessage(`I confirmed the change to ${name}.`);
  },
  [sendMessage, persistUserMessage],
);
```

---

### Task 5: Update Tool Descriptions for LLM Disambiguation

**Subtask 5.1: Update tool descriptions in `actions.ts`**

**File:** `packages/backend/convex/ai/tools/actions.ts`

Update descriptions to be more precise and disambiguated:

```ts
// proposeRescheduleSession (line 17-18)
description:
  "Propose moving a session to a different DATE only (no changes to workout content). Use when the runner asks to move a session to another day, has a scheduling conflict, or when you detect a conflict in the plan. NOT for changing workout details — use proposeModifySession for that.",

// proposeModifySession (line 41-42)
description:
  "Propose changing a session's CONTENT — type, duration, effort, pace, structure, or description. Use when the runner asks to adjust a workout's difficulty, length, or type. NOT for changing the date — use proposeRescheduleSession for that.",

// proposeSwapSessions (line 64-65)
description:
  "Propose swapping two sessions' dates so each takes the other's slot. Use when reordering within a week makes more sense than moving one session. Requires exactly two session IDs. NOT for changing content — this only swaps dates.",

// proposeSkipSession (line 92-93)
description:
  "Propose removing a session from the plan by marking it as skipped. Use when the runner needs extra rest, has a conflict they can't reschedule around, or when skipping is the safest choice for injury prevention. Include an alternative suggestion when possible.",
```

**Subtask 5.2: Update `ACTION_TOOL_INSTRUCTIONS` in `coach_os.ts`**

**File:** `packages/backend/convex/ai/prompts/coach_os.ts` (lines 131-147)

Replace the `ACTION_TOOL_INSTRUCTIONS` block with a more detailed version that helps the LLM disambiguate:

```ts
const ACTION_TOOL_INSTRUCTIONS = `## Action Tools (Schedule & Session Changes)
When the runner asks to change their schedule or modify sessions, use these proposal tools. Each one renders a confirmation card — the runner must accept before changes are applied.

### Tool Selection Guide
| Runner says... | Use this tool |
|----------------|---------------|
| "Move my tempo to Friday" | proposeRescheduleSession |
| "Make tomorrow's run shorter" | proposeModifySession |
| "Switch Thursday and Friday" | proposeSwapSessions |
| "Skip tomorrow's session" | proposeSkipSession |
| "Change my tempo to an easy run" | proposeModifySession (change sessionType) |
| "I can't run Wednesday, can I do it Thursday?" | proposeRescheduleSession |

### Tool Details
- **proposeRescheduleSession**: Move a session to a different DATE. Provide session ID, current date, proposed date, and reason. Does NOT change workout content.
- **proposeModifySession**: Change session CONTENT — type, duration, effort, pace targets, structure. Provide the session ID and a list of changes with both display values (for the card) and typed values (for the database). Does NOT change the date.
- **proposeSwapSessions**: Swap two sessions' dates. Each session moves to the other's date. Provide both session IDs with their current details and reason.
- **proposeSkipSession**: Mark a session as skipped. Provide session ID, details, reason, and ideally an alternative suggestion.

### Rules for Action Tools
1. **One proposal at a time** — propose a single action, wait for acceptance or rejection before proposing the next.
2. **Always explain why** — include a clear reason so the runner understands the rationale.
3. **Use real session IDs** — reference sessions from the Upcoming Sessions context below. NEVER invent session IDs.
4. **Respect isMoveable** — prefer moving sessions flagged as moveable; warn if moving a non-moveable session.
5. **After rejection** — acknowledge the rejection conversationally. Ask what the runner would prefer instead. Do NOT immediately re-propose the same change.
6. **After acceptance** — acknowledge the change naturally and briefly. Mention any downstream impact on the week.
7. **Don't propose changes to completed or skipped sessions** — they are immutable.
8. **Consider downstream impact** — if moving a hard session next to another hard session, note the recovery concern.
9. **For proposeModifySession** — always provide the typedNewValue: use numbers for numeric fields (seconds for duration, meters for distance, 1-10 for effort) and strings for text fields.`;
```

---

### Task 6: Verify Rejection Handling (AC 4)

This is a verification-only task — no code changes expected unless testing reveals issues.

**Subtask 6.1:** Verify that when a user taps "Not now" on any card:
1. The card transitions to `rejected` phase (collapsed, muted)
2. `handleActionRejected` sends the decline message to the LLM
3. The LLM receives the message and responds conversationally

**Subtask 6.2:** Verify the coach prompt instruction at line 145 of `coach_os.ts`:
```
5. **After rejection** — ask the runner what they'd prefer instead
```
This is already present. The updated version in Task 5 adds "Do NOT immediately re-propose the same change."

---

## Dev Notes

### Architecture Summary

The action tools follow a **proposal-only** pattern:
1. LLM calls tool -> tool has NO `execute` function -> AI SDK treats it as a "proposal" and returns args to client
2. Client renders a confirmation card from the args
3. User taps Accept -> frontend calls the corresponding Convex mutation with RBAC
4. User taps Reject -> frontend sends rejection message to LLM -> LLM responds conversationally

This is fundamentally different from Epic 11's read tools which use `createReadTools(ctx, userId)` with `execute` closures that run server-side. Action tools are UI-gated proposals; read tools are server-executed queries.

### Key Patterns to Preserve

- **Tool naming convention**: `propose{Action}{Entity}` for proposals (action tools), no prefix for read tools
- **Zod `.describe()` on every field**: Critical for LLM to understand what to provide
- **`ActionCardPhase` state machine**: `streaming -> pending -> applying -> accepted | rejected | error | expired`
- **`useActionCardState` hook**: Manages phase transitions with proper guards (e.g., can only accept from pending)
- **`ActionCardWrapper`**: Provides consistent styling across all action cards
- **Rejection feedback loop**: Send structured message back to LLM so it can respond

### Fields Available for `proposeModifySession`

From `plannedSessions.ts` schema, these are the mutable fields the modify mutation supports:
- `sessionType` (string) — e.g., "tempo", "easy", "intervals"
- `sessionTypeDisplay` (string) — e.g., "Tempo", "Easy Run"
- `targetDurationSeconds` (number) — seconds
- `targetDurationDisplay` (string) — e.g., "50 min"
- `targetDistanceMeters` (number) — meters
- `effortLevel` (number) — 0-10
- `effortDisplay` (string) — e.g., "7/10"
- `targetPaceMin` (string) — e.g., "4:55/km"
- `targetPaceMax` (string) — e.g., "5:05/km"
- `targetPaceDisplay` (string) — e.g., "4:55-5:05/km"
- `targetHeartRateZone` (number) — 1-5
- `description` (string)
- `structureDisplay` (string)

### Testing Checklist

- [ ] proposeRescheduleSession: verify date change renders correctly, mutation updates scheduledDate + dayOfWeek + status
- [ ] proposeModifySession: verify numeric fields (duration, effort) pass typed values to mutation correctly
- [ ] proposeSwapSessions: verify both sessions get status "rescheduled" after swap
- [ ] proposeSkipSession: verify session gets status "skipped" + skipReason
- [ ] Reject any card -> verify LLM receives decline message and responds conversationally
- [ ] Accept a card when mutation fails -> verify error phase shows, "I confirmed" message does NOT fire
- [ ] Reject swap -> verify message includes both session names

### Risks / Out of Scope

- Read tools from Epic 11 are not yet implemented in code — this story does NOT depend on them
- Stories 12.2-12.4 will add new tools; the description updates in Task 5 are forward-looking to prevent LLM confusion
- No changes to the `plannedSessions` schema or `trainingPlans` schema
- No changes to the streaming endpoint (`http_action.ts`) — it already merges action tools correctly
