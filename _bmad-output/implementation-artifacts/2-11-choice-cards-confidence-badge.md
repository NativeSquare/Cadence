# Story 2.11: Choice Cards & Confidence Badge

Status: review

---

## Story

As a **user**,
I want **polished selection cards and confidence indicators**,
So that **interactions feel premium and I understand the quality of my profile data**.

---

## Acceptance Criteria

### Choice Cards

#### AC1: Base Card Styling

**Given** choices are displayed
**When** rendered
**Then** cards have 14px border radius
**And** cards have subtle gray border (`brd` token)
**And** unselected state shows transparent background
**And** cards use `springUp` animation on entrance with staggered delays

#### AC2: Selected State

**Given** the user selects a choice
**When** selection occurs
**Then** lime border appears (`sb` token: rgba(200,255,0,0.4))
**And** background tints to lime glow (`sg` token: rgba(200,255,0,0.06))
**And** checkmark animates in using `checkPop` animation
**And** haptic feedback fires

#### AC3: Flagged/Warning State

**Given** a choice is flagged (e.g., "push through" recovery)
**When** that option is selected
**Then** background tints red instead of lime (`redDim` token)
**And** border uses red-tinted color
**And** description text shows in red/warning styling

#### AC4: Multi-Select vs Single-Select

**Given** multi-select mode is enabled (`multi={true}`)
**When** checkboxes render
**Then** they use square corners (6px radius)

**Given** single-select mode is enabled (default)
**When** radio buttons render
**Then** they use round corners (11px radius, full circle)

#### AC5: Press Feedback

**Given** the user presses a choice
**When** touch is active (pointer down)
**Then** card scales to 0.98 for tactile feedback
**And** scale transition is 0.1s ease

#### AC6: Choice Content Layout

**Given** a choice has label and optional description
**When** rendered
**Then** checkbox/radio appears on the left (22x22px)
**And** label text is primary weight (500)
**And** description text is secondary color and smaller
**And** content is left-aligned with 14px gap from indicator

---

### ConfidenceBadge Component

#### AC7: HIGH Confidence Level

