# Cadence: Onboarding Flow Script (V3)

**Date:** 2026-02-11
**Author:** NativeSquare + Sally (UX Designer)
**Status:** Flow locked. Sentences under refinement.

---

## Design Philosophy

### Core Interaction Paradigm: The Coaching Voice

Cadence communicates through **streaming text with haptic feedback** -- text appears in thought-paced phrases, the way a real person speaks. Not word-by-word (chatbot), not paragraph-by-paragraph (document). Phrase by phrase, with breathing pauses and haptic punctuation that give the AI a sense of presence.

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
- **Typography:** Clean, modern, confident. Generous line height. Each thought group gets breathing room.
- **Motion:** Fluid but purposeful. Nothing bounces. Things move with intent. The streaming text IS the motion design.
- **Two modes:** Coaching Mode (immersive, streaming, intimate) and Training Mode (glanceable, data-forward, crisp). Same DNA, different moments.

---

## Pre-Scene: Authentication

Fast, forgettable. Apple/Google sign-in, one tap, done. No profile setup. No "tell us about yourself." The app eats the friction so the coach can do the asking. The moment auth completes, cut to black.

---

## ACT 1: THE MEETING

**Emotional arc: Curiosity → Intrigue**

---

### Scene 1: First Contact ✅ LOCKED

_The screen is dark. Not empty-dark -- intentional-dark. Like a room where someone is about to speak. A beat of silence. Then:_

_(Arrival pulse)_

> **"Hey Alex."**

_Pause. 1.5 seconds. The name came from the sign-in. Small thing. Matters enormously._

> **"I'm Cadence."**

_Pause._

> **"I'm not a training plan. I'm not an app that's going to show you a calendar and wish you luck."**

_Pause. Slightly longer._

> **"I'm a running coach. And I'd like to actually coach you -- but first, I need to understand who I'm working with."**

_Pause._

> **"Let's start with the most important thing: your training. Can I see your data?"**

_A connection card appears below the text -- clean, minimal. Garmin, COROS, Apple Watch, Strava logos. Not a wall of options. Just the essentials._

**[USER ACTS]:** Taps wearable. OAuth flow. Comes back.

**Edge case:** If the user doesn't have a wearable or doesn't want to connect yet, Cadence handles it gracefully: _"No worries -- we can work with what you tell me. But the more data I see, the more I can show you what I'm made of. You can always connect later."_ Then skip to Act 2 Scene 4 (The Conversation) with adapted depth. The Reading (Act 3) adapts to limited data or is deferred.

---

### Scene 2: Connect

_OAuth completes. A subtle sync indicator appears **top-right** -- a small animated element showing data is flowing in. Persistent, unobtrusive, always visible. Cadence doesn't pause for it. It keeps talking._

---

## ACT 2: GETTING TO KNOW EACH OTHER

**Emotional arc: Curiosity → Understanding → Openness**

_Data loads in the background. Cadence uses this time to introduce itself and learn about the runner. No dead wait. No "give me a moment." The conversation IS the loading experience._

---

### Scene 3: Transparent Thinking

_(Arrival pulse)_

> **"While this syncs up -- let me tell you a bit more about me."**

_Pause._

> **"When I think about your training, I think out loud. You'll see the whole thing -- what I'm noticing, what I'm connecting, where I'm hesitating. It's just how I'm wired."**

_Pause._

> **"And I learn. The more I know about you -- not just the watch data, but the real stuff, your history, what worries you, how your life fits around your running -- the better I get at reading between the lines."**

_Pause._

> **"So before I look at what your watch has been tracking, I'd love to get to know you a little first."**

---

### Scene 4: The Conversation

_Flows directly from Scene 3. Each question appears one at a time. After the user responds (typed text, voice, or tappable options), Cadence acknowledges the answer meaningfully before moving on. Not "Great!" -- an actual response that shows it heard._

**Question 1: Injury history**

> **"Any injuries you've dealt with? Anything that still nags at you or crosses your mind when you push the pace?"**

_Example response: "Shin splints about a year ago. Month off. Sometimes a twinge on big weeks."_

> **"Got it -- shin splints that flare with volume. That's something I can watch for in your data. We'll make sure your load builds don't get ahead of your legs."**

**Question 2: The mental game**

> **"When a training block gets tough -- not the legs-hurt kind of tough, the motivation kind -- what happens? Do you push through anyway? Pull back? Overthink it?"**

**Question 3: Life stuff**

> **"What does your week look like outside of running? Any days that are always packed, times that are off-limits, stuff I should work around?"**

**Question 4: Past experiences**

> **"You've probably tried other apps or plans before. What clicked? What annoyed you? Anything that made you think 'this thing has no idea what it's doing'?"**

_Example response: "Campus Coach felt robotic. Same Tuesday tempo every week no matter what."_

> **"Yeah -- that 'it doesn't know me' feeling is exactly what I'm trying to fix. Let's see if I can do better."**

**Question 5: Detail preference**

> **"Quick one -- when it comes to the _why_ behind your training, how deep do you want to go? Some people want every detail. Others just want the session and trust the process. Where are you?"**

