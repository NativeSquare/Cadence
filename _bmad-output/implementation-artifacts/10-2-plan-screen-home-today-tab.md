# Story 10.2: Plan Screen (Home/Today Tab)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a runner,
I want to see my daily training plan on the home screen,
So that I know exactly what workout to do today and can track my weekly progress.

## Acceptance Criteria

1. **Given** the user is authenticated and on the main app
   **When** they land on the Plan screen (default tab)
   **Then** they see the date header with greeting ("Morning, [Name]") and week indicator
   **And** they see the 7-day calendar strip with activity dots for each day
   **And** they see today's session card with coach message, session details, and "Start Session" CTA
   **And** they see the "Coming Up" section with upcoming sessions
   **And** they see weekly volume progress and streak count widgets

2. **Given** the user scrolls down
   **When** they pass the header threshold
   **Then** a collapsed header bar appears with condensed date/week info (scroll behavior from prototype)

3. **Given** the user taps a day in the calendar strip
   **When** that day is selected
   **Then** the view updates to show that day's session details

4. **Given** the "Edit Plan" FAB is visible
   **When** the user taps it
   **Then** they are navigated to the plan editing flow (can be stubbed for now)

# CRITICAL NOTE : THE DESIGN AND A WEB VERSION PROTOTYPE OF ALL CODE THE UI IS AVAILABLE HERE : - [cadence-full-v9.jsx](../_brainstorming/cadence-full-v9.jsx) . USE THIS AS YOUR ONLY REFERENCE IN TERMS OF DESIGN. THE FINAL NATIVE DESIGN MUST PERFECTLY MATCH THE ONE OF THE PROTOTYPE. PAY SPECIAL ATTENTION TO THE ANIMATION AND FONTs AND FONT PROPERTIES USED IN THAT PROTOTYPE. THE IMPLEMENTED VERSION MUST EXACTLY MATCH

## Tasks / Subtasks

