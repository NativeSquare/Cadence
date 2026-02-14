# Claude Code Brief — Cadence Onboarding Integration Plan

## Your Mission

You are working inside the Cadence monorepo — an AI running coach app built with Expo (React Native) and a backend. Your job is to:

1. **Audit the existing codebase** — understand the current architecture, navigation, components, state management, backend API, and what's already built for onboarding.
2. **Produce a detailed integration plan** — epics broken into stories with acceptance criteria, referencing actual file paths, component names, and API routes from this codebase.

The plan must bridge the gap between what exists today and the target UI/UX defined below.

---

## Context: What Was Designed (Prototype)

A complete onboarding flow was prototyped as a web React component. It is NOT code to copy — it's a reference for the target experience. Here's what it defines:

### Flow Architecture (13 screens, 2 paths)

```
Welcome → Wearable (BRANCH POINT) → [Analysis OR SelfReport] → Goals → Health → Style → OpenQuestion → Transition → Radar → Progression → Calendar → Verdict → Paywall
```

**Branch point:** At the Wearable screen, the user either connects a wearable (Strava/Apple Health/Garmin) OR skips ("I'll do this later — ask me instead"). This creates two parallel paths that reconverge at Goals.

**DATA path** (connected wearable):
- Thinking Stream: terminal-style analysis of Strava data, line by line (847 activities found, weekly volume 42-48km, etc.)
- Coach confirms findings, asks remaining questions with context ("Your data looks clean on the injury front — but I want to hear it from you")
- HIGH confidence badge (lime), tight projection (1:43-1:46, ±90s, 75% confidence)

**NO-DATA path** (skipped wearable):
- Self-Report: 3 quick questions (weekly volume, frequency, longest recent run) with structured inputs
- Synthesis Stream: builds profile from responses, explicitly shows missing data ("— No GPS pace data available")
- MODERATE confidence badge (orange), wide projection (1:40-1:52, ±6 min, 50% confidence)
- Constant promise of refinement ("Will sharpen after your first 3 logged runs")

**Shared screens (both paths, adapted tone):**

1. **Goals** — "What are you working toward?" Multiple choice + freeform escape hatch ("Something else — let me explain"). Freeform triggers visible MiniAnalysis.
2. **Health & Injuries** — Multi-select injury list + recovery style follow-up. "I tend to push through it" triggers a coaching flag with red-tinted warning card.
3. **Coaching Style** — Single select (Tough love / Encouraging / Analytical / Minimalist) + biggest challenge.
4. **Open Question** — "Anything else you want me to know?" Full freeform input with voice recording option and quick-skip pills. Freeform triggers MiniAnalysis.
5. **Transition** — "Give me a second to put this together..." with loading spinner. This is where the backend actually generates the plan.
6. **Radar Chart** — Hexagonal spider chart, 6 axes (Endurance, Speed, Recovery, Consistency, Injury Risk, Race Ready). Polygon animates outward from center. Orange dots with "?" on uncertain axes (no-data path). Lime dots on confirmed axes.
7. **Progression Chart** — 10-week volume plan. Bars with hatched fills (not solid), intensity trend line overlay, blue recovery weeks. Bars animate growing, line draws on.
8. **Calendar Widget** — 7-day weekly structure. Session cards (Tempo, Easy, Intervals, Long Run, Rest). Key sessions highlighted in lime.
9. **Verdict** — Projected finish time in large monospace. Confidence percentage. Decision Audit: expandable accordion showing reasoning for each coaching choice ("Why 8% volume cap?" → "Shin splint history + push through recovery = higher risk").
10. **Paywall** — "7-DAY FREE TRIAL" badge. 4 feature bullets (adapted per path). €9.99/month. Placed AFTER value demonstration.

### Key Design Patterns

**Streaming text:** Every coach message streams character by character (28ms/char) with a blinking cursor. This is NOT optional — it's the core interaction pattern. The coach "speaks," it doesn't "appear."

