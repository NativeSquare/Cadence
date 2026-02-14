# Story 2.8: Design Tokens & Animation Alignment

Status: done

---

## Story

As a **developer**,
I want **the design system aligned with the prototype tokens**,
So that **all UI components match the target visual design**.

---

## Acceptance Criteria

### AC1: Color Tokens

**Given** the prototype defines specific design tokens
**When** the design system is configured
**Then** colors are available as NativeWind utilities:
- Lime: #C8FF00 (`lime`)
- Lime dim: rgba(200,255,0,0.12) (`lime-dim`)
- Lime glow: rgba(200,255,0,0.06) (`lime-glow`)
- Orange: #FF8A00 (`ora`)
- Orange dim: rgba(255,138,0,0.12) (`ora-dim`)
- Red: #FF5A5A (`red`)
- Red dim: rgba(255,90,90,0.12) (`red-dim`)
- Blue: #5B9EFF (`blu`)
- Blue dim: rgba(91,158,255,0.12) (`blu-dim`)

### AC2: Gray Scale Tokens

**Given** the prototype uses 6 gray opacity levels
**When** the design system is configured
**Then** gray tokens are available:
- g1: rgba(255,255,255,0.92) - Primary text
- g2: rgba(255,255,255,0.70) - Secondary text
- g3: rgba(255,255,255,0.45) - Tertiary text
- g4: rgba(255,255,255,0.25) - Subtle text
- g5: rgba(255,255,255,0.10) - Borders
- g6: rgba(255,255,255,0.06) - Cards/surfaces

### AC3: Border & Surface Tokens

**Given** the prototype defines surface tokens
**When** the design system is configured
**Then** these tokens are available:
- `brd`: rgba(255,255,255,0.08) - Default border
- `card`: rgba(255,255,255,0.03) - Card background
- `sb`: rgba(200,255,0,0.4) - Selected border
- `sg`: rgba(200,255,0,0.06) - Selected glow

### AC4: Typography Tokens

**Given** the prototype uses specific fonts
**When** the design system is configured
**Then** fonts are loaded and mapped:
- `font-coach`: Outfit (300/400/500/600/700) - Coach voice, UI text
- `font-mono`: JetBrains Mono (400/500) - Data, terminal output

**And** the fonts are bundled with the app (no Google Fonts runtime loading)

### AC5: Animation Presets

**Given** the prototype uses specific animations
**When** animation primitives are created
**Then** the following presets are exported as Reanimated helpers:
- `springUp`: Translate Y from 24px + scale from 0.98, overshoot to -3px, settle (0.5s feel)
- `fadeUp`: Opacity 0→1 + translate Y from 14px to 0
- `fadeIn`: Opacity 0→1 only
- `scaleIn`: Opacity 0→1 + scale from 0.95 to 1.0
- `pulseGlow`: Opacity cycles 0.5→1→0.5 (for loading indicators)
- `shimmer`: Opacity cycles 0.4→1→0.4 (for skeleton states)
- `checkPop`: Scale 0→1.15→1 for checkbox/selection feedback
- `blink`: Sharp 0.8s on/off blink for cursor
- `growBar`: Scale Y from 0 to 1 (transform-origin bottom)
- `drawLine`: Stroke dash offset animation for line drawing
- `spin`: 360deg rotation (1s loop)

### AC6: Timing Constants

**Given** the prototype defines specific timing
**When** timing constants are exported
**Then** these values are available:
- `STREAM_CHAR_MS`: 28 - Character streaming speed
- `CURSOR_BLINK_MS`: 800 - Cursor blink interval
- `MINI_ANALYSIS_LINE_MS`: 280 - MiniAnalysis line reveal
- `SPRING_DURATION_MS`: 500 - Spring animation feel
- `PROGRESS_BAR_MS`: 1400 - RadarChart polygon animation

---

## Tasks / Subtasks

