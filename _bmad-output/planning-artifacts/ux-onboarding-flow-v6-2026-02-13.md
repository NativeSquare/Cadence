# Cadence: Onboarding Flow Script (V6)

**Date:** 2026-02-13
**Author:** NativeSquare + Sally (UX Designer)
**Status:** Draft
**Predecessor:** V5 (2026-02-11)

---

## What Changed from V5

| Aspect | V5 | V6 |
|---|---|---|
| **Core paradigm** | Linear question flow with branching | Data-driven: coach fills a "Runner Object" through conversation |
| **Question philosophy** | "I have this list of questions" | "I have data fields I need to fill" |
| **Progress indicator** | Scene-based (implicit) | % of required data collected to generate plan |
| **Wearable/Strava** | Asked late (Scene 8) | Asked FIRST (Act 1) -- immediate analysis establishes credibility |
| **Name confirmation** | Missing | Explicit: "You're Alex, right?" after auth |
| **Information handling** | Each question is isolated | Contextual: coach references earlier info, notices when user volunteers data |
| **Input modes** | Tappable options only | Generative UI: voice, free text, multiple choice, all dynamically rendered |
| **Quick answers** | Not explicit | Always available: "No, that's all" / "Skip" options |
| **Plan presentation** | Text-based coaching response | Visual feast: radar charts, bar graphs, calendar widget, animated reveals |
| **Paywall** | Not specified | Explicit: after plan presentation, before home screen |
| **Overall feel** | Smart form | Coached conversation with a data-aware AI |

**Core insight:** V5 was a well-designed questionnaire that felt human. V6 is a *conversation with a coach who has a clipboard* -- the clipboard (Runner Object) is the source of truth, and every exchange either fills it, confirms it, or refines it.

---

## The Runner Object Model

The entire onboarding is driven by filling this object. The coach's internal state tracks what's known, what's inferred, what's confirmed, and what's missing.

```yaml
RunnerObject:
  # IDENTITY
  identity:
    name: string                    # Required. Source: OAuth or confirmed in conversation
    name_confirmed: boolean         # True once user confirms

  # PHYSICAL PROFILE
  physical:
    age: number                     # Optional but valuable. Can be inferred from training patterns
    weight: number                  # Optional. Useful for intensity calculations
    height: number                  # Optional

  # RUNNING PROFILE
  running:
    experience_level: enum          # Required. [beginner | returning | casual | serious]
    months_running: number          # Inferred or asked based on experience_level
    current_frequency: number       # Required. Days per week
    current_volume: number          # Required for non-beginners. Weekly km
    easy_pace: pace                 # Required for non-beginners. Can be pulled from Strava/wearable
    longest_recent_run: number      # Valuable context
    training_consistency: enum      # Inferred from wearable data if available

  # GOALS
  goals:
    goal_type: enum                 # Required. [race | speed | base_building | return_to_fitness | general_health]
    race_distance: number           # If goal_type == race
    race_date: date                 # If goal_type == race
    target_time: duration           # Optional. "Help me figure it out" is valid
    target_pace: pace               # If goal_type == speed
    target_volume: number           # If goal_type == base_building

  # SCHEDULE & LIFE
  schedule:
    available_days: number          # Required. How many days can train
    blocked_days: [enum]            # Optional. Days that are off-limits
    preferred_time: enum            # Optional. [morning | midday | evening | varies]
    calendar_connected: boolean     # True if calendar OAuth completed
    calendar_conflicts: [object]    # Parsed from connected calendar

  # HEALTH & RISK
  health:
    past_injuries: [enum]           # Required. List of injury types
    current_pain: [enum]            # Required. Current issues
    recovery_style: enum            # Required. [quick | slow | push_through | no_injuries]
    sleep_quality: enum             # Required. [solid | inconsistent | poor]
    stress_level: enum              # Required. [low | moderate | high | survival]

  # COACHING PREFERENCES
  coaching:
    coaching_voice: enum            # Required. [tough_love | encouraging | analytical | minimalist]
    data_orientation: enum          # Required. [data_driven | curious | feel_based]
    biggest_challenge: enum         # Required. What holds them back
    skip_triggers: [enum]           # Valuable for plan design

  # DATA CONNECTIONS
  connections:
    strava_connected: boolean
    wearable_connected: boolean
    wearable_type: enum             # [garmin | coros | apple_watch | polar | none]
    calendar_connected: boolean

  # INFERRED DATA (from Strava/wearable analysis)
  inferred:
    avg_weekly_volume: number       # Calculated from history
    volume_consistency: number      # % variance week to week
    easy_pace_actual: pace          # Observed from data
    long_run_pattern: string        # "Sundays, 14-16km"
    rest_day_frequency: number      # Actual rest days per month
    training_load_trend: enum       # [building | maintaining | declining | erratic]
    estimated_fitness: number       # Relative fitness score
    injury_risk_factors: [string]   # Identified patterns

# Meta-tracking for conversation flow
conversation_state:
  data_completeness: percentage     # % of required fields filled
  ready_for_plan: boolean           # True when completeness >= threshold
  current_phase: enum               # [intro | data_bridge | profile | goals | schedule | health | coaching | analysis]
  fields_to_confirm: [string]       # Inferred fields that need user confirmation
  fields_missing: [string]          # Required fields not yet filled
```

