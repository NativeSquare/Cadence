---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
status: complete
inputDocuments:
  - prd.md
  - architecture-backend-v2.md
lastUpdated: 2026-03-31
scope: 'Coach Plan Interaction Feature'
---

# Cadence — Coach Plan Interaction: Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the Coach Plan Interaction feature, decomposing the PRD requirements into implementable stories. This feature extends the existing AI coach to read all user training data and perform CRUD operations on training plans and planned sessions via tool-calling with approval-gated generative UI.

**Existing Infrastructure (not rebuilt):** Coach chat screen, SSE streaming, tool-calling pipeline, CoachToolRenderer, 4 existing action tools (reschedule, modify, swap, skip), RBAC patterns, Coach OS prompt, Seshat memory system.

**CRITICAL SECURITY PRINCIPLE:** The coach has NO direct database access. All user data access — both reads and writes — happens exclusively through the defined tools. Each tool implements strict RBAC enforcement: `getAuthUserId` → `getAuthenticatedRunner` → ownership verification. This means a user can only ever access their own data, and there is no code path where the coach can bypass this boundary. The tools ARE the access layer — there is no other way in. This principle must be maintained across all epics and stories without exception.

## Requirements Inventory

### Functional Requirements

**1. Training Data Reading**
- FR1: Coach can read the runner's full profile including inferred metrics (ATL, CTL, TSB, readiness, risk assessment, pace zones, HR zones)
- FR2: Coach can read planned sessions filtered by date range, week number, or status (scheduled, completed, skipped, modified)
- FR3: Coach can read the active training plan structure including season view, weekly plan breakdown, and current phase
- FR4: Coach can read completed activities from Soma (runs with pace, HR, duration, distance, cadence)
- FR5: Coach can read biometric data from Soma (sleep sessions, resting HR, HRV, body measurements)
- FR6: Coach can read computed training load metrics (ATL, CTL, TSB, readiness score, injury risk level)

**2. Session Modification**
- FR7: Coach can propose rescheduling a planned session to a different date (existing tool — extend if needed)
- FR8: Coach can propose modifying a session's details: duration, effort level, pace targets, session type (existing tool — extend if needed)
- FR9: Coach can propose swapping two sessions' dates (existing tool)
- FR10: Coach can propose skipping a session with a reason (existing tool)
- FR11: Coach can propose creating a new planned session on a specified date with session type, duration, effort, and pace targets
- FR12: Coach can propose deleting/removing a planned session from the plan
- FR13: Coach can propose multiple session changes in a single interaction (batch proposal displayed as one approval card)

**3. Approval Flow**
- FR14: User can see a clear summary of proposed changes in an action card before any mutation executes
- FR15: User can approve a proposed change, triggering the corresponding Convex mutation
- FR16: User can reject a proposed change, with the coach acknowledging and offering alternatives
- FR17: After approval, the coach confirms the change conversationally and the plan state reflects the update immediately

**4. Data Presentation**
- FR18: Coach can render a data summary card showing queried metrics in a structured visual format
- FR19: Coach can interpret raw training data in plain language narrative appropriate to the user's experience level
- FR20: Coach can render a week overview card showing the current or proposed week structure

**5. Coach Intelligence**
- FR21: Coach selects the appropriate tool based on natural language user input without requiring specific commands
- FR22: Coach applies training science principles when proposing plan modifications (hard/easy alternation, load distribution, recovery requirements)
- FR23: Coach respects safeguards and load parameters when proposing changes — never exceeds volume caps or violates recovery constraints
- FR24: Coach acknowledges data gaps honestly when read tools return incomplete or missing data
- FR25: Coach references the runner's specific data (not generic advice) when explaining proposals or answering questions

**6. Plan Regeneration (Post-Beta)**
- FR26: Coach can detect when a user request requires full plan regeneration (goal change, major life change, starting over)
- FR27: Coach can initiate a structured conversation to capture new plan parameters (goal type, target race, timeline)
- FR28: Coach can trigger the existing plan generation pipeline with updated parameters and present the new plan
- FR29: User can approve or reject the newly generated plan before it replaces the current one

**7. Security & Data Access**
- FR30: All read tools enforce authenticated user context — coach can only read data belonging to the current user's runner profile
- FR31: All write tools enforce ownership verification — mutations check that the target session/plan belongs to the authenticated user's runner
- FR32: No tool call can access, modify, or return data from another user's profile, plan, or sessions

