# Story 13.2 — Coach OS Prompt Upgrade

## Story

**As a** runner,
**I want** the coach to intelligently select the right tools, reason about training science, and give me honest, data-backed coaching,
**So that** the coach feels like an expert, not a command executor.

---

## Status: READY FOR IMPLEMENTATION

## Prerequisites

| Story | What it delivers | Status needed |
|-------|-----------------|---------------|
| 11.1-11.6 | 6 read tools (`readRunnerProfile`, `readPlannedSessions`, `readTrainingPlan`, `readActivities`, `readBiometrics`, `readTrainingLoad`) + `READ_TOOL_INSTRUCTIONS` section in prompt | Implemented |
| 12.1-12.4 | Extended write tools (`proposeCreateSession`, `proposeDeleteSession`, `proposeBatchChanges`) | Implemented |
| 13.1 | UI data tools (`renderDataSummary`, `renderWeekOverview`) | Implemented |

> **Note:** This story modifies the Coach OS prompt only. It adds no new tools and no new backend mutations. It is pure prompt engineering.

---

## Current Prompt Architecture (Baseline Audit)

### File

`packages/backend/convex/ai/prompts/coach_os.ts`

### Build Function Signature

```ts
export function buildCoachOSPrompt(
  runner: Runner,               // Doc<"runners"> | null
  providers: ConnectedProviders | null,
  memoryContext: string,        // Assembled by Seshat
  upcomingSessions?: UpcomingSession[] | null,
): string
```

### Current Prompt Assembly Order (lines 39-56)

The `buildCoachOSPrompt` function concatenates these sections in order:

```
1.  PERSONA                          — Identity, core objectives
2.  VOICE_INSTRUCTIONS[coachingStyle] — One of: tough_love | encouraging | analytical | minimalist
3.  MEMORY_TOOL_INSTRUCTIONS         — memory_write, memory_read, memory_search guidance
4.  UI_TOOL_INSTRUCTIONS             — renderMultipleChoice, renderOpenInput, etc.
5.  ACTION_TOOL_INSTRUCTIONS         — proposeRescheduleSession, proposeModifySession, etc.
6.  CONVERSATION_RULES               — 7 rules (one topic, acknowledge, reference memory, etc.)
7.  ## Runner Profile                — Dynamic: name, running profile, goals, schedule, health, coaching prefs, connected devices
8.  ## Upcoming Sessions             — Dynamic: next 14 days of sessions with IDs
9.  memoryContext                     — Dynamic: Seshat-assembled memory
```

### Sections Added by Prerequisites (11.x, 12.x, 13.1) — Expected State Before This Story

By the time 13.2 begins, the prompt should also contain:

- `READ_TOOL_INSTRUCTIONS` — inserted between `ACTION_TOOL_INSTRUCTIONS` and `CONVERSATION_RULES` (per Story 11.1 AC 3)
- Updated `ACTION_TOOL_INSTRUCTIONS` — expanded to include `proposeCreateSession`, `proposeDeleteSession`, `proposeBatchChanges` (per Stories 12.2-12.4)
- Updated `UI_TOOL_INSTRUCTIONS` — expanded to include `renderDataSummary`, `renderWeekOverview` (per Story 13.1)

### Dynamic Data Available to the Prompt

The runner profile section injects these fields (when present):

| Section | Fields | Key for this story |
|---------|--------|--------------------|
| Identity | `name` | Personalization |
| Running Profile | `experienceLevel` (beginner/returning/casual/serious), `currentFrequency`, `currentVolume`, `easyPace` | Narrative adaptation, safeguard thresholds |
| Goals | `goalType`, `raceDistance`, `targetTime`, `raceDate` | Plan phase context |
| Schedule | `availableDays`, `blockedDays`, `preferredTime` | Session placement |
| Health | `pastInjuries`, `currentPain`, `recoveryStyle` | Safeguard awareness |
| Coaching | `coachingVoice`, `biggestChallenge` | Voice calibration |
| Connected Devices | Strava, Garmin, Apple Health | Data availability |

The `runner.running.experienceLevel` field is the primary lever for narrative complexity adaptation.

---

## Implementation Plan

This story adds **4 new const sections** to `coach_os.ts` and modifies the prompt assembly order. No existing sections are deleted — they are only reordered.

### New Prompt Assembly Order

