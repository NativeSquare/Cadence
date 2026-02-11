# Cadence: Onboarding Flow Script (V4)

**Date:** 2026-02-11
**Author:** NativeSquare + Sally (UX Designer)
**Status:** Draft -- brainstorming in progress
**Predecessor:** V3 (same date)

---

## What Changed from V3

| Aspect | V3 | V4 |
|---|---|---|
| **Welcome** | Single intro, immediately asks to connect wearable | Two-part: intro + natural transition to questions |
| **Wearable connect** | Scene 1-2 (first thing after welcome) | Scene 4: earned through conversation + "more data = sharper" bridge |
| **"More data = better"** | Separate scene (Transparent Thinking) | Woven into the wearable ask as motivation |
| **Transparency explanation** | Separate scene before questions | Removed as standalone; shown live during thinking stream |
| **Questions** | After wearable + transparency explanation | Immediately after welcome (Scene 2) |
| **Overall order** | Welcome → Connect → Explain → Questions → Thinking | Welcome → Questions → Goal → Connect → Thinking |

**Core insight:** Trust is built by *being* trustworthy (visible thinking), not by *explaining* trustworthiness. The old "Transparent Thinking" scene told users about transparency before they had any stake. Now, the thinking stream *shows* it after they've invested.

---

## Design Philosophy

_Carried from V3 with tone adjustments -- less meditative, more energetic coach._

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

---

### Scene 2: The Conversation

_Flows directly from the Welcome. Each question appears one at a time. After the user responds (tappable options), Cadence acknowledges the answer with a brief, intelligent reaction before moving on. Not "Great!" -- an actual response that shows it heard._

**Question 1: Injury history**

> **"Any injuries you've dealt with? Anything that still nags at you or crosses your mind when you push the pace?"**

_User selects from options or types._

_Example Cadence reaction: "Shin splints that flare with volume -- that's something I can watch for."_

**Question 2: The mental game**

> **"When a training block gets tough -- not the legs-hurt kind of tough, the motivation kind -- what happens?"**

**Question 3: Life stuff**

> **"What does your week look like outside of running? Any days that are always packed, times that are off-limits?"**

**Question 4: Past experiences**

> **"You've probably tried other apps or plans before. What clicked? What annoyed you?"**

_Example Cadence reaction: "Yeah -- that 'it doesn't know me' feeling is exactly what I'm trying to fix."_

**Question 5: Detail preference**

> **"Quick one -- when it comes to the _why_ behind your training, how deep do you want to go?"**

**Design note:** Questions use tappable options for speed (3 options each, auto-advance after selection). Back button available. But Cadence's brief reactions after each answer are what make this feel like a *conversation*, not a *form*. These reactions demonstrate intelligence -- the proof that answering is worth it.

**Design note (secret UX):** Question 5 sets a detail preference. High-detail users get full reasoning streams daily. Trust-the-process users get shorter coaching with "see full reasoning" expand option.

---

### Scene 3: Goal Selection

_(Arrival pulse)_

> **"Alright, last one -- and this is the big one."**

_Pause._

> **"What are you chasing right now?"**

_Clean interaction card:_

- **Race goal**: Distance (5K / 10K / Half Marathon / Marathon) + optional target time + optional race date
- **Open training**: "No race. I just want to keep getting better."

_Example: 10K -- sub-35:00 -- April 18_

_Cadence reaction: "Sub-35 10K, April 18. 9 weeks out. That's a real target."_

**Design note:** Goal selection comes after the conversation so Cadence has context. The reaction can reference what it learned: injury history affects goal feasibility, schedule affects training frequency, etc.

---

## ACT 3: THE DATA BRIDGE

**Emotional arc: Investment → "Let me give you more"**

_The user has now invested time and attention. Cadence has demonstrated intelligence through its reactions. This is the moment to ask for more -- and explain why it matters._

---

### Scene 4: Wearable Connection

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

**Design note:** "I can already work with what you've told me" validates the effort the user just put in. "But I get sharper with more data" positions the wearable as a *level-up*, not a prerequisite. The ask feels earned because Cadence has already shown it's smart (through question reactions). The "more data = better" message IS the motivation to connect -- not a separate lesson.

---

## ACT 4: THE READING

**Emotional arc: Anticipation → Fascination → "It actually gets me"**

_Cadence now has conversation context AND training data (if connected). The thinking stream cross-references both._

---

### Scene 5: The Thinking Stream

_(Insight tap)_

> **"Got your data. Let me take a look."**

