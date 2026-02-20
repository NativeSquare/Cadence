# Story 10.9: Celebration Overlay

Status: ready-for-dev

---

## Story

As a runner,
I want to see a satisfying celebration animation when I complete a workout,
So that I feel accomplished and motivated to continue training.

---

## Acceptance Criteria

### AC-1: Overlay Appearance

**Given** the user taps "Done" on the Debrief screen
**When** the Celebration Overlay appears
**Then** they see a full-screen dark overlay with centered animation:
- Phase 0 (0-600ms): Check circle animates in
- Phase 1 (600-2200ms): Text appears
- Phase 2 (2200-2800ms): Fade out
- Auto-dismiss after 2800ms total

### AC-2: Check Circle Animation

**Given** the celebration animation plays
**When** the check circle appears (animation: scale 0→1.2→0.95→1 with rotation bounce)
**Then** they see:
- Large lime circle (88px diameter)
- White checkmark icon inside
- Box shadow glow: `0 0 60px lime44, 0 0 120px lime22`
- Animation duration: 700ms with overshoot spring curve

### AC-3: Ring Burst Animation

**Given** the celebration animation plays
**When** the outer ring bursts
**Then** they see:
- SVG circle (140px, stroke lime, strokeWidth 2)
- Primary ring: Expands from scale 0.3 to 1, stroke-dashoffset animates from 220 to 0
- Secondary ring: Expands from scale 0.5 to 1.8 and fades out
- Staggered timing: secondary ring starts 200ms after primary

### AC-4: Text Animation

**Given** the celebration text appears
**When** it animates in (after 600ms delay)
**Then** they see:
- Session type name (22px, fontWeight 800, letterSpacing -0.03em)
- "Logged ✓" label (14px, fontWeight 500, color lime, letterSpacing 0.04em)
- Text fades in with translateY from 16px to 0

### AC-5: Fade Out and Dismissal

**Given** the celebration completes
**When** it fades out (at 2200ms)
**Then** the overlay fades to opacity 0 over 600ms
**And** the user is returned to the Plan screen
**And** the completed session is marked as done

# CRITICAL NOTE: THE DESIGN AND A WEB VERSION PROTOTYPE OF ALL CODE THE UI IS AVAILABLE HERE: `_bmad-output/brainstorming/cadence-full-v10.jsx` lines 599-633. USE THIS AS YOUR ONLY REFERENCE IN TERMS OF DESIGN. THE FINAL NATIVE DESIGN MUST PERFECTLY MATCH THE ONE OF THE PROTOTYPE. PAY SPECIAL ATTENTION TO THE ANIMATION AND FONTS AND FONT PROPERTIES USED IN THAT PROTOTYPE. THE IMPLEMENTED VERSION MUST EXACTLY MATCH.

---

## Tasks / Subtasks

### Phase 1: Component Foundation

- [ ] **Task 1.1** Create `CelebrationOverlay.tsx` component (AC: 1)
  - [ ] Full-screen absolute positioned overlay with black background
  - [ ] Phase state management (0, 1, 2) using `useState`
  - [ ] Timer sequence with `useEffect` and `setTimeout`:
    - t1: 600ms → phase 1
    - t2: 2200ms → phase 2
    - t3: 2800ms → call `onComplete`
  - [ ] Cleanup timers on unmount
  - [ ] Accept `session` and `onComplete` props

### Phase 2: Check Circle with Glow

- [ ] **Task 2.1** Implement animated check circle (AC: 2)
  - [ ] Container: 88px × 88px, borderRadius 44px, bg lime
  - [ ] Checkmark SVG (40×40, viewBox 0 0 24 24)
  - [ ] Path: `M4 12.5l5.5 5.5L20 6`, stroke black, strokeWidth 3.5
  - [ ] Box shadow with lime glow (use `elevation` + custom shadow)
  - [ ] Reanimated spring animation: scale 0→1.2→0.95→1, rotation -20°→5°→-2°→0°
  - [ ] Spring config: overshoot curve `cubic-bezier(.34,1.56,.64,1)`

### Phase 3: Ring Burst SVG Animation

- [ ] **Task 3.1** Implement primary ring animation (AC: 3)
  - [ ] SVG container: 140×140, positioned absolutely behind check circle
  - [ ] Circle: cx=70, cy=70, r=60, fill none, stroke lime, strokeWidth 2
  - [ ] strokeDasharray: 220
  - [ ] Animated strokeDashoffset: 220 → 0 over 1000ms
  - [ ] Animated scale: 0.3 → 1 with overshoot spring
  - [ ] transformOrigin: center

- [ ] **Task 3.2** Implement secondary ring animation (AC: 3)
  - [ ] Absolute positioned div, 140×140, borderRadius 50%
  - [ ] Border: 1px solid lime at 33% opacity
  - [ ] Animated scale: 0.5 → 1.8 over 1200ms
  - [ ] Animated opacity: 0 → 0.6 → 0
  - [ ] Delay: 200ms after primary ring

