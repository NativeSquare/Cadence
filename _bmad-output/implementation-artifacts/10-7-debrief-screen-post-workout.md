# Story 10.7: Debrief Screen (Post-Workout)

Status: review

## Story

As a runner,
I want to log how my workout felt and receive coach feedback,
so that the AI coach understands my training response and can adjust future sessions.

## Acceptance Criteria

1. **Given** the user ends a session from Active Session screen
   **When** the Debrief screen appears (animation: `debriefIn .5s ease`)
   **Then** they see the dark hero header with completion badge, session title, and stats row

2. **Given** the debrief flow begins (phase 1, delay 500ms)
   **When** the feeling question appears
   **Then** they see "How did that feel?" with 5 vertically stacked feeling options

3. **Given** the user selects a feeling
   **When** the selection is made (phase 2, delay 400ms)
   **Then** the "Anything else to note?" section appears with quick tag pills

4. **Given** the note section is visible
   **When** the voice recorder button is tapped
   **Then** the recording mode UI appears with animated waveform

5. **Given** the user taps "Save & Wrap Up"
   **When** the coach response phase begins
   **Then** they see streaming coach text with blinking cursor (22ms per character)

6. **Given** the coach response finishes streaming
   **When** the coachReply state becomes true
   **Then** they see "Logged" summary card and "Done" button

7. **Given** the user taps "Done"
   **When** the celebration triggers
   **Then** the Celebration Overlay appears and after completion, user returns to Plan screen

# CRITICAL NOTE : THE DESIGN AND A WEB VERSION PROTOTYPE OF ALL CODE THE UI IS AVAILABLE HERE : - [cadence-full-v10.jsx](../_brainstorming/cadence-full-v10.jsx) . USE THIS AS YOUR ONLY REFERENCE IN TERMS OF DESIGN. THE FINAL NATIVE DESIGN MUST PERFECTLY MATCH THE ONE OF THE PROTOTYPE. PAY SPECIAL ATTENTION TO THE ANIMATION AND FONTs AND FONT PROPERTIES USED IN THAT PROTOTYPE. THE IMPLEMENTED VERSION MUST EXACTLY MATCH

## Tasks / Subtasks

