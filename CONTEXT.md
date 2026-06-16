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

**Detection**:
The system-initiated entry point: a scan (HRV, adherence) that either lets the Engine act silently or *prompts* the Runner for qualitative input.
_Avoid_: "trigger" as a synonym — a trigger is one mechanism Detection uses, not Detection itself.

### Decide vs Act (the core distinction)

**Decide**:
Choosing an *intention* under uncertainty. The Runner decides; the Engine then translates the intention into concrete numbers. Deciding is **not** mutating the plan.

**Act**:
Executing the deterministic plan mutation. Only the Engine acts.

> **Chemin A** (confirmed signals): Engine decides *and* acts, Coach informs. **Chemin B** (qualitative/uncertain signals): Coach restitutes memory → Runner decides intention → Engine acts → Coach confirms. Chemin B is the wedge's hero moment.

### Agoge — the training-plan domain (external component)

Owns everything about the prescribed plan. Accessed via `components.agoge.*`. Source of truth for what training *should* happen. Cadence uses Agoge's `athletes, goals, plans, blocks, workouts, races, metrics` tables; it does **not** use `events, workoutTemplates, zones`.

> **Containment**: one **User** → one **Athlete** → one active **Goal** → one **Plan** → many **Workouts** (optionally grouped into **Blocks**).

**Athlete** (Athlete Profile):
Agoge's training-domain record of a Runner. Exactly **one per Cadence User** (1:1). Distinct from the app `users` row.

**Goal**:
The Athlete's single active target. Holds a *category* (only `"race"` at MVP), a *raceTarget* (e.g. `{ type: "time", seconds: 11940 }` or a finish target), and a *raceId* pointing at the **Race**. (General-fitness goals are dropped for MVP.) An Athlete has exactly **one active Goal**; because every MVP Goal references a Race, every Goal has a date.

**Plan**:
The ordered list of **Workouts**, built with an intent and linked to the active **Goal**. One Plan per Goal.

**Block**:
An *optional* grouping of a Plan's Workouts into a phase — **Base / Build / Peak / Taper**. A Plan may have no Blocks.

**Workout**:
A single prescribed or completed training session — the atom of the Plan. "Planned" and "done" are **states of one Workout**, not separate tables.
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
Today's HRV (rMSSD) expressed as deviations from the Runner's own **14-day baseline** (≥7 samples, else "no signal"). **The one Soma signal the Engine acts on** — it drives the `hrv_low_v1` reshape.
_Avoid_: bare "HRV" when you mean the z-score; the rule compares against the personal baseline, never an absolute number.

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
A named condition that *authorizes* a Reshape — e.g. `hrv_low_v1` (HRV z-score low), `post_session_ease`. Recorded as `ruleId` on the resulting **Intervention**.

**Guardrail** (`philosophy.*` in code):
A deterministic invariant that *blocks* a plan move violating training sense — ≤2 quality Workouts/week, ≤+10% weekly volume. Validates Runner edits (**Reschedule**, **Swap**) *and* Coach suggestions. A Guardrail forbids; a Trigger causes. **Live today** — enforced in `agoge/workouts.ts` on every reschedule/swap.
_Note_: the old "Philosophy" abstraction module was deleted; only the `philosophy.*` error-code prefix survives as residue.

**Intervention**:
A single recorded, revertible Engine **Reshape** on a Workout, carrying its **Trigger** (`ruleId`) and original + new state. Stored in `coachInterventions`.
_Avoid_: "edit", "change" — an Intervention is specifically the *logged, revertible* unit.

**Reschedule / Swap**:
The Runner's two manual plan edits — move one Workout to another date (Reschedule); exchange two Workouts' dates (Swap). Each is validated against the **Guardrails** before applying.

**Weekly Review**:
The Monday heartbeat: close the past week (**auto-miss** past-due planned Workouts, grade adherence + load) and **reshape** the upcoming week. Stored in `weeklyReviews`.

**Auto-miss**:
Marking a past-due planned Workout as missed at week close. Only ever applied to *confirmed* past state, never an uncertain present.

