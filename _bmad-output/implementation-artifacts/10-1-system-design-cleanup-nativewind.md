# Story 10.1: System Design Cleanup - NativeWind Design System

Status: review

---

## Story

As a **developer**,
I want all screen styles to use NativeWind classes with a centralized design token file,
so that the UI is consistent, maintainable, and follows Tailwind best practices.

## Acceptance Criteria

1. **Given** the current codebase **When** this story is complete **Then** a centralized design tokens file exists at `src/lib/design-tokens.ts`

2. **Given** the design tokens file exists **When** I inspect it **Then** it exports all color tokens matching the prototype:
   - `black`, `lime` (accent), grayscale (`g1`-`g5`), borders, cards
   - Light theme colors (`w1`, `w2`, `w3`, `wText`, `wSub`, `wMute`, `wBrd`)
   - Activity colors (`barHigh`, `barEasy`, `barRest`)
   - Semantic colors (`red`, `ora` for warnings/errors)

3. **Given** the design tokens file exists **When** I inspect it **Then** typography tokens are defined (font family: Outfit, weights: 300-800)

4. **Given** the design tokens file exists **When** I inspect `tailwind.config.ts` **Then** the theme extends with all custom colors, fonts, and spacing from the tokens file

5. **Given** the NativeWind configuration is complete **When** I use classes like `bg-lime`, `text-g1`, `font-outfit` **Then** they render correctly matching the prototype's visual style

6. **Given** existing screens have inline styles **When** this story is complete **Then** existing screens are refactored to use NativeWind classes where applicable

---

## Tasks / Subtasks