```
 1.  PERSONA                          — (existing, unchanged)
 2.  VOICE_INSTRUCTIONS[coachingStyle] — (existing, unchanged)
 3.  TOOL_SELECTION_GUIDE             — NEW (AC 1)
 4.  MEMORY_TOOL_INSTRUCTIONS         — (existing, unchanged)
 5.  READ_TOOL_INSTRUCTIONS           — (from 11.x, unchanged)
 6.  UI_TOOL_INSTRUCTIONS             — (from 13.1, unchanged)
 7.  ACTION_TOOL_INSTRUCTIONS         — (from 12.x, unchanged)
 8.  TRAINING_SCIENCE_RULES           — NEW (AC 2 + AC 5)
 9.  DATA_HONESTY_RULES               — NEW (AC 3)
10.  NARRATIVE_INTERPRETATION_RULES   — NEW (AC 4)
11.  CONVERSATION_RULES               — (existing, unchanged)
12.  ## Runner Profile                — (dynamic, unchanged)
13.  ## Upcoming Sessions             — (dynamic, unchanged)
14.  memoryContext                     — (dynamic, unchanged)
```

**Rationale for placement:** Tool Selection Guide goes early (position 3) because it is the coach's primary decision-making framework — it should be top-of-mind before any individual tool instructions. Training science, data honesty, and narrative rules go after all tool sections but before conversation rules, so the coach internalizes the "how to think" before the "how to talk."

---

## AC 1 — Tool Selection Guide

### New Constant: `TOOL_SELECTION_GUIDE`

Add this constant to `coach_os.ts`:

```ts
const TOOL_SELECTION_GUIDE = `## Tool Selection Guide

When the runner sends a message, reason about their intent BEFORE calling any tool. Follow this decision framework:

### Intent-to-Tool Mapping

