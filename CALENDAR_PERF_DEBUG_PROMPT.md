# Calendar Performance Debug — Frame Drops After Opening

## Problem

The Calendar tab in this Expo Router React Native app causes **frame drops that persist after the tab is opened**. The issue feels like a memory leak — jank continues even after the initial mount is complete.

## What was already tried (and didn't fully fix it)

1. **Removed `DiagonalStripes` SVG** — Each of ~15 `SessionCard` was rendering a full `<Svg>` with `<Pattern>` + `<Rect fill="url(#stripes)">`. Removed the layer entirely (it was barely visible at 7% opacity).
2. **Lazy-mounted `WeekView`** — Using a `useRef` flag so it only mounts the first time the user toggles to "Sem." view.
3. **Deferred all 5 infinite Reanimated animations** with `InteractionManager.runAfterInteractions()`.
4. **Added `CalendarFocusContext`** — `CalendarScreen` calls `useIsFocused()` and provides it via context. All 3 animated components (`TimelineTodayDot`, `TodayMarker`, `TodayGlowRing`) consume it and `cancelAnimation()` when `!isFocused`.
5. **Memoized `weekHasSessions` and `todayColIdx`** in `WeekRow` with `useMemo`.

## Architecture context

### Navigation setup
- **Expo Router** with `@react-navigation/bottom-tabs` v7.4.0
- **Tab layout** at `apps/native/src/app/(app)/(tabs)/_layout.tsx` sets:
  - `lazy: true` — screens don't mount until first focused
  - `freezeOnBlur: true` — inactive screens are frozen via react-native-screens
- **react-native-screens** ~4.16.0 (enabled by default in RN v7)
- **react-native-reanimated** ~4.1.6
- **New Architecture enabled** (`newArchEnabled: true` in app.config.ts)

### Provider hierarchy (root → leaf)
```
KeyboardProvider → ConvexAuthProvider → GestureHandlerRootView → NetworkProvider → BottomSheetModalProvider → SafeAreaProvider → Stack → Stack.Screen("(tabs)") → Tabs
```

### Calendar render tree (when month view active)
```
CalendarScreen
  CalendarFocusContext.Provider (value={useIsFocused()})
    View (root)
      View (dark header — month nav + view toggle)
      View (cornerTransition — 28px rounded divider)
      View (MonthView container — visible)
        MonthView (React.memo)
          PhaseTimeline (React.memo)
            TimelineTodayDot (React.memo) — 2 infinite Reanimated anims (scale + opacity)
          DayHeaders (React.memo — static)
          WeekRow × 5 (React.memo)
            LinearGradient (today column highlight — only on 1 row)
            PhaseBand (React.memo)
              BandSegment × 1-2 per row (React.memo, memoized styles)
              TodayMarker (React.memo) — 2 infinite Reanimated anims (scale + opacity) — only on 1 row
            SessionCard × ~3-4 per row (React.memo with custom equality)
              LinearGradient (gradient overlay — expo-linear-gradient)
              WatermarkIcon (React.memo — SVG)
              CheckSvg (React.memo — SVG, only if done)
              TodayGlowRing (React.memo) — 1 infinite Reanimated anim — only on 1 card
          Legend (React.memo)
      View (WeekView container — display:none OR not mounted)
```

## Files to investigate

### Core calendar components (read ALL of these)
- `apps/native/src/components/app/calendar/CalendarScreen.tsx` — main container, owns state + focus context
- `apps/native/src/components/app/calendar/MonthView.tsx` — month grid
- `apps/native/src/components/app/calendar/WeekRow.tsx` — single week row (×5)
- `apps/native/src/components/app/calendar/PhaseBand.tsx` — phase color bands with day numbers
- `apps/native/src/components/app/calendar/SessionCard.tsx` — individual session card (×~15)
- `apps/native/src/components/app/calendar/PhaseTimeline.tsx` — top progress bar with animated dot
- `apps/native/src/components/app/calendar/TodayMarker.tsx` — pulsing circle reused in PhaseBand
- `apps/native/src/components/app/calendar/CalendarFocusContext.ts` — focus context
- `apps/native/src/components/app/calendar/WeekView.tsx` — week detail view
- `apps/native/src/components/app/calendar/WatermarkIcon.tsx` — SVG icons per card type
- `apps/native/src/components/app/calendar/DiagonalStripes.tsx` — REMOVED from render, file still exists
- `apps/native/src/components/app/calendar/helpers.ts` — buildWeeks, buildPhaseLookup, blendWithBg, etc.
- `apps/native/src/components/app/calendar/constants.ts` — PHASES, CAL_SESSIONS, TODAY_KEY, colors