**The progress bar** = `data_completeness` percentage. It advances when:
- User answers a question (fills a field)
- Wearable/Strava data is analyzed (fills/infers multiple fields)
- User confirms inferred data

---

## The Generative UI Paradigm

The LLM doesn't output raw text and hope the UI renders it correctly. Instead, it *calls tools* that render specific UI components. The conversation is a stream of coach utterances interspersed with tool calls.

### Available UI Tools

```typescript
// Multiple choice question
interface MultipleChoiceInput {
  question: string;              // The question text (displayed above options)
  options: {
    label: string;               // Display text
    value: string;               // Value stored in RunnerObject
    description?: string;        // Optional subtext
  }[];
  allowMultiple: boolean;        // Multi-select vs single-select
  allowFreeText: boolean;        // Show "Other" with text input
  allowVoice: boolean;           // Show microphone button
  allowSkip: boolean;            // Show "Skip" or "No, that's all" option
  skipLabel?: string;            // Custom skip button text
  targetField: string;           // Which RunnerObject field this fills
}

// Free text / voice input
interface OpenInput {
  prompt: string;                // Conversational prompt
  placeholder: string;           // Input placeholder
  allowVoice: boolean;           // Show microphone button
  suggestedResponses?: string[]; // Quick-tap options (e.g., "No, nothing else")
  targetFields: string[];        // Which fields this might fill (parsed by LLM)
}

// Numeric input
interface NumericInput {
  prompt: string;
  unit: string;                  // "km", "min/km", "kg", etc.
  min?: number;
  max?: number;
  allowSkip: boolean;
  skipLabel?: string;
  targetField: string;
}

// Pace input
interface PaceInput {
  prompt: string;
  format: "min:sec/km" | "min:sec/mi";
  allowSkip: boolean;
  skipLabel?: string;            // e.g., "Not sure"
  targetField: string;
}

// Date input
interface DateInput {
  prompt: string;
  minDate?: date;
  maxDate?: date;
  allowSkip: boolean;
  skipLabel?: string;            // e.g., "Not registered yet"
  targetField: string;
}

// Calendar day selector
interface DaySelector {
  prompt: string;
  mode: "blocked" | "preferred" | "available";
  allowNone: boolean;
  noneLabel?: string;            // e.g., "No blocked days"
  targetField: string;
}

// OAuth connection card
interface ConnectionCard {
  type: "strava" | "wearable" | "calendar";
  providers: string[];           // ["garmin", "coros", "apple_watch"] or ["google", "apple", "outlook"]
  prompt: string;
  skipLabel: string;
  targetField: string;
}

// Confirmation card (for inferred data)
interface ConfirmationCard {
  statement: string;             // "Based on your data, you run about 45km/week"
  confirmLabel: string;          // "That's right"
  denyLabel: string;             // "Not quite"
  editAction?: string;           // What happens if they deny
  targetField: string;
}

// Thinking stream (visible reasoning)
interface ThinkingStream {
  lines: string[];               // Streamed one by one
  collapsible: boolean;          // Collapse into "▸ Thinking" after
}

// Visualization components (for plan presentation)
interface RadarChart {
  title: string;
  axes: { label: string; value: number; max: number }[];
  // FIFA-style web graph for runner profile
}

interface ProgressChart {
  title: string;
  data: { week: number; volume: number; intensity: number }[];
  annotations?: { week: number; label: string }[];
}

interface CalendarWidget {
  title: string;
  weeks: {
    sessions: { day: string; type: string; description: string; duration: string }[];
  }[];
  highlightedDays?: string[];
}
```

### How It Flows

The coach "speaks" in natural language, then calls a tool when it needs input. The UI renders the tool output inline with the conversation.