### Phase 4: Text Animation

- [ ] **Task 4.1** Implement text reveal (AC: 4)
  - [ ] Container with marginTop 28px, textAlign center
  - [ ] Session type: Outfit-ExtraBold, 22px, color g1, letterSpacing -0.03em
  - [ ] "Logged ✓": Outfit-Medium, 14px, color lime, letterSpacing 0.04em, marginTop 6px
  - [ ] Animation: translateY 16→0, opacity 0→1 over 1000ms
  - [ ] Animation delay: matches phase 1 (starts at ~600ms)

### Phase 5: Fade Out Transition

- [ ] **Task 5.1** Implement overlay fade out (AC: 5)
  - [ ] Track phase 2 state
  - [ ] Animate entire overlay opacity 1→0 over 600ms
  - [ ] Use Reanimated FadeOut or withTiming
  - [ ] Call `onComplete` callback after fade completes

### Phase 6: Integration

- [ ] **Task 6.1** Export from session components
  - [ ] Add to `apps/native/src/components/app/session/index.ts`
  - [ ] Ensure TypeScript compiles without errors

- [ ] **Task 6.2** Document integration with DebriefScreen (Story 10.8)
  - [ ] Note: This component is triggered by `onDone` callback from DebriefScreen
  - [ ] DebriefScreen sets `celebrating: true` state when user taps "Done"
  - [ ] After celebration `onComplete`, navigate back to Plan screen

---

## Dev Notes

### Critical Context from Prototype

The Celebration Overlay is fully implemented in the prototype at `_bmad-output/brainstorming/cadence-full-v10.jsx` lines 599-633.

| Prototype Element         | Lines   | Implementation Notes                                |
| ------------------------- | ------- | --------------------------------------------------- |
| `CelebrationOverlay()`    | 599-633 | Main component with phase-based animation           |
| CSS animations            | 40-44   | `celebCheck`, `celebRing`, `celebRing2`, `celebText`, `celebFadeOut` |
| Theme constants `T`       | 3-14    | Colors: lime=#C8FF00, g1=92% white, black=#000000   |

### Animation Keyframes (from prototype CSS)

```css
/* Check circle entrance - scale with rotation overshoot */
@keyframes celebCheck {
  0%   { transform: scale(0) rotate(-20deg); opacity: 0 }
  50%  { transform: scale(1.2) rotate(5deg); opacity: 1 }
  70%  { transform: scale(0.95) rotate(-2deg) }
  100% { transform: scale(1) rotate(0) }
}

/* Primary ring burst - stroke reveal with scale */
@keyframes celebRing {
  0%   { transform: scale(0.3); opacity: 0; stroke-dashoffset: 220 }
  40%  { opacity: 1 }
  100% { transform: scale(1); opacity: 0; stroke-dashoffset: 0 }
}

/* Secondary ring - expanding fade */
@keyframes celebRing2 {
  0%   { transform: scale(0.5); opacity: 0 }
  30%  { opacity: 0.6 }
  100% { transform: scale(1.8); opacity: 0 }
}

/* Text reveal - fade up */
@keyframes celebText {
  0%   { opacity: 0; transform: translateY(16px) }
  50%  { opacity: 0 }
  100% { opacity: 1; transform: translateY(0) }
}

/* Overlay fade out */
@keyframes celebFadeOut {
  0%   { opacity: 1 }
  100% { opacity: 0 }
}
```

### Reanimated Implementation Pattern

Convert CSS keyframes to Reanimated:

```typescript
// Check circle animation
const scale = useSharedValue(0);
const rotation = useSharedValue(-20);

useEffect(() => {
  scale.value = withSequence(
    withSpring(1.2, { damping: 8, stiffness: 180 }),
    withSpring(0.95, { damping: 15, stiffness: 200 }),
    withSpring(1, { damping: 12, stiffness: 180 })
  );
  rotation.value = withSequence(
    withSpring(5, { damping: 8, stiffness: 180 }),
    withSpring(-2, { damping: 15, stiffness: 200 }),
    withSpring(0, { damping: 12, stiffness: 180 })
  );
}, []);

const checkStyle = useAnimatedStyle(() => ({
  transform: [
    { scale: scale.value },
    { rotate: `${rotation.value}deg` }
  ],
}));
```

### Existing Patterns to Follow

1. **RadarChart.tsx** at `apps/native/src/components/app/onboarding/viz/RadarChart.tsx`
   - SVG + Reanimated animation patterns
   - `useAnimatedProps` for SVG strokeDashoffset animations

2. **AnalyticsScreen.tsx** animation patterns
   - Phase-based state management
   - Staggered entrance animations

### Design Tokens to Use

From `apps/native/src/lib/design-tokens.ts`:

```typescript
// COLORS
lime: "#C8FF00"         // Primary accent, check circle bg, text accent
black: "#000000"        // Overlay background, checkmark stroke

// GRAYS
g1: "rgba(255,255,255,0.92)"  // Session type text

// Typography
font-coach-extrabold   // Session type (22px)
font-coach-medium      // "Logged ✓" (14px)
```

