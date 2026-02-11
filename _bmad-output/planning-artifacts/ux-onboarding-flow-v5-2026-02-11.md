# Cadence: Onboarding Flow Script (V5)

**Date:** 2026-02-11
**Author:** NativeSquare + Sally (UX Designer)
**Status:** Draft
**Predecessor:** V4 (same date)

---

## What Changed from V4

| Aspect | V4 | V5 |
|---|---|---|
| **Questions** | 5 questions (injury, motivation, schedule, past apps, detail pref) | 6 structured sections: Runner Profile → Goals → Schedule → Injury/Risk → Coaching Style → Mental Game |
| **Question focus** | Mixed: some about the runner, some about the app | All about the runner. "What type of runner are you?" is the throughline |
| **Branching** | Flat -- same questions for everyone | Smart branching based on experience level (beginners skip pace, serious runners get volume questions) |
| **Goal selection** | Separate scene after questions | Integrated as Section 2, with conditional follow-ups based on goal type |
| **Calendar** | Not present | New data bridge: "Connect your calendar so I can see the busy days myself" |
| **Injury profiling** | Single question about injury history | Expanded: past injuries, current pain, recovery perception, sleep, stress |
| **Coaching preference** | Detail preference only | Explicit coaching voice preference (tough love / encouraging / analytical / minimalist) |
| **Behavioral profiling** | Not present | New: biggest challenge, skip triggers, data-vs-feel preference |
| **Removed from V4** | -- | "Past app experiences" question (product research, not coaching). "Detail preference" question (now subsumed by coaching style + data preference) |

**Core insight:** V4 asked some questions that a coach would ask and some that a product manager would ask. V5 asks only what a coach would ask. Every question maps to a runner identity dimension, not an app preference.

---

## Design Philosophy

_Carried from V4 -- unchanged._

### Core Interaction Paradigm: The Coaching Voice

Cadence communicates through **streaming text with haptic feedback** -- text appears in thought-paced phrases, the way a real person speaks. Not word-by-word (chatbot), not paragraph-by-paragraph (document). Phrase by phrase, with purposeful pacing and haptic punctuation that give the AI a sense of presence.

**Pacing principle: Energetic human, not dramatic AI.** The streaming speed and pauses between phrases should match the rhythm of a confident, energetic person talking -- someone who knows what they want to say and says it. Not rushed, not slow. Think of a coach at the track who speaks with momentum, not a narrator reading poetry. Pauses exist to let a point land, not to create atmosphere. If a pause feels like it's there for *effect*, it's too long.

This is not an onboarding gimmick. It is the signature interaction pattern of the entire app.

### Haptic Language

Three haptic "notes" define Cadence's body language:

| Haptic             | Feeling           | When                                             |
| ------------------ | ----------------- | ------------------------------------------------ |
| **Arrival pulse**  | Soft, warm        | Cadence begins speaking. "I'm here."             |
| **Insight tap**    | Slightly sharper  | Landing on something important. "Pay attention." |
| **Question pause** | Different texture | Asking the user something. "Your turn."          |

### Visible Thinking (Cursor-Style)

Every time Cadence analyzes data or makes a coaching decision, the reasoning process is visible:

1. **Thinking stream** flows in real time -- raw reasoning in a distinct visual container (muted treatment, like inner thoughts)
2. **Stream collapses** into an expandable **"▸ Thinking"** block
3. **Coaching response** appears below -- Cadence's warm, streaming voice delivering the human-readable conclusion

This creates **progressive disclosure trust**:

- **The coaching voice** -- what Cadence tells you (everyone reads this)
- **The thinking block** -- the raw reasoning (power users expand, curious users peek, casual users skip)
- **The conversation** -- the runner pushes back, asks questions, corrects (deepens the relationship)

### Visual Identity: Controlled Intensity

Not wellness-calm. Not sports-aggressive. **Controlled intensity** -- the feeling of a coach who speaks warmly but whose words are precise.

- **Palette:** Deep charcoal base with a sharp signature accent. When reasoning, a subtle warmth/glow signals concentration.
- **Typography:** Clean, modern, confident. Generous line height. Each thought group gets space to land.
- **Motion:** Fluid but purposeful. Nothing bounces. Things move with intent. The streaming text IS the motion design.
- **Two modes:** Coaching Mode (immersive, streaming, intimate) and Training Mode (glanceable, data-forward, crisp). Same DNA, different moments.