```
[Coach streams]: "First things first -- where are you at with running right now?"

[Coach calls]: MultipleChoiceInput({
  question: null,  // Already asked conversationally
  options: [
    { label: "Just getting started", value: "beginner" },
    { label: "Getting back into it", value: "returning" },
    { label: "I run regularly, keeping it casual", value: "casual" },
    { label: "I train seriously", value: "serious" }
  ],
  allowFreeText: true,
  allowVoice: true,
  targetField: "running.experience_level"
})

[User selects]: "I train seriously"

[RunnerObject updated]: running.experience_level = "serious"
[Progress bar]: 12% → 18%

[Coach streams]: "Okay, serious runner. How many days a week are you putting in?"
...
```

---

## Design Philosophy

### Carried from V5

- **Streaming text with haptic feedback** -- phrase by phrase, thought-paced
- **Three haptic notes**: Arrival pulse, Insight tap, Question pause
- **Visible thinking** (Cursor-style) -- raw reasoning → collapses → coaching response
- **Controlled intensity** visual identity -- deep charcoal, sharp accent, purposeful motion
- **The coaching voice** is warm but precise

### New in V6

- **Data-awareness**: The coach knows what it knows and what it doesn't. Progress is explicit.
- **Contextual references**: "You mentioned earlier..." / "So about that broken ankle..." / "I was going to ask about that, but you beat me to it..."
- **Generative UI**: The LLM controls what UI appears, not a static flow
- **Multi-modal input**: Voice, text, and taps are all first-class citizens
- **Quick escapes**: Every open question has a fast "No / Skip / That's all" option
- **Visual plan presentation**: Radar charts, progress graphs, calendar widgets -- the plan reveal is a *moment*

---

## Pre-Scene: Authentication

Fast, forgettable. Apple/Google sign-in, one tap, done. The moment auth completes:

1. Store `identity.name` from OAuth payload
2. Cut to black
3. Proceed to Act 1

**No profile setup. No "tell us about yourself." The coach does the asking.**

---

## ACT 1: THE MEETING + DATA BRIDGE

**Emotional arc: Curiosity → Intrigue → Immediate Value**

*This is the critical change from V5: wearables/Strava come FIRST, establishing credibility before any questions.*

---

### Scene 1: Welcome

*The screen is dark. Then:*

*(Arrival pulse)*

> **"Hey!"**

*Beat.*

> **"You're {name}, right?"**

**[Coach calls]**: `ConfirmationCard`
```yaml
statement: null  # Question is conversational
confirmLabel: "That's me"
denyLabel: "Actually, it's..."
targetField: "identity.name"
```

**If confirmed**: `identity.name_confirmed = true`

**If denied**: Free text input for correct name, then confirm.

*Progress bar appears: **5%** (name confirmed)*

---

### Scene 2: The Pitch

> **"I'm Cadence. Not a training plan app. Not a calendar. Your running coach."**

*Beat.*

> **"But here's the thing -- I get better the more I know about you."**

*(Question pause haptic)*

> **"Want to connect your watch or Strava? I can start learning about you right now."**

**[Coach calls]**: `ConnectionCard`
```yaml
type: "wearable"
providers: ["garmin", "coros", "apple_watch", "polar", "strava"]
prompt: null  # Asked conversationally
skipLabel: "I'll do this later"
targetField: "connections"
```

---

### Scene 3a: Data Analysis (If Connected)

*The user connects Strava/wearable. A subtle sync indicator appears.*

> **"Got it. Let me take a look..."**

**[Coach calls]**: `ThinkingStream`
```yaml
lines:
  - "Loading 12 weeks of activity data..."
  - "Weekly volume: 42-48km. Consistent. Nice."
  - "Long runs: Saturdays, typically 14-18km."
  - "Easy pace from recent runs: 5:35-5:45/km."
  - "Rest days last month: 3. That's... not many."
  - "Detecting workout patterns... Tuesday intervals, Thursday tempo."
  - "Estimated training age: 2-3 years based on progression."
  - "No major injury gaps visible in the last year."
collapsible: true
```

*The thinking collapses. Coach returns with warmth:*

*(Arrival pulse)*

> **"Okay, I've got a picture forming."**

*Beat.*

> **"You're putting in solid work -- 45K weeks, pretty consistent. Long runs on Saturdays, intervals on Tuesdays. Your easy pace sits around 5:40."**

*Beat.*

> **"A couple things jumped out. You're not taking many rest days -- 3 in the last month. And your easy runs might be a bit hot for true recovery. But we'll get into that."**

*Progress bar jumps: **5% → 35%** (wearable data filled many fields)*

> **"That's a head start. Now let me fill in the gaps."**

