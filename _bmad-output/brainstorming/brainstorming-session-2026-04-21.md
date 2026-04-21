---
stepsCompleted: [1, 2, 3]
inputDocuments: []
session_topic: "Cadence's coaching intelligence layer — architecture and signal-to-insight mapping, powered by Soma health data"
session_goals: "(A) Design conceptual architecture of the intelligence layer — modules, components, reasoning flow. (B) Map specific Soma signals → specific coaching insights/moments. (C) Explore Coach Personality as a user-configurable layer (behavioral preferences)."
selected_approach: 'ai-recommended'
techniques_used: ['First Principles Thinking', 'Architectural Synthesis']
ideas_generated: ['16 foundational axioms', 'Unified 8-step pipeline', 'Body + Mind specialist model', 'Router-as-Coach reframe', '2 MVP tools']
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** NativeSquare
**Date:** 2026-04-21

## Session Overview

**Topic:** Cadence's coaching intelligence layer — the cognitive system that turns Soma's health data inputs into personalized coaching.

**Goals:**

- **A. Conceptual architecture** — modules/components and reasoning flow
- **B. Signal-to-insight mapping** — how inputs become coaching moments
- **C. Coach Personality** — user-configurable behavioral preferences (deferred post-MVP)

**Constraint:** Blank-slate thinking — ignore what's currently built in the codebase.

**Approach:** AI-Recommended Techniques (First Principles Thinking, then Architectural Synthesis).

---

## 🧭 Core Philosophy

Cadence is a **Craftsperson Coach** — a respectful expert servant that masters the craft of training physiology on behalf of an athlete who has already decided what to build.

- Takes the athlete's stated goal at face value. Does not play therapist.
- Overrides the athlete only for physical safety (injury, overtraining).
- Ships with **one coherent identity**, not a configurable personality shell.
- Earns the right to speak each time. Silence is often correct.
- Is auditable: every recommendation carries its reasoning.

This philosophy is **load-bearing** — every architectural decision traces back to it.

---

## 🧱 Foundational Axioms

16 axioms surfaced in First Principles work. Grouped by role.

### On what coaching **is**

1. **The Oracle is not a Coach.** A queryable mirror is not a coach. Coaching requires *unsolicited intervention* — the system decides *when* to speak.
2. **Forecast, don't describe.** Outputs must be predictions about futures, not snapshots of now.
3. **Insight = Signal × Schedule × Stakes.** The architectural atom is a multi-input join, not a single signal.
4. **Trust = Explicability on demand.** Every recommendation carries a reasoning trace, whether shown or not.

### On what the coach **knows**

5. **Archetype priors.** Population-level knowledge ("runners feel X before races") is a distinct source of intelligence, separate from user data and domain science.
6. **Memory-driven triggers.** The coach remembers what the user *said* — utterances are future coaching fuel.
7. **Calendar of Meaning.** The coach holds a chronology of personally-meaningful dates (first race, PR, injury return) — narrative, not just data.

### On **when** the coach speaks

8. **Multiple trigger engines, not one.** Proactivity is a constellation: risk/opportunity, lifecycle anticipation, morning signal-schedule fusion, plan-reality delta, memory callback, narrative milestone.
9. **Presence without noise.** "Just checking in" is spam. The coach *earns* the right to speak each time — most candidate moments die at the gate.
10. **Calibrated explanation.** The coach has a model of what the athlete finds counterintuitive; explanation density adapts accordingly.

### On **what** the coach touches

11. **Plan is skeletal, expectations are ecosystemic.** The plan vocabulary is small; the coach watches everything around it. Surface ratio ~1:10.
12. **4-session atom.** Plan vocabulary = {Easy, Tempo, Long, Race} × training blocks. Every coaching output routes to this atom or stays silent.
13. **Craftsperson, not Guru.** Cadence refuses the meta-layer. Not a life coach, not a therapist, not a motivator asking "why do you run?" Principled exclusion.

### On how the coach is **built**

14. **Some truths are personality dimensions, not universals.** Distinguishes universal axioms from configurable knobs (knobs come later).
15. **MVP as coherent identity.** Cadence ships as *a specific coach*, not a framework. Opinionatedness is the value.
16. **Simplicity over secret intelligence.** No hidden inference the user can't inspect. Everything the system knows is in the explicit, renderable model.

