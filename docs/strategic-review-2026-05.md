# Cadence — Strategic Review

> Adversarial / investor-style read of the product, the thesis, and the gap between them.
> Date: 2026-05-13. Reviewer stance: skeptical partner. Scope: native app + backend (Agoge / Soma / coach intelligence layer).

---

## 0. TL;DR

- The wedge you've identified — **a coach that proactively changes the plan and tells you why, based on your health data** — is real and unclaimed at the consumer level. It's a credible thesis.
- The app does **not** demonstrate that wedge today. Health data is ingested but does not drive plan decisions. There is no proactive trigger. Transparency is free-form chat, not structured reasoning.
- Of the four positioning words ("Personalized, Health Data Driven, Proactive & Transparent"), three are table stakes in 2026. **Only "Proactive & Transparent" is defensible**, and it's the one not yet built.
- **Not investable at today's state.** Investable with a focused 60–90 day proof of "the moment" (cron-driven readiness-based plan modification with structured reasoning surfaced to the user).
- The rest of the roadmap (analytics polish, more tools, calendar work) is noise until that one loop exists.

---

## 1. The thesis

> *Personalized, Health Data Driven, Proactive & Transparent.*

### Does it make sense?

Yes, but the framing is weaker than the underlying insight.

Your written intuition is the right one: *"apps hold a plan but the user doesn't have someone holding you to the plan. … if I had a coach telling me 'I changed your plan given how you slept, I switched the session for one that is simpler because X and Y', that would be super interesting and kinda new."*

That is the actual product. The unsolved problem in this category is **psychological adherence**, not algorithmic plan quality. Garmin Coach, TrainingPeaks, Runna, Stryd, Humango, Vert.run, Athletica, JOAN all generate decent plans. None of them feel like a person noticing you.

### Where the framing is strong

- **Personification + transparency** maps to a well-documented behavioral finding: perceived agency of a coach drives adherence more than plan optimality.
- A coach that says "I changed X because I saw Y" is a novel default behavior in this market. Humango and Athletica adjust loads from readiness but bury the reasoning. Whoop tells you "recover" but doesn't touch your plan. Garmin's Daily Suggestion changes the run but the *why* is a black box.

### Where the framing is weak

- **"Personalized" and "Health Data Driven" are table stakes claims in 2026.** Every competitor says them. You will lose a positioning fight on those two words.
- **"Proactive & Transparent" is the only defensible pillar**, and you're burying it as adjective #4. It is the entire product.

### Suggested re-positioning

> *"The only running coach that talks to you like a person who actually checked your data."*

Lead with proactive transparency. Personalization and health-data integration are *evidence* for the claim, not the claim itself.

---

## 2. Does the app reflect the thesis?

**Partially. The load-bearing parts are missing.**

| Pillar | Status | Evidence |
|---|---|---|
| **Personalized** | Partially | [goal/new.tsx](../apps/native/src/app/(app)/goal/new.tsx) wizard works (race + fitness branches). Coach tone/verbosity prefs exist. But **onboarding is a "Coming Soon" stub** — no athlete profile capture, no fitness baseline, no shoe/injury/lifestyle context. The personalization signal is thin. |
| **Health Data Driven** | **Cosmetic** | Soma ingests HRV, sleep, RHR, body battery, stress, TSS via Garmin/Terra webhook. The coach's reading tools can fetch this data. **But zero code connects it to plan-adjustment decisions.** Philosophy rules check workout history only — no HRV/sleep/readiness rule. The 28-metric analytics inventory is designed but **not data-bound** in the UI. |
| **Proactive** | **Not built** | `crons.ts` has only email cleanup. There is no background job that watches readiness and pushes a change. **Every interaction is user-initiated.** The coach is a reactive chatbot. |
| **Transparent** | **Free-form, not structured** | The LLM is instructed to "explain the why", but explanations are streamed chat. No structured "I changed X because Y" surface. No history of past decisions. No counterfactual ("here's what your plan was, here's what it is now"). |

### What's actually built (honest inventory)

**Built and real:**
- Multi-step goal creation (race / fitness branches, distance, target, race date)
- Plan / today screen with animated header, week-volume bar, completion rate, race countdown
- Calendar tab (month view + day sheet)
- Session detail with planned structure (steps, zones, target paces) and post-session actual metrics
- Mark-done flow allowing edit of actual
- Coach tab: real Convex Agent chat with Claude, tool use for workout/block CRUD, tone/verbosity prefs
- Philosophy enforcer with 5 hard rules (weekly volume cap, max quality sessions, deload cadence, taper-before-race, workout distance cap)
- Garmin webhook ingest via Soma (activities, sleep, HRV, RHR, body battery, stress, TSS)
- Sync badges on today card; Connections page for Garmin / Strava / Apple Health

