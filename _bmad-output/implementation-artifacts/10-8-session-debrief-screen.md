# Story 10.8: Session Debrief Screen (Post-Workout)

Status: review

---

## Story

As a runner,
I want to log how my workout felt and receive coach feedback,
so that the AI coach understands my training response and can adjust future sessions.

---

# CRITICAL NOTE : THE DESIGN AND A WEB VERSION PROTOTYPE OF ALL CODE THE UI IS AVAILABLE HERE : - [cadence-full-v10.jsx](../_brainstorming/cadence-full-v10.jsx) . USE THIS AS YOUR ONLY REFERENCE IN TERMS OF DESIGN. THE FINAL NATIVE DESIGN MUST PERFECTLY MATCH THE ONE OF THE PROTOTYPE. PAY SPECIAL ATTENTION TO THE ANIMATION AND FONTs AND FONT PROPERTIES USED IN THAT PROTOTYPE. THE IMPLEMENTED VERSION MUST EXACTLY MATCH

## Acceptance Criteria

### AC1: Dark Hero Header

**Given** the user ends a session from Active Session screen
**When** the Debrief screen appears (animation: `debriefIn .5s ease`)
**Then** they see the dark hero header with:

- Completion badge (28px lime circle with checkmark icon)
- "Session Complete" text (15px, fontWeight 600, color lime)
- Session type title (30px, fontWeight 800, letterSpacing -0.04em)
- Subtitle with date, zone, and target km (14px, color g3)

### AC2: Stats Row Animation

**Given** the hero header is displayed
**When** the stats row animates in (`springUp .4s ease` with staggered delay per item \* 0.06s)
**Then** they see 3 stat cards:

- Time: formatted as M:SS
- Distance: actual km covered with 2 decimals
- Avg Pace: calculated M:SS/km (or "--" if distance < 0.05km)
- Card style: `padding: 12px 10px`, `borderRadius: 14px`, `background: rgba(255,255,255,0.04)`, `border: 1px solid brd`

### AC3: Feeling Selector

**Given** the debrief flow begins (phase 1, delay 500ms)
**When** the feeling question appears (`springUp .5s ease`)
**Then** they see:

- Question: "How did that feel?" (20px, fontWeight 700)
- 5 vertically stacked option buttons with staggered animation (0.04s delay per item)
- Each option shows: emoji (22px), label + description
- Selection state: `border: lime 66% opacity`, `background: rgba(200,255,0,0.06)`, checkmark circle

### AC4: Quick Tag Pills

**Given** the user selects a feeling
**When** the selection is made (phase 2, delay 400ms)
**Then** the "Anything else to note?" section appears with:

- Quick tag pills in a flex-wrap layout
- Unselected: dashed border, `border: wBrd`, `background: w1`
- Selected: solid border, `border: lime 66% opacity`, `background: rgba(200,255,0,0.06)`

### AC5: Voice Recorder Mode

**Given** the note section is visible
**When** the voice recorder button is tapped
**Then** the recording mode UI appears:

- "Listening..." text (12px, fontWeight 600)
- Animated waveform bars (24 bars, random heights, animation: `waveform 0.4-0.8s ease infinite alternate`)
- Timer display (M:SS format)
- Cancel and Done buttons

### AC6: Text Input Mode

**Given** the note section is visible
**When** the text input is focused
**Then** they see:

- Textarea with placeholder "Or type something..." (15px, lineHeight 1.55)
- Mic button (bottom left, 36x36, borderRadius 12px, background w3)
- Character count (bottom right, 10px, color wMute)
- Send arrow button appears when text entered (animation: `scaleIn .2s ease`)

### AC7: Coach Response Streaming

**Given** the user taps "Save & Wrap Up" or "Skip -- just save"
**When** the coach response phase begins
**Then** they see:

- Large coach response card (background wText, borderRadius 22px)
- Coach avatar (28px lime circle with "C")
- Streaming text with blinking cursor (speed: 22ms per character, delay: 300ms)
- Response varies by feeling selected

### AC8: Session Logged Summary

**Given** the coach response finishes streaming
**When** the coachReply state becomes true (delay 300ms after stream done)
**Then** they see:

- "Logged" summary card with checkmark icon
- Shows: feeling emoji + label, selected pills, "Note added" indicator if applicable
- "Done" button (full width, background wText, 18px fontWeight 700)

### AC9: Celebration Trigger

**Given** the user taps "Done"
**When** the celebration triggers
**Then** the Celebration Overlay appears (Story 10.9)
**And** after celebration completes, user returns to Plan screen

---

## Tasks / Subtasks

