# Onboarding Refactor

**Status:** Planned, approved, implementation in progress.
**Owner:** Maxime.
**Last updated:** 2026-04-22.

## Why this exists

The wired onboarding today is a 13-screen **mock harness** (`OnboardingFlowMock`) that persists nothing except `hasCompletedOnboarding = true`. Two other systems sit adjacent and unreached:

- A **generative coach** (`packages/backend/convex/ai/prompts/onboarding_coach.ts` + `AIConversationView` + `useAIChat`) was designed for a 7-phase LLM-driven conversation — never wired to the UI.
- A **plan-generation pipeline** (`packages/backend/convex/plan/generate.ts`) — complete but never called from onboarding.
- **Agoge** already has the right schemas for athlete, events, zones — nothing writes to them during onboarding.

This refactor collapses the duplication into one deterministic seven-act flow that writes to Agoge + Seshat as it goes and ends with a real plan preview (Act 7) gated by a paywall. The Act 7 preview renders in the **exact same component as the Home page session card** — the user literally sees the product they're paying for.

## Core principles

1. **Onboarding is the natural home for Plan Generation.** The whole flow converges on generating a real plan, not just collecting preferences.
2. **Deterministic as much as possible.** Structured inputs across Acts 1–5 and most of 6. Exactly one optional freeform/LLM tail (end of Act 6).
3. **LLM-owned judgment, not code-owned gates.** Agoge writes happen via thin wrapper mutations, not via LLM tool calls. The plan-gen prompt consumes the data — that's where LLM judgment belongs.
4. **Minimum-viable infra.** No phase-tracking state machines, no resume-from-any-step engines. If a user drops, they restart; Agoge data already written persists and Act 3 skips filled fields naturally.
5. **Reuse the app's visual vocabulary.** Black header band + light sheet + dark cards + lime coach quote. The Act 7 preview is literally the Home page session card — not a preview-of-the-product.

## The seven-act arc

| # | Act | Background | Purpose | Writes to |
|---|---|---|---|---|
| 1 | **Welcome** | Full black | Name, runner_type | Agoge athlete (name) |
| 2 | **Evidence** | Light sheet | Connect wearable OR self-report | Soma connection; confirmation UI |
| 3 | **Athlete profile** | Light sheet | Fill missing athlete fields | Agoge athlete (sex, DOB, weight, height) |
| 4 | **Goal** | Light sheet | Goal type + branches | Agoge event (if race) |
| 5 | **Reality** | Light sheet | Schedule + injury + life load | Seshat core memory |
| 6 | **Voice** | Light sheet | Coaching voice + one freeform | Seshat core memory |
| 7 | **Payoff** | Black → sheet → black | Analyze → preview → paywall | `plan.generate.generatePlan` action |

## Per-act detail

### Act 1 — Welcome (black)

- Streamed intro line ("Let's build your plan. First: what should I call you?").
- Name input (freeform text).
- Runner type select (beginner / returning / casual / serious).
- **On Continue:** create or update Agoge athlete via new Convex mutation `onboarding.ensureAthlete`.
- `runner_type` is NOT an Agoge field — cache in flow-local state (`useOnboardingFlowState`) that survives until Act 7.

### Act 2 — Evidence (light sheet)

Three sub-states:

**A. Connection picker** (entry):
- Three `ConnectionCard` instances (variant="light"): Garmin, Strava, HealthKit (iOS-only).
- Disabled COROS card with "Coming soon" badge.
- "Skip for now" escape.
- On connect: call existing Soma auth action (`soma.garmin.getAuthUrl`, etc.), complete OAuth, return.

**B. Data confirmation** (after connect):
- New backend query `onboarding.summarizeRecentActivity({ userId, days: 90 })` wrapping `soma.listActivities`/`listDaily`, returning `{ weeklyKm, sessionsPerWeek, typicalEasyPaceMps, longestRunKm, hrAvailable, activityCount }`.
- Streamed coach line with the numbers, e.g. "Last 90 days: ~32km/week, 4 runs/week, typical easy 4:45/km. Does this feel right?"
- `[Looks right] [Not really]` → confirm advances; disagree falls to Sub-state C.

