---
stepsCompleted: [1, 2, 3, 4, 5, 6]
workflowComplete: true
inputDocuments:
  - brainstorming/brainstorming-session-2026-02-09.md
date: 2026-02-10
author: NativeSquare
---

# Product Brief: Cadence

## Executive Summary

Every serious runner knows the feeling: you finish a hard session, open your app, and get nothing back but "Great job. Tomorrow: Easy 8km." No one saw the effort. No one understood the doubt at kilometer 6. No one adjusted for the fact that you barely slept. Cadence exists to end that silence.

Cadence is an AI running coach that democratizes elite coaching intelligence -- not just data analysis at scale, but _pattern intuition at scale_: the wisdom that experienced coaches build over thousands of athletes, extracted through a coach-in-the-loop training flywheel and delivered to every runner through Live Coaching Intelligence. Runners watch the AI reason about their data, their patterns, and their readiness in real time -- not as raw metrics, but as narrative coaching that tells the story of their day, explains every decision, and honestly flags what it doesn't yet know. Built for performance-oriented runners who train seriously but lack access to elite coaching, Cadence's north star is the conviction that AI coaching, given enough time and data, will exceed what any single human coach can deliver -- through compounding individual memory, 24/7 availability, and cross-runner pattern recognition at superhuman scale.

---

## Core Vision

### Problem Statement

Performance-oriented runners face a broken market. On one side, adaptive training apps operate as black boxes with calendars attached -- they prescribe workouts without explanation, adjust without reasoning, and offer no evidence that they understand the individual athlete. On the other side, 1:1 human coaching delivers transformative results but is expensive and structurally unable to scale: demand far outstrips supply. Runners stuck in the middle have no reason to trust their training. They can't tell if the algorithm is working for them, working against them, or simply indifferent to them.

### Problem Impact

This is a confidence crisis. Runners who can't trust their training plan either override it (pushing too hard, risking injury) or follow it blindly (accepting plateaus they shouldn't). But the toll goes deeper than physical outcomes. It's the loneliness of training without anyone who understands your journey. The self-doubt when you can't tell if you're overtraining or just having a bad week. The frustration of finishing a session, opening your app, and seeing "Great job! Tomorrow: Easy run 8km" -- with no acknowledgment that the last 3km felt terrible, no connection to yesterday's load, no sign that anything intelligent is happening behind the screen. Runners don't just need better plans. They need a reason to believe their plan was made _for them_.

### Why Existing Solutions Fall Short

Generic adaptive apps think in outputs, not processes. They deliver a workout but never show their work. They adjust pace or volume based on narrow inputs but never explain why, never predict how a session will feel, and never demonstrate that they've integrated the athlete's full context. The runner's experience is opaque: follow the plan, hope it works, wonder in silence. Meanwhile, human coaches provide exactly this transparency and relationship -- but they're limited by time, attention, and the number of athletes they can serve. The technology to close this gap simply didn't exist until now.

### Proposed Solution

Cadence is an AI running coach built on a phased intelligence strategy, leading with trust before layering delight:

**Phase 1: Match + Explain (Launch)**

- **Goal-Anchored Periodization** -- Every training decision is oriented toward the runner's concrete goals. Runners don't train in a vacuum -- they train for a sub-35 10K in April, a 1:30 half marathon in September, and everything in between. Cadence builds periodized plans anchored to the runner's goal, automatically structuring training blocks, tapers, and recovery cycles around the target race. After each goal is achieved, the AI proposes the next reachable milestones based on trajectory and ambition. Post-MVP, the system evolves to manage multiple concurrent goals with overlapping timelines -- this is where the coaching intelligence truly differentiates, reasoning through prioritization and trade-offs that only experienced coaches can navigate.

  **Supported Goal Types:**

  | | MVP | Post-MVP |
  |---|---|---|
  | **Distances** | 5K, 10K, Half Marathon (21K), Marathon (42K) | Ultra, Trail, custom distances |
  | **Race Goal** | Distance + target time + race date (one active goal) | Multiple concurrent goals with overlapping timelines |
  | **Open Training** | No race -- AI runs rolling improvement cycles and proposes milestones when data supports them | Seasonal periodization, base-building programs, return-from-injury protocols |
  | **Concurrent Goals** | Single active goal | Multiple goals with AI-managed prioritization and trade-off reasoning |
