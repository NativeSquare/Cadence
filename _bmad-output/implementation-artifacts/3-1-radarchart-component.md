# Story 3.1: RadarChart Component

Status: done

---

## Story

As a **user**,
I want **to see my runner profile as a visual radar chart**,
So that **I understand my strengths and areas for improvement**.

---

## Acceptance Criteria

### AC1: Radar Chart Rendering

**Given** the RadarChart component is rendered
**When** data is provided (mock initially)
**Then** a 6-axis spider chart displays: Endurance, Speed, Recovery, Consistency, Injury Risk, Race Ready
**And** grid lines appear at 25%, 50%, 75%, 100%
**And** axis labels position around the perimeter

### AC2: Polygon Animation

**Given** the RadarChart component is mounted
**When** animation triggers
**Then** polygon fills from center outward with eased animation (1.4s duration, matches PROGRESS_BAR_MS)
**And** animation uses opacity fade-in combined with scale-up effect
**And** the polygon stroke draws before fill animates

### AC3: Value Labels

**Given** the animation completes
**When** values are displayed
**Then** value labels show percentage with count-up animation
**And** uncertain values (NO DATA path) show in orange (#FF8A00) with "?" suffix
**And** confirmed values (DATA path) show in lime (#C8FF00)
**And** low values (<50) show in red (#FF5A5A)

### AC4: RadarScreen Integration

**Given** coach commentary is needed
**When** RadarScreen displays
**Then** coach streams explanation of strengths and weaknesses using StreamingText component
**And** ConfidenceBadge shows HIGH (DATA) or MODERATE (NO DATA)
**And** screen auto-advances after coach message completes (with delay)

### AC5: Mock Data Support

**Given** the component is in mock mode
**When** no real data is provided
**Then** the component renders with hardcoded mock values
**And** a `useMock` prop or similar allows toggling between mock and real data
**And** both DATA and NO DATA paths can be demonstrated

---

## Tasks / Subtasks

- [x] **Task 1: Create RadarChart SVG Component** (AC: #1, #2)
  - [x] Create `apps/native/src/components/app/onboarding/viz/RadarChart.tsx`
  - [x] Use `react-native-svg` for the chart (already available via Victory Native)
  - [x] Implement 6-axis hexagon grid at 25%, 50%, 75%, 100% levels
  - [x] Calculate polygon points based on data values (0-100 scale)
  - [x] Position axis labels (Endurance, Speed, Recovery, Consistency, Injury Risk, Race Ready) around perimeter
  - [x] Apply design tokens: g6 for grid lines, lime for polygon fill/stroke, g3 for labels

- [x] **Task 2: Implement Polygon Animation** (AC: #2)
  - [x] Use Reanimated for enter animation
  - [x] Animate polygon from scale 0 at center to full size over 1.4s (PROGRESS_BAR_MS)
  - [x] Use `withTiming` with Easing.out(Easing.cubic) for smooth expansion
  - [x] Add opacity animation from 0 to polygon fill opacity (0.07)
  - [x] Trigger animation on mount with 400ms delay

- [x] **Task 3: Create Value Label Components** (AC: #3)
  - [x] Position value labels adjacent to each axis endpoint (radius + 28px)
  - [x] Implement count-up animation using useDerivedValue
  - [x] Apply color coding logic:
    - `value >= 50 && confirmed` → lime
    - `value >= 50 && !confirmed` → orange with "?"
    - `value < 50` → red
  - [x] Use JetBrains Mono font for numeric values

- [x] **Task 4: Create RadarScreen Component** (AC: #4)
  - [x] Create `apps/native/src/components/app/onboarding/screens/RadarScreen.tsx`
  - [x] Layout: Header with title/badge, RadarChart centered, StreamBlock coach commentary below
  - [x] Integrate with existing StreamBlock component for coach commentary
  - [x] Import and use ConfidenceBadge from Story 2-11
  - [x] Coach messages:
    - DATA path: "Strong consistency and endurance base. Recovery discipline is where we'll focus..."
    - NO DATA path: "The orange markers are estimates — they'll sharpen after your first week of logged runs."

- [x] **Task 5: Define Mock Data** (AC: #5)
  - [x] Create mock data sets for both paths:
    - DATA path: RADAR_MOCK_DATA_PATH with confirmed values
    - NO DATA path: RADAR_MOCK_NO_DATA_PATH with uncertain flags
  - [x] Add `mockPath: 'data' | 'no-data'` prop for demo switching
  - [x] Export mock data for use in flow integration testing

- [x] **Task 6: Props Interface & Export** (AC: all)
  - [x] Define `RadarChartProps` interface with data array, size, animate, onAnimationComplete
  - [x] Define `RadarScreenProps` interface with mockPath, hasData, data, onComplete
  - [x] Integrated into onboarding flow as "radar" scene
  - [x] TypeScript check passes (`tsc --noEmit`) - no new errors

---

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns from architecture.md:**

1. **Charting Library:**
   - Use `react-native-svg` directly (peer dep of Victory Native)
   - Do NOT use Victory Native's built-in radar chart - custom implementation needed
   - Skia is available but SVG is simpler for this use case

2. **Design System:**
   - Use design tokens from `design-tokens.ts` (Story 2-8)
   - Colors: lime (#C8FF00), orange (#FF8A00), red (#FF5A5A), grays (g1-g6)
   - No hardcoded colors - import from design tokens

3. **Animation:**
   - Use `react-native-reanimated` and hooks from `use-animations.ts`
   - Reuse timing constants: `PROGRESS_BAR_MS` (1400ms) for polygon animation
   - Count-up can use `withTiming` + shared value

4. **File Naming:**
   - Component: PascalCase.tsx (`RadarChart.tsx`, `RadarScreen.tsx`)
   - Place in `apps/native/src/components/app/onboarding/viz/` (new directory)

### Prototype Reference

From `cadence-v3.jsx` lines 704-750 (RadarSVG, RadarScreen):

```javascript
// RadarSVG: 6-axis spider with animated polygon
// Grid at 4 levels (25%, 50%, 75%, 100%)
// Labels positioned outside hexagon at each axis
// Polygon uses clip path for progressive reveal animation

// RadarScreen:
// StreamBlock with coach commentary
// ConfidenceBadge based on path (DATA=HIGH, NO_DATA=MODERATE)
```

### Radar Chart Geometry

```
       Endurance (0°)
           ★
      ╱    │    ╲
   Speed   │   Recovery
  (-60°)   │     (60°)
     ★─────┼─────★
    ╲      │      ╱
Consistency│  Injury Risk
  (-120°)  │    (120°)
      ╲    │    ╱
           ★
     Race Ready (180°)
```

**Coordinate calculation:**
```typescript
const angleStep = (2 * Math.PI) / 6; // 60 degrees
const getPoint = (index: number, value: number, radius: number) => {
  const angle = angleStep * index - Math.PI / 2; // Start from top
  const r = (value / 100) * radius;
  return {
    x: center + r * Math.cos(angle),
    y: center + r * Math.sin(angle),
  };
};
```

### Component Interface

```typescript
interface RadarChartProps {
  data: {
    endurance: number;
    speed: number;
    recovery: number;
    consistency: number;
    injuryRisk: number;
    raceReady: number;
  };
  confirmed?: {
    endurance: boolean;
    speed: boolean;
    recovery: boolean;
    consistency: boolean;
    injuryRisk: boolean;
    raceReady: boolean;
  };
  animate?: boolean;
  size?: number; // Chart diameter, default 280
}

interface RadarScreenProps {
  mockPath?: 'data' | 'no-data';
  onComplete?: () => void;
}
```

### Project Structure Notes

**Files to Create:**

| File | Purpose |
|------|---------|
| `apps/native/src/components/app/onboarding/viz/RadarChart.tsx` | SVG radar chart component |
| `apps/native/src/components/app/onboarding/screens/RadarScreen.tsx` | Screen with coach + chart |

**Dependencies:**

| Package | Status | Notes |
|---------|--------|-------|
| `react-native-svg` | Installed | Via Victory Native |
| `react-native-reanimated` | Installed | v4.1.6 |
| Design tokens | Story 2-8 | Import from `lib/design-tokens.ts` |
| Animations | Story 2-8 | Import from `lib/use-animations.ts` |
| StreamingText | Story 2-9 | Import from onboarding components |
| ConfidenceBadge | Story 2-11 | Import or stub if not available |

### Testing Considerations

1. **Visual Testing:**
   - RadarChart renders correctly with all 6 axes
   - Animation plays smoothly from center outward
   - Value labels position correctly outside polygon
   - Colors change correctly based on value thresholds

2. **Mock Data Toggle:**
   - DATA path shows lime values, HIGH badge
   - NO DATA path shows orange uncertain values, MODERATE badge
   - Both paths are visually distinct

3. **TypeScript:**
   - All props are typed
   - `tsc --noEmit` passes

### References

- [Source: architecture.md#Visual Components & Animation] - Victory Native XL, react-native-svg
- [Source: architecture.md#Design System Patterns] - Semantic token usage
- [Source: epics.md#Story 3.1] - Acceptance criteria
- [Source: cadence-v3.jsx lines 704-750] - RadarSVG implementation reference
- [Source: sprint-change-proposal-2026-02-14.md] - UI-first approach with mock data

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- TypeScript check passed for RadarChart.tsx, RadarScreen.tsx, Choice.tsx (Btn component)
- Pre-existing errors in strava.ts unrelated to this story

### Completion Notes List

1. Created RadarChart component using react-native-svg with 6-axis spider chart geometry
2. Implemented grid lines at 25%, 50%, 75%, 100% levels using Polygon elements
3. Used useAnimatedProps for smooth polygon animation from center outward (1.4s duration)
4. DataPointCircle component uses animated cx/cy props for smooth circle positioning
5. ValueLabel component positioned outside chart (radius + 28px) with staggered fade-in
6. Count-up animation implemented via useDerivedValue tracking progress.value
7. Color coding: lime for confirmed values >= 50, orange for uncertain, red for < 50
8. RadarScreen integrates RadarChart, StreamBlock, ConfidenceBadge with proper sequencing
9. Added Btn component to Choice.tsx for primary action buttons with springUp animation
10. Integrated RadarScreen into onboarding flow as "radar" scene (synthesis → radar → handoff)
11. Mock data exported: RADAR_MOCK_DATA_PATH and RADAR_MOCK_NO_DATA_PATH

### File List

| File | Status |
|------|--------|
| `apps/native/src/components/app/onboarding/viz/RadarChart.tsx` | Created |
| `apps/native/src/components/app/onboarding/screens/RadarScreen.tsx` | Created |
| `apps/native/src/components/app/onboarding/generative/Choice.tsx` | Modified (added Btn) |
| `apps/native/src/components/app/onboarding/onboarding-flow.tsx` | Modified (added radar scene) |
| `_bmad-output/implementation-artifacts/2-13-transition-loading-states.md` | Modified (status → done) |

---

## Change Log

| Date | Change |
|------|--------|
| 2026-02-14 | Story 3.1 implemented - RadarChart SVG with animation, RadarScreen with coach commentary, integrated into flow |