---

## 🏗️ The Architecture — Unified Pipeline

One pipeline. Two entry types (reactive & proactive) converge at the Gateway. Everything flows through the same stages.

### The pipeline (8 stages)

```
  EVENT SOURCES
  ├── User chat message         (reactive)
  ├── Cron / time events        (proactive)
  ├── Soma data arrival         (proactive)
  └── System events             (proactive)
              │
              ▼
   ┌────────────────────┐
   │  1. GATEWAY        │   Normalizes to Event { type, payload, ts }
   │     (Event Bus)    │   Cheap, deterministic.
   └──────────┬─────────┘
              │
              ▼
   ┌────────────────────┐
   │  2. ROUTER AGENT   │   LLM-backed orchestrator. "The Coach itself."
   │   ("the Coach")    │   Holds plan + goal + time arc.
   │                    │   Reads the event, decides which advisors
   │                    │   to consult with what focused sub-queries.
   └──────────┬─────────┘
              │  (dispatches to 1..N specialists)
              │
       ┌──────┴──────┐
       ▼             ▼
   ┌─────────┐   ┌─────────┐
   │  BODY   │   │  MIND   │    Specialists — each produces a
   │         │   │         │    perspective (what + why + confidence).
   │ Soma    │   │ User    │
   │ Physio  │   │ Memory  │
   │ Science │   │ Feel    │
   └────┬────┘   └────┬────┘
        │             │
        └──────┬──────┘
               ▼
   ┌────────────────────┐
   │  3. SYNTHESIS      │   Router combines specialist perspectives
   │                    │   into a single CandidateMessage.
   └──────────┬─────────┘
              │
              ▼
   ┌────────────────────┐
   │  4. CANDIDATE POOL │   Holds candidates across events.
   └──────────┬─────────┘
              │
              ▼
   ┌────────────────────┐
   │  5. ARBITRATION    │   Dedup · Priority · Noise gate
   │                    │   (proactive only) · Rate limit.
   │                    │   Reactive mostly passes through.
   └──────────┬─────────┘
              │
              ▼
   ┌────────────────────┐
   │  6. EXPRESSION     │   Craftsperson voice. Embedded reasoning.
   │                    │   Explanation density adapts to context.
   └──────────┬─────────┘
              │
              ▼
   ┌────────────────────┐
   │  7. TOOL SELECTION │   Decide: plain message, or message + tool call?
   │                    │   (See MVP Tools below.)
   └──────────┬─────────┘
              │
              ▼
   ┌────────────────────┐
   │  8. DELIVERY       │   Post to chat. Record in Memory Store.
   │                    │   (Optional push notification.)
   └────────────────────┘
```

### Stage descriptions

