# Story 2.10: FreeformInput Enhancement & MiniAnalysis Component

Status: done

---

## Story

As a **user**,
I want **to see visible processing when I submit freeform text**,
So that **I trust the AI is actually analyzing what I said and extracting relevant information**.

---

## Acceptance Criteria

### MiniAnalysis Component

#### AC1: User Message Display

**Given** the user submits freeform text
**When** the MiniAnalysis component renders
**Then** the user's message displays in a bordered card
**And** the card has subtle gray border (`brd` token)
**And** the card has card background (`card` token)

#### AC2: Processing State Indicator

**Given** analysis is processing
**When** the component is active
**Then** an orange pulsing dot appears (#FF8A00)
**And** "Analyzing..." label displays in monospace
**And** the dot uses `pulseGlow` animation (1.5s cycle)

#### AC3: Terminal-Style Line Reveal

**Given** analysis is processing
**When** patterns are being detected
**Then** monospace terminal lines appear one by one
**And** each line has 280ms delay before the next
**And** lines use `fadeUp` animation as they appear

#### AC4: Pattern Extraction Display

**Given** analysis is processing
**When** patterns are detected in the text
**Then** relevant extractions are shown:
  - Race goals (e.g., "Race goal detected: Half Marathon")
  - Timelines (e.g., "Timeline extracted → planning window set")
  - Injuries (flagged with warning styling)
  - Schedule preferences
**And** important context is flagged with warning markers in orange

#### AC5: Warning Flags

**Given** sensitive patterns are detected
**When** flags are displayed (injuries, risky behaviors)
**Then** lines display with warning markers
**And** lines use orange color (`ora` token)
**And** sub-lines show with "→" prefix for context

#### AC6: Completion State

**Given** analysis completes
**When** processing finishes
**Then** "Added to profile" with checkmark appears in lime
**And** container border transitions from gray to lime (`sb` token)
**And** background transitions to lime glow (`sg` token)
**And** the orange pulsing dot becomes a static lime dot
**And** "Processed" label replaces "Analyzing..."

---

### FreeformInput Component

#### AC7: Base Input Display

**Given** the user sees a freeform input
**When** the component renders
**Then** a textarea with placeholder text is displayed
**And** the textarea has rounded corners (16px radius)
**And** the card border uses `brd` token
**And** the background uses `card` token

#### AC8: Quick-Tap Pills

**Given** pills are provided as props
**When** the component renders
**Then** quick-tap pill chips appear above the textarea
**And** pills have dashed border styling
**And** pills use `fadeIn` animation with staggered delays
**And** tapping a pill immediately submits that response

#### AC9: Voice Input Button

**Given** the input supports voice
**When** the component renders
**Then** a microphone button is available in the bottom-left
**And** the button has subtle background (`g6` token)
**And** the mic icon uses `g3` color

#### AC10: Character Count

**Given** the user types text
**When** text is present
**Then** character count displays in the bottom-right
**And** count uses monospace font at small size

#### AC11: Send Button Animation

**Given** the user types text
**When** text is present (non-empty after trim)
**Then** a send button animates in using `scaleIn`
**And** the button is lime with black arrow icon
**And** tapping sends the text and triggers MiniAnalysis

#### AC12: Voice Recording State

**Given** the user taps the microphone
**When** recording begins
**Then** the entire input transforms to recording mode
**And** waveform visualization displays (animated bars)
**And** timer shows elapsed time (MM:SS format)
**And** "Listening..." label appears in lime
**And** Cancel and Done buttons appear
**And** Done populates textarea with simulated transcription

---

## Tasks / Subtasks

- [x] **Task 1: Create MiniAnalysis Component** (AC: #1-#6)
  - [x] Create `apps/native/src/components/app/onboarding/generative/MiniAnalysis.tsx`
  - [x] Accept props: `text`, `onDone`
  - [x] Implement user message card display
  - [x] Create analysis state machine (processing → complete)
  - [x] Implement line-by-line reveal with 280ms intervals
  - [x] Style warning flags with orange color
  - [x] Implement border/background transition on completion
  - [x] Fire `onDone` callback when analysis completes

- [x] **Task 2: Implement Pattern Detection Simulation** (AC: #4, #5)
  - [x] Create `getAnalysisLines(text: string)` function
  - [x] Detect race-related keywords (half, marathon, 1:45, etc.)
  - [x] Detect timeline keywords (october, months, weeks)
  - [x] Detect injury/break keywords (baby, injury, break, pain)
  - [x] Detect schedule keywords (morning, evening, work)
  - [x] Return typed line objects: `{ text, type: 'sys' | 'extract' | 'flag' | 'done' }`

- [x] **Task 3: Create FreeformInput Base Component** (AC: #7, #10)
  - [x] Create `apps/native/src/components/app/onboarding/generative/FreeformInput.tsx`
  - [x] Accept props: `placeholder`, `pills`, `onSubmit`, `onPill`
  - [x] Implement multi-line TextInput with placeholder
  - [x] Add character count display
  - [x] Style container with rounded corners and card background

- [x] **Task 4: Implement Pill Chips** (AC: #8)
  - [x] Add pills above textarea
  - [x] Style with dashed border
  - [x] Implement staggered fadeIn animation
  - [x] Wire `onPill` callback for pill taps

- [x] **Task 5: Implement Send Button** (AC: #11)
  - [x] Conditionally render when text is present
  - [x] Use `scaleIn` animation on appearance
  - [x] Style with lime background
  - [x] Wire to `onSubmit` callback

- [x] **Task 6: Implement Voice Input UI** (AC: #9, #12)
  - [x] Add microphone button
  - [x] Create recording state view
  - [x] Implement waveform visualization (animated bars)
  - [x] Add timer display
  - [x] Add Cancel/Done buttons
  - [x] Simulate transcription on Done (placeholder text)

- [x] **Task 7: Integration Test** (AC: all)
  - [x] Test MiniAnalysis with various text inputs
  - [x] Verify line timing (280ms)
  - [x] Test FreeformInput pill interactions
  - [x] Test voice recording UI states
  - [x] Run TypeScript checks (`tsc --noEmit`)

---

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns from architecture.md:**

1. **Animation Library:**
   - Use `react-native-reanimated` v4.1.6
   - Use animation presets from `animations.ts` (Story 2.8):
     - `pulseGlow` for processing indicator
     - `fadeUp` for line reveals
     - `scaleIn` for send button
     - `springUp` for container entrance

2. **Design System Pattern:**
   - Use semantic tokens via NativeWind
   - Colors: `lime`, `ora`, `g1`-`g6`, `brd`, `card`, `sb`, `sg`
   - Fonts: `font-coach` (Outfit), `font-mono` (JetBrains Mono)

3. **File Naming:**
   - Components: PascalCase in `generative/` folder
   - Export as named exports

### Prototype Reference

From `cadence-v3.jsx` lines 165-256 (MiniAnalysis):

```javascript
function MiniAnalysis({ text, onDone }) {
  const [lines, setLines] = useState([]);
  const [done, setDone] = useState(false);

  const getAnalysis = (input) => {
    const lower = input.toLowerCase();
    const results = [];
    results.push({ text: "Processing response...", type: "sys" });
    results.push({ text: "", type: "sp" });

    if (lower.includes("half") || lower.includes("marathon")) {
      results.push({ text: "Race goal detected: Half Marathon", type: "extract" });
    }
    if (lower.includes("baby") || lower.includes("break")) {
      results.push({ text: "⚠ Return from extended break detected", type: "flag" });
      results.push({ text: "→ Conservative ramp-up applied", type: "flag" });
    }
    // ... more patterns

    results.push({ text: "Added to profile ✓", type: "done" });
    return results;
  };

  useEffect(() => {
    const analysis = getAnalysis(text);
    let i = 0;
    const add = () => {
      if (i < analysis.length) {
        setLines(p => [...p, analysis[i]]);
        i++;
        setTimeout(add, analysis[i-1].type === "sp" ? 120 : 280);
      } else {
        setTimeout(() => { setDone(true); if (onDone) onDone(); }, 600);
      }
    };
    setTimeout(add, 500);
  }, [text]);
  // ...
}
```

From `cadence-v3.jsx` lines 261-352 (FreeformInput):

```javascript
function FreeformInput({ placeholder = "Type here...", pills = [], onSubmit, onPill }) {
  const [val, setVal] = useState("");
  const [recording, setRecording] = useState(false);
  // ...

  if (recording) {
    return (
      // Recording UI with waveform, timer, cancel/done buttons
    );
  }

  return (
    <div>
      {pills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {pills.map((p, i) => (
            <button onClick={() => onPill?.(p)} style={{
              padding: "8px 14px", borderRadius: 20,
              border: `1px dashed ${T.g4}`,
              // ...
            }}>{p}</button>
          ))}
        </div>
      )}
      <div style={{ borderRadius: 16, border: `1px solid ${T.brd}` }}>
        <textarea value={val} onChange={e => setVal(e.target.value)} />
        <div>
          <button onClick={() => setRecording(true)}>🎤</button>
          <span>{val.length}</span>
          {val.trim() && <button onClick={handleSubmit}>➔</button>}
        </div>
      </div>
    </div>
  );
}
```

### Timing Constants

Use constants from `design-tokens.ts` (Story 2.8):

| Constant | Value | Purpose |
|----------|-------|---------|
| `MINI_ANALYSIS_LINE_MS` | 280 | Line reveal delay |

Additional timing (hardcode for now):
- Initial delay before first line: 500ms
- Spacer line delay: 120ms
- Completion delay after last line: 600ms

### Line Type Styling

| Type | Color | Font Weight | Icon |
|------|-------|-------------|------|
| `sys` | `g4` | 400 | none |
| `extract` | `g2` | 400 | none |
| `flag` | `ora` | 400 | ⚠ prefix |
| `done` | `lime` | 600 | ✓ prefix |
| `sp` | - | - | (spacer, renders as empty div) |

### Voice Recording Considerations

**Note:** Actual voice recording/transcription is NOT implemented in this story. The voice UI is visual only:

- Recording state shows animated waveform
- Timer counts up
- "Done" button populates a hardcoded example transcription
- Real transcription will be wired in a future story

**Waveform Implementation:**
- 24 vertical bars
- Each bar animated with `shimmer` preset
- Random heights that update periodically
- Bars are 3px wide with 2px gaps

### Project Structure Notes

**Files to Create:**

| File | Purpose |
|------|---------|
| `apps/native/src/components/app/onboarding/generative/MiniAnalysis.tsx` | Visible processing display |
| `apps/native/src/components/app/onboarding/generative/FreeformInput.tsx` | Enhanced text input |

**Files to Potentially Modify:**

| File | Change |
|------|--------|
| `apps/native/src/components/app/onboarding/question-inputs.tsx` | May need to integrate FreeformInput |

### Dependencies

**Uses from Story 2.8:**
- Animation presets: `pulseGlow`, `fadeUp`, `fadeIn`, `scaleIn`, `springUp`, `shimmer`
- Color tokens: `lime`, `ora`, `g1`-`g6`, `brd`, `card`, `sb`, `sg`
- Font tokens: `font-coach`, `font-mono`
- Timing: `MINI_ANALYSIS_LINE_MS`

**Uses from Story 2.9:**
- May reuse Cursor component for input focus states

**No new packages required.**

### Testing Considerations

1. **MiniAnalysis Testing:**
   - Test with text containing race keywords → should show race extraction
   - Test with injury keywords → should show flagged warnings
   - Test with generic text → should show "Context captured" fallback
   - Verify timing between lines (280ms)
   - Verify completion callback fires

2. **FreeformInput Testing:**
   - Test pill tap → should fire `onPill`
   - Test text submit → should fire `onSubmit`
   - Test send button visibility (appears/disappears with text)
   - Test voice recording UI states
   - Character count accuracy

3. **Visual Testing:**
   - Border transition to lime on MiniAnalysis completion
   - Orange pulsing dot animation
   - Send button `scaleIn` animation
   - Waveform bar animations during recording

### References

- [Source: cadence-v3.jsx lines 165-352] - MiniAnalysis and FreeformInput implementations
- [Source: architecture.md#Generative UI Implementation] - Tool component patterns
- [Source: sprint-change-proposal-2026-02-14.md#Story 2-10] - Story requirements
- [Depends on: Story 2.8] - Design tokens and animation presets
- [Depends on: Story 2.9] - Streaming text patterns

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- TypeScript checks passed for all story 2.10 files (backend has pre-existing errors unrelated to this story)

### Completion Notes List

- **Task 1**: Created `MiniAnalysis.tsx` with user message card, processing indicator (orange pulsing dot), line-by-line reveal, and border/background transitions on completion.
- **Task 2**: Implemented `getAnalysisLines()` function with pattern detection for race goals (half, marathon, 10k, 5k), time targets, timelines, injuries/breaks, and schedule preferences. Returns typed line objects with `sys`, `extract`, `flag`, `done`, and `sp` types.
- **Task 3**: Created `FreeformInput.tsx` with multi-line TextInput, placeholder support, character count display, and styled card container (rounded corners, border using `brd` token, background using `card` token).
- **Task 4**: Implemented pill chips with dashed borders, staggered fadeIn animation using `getStaggerDelay()`, and `onPill` callback support.
- **Task 5**: Implemented send button with `scaleIn` animation, lime background, conditionally rendered when text is present.
- **Task 6**: Implemented voice recording UI with 24-bar waveform visualization (shimmer animation), MM:SS timer, Cancel/Done buttons, and simulated transcription on Done.
- **Task 7**: Created visual test component `freeform-input-test.tsx` covering all ACs. TypeScript validation passed for story files.

### File List

**Created:**
- `apps/native/src/components/app/onboarding/generative/MiniAnalysis.tsx`
- `apps/native/src/components/app/onboarding/generative/FreeformInput.tsx`
- `apps/native/src/components/__tests__/freeform-input-test.tsx`

**Modified:**
- None