**Design note**: This is the *hook*. The user just saw Cadence analyze their actual data and say something insightful. Credibility established. They're now invested in the conversation.

---

### Scene 3b: No Data Path (If Skipped)

> **"No problem. I'll learn as we go."**

*Beat.*

> **"For now, let's start with the basics."**

*Progress bar: **5%** (only name confirmed)*

---

## ACT 2: GETTING TO KNOW EACH OTHER

**Emotional arc: Curiosity → Connection → Investment**

*The coach now fills the remaining RunnerObject fields through conversation. The structure follows phases (Profile → Goals → Schedule → Health → Coaching), but within each phase, the conversation is fluid and contextual.*

**Key behaviors:**

1. **Reference earlier info**: "You mentioned you train seriously..." / "Given your 45K weeks..."
2. **Acknowledge volunteered info**: If user mentions something unprompted, coach says "Good to know -- I was going to ask about that" and marks the field as filled
3. **Confirm inferred data**: "Based on your Strava, you're running about 45K/week. Does that sound right?"
4. **Adapt questions**: Skip questions already answered by wearable data

---

### Phase 1: Runner Profile (if not fully filled by wearable)

**Required fields**: `experience_level`, `current_frequency`, `current_volume` (non-beginners), `easy_pace` (non-beginners)

*If wearable connected, much of this is already filled. Coach confirms:*

> **"From your data, it looks like you're running about 5 days a week, around 45K total. That track?"**

**[Coach calls]**: `ConfirmationCard`
```yaml
statement: null
confirmLabel: "Yeah, that's about right"
denyLabel: "Not quite"
targetField: "running.current_frequency + running.current_volume"
```

*If no wearable, coach asks directly:*

> **"So where are you at with running right now?"**

**[Coach calls]**: `MultipleChoiceInput`
```yaml
options:
  - { label: "Just getting started", value: "beginner" }
  - { label: "Getting back into it after a break", value: "returning" }
  - { label: "I run regularly, keeping it casual", value: "casual" }
  - { label: "I train seriously", value: "serious" }
allowFreeText: true
allowVoice: true
targetField: "running.experience_level"
```

*Follow-up questions branch based on experience level (same logic as V5 but rendered via generative UI).*

**Example of contextual reference:**

User selects "Getting back into it" and in the free text adds "had a baby 6 months ago"

> **"Ah, congratulations -- and welcome back. Six months postpartum, the body's still recalibrating. I'll factor that into how we build."**

*Coach internally notes: potential pelvic floor considerations, conservative ramp, sleep likely impacted*

---

### Phase 2: Goals

**Required fields**: `goal_type`, plus conditional fields based on type

> **"Now the big one -- what are you working toward?"**

**[Coach calls]**: `MultipleChoiceInput`
```yaml
options:
  - { label: "Training for a specific race", value: "race" }
  - { label: "Getting faster (no race in mind)", value: "speed" }
  - { label: "Building up my mileage", value: "base_building" }
  - { label: "Getting back in shape", value: "return_to_fitness" }
  - { label: "General fitness & health", value: "general_health" }
allowFreeText: true
allowVoice: true
targetField: "goals.goal_type"
```

*Conditional follow-ups based on selection (same as V5 but generative UI).*

**Example of contextual reaction (if wearable connected):**

User selects "Training for a specific race" → Half Marathon → April 20

> **"Half marathon, April 20. That gives us 10 weeks."**

*Beat.*

> **"Looking at your current volume and the progression in your data... that's a realistic timeline. Tight, but doable. What's your target?"**

---

### Phase 3: Schedule & Life

**Required fields**: `available_days`, `blocked_days` (optional), `preferred_time` (optional)

> **"Let's talk about your week."**

*If calendar connected during wearable flow, coach references it:*

> **"I see your Tuesdays and Thursdays are packed until 7pm. So key sessions probably land elsewhere -- or we go early morning. Sound right?"**

**[Coach calls]**: `ConfirmationCard`
```yaml
statement: null
confirmLabel: "Yeah, mornings would work better"
denyLabel: "Actually, evenings are fine"
```

*If no calendar:*

> **"How many days can you realistically train?"**

**[Coach calls]**: `MultipleChoiceInput`
```yaml
options:
  - { label: "2-3 days", value: 2.5 }
  - { label: "4-5 days", value: 4.5 }
  - { label: "6-7 days", value: 6.5 }
targetField: "schedule.available_days"
```

> **"Any days that are completely off-limits?"**

**[Coach calls]**: `DaySelector`
```yaml
mode: "blocked"
allowNone: true
noneLabel: "No blocked days"
targetField: "schedule.blocked_days"
```