---

## Pre-Scene: Authentication

Fast, forgettable. Apple/Google sign-in, one tap, done. No profile setup. No "tell us about yourself." The app eats the friction so the coach can do the asking. The moment auth completes, cut to black.

---

## ACT 1: THE MEETING

**Emotional arc: Curiosity → Intrigue → Openness**

---

### Scene 1: Welcome (Two Parts)

_The screen is dark. Then:_

**Part 1: Introduction**

_(Arrival pulse)_

> **"Hey Alex!"**

_Short beat. The name came from the sign-in. Small thing. Matters enormously._

> **"I'm Cadence."**

_Beat._

> **"Not just a training plan. Not a calendar. Your running coach."**

_A single **"Hey Cadence!"** button appears. The user taps to continue -- it's a micro-moment of buy-in, like greeting your coach back._

**Part 2: Transition to Questions**

> **"But every runner's different. Before I coach you, I need to know who I'm working with."**

_(Question pause haptic)_

> **"Mind a few questions?"**

_A single "Get Started" button appears._

**Design note:** The two-part welcome does double duty: Part 1 establishes identity and positioning with energy -- Cadence shows up confident, not contemplative. Part 2 turns the user's attention outward and earns permission to ask. The transition is natural -- "I'm a coach" → "but I need to know *you*" → questions. No disconnect, no pitch about methodology.

---

## ACT 2: GETTING TO KNOW EACH OTHER

**Emotional arc: Curiosity → Connection → Investment**

_The questions begin immediately. No explanations about how Cadence works. No methodology pitch. Just a coach who's curious about the person in front of them._

_Six sections flow as a continuous conversation. Within each section, questions use tappable options and auto-advance. Between sections, Cadence reacts briefly -- proving it's listening, bridging to the next topic. Back button always available._

**Pacing principle for questions:** Each section should take 15-30 seconds. Total question time target: ~2-3 minutes. Fast enough that it doesn't feel like a form. Slow enough that Cadence's reactions land.

---

### Scene 2: Runner Profile

_Flows directly from the Welcome. Cadence is curious, not clinical._

_(Arrival pulse)_

> **"First things first -- where are you at with running right now?"**

**Q2.1: Runner type** _(single select)_

- Just getting started
- Getting back into it after a break
- I run regularly, keeping it casual
- I train seriously

**The next questions branch based on runner type:**

---

**Branch A: "Just getting started"**

**Q2.2a: How long?**

> **"How long have you been at it?"**

- Less than a month
- A few months
- About a year

**Q2.3a: Frequency**

> **"How many days a week are you running?"**

- 1–2
- 3–4
- 5+

_No pace question. Beginners shouldn't be asked to quantify something they're still figuring out._

---

**Branch B: "Getting back into it"**

**Q2.2b: Time away**

> **"How long were you out?"**

- A few weeks
- A few months
- A year or more

**Q2.3b: Previous level**

> **"Before the break, how much were you running?"**

- 1–2 days/week
- 3–4 days/week
- 5+ days/week

**Q2.4b: Current longest run**

> **"What's your longest run been since coming back?"**

- Haven't started yet
- Under 5K
- 5–10K
- 10K+

---

**Branch C: "Casual runner"**

**Q2.2c: Frequency**

> **"How many days a week?"**

- 1–2
- 3–4
- 5+

**Q2.3c: Weekly volume**

> **"What's a typical week look like distance-wise?"**

- Under 20K
- 20–40K
- 40–60K
- 60K+

**Q2.4c: Easy pace**

> **"What's your comfortable pace?"**

_Pace input field (min:sec /km) or "Not sure" option._

---

**Branch D: "I train seriously"**

**Q2.2d: Frequency**

> **"How many days a week?"**

- 4–5
- 6
- 7

**Q2.3d: Weekly volume**

> **"Weekly volume?"**

- 40–60K
- 60–80K
- 80–100K
- 100K+

**Q2.4d: Longest recent run**

> **"Longest run in the last month?"**

_Distance input field._

**Q2.5d: Easy pace**

> **"Easy pace?"**

_Pace input field (min:sec /km)._

---

**Cadence reaction after Section 2** _(contextual, based on answers):_

- _Beginner:_ "Alright, early days. That's actually a great time to build the right habits from the start."
- _Returning:_ "Coming back is its own skill. The fitness is still in there -- we just need to get at it the right way."
- _Casual:_ "Solid base. You've got consistency going for you -- that's half the battle."
- _Serious:_ "Okay, you're putting in real work. Let's make sure every session is earning its spot."