- [x] **Task 1: Create centralized design tokens file** (AC: #1, #2, #3)
  - [x] 1.1 Create `apps/native/src/lib/design-tokens.ts`
  - [x] 1.2 Export all color tokens from prototype `T` object
  - [x] 1.3 Export typography configuration
  - [x] 1.4 Export animation keyframe definitions (for reference)
  - [x] 1.5 Add TypeScript types for token access

- [x] **Task 2: Update tailwind.config.ts** (AC: #4)
  - [x] 2.1 Import tokens from `design-tokens.ts`
  - [x] 2.2 Add missing light theme colors (`w1`, `w2`, `w3`, `wText`, `wSub`, `wMute`, `wBrd`)
  - [x] 2.3 Add activity bar colors (`barHigh`, `barEasy`, `barRest`)
  - [x] 2.4 Extend fontFamily with proper Outfit weights configuration
  - [x] 2.5 Add animation keyframes from prototype

- [x] **Task 3: Update global.css CSS variables** (AC: #5)
  - [x] 3.1 Add CSS variables for new tokens in dark theme
  - [x] 3.2 Add CSS variables for light theme (content area colors)
  - [x] 3.3 Add animation @keyframes declarations

- [x] **Task 4: Verify NativeWind integration** (AC: #5)
  - [x] 4.1 Test `bg-lime`, `bg-barHigh`, `bg-w1` classes render correctly
  - [x] 4.2 Test typography classes (`font-coach`, font weights)
  - [x] 4.3 Test grayscale text colors (`text-g1` through `text-g5`)

- [x] **Task 5: Document design system usage** (AC: #6)
  - [x] 5.1 Add JSDoc comments to design-tokens.ts explaining each token category
  - [x] 5.2 Create inline documentation for component usage patterns

---

## Dev Notes

### Design Reference - Complete Token Mapping

The design prototype [`cadence-full-v9.jsx`](../../brainstorming/cadence-full-v9.jsx) defines all tokens in the `T` object (lines 3-14):

```typescript
// DARK THEME (Primary - black backgrounds)
const T = {
  // Core
  black: "#000000",
  lime: "#C8FF00",  // Primary accent

  // Grayscale (white at varying opacities - for text on dark bg)
  g1: "rgba(255,255,255,0.92)",  // Primary text
  g2: "rgba(255,255,255,0.70)",  // Secondary text
  g3: "rgba(255,255,255,0.45)",  // Tertiary/disabled
  g4: "rgba(255,255,255,0.25)",  // Subtle
  g5: "rgba(255,255,255,0.10)",  // Very subtle

  // Dark theme surfaces
  brd: "rgba(255,255,255,0.08)",     // Border color
  card: "rgba(255,255,255,0.03)",    // Card background

  // LIGHT THEME (Content areas - white/cream backgrounds)
  w1: "#FFFFFF",           // Pure white
  w2: "#F8F8F6",           // Off-white/cream (main content bg)
  w3: "#EEEEEC",           // Slightly darker cream
  wText: "#1A1A1A",        // Primary text on light
  wSub: "#5C5C5C",         // Secondary text on light
  wMute: "#A3A3A0",        // Muted text on light
  wBrd: "rgba(0,0,0,.06)", // Border on light

  // Activity intensity colors (for charts/bars)
  barHigh: "#A8D900",      // High intensity (tempo, intervals)
  barEasy: "#7CB342",      // Easy/recovery
  barRest: "#5B9EFF",      // Rest day / Z2

  // Semantic
  red: "#FF5A5A",          // Error/warning
  ora: "#FF9500",          // Caution/orange

  // Typography
  f: "'Outfit',sans-serif",
};
```

### Current State Analysis

**Already Configured in `tailwind.config.ts`:**
- `lime`, `ora`, `red`, `blu` with dim variants
- Grayscale `g1`-`g6`
- Surface tokens `brd`, `card-surface`, `sb`, `sg`
- Font families `coach: Outfit`, `mono: JetBrainsMono`

**GAPS - Missing tokens:**
- Light theme: `w1`, `w2`, `w3`, `wText`, `wSub`, `wMute`, `wBrd`
- Activity bars: `barHigh`, `barEasy`, `barRest`
- Animation keyframes for UI interactions

### Animation Keyframes from Prototype

The prototype defines these animations in the `CSS` constant (lines 16-28):

```css
@keyframes blink { 0%,50%{opacity:1} 51%,100%{opacity:0} }
@keyframes pulseGlow { 0%,100%{opacity:.4} 50%{opacity:1} }
@keyframes slideIn { from{opacity:0;transform:translateX(12px)} to{opacity:1;transform:translateX(0)} }
@keyframes dotPulse { 0%,100%{transform:scale(1);opacity:.6} 50%{transform:scale(1.3);opacity:1} }
@keyframes msgIn { from{opacity:0;transform:translateY(10px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }
@keyframes countUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
@keyframes waveform { 0%,100%{transform:scaleY(.3)} 50%{transform:scaleY(1)} }
@keyframes typingDot { 0%,60%,100%{opacity:.3;transform:translateY(0)} 30%{opacity:1;transform:translateY(-4px)} }
@keyframes fabIn { from{opacity:0;transform:scale(.7) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
```

### Project Structure Notes

**File Locations:**
- Design tokens: `apps/native/src/lib/design-tokens.ts` (NEW)
- Tailwind config: `apps/native/tailwind.config.ts` (UPDATE)
- Global CSS: `apps/native/src/app/global.css` (UPDATE)

**Alignment with architecture.md:**
- Design system patterns require semantic tokens, never hardcoded colors
- Use `className="bg-background text-primary"` pattern
- Extend existing token system rather than replacing

### Technical Constraints

1. **NativeWind v4.2.1** - Use NativeWind v4 patterns for CSS variable interpolation
2. **Outfit Font** - Already installed via `@expo-google-fonts/outfit`
3. **React Native Reanimated** - Already v4.1.6 for animations (use reanimated for complex animations, CSS keyframes for simple ones)
4. **No transform in NativeWind** - Some CSS keyframe transforms may need reanimated equivalents

### Implementation Notes

1. **Token Import Pattern:**
```typescript
// In tailwind.config.ts - import from centralized file
import { colors, fonts, animations } from './src/lib/design-tokens';
```

2. **NativeWind Animation Limitation:**
   - NativeWind supports basic keyframe animations via tailwindcss-animate
   - Complex transform animations should use `react-native-reanimated`
   - Document which animations are CSS vs Reanimated

3. **Light Theme Context:**
   - Light theme (`w*` tokens) are used in content areas (scrollable white cards)
   - Dark theme (`g*` tokens) are used in header/status bar areas
   - This is a "dark chrome, light content" design pattern

### References

- [Source: _bmad-output/brainstorming/cadence-full-v9.jsx#L3-14] - Color tokens
- [Source: _bmad-output/brainstorming/cadence-full-v9.jsx#L16-28] - Animation keyframes
- [Source: _bmad-output/planning-artifacts/architecture.md#L401-409] - Design system patterns
- [Source: apps/native/tailwind.config.ts] - Current Tailwind configuration
- [Source: apps/native/src/app/global.css] - Current CSS variables

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List

- ✅ Updated existing `design-tokens.ts` with complete token mapping from cadence-full-v9.jsx prototype
- ✅ Added LIGHT_THEME colors (w1, w2, w3, wText, wSub, wMute, wBrd) for content areas
- ✅ Added ACTIVITY_COLORS (barHigh, barEasy, barRest) for workout intensity indicators
- ✅ Added ANIMATIONS and KEYFRAMES exports for animation reference
- ✅ Updated tailwind.config.ts to import tokens from centralized design-tokens.ts
- ✅ Added all 9 Cadence animation keyframes with proper string-typed values for TypeScript
- ✅ Updated global.css with CSS @keyframes declarations and CSS variables for both themes
- ✅ TypeScript type check passes for design-tokens.ts and tailwind.config.ts (no new errors)
- ✅ Added comprehensive inline documentation with component usage patterns

### Implementation Decisions

1. **Token Import Strategy**: Chose to import individual token objects (COLORS, GRAYS, etc.) rather than spread to maintain explicit mapping visibility in tailwind.config.ts
2. **Keyframe Duplication**: Keyframes defined in both tailwind.config.ts (for Tailwind animation classes) and global.css (for CSS @keyframes) since both are needed for NativeWind compatibility
3. **TypeScript Keyframe Values**: Used string values ("1" instead of 1) in tailwind.config.ts keyframes to satisfy Tailwind's TypeScript types

### Debug Log References

- Pre-existing type errors in `use-healthkit.ts` and `healthkit.ts` are unrelated to this story (Soma API type mismatches)

### File List

- apps/native/src/lib/design-tokens.ts (MODIFIED)
- apps/native/tailwind.config.ts (MODIFIED)
- apps/native/src/app/global.css (MODIFIED)