**Designed but not wired:**
- Health analytics — 11 sections, 28 metrics, no data binding
- The "Router + Body + Mind" pipeline named in your project memory: **does not exist as named architecture.** What exists is a tool-using chatbot with a rules validator. Fine architecture, misleading name.

**Missing entirely:**
- Onboarding (placeholder screen)
- AI-generated plan generation (plans are template / hand-built)
- Readiness-triggered background jobs (no cron, no anomaly detection)
- Structured plan-change reasoning surface ("here's what changed and why")
- Plan-vs-actual reconciliation UI
- Web surface (native-only)

### The headline finding

**The gap you correctly identified in your own writing is exactly the gap you haven't built.** The wedge ("AI that demonstrably noticed me") is the unclaimed territory. Today the app would demo as Runna with a more conversational coach.

---

## 3. Investor lens — would I write a check?

### At today's state: **No.**
### With a focused 60–90 day proof: **Maybe.**

### What pulls me in

- **Category size and direction.** Running participation is up post-2020. Strava filed for IPO. Sub-sector ARPU is rising. A genuinely better coach is a real wedge.
- **The wedge is unclaimed.** "AI that *demonstrably* notices you" — no consumer app delivers this. Whoop has the data but no plan. Garmin has both but no voice. TrainingPeaks has the structure but no AI. The seam is there.
- **Technical foundation is solid.** Convex + Agoge + Soma is a clean separation. Garmin webhook works. The coach chat is real, not vapor. The team can ship.
- **French-market beachhead.** cadencerun.fr + native FR localization is a defensible local entry vs. US-dominated competitors who don't speak the language or the running culture.
- **LLM cost has collapsed.** A live AI coach is finally economically possible — and the cost curve still drops.

### What pushes me out

1. **The differentiating feature isn't built.** You'd be raising on table stakes. A demo today feels like Runna with a different personality.
2. **No retention story.** Training-app churn is brutal (30–60% monthly post-trial). Your antidote — transparent proactive coaching — is precisely the unimplemented part. Without it, what's the retention thesis?
3. **No moat.** Anthropic gives every competitor the same brain. Garmin owns the device. Strava owns the social graph. What do *you* own?
   - The current implicit answer is "tone preference + French market." That's a feature and a beachhead, not a moat.
   - A defensible answer might be: **proprietary decision logs.** Every plan change, with reasoning, athlete reaction, and downstream adherence outcome → an adherence-optimized RL signal nobody else has. But you have to *start logging it* for this to become an asset.
4. **Plan quality is unproven.** Plans are template-based, not generated. If the coach reschedules a Z4 to a Z2 "because HRV", the Z2 still has to be the *right* Z2 for the block context. Where's the periodization IP? Who's the sports-science authority behind the philosophy rules?
5. **Distribution is unsolved.** Running-app CAC is brutal — Strava and Garmin own discovery. What's the wedge into the funnel? French-language coaching for French runners is a credible answer; lean into it.
6. **Subscription competition is fierce.** Runna $120/yr, TrainingPeaks $120/yr, Humango $99/yr, Stryd $200/yr. Why does a runner *add* Cadence to the stack instead of replacing one? What's the unbundling story?
7. **Native-only is a strategic choice or an accident?** You're cutting yourself off from web onboarding, paid acquisition landing pages, and SEO. Conscious bet or default?

### Questions I'd ask before writing

- Show me one user where the coach **proactively** modified the plan based on health data, the user accepted it, and the next workout's adherence improved. No such loop exists today. Build it for 10 users, measure it, then come back.
- Per-user gross margin at scale? A streaming Claude chat with tool use is not free. At what ARPU does this work? Have you modeled cost / active user / month?
- Why won't Strava ship this in 18 months? Strava has Athlete Intelligence already. Anthropic-grade reasoning + Strava's data + Strava's distribution is a credible threat.
- Who's the wedge user? "Runners" is too broad. Intermediate runners training for a first marathon? Time-crunched professionals? Athletes returning from injury (where readiness *really* matters)? The product feels generic.
- What's the sports-science authority? Coach in residence? Published methodology? Or LLM common sense + 5 hardcoded rules?
- What's the data flywheel? Every plan change should produce a labeled outcome. Are you logging it?

---

## 4. Roadblocks and risks

### Strategic
- **Platform risk.** Garmin or Strava ships "AI coach explains itself" in their existing app → you become a feature, not a product.
- **Anthropic risk.** Pricing changes, deprecation, rate limits. You don't own the brain.
- **Regulatory.** Health data is sensitive. GDPR + medical-device-adjacent claims around "readiness" and "recovery" need careful handling. Saying "we adapt to your HRV" gets you scrutinized; saying "we coach you, and consider your HRV" doesn't.