- [x] **Task 1: Create DebriefScreen.tsx container** (AC: 1, 2)
  - [x] 1.1: Set up phase state management (`ph`, `feeling`, `noteText`, `selectedPills`, `submitted`, `coachReply`, `recording`, `recTime`, `celebrating`)
  - [x] 1.2: Implement scrollRef for auto-scroll behavior
  - [x] 1.3: Create dark hero header with completion badge
  - [x] 1.4: Implement stats row with springUp animation using Reanimated
  - [x] 1.5: Add light content area with rounded top corners (borderRadius 28px)

- [x] **Task 2: Create FeelingSelector.tsx component** (AC: 3)
  - [x] 2.1: Define FEELING_OPTIONS constant with exact values from prototype
  - [x] 2.2: Implement vertical stacked buttons with emoji, label, description
  - [x] 2.3: Add selection state styling (lime border, glow background, checkmark)
  - [x] 2.4: Implement staggered springUp animation using Reanimated entering

- [x] **Task 3: Create QuickTagPills.tsx component** (AC: 4)
  - [x] 3.1: Define DEBRIEF_PILLS constant with exact values
  - [x] 3.2: Implement flex-wrap pill layout
  - [x] 3.3: Add toggle logic for multi-select
  - [x] 3.4: Style dashed vs solid border states

- [x] **Task 4: Create VoiceRecorderMode.tsx component** (AC: 5)
  - [x] 4.1: Implement recording state with timer
  - [x] 4.2: Create animated waveform bars (24 bars)
  - [x] 4.3: Add Cancel and Done buttons
  - [x] 4.4: Implement mock transcription on Done (for MVP)

- [x] **Task 5: Create DebriefNoteInput.tsx component** (AC: 6)
  - [x] 5.1: Implement textarea with placeholder styling
  - [x] 5.2: Add mic button (bottom left)
  - [x] 5.3: Add character count (bottom right)
  - [x] 5.4: Implement send arrow button with scaleIn animation

- [x] **Task 6: Create CoachResponseCard.tsx component** (AC: 7)
  - [x] 6.1: Create card with gradient background effect
  - [x] 6.2: Add coach avatar (lime circle with "C")
  - [x] 6.3: Implement useStreamingText hook for character streaming
  - [x] 6.4: Add blinking cursor during streaming

- [x] **Task 7: Create DebriefSummary.tsx component** (AC: 8)
  - [x] 7.1: Create "Logged" card with checkmark
  - [x] 7.2: Display feeling emoji + label pill
  - [x] 7.3: Display selected pills
  - [x] 7.4: Show "Note added" indicator if noteText present

- [x] **Task 8: Create DebriefHeader.tsx component** (AC: 1, 2)
  - [x] 8.1: Extract header + stats row into reusable component
  - [x] 8.2: Accept session data and elapsed time as props

- [x] **Task 9: Add navigation and integration** (AC: 9)
  - [x] 9.1: Create navigation route for Debrief screen
  - [x] 9.2: Accept session, elapsedTime, distanceCovered as route params
  - [x] 9.3: Implement onDone callback to trigger celebration
  - [x] 9.4: Create barrel export in `components/app/session/index.ts`

---

## Dev Notes

### Design Reference

- **Prototype File:** `_bmad-output/brainstorming/cadence-full-v10.jsx`
- **Component:** `DebriefScreen` (lines 647-848)
- **Constants:** `FEELING_OPTIONS` (lines 638-644), `DEBRIEF_PILLS` (line 645)
- **Hook:** `useStream` (lines 59-64)

### Typography Requirements (CRITICAL)

All text must match prototype exactly:

| Element               | Size | Weight | Color                                | Other                                 |
| --------------------- | ---- | ------ | ------------------------------------ | ------------------------------------- |
| Session type title    | 30px | 800    | g1                                   | letterSpacing -0.04em, lineHeight 1.1 |
| "How did that feel?"  | 20px | 700    | wText                                |                                       |
| Feeling option label  | 15px | 600    | wText (selected) / wSub (unselected) |                                       |
| Feeling option desc   | 12px | 400    | wMute                                |                                       |
| "Anything else" label | 16px | 600    | wText                                |                                       |
| Pill buttons          | 13px | 400    | wText (selected) / wSub (unselected) |                                       |
| Coach response        | 17px | 400    | g1                                   | lineHeight 1.6, letterSpacing -0.01em |
| Stat values           | 18px | 700    | g1                                   |                                       |
| Stat labels           | 10px | 500    | g4                                   | uppercase, letterSpacing 0.04em       |

### Feeling Options (exact values)

```typescript
export const FEELING_OPTIONS = [
  {
    emoji: "🔥",
    label: "Amazing",
    value: "amazing",
    desc: "Felt strong the whole way",
  },
  {
    emoji: "👍",
    label: "Good",
    value: "good",
    desc: "Solid effort, nothing special",
  },
  {
    emoji: "😐",
    label: "Okay",
    value: "okay",
    desc: "Got it done, that's what counts",
  },
  { emoji: "😮‍💨", label: "Tough", value: "tough", desc: "Harder than expected" },
  {
    emoji: "🥵",
    label: "Brutal",
    value: "brutal",
    desc: "Really struggled today",
  },
] as const;
```