**C. Self-report** (on skip OR disagree):
- Branching questions from current `question-data.ts` runner-profile section (volume, frequency, pace) conditioned on `runner_type`. **Keep the copy** — it's good. Port the strings before deleting `question-data.ts`.
- Answers cached in flow state only (consumed by plan-gen in Act 7 via prompt context).

**Zones:** auto-derivation is out of scope for MVP (see non-goals).

### Act 3 — Athlete profile (light sheet, conditional)

- Query current Agoge athlete via `components.agoge.public.getAthleteByUserId({ userId })`.
- Compute missing fields from `{ sex, dateOfBirth, weightKg, heightCm }`. Name comes from Act 1; skip.
- If **all four** present → skip the act silently.
- Else: render only the missing fields on one screen with a streamed intro ("Just a few basics — helps me calibrate intensity.").
- **On Continue:** Convex mutation `onboarding.updateAthleteProfile` fans to `components.agoge.public.updateAthlete({ athleteId, ...patch })`.

### Act 4 — Goal (light sheet)

- Goal type: race / faster / base-building / back-in-shape / general-fitness.
- Race branch: distance, date, target-time ("yes" / "help me" / "just finish").
- Non-race branches: keep existing `question-data.ts` branches, cached in flow state only.
- **On Continue** (race): Convex mutation `onboarding.submitGoal` maps fields → `components.agoge.public.createEvent({ athleteId, name, date, sport: "run", priority: "A", distanceMeters, goalTimeSeconds })`.
- Non-race goals write nothing to Agoge; flow to Seshat + plan-gen prompt.

### Act 5 — Reality (light sheet, 2 sub-screens)

**5a — Schedule:**
- Available days (2-3 / 4-5 / 6-7)
- Off-limits days (multi-select)
- Preferred time (morning / midday / evening / varies)

**5b — Body load:**
- Past injuries (multi-select, or "None")
- Current pain? (yes/no → area if yes)
- Sleep (solid / inconsistent / bad)
- Stress (low / moderate / high / survival)

Coach reaction (lime quote block) after each screen — copy ported from existing `scheduleSection.getReaction` and `injurySection.getReaction` in soon-to-be-deleted `question-data.ts`. These strings are keepers.

**On Continue** (from 5b): single Convex action `onboarding.submitReality` writes one Seshat `memory_write` call with `type: "core"` and the whole reality payload serialized. No separate records per field — one blob, LLM-queryable.

### Act 6 — Voice (light sheet)

- Coaching voice single-select (tough_love / encouraging / analytical / minimalist). Copy from existing `coachingStyleSection`.
- After selection, one freeform prompt: "Anything else you want me to know about you as a runner?" — optional, skippable.

**On Continue:** Convex action `onboarding.submitVoice` writes a Seshat core memory record containing voice selection AND the raw open-text answer (no LLM parsing; plan-gen prompt reads it directly).

**Do not reuse** `AIConversationView` / `useAIChat` for the open question. Heavy tooling for a single text box — simple freeform input + one action call is enough.

### Act 7 — Payoff (black → sheet → black)

Three sequential beats:

1. **Analyzing beat** (black): streamed line "Let me put this together…" → fire `plan.generate.generatePlan` action. Show `thinking-block.tsx` or similar idle state while action runs. Expect ~15-30s.
2. **Plan preview** (light sheet): once `generatePlan` returns, query first week's workouts via existing Agoge queries. Render each day using `TodayCard` — **literally the same component the Home tab uses**. Export pill disabled/greyed in preview. Horizontal swipe or vertical scroll through 7 days.
3. **Paywall** (black): full-screen, big lime CTA, "Unlock your full [N]-week plan". On success → navigate to Home tab. On dismiss → keep user in onboarding (don't leak access).

## UI system

### Layout decision: static layout (not gorhom bottom sheet)

Two stacked views:
- **Black header band** (fixed): step indicator + progress bar.
- **Light body** (scrollable, `LIGHT_THEME.w1` / `w2`): act content.

Act 1 and Act 7's analyze + paywall beats override to full black. All other acts render inside the static light body.

Rejected: real `@gorhom/bottom-sheet` modal. Swipe-to-dismiss would need blocking; adds animation/state complexity onboarding doesn't benefit from.

### Components to extract (currently inline or missing)

1. **`CoachQuoteBlock`** — inline `CoachQuote` function in `apps/native/src/components/app/plan/TodayCard.tsx:289-315`. Extract to `apps/native/src/components/app/shared/coach-quote-block.tsx`. Props: `text`, `stream?: boolean`, `speed?`, `delay?`, `onDone?`. Lime bg, black text, quotation marks, pulsing dot, cursor when streaming. Reused by TodayCard, EvidenceAct, RealityAct reactions, PayoffAct preview.
2. **`PillButton`** — inline Export pill in `TodayCard.tsx:449-467`. Extract to `apps/native/src/components/app/shared/pill-button.tsx`. Props: `label`, `icon?`, `onPress`, `variant?: "white" | "lime"`. Default white.
3. **`SectionLabel`** — small-caps 11px letter-spaced label ("TODAY", "YOUR RACE"). Extract to `apps/native/src/components/app/shared/section-label.tsx`. Props: `children`, `variant?: "light" | "dark"`.
4. **`LightSheetLayout`** — static black-header + light-body chrome for Acts 2–6. New file `apps/native/src/components/app/onboarding/layout/light-sheet-layout.tsx`. Props: `stepIndex`, `totalSteps`, `children`.
5. **`ConnectionCard`** — add `variant?: "dark" | "light"` + per-provider `disabledReason?: string` (for COROS "Coming soon"). Light variant swaps `white/X` → `black/X` tokens, keeps lime accents.

### Components to preserve as-is

- `StreamBlock.tsx`, `streaming-text.tsx`, `use-stream.ts`, `Cursor.tsx`, `thinking-block.tsx` — streaming primitives.
- `@gorhom/bottom-sheet` wrapper at `apps/native/src/components/custom/bottom-sheet.tsx` — used elsewhere.
- `apps/native/src/hooks/use-ai-chat.ts` — used by the Coach tab.

## Data writes summary

| Act | Mutation/Action | Backend location |
|---|---|---|
| 1 | `onboarding.ensureAthlete` | `packages/backend/convex/onboarding/athlete.ts` (new) |
| 2 | Soma connection flow | `packages/backend/convex/soma/*` (existing) |
| 2 | `onboarding.summarizeRecentActivity` | `packages/backend/convex/onboarding/soma.ts` (new) |
| 3 | `onboarding.updateAthleteProfile` | `packages/backend/convex/onboarding/athlete.ts` (new) |
| 4 | `onboarding.submitGoal` | `packages/backend/convex/onboarding/goal.ts` (new) |
| 5 | `onboarding.submitReality` | `packages/backend/convex/onboarding/reality.ts` (new) |
| 6 | `onboarding.submitVoice` | `packages/backend/convex/onboarding/voice.ts` (new) |
| 7 | `plan.generate.generatePlan` | `packages/backend/convex/plan/generate.ts` (existing — just wire) |

All `onboarding.*` files are thin wrappers that fan to `components.agoge.public.*` or Seshat `memory_write`.

## Agoge schema reference

From `node_modules/@nativesquare/agoge/src/component/`:

**Athlete** — all optional except `userId`:
`userId, name, sex ("male"|"female"|"other"), dateOfBirth (ISO), weightKg, heightCm, maxHr, restingHr, thresholdPaceMps, thresholdHr, updatedAt`

**Event** — race goals:
`athleteId, name, date (YYYY-MM-DD), sport ("run"), priority ("A"|"B"|"C"), distanceMeters?, goalTimeSeconds?, location?, notes?`

**Zones** — per athlete-sport-kind:
`athleteId, sport, kind ("hr"|"pace"), boundaries (number[]), effectiveFrom (YYYY-MM-DD)`

Public API: `components.agoge.public.*` — `createAthlete`, `updateAthlete`, `getAthleteByUserId`, `addZones`, `listZones`, `getZonesAtDate`, `createEvent`, `listEvents`, `updateEvent`, etc.

## Soma integration reference

From `packages/backend/convex/soma/` and `node_modules/@nativesquare/soma`:

- **Connection (OAuth):** `soma.garmin.getAuthUrl`, `soma.strava.getAuthUrl`, HealthKit native flow
- **Query:** `listActivities`, `listSleep`, `listDaily`, `listBody`, `getProviderStats`
- **Providers today:** Garmin, Strava, HealthKit. **COROS not integrated** (shown as disabled).
- **No zone-derivation utility exists** (net-new work if pursued).

## Files to create

- `apps/native/src/components/app/onboarding/OnboardingFlow.tsx` — root orchestrator
- `apps/native/src/components/app/onboarding/layout/light-sheet-layout.tsx`
- `apps/native/src/components/app/onboarding/acts/WelcomeAct.tsx`
- `apps/native/src/components/app/onboarding/acts/EvidenceAct.tsx`
- `apps/native/src/components/app/onboarding/acts/AthleteProfileAct.tsx`
- `apps/native/src/components/app/onboarding/acts/GoalAct.tsx`
- `apps/native/src/components/app/onboarding/acts/RealityAct.tsx` (5a + 5b)
- `apps/native/src/components/app/onboarding/acts/VoiceAct.tsx`
- `apps/native/src/components/app/onboarding/acts/PayoffAct.tsx`
- `apps/native/src/components/app/onboarding/hooks/use-onboarding-flow-state.ts`
- `apps/native/src/components/app/shared/coach-quote-block.tsx`
- `apps/native/src/components/app/shared/pill-button.tsx`
- `apps/native/src/components/app/shared/section-label.tsx`
- `packages/backend/convex/onboarding/athlete.ts`
- `packages/backend/convex/onboarding/soma.ts`
- `packages/backend/convex/onboarding/goal.ts`
- `packages/backend/convex/onboarding/reality.ts`
- `packages/backend/convex/onboarding/voice.ts`

## Files to modify

- `apps/native/src/app/(onboarding)/index.tsx` — route to `OnboardingFlow` instead of `OnboardingFlowMock`
- `apps/native/src/components/app/onboarding/connection-card.tsx` — add `variant="light"` + per-provider `disabledReason`
- `apps/native/src/components/app/plan/TodayCard.tsx` — swap inline `CoachQuote` and Export pill for extracted shared components

## Files to delete

**Onboarding mock harness:**
- `apps/native/src/components/app/onboarding/OnboardingFlowMock.tsx`
- `apps/native/src/components/app/onboarding/MockPathContext.tsx`
- `apps/native/src/components/app/onboarding/mock-data.ts`
- `apps/native/src/components/app/onboarding/FlowProgressBar.tsx`
- `apps/native/src/components/app/onboarding/ScreenTransition.tsx` (if not reused)
- `apps/native/src/components/app/onboarding/question-data.ts` (port useful strings first)
- `apps/native/src/components/app/onboarding/mocks/` (entire directory)

**Deprecated onboarding screens:**
- `apps/native/src/components/app/onboarding/screens/WearableScreen.tsx`
- `apps/native/src/components/app/onboarding/screens/DataInsightsScreen.tsx`
- `apps/native/src/components/app/onboarding/screens/RadarScreen.tsx`
- `apps/native/src/components/app/onboarding/screens/ProgressionScreen.tsx`
- `apps/native/src/components/app/onboarding/screens/CalendarScreen.tsx`
- `apps/native/src/components/app/onboarding/screens/VerdictScreen.tsx`
- `apps/native/src/components/app/onboarding/screens/PaywallScreen.tsx` — review during implementation; reuse or rebuild as part of `PayoffAct`

**Unused generative infra:**
- `apps/native/src/components/app/onboarding/generative/` (entire directory, 18 files)
- `apps/native/src/hooks/use-onboarding-progress.ts`
- `apps/native/src/hooks/use-onboarding-resume.ts`

**Do NOT delete:** `use-ai-chat.ts` (Coach tab), `onboarding_coach.ts` prompt (review references first).

## Explicit non-goals (follow-up PRs)

- **Zone auto-derivation** from Soma data. Optional, no utility exists today, non-trivial estimation. Plans generate fine without zones.
- **COROS integration.** Card shows "Coming soon". Soma backend work is separate.
- **Calendar connection.** Explicitly excluded.
- **Mid-flow resume.** MVP: if user drops, restart from Act 1. Agoge writes persist naturally; Act 3 skips filled fields.
- **Post-onboarding onboarding-coach generative flow.** The existing `onboarding_coach.ts` prompt stays unreached.

## Implementation order (PR slices)

1. **Shared component extraction + TodayCard refactor.** Zero user-facing change. Extract `CoachQuoteBlock`, `PillButton`, `SectionLabel`, add `LightSheetLayout`, add `ConnectionCard` light + disabled/coming-soon variants. TodayCard keeps rendering identically on Home.
2. **Backend wrappers.** New `convex/onboarding/*.ts` files (thin fans to Agoge + Seshat). No frontend impact.
3. **Vertical slice, act by act.** Build new `OnboardingFlow` orchestrator, wire acts 1 → 7 in order. Old `OnboardingFlowMock` stays routed until the new flow is end-to-end.
4. **Cutover + deletion.** Flip route in `(onboarding)/index.tsx`, delete mock harness, deprecated screens, and generative/ directory.

## Verification

1. **Cold-start DATA path**: fresh user → connect Garmin in Act 2 → confirmation screen shows real numbers → complete through Act 7 → verify Agoge athlete has name/sex/DOB/weight/height, Agoge event exists for race, Seshat has core memory records, plan exists in `plans` table, preview renders via `TodayCard`.
2. **Cold-start NO-DATA path**: skip wearable → self-report in Act 2 → complete through Act 7 → plan generates using self-reported values (inspect `generatePlan` action logs). Preview renders.
3. **Partial athlete path**: manually seed Agoge athlete with name + sex + DOB → start onboarding → Act 3 asks only for weight + height (skip silently if all filled).
4. **Non-race goal**: pick "general fitness" in Act 4 → verify **no** Agoge event is created; plan-gen still fires.
5. **Paywall dismiss**: dismiss paywall without subscribing → user stays in onboarding state (Home tab blocked). Subscribe → Home tab accessible, first-week plan loads natively.
6. **Visual regression**: Acts 2–6 render the static black header + light body layout; Act 1 and Act 7 analyze/paywall beats render full black. Act 7 preview card must be visually identical to the Home tab TodayCard.
7. **Stream effect**: every coach line (intros, reactions, analyze beat) streams character-by-character.

## Decision log (for future context)

- **Structured inputs, not LLM-driven conversation.** Considered reusing the existing `AIConversationView` + `onboarding_coach.ts` generative flow as the backbone. Rejected: plan generation needs clean fields, not transcripts; structured is testable/deterministic; free-form fits only the Act 6 "anything else?" tail.
- **One bundled generative tail, not multi-step AI.** The single Act 6 freeform is written directly to Seshat as a core memory blob — no LLM parsing, no multi-step agent. Plan-gen prompt reads it raw.
- **Static layout over real bottom sheet.** User can't accidentally dismiss onboarding mid-flow; no state complexity; visually identical to the Home page's dark-chrome-light-content pattern.
- **Real plan-gen pipeline for Act 7 preview, not template.** Slower (~15-30s) but honest — the user sees the actual product, not a lookalike. Conversion argument is stronger.
- **Agoge Event created during Act 3, not deferred post-paywall.** Structural data belongs in Agoge the moment it's confirmed. Post-paywall deferral would make resume logic harder.
- **Zones derivation deferred.** Optional; no utility exists; estimation is non-trivial and error-prone. Ship without, add later.
- **No calendar connection.** User decision — reduce friction, can add later if needed.
- **COROS shown disabled with "Coming soon".** Signals intent without making a promise we can't keep.
- **`runner_type` not persisted to Agoge.** It's not in the Agoge schema; lives in flow-local state and is consumed by plan-gen prompt only.
- **Reality written as single blob.** One Seshat core-memory record per act, not per field. Keeps the memory LLM-queryable without over-structuring.
