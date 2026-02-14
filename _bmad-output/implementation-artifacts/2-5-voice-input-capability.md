# Story 2.5: Voice Input Capability

Status: ready-for-dev

---

## Story

As a **user**,
I want **to speak my responses to the coach**,
So that **I can interact hands-free or express myself more naturally**.

---

## Acceptance Criteria

### AC1: Voice Recording Start

**Given** a tool has allowVoice enabled
**When** the user taps the microphone button
**Then** voice recording begins with visual feedback
**And** the device requests microphone permission if not granted

### AC2: Recording Stop and Transcription

**Given** the user is recording voice
**When** they stop recording (tap again or pause)
**Then** the audio is transcribed to text
**And** the transcription is shown for review/edit
**And** the user can confirm or re-record

### AC3: Transcription Confirmation

**Given** transcription completes
**When** the user confirms
**Then** the text is submitted as their response
**And** the conversation continues

### AC4: Permission Denied Handling

**Given** microphone permission is denied
**When** the user tries to use voice input
**Then** a helpful message explains how to enable permission
**And** they can still use text input as fallback

---

## Tasks / Subtasks

- [ ] **Task 1: Create VoiceInput Component** (AC: #1, #2)
  - [ ] Create `apps/native/src/components/app/onboarding/generative/VoiceInput.tsx`
  - [ ] Create recording state UI (waveform or pulse animation)
  - [ ] Handle microphone button toggle
  - [ ] Use expo-av for audio recording

- [ ] **Task 2: Implement Permission Request** (AC: #1, #4)
  - [ ] Use expo-av or expo-permissions for microphone access
  - [ ] Show contextual permission prompt before requesting
  - [ ] Handle permission denied state gracefully
  - [ ] Provide deep link to settings if needed

- [ ] **Task 3: Implement Audio Recording** (AC: #1, #2)
  - [ ] Configure Audio.Recording with appropriate settings
  - [ ] Start recording on button press
  - [ ] Stop recording on button release or tap again
  - [ ] Handle recording errors gracefully

- [ ] **Task 4: Implement Speech-to-Text** (AC: #2)
  - [ ] Create backend action for transcription
  - [ ] Use OpenAI Whisper API (or alternative)
  - [ ] Handle transcription errors
  - [ ] Return transcribed text to client

- [ ] **Task 5: Create Transcription Review UI** (AC: #2, #3)
  - [ ] Show transcribed text in editable field
  - [ ] Add "Confirm" and "Re-record" buttons
  - [ ] Allow user to edit text before confirming
  - [ ] Handle empty transcription

- [ ] **Task 6: Create Recording Animation** (AC: #1)
  - [ ] Create pulsing animation for recording state
  - [ ] Use design system colors
  - [ ] Add waveform or level indicator (optional)
  - [ ] Use react-native-reanimated

- [ ] **Task 7: Create Voice Input Hook** (AC: #1, #2, #3)
  - [ ] Create `apps/native/src/hooks/use-voice-input.ts`
  - [ ] Manage recording state machine
  - [ ] Handle permission checking
  - [ ] Return { startRecording, stopRecording, transcription, isRecording, error }

- [ ] **Task 8: Integrate with OpenInput** (AC: #1, #2, #3)
  - [ ] Add VoiceInput to OpenInput component
  - [ ] Pass transcribed text to input field
  - [ ] Handle voice → text → submit flow

---

## Dev Notes

### Critical Architecture Constraints

**MUST follow these patterns:**

1. **Expo AV for Recording:**
   ```typescript
   import { Audio } from 'expo-av';

   // Configure audio mode
   await Audio.setAudioModeAsync({
     allowsRecordingIOS: true,
     playsInSilentModeIOS: true,
   });

   // Start recording
   const { recording } = await Audio.Recording.createAsync(
     Audio.RecordingOptionsPresets.HIGH_QUALITY
   );
   ```

2. **Permission Pattern:**
   ```typescript
   import { Audio } from 'expo-av';

   const { granted } = await Audio.requestPermissionsAsync();
   if (!granted) {
     // Show permission denied UI
   }
   ```

3. **Design System Usage:**
   ```typescript
   // Recording indicator
   className="bg-destructive/20 rounded-full p-4"

   // Mic button (idle)
   className="bg-secondary rounded-full p-3"

   // Mic button (recording)
   className="bg-destructive rounded-full p-3 animate-pulse"
   ```

### Component Structure

```typescript
interface VoiceInputProps {
  onTranscription: (text: string) => void;
  onCancel: () => void;
}

type VoiceInputState =
  | { status: 'idle' }
  | { status: 'requesting_permission' }
  | { status: 'recording' }
  | { status: 'transcribing'; audioUri: string }
  | { status: 'review'; text: string }
  | { status: 'error'; message: string };
```

### Transcription Backend

**Option 1: OpenAI Whisper (Recommended)**
```typescript
// packages/backend/convex/ai/transcribe.ts
import { action } from "./_generated/server";
import OpenAI from "openai";

export const transcribeAudio = action({
  args: { audioBase64: v.string() },
  handler: async (ctx, args) => {
    const openai = new OpenAI();
    const audioBuffer = Buffer.from(args.audioBase64, 'base64');

    const transcription = await openai.audio.transcriptions.create({
      file: new File([audioBuffer], 'audio.m4a', { type: 'audio/m4a' }),
      model: 'whisper-1',
    });

    return transcription.text;
  },
});
```

**Option 2: On-Device (expo-speech)**
- Less accurate but faster
- No network required
- Consider as fallback

### Recording Settings

**Recommended Preset:**
```typescript
const recordingOptions: Audio.RecordingOptions = {
  android: {
    extension: '.m4a',
    outputFormat: Audio.AndroidOutputFormat.MPEG_4,
    audioEncoder: Audio.AndroidAudioEncoder.AAC,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    audioQuality: Audio.IOSAudioQuality.HIGH,
    sampleRate: 44100,
    numberOfChannels: 1,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {},
};
```

### Voice Input Flow

```
User taps mic button
        ↓
Check microphone permission
        ↓
┌───────────────────────────────────────────┐
│ Permission denied? → Show settings guide  │
└───────────────────────────────────────────┘
        ↓
Start recording (show pulse animation)
        ↓
User taps again to stop
        ↓
Show "Transcribing..." state
        ↓
Send audio to backend for transcription
        ↓
Receive transcribed text
        ↓
Show review screen with editable text
        ↓
User confirms or re-records
        ↓
Confirmed text sent to onSubmit
```

### UI Layout (Recording State)

```
┌────────────────────────────────────────┐
│         [●] Recording... 0:05          │
│                                        │
│     ~~~~ Waveform Animation ~~~~       │
│                                        │
│            [■] Stop                    │
└────────────────────────────────────────┘
```

### UI Layout (Review State)

```
┌────────────────────────────────────────┐
│ ┌────────────────────────────────────┐ │
│ │ Transcribed text here. User can   │ │
│ │ edit this before confirming...    │ │
│ └────────────────────────────────────┘ │
│                                        │
│   [🔄 Re-record]      [✓ Confirm]     │
└────────────────────────────────────────┘
```

### Permission Denied UI

```typescript
<View className="bg-card p-4 rounded-xl">
  <Text className="text-foreground font-medium mb-2">
    Microphone access needed
  </Text>
  <Text className="text-muted-foreground mb-4">
    To use voice input, please enable microphone access in Settings.
  </Text>
  <Button onPress={openSettings}>
    Open Settings
  </Button>
</View>
```

### Project Structure Notes

**Files to Create:**
| File | Purpose |
|------|---------|
| `generative/VoiceInput.tsx` | Voice recording and review UI |
| `hooks/use-voice-input.ts` | Recording state machine hook |
| `convex/ai/transcribe.ts` | Whisper transcription action |

**Files to Modify:**
| File | Change |
|------|--------|
| `generative/OpenInput.tsx` | Integrate VoiceInput |
| `packages/backend/package.json` | Add openai if not present |

### Dependencies

**Already Installed (verify):**
- `expo-av` - Audio recording

**May Need:**
- `openai` - For Whisper transcription (if not using via AI SDK)

### Haptic Feedback

```typescript
import * as Haptics from 'expo-haptics';

const startRecording = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  // Start recording...
};

const stopRecording = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  // Stop recording...
};
```

### Error Handling

1. **Permission Denied:**
   - Show clear message with settings link
   - Keep text input as fallback

2. **Recording Failed:**
   - Show error toast
   - Allow retry

3. **Transcription Failed:**
   - Show error with retry option
   - Allow manual text entry

4. **Empty Transcription:**
   - Show "I didn't catch that"
   - Offer re-record

### Performance Considerations

1. **Audio File Size:**
   - Limit recording to 60 seconds
   - Compress before upload
   - Show progress during upload

2. **Transcription Latency:**
   - Show "Transcribing..." immediately
   - Typical: 1-3 seconds for short clips

### PRD Scope Note

**From prd-onboarding-mvp.md:**
> Voice input (can defer if complexity requires)

This story is **optional for MVP**. If time is tight:
- Focus on text input (Story 2.4)
- Mark voice as post-MVP
- Ensure `allowVoice: false` works correctly

### Testing Considerations

1. **Manual Testing:**
   - Test permission request flow
   - Test recording start/stop
   - Test transcription accuracy
   - Test review/edit/confirm flow
   - Test permission denied state

2. **Edge Cases:**
   - Very short recordings (<1s)
   - Long recordings (>60s)
   - Noisy environments
   - Silent recordings

3. **Device Testing:**
   - Test on real device (not simulator for full flow)
   - Test iOS and Android permission flows

### References

- [Source: prd-onboarding-mvp.md#FR16] - Voice input responses
- [Source: prd-onboarding-mvp.md#Mobile Permissions] - Microphone permission
- [Source: epics.md#Story 2.5] - Original acceptance criteria
- [Expo AV Documentation] - Audio recording API

---

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Completion Notes List

### File List