| Stage | Responsibility |
|---|---|
| **1. Gateway** | Single front door. Normalizes all event types into one shape. Deterministic, no reasoning. |
| **2. Router Agent** | LLM-backed. This is "the Coach." Holds plan, goal, and time arc. Reads each event and decides which specialists to consult with what sub-queries. |
| **3. Synthesis** | Combines Body + Mind perspectives through the Router's strategic lens into one coherent `CandidateMessage`. |
| **4. Candidate Pool** | Buffer holding candidates before arbitration. |
| **5. Arbitration** | The "should I speak?" gate. Reactive = near pass-through. Proactive = full scrutiny; most candidates die here (Axiom #9). |
| **6. Expression** | Renders structured candidate into Craftsperson-voiced text with inline reasoning. |
| **7. Tool Selection** | Decides whether the message carries a tool-call card (action the user can Accept/Decline). |
| **8. Delivery** | Posts into the chat. Writes the action to Memory Store (the coach remembers what it said). |

### Reactive vs. Proactive — the only real difference

| | Reactive | Proactive |
|---|---|---|
| Trigger | User message event | Time / data / system event |
| Latency target | < 10 seconds | Not time-critical |
| Arbitration | Near pass-through | Full gauntlet (most die) |
| Stages 6–8 | Identical | Identical |

---

## 👥 The Coach and Its Advisors

The Router **is** the Coach. The specialists are its advisors. This mirrors how a real coach thinks: a strategist consulting expert inputs.

### 🧭 Router Agent = "The Coach"

- **Holds** the plan, the goal, the time arc (e.g., *Berlin in 5 weeks, base block, 2-week taper planned*).
- **Owns** the Craftsperson identity, the strategic lens, and the plan-stewardship logic (Axioms #11, #13, #15).
- **Decides** which specialists to consult for any given event.
- **Synthesizes** specialist perspectives into one coherent candidate message.

### 🫁 Body Specialist

- **Source of truth:** Soma data + training science + archetype priors.
- **Pulls from:** Signal Store (sleep, HRV, workouts, recovery), Archetype KB.
- **Reasons about:** physiology — fitness, fatigue, recovery, injury risk, readiness, trends.
- **Voice of authority:** *"The numbers say..."*
- **Cannot speak to:** anything subjective.

### 🧠 Mind Specialist

- **Source of truth:** what the user said, remembers, feels.
- **Pulls from:** Memory Store (utterances), Narrative Store (milestones), recent chat.
- **Reasons about:** subjective state — confidence, fear, motivation, life context, stated goals.
- **Voice of authority:** *"You told me..."* / *"You're feeling..."*
- **Cannot speak to:** anything physiological.

### The division

Body ↔ Mind cleanly divides by **epistemic mode** (objective vs. subjective), not by coaching topic. Topics (race decisions, recovery calls, workout adjustments) naturally fuse both — the Router handles the fusion.

### Plan — not a specialist

The plan is **not** its own specialist. It's data the Router carries as context. Both specialists can query the Plan Model when relevant. This keeps the plan close to strategic reasoning (where it belongs) and avoids tripling specialist count.

---

## 🗄️ Data Layer

What the specialists and Router reason over. Explicit only (Axiom #16) — no hidden models.

| Store | Contents | Owner |
|---|---|---|
| **Signal Store** | Soma timeseries: sleep, HRV, activity, workouts, recovery | Body |
| **Plan Model** | Sessions: `{type ∈ {Easy, Tempo, Long, Race}, date, block_id, targets}` | Router |
| **Memory Store** | User utterances, annotations, tagged events | Mind |
| **Narrative Store** | Meaningful dates: first race, injuries, PRs, breakthroughs | Mind |
| **Archetype KB** | Static population priors ("runners feel X before races") | Body |
| **User Profile** | Stated goals, race calendar, demographics | Router |

---

## 🧰 MVP Tools (2)

Tools are how the Coach takes *action* in the app. Every tool renders as a UI card in the chat with Accept/Decline buttons. Every card embeds the reasoning inline.

### 1. `modify_session` — change *what* the session is

Changes the session's type, target, or intensity. Same day.

```
┌──────────────────────────────────────┐
│ 🏃 MODIFY SESSION                     │
├──────────────────────────────────────┤
│ Tuesday                              │
│                                      │
│ Before:  Tempo 8km @ 4:30/km         │
│ After:   Easy 8km @ 5:30/km          │
│                                      │
│ Why: Sleep 5h12 last night. Your      │
│ Tempos after short nights run ~15%   │
│ flat. Wednesday's quality stays.     │
├──────────────────────────────────────┤
│ [✓ Accept]  [✗ Decline]              │
└──────────────────────────────────────┘
```

**Handles:** type swap, target change, intensity adjustment, "convert to rest" (skip built-in).

### 2. `reschedule_session` — change *when* the session is

Moves the session to a different day without altering its nature.

```
┌──────────────────────────────────────┐
│ 📅 RESCHEDULE SESSION                 │
├──────────────────────────────────────┤
│ Long Run 22km                         │
│                                      │
│ From: Sunday                          │
│ To:   Saturday                        │
│                                      │
│ Why: Family event Sunday. Saturday    │
│ weather's better and we keep the     │
│ week's structure.                    │
├──────────────────────────────────────┤
│ [✓ Accept]  [✗ Decline]              │
└──────────────────────────────────────┘
```

### Tool design principles

- **Every tool card embeds the reasoning inline** (replaces a separate `explain_reasoning` tool).
- **Accept/Decline is mandatory** — the user always has sovereignty.
- **Accepted tool actions write to the Plan Model.** The architecture learns the plan evolved.
- **Declines can be logged** to Memory Store (v2) to improve future recommendations.

---

## 🚫 Out of Scope for MVP

### Explicit exclusions (Axiom #14)

- ❌ Life coaching, motivation, meaning, therapy modules
- ❌ "Why do you run?" existential prompts
- ❌ Hidden inference never surfaceable (Axiom #16)
- ❌ Personality configuration UI (Axiom #15)

### Deferred to v2+ (valuable, just not MVP)

**Tools (post-MVP):**
- `request_self_report` — structured feedback MCQ
- `explain_reasoning` — summonable reasoning card (reasoning is inline in MVP)
- `mark_milestone` / `mark_life_event` — explicit Narrative/Memory store writes
- `confirm_session` — explicit session-completion confirmation (relies on Soma sync in MVP)
- `share_lesson` / `show_chart` — educational/visualization cards
- `pre_brief` / `debrief` — race-specific lifecycle cards
- `insert_rest_day` / `schedule_deload` — structural recovery moves
- `schedule_follow_up` — coach scheduling its own check-ins
- `register_race` / `convert_to_tune_up` / `propose_race_strategy` — race tools

**Specialists (post-MVP):**
- Scientist (training-science priors extracted from Body)
- Historian (long-term patterns extracted from Mind)

**Trigger engines (post-MVP richness):**
MVP Router likely starts with a small handful of proactive triggers (e.g., morning fusion, post-workout feedback). The full 6-engine taxonomy (risk/opportunity, lifecycle, fusion, plan-reality delta, memory callback, narrative milestone) is a v2+ expansion path.

---

## ❓ Open Questions (for later design passes)

1. **Cold start.** Half the reasoning needs history. A user with 3 days of Soma data — what runs, what stays silent?
2. **Reasoning trace format.** Natural language? Structured DAG? Mix? Affects explicability UX.
3. **Does the coach evolve?** Learning loop / user-model improvement over time.
4. **"I don't know" handling.** How does the Coach admit low confidence gracefully?
5. **Coaching success metric.** What's the win condition? (Goal achieved? Adherence? Both?)
6. **Body/Mind ambiguity.** Cases like *"I feel tired"* — Mind self-report or Body-via-proxy? Needs a routing rule.
7. **Cost management.** Every event triggers ≥2 LLM calls (Router + specialists). Caching strategy TBD.
8. **Router strategic context.** How does the Router hold plan context across calls? Persisted state? Re-derived?

---

## 📒 Decision Log

Key calls made during synthesis (not guesses — decisions with rationale):

| Decision | Rationale |
|---|---|
| **Craftsperson coach identity** (Position A+A) | In-lane, focused, counter-zeitgeist. Narrower scope → sharper product → higher trust. |
| **Hardcoded identity for MVP**, not configurable | Opinionatedness is the value; ship as *a coach*, not *a framework*. |
| **No hidden psychological modeling** | Simplicity > power for MVP. Pair with Axiom #11 (explicability). |
| **Unified pipeline** (reactive + proactive) | Both terminate in chat messages. Only entry point and arbitration gate differ. |
| **Router as LLM-backed orchestrator** ("the Coach itself") | Topic-level questions need intent-aware dispatch; declarative profiles aren't enough. |
| **Two specialists (Body + Mind)**, not five | Cut by *source of truth*, not *topic area*. Topics blend; sources of truth don't. |
| **Plan lives in the Router, not as a specialist** | Mirrors reality — a coach IS the strategist; the plan is in their head. |
| **Two MVP tools** (`modify_session` + `reschedule_session`) | Separates *what* vs. *when*. Everything else post-MVP. |
| **Reasoning embedded inline in tool cards** | Replaces a separate `explain_reasoning` tool for MVP. Cleaner UX. |

---

## 🎯 Next Steps

1. **Validate the pipeline with a few concrete scenarios** — walk through 5-10 real user situations end-to-end to stress-test the architecture.
2. **Define the `CandidateMessage` data contract** — exact schema for what specialists emit and what Synthesis consumes.
3. **Design the Router's dispatch logic** — rules/prompt for deciding which specialists to wake per event type.
4. **Specify the initial proactive trigger set** — which cron/data events wake the Router in MVP (likely 2-3 to start, e.g., morning check + post-workout).
5. **Prototype one end-to-end flow** — e.g., "bad sleep + Tempo scheduled → modify_session card." Implement through all 8 stages.
6. **Draft UI card components** for `modify_session` and `reschedule_session`.