**Design note:** This secretly sets a UX preference. High-detail users get full reasoning streams daily. Trust-the-process users get shorter coaching with a "see full reasoning" expand option.

**Question 6: The Goal**

_(Arrival pulse)_

> **"Alright, last one -- and this is the big one."**

_Pause._

> **"What are you chasing right now?"**

_Clean interaction card:_

- **Race goal**: Distance (5K / 10K / Half Marathon / Marathon) + optional target time + optional race date
- **Open training**: "No race. I just want to keep getting better."

_Example: 10K -- sub-35:00 -- April 18_

> **"Sub-35 10K, April 18. 9 weeks out. That's a real target."**

_Pause._

> **"Alright -- my data sync just finished too. Perfect timing."**

**Design note:** If data finishes before the conversation, Cadence continues questions naturally. If conversation finishes before data, a brief: _"Your data's still coming in -- almost there"_ with a gentle wait. Either way, transition to Act 3 is smooth.

---

## ACT 3: THE READING

**Emotional arc: Anticipation → Fascination → "It actually gets me"**

_Cadence now has BOTH training data AND personal context from the conversation. The thinking stream reflects all of it -- cross-referencing what the user said with what the data shows._

---

### Scene 5: The Thinking Stream

_(Insight tap)_

> **"Let me go through your data. You'll see my thinking as it happens -- like I said, no black boxes."**

_The thinking block opens. Distinct visual treatment -- slightly muted, possibly monospace, clearly "the process" not "the conclusion." Streams in real time:_

> `Loading 14 weeks of training history from Garmin...` > `Weekly volume: 43-47km avg. Consistent. Good adherence.` > `Long run pattern: Sundays, 14-16km. Solid routine.` > `Easy run pace: 5:32-5:40 avg` > `Checking against aerobic threshold from race efforts...` > `Estimated aerobic ceiling: 5:50-6:00/km` > `→ Easy days are 15-25s too fast. Recovery is likely compromised.` > `Tuesday intervals: 800m repeats at 4:45-4:55/km` > `Performance trend last 4 weeks: flattening` > `Cross-referencing with recovery patterns...` > `Rest days in 8 weeks: 2 genuine rest days. All others have load.` > `→ Accumulated fatigue likely limiting interval quality` > `Cadence data: 178-180 when fresh → 170-172 in final third of long runs` > `→ Form degradation under fatigue` > `⚠ Alex mentioned shin splints with volume correlation — checking load ramp rates...` > `Volume spikes of 12-15% found in weeks preceding shin splint onset` > `→ Future volume ramps should cap at 8-10% per week` > `Previous app detected (Campus Coach): fixed Tuesday tempo prescription` > `Alex noted: "felt robotic, same tempo every week"` > `Checking HR drift during Campus Coach cycles...` > `Weeks 3-4 show consistent overreach signals. Plan did not adapt.` > `→ Confirms Alex's instinct. Plan wasn't responsive to fatigue.` > `Goal: sub-35 10K in 9 weeks. Current estimate: 36:00-36:30.` > `Gap: 60-90s. Primary limiters: recovery deficit, missing threshold work.` > `If easy pace corrected + threshold added + real rest days: projected 90-120s improvement` > `→ Sub-35 realistic. 34:45 possible with high compliance.` > `Risk: shin history. Conservative volume approach required.`

_The thinking stream collapses:_

**▸ Thinking** _(tap to expand)_

**Design note:** The thinking stream lasts roughly 15-20 seconds. Long enough to impress, short enough to hold attention. The user can scroll through it, watch it flow, or let it wash over them. Key: it references things the user said during the conversation ("Alex mentioned shin splints," "Alex noted: felt robotic"). This is the proof that the conversation mattered.

---

### Scene 6: The Coaching Response

_Cadence's warm streaming voice returns with haptic presence. This is the human-readable version of the thinking._

_(Arrival pulse)_

> **"Okay Alex, here's what I see."**

_Pause._

> **"The good news -- you've got a real base. You show up consistently, your volume is solid, and your interval paces tell me the speed is in there. You're not starting from scratch."**

_Pause._

_(Insight tap)_

> **"The thing that jumped out at me is your easy days. You're running them about 15-20 seconds per K faster than your body actually wants for recovery. It doesn't feel fast -- I know. But it means you're going into your hard sessions with a bit of a debt every time. That's probably why your Tuesday repeats have been stalling lately."**

_Pause._

> **"Same story with rest days. You've had two in the last couple of months. The shakeout runs feel harmless, but your body can't tell the difference between a slow 5K and a moderate one when it's trying to rebuild."**

_Pause._

> **"And that connects to something you told me -- the shin splints. I looked at your volume patterns around when those hit, and there were some spikes above 12% week-over-week. We'll stay under 10% when we build. Your legs have already told us where the line is."**

_Pause._

> **"One more thing -- I looked at what Campus Coach was doing."**

_Pause._

> **"You said it felt robotic. You were right. It was prescribing the same Tuesday tempo regardless of what your week looked like. Your heart rate data was showing fatigue in weeks 3 and 4, and it just... didn't respond. I would have eased off by mid-week 3 and let you come into week 4 fresh."**