- [x] Task 1: Create DebriefScreen container (AC: #1)
  - [x] Create `apps/native/src/components/app/session/DebriefScreen.tsx`
  - [x] Implement phase state management (0 → 1 → 2 → submitted → coachReply)
  - [x] Add scroll behavior with ref
  - [x] Implement `debriefIn` entrance animation

- [x] Task 2: Create DebriefHeader component (AC: #1)
  - [x] Create `DebriefHeader.tsx` with completion badge and title
  - [x] Implement stats row with Time, Distance, Avg Pace cards
  - [x] Add `springUp` staggered animation for stats cards

- [x] Task 3: Create FeelingSelector component (AC: #2)
  - [x] Create `FeelingSelector.tsx` with 5 feeling options
  - [x] Use exact FEELING_OPTIONS constant values
  - [x] Implement selection state with checkmark animation (`checkPop`)
  - [x] Add staggered `springUp` animation per option

- [x] Task 4: Create QuickTagPills component (AC: #3)
  - [x] Create `QuickTagPills.tsx` with flex-wrap layout
  - [x] Use exact DEBRIEF_PILLS constant values
  - [x] Implement toggle selection (dashed → solid border)

- [x] Task 5: Create DebriefNoteInput component (AC: #3, #4)
  - [x] Create `DebriefNoteInput.tsx` with textarea
  - [x] Implement mic button and character count
  - [x] Add send arrow button animation (`scaleIn`)

- [x] Task 6: Create VoiceRecorderMode component (AC: #4)
  - [x] Create `VoiceRecorderMode.tsx` with waveform visualization
  - [x] Implement 24-bar animated waveform (`waveform` keyframes)
  - [x] Add timer display and Cancel/Done buttons

- [x] Task 7: Create useStreamingText hook (AC: #5)
  - [x] Hook already exists at `apps/native/src/hooks/use-stream.ts`
  - [x] Implements character-by-character streaming with speed/delay params
  - [x] Returns `{ displayed, done, started }` state

- [x] Task 8: Create CoachResponseCard component (AC: #5)
  - [x] Create `CoachResponseCard.tsx` with dark background card
  - [x] Implement coach avatar (lime circle with "C")
  - [x] Use streaming text hook with blinking cursor
  - [x] Add radial gradient decoration

- [x] Task 9: Create DebriefSummary component (AC: #6)
  - [x] Create `DebriefSummary.tsx` with "Logged" indicator
  - [x] Display selected feeling, pills, and note indicator
  - [x] Add "Done" button with springUp animation

- [x] Task 10: Create CelebrationOverlay component (AC: #7)
  - [x] Create `CelebrationOverlay.tsx` with phase-based animations
  - [x] Implement check circle with glow (`celebCheck`)
  - [x] Add SVG ring burst animations (`celebRing`, `celebRing2`)
  - [x] Implement text reveal and auto-dismiss (2800ms)

- [x] Task 11: Wire navigation and data flow
  - [x] Accept props from Active Session: `{ session, elapsedTime, distanceCovered }`
  - [x] Implement `onDone` callback for navigation back to Plan screen
  - [x] Mark session as complete in state

- [x] Task 12: Add to component exports and verify integration
  - [x] Export all components from `apps/native/src/components/app/session/index.ts`
  - [x] TypeScript check passes for all Debrief components

## Dev Notes

### Design Reference

- **Prototype:** `_bmad-output/brainstorming/cadence-full-v10.jsx` lines 647-848 (DebriefScreen)
- **Celebration:** `_bmad-output/brainstorming/cadence-full-v10.jsx` lines 599-633 (CelebrationOverlay)
- **All implementations MUST be exact transcription of prototype**

### Component Breakdown

```
apps/native/src/components/app/session/
├── DebriefScreen.tsx          # Main container with phase state
├── DebriefHeader.tsx          # Completion badge, title, stats row
├── FeelingSelector.tsx        # 5-option feeling picker
├── QuickTagPills.tsx          # Flex-wrap tag buttons
├── DebriefNoteInput.tsx       # Textarea with mic/send
├── VoiceRecorderMode.tsx      # Recording UI with waveform
├── CoachResponseCard.tsx      # Streaming coach message
├── DebriefSummary.tsx         # Logged items summary
├── CelebrationOverlay.tsx     # Full-screen celebration
└── index.ts                   # Exports
```

### Typography Requirements (CRITICAL - must match exactly)

| Element                  | fontSize | fontWeight | letterSpacing | Color                                |
| ------------------------ | -------- | ---------- | ------------- | ------------------------------------ |
| Session type title       | 30       | 800        | -0.04em       | g1                                   |
| "How did that feel?"     | 20       | 700        | —             | wText                                |
| Feeling label            | 15       | 600        | —             | wText (selected) / wSub (unselected) |
| Feeling description      | 12       | —          | —             | wMute                                |
| "Anything else to note?" | 16       | 600        | —             | wText                                |
| Pill buttons             | 13       | —          | —             | wText (selected) / wSub (unselected) |
| Coach response           | 17       | 400        | -0.01em       | g1                                   |
| Stat values              | 18       | 700        | —             | g1                                   |
| Stat labels              | 10       | 500        | 0.04em        | g4                                   |

### FEELING_OPTIONS Constant (exact values)

```typescript
const FEELING_OPTIONS = [
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
];
```

### DEBRIEF_PILLS Constant (exact values)

```typescript
const DEBRIEF_PILLS = [
  "Legs felt heavy",
  "Breathing was easy",
  "Side stitch",
  "Felt fast",
  "Needed more rest",
  "Perfect weather",
  "Too hot",
  "Had to walk",
];
```

### Coach Response Logic

```typescript
const coachMsg =
  feeling === "amazing" || feeling === "good"
    ? "That's what I like to see. You showed up, you executed, and you earned every meter. Keep stacking days like this and the race will take care of itself."
    : feeling === "tough" || feeling === "brutal"
      ? "Hey — the hard days are where the real work happens. The fact that you got out there and finished says more than any split time. I'm going to dial things back a touch for the next couple of sessions. Trust the process."
      : "You showed up. That's the hardest part and you did it. Not every run needs to feel great — some just need to get done. I'll take it from here.";
```

### Animation Keyframes Required

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
@keyframes celebCheck {
  0% {
    transform: scale(0) rotate(-20deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.2) rotate(5deg);
    opacity: 1;
  }
  70% {
    transform: scale(0.95) rotate(-2deg);
  }
  100% {
    transform: scale(1) rotate(0);
  }
}
@keyframes celebRing {
  0% {
    transform: scale(0.3);
    opacity: 0;
    stroke-dashoffset: 220;
  }
  40% {
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0;
    stroke-dashoffset: 0;
  }
}
@keyframes celebRing2 {
  0% {
    transform: scale(0.5);
    opacity: 0;
  }
  30% {
    opacity: 0.6;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}
@keyframes celebText {
  0% {
    opacity: 0;
    transform: translateY(16px);
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes celebFadeOut {
  0% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}
```

### Project Structure Notes

**Directory:** Create new `session` directory under `apps/native/src/components/app/`

- Pattern matches existing: `analytics`, `plan`, `onboarding`

**Design Tokens:** Use existing from `@/lib/design-tokens`

- `DARK_THEME` for header area (g1, g2, g3, g4, lime, brd, black)
- `LIGHT_THEME` for content area (w1, w2, w3, wText, wSub, wMute, wBrd)
- `ACTIVITY_COLORS` for barHigh (checkmark color)

**NativeWind Classes:** Follow pattern from AnalyticsScreen.tsx

```typescript
// Header area
className="bg-black px-6 pb-7" style={{ paddingTop: insets.top + 12 }}

// Light content area
className="bg-w2 -mt-1" style={{ borderTopLeftRadius: 28, borderTopRightRadius: 28 }}

// Card styling
className="p-[18px] rounded-[20px] bg-w1 border border-wBrd"
```

### Data Requirements

**Props from Active Session:**

```typescript
interface DebriefScreenProps {
  session: {
    type: string; // e.g., "Tempo Run"
    zone: string; // e.g., "Z4"
    km: number; // planned km
  };
  elapsedTime: number; // seconds
  distanceCovered: number; // km (actual)
  onDone: () => void; // navigate back to Plan
}
```

**Local State:**

```typescript
const [phase, setPhase] = useState(0); // Flow progression (0-2)
const [feeling, setFeeling] = useState<string | null>(null);
const [noteText, setNoteText] = useState("");
const [selectedPills, setSelectedPills] = useState<string[]>([]);
const [submitted, setSubmitted] = useState(false);
const [coachReply, setCoachReply] = useState(false);
const [recording, setRecording] = useState(false);
const [recTime, setRecTime] = useState(0);
const [celebrating, setCelebrating] = useState(false);
```

### Phase Flow

```
Phase 0 (initial): Show header only
   ↓ setTimeout 500ms
Phase 1: Show feeling question
   ↓ User selects feeling
Phase 2: Show quick tags + note input
   ↓ User taps "Save & Wrap Up" or "Skip"
Submitted: Show coach streaming response
   ↓ Stream completes + 300ms delay
CoachReply: Show logged summary + Done button
   ↓ User taps Done
Celebrating: Show celebration overlay (2800ms)
   ↓ Auto-dismiss
Navigate to Plan screen
```

### References

- [AnalyticsScreen.tsx](apps/native/src/components/app/analytics/AnalyticsScreen.tsx) - Pattern for dark header + light content layout
- [design-tokens.ts](apps/native/src/lib/design-tokens.ts) - Color constants
- [cadence-full-v10.jsx](/_bmad-output/brainstorming/cadence-full-v10.jsx#L647) - Source prototype
- Architecture: apps/native/src/components/ directory structure

### Technical Notes

- **Animations:** Use `react-native-reanimated` for springUp, checkPop, waveform
- **SVG:** Use `react-native-svg` for celebration ring burst and checkmark icons
- **Font:** Outfit font family (already configured via design system)
- **tabular-nums:** Not needed for this screen (no timer display)
- **Voice Recording:** Mock implementation - sets sample note text on "Done"

### Testing Considerations

- Test feeling selection highlighting and deselection
- Test quick tag pill toggle behavior (multi-select)
- Verify streaming text timing (22ms per char, 300ms initial delay)
- Confirm celebration auto-dismiss at 2800ms
- Test navigation callback fires correctly

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- TypeScript check passed for all Debrief components (pre-existing errors in healthkit unrelated)

### Completion Notes List

- Created complete Debrief Screen flow with 9 components matching prototype design
- Reused existing `use-stream.ts` hook for coach message streaming
- All animations implemented using react-native-reanimated (FadeIn, FadeInUp, ZoomIn, springify)
- CelebrationOverlay includes phase-based animations with check circle glow and ring burst
- Typography matches prototype exactly (font sizes, weights, letter spacing)
- Color tokens from design-tokens.ts used throughout

### File List

**New Files:**
- apps/native/src/components/app/session/DebriefScreen.tsx
- apps/native/src/components/app/session/DebriefHeader.tsx
- apps/native/src/components/app/session/FeelingSelector.tsx
- apps/native/src/components/app/session/QuickTagPills.tsx
- apps/native/src/components/app/session/DebriefNoteInput.tsx
- apps/native/src/components/app/session/VoiceRecorderMode.tsx
- apps/native/src/components/app/session/CoachResponseCard.tsx
- apps/native/src/components/app/session/DebriefSummary.tsx
- apps/native/src/components/app/session/CelebrationOverlay.tsx

**Modified Files:**
- apps/native/src/components/app/session/index.ts (added Debrief exports)