---

### Phase 4: Injury & Health Profile

**Required fields**: `past_injuries`, `current_pain`, `recovery_style`, `sleep_quality`, `stress_level`

> **"Now let me ask about the less fun stuff."**

*If user mentioned injury earlier in conversation:*

> **"You mentioned that broken ankle a while back. Any other past injuries I should know about?"**

*Otherwise:*

> **"Any past injuries that have affected your running?"**

**[Coach calls]**: `MultipleChoiceInput`
```yaml
options:
  - { label: "Shin splints", value: "shin_splints" }
  - { label: "IT band syndrome", value: "itbs" }
  - { label: "Plantar fasciitis", value: "plantar" }
  - { label: "Knee pain", value: "knee" }
  - { label: "Achilles issues", value: "achilles" }
  - { label: "Stress fracture", value: "stress_fracture" }
  - { label: "Hip/glute issues", value: "hip_glute" }
  - { label: "None -- I've been lucky", value: "none" }
allowMultiple: true
allowFreeText: true  # "Other" option
allowVoice: true
targetField: "health.past_injuries"
```

*After injuries:*

> **"Anything bothering you right now?"**

**[Coach calls]**: `MultipleChoiceInput`
```yaml
options: [same body areas]
allowMultiple: true
skipLabel: "Nothing right now"
targetField: "health.current_pain"
```

*Recovery perception:*

> **"When you've been hurt before, how would you describe your recovery?"**

**[Coach calls]**: `MultipleChoiceInput`
```yaml
options:
  - { label: "I bounce back quick", value: "quick" }
  - { label: "It takes a while but I get there", value: "slow" }
  - { label: "I tend to push through it", value: "push_through", description: "🚩 coaching flag" }
  - { label: "Haven't had a real injury yet", value: "no_injuries" }
targetField: "health.recovery_style"
```

*If user selects "push through":*

> **"Noted. That tendency is something I'll watch for. Sometimes the smartest training is knowing when NOT to train."**

*Sleep and stress:*

> **"How's your sleep these days?"**

**[Coach calls]**: `MultipleChoiceInput`
```yaml
options:
  - { label: "Solid 7-8 hours", value: "solid" }
  - { label: "Inconsistent", value: "inconsistent" }
  - { label: "Running on fumes", value: "poor" }
targetField: "health.sleep_quality"
```

> **"General stress level outside of running?"**

**[Coach calls]**: `MultipleChoiceInput`
```yaml
options:
  - { label: "Low -- life's good", value: "low" }
  - { label: "Moderate -- the usual", value: "moderate" }
  - { label: "High -- a lot going on", value: "high" }
  - { label: "Survival mode", value: "survival" }
targetField: "health.stress_level"
```

---

### Phase 5: Coaching Style

**Required fields**: `coaching_voice`, `data_orientation`, `biggest_challenge`

> **"Almost there. This one's about how you want me to show up."**

> **"What kind of coaching works best for you?"**

**[Coach calls]**: `MultipleChoiceInput`
```yaml
options:
  - { label: "Tough love -- push me, call me out", value: "tough_love" }
  - { label: "Encouraging -- keep it positive", value: "encouraging" }
  - { label: "Analytical -- give me the data", value: "analytical" }
  - { label: "Minimalist -- just tell me what to do", value: "minimalist" }
targetField: "coaching.coaching_voice"
```

*Coach mirrors the style in its response (same as V5).*

> **"Last one. What's the biggest thing holding you back right now?"**

**[Coach calls]**: `MultipleChoiceInput`
```yaml
options:
  - { label: "Consistency -- I struggle to stick with it", value: "consistency" }
  - { label: "Time -- there's never enough", value: "time" }
  - { label: "Motivation -- I lose steam", value: "motivation" }
  - { label: "Fear of injury -- I hold back", value: "injury_fear" }
  - { label: "Pacing -- I don't know how to go easy", value: "pacing" }
  - { label: "I'm not sure -- I just feel stuck", value: "stuck" }
allowFreeText: true
allowVoice: true
targetField: "coaching.biggest_challenge"
```

---

### Phase 6: Final Check

*Progress bar should be at ~90-95%*

> **"Okay, I think I've got a pretty complete picture. Let me just make sure..."**

**[Coach calls]**: `OpenInput`
```yaml
prompt: "Anything else you want me to know? About your running, your life, anything that might affect training?"
allowVoice: true
suggestedResponses:
  - "No, I think that covers it"
  - "Actually, there's one more thing..."
targetFields: ["*"]  # Could fill any field
```