### Typography Requirements (CRITICAL - must match exactly)

| Element        | Size | Weight | Color | LetterSpacing |
| -------------- | ---- | ------ | ----- | ------------- |
| Session type   | 22px | 800    | g1    | -0.03em       |
| "Logged ✓"     | 14px | 500    | lime  | 0.04em        |

### Project Structure Notes

Place new component at:

```
apps/native/src/components/app/session/
├── CelebrationOverlay.tsx   # This story
├── index.ts                 # Export barrel
```

Note: The `session/` directory may need to be created if it doesn't exist yet. This component is part of the session flow along with:
- Story 10.6: SessionDetailScreen
- Story 10.7: ActiveSessionScreen
- Story 10.8: DebriefScreen

### Dependency on Story 10.8

**IMPORTANT:** This component is triggered from the DebriefScreen (Story 10.8). The integration pattern is:

```typescript
// In DebriefScreen.tsx (Story 10.8)
const [celebrating, setCelebrating] = useState(false);

const handleDone = () => {
  setCelebrating(true);
};

const handleCelebrationComplete = () => {
  // Navigate back to Plan screen
  router.replace('/(app)/(tabs)/plan');
};

return (
  <>
    {/* Debrief content */}
    {celebrating && (
      <CelebrationOverlay
        session={session}
        onComplete={handleCelebrationComplete}
      />
    )}
  </>
);
```

---

## Technical Requirements

### Dependencies (Already Installed)

- `react-native-svg` - SVG rendering for ring animation
- `react-native-reanimated` v4.1.6 - Animations
- NativeWind - Styling

### New Dependencies

None required - all dependencies are already installed.

### Performance Considerations

- Use `runOnJS` for callback functions called from Reanimated worklets
- Memoize SVG paths to prevent recalculation
- Clean up all timers on component unmount to prevent memory leaks

---

## Architecture Compliance

### Naming Conventions

- Components: PascalCase (e.g., `CelebrationOverlay.tsx`)
- Props interfaces: `{Component}Props` (e.g., `CelebrationOverlayProps`)

### State Management

- UI state: `useState` for phase tracking
- Animations: Reanimated shared values

### Error Handling

- Ensure `onComplete` is called even if animation fails
- Clean up timers on unmount

---

## Library/Framework Requirements

### SVG Ring Animation

Use `react-native-svg` with Reanimated:

```typescript
import Svg, { Circle } from "react-native-svg";
import Animated, { useAnimatedProps } from "react-native-reanimated";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const strokeOffset = useSharedValue(220);
useEffect(() => {
  strokeOffset.value = withTiming(0, {
    duration: 1000,
    easing: Easing.out(Easing.cubic),
  });
}, []);

const circleAnimatedProps = useAnimatedProps(() => ({
  strokeDashoffset: strokeOffset.value,
}));

<AnimatedCircle
  animatedProps={circleAnimatedProps}
  strokeDasharray={220}
  cx={70} cy={70} r={60}
  stroke={COLORS.lime}
  strokeWidth={2}
  fill="none"
/>
```

### Animations

Use Reanimated patterns:

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  Easing,
  FadeOut,
  runOnJS,
} from "react-native-reanimated";
```

---

## File Structure Requirements

| File                                                              | Purpose                  |
| ----------------------------------------------------------------- | ------------------------ |
| `apps/native/src/components/app/session/CelebrationOverlay.tsx`   | Celebration animation    |
| `apps/native/src/components/app/session/index.ts`                 | Export barrel            |

---

## Testing Requirements

### Unit Tests

- Component renders without crashing
- Phase transitions occur at correct timing (600ms, 2200ms, 2800ms)
- `onComplete` callback is called after animation completes
- Timers are cleaned up on unmount

### Integration Tests

- Overlay appears when triggered from DebriefScreen
- Navigation to Plan screen occurs after celebration
- Session is marked as complete

### Visual Verification

- Compare rendered animation against prototype at `cadence-full-v10.jsx` lines 599-633
- Verify colors match: lime=#C8FF00, g1=rgba(255,255,255,0.92), black=#000000
- Verify timing: 0-600ms check, 600-2200ms text, 2200-2800ms fade out

---

## References

- [Design Prototype - CelebrationOverlay](../brainstorming/cadence-full-v10.jsx#L599-L633) - Complete visual reference
- [Animation Keyframes](../brainstorming/cadence-full-v10.jsx#L40-L44) - CSS animation definitions
- [Epic 10 Definition](./10-0-frontend-screens-epic.md#story-109-celebration-overlay) - Story requirements
- [Design Tokens](../../apps/native/src/lib/design-tokens.ts) - Colors, fonts
- [RadarChart Example](../../apps/native/src/components/app/onboarding/viz/RadarChart.tsx) - SVG + Reanimated patterns

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

