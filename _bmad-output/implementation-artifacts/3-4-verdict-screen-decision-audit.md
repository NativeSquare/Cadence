# Story 3.4: Verdict Screen with DecisionAudit

Status: done

---

## Story

As a **user**,
I want **to see projected outcomes and understand the reasoning behind decisions**,
So that **I trust and own my training plan**.

---

## Acceptance Criteria

### AC1: Verdict Display - Coach Introduction

**Given** the Verdict screen renders
**When** coach introduction streams
**Then** DATA path shows: "So here's where I think you land."
**And** NO DATA path shows: "Based on what you've told me, here's my best estimate."
**And** text streams character by character with blinking cursor

### AC2: Projected Time Card

**Given** projected time displays
**When** animation completes (scaleIn)
**Then** large monospace time range appears (e.g., "1:43 — 1:46" or "1:40 — 1:52")
**And** time displays in lime (#C8FF00) for DATA path
**And** time displays in orange (#FF8A00) for NO DATA path
**And** card has appropriate border color (lime for DATA, orange for NO DATA)

### AC3: Confidence & Range Metrics

**Given** the projection card is displayed
**When** metrics render
**Then** confidence percentage shows:
  - DATA path: "75%" in lime
  - NO DATA path: "50%" in orange
**And** range shows:
  - DATA path: "±90s" in white
  - NO DATA path: "±6 min" in white
**And** divider separates confidence and range sections

### AC4: Uncertainty Explanation (NO DATA only)

**Given** NO DATA path is active
**When** projection card displays
**Then** explanatory text appears below metrics: "This range is wide on purpose — it'll narrow after your first training week."
**And** text uses muted styling (g4 color, smaller font)

### AC5: Coach Follow-up Streaming

**Given** the projection card has animated in
**When** follow-up coach message streams
**Then** DATA path shows: "The sub-1:45 isn't the ceiling — it's the floor."
**And** NO DATA path shows: "The first two weeks are calibration. After that, I'll know you."

### AC6: Decision Audit Section Header

**Given** Decision Audit section displays
**When** header renders
**Then** "Decision Audit" label appears in uppercase monospace
**And** uses g3 color with letter spacing
**And** section animates in with springUp

### AC7: Decision Audit Accordion Items

**Given** decision rows display
**When** collapsed
**Then** each shows question text: "Why 8% volume cap?", "Why two rest days?", "Why slow down easy pace?"
**And** arrow indicator (▸) shows collapsed state
**And** rows animate in with scaleIn and stagger (60ms between items)

### AC8: Decision Audit Expansion

**Given** user taps a decision row
**When** it expands
**Then** arrow rotates 90° (transition 0.2s)
**And** border changes to lime
**And** background gains lime glow
**And** justification text reveals with fadeIn animation
**And** justification references user data (e.g., "Shin splint history + push through recovery = higher risk")

### AC9: Decision Audit - DATA vs NO DATA

**Given** the Decision Audit section
**When** DATA path is active
**Then** full Decision Audit accordion displays with 3+ items
**When** NO DATA path is active
**Then** Decision Audit may be hidden or show placeholder message (path-dependent)

### AC10: Continue Button

**Given** all content has rendered
**When** user is ready to proceed
**Then** "Continue" button appears at bottom with padding
**And** button uses standard lime CTA styling
**And** tapping advances to Paywall screen

---

## Tasks / Subtasks

- [x] **Task 1: Create VerdictScreen Component** (AC: #1, #10)
  - [x] Create `apps/native/src/components/app/onboarding/screens/VerdictScreen.tsx`
  - [x] Accept `mockPath: 'data' | 'no-data'` prop
  - [x] Accept `onComplete?: () => void` callback
  - [x] Implement phased reveal using `usePhase` pattern (400ms, 2200ms, 3800ms, 5000ms)
  - [x] Layout: scrollable content area + fixed bottom button

- [x] **Task 2: Create ProjectionCard Component** (AC: #2, #3, #4)
  - [x] Create `apps/native/src/components/app/onboarding/viz/ProjectionCard.tsx`
  - [x] Define `ProjectionCardProps`: timeRange, confidence, rangeLabel, hasData
  - [x] Large time range display using JetBrains Mono (42px)
  - [x] Two-column metrics row: CONFIDENCE | divider | RANGE
  - [x] Path-dependent styling:
    - DATA: lime border, lime glow background, lime text
    - NO DATA: orange border, orange dim background, orange text
  - [x] Animate in with scaleIn (.5s)
  - [x] Optional explanation text for NO DATA path

- [x] **Task 3: Create DecisionAudit Component** (AC: #6, #7, #8, #9)
  - [x] Create `apps/native/src/components/app/onboarding/viz/DecisionAudit.tsx`
  - [x] Define `DecisionAuditProps`: decisions array, initialExpanded
  - [x] Define `Decision` type: `{ question: string, answer: string }`
  - [x] Header with "Decision Audit" uppercase label
  - [x] Accordion items with expand/collapse state
  - [x] Arrow rotation animation on expand (0 → 90°)
  - [x] Border and background change on expanded state
  - [x] Staggered scaleIn animation for rows

- [x] **Task 4: Implement Accordion Logic** (AC: #8)
  - [x] Single-expand behavior (only one open at a time)
  - [x] useState for `expandedIndex: number | null`
  - [x] Toggle handler: `setExpanded(exp === i ? null : i)`
  - [x] FadeIn animation for content reveal

- [x] **Task 5: Coach Streaming Integration** (AC: #1, #5)
  - [x] Use `useStream` hook from Story 2-9
  - [x] First message: path-dependent intro
  - [x] Second message: path-dependent follow-up (after projection card)
  - [x] Cursor component follows streaming text

- [x] **Task 6: Define Mock Data** (AC: all)
  - [x] Create mock decision data:
    ```typescript
    const mockDecisions = [
      { question: "Why 8% volume cap instead of 10%?", answer: "Shin splint history + \"push through\" recovery = higher risk. Conservative loading." },
      { question: "Why two rest days?", answer: "Only 3 rest days last month = recovery debt. One isn't enough." },
      { question: "Why slow down easy pace?", answer: "Current 5:40 is above aerobic threshold. True recovery requires actually recovering." },
    ];
    ```
  - [x] Create mock projection data for both paths:
    ```typescript
    const mockProjection = {
      data: { timeRange: ['1:43', '1:46'], confidence: 75, range: '±90s' },
      noData: { timeRange: ['1:40', '1:52'], confidence: 50, range: '±6 min' },
    };
    ```

- [x] **Task 7: Props Interface & Export** (AC: all)
  - [x] Define `VerdictScreenProps` interface
  - [x] Define `ProjectionCardProps` interface
  - [x] Define `DecisionAuditProps` interface
  - [x] TypeScript check passes (`tsc --noEmit`)

---

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns from architecture.md:**

1. **Design System:**
   - Import colors from `design-tokens.ts` (Story 2-8)
   - Lime (#C8FF00) for DATA path indicators
   - Orange (#FF8A00) for NO DATA path indicators
   - Gray scale for text hierarchy (g1, g2, g3, g4)
   - Font: Outfit for coach text, JetBrains Mono for times/metrics

2. **Animation:**
   - Use `useScaleIn`, `useSpringUp`, `useFadeIn` from `use-animations.ts`
   - Phase-based reveal pattern with delays
   - Stagger for accordion items (60ms)
   - Smooth expand/collapse transitions

3. **File Naming:**
   - `VerdictScreen.tsx`, `ProjectionCard.tsx`, `DecisionAudit.tsx`
   - Place in `apps/native/src/components/app/onboarding/viz/` and `.../screens/`

### Prototype Reference

From `cadence-v3.jsx` lines 864-913 (Verdict):

```javascript
// Phase-based reveal: 400, 2200, 3800, 5000ms
// Coach intro varies by path
// Projection card with time range, confidence, range
// DATA: lime border, tight range (±90s), 75% confidence
// NO DATA: orange border, wide range (±6 min), 50% confidence
// Decision Audit accordion with 3 items
// Expand/collapse with arrow rotation
// Justifications reference user data
```

### Component Layout

```
┌────────────────────────────────────────────────────────┐
│ "So here's where I think you land."                    │
├────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────┐ │
│ │           Projected Finish / Estimated Range       │ │
│ │                                                    │ │
│ │                  1:43 — 1:46                       │ │
│ │                                                    │ │
│ │     CONFIDENCE │     RANGE                         │ │
│ │        75%     │    ±90s                           │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ "The sub-1:45 isn't the ceiling — it's the floor."    │
│                                                        │
│ DECISION AUDIT                                         │
│ ┌────────────────────────────────────────────────────┐ │
│ │ ▸ Why 8% volume cap instead of 10%?                │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ ▸ Why two rest days?                               │ │
│ ├────────────────────────────────────────────────────┤ │
│ │ ▾ Why slow down easy pace? [EXPANDED]              │ │
│ │   Current 5:40 is above aerobic threshold...       │ │
│ └────────────────────────────────────────────────────┘ │
│                                                        │
│ ┌────────────────────────────────────────────────────┐ │
│ │                    Continue                         │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### Component Interfaces

```typescript
interface VerdictScreenProps {
  mockPath?: 'data' | 'no-data';
  onComplete?: () => void;
}

interface ProjectionCardProps {
  timeRange: [string, string];  // ["1:43", "1:46"]
  confidence: number;            // 75
  rangeLabel: string;            // "±90s"
  hasData: boolean;
  explanationText?: string;      // NO DATA only
}

interface Decision {
  question: string;
  answer: string;
}

interface DecisionAuditProps {
  decisions: Decision[];
  show?: boolean;  // can hide for NO DATA path
}
```

### Phase Timing

```
T=0ms      : Screen mounts
T=400ms    : Coach intro streams
T=2200ms   : Projection card animates in (scaleIn)
T=3800ms   : Coach follow-up streams
T=5000ms   : Decision Audit appears (DATA path)
           : Continue button appears
```

### Project Structure Notes

**Files to Create:**

| File | Purpose |
|------|---------|
| `apps/native/src/components/app/onboarding/screens/VerdictScreen.tsx` | Screen with phased reveal |
| `apps/native/src/components/app/onboarding/viz/ProjectionCard.tsx` | Time projection display |
| `apps/native/src/components/app/onboarding/viz/DecisionAudit.tsx` | Expandable audit accordion |

**Dependencies:**

| Package | Status | Notes |
|---------|--------|-------|
| `react-native-reanimated` | Installed | v4.1.6 |
| Design tokens | Story 2-8 | Import from `lib/design-tokens.ts` |
| Animations | Story 2-8 | Import from `lib/use-animations.ts` |
| useStream | Story 2-9 | Import from `hooks/use-stream.ts` |
| StreamingText | Story 2-9 | Import from onboarding components |

### Styling Notes

**Projection Card - DATA path:**
```typescript
{
  border: `1px solid ${colors.lime}`, // sb token
  background: colors.limeGlow,        // sg token (subtle glow)
  textColor: colors.lime,
}
```

**Projection Card - NO DATA path:**
```typescript
{
  border: `1px solid rgba(255,138,0,.3)`,
  background: colors.orangeDim,       // oraDim token
  textColor: colors.orange,
}
```

**Decision Audit Row - Expanded:**
```typescript
{
  border: `1px solid ${colors.lime}`, // sb token
  background: colors.limeGlow,
  arrowRotation: '90deg',
  arrowColor: colors.lime,
}
```

### Testing Considerations

1. **Visual Testing:**
   - DATA path shows lime styling, tight range, 75% confidence
   - NO DATA path shows orange styling, wide range, 50% confidence
   - Decision Audit expands/collapses correctly
   - Only one item expanded at a time

2. **Animation Testing:**
   - Phased reveal feels natural
   - Accordion expand/collapse smooth
   - Arrow rotation animates correctly

3. **Content Testing:**
   - Coach messages match path
   - Decision justifications are readable
   - All text displays without truncation

4. **TypeScript:**
   - All props typed
   - `tsc --noEmit` passes

### References

- [Source: architecture.md#Design System Patterns] - Semantic token usage
- [Source: architecture.md#Visual Components & Animation] - Animation patterns
- [Source: epics.md#Story 3.4] - Acceptance criteria
- [Source: cadence-v3.jsx lines 864-913] - Verdict component reference
- [Source: sprint-change-proposal-2026-02-14.md] - UI-first approach
- [Source: Story 2-9] - StreamingText, useStream hook patterns
- [Source: Story 3.1-3.3] - Similar viz component patterns

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- VerdictScreen: Phased reveal (400, 2200, 3800, 5000ms), scrollable content + fixed button
- ProjectionCard: 42px JetBrains Mono time display, path-dependent lime/orange styling
- DecisionAudit: Accordion with single-expand behavior, 60ms stagger, arrow rotation
- Coach streaming: Uses useStream hook with path-dependent intro/follow-up messages
- Mock data: PROJECTION_MOCK_DATA/NO_DATA, DECISION_AUDIT_MOCK exported
- TypeScript: All interfaces typed, no errors in new components

### File List

| File | Action |
|------|--------|
| `apps/native/src/components/app/onboarding/viz/ProjectionCard.tsx` | Created |
| `apps/native/src/components/app/onboarding/viz/DecisionAudit.tsx` | Created |
| `apps/native/src/components/app/onboarding/screens/VerdictScreen.tsx` | Created |