---

### Scene 3: Goals

_(Insight tap)_

> **"Now the big one -- what are you working toward?"**

**Q3.1: Goal type** _(single select)_

- Training for a specific race
- Getting faster (no race in mind)
- Building up my mileage / base building
- Getting back in shape
- General fitness & health

**The follow-ups branch based on goal type:**

---

**Branch: "Specific race"**

**Q3.2r: Distance**

> **"What distance?"**

- 5K
- 10K
- Half Marathon
- Marathon
- Ultra
- Other _(input)_

**Q3.3r: Target time**

> **"Got a target time in mind?"**

- Yes → _time input field_
- Not yet -- help me figure that out
- Just want to finish

**Q3.4r: Race date**

> **"When's the race?"**

- _Date picker_
- Not registered yet
- Just exploring

---

**Branch: "Getting faster"**

**Q3.2f: What faster means**

> **"What does faster look like for you?"**

- A specific pace goal → _pace input_
- A distance PR → Which distance? + Current PR input
- I just want to feel faster -- no specific number

---

**Branch: "Building up / base building"**

**Q3.2b: Target**

> **"Where do you want to get to?"**

- Running 3x/week comfortably
- Running 30+ minutes without stopping
- Hitting consistent 40K weeks
- Hitting consistent 60K+ weeks

---

**Branch: "Getting back in shape"**

**Q3.2s: Shape target**

> **"What does 'back in shape' look like?"**

- Get back to where I was before
- Surpass where I was
- Just feel good running again

---

**Branch: "General fitness & health"**

**Q3.2g: Specificity**

> **"Any distance or time targets, or just stay active?"**

- I have something in mind → _input_
- No, just keep me moving

---

**Cadence reaction after Section 3** _(references both runner type AND goal):_

- _Beginner + "just want to finish" a 5K:_ "A first 5K. That's a real milestone -- and we're going to get you there feeling strong, not just surviving."
- _Serious + sub-35 10K:_ "Sub-35 10K. Clear target, tight timeline. I like it. Let me see what we're working with."
- _Returning + getting back in shape:_ "Getting back. You already know what it feels like to be fit -- that memory is an advantage."
- _Casual + general fitness:_ "Keep moving, keep it fun. I can work with that -- and I'll make sure the plan doesn't kill the joy."

---

### Scene 4: Schedule & Life

_(Question pause haptic)_

> **"Let's talk about your week. I need to know what I'm working with."**

**Q4.1: Available days**

> **"How many days can you realistically train?"**

- 2–3
- 4–5
- 6–7

**Q4.2: Off-limits days**

> **"Any days that are completely off-limits?"**

_Multi-select: Mon / Tue / Wed / Thu / Fri / Sat / Sun / None_

**Q4.3: Preferred time**

> **"When do you usually run?"**

- Morning
- Midday
- Evening
- It varies

**Q4.4: Calendar connection**

> **"Got a calendar you'd connect? I can spot the busy days myself."**

_A connection card appears -- clean, minimal. Google Calendar / Apple Calendar / Outlook logos._

**[USER ACTS]:** Taps calendar → permission flow → returns.

**Skip path:**

> **"No worries. I'll work with what you told me."**

---

**Cadence reaction after Section 4:**

> "Got it. That gives me the frame -- I'll build around your life, not the other way around."

---

### Scene 5: Injury & Risk Profile

_(Arrival pulse)_

> **"Now let me ask about the less fun stuff."**

**Q5.1: Past injuries**

> **"Any past injuries that have affected your running?"**

_Multi-select:_

