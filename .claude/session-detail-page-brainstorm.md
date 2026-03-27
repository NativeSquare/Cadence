# SessionDetailPage — Content & UX Brainstorm

## Context

The session detail page UI/visual design is solid. This brainstorm focuses on **what content to show**, **what to emphasize**, and **UX flow** for upcoming vs completed sessions. Inspired by Runna, TrainingPeaks, Strava, Campus Coach, KiprunPacer, and Garmin Connect.

**Key decisions from discussion:**
- Full Garmin/HealthKit detail data (splits, HR series, GPS, cadence) is available and linked to planned sessions
- AI post-run analysis is a **core priority** — the feature that makes Cadence a coach, not a tracker
- Debrief does NOT gate insights — show everything, nudge debrief prominently
- All 4 upcoming content ideas are desired: readiness signal, yesterday/tomorrow context, elevated "why", pre-run focus cue

---

## A. UPCOMING SESSION — Proposed Content Hierarchy

### Above the fold (what the runner sees without scrolling)

```
┌─────────────────────────────────────────┐
│  ← Back          TEMPO         Key 🔑   │  Header
│           Wednesday, Mar 18              │
├─────────────────────────────────────────┤
│                                         │
│  "Build your lactate threshold before   │  WHY THIS SESSION
│   the long run Saturday."               │  (1-2 line justification)
│                                         │
│  ┌──────┐  ┌──────┐  ┌──────┐          │
│  │10.2km│  │ 52min│  │ 7/10 │          │  Stats row (keep)
│  └──────┘  └──────┘  └──────┘          │
│                                         │
│  🟢 Body Battery 82 · Slept 7h42       │  READINESS SIGNAL (new)
│  "Well recovered — good to go"          │
│                                         │
│  ▁▂▅▇▇▇▇▅▂▁                            │  Intensity profile (keep)
│  WU  TEMPO BLOCK   CD                   │
│                                         │
└─────────────────────────────────────────┘
```

### Full scroll order

| # | Section | Status | Notes |
|---|---------|--------|-------|
| 1 | **Header** (type, date, key badge) | Keep | No changes |
| 2 | **"Why this session"** | **NEW** | 1-2 line callout from `justification`. Lime accent left border. Immediately answers "what's the point of today?" |
| 3 | **Stats row** (distance, duration, effort, HR zone) | Keep | No changes |
| 4 | **Readiness signal** | **NEW** | Garmin body battery + sleep + HRV summary. One-line verdict: "Well recovered" / "A bit fatigued — listen to your body" / "Consider the easy alternative". Color-coded green/yellow/orange. |
| 5 | **Intensity profile chart** | Keep | No changes — great quick visual |
| 6 | **Workout structure** | **Move UP** | Currently after zone split. This is "what do I actually do" — more important pre-run than zone analytics. **Merge pace targets inline** per segment (like Garmin/Runna). |
| 7 | **Focus cue** | **NEW** | Standalone card pulling from `keyPoints[]`. Concise, actionable: "During this session: (1) Hold steady cadence through tempo (2) Don't start the tempo too fast". Checkmark-list format. |
| 8 | **Yesterday / Tomorrow context** | **NEW** | Mini card: "Yesterday: Rest day · Tomorrow: Easy 6km". Helps runner understand load arc and why today's session is what it is. |
| 9 | **Zone split chart** | **Move DOWN** | Less critical pre-run. Useful for curious runners but not essential. |
| 10 | **Coach insight** (full reasoning) | **Collapse by default** | Progressive disclosure (Campus Coach pattern). Tap to expand: physio target, placement rationale, full justification. For runners who want to understand the "deep why". |
| 11 | **Alternatives** | Keep | Good UX for flexibility. Show when `alternatives` exist. |
| 12 | **Week context** | Keep | Week X of plan, current week |
| 13 | **Actions bar** | Keep | Export to Watch, Mark Complete, Ask Coach |

### Key UX patterns for upcoming

- **Progressive disclosure** (Campus Coach): Show essentials above fold, let curious runners expand. Coach insight collapsed by default.
- **Actionable over informational**: Focus cue > zone analytics. "Hold 5:00/km" > "Zone 4 for 30 min".
- **Readiness closes the loop**: No other app connects body readiness data TO the planned session. Garmin shows body battery but doesn't say "you're ready for this tempo." Cadence can.

---

## B. COMPLETED SESSION — Proposed Content Hierarchy

### Above the fold

