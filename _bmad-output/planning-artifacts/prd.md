---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments:
  - product-brief-Cadence-2026-02-10.md
  - prd-onboarding-mvp.md
  - epics.md
  - research/technical-ai-coach-context-architecture-research-2026-02-15.md
  - research/training-engine-architecture.md
  - architecture-backend-v2.md
documentCounts:
  brief: 1
  research: 2
  architecture: 1
  existingPrd: 1
  existingEpics: 1
workflowType: 'prd'
scope: 'Coach Plan Interaction Feature'
classification:
  projectType: 'mobile_app'
  domain: 'consumer_fitness_ai_coaching'
  complexity: 'medium'
  projectContext: 'brownfield'
---

# Product Requirements Document - Cadence

**Author:** NativeSquare
**Date:** 2026-03-31
**Scope:** Coach Plan Interaction Feature

---

## Executive Summary

**Product:** Cadence — AI running coach with visible reasoning
**Scope:** Coach Plan Interaction — extending the AI coach to read all user training data and perform CRUD operations on training plans and planned sessions
**Differentiator:** The coach doesn't just talk — it acts on the plan with approval-gated intelligence
**Target Users:** Existing Cadence runners with active training plans
**Core Value:** "I can't run today" → coach reshuffles the plan intelligently → user approves → done

---

## Success Criteria

### User Success

**The "It Actually Did It" Moment:**
The user asks the coach to change something about their plan in natural language, and the coach proposes an intelligent adaptation — not just a mechanical move, but a contextually aware reshuffling that respects training principles. The user taps approve, their calendar updates, and they think: "this thing actually coaches."

**The "It Sees Everything" Moment:**
The user asks "how am I doing?" or "why did last week feel so hard?" and the coach pulls from their full training history — activities, sleep, biometrics, load metrics — and delivers a narrative answer that connects the dots they couldn't connect themselves.

**Specific criteria:**
- User can request any plan modification in natural language and receive a sensible proposal within one conversational turn
- Coach reads and correctly interprets all available user data (activities, sleep, HRV, training load, planned sessions, plan structure) when answering questions
- Action cards clearly show what will change, with approve/reject flow
- After approval, plan state updates immediately and the coach confirms the change conversationally
- Coach respects training science when adapting — doesn't just blindly move sessions, redistributes load intelligently

### Business Success

| Metric | Target | Rationale |
|--------|--------|-----------|
| **Feature adoption** | >60% of active users interact with plan modification tools within first 2 weeks | Core value prop — if they don't use it, the feature failed |
| **Session compliance post-interaction** | Maintain or improve >75% compliance rate | Coach modifications should increase trust, not disrupt it |
| **Retention lift** | Measurable D30 retention improvement vs. pre-feature baseline | This is a stickiness play — the coach becomes indispensable |
| **Coach conversation depth** | Average conversation length increases (more back-and-forth per session) | Users engaging more = users trusting more |

### Technical Success

| Dimension | Requirement |
|-----------|-------------|
| **Tool call latency** | Action proposal rendered <5 seconds from user request (thinking indicator shown immediately) |
| **Data read accuracy** | Coach correctly references actual user data — no hallucinated metrics |
| **RBAC enforcement** | All read/write tools enforce user-owns-data constraint — zero cross-user data leakage |
| **Mutation safety** | All plan modifications are transactional — no partial updates on failure |
| **Streaming continuity** | Tool calls don't break the SSE stream — conversation continues naturally after tool execution |

### Measurable Outcomes