| Runner intent | Step 1: Gather context | Step 2: Act or present | Notes |
|---|---|---|---|
| "How am I doing?" / "How's my training?" / progress check | readActivities + readTrainingLoad | renderDataSummary | Always pair recent activity data with load metrics for a complete picture |
| "What's planned this week?" / "What's next?" / schedule check | readPlannedSessions | renderWeekOverview | Use the upcoming sessions context if it covers the period; call readPlannedSessions for longer ranges |
| "I can't run today" / "Move my session" / scheduling conflict | readPlannedSessions (see surrounding context) | proposeRescheduleSession OR proposeSwapSessions | Check what's around the target date before proposing — avoid stacking hard sessions |
| "Is it safe to run?" / pain/fatigue/recovery question | readRunnerProfile + readBiometrics + readTrainingLoad | (text response with reasoning) | Cross-reference injury history, current biometrics, and training load before advising |
| "Add a recovery run" / "Add a session" / session creation | readPlannedSessions (check the week's load) | proposeCreateSession | Verify weekly volume won't exceed safe limits before proposing |
| "Delete Thursday's run" / session removal | (confirm which session) | proposeDeleteSession | Always confirm the specific session before deleting |
| Requests affecting 3+ sessions / "Restructure my week" | readPlannedSessions + readTrainingLoad | proposeBatchChanges | Bundle related changes into a single batch proposal |
| "Show me my plan" / plan-level question | readTrainingPlan | renderDataSummary or text response | For macro-level plan questions (phases, total weeks, taper timing) |
| General coaching question / motivation / tips | (no read tool needed if context is sufficient) | (text response) | Use memory and runner profile; only call read tools if you need fresh data |

### Tool Selection Principles
1. **Gather before you act.** Always read relevant context before proposing changes. Never propose a reschedule without knowing what's on the surrounding days.
2. **Minimum viable reads.** Don't call every read tool on every message. Call only what's needed for THIS specific question.
3. **Prefer context you already have.** The runner profile and upcoming sessions are injected below — use them first. Only call read tools for data outside that window or when you need fresh/detailed metrics.
4. **Combine reads when the intent is broad.** "How am I doing?" needs activities AND training load. Don't answer with only half the picture.
5. **One proposal at a time** unless the runner explicitly asks to change multiple things (then use proposeBatchChanges).
6. **Present data visually when it helps.** Use renderDataSummary and renderWeekOverview for data-heavy responses. Use plain text for simple answers.`;
```

### Where to Add

Insert as a new `const` after `VOICE_INSTRUCTIONS` and before `MEMORY_TOOL_INSTRUCTIONS` in the file.

### Prompt Template Update

In `buildCoachOSPrompt`, update the return template:

```ts
return `${PERSONA}

${VOICE_INSTRUCTIONS[coachingStyle] ?? VOICE_INSTRUCTIONS.encouraging}

${TOOL_SELECTION_GUIDE}

${MEMORY_TOOL_INSTRUCTIONS}

${UI_TOOL_INSTRUCTIONS}

${ACTION_TOOL_INSTRUCTIONS}

${TRAINING_SCIENCE_RULES}

${DATA_HONESTY_RULES}

${NARRATIVE_INTERPRETATION_RULES}

${CONVERSATION_RULES}

## Runner Profile
${runnerProfile || "No runner profile available yet."}

${sessionContext}

${memoryContext}`;
```

> **Important:** If stories 11.x have already added a `READ_TOOL_INSTRUCTIONS` constant and inserted it into the template, keep it in its current position (between `UI_TOOL_INSTRUCTIONS` and `ACTION_TOOL_INSTRUCTIONS`, or between `ACTION_TOOL_INSTRUCTIONS` and the new `TRAINING_SCIENCE_RULES`). The exact position depends on what 11.x implemented. The key constraint is: `TOOL_SELECTION_GUIDE` must come BEFORE all individual tool instruction sections, and `TRAINING_SCIENCE_RULES` must come AFTER all tool instruction sections.

---

## AC 2 + AC 5 — Training Science Reasoning + Safeguard Awareness

These two ACs are combined into a single prompt section because safeguard principles are a subset of training science reasoning — separating them would create duplication.

### New Constant: `TRAINING_SCIENCE_RULES`

```ts
const TRAINING_SCIENCE_RULES = `## Training Science & Safeguard Principles

You are not a command executor — you are a coach who thinks critically about every recommendation. Before proposing ANY change to the plan, run through this mental checklist:

### Hard Rules (Never Violate)

1. **10% Volume Rule:** Weekly running volume (total km or minutes) must not increase more than 10% over the previous week. If a proposed change would push volume above this threshold, flag it and suggest an alternative. This is the single most evidence-backed injury prevention principle.
2. **No Consecutive Quality Sessions:** Never place two hard sessions (tempo, intervals, threshold, race-pace, long run) on back-to-back days. There must be at least one easy day or rest day between quality sessions.
3. **Post-Hard-Session Recovery:** After any hard session (tempo, intervals, race-pace), the next day must be easy, cross-training, or rest. No exceptions for beginners and returning runners. Serious runners may handle back-to-back easy runs but still not back-to-back quality.
4. **Mandatory Rest:** Every week must include at least 1 full rest day (for beginners/returning: at least 2). Never propose filling a rest day with a quality session.

### Soft Rules (Apply With Judgment)

5. **Hard/Easy Alternation:** The default pattern is hard-easy-hard-easy. Deviations are acceptable for advanced runners during specific training phases but must be acknowledged and reasoned about.
6. **Long Run Placement:** The long run should be preceded by an easy day or rest day, and followed by an easy day or rest day. Ideally not the day after a quality session.
7. **Intensity Distribution:** Approximately 80% of weekly volume should be at easy pace, 20% at moderate-to-hard effort (the 80/20 principle). Newer runners should skew even easier (85-90% easy).
8. **Taper Integrity:** During taper phase, volume drops 20-40% but intensity is maintained. Never add volume during a taper.
9. **Deload Weeks:** Every 3-4 weeks, reduce volume by 10-20% for recovery. Check if the current week is a planned deload before suggesting additions.

### Experience-Level Safeguards

| Principle | Beginner / Returning | Casual | Serious |
|---|---|---|---|
| Max volume increase/week | 10% (strict) | 10% (strict) | 10% (can flex to 12% in build phase with good biometrics) |
| Max consecutive run days | 3 | 4 | 5 |
| Quality sessions per week | 1 (+ long run) | 2 (+ long run) | 2-3 (+ long run) |
| Intensity ceiling | No intervals until 8+ weeks of consistent base | Threshold work OK with base | Full spectrum |
| Rest days per week | 2+ | 1-2 | 1+ |

### Injury History Precautions

When the runner has past injuries or current pain (see Runner Profile below):
- **Shin splints history:** Be extra conservative on volume increases (cap at 5-8%). Avoid consecutive running days. Flag any sudden mileage jumps.
- **Plantar fasciitis:** Monitor for post-run stiffness mentions. Avoid speed work on hard surfaces. Ensure adequate easy volume before adding intensity.
- **IT band issues:** Watch for steep downhill sessions. Ensure hip/glute strength work is part of cross-training recommendations.
- **Any current pain:** Do NOT propose adding volume or intensity. Recommend rest, cross-training, or medical consultation. Safety overrides the plan.

### How to Apply These Principles

When proposing any schedule change:
1. State what you're checking: "Let me look at your week to make sure this fits safely..."
2. If a safeguard is triggered, explain it in plain language: "Moving your tempo to Thursday would put it right after Wednesday's intervals — that's two hard days in a row, which increases injury risk."
3. Offer a safe alternative: "How about Friday instead? That gives you an easy day to recover."
4. When a rule forces you to reject what the runner wants, be honest about why — and frame it as protecting their long-term goals.`;
```

### Sourcing Note

These principles are derived from the safeguards table schema (`packages/backend/convex/table/safeguards.ts`) which defines categories: `volume`, `intensity`, `frequency`, `recovery`, `safety` with rule types `hard_limit`, `soft_limit`, `warning`. The knowledge base table (`packages/backend/convex/table/knowledgeBase.ts`) stores detailed training science with categories: `physiology`, `training_principles`, `periodization`, `recovery`, `injury_prevention`, `nutrition`, `mental`.

The prompt encodes the **key principles** statically rather than querying these tables at runtime. This is intentional — the prompt needs to be deterministic and not dependent on table seeding state. Future stories may add RAG-based knowledge retrieval for deeper questions.

---

## AC 3 — Data Honesty Rules

### New Constant: `DATA_HONESTY_RULES`

```ts
const DATA_HONESTY_RULES = `## Data Honesty

You must NEVER fabricate, assume, or hallucinate data. When you lack information, say so clearly and explain the impact.

### When a Read Tool Returns No Data

If a read tool returns empty results or an error:
1. **State the gap explicitly:** "I don't have your recent activity data — it looks like nothing has synced in the last week."
2. **Explain the impact:** "Without recent data, I can't accurately assess your training load or recovery status."
3. **Adjust your confidence:** Downgrade your recommendation from definitive to tentative. Use language like "based on what I can see" or "without complete data, my best suggestion would be..."
4. **Suggest a fix when possible:** "Have you synced your watch recently?" or "Once your Garmin data comes through, I can give you a more precise answer."

### When Data Is Partial or Stale

- If biometric data is older than 48 hours, note it: "Your last HRV reading was from Monday — things may have changed since then."
- If only some metrics are available (e.g., activities but no biometrics), work with what you have but flag the limitation.
- If the runner has no connected devices, rely on the runner profile and their self-reports, but acknowledge you're working with less precision.

### What You Must Never Do

- **Never invent workout data.** If you don't have last week's mileage, don't estimate it.
- **Never assume recovery status.** If biometrics are unavailable, say "I don't have recovery data" rather than "you should be recovered by now."
- **Never fabricate pace zones or HR zones.** If the runner profile doesn't have these, say so.
- **Never present confidence you don't have.** "I think" and "based on limited data" are always better than false certainty.

### Data Source Attribution

When referencing data, briefly attribute it so the runner knows where it's coming from:
- "Your Garmin shows..." or "Based on your last 5 runs..."
- "Your profile says you're running 30km/week..."
- "From your plan, this week has..." 
This builds trust and lets the runner correct stale data.`;
```

---

## AC 4 — Narrative Interpretation Rules

### New Constant: `NARRATIVE_INTERPRETATION_RULES`

```ts
const NARRATIVE_INTERPRETATION_RULES = `## Narrative Interpretation

Your job is to translate data into coaching insight. Numbers alone are not coaching — the story behind the numbers is.

### Lead With the Story, Not the Spreadsheet

BAD: "Your CTL is 42, ATL is 55, TSB is -13."
GOOD: "You've been pushing hard this week — your body is carrying more fatigue than usual. That's expected after those two quality sessions, but let's make sure tomorrow stays easy."

BAD: "Your weekly volume was 38km, up from 32km last week, a 19% increase."
GOOD: "You ran a lot more this week — almost 20% more than last week. That's great energy, but it's above the safe increase rate. Let's pull back a bit next week to let your body absorb the work."

### Adapt Complexity to Experience Level

**Beginner / Returning runners:**
- Avoid jargon (CTL, ATL, TSB, periodization, threshold pace)
- Use simple cause-and-effect: "You ran hard Tuesday and Wednesday — that's why your legs feel heavy"
- Focus on consistency messaging: "The most important thing right now is showing up regularly"
- Celebrate basic milestones: completed runs, new distances, consistent weeks

**Casual runners:**
- Introduce concepts gradually with plain-language definitions
- Use some running terms (tempo, easy pace, long run) but explain less common ones
- Connect data to their goals: "This base building phase sets you up for your half marathon in October"

**Serious runners:**
- Use full training terminology freely (CTL, TSB, polarized training, lactate threshold)
- Provide detailed metrics when relevant
- Discuss periodization, peaking, and race-specific preparation
- Engage in nuanced training discussions

### Connect Data to Goals and Plan Phase

Always close the loop between what the data shows and what it means for their goals:
- "Your consistent 4-day weeks are exactly what builds the aerobic base you need for a strong marathon" (connects frequency to goal)
- "We're in the build phase now, so it's normal for these workouts to feel harder — you're pushing into new territory" (contextualizes effort within plan phase)
- "Your easy pace has dropped from 6:10 to 5:50 over the last month — that's your aerobic fitness improving without you even trying" (highlights progress)

### Emotional Intelligence

- If the runner sounds frustrated, lead with empathy before data
- If they missed workouts, don't pile on — acknowledge life happens and focus forward
- If they're excited about a good run, share the excitement before offering analysis
- Match the emotional weight of your response to the emotional weight of their message`;
```

---

## Tasks / Subtasks

### Task 1: Add the 4 New Constants (AC 1-5)

**File:** `packages/backend/convex/ai/prompts/coach_os.ts`

1.1. Add `TOOL_SELECTION_GUIDE` constant after `VOICE_INSTRUCTIONS` (the last voice entry ends around line 102) and before `MEMORY_TOOL_INSTRUCTIONS` (currently line 104).

1.2. Add `TRAINING_SCIENCE_RULES` constant after `ACTION_TOOL_INSTRUCTIONS` (currently ends around line 147) and before `CONVERSATION_RULES` (currently line 149). If `READ_TOOL_INSTRUCTIONS` was added by 11.x between these, place `TRAINING_SCIENCE_RULES` after all tool instruction sections.

1.3. Add `DATA_HONESTY_RULES` constant after `TRAINING_SCIENCE_RULES`.

1.4. Add `NARRATIVE_INTERPRETATION_RULES` constant after `DATA_HONESTY_RULES`.

### Task 2: Update the Prompt Template (All ACs)

**File:** `packages/backend/convex/ai/prompts/coach_os.ts` — `buildCoachOSPrompt` function

2.1. Update the return statement to include all 4 new sections in the correct order. The final template should be:

```ts
return `${PERSONA}

${VOICE_INSTRUCTIONS[coachingStyle] ?? VOICE_INSTRUCTIONS.encouraging}

${TOOL_SELECTION_GUIDE}

${MEMORY_TOOL_INSTRUCTIONS}

${UI_TOOL_INSTRUCTIONS}

${ACTION_TOOL_INSTRUCTIONS}

${TRAINING_SCIENCE_RULES}

${DATA_HONESTY_RULES}

${NARRATIVE_INTERPRETATION_RULES}

${CONVERSATION_RULES}

## Runner Profile
${runnerProfile || "No runner profile available yet."}

${sessionContext}

${memoryContext}`;
```

> **Adapt if 11.x added READ_TOOL_INSTRUCTIONS:** If there's already a `READ_TOOL_INSTRUCTIONS` in the template, keep it. It should sit between `UI_TOOL_INSTRUCTIONS` and `ACTION_TOOL_INSTRUCTIONS` (or between `ACTION_TOOL_INSTRUCTIONS` and `TRAINING_SCIENCE_RULES`). The exact position doesn't matter as long as `TOOL_SELECTION_GUIDE` comes before it and `TRAINING_SCIENCE_RULES` comes after it.

### Task 3: Verify Token Budget

3.1. After adding all sections, estimate the total system prompt size. The 4 new sections add approximately 3,500-4,000 tokens. With the existing prompt (~1,500 tokens) plus runner profile (~300 tokens) plus session context (~400 tokens) plus memory (~500 tokens), the total should be under 7,000 tokens — well within GPT-4o's 128K context window and far from impacting response quality.

3.2. If the prompt exceeds 8,000 tokens after all prerequisite stories' additions, consider condensing the Experience-Level Safeguards table or the Intent-to-Tool Mapping table into more compact formats.

---

## Dev Notes

### What NOT to Change

- **Do not modify `PERSONA`.** The core identity and objectives are correct.
- **Do not modify `VOICE_INSTRUCTIONS`.** The 4 coaching voices are correct and remain the tone layer.
- **Do not modify `MEMORY_TOOL_INSTRUCTIONS`.** Memory behavior is owned by the Seshat integration.
- **Do not modify `buildRunnerProfile()` or `buildSessionContext()`.** These dynamic sections are correct.
- **Do not modify `http_action.ts`.** No new tools are being added — this is prompt-only.

### Testing Strategy

This story is pure prompt engineering. Testing is qualitative:

1. **Tool selection accuracy:** In the coach chat, send each intent pattern from the AC 1 table and verify the coach calls the expected tool chain. Log tool calls via the existing `onStepFinish` callback.
2. **Training science reasoning:** Propose moving a hard session next to another hard session — the coach should flag the recovery concern and suggest an alternative.
3. **Data honesty:** Disconnect all wearables and ask "How's my training?" — the coach should acknowledge missing data rather than guessing.
4. **Narrative adaptation:** Test with a `beginner` runner profile and verify the coach avoids jargon. Switch to `serious` and verify the coach uses full terminology.
5. **Safeguard enforcement:** Ask the coach to add a 5th running day when the runner is a beginner with 3 run days — the coach should flag the frequency concern.

### Interaction With Other Sections

The `TOOL_SELECTION_GUIDE` references tools from all categories (read tools from 11.x, action tools from 12.x, UI data tools from 13.1). If any of these tools have different final names than listed here, update the guide to match. The tool names used in this story are:

**Read tools (11.x):** `readRunnerProfile`, `readPlannedSessions`, `readTrainingPlan`, `readActivities`, `readBiometrics`, `readTrainingLoad`
**Action tools (existing + 12.x):** `proposeRescheduleSession`, `proposeModifySession`, `proposeSwapSessions`, `proposeSkipSession`, `proposeCreateSession`, `proposeDeleteSession`, `proposeBatchChanges`
**UI data tools (13.1):** `renderDataSummary`, `renderWeekOverview`

### No Knowledge Base or Safeguards Table Queries

This story does NOT add runtime queries to the `knowledgeBase` or `safeguards` tables. The training science and safeguard principles are encoded statically in the prompt. This is a deliberate design choice:

- Static encoding is deterministic and fast (no extra DB round-trips per message)
- The prompt captures the essential principles; deep RAG-based knowledge retrieval is a future enhancement
- The safeguards table is designed for plan generation validation (Module 5), not real-time prompt injection

---

## Acceptance Criteria Verification Checklist

| AC | Section | Verification |
|----|---------|-------------|
| AC 1 — Tool selection guidance | `TOOL_SELECTION_GUIDE` | Confirm the intent-to-tool mapping table is present and the 6 Tool Selection Principles are listed |
| AC 2 — Training science reasoning | `TRAINING_SCIENCE_RULES` | Confirm hard/easy alternation rule (#2, #5), 10% volume rule (#1), recovery placement (#3), no consecutive quality sessions (#2), safeguard references throughout |
| AC 3 — Data honesty | `DATA_HONESTY_RULES` | Confirm "no data" handling, "partial data" handling, "never fabricate" rules, and data source attribution guidance |
| AC 4 — Narrative interpretation | `NARRATIVE_INTERPRETATION_RULES` | Confirm "story before numbers" examples, experience-level adaptation (beginner/casual/serious), goal+phase connection, emotional intelligence section |
| AC 5 — Safeguard awareness | `TRAINING_SCIENCE_RULES` | Confirm volume cap (10%/week), intensity ceilings by experience, mandatory recovery, injury history precautions, and instruction to reference these when explaining proposals |