**MiniAnalysis:** When the user submits freeform text (typed or voice), a visible analysis runs:
- User's message displayed in a card
- Orange pulsing dot + "Analyzing..." label
- Monospace terminal lines appear one by one
- Pattern extraction: race goals, timelines, injury mentions, return-from-break, schedule preferences
- Flags important context with ⚠ markers
- "Added to profile ✓" in lime when done
- Coach acknowledges with streaming response
This is a trust mechanic — it proves the AI is actually processing what you said, not ignoring it.

**Freeform input widget:** Every conversation screen has access to a freeform input: textarea + microphone button + optional quick-pill shortcuts. Voice recording shows waveform visualization + timer. This is the escape hatch when structured options don't fit.

**Confidence system:** Three tiers throughout:
- HIGH (lime) — GPS data, verified paces
- MODERATE (orange) — self-reported, estimated
- LOW (red) — contradictory or insufficient data
Badge appears on radar chart, thinking stream result, verdict card.

**Decision Audit:** Expandable accordion on the verdict screen. Each row is a coaching decision with reasoning. "Why 8% volume cap?" → "Shin splint history + push through recovery = higher risk. Conservative loading." This is the differentiator — no other fitness app shows its reasoning.

### Design Tokens

```
Colors:
  black: #000000
  lime: #C8FF00 (primary accent, confirmed data, positive)
  orange: #FF8A00 (uncertain, estimated, moderate confidence)
  red: #FF5A5A (danger, risk flags, low confidence)
  blue: #5B9EFF (recovery weeks, calm)
  grays: 6 levels from 0.92 to 0.06 opacity white

Fonts:
  Coach voice: Outfit (300/400/500/600/700)
  Data/monospace: JetBrains Mono (400/500)

Animation feel:
  Spring-based entrances (overshoot then settle)
  28ms per character for streaming text
  Haptic-style button feedback (scale 0.975 on press)
  Film grain overlay (subtle, optional — nice-to-have)
```

---

## Your Audit Checklist

Before writing any plan, read the codebase and answer these questions. Write your findings in a `CODEBASE_AUDIT.md` file.

### Architecture
- [ ] What is the monorepo structure? (packages, apps, shared code)
- [ ] What framework/version of Expo is used?
- [ ] What navigation library? (Expo Router, React Navigation, etc.)
- [ ] How are screens organized? (file-based routing, manual stack?)
- [ ] What state management? (Zustand, Context, Redux, Jotai, etc.)
- [ ] Is there a design system / theme / tokens file already?
- [ ] What animation library is installed? (Reanimated, Moti, etc.)
- [ ] Is react-native-svg installed?
- [ ] What fonts are currently loaded?

### Existing Onboarding
- [ ] Which onboarding screens already exist? List them with file paths.
- [ ] What is the current flow/order?
- [ ] What input components exist? (buttons, text inputs, selectors, etc.)
- [ ] Is there already a wearable connection flow? (OAuth, Strava, etc.)
- [ ] Is there a paywall/subscription screen?
- [ ] What does the current UI look like? (describe the visual style)
- [ ] What's missing compared to the target flow above?

### Backend
- [ ] What backend framework? (Node, Python, etc.)
- [ ] What API routes exist for onboarding? List them.
- [ ] What data does the backend expect from onboarding completion?
- [ ] Is there a user profile / onboarding payload model?
- [ ] Does the backend generate training plans? How?
- [ ] Is Strava OAuth implemented?
- [ ] Is there a subscription/payment integration? (RevenueCat, Stripe, etc.)

### Component Library
- [ ] List all reusable components with file paths.
- [ ] Is there a streaming text / typewriter component?
- [ ] Are there chart/visualization components?
- [ ] Is there a voice recording component?
- [ ] What button/input components exist and what do they look like?

---

## The Plan You Must Produce

After the audit, produce an `INTEGRATION_PLAN.md` with this exact structure:

### Format

```markdown
# Cadence Onboarding — Integration Plan

## Codebase Summary
[2-3 paragraphs summarizing architecture, what exists, and gap analysis]

## Dependency Changes
[Any packages to install: reanimated, svg, fonts, haptics, etc.]

## Epic 1: Design System Alignment
### Story 1.1: [Title]
- **Files:** [exact paths to create/modify]
- **Description:** [what to do]
- **Acceptance criteria:**
  - [ ] ...
- **Depends on:** nothing / Story X.X

[...more stories...]

## Epic 2: ...
[...etc...]
```