### NonFunctional Requirements

- NFR-P1: Read tool results should return to coach context <2 seconds
- NFR-P2: Action card should render <5 seconds from user message (thinking indicator shown immediately)
- NFR-P3: Mutation execution after approval tap <1 second
- NFR-P4: Data summary card rendering <1 second after data available
- NFR-S1: All tool calls execute within authenticated Convex context
- NFR-S2: Read tool results must not be logged with PII in plain text
- NFR-S3: Tool call arguments and results must be included in conversation persistence
- NFR-R1: Failed mutations must not leave plan in partial state
- NFR-R2: If a tool call fails, coach must report the failure gracefully and offer alternatives
- NFR-R3: Network interruption during a multi-step proposal must not auto-execute pending approvals

### Additional Requirements

**From Architecture:**
- Convex backend with reactive queries and transactional mutations
- Vercel AI SDK for tool-calling with Zod schemas
- Existing RBAC pattern: `getAuthUserId` → `getAuthenticatedRunner` → `getOwnedSession`
- SSE streaming via httpAction endpoint
- Soma component for activities, sleep, daily summaries, body measurements access
- Inference engine (`inferenceEngine.ts`) for computed metrics — pure calculation, no DB writes
- Tool definitions split across `tools/index.ts` (UI tools) and `tools/actions.ts` (action tools)
- Coach OS prompt built in `prompts/coach_os.ts`
- Action mutations in `training/actionMutations.ts`
- Training queries in `training/queries.ts`

**From Existing Codebase:**
- 4 action tools already exist: `proposeRescheduleSession`, `proposeModifySession`, `proposeSwapSessions`, `proposeSkipSession`
- 4 action cards already exist: `RescheduleSessionCard`, `ModifySessionCard`, `SkipSessionCard`, `SwapSessionsCard`
- `CoachToolRenderer.tsx` dispatches tool results to the correct card component
- Coach already receives: runner profile, upcoming 14 days of sessions, knowledge base, memory context
- Existing queries: `getWeekSessions`, `getMultiWeekSessions`, `getSessionById`, `getActivityForSession`, `getAdjacentSessions`, `getUpcomingSessions`

### FR Coverage Map

| FR | Epic | Story | Description |
|----|------|-------|-------------|
| FR1 | Epic 11 | 11.1 | Read runner profile tool |
| FR2 | Epic 11 | 11.2 | Read planned sessions tool |
| FR3 | Epic 11 | 11.3 | Read training plan structure tool |
| FR4 | Epic 11 | 11.4 | Read completed activities tool |
| FR5 | Epic 11 | 11.5 | Read biometric data tool |
| FR6 | Epic 11 | 11.6 | Read training load metrics tool |
| FR7 | Epic 12 | 12.1 | Existing reschedule tool (audit/extend) |
| FR8 | Epic 12 | 12.1 | Existing modify tool (audit/extend) |
| FR9 | Epic 12 | 12.1 | Existing swap tool (audit/extend) |
| FR10 | Epic 12 | 12.1 | Existing skip tool (audit/extend) |
| FR11 | Epic 12 | 12.2 | Create session tool + card |
| FR12 | Epic 12 | 12.3 | Delete session tool + card |
| FR13 | Epic 12 | 12.4 | Batch proposal card |
| FR14 | Epic 12 | 12.1-12.4 | Approval cards (all write tools) |
| FR15 | Epic 12 | 12.1-12.4 | Approve flow |
| FR16 | Epic 12 | 12.1-12.4 | Reject flow |
| FR17 | Epic 12 | 12.1-12.4 | Post-approval confirmation |
| FR18 | Epic 13 | 13.1 | Data summary card |
| FR19 | Epic 13 | 13.2 | Coach prompt for narrative interpretation |
| FR20 | Epic 13 | 13.1 | Week overview card |
| FR21 | Epic 13 | 13.2 | Coach prompt for tool selection |
| FR22 | Epic 13 | 13.2 | Coach prompt for training science reasoning |
| FR23 | Epic 13 | 13.2 | Safeguard awareness in prompt |
| FR24 | Epic 13 | 13.2 | Honest data gap handling in prompt |
| FR25 | Epic 13 | 13.2 | Data-referenced coaching in prompt |
| FR26 | Epic 14 | 14.1 | Detect plan regen intent |
| FR27 | Epic 14 | 14.2 | Structured regen conversation |
| FR28 | Epic 14 | 14.3 | Trigger plan generation pipeline |
| FR29 | Epic 14 | 14.3 | Approve/reject new plan |
| FR30 | Epic 11 | 11.1-11.6 | RBAC on all read tools |
| FR31 | Epic 12 | 12.1-12.4 | RBAC on all write tools |
| FR32 | Epic 11-12 | All | Zero cross-user data access |