| Outcome | Measurement |
|---------|-------------|
| Natural language → correct tool selection | >90% of user plan-related requests trigger the right tool |
| Approval rate on proposed changes | >70% (if users reject most proposals, the coach isn't smart enough) |
| Data query satisfaction | User doesn't need to repeat/rephrase >80% of data questions |
| Zero security incidents | No cross-user data access in any tool call |

## Product Scope

### MVP — Minimum Viable Product

**Read Tools (Coach can query user data on-demand):**
- Read runner profile (unified object with inferred metrics)
- Read planned sessions (by week, by date range, by status)
- Read training plan structure (season view, weekly plan, current phase)
- Read completed activities (from Soma — runs, pace, HR, duration)
- Read biometric data (sleep, HRV, resting HR, body measurements)
- Read training load metrics (ATL, CTL, TSB, readiness score)

**Write Tools (Coach can propose plan modifications):**
- Create new planned session (e.g., "add an easy recovery jog on Wednesday")
- Delete/remove a planned session
- Modify existing session details (duration, effort, pace targets, type)
- Reschedule session to different date
- Swap two sessions' dates
- Skip session with reason

**Generative UI:**
- Action cards for each write operation with approve/reject
- Data summary cards when coach presents queried data (e.g., weekly load summary, recent activity recap)

**Coach Intelligence:**
- System prompt updated with tool descriptions so coach selects the right tool
- Coach reasons about training science when proposing changes (not just mechanical operations)

**Plan Regeneration (In scope, sequenced post-beta):**
- Full plan regeneration from conversation — "I want to change my goal to a half marathon" triggers plan re-generation through the same onboarding-style process
- Sequenced last because it depends on all other tools working reliably first

### Vision (Future)

- Coach becomes the primary interface for all plan management — users stop using the calendar/plan screens directly
- Coach learns individual modification patterns over time (this user always skips Mondays → preemptively suggest)
- Cross-runner intelligence — "Runners with your profile who skip tempo runs tend to benefit from replacing with fartlek instead"

---

## User Journeys

### Journey 1: Alex — "The Tuesday Wrench"

**Persona:** Alex, 32, software engineer. 5x/week runner chasing sub-35 10K. Week 4 of an 8-week plan. Today is Tuesday — tempo session scheduled.

**Opening Scene:**

Alex's morning implodes. A production incident pulls him into back-to-back meetings starting at 9AM. By noon he knows the day is gone. He opens Cadence's coach tab during a break and types: *"Hey, I can't run today. Work emergency. Can we move the tempo?"*

**Rising Action:**

The coach processes the request. It reads Alex's current week plan, checks what's scheduled for the remaining days, and considers his training load. A thinking indicator appears briefly.

The coach responds: *"No problem. Your tempo session is key this week — I don't want to just push it to tomorrow because you've got intervals on Thursday and stacking hard days would cook you. Here's what I'm thinking:"*

An action card appears:

```
📋 Plan Adjustment Proposal
━━━━━━━━━━━━━━━━━━━━━━━━
• Tuesday (today): Skip → Rest day
• Wednesday: Easy run → Tempo session (moved from Tue)
• Thursday: Intervals → Easy run (moved from Wed)
• Friday: Rest → Intervals (moved from Thu)

Reason: Maintains hard/easy alternation. 
No back-to-back quality sessions.

[✓ Approve]  [✗ Reject]
```

**Climax:**

Alex reads the proposal. The coach didn't just move one session — it intelligently cascaded the change to preserve the hard/easy pattern. He taps Approve.

The coach confirms: *"Done. Your week is reshuffled. Wednesday's tempo is the same session — 6x1km at 3:25-3:30/km with 90s recovery. Get some rest today."*

**Resolution:**

Alex closes the app in under 60 seconds. No manual calendar dragging, no guesswork about whether moving one session breaks the week. The coach handled it like a real coach would.

### Journey 2: Lucie — "The Anxiety Check"

**Persona:** Lucie, 41, comeback runner. Week 3 of a trust-rebuilding protocol. Easy runs only so far. Today: scheduled 35-minute easy run.

**Opening Scene:**

Lucie wakes up and her left calf feels tight. Not painful — just tight. Her heart rate spikes (mentally, not physically). She opens Cadence and types: *"My calf feels a bit tight this morning. Not painful but I'm nervous. Is it safe to run today?"*

**Rising Action:**

The coach reads Lucie's runner profile (calf tear history flagged), her recent activities (3 easy runs in the last 5 days, all completed without issue), her sleep data (7.2 hours, good quality), and her current readiness score.

The coach responds thoughtfully: *"I hear you — with your history, tight calf is going to set off alarm bells, and that's completely rational. Let me look at your data."*

A data summary card appears:

```
📊 Your Recent Picture
━━━━━━━━━━━━━━━━━━━━━
Last 3 runs: Completed, all easy pace ✓
Sleep last night: 7.2h (good)
Resting HR: 52 bpm (normal range)
Training load: Light — no overload signals
Readiness: 78/100

No red flags in the data.
```

*"The tightness could be normal adaptation — you've done 3 runs in 5 days, which is more activity than your body has seen in a while. Your data looks clean. But here's what I'd suggest:"*

An action card appears:

```
📋 Session Modification Proposal
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Today: 35min easy → 25min easy (reduced)
• Add: 5min walking warmup before run
• Note: If calf tightness increases during 
  the run, walk home. That's not failure.

[✓ Approve]  [✗ Reject]
```

**Climax:**

Lucie taps Approve. The coach didn't dismiss her fear. It didn't tell her to skip. It gave her a safe middle ground — backed by data — with explicit permission to stop.

**Resolution:**

Lucie runs 25 minutes. The calf loosened up by minute 8. She comes back and tells the coach: *"It was fine! Calf loosened up."* The coach stores that feedback in memory for future reference.

### Journey 3: Karim — "The Curious Learner"

**Persona:** Karim, 26, 8 months running. Week 6 of a base-building plan. No specific concern — just curious.

**Opening Scene:**

Karim opens the coach after his Sunday long run and types: *"How has my training been going this month?"*

**Rising Action:**

The coach reads Karim's completed activities for the last 4 weeks, his training load metrics, planned vs. actual compliance, and his runner profile.

A data summary card renders:

```
📊 Your March Training Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Weekly volume: 22km → 26km → 28km → 31km 📈
Sessions completed: 14/16 (88% compliance)
Easy pace trend: 6:15/km → 6:02/km (improving)
Long run: 8km → 10km → 11km → 13km 📈
Rest days taken: 8 (good)
```

The coach narrates: *"Honestly? Really solid month. Your volume has grown steadily — 22km to 31km — and you've done it without skipping many sessions. Two things stand out: your easy pace is naturally coming down, which means your aerobic engine is building. And your long run has grown from 8km to 13km in four weeks, which is exactly the kind of progression we want."*

*"One thing to watch: you're approaching the point where I'll want to add a recovery week — a lighter week to let your body consolidate the gains. That'll probably be next week."*

**Climax:**

Karim doesn't need to know what CTL or ATL means. The coach translated his data into a story he can understand and gave him something to look forward to.

**Resolution:**

Karim screenshots the summary card and sends it to his running group chat. This is the organic distribution moment the product brief envisioned.

### Journey 4: Edge Case — "The Blow-Up Week"

**Persona:** Any runner. Week 5 of a plan. Missed Monday, Tuesday, Wednesday due to flu. It's now Thursday.

**Opening Scene:**

The runner opens the coach: *"I've been sick since Sunday. Flu knocked me out. I'm feeling better today — what do I do?"*

**Rising Action:**

The coach reads the plan, sees 3 sessions marked as not completed, checks the runner's most recent biometric data (if available), and assesses the gap.

*"Welcome back. Three missed days with a flu is no joke — your body was fighting, not recovering from training. Let me look at your week and figure out the best path forward."*

An action card appears:

```
📋 Week Recovery Proposal
━━━━━━━━━━━━━━━━━━━━━━━━
• Mon (missed): Skip — illness
• Tue (missed): Skip — illness  
• Wed (missed): Skip — illness
• Thu (today): Replace intervals → Easy 25min
• Fri: Keep easy run as scheduled
• Sat: Replace long run 14km → Easy 8km
• Sun: Rest

Reason: Post-illness return protocol. 
First 3 days back should be easy only. 
Volume reduced ~50%. Next week rebuilds.

[✓ Approve]  [✗ Reject]
```

**Climax:**

The coach didn't just delete the missed sessions — it restructured the rest of the week with a post-illness protocol, reduced volume, and removed all intensity work. Training science, not calendar shuffling.

**Resolution:**

The runner approves. The week is rebuilt in one interaction. No manual editing of 6 sessions individually.

### Journey 5: Plan Regeneration — "The Goal Pivot" (Post-Beta)

**Persona:** Alex, now week 7 of his 10K plan. Race got cancelled.

**Opening Scene:**

Alex types: *"My 10K race got cancelled. I want to switch to training for a half marathon in September instead."*

**Rising Action:**

The coach recognizes this is a fundamental plan change — not a session-level modification. It initiates a structured conversation (similar to onboarding) to capture the new goal:
- Confirm: half marathon distance, September target date
- Discuss: target time or open training?
- Review: current fitness level (coach reads all existing data)
- Propose: new plan structure

**Climax:**

After the conversation, the coach triggers full plan regeneration through the existing plan generation pipeline, using the runner's current data and new goal parameters. A new plan is generated and presented with the same visualization flow as onboarding (radar chart, progression chart, calendar).

**Resolution:**

Alex's entire plan is replaced. The coach explains the transition: *"I've kept your base — you've built solid aerobic fitness over the last 7 weeks. The half plan starts in a build phase, not base, because you've earned that."*

### Journey Requirements Summary

| Capability | Revealed By |
|------------|-------------|
| Read planned sessions for current week | Alex (Journey 1) |
| Cascade session modifications (multi-session moves) | Alex (Journey 1) |
| Read runner injury history from profile | Lucie (Journey 2) |
| Read recent activities and biometrics | Lucie (Journey 2) |
| Read readiness/training load metrics | Lucie (Journey 2) |
| Modify session (reduce duration/effort) | Lucie (Journey 2) |
| Data summary card (generative UI) | Karim (Journey 3), Lucie (Journey 2) |
| Read multi-week activity history | Karim (Journey 3) |
| Interpret data in plain language narrative | Karim (Journey 3) |
| Bulk skip missed sessions | Blow-Up Week (Journey 4) |
| Restructure remaining week after gap | Blow-Up Week (Journey 4) |
| Create replacement sessions | Blow-Up Week (Journey 4) |
| Full plan regeneration from conversation | Goal Pivot (Journey 5) |
| Read all runner data for plan generation context | Goal Pivot (Journey 5) |

---

## Domain-Specific Requirements

### Health Data Handling

- **Wellness positioning only** — all coaching language frames insights as training guidance, never health diagnosis
- Coach must never say "your HRV indicates a cardiac condition" — instead "your HRV suggests you should take an easy day"
- Injury-related responses must include disclaimers when appropriate ("If pain persists, see a physiotherapist")

### Data Privacy & Compliance

| Regulation | Requirement |
|------------|-------------|
| **GDPR** | All new read tools must respect existing consent framework. No new data categories collected — coach reads existing data with existing consent |
| **API Terms** | Soma-sourced data (HealthKit, Strava) must be used per API terms — coaching insights only, no resale or aggregation |
| **Data minimization** | Read tools should request only the data needed for the current query, not dump everything into context |

### AI Safety

- Coach must never override safeguards from the safeguards table when proposing plan changes
- All proposed session modifications must respect existing load parameters (volume caps, intensity ceilings, recovery requirements)
- When uncertain, the coach should recommend conservative action and explain why
- Coach must never fabricate data — if a read tool returns no data, say so honestly

---

## Mobile App Specific Requirements

### Existing Infrastructure (Leveraged, Not Rebuilt)

| Component | Status | Location |
|-----------|--------|----------|
| Coach chat screen | ✅ Live | `apps/native/src/components/app/coach/` |
| Tool-calling pipeline | ✅ Live | `packages/backend/convex/ai/tools/` |
| SSE streaming | ✅ Live | `packages/backend/convex/ai/http_action.ts` |
| Action cards (4 types) | ✅ Live | `RescheduleSessionCard`, `ModifySessionCard`, `SkipSessionCard`, `SwapSessionsCard` |
| CoachToolRenderer | ✅ Live | `apps/native/src/components/app/coach/CoachToolRenderer.tsx` |
| RBAC pattern | ✅ Live | `getAuthenticatedRunner` + `getOwnedSession` in `actionMutations.ts` |
| Coach OS prompt | ✅ Live | `packages/backend/convex/ai/prompts/coach_os.ts` |

### New Components Required

| Component | Purpose |
|-----------|---------|
| Read tool Convex queries | New queries exposing training data to the AI tool-calling pipeline |
| CreateSessionCard | New generative UI card for proposed new sessions |
| DeleteSessionCard | New generative UI card for proposed session deletion |
| DataSummaryCard | New generative UI card for read-side data presentation |
| WeekOverviewCard | New generative UI card showing full week restructure proposals |
| New action tool definitions | Zod schemas + tool handlers for create/delete session tools |
| Read tool definitions | Zod schemas + tool handlers for all 6 read tools |
| Coach OS prompt updates | System prompt additions describing new tools |
| Action mutations for create/delete | Convex mutations with RBAC for new write operations |

### Offline & Network Behavior

Existing network resilience infrastructure applies (retry logic, SSE reconnection, partial message handling). No new offline requirements — plan modifications require network connectivity as they involve server-side mutations.

---

## Functional Requirements

### 1. Training Data Reading

- **FR1:** Coach can read the runner's full profile including inferred metrics (ATL, CTL, TSB, readiness, risk assessment, pace zones, HR zones)
- **FR2:** Coach can read planned sessions filtered by date range, week number, or status (scheduled, completed, skipped, modified)
- **FR3:** Coach can read the active training plan structure including season view, weekly plan breakdown, and current phase
- **FR4:** Coach can read completed activities from Soma (runs with pace, HR, duration, distance, cadence)
- **FR5:** Coach can read biometric data from Soma (sleep sessions, resting HR, HRV, body measurements)
- **FR6:** Coach can read computed training load metrics (ATL, CTL, TSB, readiness score, injury risk level)

### 2. Session Modification

- **FR7:** Coach can propose rescheduling a planned session to a different date (existing tool — extend if needed)
- **FR8:** Coach can propose modifying a session's details: duration, effort level, pace targets, session type (existing tool — extend if needed)
- **FR9:** Coach can propose swapping two sessions' dates (existing tool)
- **FR10:** Coach can propose skipping a session with a reason (existing tool)
- **FR11:** Coach can propose creating a new planned session on a specified date with session type, duration, effort, and pace targets
- **FR12:** Coach can propose deleting/removing a planned session from the plan
- **FR13:** Coach can propose multiple session changes in a single interaction (batch proposal displayed as one approval card)

### 3. Approval Flow

- **FR14:** User can see a clear summary of proposed changes in an action card before any mutation executes
- **FR15:** User can approve a proposed change, triggering the corresponding Convex mutation
- **FR16:** User can reject a proposed change, with the coach acknowledging and offering alternatives
- **FR17:** After approval, the coach confirms the change conversationally and the plan state reflects the update immediately

### 4. Data Presentation

- **FR18:** Coach can render a data summary card showing queried metrics in a structured visual format
- **FR19:** Coach can interpret raw training data in plain language narrative appropriate to the user's experience level
- **FR20:** Coach can render a week overview card showing the current or proposed week structure

### 5. Coach Intelligence

- **FR21:** Coach selects the appropriate tool based on natural language user input without requiring specific commands
- **FR22:** Coach applies training science principles when proposing plan modifications (hard/easy alternation, load distribution, recovery requirements)
- **FR23:** Coach respects safeguards and load parameters when proposing changes — never exceeds volume caps or violates recovery constraints
- **FR24:** Coach acknowledges data gaps honestly when read tools return incomplete or missing data
- **FR25:** Coach references the runner's specific data (not generic advice) when explaining proposals or answering questions

### 6. Plan Regeneration (Post-Beta)

- **FR26:** Coach can detect when a user request requires full plan regeneration (goal change, major life change, starting over)
- **FR27:** Coach can initiate a structured conversation to capture new plan parameters (goal type, target race, timeline)
- **FR28:** Coach can trigger the existing plan generation pipeline with updated parameters and present the new plan
- **FR29:** User can approve or reject the newly generated plan before it replaces the current one

### 7. Security & Data Access

- **FR30:** All read tools enforce authenticated user context — coach can only read data belonging to the current user's runner profile
- **FR31:** All write tools enforce ownership verification — mutations check that the target session/plan belongs to the authenticated user's runner
- **FR32:** No tool call can access, modify, or return data from another user's profile, plan, or sessions

---

## Non-Functional Requirements

### Performance

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **NFR-P1:** Read tool results should return to coach context | <2 seconds | Coach needs data quickly to formulate response |
| **NFR-P2:** Action card should render after coach decision | <5 seconds from user message | Thinking indicator shown immediately; card appears when ready |
| **NFR-P3:** Mutation execution after approval tap | <1 second | Plan update must feel instant after user commits |
| **NFR-P4:** Data summary card rendering | <1 second after data available | Visual cards must feel snappy |

### Security

| Requirement | Description |
|-------------|-------------|
| **NFR-S1:** All tool calls execute within authenticated Convex context | Leverage existing `getAuthUserId` + runner ownership pattern |
| **NFR-S2:** Read tool results must not be logged with PII in plain text | Consistent with existing health data logging policy |
| **NFR-S3:** Tool call arguments and results must be included in conversation persistence | For audit trail and conversation continuity |

### Reliability

| Requirement | Description |
|-------------|-------------|
| **NFR-R1:** Failed mutations must not leave plan in partial state | Convex transactions provide this natively |
| **NFR-R2:** If a tool call fails, coach must report the failure gracefully and offer alternatives | No silent failures |
| **NFR-R3:** Network interruption during a multi-step proposal must not auto-execute pending approvals | Approval state must be explicit |

### Accessibility

| Requirement | Description |
|-------------|-------------|
| **NFR-A1:** Action cards must have minimum 44pt touch targets for approve/reject buttons | iOS accessibility standard |
| **NFR-A2:** Data summary cards must be readable at system font size settings | Respect user accessibility preferences |
| **NFR-A3:** Color must not be the sole indicator of approve vs. reject | Support for color blindness |