### Quick Tag Pills (exact values)

```typescript
export const DEBRIEF_PILLS = [
  "Legs felt heavy",
  "Breathing was easy",
  "Side stitch",
  "Felt fast",
  "Needed more rest",
  "Perfect weather",
  "Too hot",
  "Had to walk",
] as const;
```

### Coach Response Logic

```typescript
const getCoachResponse = (feeling: string) => {
  if (feeling === "amazing" || feeling === "good") {
    return "That's what I like to see. You showed up, you executed, and you earned every meter. Keep stacking days like this and the race will take care of itself.";
  }
  if (feeling === "tough" || feeling === "brutal") {
    return "Hey — the hard days are where the real work happens. The fact that you got out there and finished says more than any split time. I'm going to dial things back a touch for the next couple of sessions. Trust the process.";
  }
  return "You showed up. That's the hardest part and you did it. Not every run needs to feel great — some just need to get done. I'll take it from here.";
};
```

### Project Structure Notes

**File Locations:**

```
apps/native/src/components/app/debrief/
├── DebriefScreen.tsx          # Main container
├── DebriefHeader.tsx          # Dark header + stats
├── FeelingSelector.tsx        # Feeling options
├── QuickTagPills.tsx          # Tag pills
├── VoiceRecorderMode.tsx      # Recording mode UI
├── DebriefNoteInput.tsx       # Text input with mic
├── CoachResponseCard.tsx      # Streaming coach response
├── DebriefSummary.tsx         # Logged summary card
└── index.ts                   # Barrel exports
```

**Route Location:** `apps/native/src/app/(app)/(tabs)/debrief.tsx` or as modal stack

### Animation Implementation

**Use React Native Reanimated for:**

- `springUp` - Entering animation for phase transitions
- `debriefIn` - Screen entrance (fade + scale)
- `checkPop` - Checkmark appearance
- `scaleIn` - Send button appearance
- `waveform` - Voice recorder bars

**Animation References from prototype:**

```css
@keyframes debriefIn {
  from {
    opacity: 0;
    transform: scale(0.97);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes springUp {
  0% {
    opacity: 0;
    transform: translateY(24px) scale(0.98);
  }
  70% {
    transform: translateY(-3px) scale(1.005);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
@keyframes checkPop {
  0% {
    transform: scale(0);
  }
  60% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
@keyframes waveform {
  0%,
  100% {
    transform: scaleY(0.3);
  }
  50% {
    transform: scaleY(1);
  }
}
```

**Reanimated Implementation Pattern:**

```typescript
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  withTiming,
} from "react-native-reanimated";

// For springUp entering animation
const entering = FadeInDown.springify()
  .damping(15)
  .mass(1)
  .delay(index * 40);
```

### Existing Code to Reuse

**Streaming Text Hook:** `apps/native/src/hooks/use-streaming-text.ts`

- Existing hook provides phrase-based streaming with haptic support
- Create a simplified variant for single-string streaming if needed

**Design Tokens:** `apps/native/src/lib/design-tokens.ts`

- `COLORS.lime`, `COLORS.limeGlow` - Accent colors
- `LIGHT_THEME.w1`, `w2`, `w3`, `wText`, `wSub`, `wMute`, `wBrd` - Light theme
- `GRAYS.g1`, `g3`, `g4` - Dark theme text
- `SURFACES.brd` - Border color

**NativeWind Classes:**

```tsx
// Dark hero area
className="bg-black px-6 pb-7"

// Light content with rounded top
className="bg-w2 -mt-1"
style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}

// Stats card
className="flex-1 p-3 rounded-[14px] items-center"
style={{ backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}

// Feeling button (unselected)
className="w-full p-4 rounded-[14px] flex-row items-center gap-3.5 bg-w1 border border-wBrd"

// Feeling button (selected)
className="w-full p-4 rounded-[14px] flex-row items-center gap-3.5"
style={{ backgroundColor: "rgba(200,255,0,0.06)", borderWidth: 1, borderColor: "rgba(200,255,0,0.4)" }}

// Pill (unselected)
className="px-3.5 py-2 rounded-[20px] bg-w1"
style={{ borderWidth: 1, borderStyle: "dashed", borderColor: LIGHT_THEME.wBrd }}

// Pill (selected)
className="px-3.5 py-2 rounded-[20px]"
style={{ backgroundColor: "rgba(200,255,0,0.06)", borderWidth: 1, borderColor: "rgba(200,255,0,0.4)" }}
```

### Session Data Shape