### Coach — narration & memory

**Narrate**:
Turning a deterministic fact (a reshape, a verdict, an insight) into first-person, locale-aware coach language. Narration never changes facts.

**Coach Memory**:
A short, stable, athlete-facing fact the chat **Coach** records about the Runner via its one writing tool (`rememberAboutAthlete`) — preferences, life context, long-term goals, injury history. Written silently during chat, appended verbatim to the system prompt on every future turn, and shown verbatim in the **Context sheet**. Stored in `coachMemories`.
_Distinct from_ **Insight**: a Coach Memory is free-text the LLM chose to remember; an Insight is a detector-produced, evidence-thresholded pattern (not yet built).

**Context sheet**:
The in-app surface listing the Runner's **Coach Memories** verbatim — the transparency guarantee that the Runner always sees what the Coach is told.

### Journal — the wedge spine

The qualitative layer. The "memory decisional and qualitative" fourth layer the market left empty.

**Journal Entry**:
The unit of qualitative capture, keyed to a calendar day and (for post/pre-session) a Workout. Holds the audio, transcript, derived signals, and — per spec — the decision and outcome. Stored in `journalEntry`.

**Derived Signals** (`derived`):
The structured signals an LLM extracts from a transcript (RPE, pain locations, sleep quality, life stress, motivation, effort feel, mood, notes). The LLM fills only what the Runner actually said; there is no code gate.

**Concern tier**:
The triage level the extraction assigns to an entry: `none` / `watch` / `act`. Scales the Coach's reply and gates whether a decision prompt appears.

**Conflict**:
A hard/quality Workout sitting close enough (≤3 days) to a concerning post-session signal that easing it is offered.

**Decision** (the decision log):
The Runner's chosen intention (`go` / `ease` / `rest` / `swap`) plus the *reason* (from their own words) and a **context snapshot** of the quantitative state at that moment. The unit of the decision log.
_Avoid_: conflating with **Intervention** — see ambiguity below.

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

**Decision vs Intervention**: A **Decision** is the Runner's *intention* + reason + context (Journal). An **Intervention** is the Engine's *executed, revertible* plan mutation (Engine). _Resolved 2026-06-16_: the MVP first-class **Decision** is a single `intention` field (`go` / `ease`) on the **Journal Entry**, written only when a fork was actually presented (post-session `concern: "act"` + a **Conflict** → Keep logs `go`, Ease logs `ease`). `reason`, `contextSnapshot`, and `outcome` are deliberately deferred until there is a concrete reader (restitution / outcome-labeling) — the irreplaceable, in-the-moment bit is the chosen intention; everything else is reconstructable later. So the **Decision** and the **Intervention** are now distinct records: the intention is logged on the entry even when no plan mutation happens (`go`), while an ease additionally writes the **Intervention**.

**Insight vs Coach Memory**: An **Insight** is a deterministically detected, evidence-backed *pattern* (machine + human faces). A **Coach Memory** is a softer durable fact feeding the Portrait. Insights feed Detection and generation; Memories feed narration. Do not merge them.

## Example dialogue

> **Dev**: When the runner says "calf felt tight" after a hard session, does the plan change?
> **Domain**: Not by itself. That's a **Derived Signal** (a pain location) on the **Journal Entry**. The extraction sets a **Concern tier**. Only if it's `act` *and* there's a **Conflict** — a hard **Workout** within three days — does the Coach offer to ease it.
> **Dev**: And if they tap "Ease it"?
> **Domain**: The Runner has **decided** an intention. The **Engine acts** — it performs a **Reshape**, recorded as a revertible **Intervention**. The Coach then **narrates** it. Note the Coach never reshapes; it only informs.
> **Dev**: So where's the "memory" — the "last time you pushed through this you lost ten days"?
> **Domain**: That's **Restitution**, and it reads from the **decision log**. It needs first-class **Decisions** with **Outcomes** labeled — which is exactly the part we haven't built yet.
