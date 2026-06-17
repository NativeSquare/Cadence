# Plan — Coach tab MVP (dashboard + journal read tools)

> Derived from `docs/wedge-mvp-spec.md` §5–§6, reconciled against the post-reset
> state (ADR-0003, 2026-06-17). Scope agreed in grill session 2026-06-17.

## Context: what actually exists vs what the spec assumed

The spec's §5 Coach tab assumed building blocks the reset to zero deleted or never built:

| Spec assumed | Reality today |
|---|---|
| 3-source decision register (`journalEntry.decision` + `coachInterventions` + `weeklyReviews`) | Only `journalEntry.decision` (`"go" \| "ease"`) survives; the other two tables are **deleted/removed** |
| `insight` table + detector library | **Never built** |
| `outcome` labeling (✓/⚠ verdicts) | **Never built** |
| Portrait "régénérée périodiquement" | No cron/heartbeat exists anymore |
| Coach reads the journal (§6 tools) | `reading.ts` has **zero** journal tools |

So "we can now easily do the Coach tab" is true **only** for the slice whose data exists: Portrait-from-memories, a strict decisions list, chat, and giving the Coach journal read tools.

## Scope (agreed)

**In:** dashboard shell + Portrait + strict Decisions list + pushed chat + journal read tools for the chat Coach.
**Out (deferred):** Insights (detector library + `insight` table), Outcomes, longitudinal-signal Portrait synthesis, Analytics fold-in (stays its own tab).

---

## 1. Navigation / layout

- `(app)/(tabs)/coach.tsx` → becomes the **Coach dashboard** (a scrollable vertical read), replacing the current chat-only `CoachScreen`.
- The existing chat (`CoachChatView`, full-screen scroll + pinned input) **moves to a pushed Stack route**: `(app)/coach/chat.tsx`. The chat component itself is reused unchanged.
- Dashboard is a clean vertical surface — no inline/nested chat (avoids fighting two scroll contexts).

## 2. Dashboard sections (top → bottom)

1. **Portrait** — "Ce que j'ai appris sur toi"
   - Renders `coachMemories` (existing `coachMemories.listMine` query). No LLM synthesis, no storage at MVP.
   - Empty state (Coach voice): *"I'm still getting to know you. Keep logging your sessions and I'll start to understand how you run."*
   - Note: overlaps the existing **Context sheet** (`CoachContextSheet.tsx`). Decide during wiring whether the sheet folds into this section or stays as a "manage/see all" expansion.

2. **Decisions** — "Tes décisions"
   - Strict list of `journalEntry` rows where `decision` is set (`go`/`ease`). Accept that this is **near-empty** for most users (a fork only appears on `concern: "act"` + a conflicting hard session within 3 days).
   - Row content: date (from `dayKey`) · workout name + type · **Kept / Eased** badge. No reason, no outcome (neither is stored).
   - Tap → **Session detail page** (`workouts/[id]`), which already renders audio/transcript/`derived`.
   - Empty state: *"When you make a call on a session — keep it or ease it — it'll show up here."*

3. **Chat entry** — "Pose-moi une question"
   - Card at the bottom; pushes `(app)/coach/chat.tsx`. Opens **fresh** (no context seeding at MVP).

## 3. Backend work

### New query: `journal.listDecisions`
- Args: range or recent-N over `journalEntry` by `userId`, filtered to rows where `decision` is set.
- **Enriches server-side**: joins Agoge (`components.agoge.*`, same pattern as `findConflictingHardSession` in `journal.ts`) to return display-ready rows: `{ dayKey, decision, workoutName, workoutType }`. Client stays dumb.

### New chat Coach read tools (in `coach/tools/reading.ts`, `needsApproval: false`)
- `listJournalEntries({ startDate?, endDate?, decisionOnly? })` — thin wrapper returning entries with `derived`, `decision`, `dayKey`, `workoutId`, transcript. The `decisionOnly` filter replaces a separate `listDecisions` tool.
- `getJournalEntry({ entryId })` — full single entry incl. transcript.
- **Skip** `listInsights` (no insight table) per deferral.
- These unblock chat restitution ("le 12 mai, même contexte…"). Coach stays read-only.

## 4. i18n
- Native en + fr keys for the three section headers, badges (Kept/Eased), and both empty states (`users.locale` is source of truth).

## 5. Out of scope (explicitly deferred)
- `insight` table, detector library, 👍/👎 `helpful` feedback.
- `outcome` verdicts on decision rows.
- Portrait LLM synthesis + staleness/regeneration.
- Contextual seeding of the pushed chat.
- Analytics fold-in.

## Open follow-ups
- Context sheet vs Portrait overlap — resolve during wiring.
- When Outcomes land, the Decisions rows gain ✓/⚠ and the section earns its name.