## Epic List

### Epic 11: Coach Reads Training Data
**Goal:** Give the coach on-demand access to all user training data so it can answer questions about the runner's history, current state, and plan with specific, data-backed responses.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR30, FR32

### Epic 12: Coach Modifies the Plan
**Goal:** Extend the coach's ability to propose plan changes — adding create and delete session capabilities, batch proposals, and ensuring the existing 4 action tools work seamlessly within the new expanded toolset.
**FRs covered:** FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR31, FR32

### Epic 13: Coach Intelligence & Data Presentation
**Goal:** Upgrade the coach's system prompt and add generative UI cards so the coach selects the right tools, reasons about training science, and presents data visually to the user.
**FRs covered:** FR18, FR19, FR20, FR21, FR22, FR23, FR24, FR25

### Epic 14: Plan Regeneration from Conversation (Post-Beta)
**Goal:** Allow the coach to detect when a user needs a fundamentally new plan, guide them through a structured goal-capture conversation, and trigger the existing plan generation pipeline.
**FRs covered:** FR26, FR27, FR28, FR29

---

## Epic 11: Coach Reads Training Data

Give the coach on-demand access to all user training data through read tools that execute as Convex queries within the authenticated user context. Each tool returns structured data that the coach can interpret and present.

**RBAC Mandate:** These read tools are the ONLY mechanism through which the coach accesses user data. No data is pre-injected into the prompt context beyond what already exists (runner profile summary, 14-day upcoming sessions). For anything deeper — historical activities, biometrics, load metrics, full plan structure — the coach MUST call the appropriate read tool, which enforces `getAuthUserId` → runner ownership verification on every invocation. There is no backdoor.

### Story 11.1: Read Runner Profile Tool

As a runner,
I want the coach to access my full profile and fitness metrics when I ask about my current state,
So that the coach can give me specific, data-backed answers about my fitness, zones, and risk factors.

**Acceptance Criteria:**

**AC 1 — Tool definition**
**Given** the coach tool registry in `tools/actions.ts`
**When** a new `readRunnerProfile` tool is defined with Zod schema
**Then** the tool accepts no arguments (uses authenticated context) and returns the runner object with all inferred fields (ATL, CTL, TSB, readiness, risk, pace zones, HR zones)
**And** the tool description clearly explains what data it provides so the LLM can select it appropriately

**AC 2 — RBAC enforcement**
**Given** an authenticated user with a runner profile
**When** the `readRunnerProfile` tool executes
**Then** it calls `getAuthUserId` → queries runners by `userId` index → returns only that user's data
**And** throws `UNAUTHORIZED` if no auth, `NOT_FOUND` if no runner profile

**AC 3 — Coach OS prompt update**
**Given** the Coach OS prompt in `coach_os.ts`
**When** the prompt is rebuilt for a conversation
**Then** it includes the `readRunnerProfile` tool in the available tools section with a clear description of when to use it (e.g., "when the user asks about their fitness level, zones, readiness, or current state")

**AC 4 — Streaming integration**
**Given** the coach calls `readRunnerProfile` during a conversation
**When** the tool result streams back via SSE
**Then** the coach receives the structured data and can reference specific fields in its response
**And** the conversation continues naturally after the tool call

### Story 11.2: Read Planned Sessions Tool

As a runner,
I want the coach to look up my scheduled sessions when I ask about my week or upcoming training,
So that the coach knows exactly what's planned before suggesting changes.

**Acceptance Criteria:**

**AC 1 — Tool definition**
**Given** the coach tool registry
**When** a new `readPlannedSessions` tool is defined
**Then** it accepts optional filters: `weekNumber`, `startDate`, `endDate`, `status` (scheduled/completed/skipped/modified)
**And** returns an array of planned session objects with all fields (type, duration, effort, pace targets, date, status, justification)