- [x] Task 1: Update Tab Navigation (AC: #1)
  - [x] 1.1 Modify `(app)/(tabs)/_layout.tsx` to add 4 tabs: Today, Coach, Analytics, Profile
  - [x] 1.2 Use prototype icons from `BottomNav` component (lines 700-722)
  - [x] 1.3 Replace current index.tsx with PlanScreen

- [x] Task 2: Create PlanScreen Container (AC: #1, #2)
  - [x] 2.1 Create `src/components/app/plan/PlanScreen.tsx`
  - [x] 2.2 Implement scroll handler with `onScroll` to track position
  - [x] 2.3 Calculate scroll progress `p = Math.min(1, Math.max(0, (scrollY - 20) / 60))`
  - [x] 2.4 Implement collapsed header bar appearing at `p > 0.85`
  - [x] 2.5 Use light theme background `w2` (#F8F8F6) for content area with `borderRadius: 28px`

- [x] Task 3: Create DateHeader Component (AC: #1, #2)
  - [x] 3.1 Create `src/components/app/plan/DateHeader.tsx`
  - [x] 3.2 Full header: Date ("Thursday, Feb 20"), greeting ("Morning, Alex"), week badge (W4)
  - [x] 3.3 Apply fade/translate animation based on scroll progress
  - [x] 3.4 Collapsed header: condensed date/week info for sticky bar

- [x] Task 4: Create CalendarStrip Component (AC: #1, #3)
  - [x] 4.1 Create `src/components/app/plan/CalendarStrip.tsx`
  - [x] 4.2 7-day horizontal grid layout with day labels (Mon-Sun) and dates (17-23)
  - [x] 4.3 Activity dots colored by session type: `lime` (key), `barHigh` (high), `barEasy` (low), `barRest` (rest)
  - [x] 4.4 Selected state: 2px black border, white background
  - [x] 4.5 Today state: 2px lime border, bold date text
  - [x] 4.6 `onDaySelect` callback to update parent state

- [x] Task 5: Create TodayCard Component (AC: #1)
  - [x] 5.1 Create `src/components/app/plan/TodayCard.tsx`
  - [x] 5.2 Coach quote section: lime background, pulsing dot during streaming, streamed text
  - [x] 5.3 Session details: vertical accent bar, type, zone, distance, description
  - [x] 5.4 "Start Session" CTA button (black bg, lime play icon)
  - [x] 5.5 Use `useStream` hook pattern from prototype for coach message animation

- [x] Task 6: Create SessionPreview Component (AC: #1)
  - [x] 6.1 Create `src/components/app/plan/SessionPreview.tsx`
  - [x] 6.2 Small card with side accent bar, session type, zone, distance
  - [x] 6.3 Completion checkmark for done sessions
  - [x] 6.4 `slideIn` animation with staggered delay per card

- [x] Task 7: Create WeekStatsRow Component (AC: #1)
  - [x] 7.1 Create `src/components/app/plan/WeekStatsRow.tsx`
  - [x] 7.2 Volume card: progress bar, completed/planned km
  - [x] 7.3 Streak card: dark background, lime accent number, "day streak" label

- [x] Task 8: Create EditPlanFAB Component (AC: #4)
  - [x] 8.1 Create `src/components/app/plan/EditPlanFAB.tsx`
  - [x] 8.2 Floating action button with `fabIn` animation
  - [x] 8.3 Pencil icon + "Edit Plan" text
  - [x] 8.4 Navigation stub to plan editing flow

- [x] Task 9: Integration & Mock Data (AC: #1)
  - [x] 9.1 Create mock data for 7-day plan matching prototype PLAN array
  - [x] 9.2 Wire components together in PlanScreen
  - [x] 9.3 Test scroll behavior and state management
  - [x] 9.4 Verify all components render correctly with mock data

## Dev Notes

### Design System Compliance

**CRITICAL:** Use existing design tokens from `src/lib/design-tokens.ts`:

- `COLORS.lime`, `COLORS.limeDim` for accent colors
- `GRAYS.g1-g6` for text hierarchy
- `SURFACES.brd`, `SURFACES.card` for borders/backgrounds

**Light Theme Colors** (from prototype `T` object):

```typescript
// Add to design-tokens.ts if not present
export const LIGHT_THEME = {
  w1: "#FFFFFF", // Pure white
  w2: "#F8F8F6", // Content background
  w3: "#EEEEEC", // Secondary background
  wText: "#1A1A1A", // Primary text
  wSub: "#5C5C5C", // Secondary text
  wMute: "#A3A3A0", // Muted text
  wBrd: "rgba(0,0,0,.06)", // Light borders
  barHigh: "#A8D900", // High intensity sessions
  barEasy: "#7CB342", // Easy sessions
  barRest: "#5B9EFF", // Rest days
} as const;
```

### Architecture Patterns

**Component Location:** `apps/native/src/components/app/plan/`

**State Management:**

- Use React `useState` for local UI state (selected day, scroll position)
- Use Convex queries for plan data (mock first, wire later)
- Follow existing pattern: UI components → hooks → Convex

**Naming Conventions:**

- Files: PascalCase.tsx
- Components: PascalCase
- Props: `{Component}Props`
- Hooks: `use-{name}.ts`

### Scroll Animation Implementation

From prototype lines 143-156:

```typescript
const [scrollY, setScrollY] = useState(0);
const p = Math.min(1, Math.max(0, (scrollY - 20) / 60));

// Full header fade/translate
const headerStyle = {
  opacity: 1 - p,
  transform: [{ translateY: -p * 30 }],
};

// Collapsed header visibility
const showCollapsed = p > 0.85;
```

### Session Color Logic

From prototype line 86:

```typescript
const getSessionColor = (session: Session) => {
  if (session.done) return COLORS.lime;
  if (session.intensity === "key") return COLORS.lime;
  if (session.intensity === "high") return LIGHT_THEME.barHigh;
  if (session.intensity === "low") return LIGHT_THEME.barEasy;
  if (session.intensity === "rest") return LIGHT_THEME.barRest;
  return GRAYS.g4;
};
```

### Project Structure Notes

**Files to Create:**

```
apps/native/src/
├── components/app/plan/
│   ├── PlanScreen.tsx
│   ├── DateHeader.tsx
│   ├── CalendarStrip.tsx
│   ├── TodayCard.tsx
│   ├── SessionPreview.tsx
│   ├── WeekStatsRow.tsx
│   └── EditPlanFAB.tsx
└── app/(app)/(tabs)/
    ├── _layout.tsx (MODIFY - add 4 tabs)
    └── index.tsx (MODIFY - render PlanScreen)
```

**Dependencies Already Available:**

- `react-native-reanimated` v4.1.6
- `react-native-gesture-handler` v2.28.0
- NativeWind v4.2.1
- Expo Router

### Data Requirements (Mock First)

```typescript
interface SessionData {
  type: string; // "Tempo", "Easy Run", "Intervals", "Rest", "Long Run"
  km: string; // "8.5" or "-" for rest
  dur: string; // "48min" or "-" for rest
  done: boolean;
  intensity: "key" | "high" | "low" | "rest";
  desc: string;
  zone: string; // "Z4", "Z2", "Z4-5"
  today?: boolean;
}

interface PlanData {
  userName: string;
  weekNumber: number;
  phase: string; // "Build", "Peak", "Taper"
  sessions: SessionData[]; // 7 days
  volumeCompleted: number;
  volumePlanned: number;
  streak: number;
  coachMessage: string;
}
```

### References

- [cadence-full-v9.jsx](../_brainstorming/cadence-full-v9.jsx) - TodayTab component lines 119-244
- [design-tokens.ts](apps/native/src/lib/design-tokens.ts) - Existing color tokens
- [tailwind.config.ts](apps/native/tailwind.config.ts) - NativeWind configuration
- [CalendarWidget.tsx](apps/native/src/components/app/onboarding/viz/CalendarWidget.tsx) - Pattern reference (different component)
- [architecture.md](_bmad-output/planning-artifacts/architecture.md) - Component structure patterns

### Dependency Notes

- **Story 10.1 (NativeWind Design System)** should ideally be completed first to establish light theme tokens
- If 10.1 is not complete, developer may need to add `LIGHT_THEME` tokens inline or to design-tokens.ts

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Expo export build completed successfully with 3859 modules
- No TypeScript errors in plan components

### Completion Notes List

1. **Task 1 - Tab Navigation**: Modified `_layout.tsx` to support 4 tabs (Today, Coach, Analytics, Profile) using NativeTabs with SF Symbols and Android drawables. Created placeholder files for `coach.tsx` and `analytics.tsx` tabs.

2. **Task 2 - PlanScreen Container**: Implemented main container with scroll-based header collapse animation using `react-native-reanimated`. Uses `useSharedValue` for scroll tracking and `useAnimatedStyle` for smooth transitions.

3. **Task 3 - DateHeader**: Created dual-variant component (full/collapsed) with pulsing week indicator dot. Full header shows date, personalized greeting with lime-colored name, and week badge.

4. **Task 4 - CalendarStrip**: 7-day horizontal calendar with interactive day selection. Activity dots color-coded by session intensity (lime/barHigh/barEasy/barRest). Selected and today states with appropriate borders.

5. **Task 5 - TodayCard**: Main session card with streaming coach message animation via `useStream` hook. Includes pulsing dot indicator, blinking cursor, session details with accent bar, and "Start Session" CTA with play icon.

6. **Task 6 - SessionPreview**: Compact cards for upcoming sessions with `FadeInRight` animation and staggered delays. Includes checkmark icon for completed sessions.

7. **Task 7 - WeekStatsRow**: Volume progress card with percentage bar and streak card with dark background and lime accent.

8. **Task 8 - EditPlanFAB**: Floating action button with `BounceIn` animation, pencil icon, and shadow effects. Positioned above tab bar.

9. **Task 9 - Integration**: Created comprehensive mock data matching prototype PLAN array, types, and utility functions. All components wired together in PlanScreen with proper state management.

### File List

**New Files:**

- `apps/native/src/components/app/plan/PlanScreen.tsx`
- `apps/native/src/components/app/plan/DateHeader.tsx`
- `apps/native/src/components/app/plan/CalendarStrip.tsx`
- `apps/native/src/components/app/plan/TodayCard.tsx`
- `apps/native/src/components/app/plan/SessionPreview.tsx`
- `apps/native/src/components/app/plan/WeekStatsRow.tsx`
- `apps/native/src/components/app/plan/EditPlanFAB.tsx`
- `apps/native/src/components/app/plan/types.ts`
- `apps/native/src/components/app/plan/utils.ts`
- `apps/native/src/components/app/plan/mock-data.ts`
- `apps/native/src/components/app/plan/use-stream.ts`
- `apps/native/src/components/app/plan/index.ts`
- `apps/native/src/app/(app)/(tabs)/coach.tsx`
- `apps/native/src/app/(app)/(tabs)/analytics.tsx`

**Modified Files:**

- `apps/native/src/app/(app)/(tabs)/_layout.tsx`
- `apps/native/src/app/(app)/(tabs)/index.tsx`
- `apps/native/src/lib/fonts.ts` - Added Outfit-ExtraBold
- `apps/native/src/lib/design-tokens.ts` - Updated FONT_WEIGHTS, added typography docs
- `apps/native/tailwind.config.ts` - Weight-specific font family mappings
- `apps/native/src/components/app/plan/DateHeader.tsx` - Fixed font classes
- `apps/native/src/components/app/plan/TodayCard.tsx` - Fixed font classes
- `apps/native/src/components/app/plan/CalendarStrip.tsx` - Fixed font classes
- `apps/native/src/components/app/plan/SessionPreview.tsx` - Fixed font classes
- `apps/native/src/components/app/plan/WeekStatsRow.tsx` - Fixed font classes
- `apps/native/src/components/app/plan/EditPlanFAB.tsx` - Fixed font classes
- `apps/native/src/components/app/plan/PlanScreen.tsx` - Fixed font classes

### Change Log

- 2026-02-20: Implemented Plan Screen (Story 10.2) - Complete Today/Plan tab with all UI components matching cadence-full-v9.jsx prototype
- 2026-02-20: Font and styling fix - Added `font-coach` class to all Text components for Outfit font family; Added decorative quotation marks to CoachQuote section in TodayCard; Applied proper letterSpacing and lineHeight values to match prototype
- 2026-02-20: **React Native font weight fix** - Fixed critical font rendering issue:
  - Added `Outfit_800ExtraBold` font to `fonts.ts` (prototype uses fontWeight 800)
  - Updated `tailwind.config.ts` to use weight-specific font families (`font-coach-bold` → `Outfit-Bold`) since React Native doesn't combine fontFamily + fontWeight like web CSS
  - Replaced all `font-coach font-bold/semibold/medium/light` patterns with `font-coach-bold/semibold/medium/light` classes
  - Updated `design-tokens.ts` documentation with correct typography usage patterns
  - Affected files: DateHeader, TodayCard, CalendarStrip, SessionPreview, WeekStatsRow, EditPlanFAB, PlanScreen
- 2026-02-20: Fixed greeting name font inheritance - Added `text-[28px] font-coach-bold` to nested Text for userName in DateHeader so it matches parent weight/size (only color differs: lime)