### Product
- **Trust collapse from one bad recommendation.** If the coach reschedules a key session for the wrong reason, the user loses faith permanently. The first 10 proactive interventions per user matter enormously.
- **Notification fatigue.** "Proactive" easily becomes "noisy." The cadence and signal threshold of proactive interventions is the entire UX problem.
- **Cold-start.** Without 2+ weeks of Garmin data, the AI has nothing to be smart about. Onboarding must absorb that gap (more important than the wizard you have).

### Technical
- **Webhook latency / reliability** for the proactive loop. Garmin webhooks are not real-time guaranteed.
- **Idempotency** when the AI proposes the same change multiple times across cron firings.
- **Cost ceiling** if every user gets a daily background AI pass.

### Organizational
- **You're building too many surfaces.** Analytics has 28 metrics designed. The mark-done flow lets you edit every step. The calendar has a month view. Meanwhile the headline feature isn't built. Classic "horizontal expansion before the spike."

---

## 5. The hard recommendation

If I were on your cap table, I'd push one thing for the next 60 days, and stake the company on it.

### Build "the moment"

One user-visible end-to-end loop:

1. **Detect.** A background job (cron, not chat) runs nightly. It reads the user's last 7 days of Soma data and compares today's HRV / sleep / RHR / body-battery to a personal rolling baseline.
2. **Decide.** If today's readiness is below a threshold *and* the next planned session is high-intensity, the LLM is prompted with: athlete state, plan context, philosophy rules, available tools.
3. **Modify.** The LLM calls `rescheduleWorkout` or `updateWorkout` — but the change is in *proposed* state, not committed.
4. **Notify with structured reasoning.** Push notification: *"I want to swap tomorrow's tempo for an easy Z2. Tap to see why."* Opens the app to a structured card:
   - **Before / After** (visual diff of the workout)
   - **Why** (bullet list: "HRV 38ms vs. 7-day avg 52ms / Sleep 5h12 / Pushing hard tomorrow risks the long run Saturday")
   - **Accept / Push back** CTAs
5. **Learn.** Log the proposal, the user's choice, the next session's adherence and metrics. This is the proprietary dataset.

If you ship *that one loop*, end-to-end, **the thesis becomes demonstrable.** No consumer running app does this. Without it, you have a competent chatbot wrapped around a template-based plan engine — and that's not a fundable story in 2026.

Everything else (analytics charts, calendar polish, more tools, the onboarding wizard, even the web surface) is noise until that loop exists. Especially the analytics inventory — that's a 3-month time sink for surfaces no user will pay for.

### Sequencing if I owned the roadmap

**Weeks 1–2:**
- Pick a single anomaly trigger (HRV z-score below personal baseline).
- Wire one cron that fires daily, evaluates the rule for opted-in users.
- Stand up the "proposed change" state in the workout schema.

**Weeks 3–4:**
- LLM prompt that produces both the modification AND structured reasoning (JSON schema with `signals`, `risk`, `alternative`).
- Notification + accept/push-back UI.
- Decision log table (the dataset).

**Weeks 5–8:**
- Run with 10–20 beta users. Measure: proposal acceptance rate, post-acceptance adherence, qualitative reaction.
- Tighten the rule, the prompt, the UI, the cadence.

**Week 9:**
- The demo. The fundraising story. The press story.

Everything else waits.

---

## 6. What to deprioritize (uncomfortable list)

These are things visible in the codebase that you should probably *stop* working on until the moment exists:

- Health analytics inventory (11 sections, 28 metrics) — beautiful, no user will pay for it
- Mark-done step-by-step edit form — most users won't edit; just record actual from Garmin
- Calendar month view polish — table stakes, not differentiating
- More coach tools (you have 16 already; users see 0 of them)
- Coach tone/verbosity options — feature creep before product–market fit
- Multi-discipline (triathlon) support hinted at in race format — focus on running

This list will sting. It's the point.

---

## 7. What to double down on

- **The Soma → AI decision pipeline.** Today it's read-only telemetry. Make it the engine.
- **The decision log.** Every proposal, every user reaction, every outcome. This is your moat candidate.
- **Onboarding.** Capture athlete baseline, injuries, lifestyle constraints. The first proactive intervention is only credible if you knew the user before they ran.
- **French market.** cadencerun.fr, FR content, FR running community. A defensible local beachhead is more useful than a generic global play right now.
- **One sports-science authority** in your corner. Named coach, published methodology, or partnered federation. Credibility for the philosophy rules.

---

## 8. Closing

The thesis is good. The intuition that drove it ("someone holding you to the plan, transparently") is correct and rare. The architecture choices (Convex, Agoge, Soma, Claude Agent) are sensible.

But the app does not yet do the thing the thesis claims. It does roughly what Runna does, with a more conversational coach surface. Investors will see that, and so will users. The differentiator is one focused 60-day loop away — and building it requires saying no to the next three months of horizontal feature work.

The single highest-leverage thing you can do this quarter is build "the moment." Nothing else matters as much.
