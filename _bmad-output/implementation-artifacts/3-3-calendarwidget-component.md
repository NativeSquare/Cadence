# Story 3.3: CalendarWidget Component

Status: done

---

## Story

As a **user**,
I want **to see my typical training week visualized**,
So that **I understand what each day looks like**.

---

## Acceptance Criteria

### AC1: Weekly Grid Layout

**Given** the CalendarWidget component is rendered
**When** data is provided (mock initially)
**Then** a 7-column grid displays (Mon-Sun)
**And** header shows "Typical Week — Build Phase" (or relevant phase label)
**And** each column has a day abbreviation at top (M, T, W, T, F, S, S)

### AC2: Session Cards

**Given** sessions are displayed
**When** cards render
**Then** each shows session type (Tempo, Easy, Intervals, Long Run, Rest)
**And** duration displays below type (e.g., "45 min", "60 min")
**And** cards have subtle background (card surface token)
**And** cards have consistent height across the row

### AC3: Card Animation

**Given** the CalendarWidget mounts
**When** animation triggers
**Then** cards animate in with scaleIn animation
**And** animation staggers by 0.3s between cards (Mon first, Sun last)
**And** each card scales from 0.95 to 1.0 with fade-in

### AC4: Key Session Highlighting

**Given** key sessions are in the plan (typically Mon, Wed, Sun)
**When** Mon, Wed, Sun render (or whichever are marked as key)
**Then** they show a lime (#C8FF00) indicator dot at top-right
**And** card border is lime instead of default gray
**And** these cards are visually emphasized as important

### AC5: Rest Day Styling

**Given** rest days display
**When** Thu, Sat render (or whichever are rest)
**Then** minimal styling with "Rest" label centered
**And** no duration shown for rest days
**And** card uses muted styling (lower opacity, no border highlight)

### AC6: CalendarScreen Integration

**Given** coach commentary is needed
**When** CalendarScreen displays
**Then** coach streams: "Three key sessions anchor your week. The rest is recovery. And yes — two actual rest days. Non-negotiable."
**And** coach tone varies slightly based on DATA vs NO DATA path
**And** screen auto-advances after coach message completes

### AC7: Mock Data Support

**Given** the component is in mock mode
**When** no real data is provided
**Then** component renders with hardcoded weekly schedule mock data
**And** mock data reflects a balanced training week structure

---

## Tasks / Subtasks

- [x] **Task 1: Create CalendarWidget Component** (AC: #1, #2)
  - [x] Create `apps/native/src/components/app/onboarding/viz/CalendarWidget.tsx`
  - [x] Implement 7-column flexbox/grid layout
  - [x] Add header with phase label ("Typical Week — Build Phase")
  - [x] Add day abbreviations row (M, T, W, T, F, S, S)
  - [x] Create individual session cards with type and duration
  - [x] Apply design tokens: g6/card for backgrounds, g1 for text, g5 for borders

- [x] **Task 2: Create SessionCard Sub-component** (AC: #2, #4, #5)
  - [x] Define `SessionCardProps`: type, duration, isKey, isRest
  - [x] Session type display (centered, font-coach medium weight)
  - [x] Duration display (below type, smaller, g2 color)
  - [x] Key session styling: lime dot indicator, lime border
  - [x] Rest day styling: minimal, muted opacity, no duration

- [x] **Task 3: Implement Card Animation** (AC: #3)
  - [x] Use Reanimated `useScaleIn` or custom animation
  - [x] Animate scale from 0.95 to 1.0 with opacity 0 to 1
  - [x] Apply stagger delay: `index * 80ms` (0, 80, 160, 240, 320, 400, 480ms)
  - [x] Duration per card: 300ms
  - [x] Trigger on mount or `animate` prop

- [x] **Task 4: Create CalendarScreen Component** (AC: #6)
  - [x] Create `apps/native/src/components/app/onboarding/screens/CalendarScreen.tsx`
  - [x] Layout: StreamingText at top, CalendarWidget below
  - [x] Coach messages:
    - "Three key sessions anchor your week. The rest is recovery. And yes — two actual rest days. Non-negotiable."
  - [x] Accept `mockPath` prop for potential path-specific variations
  - [x] Auto-advance callback after message completes

- [x] **Task 5: Define Mock Data** (AC: #7)
  - [x] Create mock weekly schedule:
    ```typescript
    const mockSchedule = [
      { day: 'Mon', type: 'Tempo', duration: 45, isKey: true },
      { day: 'Tue', type: 'Easy', duration: 35, isKey: false },
      { day: 'Wed', type: 'Intervals', duration: 50, isKey: true },
      { day: 'Thu', type: 'Rest', duration: null, isRest: true },
      { day: 'Fri', type: 'Easy', duration: 40, isKey: false },
      { day: 'Sat', type: 'Rest', duration: null, isRest: true },
      { day: 'Sun', type: 'Long Run', duration: 75, isKey: true },
    ];
    ```
  - [x] Export mock data for flow integration testing

- [x] **Task 6: Props Interface & Export** (AC: all)
  - [x] Define `CalendarWidgetProps` interface
  - [x] Define `SessionCardProps` interface
  - [x] Define `CalendarScreenProps` interface
  - [x] TypeScript check passes (`tsc --noEmit`)

---

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns from architecture.md:**

1. **Layout:**
   - Use flexbox or NativeWind grid utilities
   - Responsive sizing that works on various screen widths
   - Cards should have consistent height (tallest determines row height)

2. **Design System:**
   - Import colors from `design-tokens.ts` (Story 2-8)
   - Lime (#C8FF00) for key session indicators
   - Gray scale for cards, borders, text (g1-g6, brd, card)
   - Font: Outfit for labels, JetBrains Mono for durations (optional)

3. **Animation:**
   - Use `useScaleIn` hook from `use-animations.ts` (Story 2-8)
   - Stagger implementation using `withDelay`
   - Keep animations subtle and quick (300ms per card)

4. **File Naming:**
   - `CalendarWidget.tsx`, `CalendarScreen.tsx`
   - Place in `apps/native/src/components/app/onboarding/viz/`

### Prototype Reference

From `cadence-v3.jsx` lines 823-858 (CalendarScreen):

```javascript
// 7-column grid: Mon-Sun
// Header: "Typical Week — Build Phase"
// Session cards with type + duration
// Key sessions (Mon, Wed, Sun) have lime indicator
// Rest days (Thu, Sat) show minimal styling
// Cards animate in with scaleIn + stagger
// Coach: "Three key sessions... two actual rest days. Non-negotiable."
```

### Component Layout

```
┌──────────────────────────────────────────────────────┐
│        Typical Week — Build Phase                    │
├──────┬──────┬──────┬──────┬──────┬──────┬──────┤
│  M   │  T   │  W   │  T   │  F   │  S   │  S   │
├──────┼──────┼──────┼──────┼──────┼──────┼──────┤
│ ●    │      │ ●    │      │      │      │ ●    │
│Tempo │ Easy │Inter-│ Rest │ Easy │ Rest │Long  │
│      │      │vals  │      │      │      │Run   │
│45min │35min │50min │      │40min │      │75min │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┘

● = lime dot (key session indicator)
```

### Component Interface

```typescript
interface SessionData {
  day: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
  type: 'Tempo' | 'Easy' | 'Intervals' | 'Long Run' | 'Rest' | string;
  duration: number | null;  // minutes, null for rest
  isKey?: boolean;
  isRest?: boolean;
}

interface CalendarWidgetProps {
  schedule: SessionData[];
  phaseLabel?: string;  // "Build Phase", "Recovery Week", etc.
  animate?: boolean;
}

interface CalendarScreenProps {
  mockPath?: 'data' | 'no-data';
  onComplete?: () => void;
}
```

### Project Structure Notes

**Files to Create:**

| File | Purpose |
|------|---------|
| `apps/native/src/components/app/onboarding/viz/CalendarWidget.tsx` | Weekly calendar grid component |
| `apps/native/src/components/app/onboarding/screens/CalendarScreen.tsx` | Screen with coach + calendar |

**Dependencies:**

| Package | Status | Notes |
|---------|--------|-------|
| `react-native-reanimated` | Installed | v4.1.6 |
| Design tokens | Story 2-8 | Import from `lib/design-tokens.ts` |
| Animations | Story 2-8 | Import useScaleIn from `lib/use-animations.ts` |
| StreamingText | Story 2-9 | Import from onboarding components |

### Session Type to Icon/Color Mapping (Optional Enhancement)

```typescript
const SESSION_STYLES = {
  'Tempo': { color: 'lime', icon: '⚡' },
  'Easy': { color: 'g2', icon: '🏃' },
  'Intervals': { color: 'ora', icon: '📊' },
  'Long Run': { color: 'lime', icon: '🛤️' },
  'Rest': { color: 'g4', icon: '😴' },
};
```

### Animation Sequence

```
T=0ms     : Monday card scales in
T=80ms    : Tuesday card scales in
T=160ms   : Wednesday card scales in
T=240ms   : Thursday card scales in
T=320ms   : Friday card scales in
T=400ms   : Saturday card scales in
T=480ms   : Sunday card scales in
T=780ms   : All cards complete (480ms + 300ms)
```

### Testing Considerations

1. **Visual Testing:**
   - 7 columns display with correct alignment
   - Key sessions have lime dot and border
   - Rest days are visually muted
   - Cards have consistent heights

2. **Animation Testing:**
   - Cards scale in smoothly with stagger
   - No visual glitches during animation
   - Animation feels natural on device

3. **Responsive:**
   - Widget fits on narrow screens (iPhone SE)
   - Cards don't overflow or truncate text awkwardly

4. **TypeScript:**
   - All props typed
   - `tsc --noEmit` passes

### References

- [Source: architecture.md#Visual Components & Animation] - Component patterns
- [Source: architecture.md#Design System Patterns] - Semantic token usage
- [Source: epics.md#Story 3.3] - Acceptance criteria
- [Source: cadence-v3.jsx lines 823-858] - CalendarScreen reference
- [Source: sprint-change-proposal-2026-02-14.md] - UI-first approach

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- CalendarWidget: 7-column flexbox layout with SessionCard sub-components
- SessionCard: Integrated as internal component within CalendarWidget.tsx
- Animation: Uses existing `useScaleIn` hook with 80ms stagger, 300ms duration
- Key sessions: Lime (#C8FF00) border + dot indicator at top-right
- Rest days: Muted opacity (0.5), no border highlight, no duration shown
- CalendarScreen: Streaming coach text + CalendarWidget, path-specific messaging
- Mock data: `CALENDAR_MOCK_SCHEDULE` exported for flow integration
- TypeScript: All interfaces typed, no errors in new components (pre-existing backend errors in strava.ts unrelated)

### File List

| File | Action |
|------|--------|
| `apps/native/src/components/app/onboarding/viz/CalendarWidget.tsx` | Created |
| `apps/native/src/components/app/onboarding/screens/CalendarScreen.tsx` | Created |