```
┌─────────────────────────────────────────┐
│  ← Back          TEMPO       Completed  │  Header
│           Wednesday, Mar 18              │
├─────────────────────────────────────────┤
│                                         │
│        10.2 km  ·  51:47               │  HERO RESULT (big)
│        🟢 97% adherence                │  Color-coded compliance
│                                         │
│  ┌──────────┐ ┌──────────┐             │
│  │Plan 10.0 │ │Plan 52:00│             │  Planned vs Actual
│  │Act  10.2 │ │Act  51:47│             │  side-by-side
│  │  🟢 +2%  │ │  🟢 -0.4%│             │
│  └──────────┘ └──────────┘             │
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 🤖 Coach Analysis                  ││  AI POST-RUN INSIGHT
│  │ "Excellent session. Your tempo      ││  (THE differentiator)
│  │  splits showed strong consistency   ││
│  │  (4:58-5:03 range). HR stayed in   ││
│  │  Z4 throughout, confirming your     ││
│  │  lactate threshold is developing    ││
│  │  well."                             ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─ How did it go? ───────── ▼ ────────┐│  Debrief nudge
│  │ Tap to log how this session felt    ││  (prominent but not blocking)
│  └─────────────────────────────────────┘│
│                                         │
└─────────────────────────────────────────┘
```

### Full scroll order

| # | Section | Status | Notes |
|---|---------|--------|-------|
| 1 | **Header** (type, date, "Completed" badge) | Keep | |
| 2 | **Hero result** | **REDESIGN** | Big, clean: actual distance + time + adherence % with compliance color (green >90%, yellow 75-90%, orange <75%). Currently this is a small comparison card — make it the hero. |
| 3 | **Planned vs Actual summary** | **REDESIGN** | Side-by-side with per-metric compliance colors (TrainingPeaks pattern). Distance, duration, avg pace each get their own green/yellow/orange indicator. |
| 4 | **AI Coach Analysis** | **NEW — CORE** | 2-4 sentence AI-generated insight. Analyzes actual splits vs planned, HR response, pacing strategy, what it means for fitness. Personalized, conversational tone. This is what makes Cadence a coach. |
| 5 | **Debrief card** | **Move UP** | Prominent nudge if not yet done. NOT blocking other content (per decision). If already debriefed, show summary here. |
| 6 | **Planned vs Actual splits** | **NEW** | Per-segment comparison table. Each workout segment shows planned pace vs actual pace, color-coded. For intervals: each rep gets a row. Inspired by TrainingPeaks overlay + Runna pace insights. |
| 7 | **Pace consistency chart** (intervals) | **NEW** | For interval sessions only. Plot each rep's pace as a dot, show target as a line. Spread = consistency. Labels: "Pace on Point", "Negative Split", "Faded Late". Runna-inspired, gamified. |
| 8 | **Splits / Laps table** | **NEW** | Per-km splits from Garmin/HealthKit. Columns: km, pace, HR, cadence, elevation. Visual pace bars (darker = faster, like Strava). |
| 9 | **Heart rate chart** | **NEW** | Time-series HR overlaid on planned zones. Shows if runner actually trained the intended energy system. Donut chart of time-in-zone vs planned zones. |
| 10 | **Intensity profile** (with actual overlay) | **ENHANCE** | Keep the planned intensity profile but overlay actual pace/HR. Shows adherence visually. |
| 11 | **Map** | **NEW (Phase 2)** | GPS route with pace-colored path. Strava's hero element — emotional, shareable. |
| 12 | **Running dynamics** | **NEW (if data exists)** | Cadence, ground contact time, vertical oscillation from Garmin. For power users. |
| 13 | **Workout structure** (planned) | **Move down** | Reference only — the actual data is more interesting post-run. |
| 14 | **Coach reasoning** (why this session) | Collapse | Still available but less relevant after completion. |
| 15 | **Week context** | Keep | |

### The AI Coach Analysis — Design Notes

This is the crown jewel. What it should include:

**Inputs:**
- Planned session structure + targets
- Actual activity data (splits, HR, pace, cadence)
- Debrief data (feeling, tags, notes) — if available, weave it in
- Runner profile (experience, goals, recent trend)
- Week context (where in the plan, recent training load)

**Output tone:** Conversational, specific, constructive. Like a real coach reviewing your Garmin data.

**Examples by session type:**

*Easy run:*
> "Nice and controlled. Your HR averaged 142bpm (Z2) which is exactly where we want easy runs. Your pace naturally picked up in the last 2km but HR stayed stable — that's a sign of good aerobic fitness building."