*If user adds something, coach acknowledges and updates RunnerObject.*

> **"Good to know. That's going into the mix."**

*Progress bar hits **100%**.*

---

## ACT 3: THE ANALYSIS (THE READING)

**Emotional arc: Anticipation → Fascination → JAW DROP → Belief**

*This is the climax. The user has invested time. Now they see what Cadence can do.*

---

### Scene 8: Transition to Analysis

> **"Okay. I believe I have what I need to draft your game plan."**

*Beat.*

> **"Give me a second to put this together..."**

---

### Scene 9: The Thinking Stream

**[Coach calls]**: `ThinkingStream`
```yaml
lines:
  - "Runner profile: competitive, 5x/week, 45km avg, easy pace 5:40/km"
  - "Goal: sub-1:45 half marathon, April 20. 10 weeks out."
  - "Current estimated half time: 1:52-1:55"
  - "Gap to close: 7-10 minutes. Significant but achievable."
  - ""
  - "Analyzing training history..."
  - "Volume consistency: 85%. Strong foundation."
  - "Easy pace analysis: running 5:35-5:45, threshold suggests 5:55-6:05 optimal"
  - "→ Easy days 15-20s too fast. Recovery compromised."
  - "→ Confirmed: user identified 'pacing' as biggest challenge"
  - ""
  - "Interval patterns: 800m repeats, good execution"
  - "Missing: threshold/tempo work. Critical for half marathon."
  - "Missing: race-specific long runs with pace segments"
  - ""
  - "Risk factors:"
  - "- Past shin splints"
  - "- 'Push through' recovery style -- must monitor"
  - "- Sleep: inconsistent"
  - "- Rest days: only 3 in last 4 weeks"
  - "→ Volume ramp capped at 8% weekly to protect"
  - ""
  - "Schedule constraints: Tue/Thu busy until 7pm"
  - "→ Key sessions: Mon/Wed/Sat"
  - "→ Long run: Sunday (user preference implied)"
  - ""
  - "Periodization plan:"
  - "Weeks 1-4: Aerobic correction + base strengthening"
  - "Weeks 5-7: Race-specific build (tempo, progression runs)"
  - "Weeks 8-9: Peak + sharpening"
  - "Week 10: Taper"
  - ""
  - "Coaching mode: analytical (user preference)"
  - "→ Full reasoning in all sessions"
  - ""
  - "Predicted outcome: 1:43-1:46 with high compliance"
  - "Sub-1:45 confidence: 75%"
collapsible: true
```

*The thinking collapses into **▸ Thinking**.*

---

### Scene 10: The Coaching Response (Personalized)

*(Arrival pulse)*

> **"Okay {name}, here's what I see."**

*Beat.*

**The Good:**

> **"You've got a real foundation. 45K weeks, consistent training, solid long runs. You're not starting from scratch -- you're building on something."**

**The Gaps:**

> **"But there are gaps. Your easy days are too fast -- you told me pacing is your biggest challenge, and your data confirms it. You're running 5:40 when your body wants 5:55-6:00 for true recovery."**

> **"And you're not taking enough rest. Three days off in a month isn't recovery -- it's survival. Especially with inconsistent sleep, your body's accumulating debt."**

**The Risks:**

> **"The shin splints history plus your tendency to push through injuries? That's a pattern I'll be watching. We're keeping volume increases conservative -- 8% max, not the standard 10%."**

---

### Scene 11: Visual Plan Presentation

> **"Let me show you what the plan looks like."**

---

#### 11a: Runner Profile Radar

**[Coach calls]**: `RadarChart`
```yaml
title: "Your Runner Profile"
axes:
  - { label: "Endurance Base", value: 75, max: 100 }
  - { label: "Speed", value: 65, max: 100 }
  - { label: "Recovery Discipline", value: 40, max: 100 }
  - { label: "Consistency", value: 85, max: 100 }
  - { label: "Injury Resilience", value: 55, max: 100 }
  - { label: "Race Readiness", value: 50, max: 100 }
```

*FIFA-style web graph appears, animated. Each axis fills to its value.*

> **"Strong consistency and endurance base. Recovery discipline and race readiness are where we'll focus. By race day, this chart should look different."**

---

#### 11b: Volume Progression Chart