### Navigation & config (read these for context)
- `apps/native/src/app/(app)/(tabs)/_layout.tsx` — tab navigator config (lazy, freezeOnBlur)
- `apps/native/src/app/(app)/(tabs)/calendar.tsx` — calendar tab entry (just renders CalendarScreen)
- `apps/native/src/app/(app)/_layout.tsx` — app stack (has modal routes)
- `apps/native/src/app/_layout.tsx` — root layout with all providers
- `apps/native/app.config.ts` — Expo config (newArchEnabled)

## Specific things to investigate

### 1. `freezeOnBlur: true` vs `useIsFocused()` conflict
The tab navigator already freezes inactive screens via react-native-screens. But `CalendarScreen` also calls `useIsFocused()` which triggers a re-render when focus changes. This creates a potential race:
- Tab loses focus → `useIsFocused()` returns `false` → context re-render → `cancelAnimation()` in all consumers → THEN freeze kicks in
- Tab gains focus → unfreeze → `useIsFocused()` returns `true` → context re-render → `InteractionManager.runAfterInteractions()` → restart animations

**Question:** Is `useIsFocused` redundant with `freezeOnBlur`? Does `freezeOnBlur` actually stop Reanimated UI-thread animations? If not, `useIsFocused` is correct. If yes, the double mechanism may cause thrashing.

### 2. ~15 `LinearGradient` native views (expo-linear-gradient)
Every `SessionCard` still renders a `<LinearGradient>` from expo-linear-gradient. Each one creates a native view. With ~15 session cards in the month grid, that's 15 native gradient views rendered simultaneously. Consider whether these can be replaced with a simple semi-transparent overlay or removed.

### 3. ~15 SVG `WatermarkIcon` elements
Each `SessionCard` renders a `WatermarkIcon` which is an SVG with 2-5 `<Path>` elements. That's ~15 SVGs still in the tree. These are `React.memo`'d but still mount and layout on first render.

### 4. `opacity` style prop on every `SessionCard`
```tsx
style={[styles.card, { backgroundColor: color, opacity: cardOpacity }]}
```
Using `opacity` on a View on iOS causes the view and ALL its children to be rendered to an offscreen buffer, then composited with the opacity. With ~15 cards each containing a LinearGradient + SVG + Text elements, this is 15 offscreen compositing passes. **This is a known iOS performance killer.** Consider pre-blending the opacity into the backgroundColor instead, or wrapping only the content that needs opacity.

### 5. Shadow properties on multiple elements
- `SessionCard.todayBorder`: `shadowColor`, `shadowOpacity: 0.5`, `shadowRadius: 10`, `elevation: 6`
- `PhaseBand.todayCircle`: `shadowColor`, `shadowOpacity: 0.3`, `shadowRadius: 10`, `elevation: 4`
- `PhaseTimeline.todayDot`: `shadowColor`, `shadowOpacity: 1`, `shadowRadius: 8`, `elevation: 4`
- `SessionCard.watermarkContainer`: `shadowColor`, `shadowOpacity: 1`, `shadowRadius: 2`

Shadows are expensive on both platforms. The `watermarkContainer` shadow on EVERY session card (not just today's) is especially wasteful since the watermark is at 18% opacity.

### 6. `blendWithBg()` called in render for BandSegments
`PhaseBand.tsx` → `BandSegment` calls `blendWithBg()` 5 times per segment inside `useMemo`. This does hex parsing + math. The `useMemo` deps include the color, position values — check if these are stable references or if they change every render causing the memo to recompute.

### 7. Inline style objects in `WeekRow` and `PhaseBand`
`WeekRow` creates inline style objects in the render path for `todayHighlight`:
```tsx
style={[styles.todayHighlight, { left: `${...}%`, width: `${...}%` }]}
```
These create new objects every render, breaking React's shallow comparison for any `React.memo` wrapping.

### 8. Reanimated `useAnimatedStyle` worklets
Each of the 3 animated components creates a `useAnimatedStyle` worklet. Even when the animation is cancelled, the worklet still exists and is registered. Check if cancelled worklets have zero overhead or if they're still polled by the Reanimated runtime.

### 9. `key={index}` pattern in lists
`WeekRow` maps with `key={di}` (index), and `MonthView` maps weeks with `key={\`week-${index}\`}`. If the weeks array changes identity on re-render (even with the same values), React may unmount/remount all children.

## What I want you to do

1. Read ALL the files listed above
2. Profile the render path mentally — count total native views, SVGs, gradients, shadows, and animations when the month view is showing
3. Identify the root cause of ongoing frame drops (not just initial mount cost)
4. Propose specific, minimal fixes — no over-engineering, no new abstractions unless necessary
5. Focus on the iOS platform first (shadows + opacity compositing are the biggest iOS performance traps)
6. If you determine `useIsFocused` is redundant with `freezeOnBlur`, remove it and the context entirely
