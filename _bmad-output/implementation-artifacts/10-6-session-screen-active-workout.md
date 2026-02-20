# Story 10.6: Session Detail Screen (Pre-Workout)

Status: ready-for-dev

---

## Story

As a runner,
I want to see complete details about a planned session before starting it,
So that I understand the workout structure, coach guidance, and can mentally prepare.

---

## Acceptance Criteria

### AC-1: Hero Header with Zone Badge

**Given** the user taps a session from the Plan screen or Calendar
**When** the Session Detail screen slides up (animation: `detailSlideUp .45s cubic-bezier(.32,.72,.37,1.0)`)
**Then** they see the dark hero header with:
- Back button (chevron left icon, color `g3`)
- Zone badge (pill with zone text, e.g., "Z4", colored background matching intensity)
- "Today" indicator with animated pulse dot (if applicable)
- "Completed" indicator with checkmark (if applicable)
- Session type as large title (34px, fontWeight 800, letterSpacing -0.04em)
- Date, duration, and distance subtitle (14px, color `g3`)

### AC-2: Collapsed Header on Scroll

**Given** the hero header is displayed
**When** the user scrolls down past threshold (80% of scroll position 10-90)
**Then** a collapsed header bar appears with:
- Back button
- Session type (16px, fontWeight 700)
- Zone badge (smaller variant)
- Background: `rgba(0,0,0,.95)` with `backdropFilter: blur(24px)`

### AC-3: Coach Insight Card