**[Coach calls]**: `ProgressChart`
```yaml
title: "10-Week Volume Plan"
data:
  - { week: 1, volume: 45, intensity: 65 }
  - { week: 2, volume: 48, intensity: 68 }
  - { week: 3, volume: 52, intensity: 70 }
  - { week: 4, volume: 48, intensity: 65 }  # Recovery week
  - { week: 5, volume: 55, intensity: 75 }
  - { week: 6, volume: 58, intensity: 78 }
  - { week: 7, volume: 55, intensity: 72 }  # Recovery week
  - { week: 8, volume: 52, intensity: 85 }  # Peak intensity
  - { week: 9, volume: 45, intensity: 80 }
  - { week: 10, volume: 30, intensity: 60 } # Taper
annotations:
  - { week: 4, label: "Recovery" }
  - { week: 7, label: "Recovery" }
  - { week: 10, label: "Race Week" }
```

*Animated chart shows volume (bars) and intensity (line) over time.*

> **"See those dips at weeks 4 and 7? Those are deliberate. Your body adapts during recovery, not during training. We build, we rest, we build higher."**

---

#### 11c: Weekly Structure

**[Coach calls]**: `CalendarWidget`
```yaml
title: "Your Typical Week (Build Phase)"
weeks:
  - sessions:
    - { day: "Mon", type: "Tempo", description: "Threshold work", duration: "50min" }
    - { day: "Tue", type: "Easy", description: "Recovery pace", duration: "40min" }
    - { day: "Wed", type: "Intervals", description: "1K repeats", duration: "55min" }
    - { day: "Thu", type: "Rest", description: "Complete rest", duration: "-" }
    - { day: "Fri", type: "Easy", description: "Shakeout", duration: "35min" }
    - { day: "Sat", type: "Rest", description: "Or cross-train", duration: "-" }
    - { day: "Sun", type: "Long Run", description: "With progression", duration: "90min" }
highlightedDays: ["Mon", "Wed", "Sun"]  # Key sessions
```

*Calendar widget appears showing the week structure.*

> **"Three key sessions: Monday tempo, Wednesday intervals, Sunday long run. The rest is recovery. And yes -- two actual rest days. Non-negotiable."**

---

### Scene 12: The Verdict

> **"So here's where I think you land."**

*Beat.*

> **"Your current estimated half marathon time is around 1:52-1:55. With this plan, high compliance, and the fixes we talked about..."**

*(Insight tap)*

> **"I'm projecting **1:43 to 1:46**. Sub-1:45 is the realistic target. It's tight, but it's there."**

*Beat.*

> **"The sub-1:45 isn't the ceiling -- it's the floor. If everything clicks, you could surprise yourself."**

---

### Scene 13: Decision Audit

> **"And here's why I made these choices."**

*A collapsible section appears with key decisions:*

**▸ Why 8% volume cap instead of 10%?**
> Shin splint history + "push through" recovery style = higher injury risk. Conservative loading protects the block.

**▸ Why two rest days?**
> Sleep inconsistency + only 3 rest days last month = recovery debt. One rest day isn't enough to clear it.

**▸ Why tempo work on Mondays?**
> Tue/Thu calendar conflicts. Monday is freshest day after Sunday long run recovery. Key session needs freshness.

**▸ Why slow down easy pace?**
> Current easy pace (5:40) is above aerobic threshold (5:55-6:05). True recovery requires actually recovering.

---

## ACT 4: REVISION & HANDOFF

**Emotional arc: Ownership → Commitment → Excitement**

---

### Scene 14: Revision Option

> **"That's the plan I'd build for you. But you know your life better than I do."**

*Beat.*

> **"Anything you want to adjust?"**

**[Coach calls]**: `OpenInput`
```yaml
prompt: null
allowVoice: true
suggestedResponses:
  - "Looks good to me"
  - "I'd like to change something"
  - "Can I see the first week in detail?"
targetFields: ["*"]
```

*If user requests changes, coach discusses and adjusts. If approved, proceed.*

---

### Scene 15: The Handoff

*Dynamic based on when first session is:*

**If first session is tomorrow:**

> **"Perfect. Your first session is tomorrow morning -- an easy 40 minutes to set the tone."**

> **"I'll have the full breakdown ready for you. Just show up. I'll tell you the rest."**

**If first session is today:**

> **"Actually, you could start today if you want. There's a session ready."**

> **"No pressure. But if you're feeling it..."**

**If first session is in a few days:**

> **"Your first session is [Day]. I'll send you a reminder."**

> **"Until then -- rest up. We've got work to do."**

---

### Scene 16: Paywall

> **"One more thing."**

*Beat.*

> **"The plan's ready. The coaching is ready. To unlock everything, start your free trial."**

**[Coach calls]**: `SubscriptionCard`
```yaml
trialDays: 7
features:
  - "Full training plan through race day"
  - "Daily adaptive sessions"
  - "Visible reasoning for every decision"
  - "Unlimited plan adjustments"
ctaLabel: "Start Free Trial"
skipLabel: "Maybe later"
```