- Shin splints
- IT band syndrome
- Plantar fasciitis
- Knee pain (runner's knee / patella)
- Achilles issues
- Stress fracture
- Hip / glute issues
- Other _(input)_
- None -- I've been lucky

**Q5.2: Current pain**

> **"Anything bothering you right now?"**

- Yes → _select from same body areas as Q5.1_
- Nothing right now

**Q5.3: Recovery perception**

> **"When you've been hurt before, how would you describe your recovery?"**

- I bounce back quick
- It takes a while but I get there
- I tend to push through it _(coaching red flag)_
- Haven't had a real injury yet

**Q5.4: Sleep**

> **"How's your sleep these days?"**

- Solid 7–8 hours
- Inconsistent -- some good nights, some bad
- I'm running on fumes

**Q5.5: Stress level**

> **"General stress level outside of running?"**

- Low -- life's good
- Moderate -- the usual stuff
- High -- a lot going on
- Survival mode

---

**Cadence reaction after Section 5** _(empathetic, specific):_

- _Past shin splints + pushing through injuries:_ "Shin splints and a tendency to push through -- I hear you. That's a pattern I'll watch for. We'll build in a way that doesn't trigger it."
- _No injuries + solid sleep:_ "Clean bill of health and sleeping well? That's a strong foundation. Let's build on it."
- _Current pain + high stress + bad sleep:_ "I want to be honest -- the combination of pain, stress, and sleep debt means we start conservative. The smartest thing right now is protecting your body while we build."

---

### Scene 6: Coaching Style

_(Question pause haptic)_

> **"Almost there. This one's about how you want me to show up."**

**Q6.1: Coaching voice**

> **"What kind of coaching works best for you?"**

- Tough love -- push me, call me out
- Encouraging -- keep it positive, celebrate the wins
- Analytical -- give me the data and the reasoning
- Minimalist -- just tell me what to do

---

**Cadence reaction** _(mirrors the selected style slightly):_

- _Tough love:_ "Good. I won't sugarcoat it then. When something's off, you'll hear it."
- _Encouraging:_ "I like that. We'll focus on what's going right and build from there."
- _Analytical:_ "My kind of runner. You'll get the full breakdown -- numbers, reasoning, all of it."
- _Minimalist:_ "Clean and simple. Session shows up, you run it. I'll save the deep stuff for when it matters."

**Design note:** This single question has outsized impact. It calibrates Cadence's daily voice -- the tone of session descriptions, the depth of thinking blocks, the style of feedback. Tough-love runners get direct language. Analytical runners get longer thinking blocks. Minimalist runners get shorter everything.

---

### Scene 7: The Mental Game

_(Insight tap)_

> **"Last one. Let's go a bit deeper."**

**Q7.1: Biggest challenge**

> **"What's the biggest thing holding you back right now?"**

- Consistency -- I struggle to stick with it
- Time -- there's never enough
- Motivation -- I lose steam
- Fear of injury -- I hold back
- Pacing -- I don't know how to go easy
- I'm not sure -- I just feel stuck

**Q7.2: Skip trigger**

> **"When you skip a run, what's usually the reason?"**

- Too tired
- Too busy
- Weather
- Lost motivation
- Pain or injury worry
- I rarely skip

**Q7.3: Data orientation**

> **"When it comes to numbers -- pace, heart rate, mileage -- are you..."**

- Data-driven -- I love the numbers
- Curious -- I check them but don't obsess
- Feel-based -- I'd rather just run

---

**Cadence reaction after Section 7** _(the most personal one -- proves Cadence understands the human, not just the runner):_

- _Consistency + too tired + feel-based:_ "Consistency and fatigue -- that's usually a plan problem, not a willpower problem. If the plan respects your energy, showing up gets easier."
- _Pacing + data-driven + rarely skip:_ "You show up every day but can't slow down. That's discipline without a governor. I'll be that governor."
- _Fear of injury + pain worry + high stress:_ "There's a loop there -- stress, fear, tension. Part of coaching you is breaking that cycle. We'll start easy. Nothing to fear."
- _Stuck + lost motivation + curious about data:_ "Being stuck usually means you've been doing the same thing long enough to stop seeing change. Fresh eyes -- that's what I'm for."

---

## ACT 3: THE DATA BRIDGE

**Emotional arc: Investment → "Let me give you more"**

_The user has now invested real time and attention. Cadence has demonstrated intelligence through its reactions across six sections. This is the moment to ask for more -- and explain why it matters._

---

### Scene 8: Wearable Connection

_(Insight tap)_

> **"I can already work with what you've told me."**

_Pause._

> **"But I get sharper with more data. If you've got a watch, let me see what your body's been up to."**

_A connection card appears -- clean, minimal. Garmin, COROS, Apple Watch, Strava logos._

**[USER ACTS]:** Taps wearable → OAuth flow → returns.

_A subtle sync indicator appears **top-right** -- a small animated element showing data is flowing in. Persistent, unobtrusive._

**Skip path:** If the user doesn't connect:

> **"No worries. We'll work with what you've told me. You can always connect later."**

_Proceeds directly to Act 4 with adapted depth. The analysis uses conversation data only._

**Design note:** "I can already work with what you've told me" validates the effort the user just put in across 6 sections of questions. "But I get sharper with more data" positions the wearable as a *level-up*, not a prerequisite. The ask feels earned because Cadence has already shown it's smart (through section reactions).

---

## ACT 4: THE READING

**Emotional arc: Anticipation → Fascination → "It actually gets me"**

_Cadence now has conversation context (runner type, goals, schedule, injury profile, coaching preference, behavioral patterns) AND training data (if wearable connected). The thinking stream cross-references all of it._

---

### Scene 9: The Thinking Stream

_(Insight tap)_

> **"Got your data. Let me take a look."**

_The thinking block opens. Distinct visual treatment -- slightly muted, monospace, clearly "the process" not "the conclusion." Streams in real time:_

> `Runner profile: competitive, 6x/week, 60-80K volume, easy pace 5:35/km`
> `Goal: sub-35 10K, April 18. 9 weeks out.`
> `Loading 14 weeks of training history from Garmin...`
> `Weekly volume: 43-47km avg. Consistent. Good adherence.`
> `Long run pattern: Sundays, 14-16km. Solid routine.`
> `Easy run pace: 5:32-5:40 avg`
> `Checking against aerobic threshold from race efforts...`
> `Estimated aerobic ceiling: 5:50-6:00/km`
> `→ Easy days are 15-25s too fast. Recovery is likely compromised.`
> `⚠ Alex noted pacing as biggest challenge -- "I don't know how to go easy"`
> `→ Data confirms: easy pace consistently too hot. Self-awareness is there.`
> `Tuesday intervals: 800m repeats at 4:45-4:55/km`
> `Performance trend last 4 weeks: flattening`
> `Rest days in 8 weeks: 2 genuine rest days. All others have load.`
> `→ Accumulated fatigue likely limiting interval quality`
> `⚠ Sleep: "inconsistent." Stress: "moderate." Recovery capacity reduced.`
> `→ Plan must account for recovery debt, not just training load.`
> `⚠ Past injury: shin splints. Recovery style: "I push through it."`
> `Checking load ramp rates around shin splint onset...`
> `Volume spikes of 12-15% found in weeks 8, 14.`
> `→ Future volume ramps capped at 8-10%. Aggressive loading = injury risk.`
> `Coaching preference: analytical. Data orientation: data-driven.`
> `→ Full reasoning in all sessions. Extended thinking blocks.`
> `Calendar shows Tuesdays and Thursdays packed until 7pm.`
> `→ Key sessions on Tue/Thu must be time-efficient or shifted to AM.`
> `Schedule: 4-5 days available. Off-limits: none. Prefers mornings.`
> `Goal: sub-35 10K in 9 weeks. Current estimate: 36:00-36:30.`
> `Gap: 60-90s. Primary limiters: recovery deficit, easy pace too hot.`
> `→ Sub-35 realistic. 34:45 possible with high compliance.`

_The thinking stream collapses:_

**▸ Thinking** _(tap to expand)_

_Then, a brief moment of coach voice:_

> **"You'll always see this -- how I got to what I got to."**

**Design note:** This single line replaces the entire V3 "Transparent Thinking" scene. It lands because the user just *watched* it happen. They don't need a speech about transparency -- they just experienced it.

**Design note (new in V5):** The thinking stream now references significantly more conversation context: runner type, pacing as biggest challenge, sleep/stress, coaching preference, calendar data, injury pattern + recovery style. Each reference proves a different question mattered.

**Design note (duration):** The thinking stream lasts roughly 15-25 seconds. Long enough to impress, short enough to hold attention.

**Design note (no wearable path):** If the user skipped wearable connection, the thinking stream adapts: uses conversation data only, notes what it *could* analyze with wearable data, and is shorter. The coaching response adapts accordingly.

---

### Scene 10: The Coaching Response

_Cadence's warm streaming voice returns with haptic presence. The human-readable version of the thinking. Tone adapts to coaching preference (Q6.1)._

_(Arrival pulse)_

> **"Okay Alex, here's what I see."**

_Pause._

> **"The good news -- you've got a real base. You show up consistently, your volume is solid, and your interval paces tell me the speed is in there. You're not starting from scratch."**

_Pause._

_(Insight tap)_

> **"The thing that jumped out at me is your easy days. You're running them about 15-20 seconds per K faster than your body actually wants for recovery. And here's the thing -- you told me pacing is your biggest challenge. Your data backs that up. The self-awareness is there, you just need someone to hold you to it."**

_Pause._

> **"Same story with rest days. You've had two in the last couple of months. Your body can't tell the difference between a slow 5K and a moderate one when it's trying to rebuild. Especially with the inconsistent sleep -- recovery is getting squeezed from both sides."**

_Pause._

> **"That connects to the shin splints. I looked at your volume patterns around when those hit -- spikes above 12% week-over-week. And you told me you tend to push through injuries, which means by the time you actually stop, the damage is deeper. We'll stay under 10% when we build, and I'll flag the early signs before you have to."**

_Pause._

> **"One more thing -- I checked your calendar. Tuesdays and Thursdays are packed until 7pm. So your key quality sessions need to land on other days, or we go early morning. We'll figure that out."**

**Design note:** The coaching response now weaves in data from multiple question sections: pacing challenge (Section 7) + wearable data, sleep/stress (Section 5) + rest day patterns, shin splints + "push through" recovery style (Section 5), calendar (Section 4). Every section of questions gets validated in the analysis.

---

### Scene 11: Honest Limits

> **"Quick note -- there were some gaps in your data where I was estimating. I flagged those spots in the thinking."**

_Pause._

> **"When I'm sure, you'll know. When I'm not, you'll know that too."**

**Design note:** Brief. The thinking block is already the accountability mechanism. Admitting limits makes everything else more credible.

---

## ACT 5: THE VERDICT

**Emotional arc: Trust → Belief → Commitment**

---

### Scene 12: The Synthesis

_A brief thinking block appears -- the user expects the pattern now:_

> `Periodization plan for sub-35 10K, 9 weeks:`
> `Weeks 1-4: aerobic correction + build (easy pace fix, add threshold)`
> `Weeks 5-6: race-specific sharpening`
> `Weeks 7-8: peak + specificity`
> `Week 9: taper`
> `Volume ramp: conservative, max 8-10% (shin splint history + push-through tendency)`
> `Rest: minimum 1 full rest day/week (non-negotiable given sleep pattern)`
> `Key sessions: avoid Tue/Thu evenings (calendar conflict)`
> `Coaching mode: analytical + full reasoning (per preference)`
> `Key changes: slow down easy days, add threshold, enforce rest, protect shins`

**▸ Thinking** _(collapses)_

_(Arrival pulse)_

> **"Alright Alex. Here's what I think we should do."**

_Pause._

> **"Three things I'd change."**

> **"One -- easy days come down to 5:50-6:00. It'll feel weird for a week. Trust it."**

> **"Two -- one proper rest day every week. Not a shakeout. Just... nothing. Your sleep is already inconsistent -- we're not adding to the debt."**

> **"Three -- your intervals need to shift. Less short-and-fast, more 10K-specific. And I want to add a threshold session you've been missing."**

_Pause._

> **"If we get those right over the next 9 weeks, I think you're looking at 34:45 to 35:00. The sub-35 is the floor, not the ceiling."**

_Pause._

> **"But that's the big picture. Let me worry about the day-to-day."**

---

### Scene 13: The Handoff

> **"I'll have your session ready in the morning. Full reasoning, as always -- you'll see why I picked it and how it fits."**

_Pause._

> **"And remember -- if something doesn't feel right, just tell me. That's how we get better at this."**

_Pause._

> **"We good?"**

_Single button: **"Let's run."**_

**FADE TO: The home screen. Tomorrow's session is already visible. Cadence is quiet now -- but present. Waiting for morning.**

---

## Flow Summary

| #   | Scene                     | What Happens                                                                                | Emotional Beat             |
| --- | ------------------------- | ------------------------------------------------------------------------------------------- | -------------------------- |
| 1   | **Welcome**               | Two-part: intro + "mind a few questions?"                                                   | Curiosity, permission      |
| 2   | **Runner Profile**        | Experience level, frequency, volume, pace (branched by runner type)                         | Identity, recognition      |
| 3   | **Goals**                 | Goal type + conditional follow-ups (race/faster/build/shape/health)                         | Purpose, direction         |
| 4   | **Schedule & Life**       | Available days, off-limits, preferred time, calendar connection                             | Practical trust            |
| 5   | **Injury & Risk**         | Past injuries, current pain, recovery style, sleep, stress                                  | Vulnerability, care        |
| 6   | **Coaching Style**        | Tough love / encouraging / analytical / minimalist                                          | Personalization            |
| 7   | **The Mental Game**       | Biggest challenge, skip triggers, data orientation                                          | Being seen                 |
| 8   | **Wearable Connection**   | "I get sharper with more data" → connect or skip                                            | Earned ask                 |
| 9   | **The Thinking Stream**   | Visible reasoning. Wearable data + all 6 sections cross-referenced.                        | Fascination, transparency  |
| 10  | **The Coaching Response** | Personalized findings, referencing conversation + data                                      | "It gets me"              |
| 11  | **Honest Limits**         | What Cadence doesn't know                                                                   | Trust                      |
| 12  | **The Synthesis**         | The plan. Three changes. "Sub-35 is the floor."                                             | Belief                     |
| 13  | **The Handoff**           | Tomorrow's session. Push back anytime. "We good?"                                           | Commitment                 |

---

## Question Architecture Summary

| Section | Questions | Branches | Time Est. | Key Signal |
|---|---|---|---|---|
| **Runner Profile** | 3-5 (branched) | 4 paths (beginner / returning / casual / serious) | ~20s | Who am I coaching? |
| **Goals** | 2-4 (branched) | 5 paths (race / faster / build / shape / health) | ~20s | What are we aiming for? |
| **Schedule & Life** | 3 + calendar ask | None | ~15s | What's the container? |
| **Injury & Risk** | 5 | None | ~25s | What are the guardrails? |
| **Coaching Style** | 1 | None | ~5s | How should I talk to you? |
| **Mental Game** | 3 | None | ~15s | What's under the surface? |
| **TOTAL** | 17-21 questions | 9 branch paths | ~2-3 min | Full runner profile |

---

## Key Design Decisions

1. **Runner identity first:** The onboarding's primary job is to answer "what type of runner are you?" Every question maps to a runner dimension, not a product preference. No questions about past apps, no questions about feature preferences.

2. **Smart branching:** A beginner and a competitive runner shouldn't see the same questions. Branch A (beginner) skips pace entirely. Branch D (serious) asks for exact volume and pace. Same conversational feel, different depth.

3. **Calendar as data bridge:** Calendar connection sits inside the schedule section where it's contextually relevant -- not as a separate scene. "I can spot the busy days myself" positions it as Cadence being proactive, not asking for more permissions.

4. **Expanded health profiling:** Sleep and stress aren't running questions -- they're *coaching* questions. A coach who ignores that you're sleeping 5 hours a night is a bad coach. This data directly affects training load decisions.

5. **Coaching style has outsized impact:** One question, but it calibrates every future interaction. Daily session descriptions, thinking block depth, feedback tone -- all keyed to this answer.

6. **"Push through injuries" as red flag:** Q5.3 (recovery perception) isn't just data collection -- it's risk profiling. A runner who says "I push through it" gets flagged for proactive injury prevention in the thinking stream.

7. **Section reactions, not per-question reactions:** V4 reacted after every answer. V5 reacts between sections. This keeps the pace up (tap-tap-tap within sections) while still proving Cadence is listening (intelligent bridge between sections).

8. **Show, don't tell, transparency:** Unchanged from V4. The thinking stream IS the proof. One line: "You'll always see this."

9. **Conversation before data:** Questions happen before wearable sync, so the analysis cross-references both. The user feels heard AND analyzed.

10. **17-21 questions in 2-3 minutes:** Tappable options keep velocity high. Most questions are single-select with 3-5 options. Only pace and distance inputs require typing. The section reactions create breathing room without slowing pace.

---

## Open Questions

- [ ] Should the calendar connection support manual entry if the user doesn't want to connect? (e.g., "Mark your busy days" interactive calendar)
- [ ] How conversational should the section reactions be? One-liner (current plan) vs. multi-sentence?
- [ ] Should coaching style (Q6.1) affect the tone of subsequent onboarding reactions, or only post-onboarding interactions?
- [ ] Should there be a "connect later" nudge for wearable/calendar after the handoff?
- [ ] For the "no wearable" path: should the thinking stream explicitly say what it could analyze with watch data? Or just be shorter?
- [ ] Should Q5.1 (past injuries) support "Other" with a free-text input, or keep it to the predefined list only?
- [ ] Should we track which questions took longest to answer (hesitation = uncertainty = coaching signal)?