**AC 2 — RBAC enforcement**
**Given** an authenticated user
**When** `readPlannedSessions` executes
**Then** it queries planned sessions filtered by the user's `runnerId` using the `by_runnerId` index
**And** applies additional filters (date range, status) on the returned results
**And** never returns sessions belonging to other runners

**AC 3 — Default behavior**
**Given** no filters are provided
**When** `readPlannedSessions` executes
**Then** it returns the current week's sessions (Monday to Sunday) as a sensible default

**AC 4 — Coach prompt update**
**Given** the Coach OS prompt
**When** rebuilt for conversation
**Then** it includes `readPlannedSessions` with description: "Use when the user asks about their schedule, upcoming sessions, what's planned for a specific day/week, or before proposing plan changes"

### Story 11.3: Read Training Plan Structure Tool

As a runner,
I want the coach to understand my overall plan structure — phases, weekly targets, and the big picture,
So that the coach can explain where I am in my training cycle and make plan-aware decisions.

**Acceptance Criteria:**

**AC 1 — Tool definition**
**Given** the coach tool registry
**When** a new `readTrainingPlan` tool is defined
**Then** it accepts no arguments (reads the active plan for the authenticated user)
**And** returns the plan object including: name, goalType, targetEvent, targetDate, status, seasonView (coachSummary, periodization, milestones), weeklyPlan array, runnerSnapshot, current phase determination

**AC 2 — RBAC enforcement**
**Given** an authenticated user
**When** `readTrainingPlan` executes
**Then** it queries training plans by `runnerId` index with status "active"
**And** returns only the user's active plan (or null if no active plan)

**AC 3 — Current phase derivation**
**Given** the plan's weeklyPlan array and today's date
**When** the tool processes the result
**Then** it includes a computed `currentWeek` and `currentPhase` field so the coach knows where the runner is in the plan without manual calculation

**AC 4 — Coach prompt update**
**Given** the Coach OS prompt
**When** rebuilt for conversation
**Then** it includes `readTrainingPlan` with description: "Use when the user asks about their overall plan, training phases, goals, or when you need plan context to make intelligent session modification proposals"

### Story 11.4: Read Completed Activities Tool

As a runner,
I want the coach to see my actual completed runs — pace, heart rate, duration, distance,
So that the coach can evaluate how my training is actually going, not just what was planned.

**Acceptance Criteria:**

**AC 1 — Tool definition**
**Given** the coach tool registry
**When** a new `readActivities` tool is defined
**Then** it accepts optional filters: `startDate`, `endDate`, `limit` (default 20)
**And** returns activities from Soma with: date, type, duration, distance, avgPace, avgHR, maxHR, cadence, calories

**AC 2 — Soma integration**
**Given** the Soma component is available via `components.soma`
**When** `readActivities` executes
**Then** it calls `soma.listActivities` filtered by the authenticated userId and date range
**And** maps the Soma activity format to a clean structure the coach can interpret

**AC 3 — RBAC enforcement**
**Given** an authenticated user
**When** `readActivities` executes
**Then** it uses `getAuthUserId` and filters Soma activities by that userId
**And** never returns activities from other users

**AC 4 — Coach prompt update**
**Given** the Coach OS prompt
**When** rebuilt for conversation
**Then** it includes `readActivities` with description: "Use when the user asks about past runs, how a specific session went, training history, or when you need actual performance data to inform recommendations"

### Story 11.5: Read Biometric Data Tool

As a runner,
I want the coach to access my sleep, HRV, and recovery data,
So that the coach can factor my recovery state into its recommendations.

**Acceptance Criteria:**

**AC 1 — Tool definition**
**Given** the coach tool registry
**When** a new `readBiometrics` tool is defined
**Then** it accepts optional filters: `startDate`, `endDate`, `dataType` (sleep, body, daily)
**And** returns relevant biometric data from Soma: sleep sessions (duration, quality, stages), daily summaries (resting HR, HRV), body measurements (weight)

**AC 2 — Soma integration**
**Given** the Soma component
**When** `readBiometrics` executes with `dataType: "sleep"`
**Then** it calls `soma.listSleep` filtered by userId and date range
**When** called with `dataType: "daily"`
**Then** it calls `soma.listDaily` for HR/HRV data
**When** called with `dataType: "body"`
**Then** it calls `soma.listBody` for weight/measurements