**Design note:** The coaching response references the conversation throughout: "something you told me -- the shin splints," "You said it felt robotic. You were right." This is the proof that Cadence listened AND analyzed. It connected human context to data patterns. That's what a real coach does.

---

### Scene 7: Honest Limits

> **"Quick note -- there were some HR gaps in your data, and I don't have ground contact or power from your setup. I flagged the spots where I was estimating in the thinking. You can always check."**

_Pause._

> **"When I'm confident, I'll say so. When I'm not, you'll know."**

**Design note:** This callback to the thinking block turns it into an accountability mechanism. The user can literally expand the thinking and verify the AI's honesty. Admitting limits paradoxically makes everything else more credible.

---

## ACT 4: THE VERDICT

**Emotional arc: Trust → Belief → Commitment**

---

### Scene 8: The Synthesis

_A brief thinking block appears -- the user expects the pattern now:_

> `Periodization plan for sub-35 10K, 9 weeks:` > `Weeks 1-4: aerobic correction + build (easy pace fix, add threshold)` > `Weeks 5-6: race-specific sharpening` > `Weeks 7-8: peak + specificity` > `Week 9: taper` > `Volume ramp: conservative, max 8-10% (shin splint history)` > `Key changes: slow down easy days, add threshold, enforce rest days`

**▸ Thinking** _(collapses)_

_(Arrival pulse)_

> **"Alright Alex. Here's what I think we should do."**

_Pause._

> **"You've got the base for a sub-35. The speed is there. What's holding it back is recovery -- easy days too fast, not enough real rest, and hard sessions that land on tired legs. You have more in you than your training's been letting you show."**

_Pause._

> **"Three things I'd change."**

> **"One -- easy days come down to 5:50-6:00. It'll feel weird for a week. Trust it."**

> **"Two -- one proper rest day every week. Not a shakeout. Just... nothing."**

> **"Three -- your intervals need to shift. Less short-and-fast, more 10K-specific. And I want to add a threshold session you've been missing."**

_Pause._

> **"If we get those right over the next 9 weeks, I think you're looking at 34:45 to 35:00. The sub-35 is the floor, not the ceiling."**

_Pause._

> **"But that's the big picture. Let me worry about the day-to-day. Tomorrow, I just need to worry about tomorrow."**

---

### Scene 9: The Handoff

> **"I'll have your session ready in the morning. Full reasoning, as always -- you'll see why I picked it and how it fits."**

_Pause._

> **"And remember -- if something doesn't feel right, just tell me. That's how we get better at this."**

_Pause._

> **"We good?"**

\*Single button: **"Let's run."\***

**FADE TO: The home screen. Tomorrow's session is already visible. Cadence is quiet now -- but present. Waiting for morning.**

---

### Post-Credits: The Next Morning

_Notification:_

> **"Morning, Alex. I looked at your night -- 7h12 sleep, resting HR normal. You're good to go. Here's what I've got for you today."**

The onboarding is over. The coaching has begun. There was never a seam between them.

---

## Flow Summary

| #   | Scene                     | What Happens                                                   | Emotional Beat       |
| --- | ------------------------- | -------------------------------------------------------------- | -------------------- |
| 1   | **First Contact** ✅      | Cadence introduces itself. "Can we start?"                     | Curiosity            |
| 2   | **Connect**               | Wearable OAuth. Data begins loading. Sync indicator top-right. | Action               |
| 3   | **Transparent Thinking**  | While data loads: "Let me tell you a bit more about me."       | Understanding        |
| 4   | **The Conversation**      | Deep intake: injuries, fears, goals, life, preferences.        | Openness, connection |
| 5   | **The Thinking Stream**   | Cursor-style visible reasoning. Data + personal context.       | Fascination          |
| 6   | **The Coaching Response** | Audit findings, referencing what the user shared.              | "It gets me"         |
| 7   | **Honest Limits**         | What Cadence doesn't know. Check the thinking.                 | Trust                |
| 8   | **The Synthesis**         | The plan. Three changes. "Sub-35 is the floor."                | Belief               |
| 9   | **The Handoff**           | Tomorrow's session. Push back anytime. "We good?"              | Commitment           |

---

## Key Design Decisions

1. **Conversation before Reading:** The intake questions happen while data loads, so the AI's first analysis is already personal -- it cross-references what the user said with what the data shows.

2. **No fake waiting:** Cadence never says "give me a moment." It thinks out loud. The thinking stream IS the processing. The only real wait is the technical sync (covered by conversation).

3. **Streaming text + haptic = presence:** The AI has body language. Arrival pulses, insight taps, question pauses. This is the signature that no other running app has.

4. **Cursor-style thinking blocks:** Visible reasoning streams → collapses into expandable "Thinking" → coaching response below. Every runner finds their own depth of engagement.

5. **Trust through transparency:** Honest limits, visible reasoning, and the invitation to push back build trust faster than any marketing claim.

6. **Progressive personality:** Cadence feels like a warm, confident coach -- not a strict professor, not a cheerful chatbot. Smart friend energy with real expertise.