- **Deep Data Intelligence** -- Rigorous analysis of wearable data, training load, biomechanical trends, and physiological markers. Daily calibration based on actual readiness. Predictive injury detection. Recovery debt management. At minimum, everything the best apps do today -- executed with precision. This layer must be bulletproof: the reasoning is only as trustworthy as the data analysis beneath it.
- **Live Coaching Intelligence** -- The signature differentiator. Real-time streamed narrative coaching where the runner watches the AI think about _them_ -- not as data readouts, but as the story of their day: "I looked at your night -- resting HR was 4 beats above baseline, sleep dipped under 6 hours. Your body is still processing Tuesday's tempo work. So today I'm giving you an easy 7km with the last 2km at a rhythm that'll wake up your legs, not punish them. By Thursday, you'll be ready to push again." When the AI encounters incomplete data or uncertainty, it says so honestly -- "Your HR data had a gap this morning, so I'm working with partial information and being conservative today." Transparency about limitations is what makes the transparency trustworthy.

**Phase 2: Predict + Prevent**

- Predictive session framing ("Your Tuesday evening 10Ks typically feel heavy through km 4, then you settle in. Trust it.")
- Early injury drift detection weeks before pain surfaces
- Cross-runner pattern intuition -- insights drawn from thousands of athletes that no single human coach could discover

**Phase 3: Know Your Life**

- Life-aware contextual coaching that understands the runner beyond their splits -- calendar integration, schedule disruption handling, and proactive adaptation ("You have a meeting at 5PM -- let's move the session to 7PM. You'll feel a little sluggish, but we'll work through that.")

Each phase earns the right to the next. Trust before delight. Foundation before expansion.

### Key Differentiators

- **Live Coaching Intelligence:** A new interaction paradigm. No running app shows its work. Cadence streams narrative reasoning in real time -- the runner watches the AI think about them, explain every decision in human language, and honestly flag uncertainty. This builds trust viscerally, doubles as onboarding (the first session IS the proof), and creates organic distribution as runners screenshot and share their AI's coaching narratives on Strava and social media.
- **The Compounding Memory Moat:** Every interaction deepens Cadence's understanding of the individual runner. Month 1 is good. Month 6 is great. Month 12 is uncanny. This accumulated intelligence is irreplaceable and creates natural switching costs that grow over time.
- **The Coach-in-the-Loop Flywheel:** Real human coaches train and correct the AI model, encoding not just analytical knowledge but _pattern intuition_ -- the experiential wisdom built from coaching hundreds of athletes -- into the algorithm. Every human intervention makes the AI smarter for every runner. Competitors can copy features but cannot shortcut this expertise accumulation.
- **Aspirational North Star -- AI Surpassing 1:1 Coaching:** Cadence is built on the conviction that AI coaching, given enough time and data, will exceed what any single human coach can deliver -- through 24/7 availability, perfect memory, and cross-runner pattern recognition at superhuman scale. This is not a launch promise. It is the direction everything is built toward.

---

## Visual Identity

### Design Philosophy

**Apple Fitness simplicity meets coaching intimacy.** The UI is a clean, dark stage — the words and the coaching voice do the emotional work, not the visuals. Every screen follows the same principle: dark background, white text, and the primary accent color reserved exclusively for interactive elements (buttons, selected states, active indicators). Nothing competes with the coaching narrative.

### Color System