### Required Epics (adapt to what exists)

**Epic 1: Design System Alignment**
Port the Cadence token system into the existing theme. Fonts, colors, spacing, animation primitives. If a design system already exists, extend it — don't replace it.

**Epic 2: Animation Infrastructure**
Ensure Reanimated is installed and configured. Create shared animation presets (springUp, fadeUp, etc.) that match the prototype feel. If Moti is already used, build on top of it.

**Epic 3: Conversation Primitives**
The reusable components every screen needs:
- StreamingText (character-by-character with cursor)
- Choice (radio/checkbox selection cards)
- Button (primary lime / ghost)
- FreeformInput (textarea + mic + pills)
- MiniAnalysis (visible processing stream)
- ProgressBar
- ConfidenceBadge

For each: check if an equivalent already exists. If yes, story is "adapt existing component." If no, story is "create new component."

**Epic 4: Onboarding Flow — Shared Screens**
The screens both paths go through: Welcome, Wearable (branch point), Goals, Health, Style, Open Question, Transition. Each screen is a story. Reference existing screens where they exist and define the delta.

**Epic 5: Onboarding Flow — Data Path**
ThinkingStream screen + adaptations on shared screens (different intro text, HIGH confidence, tighter ranges).

**Epic 6: Onboarding Flow — No-Data Path**
SelfReport screen + SynthesisStream + adaptations on shared screens (MODERATE confidence, wider ranges, orange markers).

**Epic 7: Data Visualization**
RadarChart, ProgressionChart, CalendarWidget, DecisionAudit. These are new components that render the plan results.

**Epic 8: Plan Presentation Screens**
Radar screen, Progression screen, Calendar screen, Verdict screen. Wiring the data viz components into full screens with coach commentary.

**Epic 9: Paywall & Conversion**
Paywall screen, feature list (adapted per path), trial mechanics, subscription integration.

**Epic 10: Backend Wiring**
Connect the onboarding payload to existing API routes. Wire the transition screen to actually wait for plan generation. Ensure the plan presentation screens render real data from the backend, not hardcoded values.

**Epic 11: Polish**
Haptics (expo-haptics on button presses and key moments), screen transitions, grain overlay (optional), edge cases (back navigation, app backgrounding mid-onboarding, state persistence).

### Story Requirements

Each story MUST have:
- **Files:** Exact paths (e.g., `apps/mobile/src/screens/onboarding/GoalsScreen.tsx`)
- **Description:** What to build or change, referencing the prototype behavior
- **Acceptance criteria:** Checkboxes. Be specific. "Streaming text appears at 28ms/char with blinking lime cursor" not "text animates in."
- **Depends on:** Which stories must be complete first
- **Estimated size:** S/M/L relative to other stories

### Ordering Rules
- Infrastructure before screens
- Primitives before compositions
- Shared screens before path-specific screens
- Core flow before polish
- Each story should be independently deliverable and testable

---

## Important Notes

- **Do NOT copy the web prototype code.** It's CSS + HTML. The target is React Native + Reanimated + react-native-svg. Translate the behavior, not the implementation.
- **Respect existing patterns.** If the codebase uses Zustand, don't introduce Context. If it uses Expo Router file-based routing, don't create a manual navigator. Work WITH the architecture.
- **The onboarding should be a single continuous experience.** Whether that's one route with internal state or a nested stack — match whatever pattern the existing code uses.
- **Every coach message streams.** If you see any screen where text appears instantly or fades in, that's wrong. 28ms/char, blinking cursor, always.
- **The freeform input must be available on every conversation screen** — as a primary input or as an escape hatch from structured options.
- **MiniAnalysis fires on every freeform submission** — Goals and Open Question screens at minimum.
- **The no-data path is not lesser — it's honest.** Orange everywhere, wider ranges, explicit about what's missing, constant promise of refinement.