**AC 3 — RBAC enforcement**
**Given** an authenticated user
**When** `readBiometrics` executes
**Then** all Soma queries filter by the authenticated userId

**AC 4 — Coach prompt update**
**Given** the Coach OS prompt
**When** rebuilt for conversation
**Then** it includes `readBiometrics` with description: "Use when the user asks about their sleep, recovery, HRV, resting heart rate, or when you need recovery context before recommending session intensity"

### Story 11.6: Read Training Load Metrics Tool

As a runner,
I want the coach to know my current training load, fatigue balance, and readiness,
So that the coach can make load-aware decisions about session intensity and volume.

**Acceptance Criteria:**

**AC 1 — Tool definition**
**Given** the coach tool registry
**When** a new `readTrainingLoad` tool is defined
**Then** it accepts no arguments (computes for authenticated user)
**And** returns: ATL (acute training load), CTL (chronic training load), TSB (training stress balance), readiness score, readiness factors, injury risk level, injury risk factors, overtraining risk, volume change %, recent patterns (last 7/28 day volume and run counts)

**AC 2 — Inference engine integration**
**Given** the inference engine in `lib/inferenceEngine.ts`
**When** `readTrainingLoad` executes
**Then** it calls the inference engine with the user's Soma activity data
**And** returns the computed `CurrentStateCalculation` with confidence scores and data quality indicators

**AC 3 — RBAC enforcement**
**Given** an authenticated user
**When** `readTrainingLoad` executes
**Then** it fetches activities only for the authenticated user's runner before passing to the inference engine

**AC 4 — Coach prompt update**
**Given** the Coach OS prompt
**When** rebuilt for conversation
**Then** it includes `readTrainingLoad` with description: "Use when the user asks about their fitness trend, fatigue, freshness, readiness to train hard, or when you need load context before proposing intensity changes"

---

## Epic 12: Coach Modifies the Plan

Extend the coach's write capabilities with new session creation and deletion tools, batch operations, and ensure all existing action tools integrate cleanly with the expanded toolset.

**RBAC Mandate:** Every write tool follows the same enforcement chain: `getAuthUserId` → `getAuthenticatedRunner` → `getOwnedSession` (or plan ownership check). No mutation executes without verifying the authenticated user owns the target resource. The approval UI card is a UX gate; the RBAC check is the security gate — both must pass.

### Story 12.1: Audit and Extend Existing Action Tools

As a runner,
I want the existing session action tools (reschedule, modify, swap, skip) to work reliably within the expanded coach toolset,
So that the full set of plan modification capabilities is consistent and complete.

**Acceptance Criteria:**

**AC 1 — Audit existing tools**
**Given** the 4 existing action tools (`proposeRescheduleSession`, `proposeModifySession`, `proposeSwapSessions`, `proposeSkipSession`)
**When** reviewed against the PRD requirements
**Then** verify each tool: has proper Zod schema, uses `getAuthenticatedRunner` + `getOwnedSession` for RBAC, returns structured data the UI card can render, handles error cases (session not found, unauthorized)

**AC 2 — Extend if needed**
**Given** the existing tools may have been built for a narrower scope
**When** gaps are identified (e.g., missing fields in modify, insufficient error messages)
**Then** extend the tools to cover the full FR7-FR10 requirements without breaking existing functionality

**AC 3 — Consistent tool naming and descriptions**
**Given** the expanded toolset will include new tools from stories 12.2-12.4
**When** reviewing existing tool descriptions in the coach prompt
**Then** update descriptions to be consistent with the new tools so the LLM selects the right tool for each user request

**AC 4 — Rejection handling**
**Given** a user rejects a proposed change
**When** the rejection is processed
**Then** the coach acknowledges the rejection conversationally and offers an alternative approach or asks what the user would prefer instead (FR16)

### Story 12.2: Create Planned Session Tool + Card

As a runner,
I want to ask the coach to add a new session to my plan (e.g., "add an easy recovery jog on Wednesday"),
So that I can fill gaps or add sessions without manually editing the calendar.

**Acceptance Criteria:**

**AC 1 — Tool definition**
**Given** the coach tool registry
**When** a new `proposeCreateSession` tool is defined
**Then** it accepts: `scheduledDate`, `sessionType`, `sessionSubtype` (optional), `targetDurationSeconds`, `effortLevel`, `targetPaceMin`/`targetPaceMax` (optional), `justification`
**And** the tool validates that the date doesn't conflict with an existing key session on the same day

