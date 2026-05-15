# Cadence — The AI Coach

> The product thesis for Cadence's intelligence layer, written to be read in five minutes.
> Audience: investors, partners, the team. Date: 2026-05-15.

---

## TL;DR

Cadence is building **the only running coach that talks to you like a person who actually checked your data.**

Every running app on the market generates a plan. The unsolved problem is not plan quality — it is **psychological adherence**. Runners abandon training because no one is noticing them. They have a calendar; they don't have a coach.

Cadence's edge is a two-layer intelligence system:

- A **deterministic Engine** that watches the runner's signals (HRV, sleep, completed sessions, race dates) and decides when the plan should change.
- An **AI Coach** that knows the runner personally — their fears, their preferences, their life — and frames every decision in that context. The same swap reads as either "Today's workout has been moved to Friday" or *"I know Friday's your no-hard-day rule, but yesterday's HRV drop combined with last week's calf tweak means today's intervals aren't worth the risk."*

Same action. Totally different product. The second one is what makes runners screenshot and tell their friends.

---

## The problem

Every competitor in this category — Garmin Coach, TrainingPeaks, Runna, Stryd, Humango, Vert.run, Athletica, JOAN — produces decent training plans. Some of them silently adjust load based on readiness. **None of them feel like a person noticing you.**

Concretely, runners today experience one of two failure modes:

1. **Robotic apps.** A plan appears on Monday. If you miss Tuesday, Tuesday is just gone. No one mentions it. The app is a calendar with workouts in it.
2. **Coddling apps.** Generic praise ("Great job!") regardless of context. Encouragement without evidence of being seen.

The unmet need is the middle ground: **someone who watches your data, makes a real call, and tells you why in a way that proves they know you.** That is what a good human coach does, and that is what no app does today.

---

## The wedge

The wedge isn't "AI changes your plan." Every app will have plan adjustment within 18 months — the underlying models commoditize fast. The wedge is **the coach who knows you.**

That breaks into two compounding assets:

1. **A persistent runner profile** that accumulates depth over months. Past injuries, life context, training preferences, what motivates them, what breaks them. This is built passively through chat and explicitly through onboarding.
2. **Decisions framed in that profile.** Every plan change, every check-in, every nudge is rendered through what we know about this specific runner.

The first is a moat competitors cannot retroactively build. The second is what makes the product feel uncanny — and uncanny is what gets shared.

---

## How it works

The intelligence layer has three roles. Two are deterministic and predictable. One is the LLM. Keeping them separate is what makes the product both safe and warm.

### 1. The Engine (deterministic)

Watches the runner's signals on a schedule and on webhook events. When a rule fires, it emits a **PlanDecision**: a structured object describing what should change in the plan and why.

- Pure logic. Fully testable. Same input always produces the same output.
- Never hallucinates a 30 km tempo run. Never invents an injury risk that isn't in the data.
- The Engine is what makes Cadence safe enough to actually let modify a real training plan.

### 2. The Voice (LLM, read-only)

Given a `PlanDecision` plus the runner's profile, the Voice generates the message the runner sees. It does not modify the plan. It does not make training decisions. Its only job is to **translate the Engine's decision into something that feels like a coach said it.**

- Reads the structured runner profile (fears, preferences, recent context).
- Frames the change in language that proves the runner is seen.
- Surfaces the *why* in plain words, not jargon.

### 3. The Listener (LLM, conversational)

The chat surface. The runner talks to it about how they feel, what's happening in their life, what they're worried about. The Listener has two jobs:

- Answer the runner (questions about the plan, encouragement, education).
- **Extract structured facts** from the conversation and update the runner profile. ("User mentioned recurring left knee soreness since March." "User has a daughter's birthday on June 12 — protect that day.")

This second job is the part most apps miss. Without it, the profile stays empty and the Voice has nothing to be uncanny with. **Chat isn't a feature — it's the data pipeline for the only moat that matters.**

### Why this split

A pure-LLM approach gives the AI permission to silently rewrite the plan. That is unsafe at MVP, unauditable, and produces inconsistent behavior across runners.

A pure-deterministic approach produces correct plans that feel like spreadsheets.

The split — Engine decides, Voice speaks, Listener learns — gives us **the safety of code and the warmth of a person**, while keeping the surface area small enough to actually ship.

---

## MVP scope

We ship **one trigger, done extraordinarily well**, before adding a second.

### The MVP trigger: recovery-based hard-day swap

When the runner has a quality session scheduled today and their morning recovery signals (HRV, sleep, resting heart rate) breach a defined threshold, the Engine swaps today's hard session with the next easy day in the week.

Why this one:

- **Sensor-driven.** Demonstrates the Garmin / health-data integration is doing real work, not decoration.
- **High-stakes for the runner.** Injury prevention is the highest-conviction value prop in training. Getting this right earns trust fast.
- **The Voice message writes itself well.** "Your body is asking for a day off today, here's what I did about it" is a compelling beat.
- **Single, clean loop.** One trigger, one decision shape, one message archetype. Easy to make excellent.

### Deferred: missed-workout reflow

If the runner skipped yesterday's hard session, the Engine decides whether to push it to today, swap it forward, or drop it. This is the natural second trigger — between recovery-swap and missed-workout-reflow, we cover ~80% of real-world plan friction. **We ship it second, not first.**

### What MVP intentionally does not do

- The AI does not have write access to the plan. The Engine does.
- We do not ship five mediocre triggers. We ship one that feels magical.
- We do not build a generic chatbot. The Listener is a context-extraction pipeline first and a chat interface second.

---

## The moat over time

The defensibility of this product compounds in a way competitors cannot shortcut.

**Month 1.** Runner profile is shallow. Voice messages are good but generic. Engine triggers are predictable.

**Month 6.** Profile has depth. The runner has told the Listener about their job, their family, their last injury, the race they're scared of. Voice messages now reference specifics the runner doesn't remember telling us. Retention inflects.

**Month 18.** Cadence knows things about the runner that no other app — and possibly no human coach — knows. Switching to a competitor means starting over with a stranger. Lock-in is emotional, not technical.

The moat is not the model. The moat is **the relationship the runner has built with the coach over time**, captured as structured context. That is the asset competitors cannot catch up on, even with better LLMs.

---

## What this means for the pitch

When asked *"how is this different from Garmin Coach / Runna / TrainingPeaks?"*, the answer is:

> *"They have a calendar with workouts on it. We have a coach who notices when something's wrong, makes a real call about your training, and tells you why in a way that proves they've been paying attention. The first time a Cadence runner hears 'I know Friday is your no-hard-day rule, but —' they realize they've never had this from an app before. That's the product."*

When asked *"what's the moat once GPT-N is free?"*, the answer is:

> *"The model is not the moat. The runner profile is. Every conversation, every workout, every check-in deepens what Cadence knows about this specific person. By month 18, switching apps means starting over with a stranger. That asset compounds and competitors cannot retroactively build it."*

When asked *"why won't the AI go rogue and ruin someone's training?"*, the answer is:

> *"The AI doesn't touch the plan. A deterministic engine makes every training decision — fully testable, fully auditable, no hallucinations. The AI's job is to know the runner and translate the engine's decisions into language that lands. Safety and soul, separated by design."*