---

### Scene 17: Home Screen Transition

*If trial started or skipped, fade to home screen.*

*Tomorrow's session is visible. The plan is loaded. Cadence is quiet now -- but present.*

---

## Flow Summary

| # | Scene | What Happens | Progress Bar | Emotional Beat |
|---|-------|--------------|--------------|----------------|
| 1 | Welcome | "You're {name}, right?" | 5% | Recognition |
| 2 | The Pitch | Connect wearable/Strava | 5% | Anticipation |
| 3a | Data Analysis | Immediate insights from connected data | 35% | "It already knows me" |
| 3b | No Data Path | "I'll learn as we go" | 5% | Trust established |
| 4 | Runner Profile | Experience, volume, pace (confirms or asks) | 50% | Identity |
| 5 | Goals | What are you working toward? | 65% | Direction |
| 6 | Schedule | Available days, constraints, calendar | 75% | Practical trust |
| 7 | Health | Injuries, sleep, stress | 85% | Vulnerability, care |
| 8 | Coaching Style | How do you want me to show up? | 95% | Personalization |
| 9 | Final Check | "Anything else?" | 100% | Completeness |
| 10 | Transition | "Let me draft your plan..." | 100% | Anticipation |
| 11 | Thinking Stream | Visible analysis | - | Fascination |
| 12 | Coaching Response | The findings | - | "It gets me" |
| 13 | Visual Plan | Radar, charts, calendar | - | **JAW DROP** |
| 14 | The Verdict | Projected outcome | - | Belief |
| 15 | Decision Audit | Why I made these choices | - | Trust |
| 16 | Revision | "Anything to adjust?" | - | Ownership |
| 17 | Handoff | "See you [Day]" | - | Commitment |
| 18 | Paywall | Free trial | - | Conversion |
| 19 | Home | Plan loaded, ready to run | - | Excitement |

---

## Key Design Decisions (V6 Specific)

1. **Data-first paradigm**: The RunnerObject is the source of truth. Every interaction either fills it, confirms it, or refines it. Progress = data completeness.

2. **Wearable connection FIRST**: This is the single biggest change. By analyzing real data upfront, Cadence establishes credibility before asking questions. The user thinks "it already knows me" instead of "it's asking a lot."

3. **Generative UI**: The LLM calls tools to render UI. This allows for:
   - Dynamic question flow based on what's already known
   - Multi-modal input (voice, text, taps) on every question
   - Contextual UI (confirmation cards for inferred data, open input for exploration)

4. **Contextual referencing**: The coach MUST reference earlier information. "You mentioned..." / "Given your data..." / "About that injury..." This proves continuity and intelligence.

5. **Visual plan presentation**: The analysis isn't just text. Radar charts, progression graphs, and calendar widgets create a *moment*. This is where the user should be jaw-dropped.

6. **Decision audit**: Every major coaching decision has an expandable "why" attached. Radical transparency isn't just streaming thoughts -- it's accountable recommendations.

7. **Quick escapes**: Every open question has fast-path options ("No, that's all" / "Looks good"). The user never feels trapped in conversation.

8. **Progress bar = data completeness**: Not "question 4 of 10" but "65% of the information I need." This reframes the experience from "filling out a form" to "teaching my coach."

9. **Explicit name confirmation**: V5 missed this. V6 confirms the name from OAuth within the first 10 seconds.

10. **Paywall at the end**: The full plan is revealed, the value is clear, THEN the ask. The user knows exactly what they're paying for.

---

## Open Questions

- [ ] How much wearable data is "enough" to skip certain questions? Define thresholds.
- [ ] Should the radar chart axes be standardized or personalized based on goal type?
- [ ] Voice input: real-time transcription with edit, or record-and-confirm?
- [ ] If user has no wearable AND skips all optional questions, what's the minimum viable profile?
- [ ] Should the thinking stream speed be adjustable? ("Show me faster" for impatient users)
- [ ] How do we handle wearable data that contradicts user's stated experience level?
- [ ] Should the paywall allow a "preview week" without payment?
- [ ] Calendar widget: interactive (tap to see session details) or static?

---

## Related Documents

- [training-engine-architecture.md](research/training-engine-architecture.md) -- How the plan is actually generated
- [ux-onboarding-flow-v5-2026-02-11.md](ux-onboarding-flow-v5-2026-02-11.md) -- Previous version
- [conversational-onboarding-architecture.md](research/conversational-onboarding-architecture.md) -- Technical architecture for conversation flow