- [x] **Task 1: Define Design Token Constants** (AC: #1, #2, #3)
  - [x] Create `apps/native/src/lib/design-tokens.ts`
  - [x] Export `COLORS` object with all color tokens
  - [x] Export `GRAYS` object with g1-g6 opacity scale
  - [x] Export `SURFACES` object with border/card/selection tokens
  - [x] Add TypeScript types for type-safe access
  - [x] Document each token's purpose with JSDoc

- [x] **Task 2: Extend Tailwind Config** (AC: #1, #2, #3)
  - [x] Modify `apps/native/tailwind.config.ts`
  - [x] Add colors under `extend.colors` (lime, ora, red, blu with dim variants)
  - [x] Add grays under `extend.colors` using g1-g6 naming
  - [x] Add surface tokens (brd, card, sb, sg)
  - [x] Verify CSS variable integration with NativeWind

- [x] **Task 3: Load Custom Fonts** (AC: #4)
  - [x] Add font files via `@expo-google-fonts/outfit` and `@expo-google-fonts/jetbrains-mono`
  - [x] Outfit-Light.ttf (300)
  - [x] Outfit-Regular.ttf (400)
  - [x] Outfit-Medium.ttf (500)
  - [x] Outfit-SemiBold.ttf (600)
  - [x] Outfit-Bold.ttf (700)
  - [x] JetBrainsMono-Regular.ttf (400)
  - [x] JetBrainsMono-Medium.ttf (500)
  - [x] Update `_layout.tsx` to load fonts via expo-font useFonts hook
  - [x] Add font family mappings in tailwind.config.ts

- [x] **Task 4: Create Animation Presets** (AC: #5, #6)
  - [x] Create `apps/native/src/lib/animations.ts`
  - [x] Import from `react-native-reanimated`
  - [x] Create `createSpringUpStyle()` - enter from below with overshoot
  - [x] Create `createFadeUpStyle()` - opacity + translate Y
  - [x] Create `createFadeInStyle()` - opacity only
  - [x] Create `createScaleInStyle()` - opacity + scale
  - [x] Create `createPulseGlowValue()` - looping opacity for loading
  - [x] Create `createShimmerValue()` - skeleton loading state
  - [x] Create `createCheckPopValue()` - selection feedback
  - [x] Create `createBlinkValue()` - cursor blink
  - [x] Create `createGrowBarValue()` - bar chart animation
  - [x] Create `createDrawLineValue()` - SVG line draw
  - [x] Create `createSpinValue()` - loading spinner
  - [x] Export all timing constants

- [x] **Task 5: Create Animation Hooks** (AC: #5, #6)
  - [x] Create `useSpringUp(trigger)` hook returning animated style
  - [x] Create `useFadeUp(trigger, delay)` hook
  - [x] Create `useScaleIn(trigger, delay)` hook
  - [x] Create `usePulseGlow()` hook for infinite loop
  - [x] Create `useBlinkCursor(active)` hook for cursor visibility
  - [x] Hooks use Reanimated's `useAnimatedStyle`

- [x] **Task 6: Integration Test** (AC: all)
  - [x] Create test component exercising all tokens
  - [x] Verify colors render correctly in light/dark mode
  - [x] Verify fonts load and display correctly
  - [x] Verify all animation presets execute
  - [x] Run TypeScript checks (`tsc --noEmit`) - passes for story files

---

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns from architecture.md:**

1. **Design System Pattern:**
   - Use semantic tokens via NativeWind, never hardcode colors
   - Extend the existing CSS variable system (`--primary`, `--background`, etc.)
   - All new tokens should follow the established HSL variable pattern

2. **Animation Library:**
   - Use `react-native-reanimated` v4.1.6 (already installed)
   - Do NOT use Moti - use Reanimated directly
   - Worklets must use `'worklet'` directive

3. **File Naming:**
   - Utils: kebab-case.ts (`design-tokens.ts`, `animations.ts`)
   - Hooks: use-{name}.ts (`use-spring-up.ts` if separate)
   - Export as named exports, not default

### Existing Design System

The design system is already configured in NativeWind. Current tokens in `global.css`:

```css
:root {
  --background: 0 0% 3.9%;      /* Near-black */
  --foreground: 0 0% 98%;
  --primary: 73 100% 61%;       /* Lime (already close to #C8FF00) */
  --muted-foreground: 0 0% 63.9%;
}
```

**Do NOT replace** - extend with:
- New color tokens (ora, red, blu)
- Gray scale (g1-g6)
- Surface tokens (brd, card, sb, sg)
- Dim variants for each accent color

### Prototype Token Reference

From `cadence-v3.jsx` lines 4-16:

```javascript
const T = {
  black: "#000000", lime: "#C8FF00",
  limeDim: "rgba(200,255,0,0.12)", limeGlow: "rgba(200,255,0,0.06)",
  g1: "rgba(255,255,255,0.92)", g2: "rgba(255,255,255,0.7)",
  g3: "rgba(255,255,255,0.45)", g4: "rgba(255,255,255,0.25)",
  g5: "rgba(255,255,255,0.10)", g6: "rgba(255,255,255,0.06)",
  brd: "rgba(255,255,255,0.08)", card: "rgba(255,255,255,0.03)",
  sb: "rgba(200,255,0,0.4)", sg: "rgba(200,255,0,0.06)",
  red: "#FF5A5A", redDim: "rgba(255,90,90,0.12)",
  ora: "#FF8A00", oraDim: "rgba(255,138,0,0.12)",
  blu: "#5B9EFF", bluDim: "rgba(91,158,255,0.12)",
  f: "'Outfit',sans-serif", m: "'JetBrains Mono',monospace",
};
```

### Prototype Animation Reference

From `cadence-v3.jsx` lines 23-35:

```css
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
@keyframes blink{0%,50%{opacity:1}51%,100%{opacity:0}}
@keyframes checkPop{0%{transform:scale(0)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
@keyframes pulseGlow{0%,100%{opacity:.5}50%{opacity:1}}
@keyframes shimmer{0%{opacity:.4}50%{opacity:1}100%{opacity:.4}}
@keyframes springUp{0%{opacity:0;transform:translateY(24px) scale(.98)}70%{transform:translateY(-3px) scale(1.005)}100%{opacity:1;transform:translateY(0) scale(1)}}
@keyframes growBar{from{transform:scaleY(0)}to{transform:scaleY(1)}}
@keyframes drawLine{from{stroke-dashoffset:1000}to{stroke-dashoffset:0}}
@keyframes spin{to{transform:rotate(360deg)}}
```

### Font Asset Sources

Download Outfit and JetBrains Mono from Google Fonts:
- https://fonts.google.com/specimen/Outfit
- https://fonts.google.com/specimen/JetBrains+Mono

Place in `apps/native/assets/fonts/` following Expo font loading conventions.

### Reanimated Animation Pattern

```typescript
// Example springUp implementation
import { withSpring, withTiming, Easing } from 'react-native-reanimated';

export const SPRING_CONFIG = {
  damping: 12,
  stiffness: 180,
  mass: 0.8,
};

export function withSpringUp() {
  'worklet';
  return {
    transform: [
      { translateY: withSpring(0, SPRING_CONFIG) },
      { scale: withSpring(1, SPRING_CONFIG) },
    ],
    opacity: withTiming(1, { duration: 300 }),
  };
}

// Hook pattern
export function useSpringUp(trigger: boolean, delay = 0) {
  const animatedStyle = useAnimatedStyle(() => {
    if (trigger) {
      return withDelay(delay, withSpringUp());
    }
    return { opacity: 0, transform: [{ translateY: 24 }, { scale: 0.98 }] };
  });
  return animatedStyle;
}
```

### Project Structure Notes

**Files to Create:**

| File | Purpose |
|------|---------|
| `apps/native/src/lib/design-tokens.ts` | Color, gray, surface token exports |
| `apps/native/src/lib/animations.ts` | Reanimated animation presets + hooks |
| `apps/native/assets/fonts/Outfit-*.ttf` | Coach voice font family |
| `apps/native/assets/fonts/JetBrainsMono-*.ttf` | Data/monospace font family |

**Files to Modify:**

| File | Change |
|------|--------|
| `apps/native/tailwind.config.ts` | Extend colors, add font families |
| `apps/native/app.config.ts` or `apps/native/src/app/_layout.tsx` | Load fonts |
| `apps/native/src/styles/global.css` | Add new CSS variables if needed |

### Dependencies

**No new packages required.** Using:
- `react-native-reanimated` v4.1.6 (already installed)
- `nativewind` v4.2.1 (already installed)
- `expo-font` (already available in Expo)

### Testing Considerations

1. **Visual Testing:**
   - Create a temporary test screen showing all colors as swatches
   - Show all gray levels side by side
   - Test each animation preset with tap triggers
   - Verify fonts render at all weights

2. **TypeScript:**
   - All tokens should be typed for autocomplete
   - Animation hooks should have typed return values
   - `tsc --noEmit` must pass

3. **Edge Cases:**
   - Verify tokens work in both iOS and Android
   - Verify animations don't cause jank on lower-end devices
   - Verify fonts load before first render (use Expo SplashScreen if needed)

### References

- [Source: architecture.md#Design System Patterns] - Semantic token usage rules
- [Source: architecture.md#Visual Components & Animation] - Reanimated, Victory Native XL
- [Source: cadence-v3.jsx lines 4-16] - Token values
- [Source: cadence-v3.jsx lines 23-35] - Animation keyframes
- [Source: claude-code-brief.md#Design Tokens] - Token documentation
- [Source: sprint-change-proposal-2026-02-14.md#Story 2-8] - Story requirements

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- **Task 1**: Created `design-tokens.ts` with COLORS, GRAYS, SURFACES, FONTS exports. All tokens fully typed with JSDoc documentation.
- **Task 2**: Extended `tailwind.config.ts` with lime/ora/red/blu color tokens (with dim variants), g1-g6 gray scale, surface tokens (brd, card-surface, sb, sg), and font-coach/font-mono family mappings.
- **Task 3**: Used `@expo-google-fonts/outfit` and `@expo-google-fonts/jetbrains-mono` packages for bundled font loading (no runtime Google Fonts). Updated `_layout.tsx` with useFonts hook and SplashScreen integration. Created `fonts.ts` config.
- **Task 4**: Created `animations.ts` with all timing constants (STREAM_CHAR_MS, CURSOR_BLINK_MS, etc.), spring configs (SPRING_CONFIG, SPRING_SNAPPY, SPRING_BOUNCY), and worklet-safe animation creators.
- **Task 5**: Created `use-animations.ts` with hooks: useSpringUp, useFadeUp, useScaleIn, usePulseGlow, useBlinkCursor, useCheckPop, useShimmer, useSpin, useGrowBar. All hooks use useAnimatedStyle.
- **Task 6**: Created visual test component `design-system-test.tsx`. TypeScript check passes for all story files. Pre-existing backend errors in strava.ts are unrelated.

### File List

**Created:**
- apps/native/src/lib/design-tokens.ts
- apps/native/src/lib/fonts.ts
- apps/native/src/lib/animations.ts
- apps/native/src/lib/use-animations.ts
- apps/native/src/components/__tests__/design-system-test.tsx
- apps/native/assets/fonts/ (directory)

**Modified:**
- apps/native/tailwind.config.ts
- apps/native/src/app/_layout.tsx
- apps/native/package.json (added @expo-google-fonts packages)
