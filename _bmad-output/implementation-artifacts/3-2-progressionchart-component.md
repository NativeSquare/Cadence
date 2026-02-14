# Story 3.2: ProgressionChart Component

Status: review

---

## Story

As a **user**,
I want **to see my training volume progression over the plan duration**,
So that **I understand how my training will build**.

---

## Acceptance Criteria

### AC1: Bar Chart Rendering

**Given** the ProgressionChart component is rendered
**When** data is provided (mock initially)
**Then** 10-week view displays with volume bars
**And** bars have hatched/lined fill pattern inside
**And** X-axis shows week numbers (W1-W10)
**And** Y-axis shows volume scale (km or miles)

### AC2: Bar Animation

**Given** the ProgressionChart component mounts
**When** animation triggers
**Then** bars animate growing from bottom (growBar animation)
**And** each bar animates with 0.6s duration
**And** bars stagger by 80ms each (W1 first, W10 last)
**And** animation uses `transform-origin: bottom`

### AC3: Intensity Line Overlay

**Given** the chart includes intensity data
**When** the line renders
**Then** intensity line overlays bars as polyline with dots at each week
**And** line draws on with stroke-dashoffset animation (1.2s after bars complete)
**And** line uses orange (#FF8A00) color
**And** dots pulse briefly when line reaches them

### AC4: Recovery Week Markers

**Given** recovery weeks are in the plan
**When** weeks 4, 7, 10 render
**Then** they display in blue tint (#5B9EFF)
**And** "Recovery" or "Race" label appears below the bar
**And** these bars are visually distinct from build weeks

### AC5: Legend Display

**Given** the chart displays
**When** legend renders
**Then** legend shows three items:
- VOLUME (lime bar with hatch pattern)
- INTENSITY (orange line with dot)
- RECOVERY (blue bar)
**And** legend is positioned below the chart

### AC6: ProgressionScreen Integration

**Given** coach commentary is needed
**When** ProgressionScreen displays
**Then** coach streams explanation of build-rest-build pattern
**And** DATA path emphasizes deliberate recovery dips from actual history
**And** NO DATA path explains conservative start with ramp potential
**And** screen auto-advances after coach message completes

### AC7: Mock Data Support

**Given** the component is in mock mode
**When** no real data is provided
**Then** component renders with hardcoded 10-week mock volume/intensity data
**And** both DATA and NO DATA commentary paths can be demonstrated

---

## Tasks / Subtasks

- [x] **Task 1: Create ProgressionChart Component** (AC: #1)
  - [x] Create `apps/native/src/components/app/onboarding/viz/ProgressionChart.tsx`
  - [x] Use `react-native-svg` for bar chart
  - [x] Implement 10 vertical bars representing weekly volume
  - [x] Add hatched pattern inside bars (diagonal lines at 45°)
  - [x] Create X-axis with week labels (W1-W10)
  - [x] Create Y-axis with volume scale
  - [x] Apply design tokens: lime for bars, g3 for axis lines, g1 for labels

- [x] **Task 2: Implement Bar Animation** (AC: #2)
  - [x] Use Reanimated's `useAnimatedProps` for each bar
  - [x] Animate height from 0 to full with `transform-origin: bottom` effect
  - [x] Apply stagger delay: `index * 80ms`
  - [x] Use `withTiming` with 0.6s duration and easing
  - [x] Trigger animation on mount with `animate` prop

- [x] **Task 3: Create Intensity Line** (AC: #3)
  - [x] Add SVG polyline connecting intensity values at each week
  - [x] Place dots (circles) at each data point
  - [x] Implement stroke-dasharray/dashoffset animation for line draw
  - [x] Start line animation 0.8s after bars begin (overlapping)
  - [x] Use orange (#FF8A00) for line and dots
  - [x] Dots appear with fade/scale when line reaches them

- [x] **Task 4: Style Recovery Weeks** (AC: #4)
  - [x] Recovery weeks identified via `recovery` prop on WeekData
  - [x] Apply blue (#5B9EFF) fill to recovery week bars
  - [x] Add "Recovery" or "Race" label below marked bars
  - [x] Maintain hatched pattern with blue tint

- [x] **Task 5: Create Legend Component** (AC: #5)
  - [x] Create inline legend below chart
  - [x] Three items with icons and labels:
    - Lime rectangle + "VOLUME"
    - Orange line with dot + "INTENSITY"
    - Blue rectangle + "RECOVERY"
  - [x] Use g3 color for legend text

- [x] **Task 6: Create ProgressionScreen Component** (AC: #6)
  - [x] Create `apps/native/src/components/app/onboarding/screens/ProgressionScreen.tsx`
  - [x] Layout: Header at top, ProgressionChart centered, coach commentary below
  - [x] Coach messages:
    - DATA path: "Here's how we build — three weeks on, one recovery..."
    - NO DATA path: "We're starting conservative. Weeks 1-3 establish your baseline..."
  - [x] Accept `mockPath` prop for demo toggling

- [x] **Task 7: Define Mock Data** (AC: #7)
  - [x] Create mock 10-week data with volume, intensity, recovery weeks
  - [x] Export `PROGRESSION_MOCK_DATA` for flow integration

- [x] **Task 8: Props Interface & Export** (AC: all)
  - [x] Define `WeekData`, `ProgressionChartProps` interfaces
  - [x] Define `ProgressionScreenProps` interface
  - [x] TypeScript check passes (`tsc --noEmit`) - no new errors
  - [x] Integrated into onboarding flow as "progression" scene (radar → progression → handoff)

---

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns from architecture.md:**

1. **Charting Library:**
   - Use `react-native-svg` directly for custom bar chart
   - Could also explore Victory Native Bar/Line charts if simpler
   - Hatched pattern requires SVG `<defs>` + `<pattern>` elements

2. **Design System:**
   - Import colors from `design-tokens.ts` (Story 2-8)
   - Lime (#C8FF00) for build weeks, blue (#5B9EFF) for recovery, orange (#FF8A00) for intensity
   - Gray scale for axes and labels (g1, g3, g5)

3. **Animation:**
   - Use hooks from `use-animations.ts` where applicable
   - `growBar` animation pattern already defined
   - Stagger using `withDelay` in Reanimated
   - Line draw uses `stroke-dasharray` and `stroke-dashoffset`

4. **File Naming:**
   - `ProgressionChart.tsx`, `ProgressionScreen.tsx`
   - Place in `apps/native/src/components/app/onboarding/viz/`

### Prototype Reference

From `cadence-v3.jsx` lines 755-818 (ProgressionScreen):

```javascript
// 10-week bar chart with volume bars
// Intensity line overlaid as polyline
// Recovery weeks (4, 7, 10) in blue with labels
// Legend: VOLUME / INTENSITY / RECOVERY
// Hatched fill pattern inside bars
// growBar animation: scaleY 0→1 from bottom
// drawLine animation: stroke-dashoffset for line reveal
```

### SVG Pattern for Hatched Bars

```typescript
// Define pattern in <Defs>
<Defs>
  <Pattern id="hatchLime" patternUnits="userSpaceOnUse" width="6" height="6">
    <Path d="M0,6 L6,0" stroke={COLORS.lime} strokeWidth="1" opacity="0.3" />
  </Pattern>
  <Pattern id="hatchBlue" patternUnits="userSpaceOnUse" width="6" height="6">
    <Path d="M0,6 L6,0" stroke={COLORS.blue} strokeWidth="1" opacity="0.3" />
  </Pattern>
</Defs>

// Use pattern fill
<Rect fill="url(#hatchLime)" />
```

### Component Interface

```typescript
interface WeekData {
  week: number;
  volume: number;      // km, 0-80 scale typically
  intensity: number;   // 0-100 scale
  recovery?: boolean;
  label?: string;      // "Recovery" or "Race"
}

interface ProgressionChartProps {
  data: WeekData[];
  animate?: boolean;
  showIntensity?: boolean;
  size?: { width: number; height: number };
}

interface ProgressionScreenProps {
  mockPath?: 'data' | 'no-data';
  onComplete?: () => void;
}
```

### Project Structure Notes

**Files to Create:**

| File | Purpose |
|------|---------|
| `apps/native/src/components/app/onboarding/viz/ProgressionChart.tsx` | Bar chart with intensity overlay |
| `apps/native/src/components/app/onboarding/screens/ProgressionScreen.tsx` | Screen with coach + chart |

**Dependencies:**

| Package | Status | Notes |
|---------|--------|-------|
| `react-native-svg` | Installed | Via Victory Native |
| `react-native-reanimated` | Installed | v4.1.6 |
| Design tokens | Story 2-8 | Import from `lib/design-tokens.ts` |
| Animations | Story 2-8 | Import growBar, use-animations.ts |
| StreamingText | Story 2-9 | Import from onboarding components |

### Animation Sequence

```
T=0ms     : First bar starts growing
T=80ms    : Second bar starts
T=160ms   : Third bar starts
...
T=720ms   : Last bar starts (80ms * 9)
T=1320ms  : Last bar completes (720ms + 600ms)
T=800ms   : Intensity line starts drawing (overlapped)
T=2000ms  : Line draw completes (800ms + 1200ms)
T=2000ms+ : Dots pulse briefly
```

### Testing Considerations

1. **Visual Testing:**
   - 10 bars render with correct relative heights
   - Hatched pattern visible inside bars
   - Intensity line connects all points smoothly
   - Recovery weeks clearly distinct (blue)
   - Legend displays correctly

2. **Animation Testing:**
   - Bars grow from bottom in sequence
   - Stagger timing feels natural (not too fast/slow)
   - Line draws on smoothly after bars
   - No jank on lower-end devices

3. **TypeScript:**
   - All props typed
   - `tsc --noEmit` passes

### References

- [Source: architecture.md#Visual Components & Animation] - Victory Native XL, react-native-svg
- [Source: architecture.md#Design System Patterns] - Semantic token usage
- [Source: epics.md#Story 3.2] - Acceptance criteria
- [Source: cadence-v3.jsx lines 755-818] - ProgressionScreen reference
- [Source: sprint-change-proposal-2026-02-14.md] - UI-first approach

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- TypeScript check passed for ProgressionChart.tsx, ProgressionScreen.tsx
- Pre-existing errors in strava.ts unrelated to this story

### Completion Notes List

1. Created ProgressionChart component using react-native-svg with 10-week bar chart
2. Implemented hatched fill patterns using SVG `<Pattern>` and `<Defs>` elements
3. Bars animate with staggered timing (80ms between bars, 600ms duration each)
4. Intensity line uses stroke-dasharray/dashoffset animation (1200ms, starts at 800ms)
5. Recovery weeks display in blue (#5B9EFF) with "Recovery" or "Race" labels
6. AnimatedDot components appear as line reaches each point
7. Legend shows VOLUME, INTENSITY, RECOVERY with appropriate icons
8. ProgressionScreen integrates ProgressionChart, StreamBlock coach commentary
9. Integrated into onboarding flow as "progression" scene (radar → progression → handoff)
10. Mock data exported: PROGRESSION_MOCK_DATA with 10 weeks including recovery weeks

### File List

| File | Status |
|------|--------|
| `apps/native/src/components/app/onboarding/viz/ProgressionChart.tsx` | Created |
| `apps/native/src/components/app/onboarding/screens/ProgressionScreen.tsx` | Created |
| `apps/native/src/components/app/onboarding/onboarding-flow.tsx` | Modified (added progression scene) |

---

## Change Log

| Date | Change |
|------|--------|
| 2026-02-14 | Story 3.2 implemented - ProgressionChart with bar animation, intensity line, recovery markers, integrated into flow |