*Intervals:*
> "Strong session. Your 400m reps averaged 1:32 with only 3 seconds spread between fastest and slowest — excellent consistency. Recovery HR dropped back to Z2 within 60s each time, showing good cardiac recovery. The slight fade on reps 7-8 is normal at this point in the build phase."

*Tempo:*
> "You rated this 'tough' and the data agrees — HR drifted from 168 to 176 across the 30-minute tempo block. That's expected cardiac drift for this duration. The fact that you held pace despite the HR rise shows mental strength. We'll build on this next week."

*Long run:*
> "21km at an average of 5:28/km — right in the zone. The negative split (5:35 first half → 5:21 second half) shows discipline in the early kms. Fueling seemed to work well since pace held through the final 5km. Great preparation for race day."

**Key principles:**
- Always reference specific numbers from the actual data
- Connect to the physiological target of the session
- Acknowledge the runner's subjective experience (debrief) alongside objective data
- End with forward-looking context ("We'll build on this", "This sets up next week's...")
- Never be purely negative — find what worked, then note areas for growth

### Compliance Color System (TrainingPeaks-inspired)

Apply to every planned-vs-actual comparison:

| Color | Meaning | Threshold |
|-------|---------|-----------|
| 🟢 Green | Nailed it | Within 5% of target |
| 🟡 Yellow | Close | 5-15% deviation |
| 🟠 Orange | Deviated | 15-25% deviation |
| 🔴 Red | Missed | >25% deviation |

Applied to: overall adherence, distance, duration, avg pace, per-segment paces, HR zone compliance.

---

## C. REST DAY — Enrichment Ideas

| Addition | Description |
|----------|-------------|
| **"Why you're resting"** | From `justification`: "After 3 hard days, your body needs consolidation time." |
| **Recovery data** | Garmin body battery, sleep score, HRV trend. "Your body battery recovered to 90 overnight — rest is working." |
| **Tomorrow preview** | "Tomorrow: Intervals 8x400m. Your legs will thank you." Builds anticipation. |
| **Active recovery tips** | Foam rolling, hydration, mobility. Could be session-type-aware (e.g., after a long run: "Focus on hip flexor mobility"). |

---

## D. Cross-Cutting UX Patterns

### 1. Progressive Disclosure (Campus Coach)
- **Level 1**: Essential info always visible (stats, structure, result)
- **Level 2**: Expandable detail (coach reasoning, full splits, running dynamics)
- **Level 3**: "Ask Coach" for conversational deep-dive

### 2. Narrative Over Numbers (Strava Athlete Intelligence)
The AI analysis turns data into story. Numbers alone don't coach — interpretation does.

### 3. Subjective + Objective Fusion (KiprunPacer)
The debrief feeling + actual HR/pace data together. "You said 'tough' but HR was low — maybe you're underestimating yourself."

### 4. Feedback Loop Without Gating (Runna-inspired, adapted)
Don't block content behind debrief, BUT:
- Debrief card is prominent (position 5, lime accent border)
- AI analysis subtly references debrief: "You noted 'legs heavy' — this aligns with the accumulated load from this week"
- If no debrief, AI analysis mentions: "Log how this felt to help me refine your upcoming sessions"

### 5. Compliance Colors (TrainingPeaks)
Universal visual language for planned-vs-actual. Green/yellow/orange/red at a glance.

---

## Implementation Phases

### Phase 1: Content Reordering + Quick Wins
- Reorder upcoming session (structure up, zone split down, coach insight collapsed)
- Add "Why this session" callout
- Add focus cue card
- Redesign completed hero result with compliance colors
- Move debrief card up for completed

### Phase 2: Actual Data Integration
- Planned vs actual splits (per-segment comparison)
- Splits/laps table from Garmin data
- HR zones comparison (planned vs actual)
- Pace consistency chart for intervals
- Yesterday/tomorrow context card

### Phase 3: AI Coaching Layer (Core Priority)
- Post-run AI analysis generation (when activity syncs)
- Analysis stored on session for instant display
- Debrief data woven into analysis
- Forward-looking context ("sets up next week")

### Phase 4: Readiness + Advanced
- Pre-run readiness signal (Garmin body battery + HRV + sleep)
- Readiness-to-session connection ("you're ready for this")
- Map with pace-colored GPS path
- Running dynamics display
- Social sharing cards
- Trend sparklines
