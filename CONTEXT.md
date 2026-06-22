# Cadence

Cadence is a running-coach app for first-time-distance runners (current plan target: 5K; wedge target: first-time marathoner). It pairs a **deterministic training plan** with an **AI coach** that narrates, remembers, and reasons over qualitative + quantitative signals. This glossary is the shared language of the whole product. It is intentionally devoid of implementation detail — it defines what each term **is**, not how it works.

> The codebase has several bounded contexts. Two (**Agoge**, **Soma**) live as external Convex components; the rest live in `packages/backend/convex`. If this file grows unwieldy, split it into a `CONTEXT-MAP.md` with one `CONTEXT.md` per context.

## Language

### The actors (who does what)

The product enforces a strict separation of roles. Confusing them is the most common source of design drift.

**Engine**:
The only actor that may mutate a training plan. Always deterministic — coded rules, never LLM judgment. Lives in `convex/engine`.
_Avoid_: "the algorithm", "the AI" (the Engine is not AI).

**Coach**:
The read-only narrator. Speaks to the runner in the first person ("I"), explains and remembers, but never touches the plan itself. Surfaces wherever the thing it's talking about lives — not only in a chat box.
_Avoid_: "the chatbot", "the assistant". The Coach never refers to the Engine as a separate actor out loud.

**Runner**:
The human user. In moments of ambiguity the Runner **decides an intention** (go / ease / rest / swap); they never freely edit the plan.
_Avoid_: "user" in domain conversation; "Athlete" — see ambiguity below.

**Detection** _(no live autonomous scan — 2026-06-17)_:
The system-initiated entry point: a scan that either lets the Engine act silently or *prompts* the Runner for qualitative input. The quantitative scans that existed (HRV, weekly adherence) were **removed** in the reset to zero (ADR-0003); the concept is kept for the proactive layer to be rebuilt deliberately. Today the only entry point that reaches the Engine is the Runner's own post-session decision.
_Avoid_: "trigger" as a synonym — a trigger is one mechanism Detection uses, not Detection itself.

### Decide vs Act (the core distinction)

**Decide**:
Choosing an *intention* under uncertainty. The Runner decides; the Engine then translates the intention into concrete numbers. Deciding is **not** mutating the plan.

**Act**:
Executing the deterministic plan mutation. Only the Engine acts.

> **Chemin A** (confirmed signals): Engine decides *and* acts, Coach informs. **Chemin B** (qualitative/uncertain signals): Coach restitutes memory → Runner decides intention → Engine acts → Coach confirms. Chemin B is the wedge's hero moment.
>
> _Status (2026-06-17)_: **Chemin A has no live path** — all autonomous triggers were removed (ADR-0003). The product is reactive only: the Engine acts solely via Chemin B (post-session ease). Chemin A returns when the proactive layer is rebuilt.

### Agoge — the training-plan domain (external component)

Owns everything about the prescribed plan. Accessed via `components.agoge.*`. Source of truth for what training *should* happen. Cadence uses Agoge's `athletes, goals, plans, blocks, workouts, races, metrics` tables; it does **not** use `events, workoutTemplates, zones`.

> **Containment**: one **User** → one **Athlete** → one active **Goal** → one **Plan** → many **Workouts** (optionally grouped into **Blocks**).

**Athlete** (Athlete Profile):
Agoge's training-domain record of a Runner. Exactly **one per Cadence User** (1:1). Distinct from the app `users` row.

**Goal**:
The Athlete's single active target. Holds a *category* (only `"race"` at MVP), a *raceTarget* (e.g. `{ type: "time", seconds: 11940 }` or a finish target), and a *raceId* pointing at the **Race**. (The general-fitness category is **removed** at MVP — not merely hidden — so every Goal is race-anchored.) An Athlete has exactly **one active Goal**; because every Goal references a Race, every Goal has a date. A race Goal's `status` is **derived from its Race's status**, never set directly.

**Abandon** (changing the Goal):
Retiring the active Goal so a new one can replace it. The old Goal, its **Race**, and its **Plan** are **archived, never destroyed** — the Race remains the provenance anchor for past work. The Plan's un-run prescriptions are **discarded**; **done** Workouts survive as durable history. _Avoid_: "delete the goal" — abandonment keeps history and only drops the disposable future prescriptions.