**AC 2 — Convex mutation**
**Given** a new `createPlannedSession` mutation in `actionMutations.ts`
**When** executed after user approval
**Then** it creates a new planned session record linked to the user's active plan and runnerId
**And** enforces RBAC: `getAuthenticatedRunner` verifies the user owns the target plan
**And** sets status to "scheduled" and populates all required fields

**AC 3 — CreateSessionCard UI component**
**Given** the coach calls `proposeCreateSession`
**When** the tool result renders in the chat
**Then** a `CreateSessionCard` displays: session type, date, duration, effort, pace targets (if set), justification
**And** the card has Approve and Reject buttons
**And** Approve triggers the `createPlannedSession` mutation
**And** Reject sends rejection feedback to the coach

**AC 4 — CoachToolRenderer integration**
**Given** `CoachToolRenderer.tsx` dispatches tool results to card components
**When** a `proposeCreateSession` tool result arrives
**Then** it routes to the new `CreateSessionCard` component

### Story 12.3: Delete Planned Session Tool + Card

As a runner,
I want to ask the coach to remove a session from my plan (e.g., "remove Thursday's session entirely"),
So that I can clean up sessions that no longer make sense without just skipping them.

**Acceptance Criteria:**

**AC 1 — Tool definition**
**Given** the coach tool registry
**When** a new `proposeDeleteSession` tool is defined
**Then** it accepts: `sessionId`, `reason`
**And** the tool reads the session to display its details in the card before deletion

**AC 2 — Convex mutation**
**Given** a new `deletePlannedSession` mutation in `actionMutations.ts`
**When** executed after user approval
**Then** it deletes (or marks as removed) the planned session record
**And** enforces RBAC: `getAuthenticatedRunner` + `getOwnedSession` verifies the user owns the session
**And** throws `NOT_FOUND` if session doesn't exist or doesn't belong to the user

**AC 3 — DeleteSessionCard UI component**
**Given** the coach calls `proposeDeleteSession`
**When** the tool result renders in the chat
**Then** a `DeleteSessionCard` displays: the session being deleted (type, date, duration), the reason for deletion
**And** the card has Approve and Reject buttons with a warning tone (destructive action)

**AC 4 — CoachToolRenderer integration**
**Given** `CoachToolRenderer.tsx`
**When** a `proposeDeleteSession` tool result arrives
**Then** it routes to the `DeleteSessionCard` component

### Story 12.4: Batch Session Proposal Card

As a runner,
I want the coach to propose multiple session changes at once (e.g., "reschedule my whole week"),
So that complex plan adjustments feel like one decision, not five separate approvals.

**Acceptance Criteria:**

**AC 1 — Tool definition**
**Given** the coach tool registry
**When** a new `proposeBatchChanges` tool is defined
**Then** it accepts an array of changes, each with: `action` (reschedule | modify | skip | create | delete), `sessionId` (for existing sessions), `details` (action-specific fields), `reason`
**And** the tool validates all changes can be applied without conflicts

**AC 2 — WeekOverviewCard UI component**
**Given** the coach calls `proposeBatchChanges`
**When** the tool result renders in the chat
**Then** a `WeekOverviewCard` displays: a before/after view of the affected sessions, each change listed with its action type and reason, a single Approve All / Reject All button pair
**And** optionally allows individual change toggles if feasible

**AC 3 — Batch mutation execution**
**Given** the user taps Approve on a batch proposal
**When** the approval is processed
**Then** all changes execute within a single Convex mutation (or sequenced mutations) so that partial failure doesn't leave the plan in an inconsistent state (NFR-R1)
**And** the coach confirms all changes with a summary after completion

**AC 4 — Coach prompt guidance**
**Given** the Coach OS prompt
**When** rebuilt for conversation
**Then** it includes guidance for when to use `proposeBatchChanges` vs. individual tools: "Use batch changes when the user's request affects 3+ sessions (e.g., restructure a week, handle multiple missed days). Use individual tools for single-session changes."

---

## Epic 13: Coach Intelligence & Data Presentation

Upgrade the coach's system prompt to leverage the new tools intelligently and add generative UI cards for structured data presentation.

### Story 13.1: Data Summary and Week Overview Cards