_The thinking block opens. Distinct visual treatment -- slightly muted, monospace, clearly "the process" not "the conclusion." Streams in real time:_

> `Loading 14 weeks of training history from Garmin...`
> `Weekly volume: 43-47km avg. Consistent. Good adherence.`
> `Long run pattern: Sundays, 14-16km. Solid routine.`
> `Easy run pace: 5:32-5:40 avg`
> `Checking against aerobic threshold from race efforts...`
> `Estimated aerobic ceiling: 5:50-6:00/km`
> `→ Easy days are 15-25s too fast. Recovery is likely compromised.`
> `Tuesday intervals: 800m repeats at 4:45-4:55/km`
> `Performance trend last 4 weeks: flattening`
> `Cross-referencing with recovery patterns...`
> `Rest days in 8 weeks: 2 genuine rest days. All others have load.`
> `→ Accumulated fatigue likely limiting interval quality`
> `⚠ Alex mentioned shin splints with volume correlation — checking load ramp rates...`
> `Volume spikes of 12-15% found in weeks preceding shin splint onset`
> `→ Future volume ramps should cap at 8-10% per week`
> `Previous app detected: fixed Tuesday tempo prescription`
> `Alex noted: "felt robotic, same tempo every week"`
> `Checking HR drift during those cycles...`
> `→ Plan wasn't responsive to fatigue. Confirms Alex's instinct.`
> `Goal: sub-35 10K in 9 weeks. Current estimate: 36:00-36:30.`
> `Gap: 60-90s. Primary limiters: recovery deficit, missing threshold work.`
> `→ Sub-35 realistic. 34:45 possible with high compliance.`

_The thinking stream collapses:_

**▸ Thinking** _(tap to expand)_

_Then, a brief moment of coach voice:_

> **"You'll always see this -- how I got to what I got to."**

**Design note:** This single line replaces the entire V3 "Transparent Thinking" scene. It lands 10x harder here because the user just *watched* it happen. They don't need a speech about transparency -- they just experienced it. The line is a label on what they saw, not a promise about the future.

**Design note (duration):** The thinking stream lasts roughly 15-20 seconds. Long enough to impress, short enough to hold attention. Key: it references things the user said during the conversation ("Alex mentioned shin splints," "Alex noted: felt robotic"). This proves the conversation mattered.

**Design note (no wearable path):** If the user skipped wearable connection, the thinking stream adapts: uses conversation data only, notes what it *could* analyze with wearable data, and is shorter. The coaching response adapts accordingly.

---

### Scene 6: The Coaching Response

_Cadence's warm streaming voice returns with haptic presence. The human-readable version of the thinking._

_(Arrival pulse)_

> **"Okay Alex, here's what I see."**

_Pause._

> **"The good news -- you've got a real base. You show up consistently, your volume is solid, and your interval paces tell me the speed is in there. You're not starting from scratch."**

_Pause._

_(Insight tap)_

> **"The thing that jumped out at me is your easy days. You're running them about 15-20 seconds per K faster than your body actually wants for recovery. It doesn't feel fast -- I know. But it means you're going into your hard sessions with a bit of a debt every time."**

_Pause._

> **"Same story with rest days. You've had two in the last couple of months. Your body can't tell the difference between a slow 5K and a moderate one when it's trying to rebuild."**

_Pause._

> **"And that connects to something you told me -- the shin splints. I looked at your volume patterns around when those hit, and there were some spikes above 12% week-over-week. We'll stay under 10% when we build."**

_Pause._

> **"One more thing -- you said your last app felt robotic. You were right. It was prescribing the same Tuesday tempo regardless of what your week looked like. Your data was showing fatigue, and it just... didn't respond."**

**Design note:** The coaching response references the conversation throughout: "something you told me -- the shin splints," "you said your last app felt robotic. You were right." Cadence connected human context to data patterns. That's what a real coach does.

---

### Scene 7: Honest Limits

> **"Quick note -- there were some gaps in your data where I was estimating. I flagged those spots in the thinking."**

_Pause._

> **"When I'm sure, you'll know. When I'm not, you'll know that too."**

**Design note:** Brief. The thinking block is already the accountability mechanism -- the user can expand it and verify. Admitting limits makes everything else more credible.

---

## ACT 5: THE VERDICT

**Emotional arc: Trust → Belief → Commitment**

---

### Scene 8: The Synthesis

_A brief thinking block appears -- the user expects the pattern now:_