**Plan**:
The ordered list of **Workouts**, built with an intent and linked to the active **Goal**. One Plan per Goal.

**Block**:
An *optional* grouping of a Plan's Workouts into a phase — **Base / Build / Peak / Taper**. A Plan may have no Blocks.

**Workout**:
A single prescribed or completed training session — the atom of the Plan. "Planned" and "done" are **states of one Workout**, not separate tables. A **done** Workout (one carrying recorded *actuals*) is durable history; a merely **planned** one is a disposable, deterministically regenerable prescription. That asymmetry governs what survives an **Abandon**: actuals-bearing Workouts are kept, prescription-only ones are dropped.
_Avoid_: "Activity" (Soma's raw recorded effort), "Session" — see ambiguity below.

**Race**:
The concrete event a **Goal** references (via `raceId`). Holds the event facts: distance, date, discipline, name, priority. One Goal → one Race.

**Metric**:
A measured fitness value held in Agoge's `metrics` table — notably the inferred **VDOT**.

**VDOT**:
The single stored fitness measurement (a **Metric**). Paces and race predictions are *derived on read* from it — never stored.
_Avoid_: "zones" — the zones table is unused and HR zones were removed; do not reintroduce the term.

### Soma — the biometric domain (external component)

Owns recorded physiological reality (Garmin / Strava / HealthKit). Source of truth for what the body *did*. Cadence reads `dailySummaries`, `sleepSessions`, and wearable `connections`; it does **not** read Soma `activities`.

**Daily Summary**:
A day's biometric record keyed to a calendar day, carrying heart-rate data (HRV, resting HR) among other fields.

**HRV z-score**:
Today's HRV (rMSSD) expressed as deviations from the Runner's own **14-day baseline** (≥7 samples, else "no signal"). **Read-only context only** as of the reset to zero (ADR-0003): the Engine acts on **no** Soma signal. The `hrv_low_v1` reshape and the z-score computation (`getHrvReadiness`) were removed; the raw HRV **display chart** (`analytics/hrv.ts`) stays as Analytics context.
_Avoid_: claiming HRV "drives" any plan change — it currently drives none.

**Companion signals** (last night's sleep hours, today's resting HR):
Captured alongside the HRV reading as context for narration and the decision snapshot. They colour the message; they do **not** independently trigger a reshape.

**Body battery / stress / nutrition / menstruation**:
Available to the **Coach** as read context (Analytics surfaces them); they drive **no** plan mutation. Named only to mark them read-only, not actors.

_Retired_: **Activity** — Soma's `activities` table is unused by Cadence; a done **Workout**'s actuals come from Agoge.

### Engine — plan generation & mutation

Deterministic throughout (since the pivot away from the LLM-authored plan — see ADR-0001). Two senses of "rule" live here; the glossary splits them into **Guardrail** (forbids) and **Trigger** (causes).

**Plan Generation**:
The deterministic construction of a **Goal**'s initial **Plan** (`generatePlan.ts`) — laying out the ordered Workouts (and Blocks). Its own phase; runs at plan creation. Later changes are **Reshapes**, never regeneration.

**Reshape**:
Any deterministic modification of *upcoming* Workouts (scale intensity, deload, drop filler, ease one session). The only way the live plan changes after generation.

**Trigger**:
A named condition that *authorizes* a Reshape. The only **live** trigger is `post_session_ease` (the Runner's Chemin B ease). The autonomous triggers `hrv_low_v1`, `adherence_low_v1`, and `weekly_review_v1` were **removed** in the reset to zero (ADR-0003).

**Guardrail** (`philosophy.*` in code):
A deterministic invariant that *blocks* a plan move violating training sense — ≤2 quality Workouts/week, ≤+10% weekly volume. Validates Runner edits (**Reschedule**, **Swap**) *and* Coach suggestions. A Guardrail forbids; a Trigger causes. **Live today** — enforced in `agoge/workouts.ts` on every reschedule/swap.
_Note_: the old "Philosophy" abstraction module was deleted; only the `philosophy.*` error-code prefix survives as residue.

**Intervention** _(retired 2026-06-17)_:
Formerly a separately-stored, revertible Engine **Reshape** (in `coachInterventions`). The table is **deleted outright** (no backfill — ADR-0002 addendum). The surviving trace of a Reshape is `journalEntry.decision === "ease"` on the debrief entry; the before/after snapshot, the revert, and the "Adjusted by coach" badge are all dropped. The runner's transparency is the in-the-moment CoachResponse confirmation, not a persistent record.

**Reschedule / Swap**:
The Runner's two manual plan edits — move one Workout to another date (Reschedule); exchange two Workouts' dates (Swap). Each is validated against the **Guardrails** before applying.

**Weekly Review** _(removed 2026-06-17)_:
Formerly the Monday heartbeat — close the past week (auto-miss, grade adherence + load) and reshape the upcoming week. **Removed in full** in the reset to zero (ADR-0003): cron, engine, pure core, tests, `weeklyReviews` table, and Coach narration all deleted. No autonomous heartbeat remains.

**Auto-miss** _(removed 2026-06-17)_:
Formerly the week-close flip of a past-due planned Workout → `missed`. Removed with the Weekly Review. Past-due Workouts now stay `planned` until the Runner triages them; the UI derives `needs_feedback` from the date and offers a manual "Mark Missed". No automatic writer of `missed` status remains.

### Coach — narration & memory

**Narrate**:
Turning a deterministic fact (a reshape, a verdict, an insight) into first-person, locale-aware coach language. Narration never changes facts.

**Coach Memory**:
A short, stable, athlete-facing fact the chat **Coach** records about the Runner via its one writing tool (`rememberAboutAthlete`) — preferences, life context, long-term goals, injury history. Written silently during chat, appended verbatim to the system prompt on every future turn, and shown verbatim in the **Context sheet**. Stored in `coachMemories`.
_Distinct from_ **Insight**: a Coach Memory is free-text the LLM chose to remember; an Insight is a detector-produced, evidence-thresholded pattern (not yet built).

**Context sheet**:
The in-app surface listing the Runner's **Coach Memories** verbatim — the transparency guarantee that the Runner always sees what the Coach is told. _Status (2026-06-17)_: as its own surface (the chat-header sheet) it is **folded into the Portrait** at MVP — while the Portrait is itself a verbatim render, the Portrait *is* the transparency guarantee. The `CoachContextSheet` component is **shelved, not deleted**: it returns as the "see the raw memories" disclosure the moment the Portrait gains synthesis (paraphrase) and the verbatim guarantee needs its own home again.

**Portrait** ("Ce que j'ai appris sur toi"):
The Coach-tab section that shows the Runner who the Coach understands them to be. *Intended* end state: an evolving first-person synthesis over **Coach Memories** plus longitudinal signals. *MVP today*: a styled render of the Runner's **Coach Memories** — no synthesis, no storage. Because the render is verbatim, the Portrait also **carries the transparency guarantee** at MVP (the **Context sheet** is folded in). The richer summary (and the "longitudinal signals") waits on **Insights** / **Outcomes**, which are deferred; when synthesis lands it stops being verbatim, and the shelved Context sheet returns as a "raw memories" disclosure.

**Coach dashboard**:
The Coach tab's landing surface — a vertical read, not a chat box: **Portrait**, then the **Decisions** list, then an entry into the chat. The free-form chat is a pushed screen, not the tab itself. Analytics ("Courbes") is a separate tab, not folded in at MVP.

### Journal — the wedge spine

The qualitative layer. The "memory decisional and qualitative" fourth layer the market left empty.

**Journal Entry**:
The unit of the journal spine, keyed to a calendar day and (when about a session) a Workout. A row exists only when there is content to record: a runner voice capture (audio, transcript, derived signals), and/or a **Decision** (system or runner) — its trigger, the chosen action, and any executed mutation's before/after state. Silent evaluations that change nothing write no row. Stored in `journalEntry`; this is the single decision log.

**Derived Signals** (`derived`):
The structured signals an LLM extracts from a transcript (RPE, pain locations, sleep quality, life stress, motivation, effort feel, mood, notes). The LLM fills only what the Runner actually said; there is no code gate.

**Concern tier**:
The triage level the extraction assigns to an entry: `none` / `watch` / `act`. Scales the Coach's reply and gates whether a decision prompt appears.

**Conflict**:
A hard/quality Workout sitting close enough (≤3 days) to a concerning post-session signal that easing it is offered.

**Decision** (the decision log):
A recorded moment where a **Trigger** prompted a choice to act or not — made by the **Engine** (Chemin A: a *system* decision, e.g. `hrv_low_v1`) or the **Runner** (Chemin B: a chosen intention `go` / `ease`). Carries the trigger (`ruleId`), the chosen action (including no-op like `go` / Keep), and — when it acted — the executed mutation's before/after state. The unit of the decision log; its *acted* facet replaces the old **Intervention**. Stored as rows in the **Journal** (`journalEntry`). A silent evaluation that produces no change records nothing.

**Restitution**:
The Coach surfacing past decisions/memory at a similar moment ("le 12 mai, même contexte, tu as forcé → 10j d'arrêt"). The pull side of the wedge.

**Insight**:
A cross-signal pattern with two faces: a **statement** (narrated, human) and a **pattern** (structured, machine-readable) detected deterministically over the joined dataset. Read by Detection, plan generation, and Coach restitution.
_Avoid_: "insight" meaning a one-off card; an Insight is a seuil-backed detected pattern, not an LLM musing.

**Outcome** (the moat):
The later, deterministic labeling of a past Decision — `good_call` / `watch` / `bad_call` — computed from observable facts in the post-decision window. The verdict is rules-based; only its narration is LLM. The *outcome-labeled decision log* is the moat candidate.

## Flagged ambiguities

**Runner vs Athlete**: The **Runner** is the human (app `users`). The **Athlete** is Agoge's training-domain record of that person. Use "Runner" in product/UX language; reserve "Athlete" for the Agoge component boundary.

**Workout vs Session**: **Workout** = Agoge's prescription (planned or done) — the only training atom. ("Activity", Soma's raw recorded effort, is retired — Cadence doesn't use it.) "**Session**" is informal UX shorthand ("post-session voice", "Session detail page") — acceptable in UI copy, but in domain conversation say **Workout**.

**Decision vs Intervention** _(superseded 2026-06-17)_: Previously two records in two tables — the Runner's *intention* on `journalEntry`, and the Engine's *executed, revertible* mutation on `coachInterventions`. Now **unified into one Decision concept**, recorded as rows in the **Journal** (`journalEntry`), covering both *system* decisions (Chemin A, e.g. `hrv_low_v1`) and *runner* decisions (Chemin B, `go` / `ease`). A row is written only when there is content — a mutation fired, voice was captured, or the runner actively chose at a presented fork (Keep `go` included); silent no-op evaluations write nothing. The executed mutation is the *acted* facet of a Decision row, not a separate **Intervention**, and **revert (the undo) is dropped** — the before/after snapshot is retained only as analytics signal. See ADR-0002.

**Insight vs Coach Memory**: An **Insight** is a deterministically detected, evidence-backed *pattern* (machine + human faces). A **Coach Memory** is a softer durable fact feeding the Portrait. Insights feed Detection and generation; Memories feed narration. Do not merge them.

**Onboarding vs Change-goal**: Two surfaces create a race-anchored **Goal**, and they are *not* the same flow. **Onboarding** is the first run — it establishes the **Athlete** (profile, experience, availability) and captures the **VDOT** once via a mandatory past race result. **Change-goal** is the returning Runner replacing their active Goal — it *reuses* the athlete-level VDOT and only re-confirms availability (which shifts at training-block boundaries). Both share a **Goal Setup** core — choosing the **Race** and its target — but each owns its surrounding steps and what it does on finish. They share vocabulary, not a wizard (ADR-0007).

## Example dialogue

> **Dev**: When the runner says "calf felt tight" after a hard session, does the plan change?
> **Domain**: Not by itself. That's a **Derived Signal** (a pain location) on the **Journal Entry**. The extraction sets a **Concern tier**. Only if it's `act` *and* there's a **Conflict** — a hard **Workout** within three days — does the Coach offer to ease it.
> **Dev**: And if they tap "Ease it"?
> **Domain**: The Runner has **decided** an intention. The **Engine acts** — it performs a **Reshape** of the conflicting upcoming Workout, and the choice is recorded as `decision: "ease"` on the debrief **Journal Entry** (no separate Intervention record, no revert). The Coach **narrates** it in the moment. Note the Coach never reshapes; it only informs.
> **Dev**: So where's the "memory" — the "last time you pushed through this you lost ten days"?
> **Domain**: That's **Restitution**, and it reads from the **decision log**. It needs first-class **Decisions** with **Outcomes** labeled — which is exactly the part we haven't built yet.