As a runner,
I want to see my training data presented visually in the chat when the coach looks up my data,
So that I can quickly grasp my training picture without reading walls of text.

**Acceptance Criteria:**

**AC 1 — DataSummaryCard UI component**
**Given** the coach reads training data via any read tool
**When** the coach decides to present data visually (determined by prompt guidance)
**Then** a `renderDataSummary` UI tool is available that renders a `DataSummaryCard` with: a title (e.g., "Your March Training Summary"), key-value metric rows with labels, trend indicators (up/down/stable arrows), and optional color coding (green/yellow/red for status)

**AC 2 — WeekOverviewCard for read-only use**
**Given** the `WeekOverviewCard` from Story 12.4 exists
**When** the coach wants to show the current week's plan without proposing changes
**Then** the card renders in read-only mode (no approve/reject buttons) showing each day's session type, duration, and status

**AC 3 — CoachToolRenderer integration**
**Given** `CoachToolRenderer.tsx`
**When** `renderDataSummary` or read-only `renderWeekOverview` tool results arrive
**Then** they route to the correct card components

**AC 4 — UI tool definitions**
**Given** the UI tool registry in `tools/index.ts`
**When** `renderDataSummary` and `renderWeekOverview` are defined
**Then** each has a Zod schema specifying the data structure (title, metrics array, optional trend indicators)
**And** clear descriptions so the LLM knows when to use visual presentation vs. text

### Story 13.2: Coach OS Prompt Upgrade

As a runner,
I want the coach to intelligently select the right tools, reason about training science, and give me honest, data-backed coaching,
So that the coach feels like an expert, not a command executor.

**Acceptance Criteria:**

**AC 1 — Tool selection guidance**
**Given** the Coach OS prompt in `coach_os.ts`
**When** the prompt is updated with all new tools
**Then** it includes a "Tool Selection Guide" section mapping user intent patterns to tools:
- "How am I doing?" / "How's my training?" → `readActivities` + `readTrainingLoad` + `renderDataSummary`
- "What's planned for this week?" → `readPlannedSessions` + `renderWeekOverview`
- "I can't run today" / "Move my session" → `readPlannedSessions` (to see context) → appropriate write tool
- "Is it safe to run?" → `readRunnerProfile` + `readBiometrics` + `readTrainingLoad`
- "Add a recovery run" → `proposeCreateSession`
- Requests affecting 3+ sessions → `proposeBatchChanges`

**AC 2 — Training science reasoning instructions**
**Given** the Coach OS prompt
**When** the coach is about to propose plan changes
**Then** the prompt instructs the coach to: check hard/easy alternation, verify weekly volume doesn't spike >10%, respect recovery day placement after hard sessions, never stack 2 quality sessions on consecutive days, reference the safeguards table principles

**AC 3 — Data honesty instructions**
**Given** the Coach OS prompt
**When** a read tool returns incomplete or no data
**Then** the prompt instructs the coach to: say what data is missing ("I don't have sleep data for the last 3 days"), explain the impact on its recommendation ("so I'm being conservative"), never fabricate or assume data

**AC 4 — Narrative interpretation instructions**
**Given** the Coach OS prompt
**When** the coach receives raw data from read tools
**Then** the prompt instructs the coach to: translate metrics into plain language appropriate to the user's experience level (from runner profile), lead with the story ("Your aerobic base is growing steadily") before the numbers ("volume up 22→31km"), connect data points to the user's goals and plan phase

**AC 5 — Safeguard awareness**
**Given** the Coach OS prompt
**When** the coach proposes any write operation
**Then** the prompt includes key safeguard principles: volume increase caps (max 10%/week), intensity ceilings for newer runners, mandatory recovery days after hard sessions, injury history precautions
**And** instructs the coach to reference these when explaining proposals

---

## Epic 14: Plan Regeneration from Conversation (Post-Beta)

Allow the coach to handle fundamental plan changes — goal pivots, major life changes, starting over — by guiding the user through a structured conversation and triggering the existing plan generation pipeline.

### Story 14.1: Detect Plan Regeneration Intent

As a runner,
I want the coach to recognize when my request requires a completely new plan rather than session-level tweaks,
So that the coach doesn't try to patch a fundamentally changed situation with band-aids.

**Acceptance Criteria:**