| Role | Value | Usage |
|---|---|---|
| **Background** | `#000000` | Primary canvas — flat, consistent, no variation |
| **Surface / Cards** | `#1C1C1E` | Cards, sheets, elevated containers, input fields |
| **Primary Accent** | Linear gradient `#D4FF3A` → `#8DFF1A` | Buttons, CTAs, selected chips, active toggle states |
| **Text Primary** | `#FFFFFF` | All primary readable text — coaching voice, headings, user input |
| **Text Secondary** | `#8E8E93` | Labels, metadata, timestamps, collapsed thinking headers |
| **Text Thinking** | `#8E8E93` | Thinking stream monospace text on card surface |
| **Success** | `#34C759` | Positive data, connected states, health indicators |
| **Warning** | `#FFB800` | Caution flags, injury-related alerts |
| **Error** | `#FF3B30` | Critical errors, destructive actions |

### UI Principles

1. **Dark-mode first** — True black background (`#000000`), matching the app icon and Apple ecosystem conventions
2. **Color is rare and intentional** — The lime gradient appears only on interactive elements: buttons, selected chips, active indicators. Its scarcity is what makes it pop
3. **Haptics are felt, not seen** — Haptic feedback (arrival pulse, insight tap, question pause) is purely tactile. No visual glow or flash accompanies them. The screen stays clean
4. **Text is the interface** — Cadence's streaming coaching voice is the primary UI element. Typography is clean sans-serif, generous line height, warm white on black
5. **Thinking is visually distinct** — Thinking streams use monospace type on a `#1C1C1E` surface card. Clearly "process," not "output." Collapses to a single tappable row when complete
6. **Interactive moments are obvious** — When it's the user's turn to act, the lime gradient appears (button, input border, selected option). The color shift is the cue
7. **Apple-native feel** — Components follow iOS dark-mode conventions: system-dark surfaces, standard rounded corners, familiar interaction patterns. Cadence should feel like it belongs on the same Home Screen as Apple Fitness

---

## Target Users

### Primary Users

#### Persona 1: "The Driven Chaser" -- Core User

**Profile:** Alex, 32, software engineer. Runs 5 days a week, wears a Garmin Forerunner 265 24/7, tracks sleep, HRV, and training load religiously. Follows running influencers on Instagram and YouTube, knows what lactate threshold and VO2max mean, and has opinions about periodization. Has tried Campus Coach (too rigid), Runna (too generic), and KiprunPacer (too ambitious). Currently chasing a sub-35 10K and eyeing a 1:30 half marathon next year.

**Motivations:** Alex doesn't just want to run faster -- he wants to _understand_ why he's running faster. He's the kind of person who reads training theory articles at lunch, compares his splits against last month's, and gets frustrated when an app tells him to do a tempo run without explaining how it fits the bigger picture. He wants to be an active participant in his own coaching, not a passive follower of a calendar.

**Current Pain:** Alex has hit a plateau at 36:30 on the 10K. He's tried increasing volume, adding intervals, and adjusting pacing strategy -- all based on guesswork and Reddit advice. He suspects he's overtraining on easy days and undertraining on hard days but has no one to confirm or correct him. He's considered hiring a coach but can't justify 150-200/month for something that might not work. He feels stuck, alone, and increasingly skeptical of apps that claim to be "adaptive."

**Success Vision:** Alex opens Cadence and watches the AI stream its analysis: "Your easy runs are consistently 15-20 seconds faster than your aerobic ceiling suggests. This is eroding your recovery and blunting your interval adaptation. I'm pulling your easy pace back and restructuring your Tuesday session..." For the first time, someone _saw_ the problem. Not a dashboard. A coach.

#### Persona 2: "The Comeback Runner"

**Profile:** Lucie, 41, marketing director. Ran a 3:35 marathon two years ago, then tore her calf. Eight months of rehab, six months of tentative returns, and a deep fear that she'll re-injure. She wears a COROS Pace 3 and used to love data but now finds it anxiety-inducing -- every spike in heart rate makes her wonder "is it happening again?"

**Motivations:** Lucie doesn't need motivation to run. She needs _confidence_ to run. She wants a coaching presence that understands her injury history, acknowledges her fear, and builds a plan that prioritizes trust milestones over pace targets.

**Current Pain:** Every app she's tried treats her like a fresh runner or an uninjured one. None ask about her calf, none adjust for the psychological weight of comeback running, none tell her the difference between normal adaptation sensations and warning signals. She's training at 60% of her capacity because she's afraid -- and no app has noticed.