**Given** the session has a coach note
**When** the content area loads
**Then** they see the "Coach Insight" card:
- Background: `lime` (#C8FF00)
- Dot indicator + "Coach Insight" label (11px, fontWeight 600, color `rgba(0,0,0,.4)`)
- Coach message text (15px, fontWeight 500, color `black`, lineHeight 1.55)
- Border radius: 18px, padding: 18px 20px

### AC-4: Intensity Profile Chart

**Given** the session has multiple segments (not rest day)
**When** the IntensityProfile chart renders
**Then** they see an SVG-based visualization with:
- Title: "Intensity Profile" (11px uppercase)
- Legend showing Z4-5, Z3, Z2, Rest with color indicators
- Horizontal zone grid lines at 25%, 50%, 75%, 100%
- Animated bars for each segment (transition: 0.6s ease, staggered by segment index * 0.08s)
- Colored zone indicators on top edge of bars
- Segment km labels below bars
- Zone colors: Z4-5 = `barHigh` (#A8D900), Z3 = #9ACD32, Z2 = `barEasy` (#7CB342), Z1/Rest = `barRest` (#5B9EFF)
- **MUST use react-native-svg with reanimated** for implementation

### AC-5: Workout Structure Section

**Given** the session has segments
**When** the Workout Structure section renders
**Then** they see:
- Section header: "Workout Structure" (11px uppercase)
- List of segment rows with:
  - Colored bar indicator (4px width, 36px height, rounded)
  - Segment name (15px, fontWeight 600)
  - Zone and pace (12px, color `wMute`)
  - Distance in km (17px, fontWeight 700)
  - Staggered reveal animation (`splitReveal .35s ease` with delay per index * 0.06s)
- Container: rounded 20px, background `w1`, border `1px solid wBrd`

### AC-6: Overview Stats Grid

**Given** the session is not a rest day
**When** the Overview section renders
**Then** they see a 3-column grid with:
- Distance card: value + "km" unit, background `lime`, text `black`
- Duration card: value only, background `w1`, border `wBrd`
- Intensity card: "High"/"Low"/"Key", background `w1`, border `wBrd`
- Card padding: 14px 12px, borderRadius 16px
- Value: 20px, fontWeight 800; Label: 10px uppercase

### AC-7: Focus Points Section

**Given** the session renders
**When** the Focus Points section loads
**Then** they see:
- Section header: "Focus Points"
- 3 focus items with emoji + text
- Rest days: yoga, easy walk, sleep/hydration tips
- Workout days: pace guidance, hydration, route/fueling tips
- Container: rounded 16px, background `w1`, border `wBrd`

### AC-8: Week Context Bar

**Given** the session renders
**When** the bottom of the content displays
**Then** they see:
- Dark background card (background `wText`)
- Week/phase label (e.g., "Week 4 · Build Phase")
- Planned km (e.g., "57.2 km planned")
- 7 dots showing week completion status (lime for completed/current, dim otherwise)

### AC-9: Sticky Start CTA

**Given** the session is not completed and not a rest day
**When** the screen renders
**Then** a sticky CTA button appears at the bottom:
- Background gradient: `linear-gradient(transparent, w2 20%)`
- Button: full width, 18px padding, rounded 18px, background `wText`
- Play icon in lime circle (32px diameter)
- Text: "Start Session" (17px, fontWeight 700, color `w1`)
- Box shadow: `0 8px 32px rgba(0,0,0,.2)`
- Press feedback: `transform: scale(.97)` on press

# CRITICAL NOTE : THE DESIGN AND A WEB VERSION PROTOTYPE OF ALL CODE THE UI IS AVAILABLE HERE : - [cadence-full-v10.jsx](../_brainstorming/cadence-full-v10.jsx) . USE THIS AS YOUR ONLY REFERENCE IN TERMS OF DESIGN. THE FINAL NATIVE DESIGN MUST PERFECTLY MATCH THE ONE OF THE PROTOTYPE. PAY SPECIAL ATTENTION TO THE ANIMATION AND FONTs AND FONT PROPERTIES USED IN THAT PROTOTYPE. THE IMPLEMENTED VERSION MUST EXACTLY MATCH

---

## Tasks / Subtasks

### Phase 1: Foundation & Screen Structure

- [ ] **Task 1.1** Create `SessionDetailScreen.tsx` component (AC: 1, 2)
  - [ ] Set up full-screen modal container with slide-up animation
  - [ ] Implement scroll position tracking for collapsed header trigger
  - [ ] Dark background with grain effect (if applicable)

- [ ] **Task 1.2** Create `SessionDetailHeader.tsx` component (AC: 1)
  - [ ] Back button with chevron icon
  - [ ] Zone badge with dynamic color based on intensity
  - [ ] "Today" indicator with pulse animation
  - [ ] "Completed" indicator with checkmark
  - [ ] Session type title (34px, -0.04em letter-spacing)
  - [ ] Subtitle with date, duration, distance

- [ ] **Task 1.3** Create `CollapsedHeader.tsx` component (AC: 2)
  - [ ] Fade-in based on scroll position threshold
  - [ ] Blurred background (rgba(0,0,0,.95), blur 24px)
  - [ ] Compact zone badge and title

### Phase 2: Coach & Content Cards

- [ ] **Task 2.1** Create `CoachInsightCard.tsx` component (AC: 3)
  - [ ] Lime background (#C8FF00)
  - [ ] Dot indicator + label styling
  - [ ] Coach message text with proper typography

- [ ] **Task 2.2** Create `IntensityProfileChart.tsx` component (AC: 4)
  - [ ] SVG-based chart using react-native-svg
  - [ ] Zone height mapping: Z1=15%, Z2=35%, Z3=60%, Z4=85%, Z4-5=95%, Z5=100%
  - [ ] Zone color mapping function
  - [ ] Animated bars with staggered entrance (0.6s duration, 0.08s stagger)
  - [ ] Gradient fills for bars (50% opacity top to 8% bottom)
  - [ ] Catmull-Rom spline for smooth top curve (optional polish)
  - [ ] Grid lines at 25%, 50%, 75%, 100%
  - [ ] Segment km labels below bars
  - [ ] Legend row with zone colors

### Phase 3: Workout Structure & Overview

- [ ] **Task 3.1** Create `WorkoutStructure.tsx` component (AC: 5)
  - [ ] Section header with uppercase styling
  - [ ] Segment rows with colored bar indicator
  - [ ] Zone/pace info + distance display
  - [ ] Staggered reveal animation (splitReveal .35s, 0.06s delay)
  - [ ] Divider lines between segments

- [ ] **Task 3.2** Create `OverviewGrid.tsx` component (AC: 6)
  - [ ] 3-column grid layout
  - [ ] Distance card with lime background (hero style)
  - [ ] Duration and Intensity cards with white background
  - [ ] Proper typography for values and labels

### Phase 4: Supporting Sections

- [ ] **Task 4.1** Create `FocusPoints.tsx` component (AC: 7)
  - [ ] Dynamic focus items based on session type (rest vs workout)
  - [ ] Emoji + text rows with dividers
  - [ ] Container styling matching design

- [ ] **Task 4.2** Create `WeekContextBar.tsx` component (AC: 8)
  - [ ] Dark background card
  - [ ] Week/phase label and planned km
  - [ ] 7 completion dots with dynamic colors

### Phase 5: CTA & Navigation

- [ ] **Task 5.1** Create `StartSessionCTA.tsx` component (AC: 9)
  - [ ] Sticky positioning with gradient fade
  - [ ] Play icon in lime circle
  - [ ] Press feedback animation
  - [ ] Navigation to Active Session screen

### Phase 6: Integration & Animation

- [ ] **Task 6.1** Implement slide-up animation for screen entry
  - [ ] Use `detailSlideUp` keyframe equivalent with reanimated
  - [ ] 0.45s duration, cubic-bezier(.32,.72,.37,1.0) easing

- [ ] **Task 6.2** Integrate all components in SessionDetailScreen
  - [ ] Proper scroll handling for collapsed header
  - [ ] Props drilling for session data
  - [ ] Navigation callbacks (onBack, onStart)

- [ ] **Task 6.3** Add to navigation stack
  - [ ] Update plan screen to navigate to session detail
  - [ ] Handle session data passing between screens

---

## Dev Notes

### Critical Context from Prototype

The Session Detail screen design is fully implemented in the prototype at `_bmad-output/brainstorming/cadence-full-v10.jsx` lines 251-399. Key reference points:

| Prototype Element | Lines | Implementation Notes |
|-------------------|-------|---------------------|
| `SessionDetailScreen()` | 251-399 | Main component structure |
| `IntensityProfile()` | 163-246 | SVG chart with animated bars |
| Zone constants | 160-161 | `ZONE_HEIGHT` and `ZONE_COLOR` mappings |
| Session data | 92-124 | `PLAN` array with segment structure |
| Color helper | 126 | `bc()` function for bar colors |

### Typography Requirements (CRITICAL - must match exactly)

From prototype lines 3-14 (`T` object):

```typescript
// Session type title
fontSize: 34, fontWeight: 800, letterSpacing: "-0.04em", lineHeight: 1.1, color: "rgba(255,255,255,0.92)" // g1

// Section headers
fontSize: 11, fontWeight: 600, color: "rgba(163,163,160,1)", letterSpacing: "0.05em", textTransform: "uppercase" // wMute

// Segment names
fontSize: 15, fontWeight: 600, color: "#1A1A1A" // wText

// Segment details
fontSize: 12, color: "rgba(163,163,160,1)" // wMute

// Coach insight text
fontSize: 15, fontWeight: 500, color: "#000000", lineHeight: 1.55 // black

// Focus point text
fontSize: 14, color: "#1A1A1A", lineHeight: 1.4 // wText

// Font family: Outfit (fontWeight 300-800)
```

### Zone Mapping Constants

From prototype line 160-161:

```typescript
const ZONE_HEIGHT = {
  Z1: 0.15,
  Z2: 0.35,
  "Z2-3": 0.5,
  Z3: 0.6,
  "Z3-4": 0.75,
  Z4: 0.85,
  "Z4-5": 0.95,
  Z5: 1.0
};

const ZONE_COLOR = (z: string) => {
  if (z.includes("4") || z.includes("5")) return "#A8D900"; // barHigh
  if (z.includes("3")) return "#9ACD32";
  return "#7CB342"; // barEasy
};

// Rest zones use barRest: "#5B9EFF"
```

### Animation Keyframes to Implement

From prototype lines 27-45:

```typescript
// Screen slide in
detailSlideUp: translateY from 100% to 0 (0.45s, cubic-bezier(.32,.72,.37,1.0))

// Segment reveal
splitReveal: opacity 0→1, translateX from -10px to 0 (0.35s ease, staggered 0.06s per item)

// Today indicator
dotPulse: scale 1→1.3→1, opacity 0.6→1→0.6 (2s ease infinite)

// Chart bar animation
bars: y and height transition (0.6s cubic-bezier(.4,0,.2,1), staggered 0.08s per bar)

// Stroke draw
strokeDashoffset: 600→0 (1.2s cubic-bezier(.4,0,.2,1), 0.3s delay)
```

### Existing Components to Leverage

**DO NOT RECREATE** - The codebase already has visualization patterns:

1. **Analytics Components** at `apps/native/src/components/app/analytics/`
   - `Histogram.tsx` - SVG bar chart with staggered animations
   - `LineChart.tsx` - SVG stroke animation patterns
   - `StatsGrid.tsx` - Grid card layout with animations
   - **Directly applicable patterns for IntensityProfile**

2. **Design Tokens** at `apps/native/src/lib/design-tokens.ts`
   - All colors already defined (lime, barHigh, barEasy, barRest, etc.)
   - Typography scales
   - Spacing values

### Session Data Structure

From prototype lines 92-124, sessions have this structure:

```typescript
interface Session {
  type: string;           // "Tempo", "Easy Run", "Intervals", etc.
  km: string;             // "8.5"
  dur: string;            // "48min"
  done: boolean;
  intensity: "high" | "low" | "key" | "rest";
  desc: string;           // "4x2km @ 4:55 with 90s recovery"
  zone: string;           // "Z4", "Z2", "Z4-5", etc.
  today?: boolean;
  coachNote?: string;
  segments: Segment[];
}

interface Segment {
  name: string;           // "Warm Up", "Tempo Block 1", etc.
  km: string;             // "1.5"
  pace: string;           // "6:00"
  zone: string;           // "Z2", "Z4", etc.
}
```

### Project Structure Notes

Place new components at:

```
apps/native/src/components/app/session/
├── SessionDetailScreen.tsx       # Main screen component
├── SessionDetailHeader.tsx       # Hero header with zone badge
├── CollapsedHeader.tsx           # Collapsed header on scroll
├── CoachInsightCard.tsx          # Lime coach message card
├── IntensityProfileChart.tsx     # SVG intensity visualization
├── WorkoutStructure.tsx          # Segment list
├── OverviewGrid.tsx              # 3-column stats grid
├── FocusPoints.tsx               # Focus tips list
├── WeekContextBar.tsx            # Week progress bar
├── StartSessionCTA.tsx           # Sticky bottom button
└── index.ts                      # Barrel exports
```

### Screen Layout Pattern

Follow the established pattern from AnalyticsScreen and prototype:

```typescript
// Dark header section
<View className="bg-black pt-[62px] px-6 pb-7">
  {/* Hero content */}
</View>

// Light content section with top border radius
<ScrollView
  className="flex-1 bg-[#F8F8F6] rounded-t-[28px] -mt-1"
  onScroll={handleScroll}
>
  <View className="px-4 py-6 pb-[140px]">
    {/* Cards and sections */}
  </View>
</ScrollView>

// Sticky CTA
<View className="absolute bottom-0 left-0 right-0 z-50">
  {/* Start Session button */}
</View>
```

### IntensityProfile Chart Implementation Guide

Based on prototype lines 163-246:

```typescript
// 1. Calculate segment rects
const totalKm = segments.reduce((a, s) => a + parseFloat(s.km), 0);
const W = 326, H = 110, padT = 10, padB = 28;
const barH = H - padT - padB;

let cx = 0;
const rects = segments.map(seg => {
  const km = parseFloat(seg.km);
  const w = (km / totalKm) * W;
  const h = (ZONE_HEIGHT[seg.zone] || 0.4) * barH;
  const y = padT + barH - h;
  const rect = { x: cx, y, w, h, zone: seg.zone };
  cx += w;
  return rect;
});

// 2. Animate with reanimated
const animProgress = useSharedValue(0);
useEffect(() => {
  animProgress.value = withDelay(400, withTiming(1, {
    duration: 600,
    easing: Easing.out(Easing.cubic)
  }));
}, []);

// 3. Animated rect props
const rectAnimatedProps = (rect, index) => ({
  y: interpolate(animProgress.value, [0, 1], [padT + barH, rect.y]),
  height: interpolate(animProgress.value, [0, 1], [0, rect.h]),
  // Add stagger delay per index
});
```

---

## Technical Requirements

### Dependencies (Already Installed)

- `react-native-svg` - SVG rendering
- `react-native-reanimated` v4.1.6 - Animations
- NativeWind - Styling
- `lucide-react-native` - Icons (chevrons, play, check)

### New Dependencies

None required - all dependencies are already installed.

### Performance Considerations

- Memoize chart components with `React.memo`
- Use `useCallback` for scroll handlers
- Avoid re-computing rects on every render - use `useMemo`
- Use `useAnimatedScrollHandler` for smooth scroll tracking

---

## Architecture Compliance

### Naming Conventions

- Components: PascalCase (e.g., `SessionDetailScreen.tsx`)
- Props interfaces: `{Component}Props` (e.g., `IntensityProfileChartProps`)
- Animation values: descriptive (e.g., `barAnimProgress`, `headerOpacity`)

### State Management

- Screen state: `useState` for scroll position, collapsed header visibility
- Animation state: `useSharedValue` for reanimated values
- Session data: props from navigation params

### Error Handling

- Handle missing segments gracefully (show simple view for rest days)
- Handle missing coach note (hide card)
- Handle missing zone data (default to Z2 styling)

---

## Library/Framework Requirements

### SVG Charts

Use `react-native-svg` as established in Analytics:

```typescript
import Svg, {
  Rect,
  Line,
  Path,
  G,
  Defs,
  LinearGradient,
  Stop,
  Text as SvgText
} from "react-native-svg";
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  Easing,
  interpolate
} from "react-native-reanimated";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);
```

### Animations

Use Reanimated patterns established in Analytics components:

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  FadeIn,
  FadeInUp,
  SlideInUp,
  useAnimatedScrollHandler,
  interpolate
} from "react-native-reanimated";
```

---

## File Structure Requirements

| File | Purpose |
|------|---------|
| `apps/native/src/components/app/session/SessionDetailScreen.tsx` | Main screen component |
| `apps/native/src/components/app/session/SessionDetailHeader.tsx` | Hero header |
| `apps/native/src/components/app/session/CollapsedHeader.tsx` | Collapsed header |
| `apps/native/src/components/app/session/CoachInsightCard.tsx` | Lime coach card |
| `apps/native/src/components/app/session/IntensityProfileChart.tsx` | SVG chart |
| `apps/native/src/components/app/session/WorkoutStructure.tsx` | Segment list |
| `apps/native/src/components/app/session/OverviewGrid.tsx` | Stats grid |
| `apps/native/src/components/app/session/FocusPoints.tsx` | Focus tips |
| `apps/native/src/components/app/session/WeekContextBar.tsx` | Week progress |
| `apps/native/src/components/app/session/StartSessionCTA.tsx` | Sticky CTA |
| `apps/native/src/components/app/session/index.ts` | Barrel exports |

---

## Testing Requirements

### Unit Tests

- IntensityProfileChart renders correct number of bars for segments
- Zone height mapping returns correct percentages
- Zone color mapping returns correct colors
- Collapsed header shows/hides based on scroll position

### Integration Tests

- Screen slides up when navigated to
- All sections render for workout session
- Rest day shows appropriate simplified view
- Start Session button navigates correctly

### Visual Verification

- Compare rendered screen against prototype at `cadence-full-v10.jsx` lines 251-399
- Verify typography matches exactly (font sizes, weights, letter-spacing)
- Verify colors match design tokens
- Verify animations match timing and easing

---

## Navigation Flow

```
Plan Screen (tap session card)
    → Session Detail Screen [THIS STORY]
        → (tap "Start Session")
            → Active Session Screen (Story 10.7)
```

---

## References

- [Design Prototype - SessionDetailScreen](../_bmad-output/brainstorming/cadence-full-v10.jsx#L251-L399) - Complete visual reference
- [Design Prototype - IntensityProfile](../_bmad-output/brainstorming/cadence-full-v10.jsx#L163-L246) - Chart component reference
- [Epic 10 Definition](./10-0-frontend-screens-epic.md) - Story requirements
- [Analytics Components](../apps/native/src/components/app/analytics/) - SVG animation patterns
- [Design Tokens](../apps/native/src/lib/design-tokens.ts) - Colors, fonts
- [Story 10.4 Reference](./10-4-analytics-screen-analytics-tab.md) - Pattern reference for charts

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