**AC 1 — Intent detection in prompt**
**Given** the Coach OS prompt
**When** updated for plan regeneration capability
**Then** it includes intent detection guidance: "If the user wants to change their goal type (e.g., 10K → half marathon), change their target race date significantly (>4 weeks shift), start over after extended absence, or fundamentally restructure their training — this requires plan regeneration, not session modification"

**AC 2 — Coach behavior on detection**
**Given** the coach detects a plan regeneration intent
**When** processing the user's message
**Then** the coach explains why this needs a new plan, not a patch: "Switching from a 10K to a half marathon changes everything — the phase structure, weekly volume targets, session types. Let me walk you through building a new plan."
**And** the coach does NOT attempt to use session modification tools for this

**AC 3 — User confirmation**
**Given** the coach has identified a regen intent
**When** it explains the situation
**Then** it asks the user to confirm before proceeding: "Want me to build a new plan for you? I'll ask a few questions to get it right."

### Story 14.2: Structured Goal Capture Conversation

As a runner,
I want the coach to ask me the right questions to define my new plan,
So that the regenerated plan is as tailored as my original one.

**Acceptance Criteria:**

**AC 1 — Goal capture tool**
**Given** the coach tool registry
**When** a new `captureNewPlanGoal` tool is defined
**Then** it acts as a structured data collection tool that the coach fills progressively through conversation
**And** captures: goalType (race/speed/base_building/return_to_fitness/general_health), raceDistance (if race), targetDate (if race), targetTime (optional), any changed constraints (schedule, injuries, etc.)

**AC 2 — Conversational flow**
**Given** the coach is in plan regeneration mode
**When** it guides the user through goal capture
**Then** it asks questions conversationally (not as a form): "What's the new goal?", "When's the race?", "Any target time in mind or just finish?", "Has anything changed with your schedule or health since we last set up?"
**And** it leverages existing runner profile data so it doesn't re-ask things that haven't changed

**AC 3 — Completion check**
**Given** the coach has gathered enough parameters
**When** it has: goal type + target date (if race) + confirmation that other profile data is still accurate
**Then** it summarizes the parameters and asks for confirmation before triggering generation

### Story 14.3: Trigger Plan Generation and Present New Plan

As a runner,
I want the coach to generate a new plan using the same pipeline as onboarding and show it to me for approval,
So that I get a plan of the same quality as my original, with the option to accept or reject it.

**Acceptance Criteria:**

**AC 1 — Plan generation trigger**
**Given** the user has confirmed new plan parameters
**When** the coach triggers plan generation
**Then** it calls the existing `generateAndPersistPlan` mutation (or an adapted version) with the updated runner profile and new goal parameters
**And** a thinking/loading indicator is shown during generation

**AC 2 — New plan presentation**
**Given** the plan generation completes
**When** the new plan is ready
**Then** the coach presents it with: a summary of the plan structure (phases, duration, key milestones), how it differs from the old plan, the weekly breakdown for the first 2-3 weeks
**And** renders visualization components if available (radar chart update, progression chart)

**AC 3 — Approval flow**
**Given** the new plan is presented
**When** the user approves
**Then** the new plan becomes the active plan, the old plan is archived (status changed to "replaced"), and all future sessions are from the new plan
**When** the user rejects
**Then** the old plan remains active, the generated plan is discarded, and the coach acknowledges and offers to adjust parameters

**AC 4 — RBAC enforcement**
**Given** the plan generation and replacement flow
**When** executing
**Then** all mutations verify the authenticated user owns both the old and new plans
**And** no plan data from other users is accessed or affected

---

## Implementation Sequence

| Phase | Stories | Rationale |
|-------|---------|-----------|
| **Phase 1: Read Foundation** | 11.1, 11.2, 11.3, 11.4, 11.5, 11.6 | Coach needs to read before it can act intelligently. Each read tool is independent — can be built in parallel. |
| **Phase 2: Write Extensions** | 12.1, 12.2, 12.3, 12.4 | Build on read tools. 12.1 (audit existing) first, then 12.2/12.3 (new tools) can be parallel, 12.4 (batch) last as it composes the others. |
| **Phase 3: Intelligence Layer** | 13.1, 13.2 | Requires all tools to exist. 13.1 (cards) and 13.2 (prompt) can be developed in parallel. |
| **Phase 4: Plan Regen (Post-Beta)** | 14.1, 14.2, 14.3 | Sequential — detect → capture → generate. Depends on all prior epics being stable. |