**Success Vision:** Cadence's onboarding asks about her injury history, her fears, her recovery timeline. The AI streams: "I can see from your data that you've been holding back significantly below your aerobic capacity -- that's smart caution. Your biomechanical symmetry looks strong. I'm going to build confidence milestones, not pace targets. Week 1: trust the easy run. I'll tell you exactly what to watch for." Lucie exhales for the first time in a year.

#### Persona 3: "The Ambitious Newcomer"

**Profile:** Karim, 26, graphic designer. Started running 8 months ago during a stressful job transition, fell in love with it, and just ran his first half marathon in 1:52. Wears a Garmin Venu, follows running content creators obsessively, and is hungry to improve. Doesn't know what periodization means yet but is eager to learn. Sees serious runners posting their AI coaching insights on Strava and thinks "I want that."

**Motivations:** Karim represents the aspirational user -- not yet performance-level but driven, curious, and willing to learn. He wants a coach that teaches him as it trains him, turning him from a casual runner into a knowledgeable athlete. The Education Flywheel is built for Karim.

**Current Pain:** Every training plan feels like it was designed for someone else. He doesn't know if he should be doing threshold runs or building base. He doesn't know what his data means. He's running by feel, which works until it doesn't.

**Success Vision:** Cadence's reasoning stream doesn't just prescribe -- it _educates_. "Today's session is an easy aerobic run. Here's why this matters for you right now: your aerobic base is still developing, and these runs are where your body builds the capillary density that makes everything else possible. Think of it as laying the foundation." Karim becomes a smarter runner every single day.

### Secondary Users

#### Coaches (Coach Amplifier Model)

Cadence offers a "Coach Edition" where real coaches use the AI as their operating system. The AI handles daily calibration, data analysis, and session prescription -- the coach reviews, approves (or corrects), and focuses their limited time on high-touch moments: pre-race strategy, injury decisions, emotional support during tough blocks. The coach becomes a quality gate and intuition layer, not a plan generator. Every approval and correction trains the model, and the coach scales from 30-40 athletes to 100+ with better outcomes. Down the line, the coach's role evolves as the AI improves -- but the relationship is framed as amplification, not replacement.

#### Running Communities

Running clubs and associations can aggregate members on Cadence, creating shared training environments where the AI understands group dynamics -- club tempo sessions, weekend long runs, race calendars. Club leaders get visibility into member progress, and members benefit from the social accountability layer while still receiving individualized coaching.

### User Journey

#### Discovery

- **Word of Mouth & Referrals:** In-app affiliation program -- if your peer signs up with your code, both get a discounted or free month. Runners trust runners.
- **Influencer Ecosystem:** Mid-range running influencers (10-50K followers) integrate Cadence into daily life content -- showing the AI as their coach from breakfast check-in through session debrief. Not sponsored ads, but authentic "this is how I train now" content.
- **Organic Strava Distribution:** Runners screenshot and share their AI's reasoning stream on Strava, Reddit, and Instagram. The reasoning IS the marketing -- curiosity-driven discovery.

#### Onboarding (Intelligence-First)

1. **Connect wearable** -- Garmin, COROS, Apple Watch. Immediate data sync.
2. **Historical data analysis** -- The AI streams its first thinking process, analyzing weeks or months of training history with visible reasoning. "I can see you've been averaging 45km/week with a long run pattern every Sunday... your pace distribution suggests you're running easy days too fast..."
3. **Deep intake conversation** -- Coach-style questions no app has ever asked: injury history, diseases, fears, busy schedule, life constraints, psychological relationship with training. Critically, this includes **goal registration**: what races or time targets is the runner working toward? When are they? Are there multiple goals with overlapping timelines (a 10K in 6 weeks AND a marathon in 4 months)? The AI must understand the runner's ambitions to anchor everything that follows. The depth of the questions IS the pitch.
4. **Audit & findings presentation** -- The AI presents a synthesis: "Here's What I See" -- showing it integrated data AND human context before prescribing anything.
5. **Future potential preview** -- Show what's coming: calendar integration, predictive coaching, life-aware features. "Connect your calendar and I'll learn your rhythms."