```typescript
interface Session {
  type: string; // e.g., "Tempo", "Easy Run"
  km: string; // e.g., "8.5"
  dur: string; // e.g., "48min"
  zone: string; // e.g., "Z4"
  intensity: "high" | "low" | "key";
  desc: string;
}

interface DebriefScreenProps {
  session: Session;
  elapsedTime: number; // Elapsed seconds from Active Session
  distanceCovered: number; // Actual km covered (e.g., 8.42)
  onDone: () => void; // Navigate back to Plan screen via Celebration
}
```

### State Management

```typescript
// Phase states
const [ph, setPh] = useState(0); // 0: initial, 1: feeling visible, 2: notes visible
const [feeling, setFeeling] = useState<string | null>(null);
const [noteText, setNoteText] = useState("");
const [selectedPills, setSelectedPills] = useState<string[]>([]);
const [submitted, setSubmitted] = useState(false);
const [coachReply, setCoachReply] = useState(false);
const [recording, setRecording] = useState(false);
const [recTime, setRecTime] = useState(0);
const [celebrating, setCelebrating] = useState(false);

// Phase transitions
useEffect(() => {
  setTimeout(() => setPh(1), 500);
}, []);

useEffect(() => {
  if (feeling) setTimeout(() => setPh(2), 400);
}, [feeling]);
```

### Testing Checklist

- [ ] Stats calculate correctly from elapsed time and distance
- [ ] Feeling selection updates state and triggers phase 2
- [ ] Pills toggle correctly (multi-select)
- [ ] Voice recorder timer counts up correctly
- [ ] Coach response streams at correct speed (22ms/char)
- [ ] Coach response varies based on feeling selected
- [ ] "Done" button triggers celebration overlay
- [ ] Screen animates in correctly (debriefIn)
- [ ] Auto-scroll works when new content appears

---

### References

- [Epic: 10-0-frontend-screens-epic.md](./../implementation-artifacts/10-0-frontend-screens-epic.md)
- [Design Prototype: cadence-full-v10.jsx](./../../brainstorming/cadence-full-v10.jsx) lines 638-848
- [Design Tokens: design-tokens.ts](./../../apps/native/src/lib/design-tokens.ts)
- [Streaming Hook: use-streaming-text.ts](./../../apps/native/src/hooks/use-streaming-text.ts)
- [Architecture: architecture.md](./planning-artifacts/architecture.md) - NativeWind + Reanimated patterns
- [Analytics Screen Pattern: AnalyticsScreen.tsx](./../../apps/native/src/components/app/analytics/AnalyticsScreen.tsx) - Dark header + light content pattern

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Story 10.8 is a duplicate of Story 10.7 with more detailed AC specifications
- All components were already implemented by Story 10.7 (status: review)
- Implementation verified to match all AC requirements including exact pixel values

### Completion Notes List

- **DUPLICATE STORY RESOLVED:** Story 10.8 duplicates Story 10.7 ("Debrief Screen Post-Workout")
- All 9 ACs satisfied by existing implementation in `apps/native/src/components/app/session/`
- File location deviation: Story specified `debrief/` folder but implementation uses `session/` folder (semantically correct - debrief occurs after a session)
- Barrel exports already configured in `session/index.ts`
- All components match prototype design exactly:
  - DebriefScreen.tsx: Phase-based flow (0→1→2→submitted→coachReply→celebrating)
  - DebriefHeader.tsx: 28px lime badge, 30px/800 title, stats with 60ms stagger
  - FeelingSelector.tsx: 5 options, 40ms stagger, checkPop animation
  - QuickTagPills.tsx: 8 pills, dashed→solid toggle, multi-select
  - VoiceRecorderMode.tsx: 24 bars, waveform animation, timer
  - DebriefNoteInput.tsx: 36x36 mic, 10px char count, scaleIn send button
  - CoachResponseCard.tsx: 28px avatar, 22ms/300ms streaming via use-stream hook
  - DebriefSummary.tsx: Logged card, Done button with springUp
  - CelebrationOverlay.tsx: celebCheck, celebRing animations (Story 10.9 component)

### File List

**Existing Files (from Story 10.7):**
- apps/native/src/components/app/session/DebriefScreen.tsx
- apps/native/src/components/app/session/DebriefHeader.tsx
- apps/native/src/components/app/session/FeelingSelector.tsx
- apps/native/src/components/app/session/QuickTagPills.tsx
- apps/native/src/components/app/session/DebriefNoteInput.tsx
- apps/native/src/components/app/session/VoiceRecorderMode.tsx
- apps/native/src/components/app/session/CoachResponseCard.tsx
- apps/native/src/components/app/session/DebriefSummary.tsx
- apps/native/src/components/app/session/CelebrationOverlay.tsx
- apps/native/src/components/app/session/index.ts
- apps/native/src/hooks/use-stream.ts