> `Periodization plan for sub-35 10K, 9 weeks:`
> `Weeks 1-4: aerobic correction + build (easy pace fix, add threshold)`
> `Weeks 5-6: race-specific sharpening`
> `Weeks 7-8: peak + specificity`
> `Week 9: taper`
> `Volume ramp: conservative, max 8-10% (shin splint history)`
> `Key changes: slow down easy days, add threshold, enforce rest days`

**▸ Thinking** _(collapses)_

_(Arrival pulse)_

> **"Alright Alex. Here's what I think we should do."**

_Pause._

> **"Three things I'd change."**

> **"One -- easy days come down to 5:50-6:00. It'll feel weird for a week. Trust it."**

> **"Two -- one proper rest day every week. Not a shakeout. Just... nothing."**

> **"Three -- your intervals need to shift. Less short-and-fast, more 10K-specific. And I want to add a threshold session you've been missing."**

_Pause._

> **"If we get those right over the next 9 weeks, I think you're looking at 34:45 to 35:00. The sub-35 is the floor, not the ceiling."**

_Pause._

> **"But that's the big picture. Let me worry about the day-to-day."**

---

### Scene 9: The Handoff

> **"I'll have your session ready in the morning. Full reasoning, as always -- you'll see why I picked it and how it fits."**

_Pause._

> **"And remember -- if something doesn't feel right, just tell me. That's how we get better at this."**

_Pause._

> **"We good?"**

_Single button: **"Let's run."**_

**FADE TO: The home screen. Tomorrow's session is already visible. Cadence is quiet now -- but present. Waiting for morning.**

---

## Flow Summary

| #   | Scene                     | What Happens                                                          | Emotional Beat             |
| --- | ------------------------- | --------------------------------------------------------------------- | -------------------------- |
| 1   | **Welcome**               | Two-part: intro + "mind a few questions?"                             | Curiosity, permission      |
| 2   | **The Conversation**      | Intake questions with intelligent reactions                           | Connection, investment     |
| 3   | **Goal Selection**        | Race goal or open training                                            | Purpose                    |
| 4   | **Wearable Connection**   | "I get sharper with more data" → connect or skip                      | Earned ask                 |
| 5   | **The Thinking Stream**   | Visible reasoning. Data + personal context. "You'll always see this." | Fascination, transparency  |
| 6   | **The Coaching Response** | Personalized findings, referencing conversation                       | "It gets me"              |
| 7   | **Honest Limits**         | What Cadence doesn't know                                             | Trust                      |
| 8   | **The Synthesis**         | The plan. Three changes. "Sub-35 is the floor."                       | Belief                     |
| 9   | **The Handoff**           | Tomorrow's session. Push back anytime. "We good?"                     | Commitment                 |

---

## Key Design Decisions

1. **Ask before explain:** V3 explained Cadence's methodology before asking questions. V4 jumps straight into the conversation. Trust is earned through demonstrated intelligence (reactions to answers), not through a pitch.

2. **Wearable as earned ask:** The wearable connection moves from Scene 1 (before the user has any stake) to Scene 4 (after the user has invested in a conversation and seen Cadence respond intelligently). "More data = sharper" is the bridge, not a lesson.

3. **Show, don't tell, transparency:** The V3 "Transparent Thinking" scene (telling users about visible reasoning) is replaced by a single line during the thinking stream: "You'll always see this." The thinking block *is* the proof. No speech needed.

4. **Two-part welcome:** Part 1 establishes identity. Part 2 transitions to questions with a natural ask: "Every runner's different. Mind a few questions?" No gap between who Cadence is and what it needs.

5. **Conversation before data:** Questions happen before wearable sync, so the analysis cross-references both. The user feels heard AND analyzed.

6. **No fake waiting:** If wearable data is syncing during/after questions, the conversation covers the wait. If it finishes before the thinking stream, great. If not, a brief "Your data's still coming in" bridges the gap.

7. **Streaming text + haptic = presence:** Unchanged from V3. The AI has body language. This is the signature no other running app has.

8. **Progressive personality:** Warm, confident coach. Not strict professor, not cheerful chatbot. Smart friend with real expertise.

---

## Open Questions

- [ ] How conversational should the question reactions be? Brief one-liners (current plan) vs. multi-sentence acknowledgments?
- [ ] Should the wearable skip path affect the coaching response tone? (e.g., "I'm working with less data here, but here's what I see...")
- [ ] Exact phrasing for all question reactions (currently only examples for Q1 and Q4)
- [ ] Should there be a "connect later" nudge somewhere after the handoff, for users who skipped?