#### The Aha Moment

The first time the runner sees the Live Coaching Intelligence stream and thinks "this is almost human." Confirmed when, after their first session, the AI provides a narrative recap and adapts the next day's session based on what happened -- and the adaptation makes _sense_. Cemented when the AI proactively integrates something the runner didn't even mention -- thinking ahead, like a coach who remembers everything.

#### Long-term Stickiness

- The runner genuinely improves -- PRs, consistency, fewer injuries
- They still love running because the coach manages load and prevents burnout
- They trust the AI coach more than they trust their own instincts -- because it's been right more often, remembers more, and never has an off day
- The compounding memory makes switching unthinkable -- 6 months of learning YOU is irreplaceable

---

## Success Metrics

### User Success Metrics

**How users know Cadence is working for them:**

- **Training Compliance Without Override:** % of prescribed sessions completed as-is, without the runner manually changing pace, distance, or skipping. Rising compliance = rising trust. Target: >75% within first 8 weeks.
- **PR Achievement Rate:** % of users who achieve a personal record within their first training cycle (typically 8-16 weeks). This is the ultimate proof that the coaching works.
- **Injury Rate Reduction:** Fewer training interruptions due to injury compared to the user's historical pattern. Measured as missed training days per quarter vs. pre-Cadence baseline.
- **Reasoning Stream Engagement:** % of users who actively read/expand the Live Coaching Intelligence stream (scroll depth, time spent, feedback submitted). Engagement with reasoning = engagement with coaching.
- **User Feedback Loop Activity:** Number of corrections, reactions, and conversational feedback submissions per user per week. Active feedback means the user is invested in the coaching relationship, not passively consuming.

### Business Objectives

**3-Month Milestones (Validate the Wow Effect):**

- Onboarding completion rate >70% (wearable connected + deep intake completed + first AI audit viewed)
- D7 retention >60% (user returns within first week after onboarding)
- First-session reasoning stream engagement >80% (the Wow Effect is measurable)
- Referral code usage: >10% of new signups come through peer referral

**12-Month Milestones (Prove Trust at Scale):**

- D90 retention >40% (users who stay 3 months are trusting the system)
- Subscription renewal rate >70% at first annual renewal
- Training cycle completion rate >50% (users finishing a full 8-16 week block)
- Net Promoter Score >60 (runners actively recommending Cadence)
- Coach Edition pilot: 50+ coaches onboarded with measurable athlete outcome improvements

**24-Month Milestones (Category Validation):**

- Measurable market share capture from both generic plan apps and traditional 1:1 coaching
- User testimony data showing runners switching _from_ named competitors and _from_ human coaches
- Influencer ecosystem self-sustaining: organic content creation outpacing paid partnerships

### Key Performance Indicators

| Category      | KPI                             | Target          | Measurement                                                    |
| ------------- | ------------------------------- | --------------- | -------------------------------------------------------------- |
| **Adoption**  | Onboarding-to-Active Conversion | >70%            | % completing full onboarding + first coached session           |
| **Adoption**  | Time-to-Aha                     | <10 min         | Time from first app open to first reasoning stream interaction |
| **Adoption**  | Referral Rate                   | >10%            | % of new users arriving via referral code                      |
| **Retention** | D7 / D30 / D90 Retention        | 60% / 50% / 40% | % of users active at each interval                             |
| **Retention** | Monthly Churn Rate              | <8%             | % of paying subscribers lost per month                         |
| **Retention** | Training Cycle Completion       | >50%            | % of users finishing a full training block                     |
| **Trust**     | Session Compliance Rate         | >75%            | % of sessions completed without manual override                |
| **Trust**     | Reasoning Stream Engagement     | >60%            | % of sessions where user reads the full reasoning              |
| **Trust**     | Feedback Submissions            | >2/week         | Average corrections/reactions per active user per week         |
| **Growth**    | MRR Growth                      | 15% MoM (Y1)    | Monthly recurring revenue growth rate                          |
| **Growth**    | LTV:CAC Ratio                   | >3:1            | Lifetime value vs. customer acquisition cost                   |
| **Impact**    | PR Achievement Rate             | >30%            | % of users hitting a PR in first training cycle                |
| **Impact**    | Injury Rate Reduction           | >20%            | Reduction in missed training days vs. pre-Cadence              |

