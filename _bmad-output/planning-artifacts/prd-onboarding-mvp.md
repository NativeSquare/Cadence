---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish']
inputDocuments:
  - product-brief-Cadence-2026-02-10.md
  - ux-onboarding-flow-v6-2026-02-13.md
  - research/domain-ai-running-coaching-research-2026-02-10.md
  - research/technical-wearable-api-landscape-research-2026-02-13.md
  - research/training-engine-architecture.md
documentCounts:
  brief: 1
  research: 2
  ux: 1
  architecture: 1
workflowType: 'prd'
scope: 'MVP Onboarding Flow'
classification:
  projectType: 'mobile_app'
  domain: 'consumer_fitness_ai_coaching'
  complexity: 'medium'
  projectContext: 'greenfield'
  codebaseStructure: 'monorepo'
  futureScope:
    - landing_page_website
    - admin_panel
---

# Product Requirements Document: Cadence Onboarding (MVP)

**Author:** NativeSquare
**Date:** 2026-02-13
**Scope:** MVP Onboarding Flow Only

---

## Executive Summary

**Product:** Cadence — AI running coach with visible reasoning
**Scope:** MVP Onboarding Flow (first-run experience through trial conversion)
**Differentiator:** Live Coaching Intelligence — the coach shows its thinking, not just its conclusions
**Target Users:** Runners seeking personalized, trustworthy training guidance
**Core Value:** Two "aha moments" — recognition ("it sees me") and conviction ("this is serious")
**Tech Stack:** React Native/Expo, Vercel AI SDK, HealthKit + Strava integrations

---

## Success Criteria

### User Success

**Aha Moment #1: "It sees me"**

The user experiences genuine recognition -- the coach demonstrates understanding of *their* specific situation. This happens through:

- **With wearable data:** The Thinking Stream analyzes their connected data and surfaces something *specific* they recognize as true (or didn't know but immediately accept). Examples: "Your easy runs are consistently 15-20 seconds faster than optimal recovery pace" / "You're not taking enough rest days -- only 3 in the last month."

- **Without wearable data:** The conversational flow itself demonstrates intelligence. The coach asks sharp questions, makes contextual references ("You mentioned you're getting back into it after a baby..."), and builds a coherent picture that the user recognizes as accurate.

This moment must happen **early** -- within the first 2-3 minutes of meaningful interaction.

**Aha Moment #2: "This is serious"**

The visual plan presentation seals conviction. Skeptics are convinced by the **full package**:
- Quality of analysis and undeniable data-backed reasoning
- Sexy UI and polished presentation
- Clear decision justifications with expandable audit trail

The radar chart, progression graph, and calendar widget must be visually striking and immediately credible. The user sees their runner profile quantified, their training trajectory mapped, and their projections justified.

**Completion Signal:**

User reaches the paywall screen having:
- Completed the full conversational flow (with or without wearable)
- Seen personalized analysis (data-driven or conversation-driven)
- Viewed full plan presentation with visual components
- Understood *why* the plan was built this way

### Business Success

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| **Onboarding Completion Rate** | >70% | Users who start must finish -- drop-off means the flow broke |
| **Trial Conversion Rate** | TBD (establish baseline) | Completion without conversion means the value wasn't clear |
| **Wearable Connect Rate** | Track but don't gate on | Measures data bridge success, but non-connectors must still convert |
| **Qualitative Feedback** | "Wow" / "This is serious" | Beta testers and partners must have a visceral reaction that *sticks* |

**The qualitative bar:** When demoing to partners or beta testers, the reaction should be immediate and memorable. Not polite interest -- genuine surprise. If they don't remember the experience a week later, we haven't hit the bar.

### Technical Success

| Dimension | Requirement |
|-----------|-------------|
| **Relevance** | Plan and analysis must feel personal. With data: reference actual metrics. Without data: reference conversation context. Every insight traceable to input. |
| **Flow** | UI unfolds naturally with intentional pacing. Streaming text, haptic feedback, and visual reveals feel orchestrated, not choppy. Both data and no-data paths feel equally polished. |
| **Reasoning Clarity** | Every major coaching decision has a visible justification backed by graphs, user data, or stated user input. Decision audit trail is expandable. |
| **Data Bridge** | HealthKit and Strava sync must work on first attempt for supported devices. No manual retry loops. Skip path must feel like a choice, not a fallback. |

### Measurable Outcomes

| Outcome | Measurement |
|---------|-------------|
| Time to Aha #1 | <3 minutes from start of meaningful interaction |
| Data Completeness | Runner Object reaches 100% by end of flow |
| Plan Generation | Full plan with visuals generated and displayed |
| Path Parity | Completion and conversion rates comparable across data/no-data paths |

---

## Product Scope

### MVP - Minimum Viable Product

**In Scope:**
- Full onboarding flow (Acts 1-4 from UX V6)
- Both paths: wearable-connected AND no-data conversational
- Wearable integration: Apple HealthKit + Strava only
- Generative UI components (MultipleChoice, OpenInput, ConfirmationCard, ThinkingStream, etc.)
- Thinking Stream with collapsible visible reasoning
- Visual plan presentation (RadarChart, ProgressChart, CalendarWidget)
- Decision audit trail (expandable "why" sections)
- Paywall screen with trial CTA
- Runner Object data model with progress tracking

**Out of Scope for MVP:**
- Garmin direct integration (post-MVP)
- COROS/Polar/other wearables (post-MVP via Terra)
- Calendar integration (Phase 3)
- Voice input (can defer if complexity requires)
- Real-time in-run audio coaching

### Growth Features (Post-MVP)

- Garmin Connect API integration (richest running data)
- Terra aggregator for long-tail devices
- Voice input for conversational onboarding
- Calendar sync for schedule-aware planning
- Referral program / sharing features

### Vision (Future)

- Onboarding as an ongoing relationship, not a one-time flow
- Re-onboarding for goal changes or major life events
- Coach "memory" that references onboarding insights months later

---

## User Journeys

### Journey 1: Alex — "The Data-Rich Runner Turned Believer"

**Persona:** Alex, 32, software engineer. Runs 5x/week, 45K weeks, chasing sub-35 10K. Wears a Garmin, syncs to Strava. Has tried other apps and found them too rigid or generic. Curious about AI coaching but wants to see it actually work.

**Opening Scene:**

Alex downloads Cadence after seeing a Strava post showing the AI's reasoning stream. He's intrigued but guarded. He opens the app, confirms his name, and connects Strava when prompted.

**Rising Action:**

The Thinking Stream appears — monospace text streaming line by line:

```
Loading 12 weeks of activity data...
Weekly volume: 42-48km. Consistent. Nice.
Long runs: Saturdays, typically 14-18km.
Easy pace from recent runs: 5:35-5:45/km.
Rest days last month: 3. That's... not many.
Detecting workout patterns... Tuesday intervals, Thursday tempo.
```

Alex watches. This isn't a loading screen. The AI is *showing its work*. He thinks: "Wait, it's actually reading my data."

The coach returns: *"A couple things jumped out. You're not taking many rest days — 3 in the last month. And your easy runs might be a bit hot for true recovery."*

Alex's skepticism cracks. *That's accurate.*

The conversation continues — goal (sub-35 10K, 8 weeks out), schedule, injuries, sleep, stress. The coach references earlier answers contextually.

**Climax:**

Plan generation. Another Thinking Stream analyzes him against his goal:

```
Current estimated 10K time: 36:20-36:50
Gap to close: 80-110 seconds. Achievable.
Easy pace analysis: running 5:35-5:45, threshold suggests 5:55-6:05 optimal
→ Easy days 15-20s too fast. Recovery compromised.
→ Volume ramp capped at 8% weekly to protect
```

Visualizations appear: RadarChart (runner profile), ProgressChart (8-week trajectory), CalendarWidget (typical week). The coach explains the recovery discipline score and why sub-35 is realistic.

**Resolution:**

Alex expands the decision audit — every "why" is traceable to his data. He gets it. He taps "Start Free Trial."

---

### Journey 2: Karim — "The Eager Learner Without Data"

**Persona:** Karim, 26, graphic designer. Started running 8 months ago. Just ran his first half marathon in 1:52. Hasn't connected to Strava. Hungry to improve, doesn't know where to start.

**Opening Scene:**

Karim downloads the app after seeing a friend's Instagram story. The coach greets him, offers wearable connection. Karim taps "I'll do this later." The coach responds: *"No problem. I'll learn as we go."*

**Rising Action:**

The coach asks questions conversationally. Karim selects "I run regularly, keeping it casual" but adds: "just did my first half marathon though!"

The coach catches it: *"Oh nice — a half marathon! That's a real milestone. When was this?"*

When Karim says he wants to get faster but has no race on the calendar, the coach adapts:

*"That's totally fine. Not everyone needs a race to train smart. Let me ask it differently — if you could run any distance comfortably and fast, what would feel like an accomplishment?"*

Karim mentions sub-25 5K. The coach proposes a rolling improvement cycle — no race pressure, but structured progress. The conversation continues through schedule, injuries, coaching style. When Karim identifies pacing as his challenge, the coach responds: *"That's really common for newer runners. I'll help you feel okay with slow."*

**Climax:**

Plan generation draws entirely from conversation:

```
Runner profile: 8 months experience, first half 1:52
Goal: General improvement, speed interest (5K stretch goal: sub-25)
Training mode: Rolling improvement cycle, no race anchor
```

The RadarChart shows a balanced but early profile. The coach frames it positively: *"You're early in your running journey, which means your ceiling is high."*

**Resolution:**

Karim feels like he has a plan for the first time — not just "run more," but actual structure. He taps "Start Free Trial."

---

### Journey 3: Lucie — "The Comeback Runner Seeking Permission"

**Persona:** Lucie, 41, marketing director. Ran a 3:35 marathon two years ago. Tore her calf. 8 months of rehab, 6 months of tentative returns. Deep fear of re-injury. She doesn't need motivation — she needs *confidence*.

**Opening Scene:**

Lucie connects Strava. The Thinking Stream runs:

```
Notable gap: 8 months (injury?)
Pre-gap volume: 55-65km/week. Consistent.
Post-gap: Sporadic. 2-3 weeks on, then silence.
Pattern detected: Start-stop cycles. Possible confidence issue.
```

The coach speaks carefully: *"I can see something happened about 18 months ago. Significant gap, then some start-stop cycles. Before that, you were putting in real work. Can I ask what happened?"*

**Rising Action:**

Lucie types: "Calf tear. Took 8 months to heal. I'm scared to push again."

The coach responds: *"That makes complete sense. A calf tear isn't just physical — the trust in your body takes longer to rebuild than the muscle. The start-stop pattern I saw... that's fear, not weakness."*

*"Here's what I want you to know: I'm not going to push you back to 60K weeks. I'm going to build confidence milestones, not pace targets."*

The coach asks what a win would feel like. Lucie types: "Finishing a run without checking my calf every 5 minutes."

*"That's a real goal. Let's work toward that."*

**Climax:**

Plan generation is different — a trust-rebuilding protocol:

```
This is NOT a performance plan. This is a trust-rebuilding protocol.

Weeks 1-3: Micro-progressions. Short, easy, predictable.
Weeks 4-6: Slightly longer, introduce body awareness cues.
Weeks 7-8: First "real" run — continuous 30min at comfortable effort.

- No speed work until confidence established
- Every session has explicit "what to watch for" guidance
- Permission to stop without failure
```

The RadarChart shows Injury Resilience at 35. The coach addresses it: *"That's not about your body — it's about your trust in your body. We're going to rebuild that."*

**Resolution:**

Lucie expands the decision audit. No app has ever told her it's okay to stop. She exhales. She taps "Start Free Trial."

---

### Journey Requirements Summary

| Capability | Revealed By |
|------------|-------------|
| Strava OAuth + data analysis pipeline | Alex |
| Full conversational flow (no wearable) | Karim |
| Free text parsing + contextual references | Karim |
| "No goal yet" → Open Training mode | Karim |
| Injury history handling + sensitive language | Lucie |
| Non-performance goals (confidence, trust) | Lucie |
| Trust-rebuilding protocol as plan mode | Lucie |
| Thinking Stream (collapsible, streaming) | All |
| RadarChart, ProgressChart, CalendarWidget | All |
| Decision audit trail (expandable "why") | All |
| Progress tracking via Runner Object | All |
| Paywall with trial CTA | All |

---

## Domain Requirements

### Positioning

**Wellness, not medical.** Cadence is explicitly positioned as a fitness/wellness product to stay outside FDA medical device classification. Language guardrails:
- ✅ "Your HRV suggests you should take an easy day"
- ❌ "Your HRV indicates a cardiac condition"

All coaching language frames insights as training guidance, not health diagnosis.

### Data Privacy & Compliance

| Regulation | Applies When | Key Requirements |
|------------|--------------|------------------|
| **GDPR** | EU users | Explicit consent for health-adjacent data, right to erasure, data portability |
| **CCPA/CPRA** | California users | Disclosure of data collection, opt-out rights, sensitive data handling |
| **API Terms** | All users | Comply with Apple HealthKit and Strava API terms of service |

**Data collection for improvement:** User data will be collected and used to improve the product over time. This requires:
- Clear consent during onboarding
- Transparent data usage policy
- Ability to use aggregated/anonymized data for training engine improvements

### AI Transparency

Covered by existing design:
- **Thinking Stream** shows reasoning in real-time
- **Decision Audit Trail** explains every coaching decision
- **Expandable "why" sections** provide full traceability

No additional requirements needed — transparency is a core feature, not a compliance bolt-on.

---

## Mobile App Specific Requirements

### Platform & Framework

| Dimension | Specification |
|-----------|---------------|
| **Framework** | React Native with Expo |
| **Target Platforms** | iOS and Android (simultaneous launch) |
| **Minimum iOS Version** | iOS 15+ (for HealthKit features) |
| **Minimum Android Version** | Android 10+ (for Health Connect APIs) |
| **LLM Integration** | Vercel AI SDK for streaming responses, tool calls, and conversational AI |

### Device Permissions for Onboarding

| Permission | Platform | When Requested | Purpose |
|------------|----------|----------------|---------|
| **HealthKit** | iOS | During wearable connection step | Access running/activity data from Apple Health |
| **Health Connect** | Android | During wearable connection step | Access running/activity data (Android equivalent) |
| **Network** | Both | Implicit | Required for Strava OAuth, LLM requests, plan generation |
| **Microphone** | Both | When voice input offered | Voice input for conversational flow |
| **Notifications** | Both | End of onboarding or post-trial | Push notifications for coaching reminders |

**Permission UX Principles:**
- Request permissions contextually (when the feature is needed), not upfront
- Explain value before requesting ("To analyze your runs, I'll need access to your health data...")
- Graceful degradation if permission denied

### Offline & Network Behavior

**Onboarding requires network connectivity** for:
- Strava OAuth flow
- HealthKit/Health Connect data sync
- LLM requests (conversational AI)
- Plan generation

**Graceful Fallback Strategy:**

| Scenario | Behavior |
|----------|----------|
| No network at start | Show friendly message: "I need to be online to get started. Connect to WiFi or cellular and let's try again." |
| Connection lost mid-flow | Pause and show reconnecting state. Resume from last stable point when connection restored. |
| Slow/flaky connection | Streaming UI helps mask latency. Thinking Stream can pause/resume gracefully. |

**Data persistence:** Partial progress (Runner Object state) cached locally so users don't restart if they close the app or lose connection temporarily.

### Store Compliance

| Store | Category | Key Requirements |
|-------|----------|------------------|
| **App Store** | Health & Fitness | Privacy nutrition label, wellness (not medical) positioning, HealthKit usage description |
| **Play Store** | Health & Fitness | Health Connect permissions disclosure, data safety section |

---

## Functional Requirements

### 1. Account & Authentication

- **FR1:** User can create a new account using email/password or social login
- **FR2:** User can authenticate to access the app
- **FR3:** User can recover access if they forget their credentials
- **FR4:** User can view and accept terms of service and privacy policy during onboarding
- **FR5:** User can provide explicit consent for health data collection and usage

### 2. Data Integration

- **FR6:** User can connect their Strava account via OAuth to import running data
- **FR7:** User can grant HealthKit access (iOS) to import running/activity data
- **FR8:** User can grant Health Connect access (Android) to import running/activity data
- **FR9:** User can skip wearable/data connection and proceed with conversational-only flow
- **FR10:** System can retrieve historical running activity data from connected sources
- **FR11:** User can see status of data sync in progress
- **FR12:** User can retry data connection if initial sync fails

### 3. Conversational Flow

- **FR13:** User can engage in natural language conversation with the coach
- **FR14:** User can respond to coach questions via multiple choice selection
- **FR15:** User can respond to coach questions via free text input
- **FR16:** User can respond to coach questions via voice input
- **FR17:** User can confirm or edit information the coach has captured about them
- **FR18:** Coach can ask contextually relevant follow-up questions based on prior responses
- **FR19:** Coach can reference information from earlier in the conversation
- **FR20:** Coach can adapt question flow based on user's stated goals and situation
- **FR21:** User can see progress through the onboarding flow (data completeness indicator)

### 4. Data Analysis & Insights

- **FR22:** System can analyze connected wearable data to identify running patterns (volume, frequency, pace, rest days)
- **FR23:** System can detect potential issues in training patterns (easy pace too fast, insufficient rest, etc.)
- **FR24:** System can estimate current fitness level from available data
- **FR25:** System can build runner profile from conversational input when no wearable data available
- **FR26:** User can see the coach's analysis reasoning in real-time (Thinking Stream)
- **FR27:** User can collapse/expand the Thinking Stream display
- **FR28:** Coach can surface specific, personalized insights about the user's running

### 5. Goal & Context Capture

- **FR29:** User can specify a race goal with target distance and date
- **FR30:** User can specify a time target for their goal race
- **FR31:** User can indicate they have no specific race goal ("Open Training" mode)
- **FR32:** User can describe their running experience level
- **FR33:** User can specify their typical weekly running schedule and availability
- **FR34:** User can disclose injury history
- **FR35:** User can describe their comeback situation if returning from injury
- **FR36:** User can indicate non-performance goals (confidence rebuilding, consistency, etc.)
- **FR37:** User can specify their preferred coaching style

### 6. Plan Generation & Presentation

- **FR38:** System can generate a personalized training plan based on runner profile and goals
- **FR39:** System can generate a trust-rebuilding protocol for comeback runners
- **FR40:** System can generate an open training cycle for users without race goals
- **FR41:** User can see their runner profile visualized (RadarChart with key dimensions)
- **FR42:** User can see their training progression visualized (ProgressChart with volume/intensity over time)
- **FR43:** User can see their typical training week visualized (CalendarWidget)
- **FR44:** User can see projected outcomes (estimated race time, confidence level)
- **FR45:** User can see the reasoning behind each major coaching decision (Decision Audit Trail)
- **FR46:** User can expand individual decisions to see detailed justification
- **FR47:** Coach can explain plan decisions using language appropriate to the user's situation

### 7. Progress Tracking

- **FR48:** System can track Runner Object data completeness throughout onboarding
- **FR49:** System can persist partial onboarding progress locally
- **FR50:** User can resume onboarding from where they left off if interrupted
- **FR51:** System can indicate which data fields are still needed

### 8. Monetization & Trial

- **FR52:** User can view the paywall screen after completing onboarding
- **FR53:** User can see what they get with a trial subscription
- **FR54:** User can start a free trial
- **FR55:** User can see pricing and subscription options

### 9. Error Handling & Recovery

- **FR56:** User can see a friendly message when network is unavailable
- **FR57:** User can see reconnection status when connection is restored
- **FR58:** System can resume from last stable state after connection interruption
- **FR59:** User can see helpful guidance if permission is denied

---

## Non-Functional Requirements

### Performance

| Requirement | Target | Rationale |
|-------------|--------|-----------|
| **NFR-P1:** Thinking Stream text should begin streaming | <2 seconds after trigger | User needs immediate feedback that the AI is "thinking" |
| **NFR-P2:** LLM responses should begin streaming | <3 seconds after user input | Conversational feel requires quick response start |
| **NFR-P3:** Strava/HealthKit data sync should complete | <15 seconds for typical user history | User shouldn't wait too long before seeing analysis |
| **NFR-P4:** Visual charts (Radar, Progress, Calendar) should render | <1 second after data available | Plan presentation should feel instant |
| **NFR-P5:** App startup to first coach message | <5 seconds | First impression matters |

### Security

| Requirement | Description |
|-------------|-------------|
| **NFR-S1:** All data transmission must use TLS 1.2+ encryption | Data in transit protected |
| **NFR-S2:** OAuth tokens (Strava) must be stored securely | Use platform secure storage (Keychain/Keystore) |
| **NFR-S3:** User health data must not be logged in plain text | Protect sensitive data from exposure in logs |
| **NFR-S4:** Session tokens must expire and refresh appropriately | Standard auth security practices |
| **NFR-S5:** GDPR right to erasure must be technically feasible | User data deletion on request |

### Integration

| Requirement | Description |
|-------------|-------------|
| **NFR-I1:** Strava OAuth flow must handle token refresh gracefully | No user re-auth required mid-session |
| **NFR-I2:** HealthKit/Health Connect access must respect permission state changes | Handle permission revocation |
| **NFR-I3:** LLM API failures must fallback gracefully | Show user-friendly error, allow retry |
| **NFR-I4:** Network interruptions must not lose user progress | Local state persistence |

### Reliability

| Requirement | Target |
|-------------|--------|
| **NFR-R1:** Onboarding flow must handle network interruption | Resume from last stable state |
| **NFR-R2:** Partial progress must persist across app restarts | Runner Object cached locally |
| **NFR-R3:** LLM streaming must handle partial responses | Graceful recovery if stream breaks |

### Accessibility (MVP Baseline)

| Requirement | Description |
|-------------|-------------|
| **NFR-A1:** Text must be readable at system font size settings | Respect user accessibility preferences |
| **NFR-A2:** Interactive elements must have sufficient tap targets | Minimum 44pt touch targets |
| **NFR-A3:** Color must not be the only indicator of information | Support for color blindness |

---