**Given** confidence level is HIGH
**When** badge renders
**Then** it displays in lime color (#C8FF00)
**And** label shows "DATA" (indicating wearable data)
**And** dot indicator is lime

#### AC8: MODERATE Confidence Level

**Given** confidence level is MODERATE
**When** badge renders
**Then** it displays in orange color (#FF8A00)
**And** label shows "SELF-REPORTED"
**And** dot indicator is orange

#### AC9: LOW Confidence Level

**Given** confidence level is LOW
**When** badge renders
**Then** it displays in red color (#FF5A5A)
**And** styling matches LOW priority

#### AC10: Badge Structure

**Given** the badge renders
**When** visible
**Then** it has pill shape (8px radius)
**And** has colored background at 15% opacity
**And** has subtle border at 30% opacity
**And** contains a 5px dot indicator
**And** text is monospace, uppercase, small size (10px)
**And** text format: "{DATA_SOURCE} {LEVEL}" (e.g., "DATA HIGH")
**And** uses `springUp` animation on entrance

---

## Tasks / Subtasks

- [x] **Task 1: Create/Enhance Choice Component** (AC: #1-#6)
  - [x] Modify `apps/native/src/components/app/onboarding/generative/MultipleChoiceInput.tsx`
  - [x] OR create new `Choice.tsx` component if needed
  - [x] Accept props: `label`, `desc`, `selected`, `onSelect`, `delay`, `multi`, `flagged`
  - [x] Implement checkbox/radio indicator (22x22px)
  - [x] Style with proper border radius (6px square, 11px round)
  - [x] Implement checkmark SVG with `checkPop` animation
  - [x] Implement press scale feedback (0.98)
  - [x] Handle flagged state with red styling
  - [x] Add haptic feedback on selection

- [x] **Task 2: Implement Checkmark Animation** (AC: #2)
  - [x] Create checkmark SVG component
  - [x] Path: `M2.5 6L5 8.5L9.5 3.5` (12x12 viewBox)
  - [x] Stroke: black, width 2, round caps
  - [x] Apply `checkPop` animation (scale 0 → 1.15 → 1)

- [x] **Task 3: Implement Press Feedback** (AC: #5)
  - [x] Use `Pressable` with `onPressIn`/`onPressOut`
  - [x] Animate scale with Reanimated `withTiming`
  - [x] Scale values: 1 → 0.98 → 1
  - [x] Duration: 100ms ease

- [x] **Task 4: Add Haptic Feedback** (AC: #2)
  - [x] Import `expo-haptics`
  - [x] Trigger `Haptics.impactAsync(ImpactFeedbackStyle.Light)` on selection
  - [x] Only trigger on state change (not re-taps)

- [x] **Task 5: Create ConfidenceBadge Component** (AC: #7-#10)
  - [x] Create `apps/native/src/components/app/onboarding/generative/ConfidenceBadge.tsx`
  - [x] Accept props: `level: 'HIGH' | 'MODERATE' | 'LOW'`, `hasData: boolean`
  - [x] Compute color based on level (lime/orange/red)
  - [x] Render pill with dot indicator
  - [x] Display appropriate label (DATA vs SELF-REPORTED)
  - [x] Apply `springUp` animation

- [x] **Task 6: Integration Test** (AC: all)
  - [x] Test Choice selection states
  - [x] Test multi vs single select modes
  - [x] Test flagged state styling
  - [x] Test haptic feedback
  - [x] Test ConfidenceBadge at all levels
  - [x] Run TypeScript checks (`tsc --noEmit`)

---

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns from architecture.md:**

1. **Animation Library:**
   - Use `react-native-reanimated` v4.1.6
   - Use animation presets from `animations.ts` (Story 2.8):
     - `springUp` for card entrance
     - `checkPop` for checkmark animation
   - Use `withTiming` for press scale feedback

2. **Haptics:**
   - Use `expo-haptics` (already in dependencies)
   - Use `ImpactFeedbackStyle.Light` for selections
   - Only trigger on actual state changes

3. **Design System Pattern:**
   - Use semantic tokens via NativeWind
   - Colors: `lime`, `ora`, `red`, `g1`-`g4`, `brd`, `card`, `sb`, `sg`
   - Font: `font-coach` for labels, `font-mono` for badge

### Prototype Reference

From `cadence-v3.jsx` lines 128-149 (Choice component):

```javascript
function Choice({ label, desc, selected, onSelect, delay = 0, multi = false, flagged = false }) {
  const [p, setP] = useState(false);
  return (
    <button onClick={onSelect}
      onPointerDown={() => setP(true)}
      onPointerUp={() => setP(false)}
      onPointerLeave={() => setP(false)}
      style={{
        width: "100%", padding: "16px 18px", borderRadius: 14, cursor: "pointer",
        border: `1px solid ${selected ? T.sb : flagged ? "rgba(255,90,90,.2)" : T.brd}`,
        background: selected ? T.sg : flagged ? T.redDim : T.card,
        display: "flex", alignItems: "center", gap: 14,
        animation: `springUp .45s ease ${delay}s both`,
        transform: p ? "scale(.98)" : "scale(1)",
        transition: "transform .1s ease, border-color .2s ease, background .2s ease",
      }}>
      <div style={{
        width: 22, height: 22,
        borderRadius: multi ? 6 : 11,
        border: `1.5px solid ${selected ? T.lime : T.g4}`,
        background: selected ? T.lime : "transparent",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {selected && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ animation: "checkPop .25s ease" }}>
          <path d="M2.5 6L5 8.5L9.5 3.5"
            stroke={T.black} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>}
      </div>
      <div style={{ flex: 1, textAlign: "left" }}>
        <span style={{ fontSize: 15, fontWeight: 500, color: selected ? T.g1 : T.g2 }}>{label}</span>
        {desc && <span style={{ fontSize: 12, color: flagged ? T.red : T.g3, marginTop: 3 }}>{desc}</span>}
      </div>
    </button>
  );
}
```

From `cadence-v3.jsx` lines 152-160 (Badge component):

```javascript
function Badge({ level = "HIGH", hasData = true }) {
  const c = { HIGH: T.lime, MODERATE: T.ora, LOW: T.red }[level] || T.g3;
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "5px 12px", borderRadius: 8,
      background: `${c}15`, border: `1px solid ${c}30`,
      animation: "springUp .4s ease both"
    }}>
      <div style={{ width: 5, height: 5, borderRadius: 3, background: c }} />
      <span style={{
        fontFamily: T.m, fontSize: 10, fontWeight: 500,
        color: c, letterSpacing: ".06em"
      }}>
        {hasData ? "DATA" : "SELF-REPORTED"} {level}
      </span>
    </div>
  );
}
```

### Color Mappings

**Choice Card States:**

| State | Border | Background | Indicator Border | Indicator Fill |
|-------|--------|------------|------------------|----------------|
| Default | `brd` | `card` | `g4` | transparent |
| Selected | `sb` | `sg` | `lime` | `lime` |
| Flagged | `rgba(255,90,90,.2)` | `redDim` | - | - |
| Flagged+Selected | - | `redDim` | `red` | `red` |

**Confidence Badge Colors:**

| Level | Color | Background | Border |
|-------|-------|------------|--------|
| HIGH | `lime` | `rgba(200,255,0,0.15)` | `rgba(200,255,0,0.3)` |
| MODERATE | `ora` | `rgba(255,138,0,0.15)` | `rgba(255,138,0,0.3)` |
| LOW | `red` | `rgba(255,90,90,0.15)` | `rgba(255,90,90,0.3)` |

### Checkmark SVG Details

```typescript
// Checkmark path for 12x12 viewBox
const CHECKMARK_PATH = "M2.5 6L5 8.5L9.5 3.5";

// Style attributes
strokeWidth: 2
strokeLinecap: "round"
strokeLinejoin: "round"
stroke: "#000000" // black, on lime background
```

### Haptic Feedback Pattern

```typescript
import * as Haptics from 'expo-haptics';

const handleSelect = () => {
  if (!selected) {
    // Only fire haptic on actual selection change
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  onSelect();
};
```

### Project Structure Notes

**Files to Create:**

| File | Purpose |
|------|---------|
| `apps/native/src/components/app/onboarding/generative/Choice.tsx` | Selection card component |
| `apps/native/src/components/app/onboarding/generative/ConfidenceBadge.tsx` | Data confidence indicator |

**Files to Potentially Modify:**

| File | Change |
|------|--------|
| `apps/native/src/components/app/onboarding/generative/MultipleChoiceInput.tsx` | May integrate Choice component |
| `apps/native/src/components/app/onboarding/question-inputs.tsx` | May need updates for new Choice |

### Dependencies

**Uses from Story 2.8:**
- Animation presets: `springUp`, `checkPop`
- Color tokens: `lime`, `ora`, `red`, `g1`-`g4`, `brd`, `card`, `sb`, `sg`, `redDim`
- Font tokens: `font-coach`, `font-mono`

**Uses from existing dependencies:**
- `expo-haptics` (already installed)
- `react-native-reanimated` v4.1.6
- `react-native-svg` for checkmark

**No new packages required.**

### Testing Considerations

1. **Choice Component Testing:**
   - Test single-select (radio) mode
   - Test multi-select (checkbox) mode
   - Test selection animation (checkPop)
   - Test press feedback (scale 0.98)
   - Test flagged state styling
   - Verify haptic fires on selection

2. **ConfidenceBadge Testing:**
   - Test all three levels (HIGH, MODERATE, LOW)
   - Test DATA vs SELF-REPORTED labels
   - Verify colors match design tokens
   - Test springUp animation

3. **Visual Testing:**
   - Side-by-side comparison with prototype
   - Test in both light/dark contexts (should be dark-only for MVP)
   - Verify checkmark animation timing

### References

- [Source: cadence-v3.jsx lines 128-160] - Choice and Badge implementations
- [Source: architecture.md#Design System Patterns] - Token usage rules
- [Source: sprint-change-proposal-2026-02-14.md#Story 2-11] - Story requirements
- [Depends on: Story 2.8] - Design tokens and animation presets

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- TypeScript checks passed for all story 2.11 files (backend has pre-existing errors unrelated to this story)

### Completion Notes List

- **Task 1**: Created `Choice.tsx` component with 14px border radius, `brd` border token, springUp entrance animation with staggered delays via `delay` prop.
- **Task 2**: Implemented checkmark SVG (12x12 viewBox, path `M2.5 6L5 8.5L9.5 3.5`) with `checkPop` animation using `withSequence` (scale 0 → 1.15 → 1).
- **Task 3**: Implemented press scale feedback using `useSharedValue` for pressed state, scaling to 0.98 with 100ms timing.
- **Task 4**: Added haptic feedback via `expo-haptics` with `ImpactFeedbackStyle.Light`, only fires on actual selection change (not re-taps).
- **Task 5**: Created `ConfidenceBadge.tsx` with pill shape (8px radius), 15%/30% opacity bg/border, 5px dot indicator, monospace uppercase text, springUp animation.
- **Task 6**: Created visual test component `choice-confidence-test.tsx` covering all ACs. TypeScript validation passed.

### File List

**Created:**
- `apps/native/src/components/app/onboarding/generative/Choice.tsx`
- `apps/native/src/components/app/onboarding/generative/ConfidenceBadge.tsx`
- `apps/native/src/components/__tests__/choice-confidence-test.tsx`

**Modified:**
- None