### North Star Metric

**Active Coached Runners (ACR):** The number of runners who complete at least 3 coached sessions per week, sustained over a rolling 4-week window. This single metric captures everything that matters -- adoption (they signed up), trust (they follow the coaching), retention (they keep coming back), and value creation (they're training consistently). When ACR grows, Cadence is winning. When ACR grows while traditional coaching subscriptions and generic app downloads decline in the same market segments, the AI coaching ecosystem thesis is validated.

---

## MVP Scope

### Core Features

**Week 1 Deliverable: The Onboarding Experience (Partner Demo)**

The onboarding is the product's most powerful moment -- and doubles as the sales pitch for partners, influencers, and early beta testers. Week 1 delivers a complete, polished onboarding flow:

1. **Wearable Data Import** -- Connect via the best available data aggregator across Strava, Garmin, and COROS. One integration path optimized for maximum data richness and beta tester coverage. Pull historical training data (sessions, HR, pace, cadence, sleep, recovery metrics).
2. **Competitive App Data Import** -- Import training history from previous apps (Campus Coach, Runna, KiprunPacer exports). The AI doesn't just analyze the data -- it critiques the previous coaching: "Your previous plan had you running tempo every Tuesday regardless of accumulated fatigue. I can see from your HR trends this was overloading you during weeks 3-4 of each cycle. Here's what I'd have done differently." This is the competitive kill shot.
3. **Live Coaching Intelligence: The Audit** -- The AI streams its full thinking process in real time as it analyzes the runner's history. Not a loading screen. Not a summary. A visible, narrative chain of reasoning: identifying patterns, flagging risks, noting strengths, and demonstrating understanding that no previous app has shown. The runner watches and thinks "this thing actually _sees_ me."
4. **Deep Intake Conversation** -- Coach-style questions: injury history, fears, schedule constraints, psychological relationship with training. Critically includes **goal registration** -- the runner sets one active goal: a supported distance (5K, 10K, Half Marathon, or Marathon) with an optional target time and race date, or selects Open Training mode for general improvement without a specific race. If no time target is set, the AI proposes realistic milestones based on current fitness. The depth signals seriousness.
5. **"Here's What I See" Synthesis** -- After analysis and intake, the AI presents a complete coaching audit: current fitness assessment, identified gaps, risks, and a proposed training direction anchored to the runner's goals -- all with visible reasoning. The synthesis connects where the runner is today to where they want to be: "Based on your current fitness and your sub-35 10K goal in 8 weeks, here's the path I see, here's what needs to change, and here's what's realistic." This is the moment that hooks partners and users alike.

**Weeks 2-4: The Coaching Engine (Full MVP)**

Building on the onboarding foundation, weeks 2-4 deliver the actual coaching experience:

6. **Goal-Anchored Daily Session Prescription with Live Reasoning** -- Each day's session comes with a full narrative reasoning stream explaining why this session, why today, and how it connects to the runner's active goal. Every prescription is contextualized within the periodized plan: "Your 10K is in 4 weeks -- we're entering the sharpening phase. Today's intervals target race-specific pace to build confidence at your goal speed." For Open Training runners, sessions are framed within the current improvement cycle and progress toward AI-proposed milestones. All major session types supported: easy runs, tempo, intervals, long runs, recovery. Algorithm complexity is a feature, not a shortcut.
7. **Daily Calibration** -- Session adjustments based on wearable readiness data (sleep, HRV, resting HR) + optional daily check-in. The plan adapts before the runner starts, not after they fail.
8. **Post-Session Recap & Adaptation** -- After each session, the AI provides a narrative debrief and visibly adjusts upcoming sessions based on what happened. The runner sees the adaptation logic in real time.
9. **Feedback Loop** -- Runners can respond to the AI's reasoning, correct assumptions, and provide subjective input. Every correction makes the AI smarter for that runner. The back-and-forth IS the coaching relationship.
10. **Uncertainty Transparency** -- When data is incomplete or the AI is working with limited information, it says so honestly and explains its conservative approach.

### Out of Scope for MVP

- **Real-time audio coaching** -- Deferred to Phase 2+
- **Coach Amplifier Edition** -- Deferred until core AI coaching is proven
- **Strava social integration** -- No posting or sharing features at launch
- **Running club/community features** -- Deferred to post-MVP
- **Calendar integration & life-aware coaching** -- Phase 3 feature
- **Predictive injury drift detection** -- Phase 2 feature
- **Predictive session framing** -- Phase 2 feature
- **Cross-runner pattern insights** -- Requires scale; deferred until meaningful user base
- **Multiple wearable support** -- MVP supports 1-2 wearable ecosystems only; expand post-validation
- **Milestone cards & sharing features** -- Growth features deferred to post-MVP
- **Multiple concurrent goals** -- MVP supports one active goal at a time; multi-goal management with prioritization reasoning is a priority post-MVP feature
- **Ultra/trail distances** -- Requires fundamentally different coaching logic (effort-based, elevation profiling, time-on-feet philosophy); deferred to future phase
- **Tiered pricing** -- Launch with single tier; pricing tiers after product-market fit

### MVP Success Criteria

**Week 1 Gate: Partner Validation**

- The onboarding demo produces a visceral "WTF that's insane" reaction from potential partners and influencers
- Partners want to be part of the journey -- they offer to promote, invest, or collaborate without being asked
- The Wow Effect is self-evident: if you have to explain why it's impressive, it isn't impressive enough

**Month 1 Gate: User Validation**

- Beta testers complete onboarding and continue using daily coaching for 2+ weeks
- Session compliance rate >60% (early trust signal)
- Reasoning stream engagement >70% (users are actually reading the thinking)
- Qualitative feedback confirms the core thesis: "this feels like having a real coach"
- At least 3 organic referrals from beta testers (unprompted word of mouth)

**Go/No-Go Decision:**

- **Go:** Partners are excited, beta users retain, reasoning stream engagement is high, qualitative feedback confirms the "real coach" feeling
- **Pivot:** Users ignore the reasoning stream, compliance is low, or feedback suggests the AI analysis isn't accurate enough to earn trust

### Future Vision

**Phase 2: Predict + Prevent (Months 2-6)**

- **Multiple concurrent goals** -- manage overlapping race timelines with AI-driven prioritization, trade-off reasoning, and transparent phase management
- Predictive session framing based on personal history patterns
- Early injury drift detection from biomechanical trend analysis
- Cross-runner pattern insights as user base grows
- Expanded wearable support (full Garmin, COROS, Apple Watch ecosystem)
- Strava integration for social sharing of coaching narratives

**Phase 3: Know Your Life (Months 6-12)**

- Calendar integration and life-aware schedule adaptation
- Proactive coaching based on external context (meetings, travel, stress signals)
- Adaptive coaching modes (Performance, Rebuild, Race, Recovery)

**Phase 4: Ecosystem Expansion (Year 2+)**

- Coach Amplifier Edition -- coaches use Cadence as their operating system
- Running club and community aggregation features
- Real-time audio coaching during sessions
- **Ultra/trail distance support** -- effort-based coaching, elevation profiling, time-on-feet philosophy, terrain-specific training
- Influencer and content creator partnership program
- Expertise marketplace -- elite coaches contribute methodology modules
- International expansion and multi-language coaching narratives

**The Long Game:** Cadence becomes the default way serious runners train -- not by replacing the coaching relationship, but by making it accessible to everyone. The AI coaching ecosystem becomes the category, and Cadence is its defining product.
