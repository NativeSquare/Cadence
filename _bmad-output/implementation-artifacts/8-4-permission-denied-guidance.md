# Story 8.4: Permission Denied Guidance

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want helpful guidance when I deny permissions,
so that I understand implications and can change my mind.

## Acceptance Criteria

1. **Given** a permission is requested (microphone, health data)
   **When** the user denies it
   **Then** helpful guidance is shown explaining the impact (FR59)
   **And** alternative paths are offered
   **And** instructions for enabling later in Settings are provided

2. **Given** microphone permission is denied
   **When** the user tries voice input
   **Then** text input remains fully functional
   **And** the denial doesn't block onboarding progress

3. **Given** the user later wants to grant permission
   **When** they access settings
   **Then** clear instructions guide them to the correct location
   **And** a "Check Again" or retry option is available after returning

4. **Given** HealthKit permission is denied
   **When** the user is on the wearable connection flow
   **Then** the no-wearable path remains fully available
   **And** the user understands they can connect later

## Tasks / Subtasks

- [ ] Task 1: Create reusable PermissionDeniedGuidance component (AC: #1, #3)
  - [ ] 1.1: Define PermissionGuidanceConfig type for different permission types
  - [ ] 1.2: Create PermissionDeniedCard component with title, message, instructions
  - [ ] 1.3: Add "Open Settings" button using existing `openAppSettings()` pattern
  - [ ] 1.4: Add "Try Again" button for retry after settings change
  - [ ] 1.5: Add "Continue Without" button for skip/fallback path
  - [ ] 1.6: Style with design system tokens (use existing card patterns)

- [ ] Task 2: Implement microphone permission guidance (AC: #2)
  - [ ] 2.1: Add `MICROPHONE_PERMISSION_GUIDANCE` constant to lib/constants.ts
  - [ ] 2.2: Update VoiceInput component to show guidance on permission denial
  - [ ] 2.3: Ensure text input button remains prominent when voice unavailable
  - [ ] 2.4: Add haptic feedback on guidance display

- [ ] Task 3: Enhance HealthKit permission guidance (AC: #4)
  - [ ] 3.1: Update ConnectionCardTool to use PermissionDeniedGuidance component
  - [ ] 3.2: Ensure "Skip - No Wearable" path remains prominent
  - [ ] 3.3: Add guidance text explaining data can be connected later
  - [ ] 3.4: Test integration with existing `use-healthkit.ts` permission flow

- [ ] Task 4: Create unified permission guidance constants (AC: #1, #3)
  - [ ] 4.1: Create `lib/permission-guidance.ts` with all permission configs
  - [ ] 4.2: Include platform-specific instructions (iOS vs Android)
  - [ ] 4.3: Export helper functions for opening correct settings location

- [ ] Task 5: Test all permission denial scenarios
  - [ ] 5.1: Test voice permission denial fallback to text
  - [ ] 5.2: Test HealthKit denial fallback to no-wearable path
  - [ ] 5.3: Test Settings return and retry flow
  - [ ] 5.4: Verify onboarding can complete without any permissions

## Dev Notes

### Existing Patterns to Follow

**HealthKit Permission Handling (REFERENCE IMPLEMENTATION):**
The existing HealthKit implementation in [lib/healthkit.ts](apps/native/src/lib/healthkit.ts#L149-L160) provides the pattern to follow:

```typescript
// Existing pattern from lib/healthkit.ts
export const PERMISSION_DENIED_GUIDANCE = {
  title: "Apple Health Access Required",
  message: "To sync your running data, please enable Apple Health access in Settings.",
  instructions: [
    "Open Settings",
    "Scroll down and tap on this app",
    "Tap Health",
    "Enable the data types you want to share",
  ],
};
```

**Settings Opening Helper (REUSE):**
[lib/healthkit.ts:144-147](apps/native/src/lib/healthkit.ts#L144-L147) and [use-voice-input.ts:147-153](apps/native/src/hooks/use-voice-input.ts#L147-L153) both have settings helpers:

```typescript
export async function openAppSettings(): Promise<void> {
  if (Platform.OS === "ios") {
    await Linking.openURL("app-settings:");
  } else {
    await Linking.openSettings();
  }
}
```

**useHealthKit Hook Pattern (REFERENCE):**
[hooks/use-healthkit.ts](apps/native/src/hooks/use-healthkit.ts) demonstrates the state machine for permission flows:
- `permissionDenied` boolean state
- `permission_denied` phase in syncStatus
- `openSettings` callback
- `retryAfterSettings` callback

### Architecture Compliance

**Component Location:**
- New component: `apps/native/src/components/app/common/PermissionDeniedCard.tsx`
- Permission configs: `apps/native/src/lib/permission-guidance.ts`

**Naming Conventions:**
- Component: `PermissionDeniedCard` (PascalCase)
- Hook: `use-permission-guidance.ts` (kebab-case) if needed
- Types: `PermissionGuidanceConfig`, `PermissionType` (PascalCase)

**Design System Requirements:**
Use semantic tokens from NativeWind:
- `bg-card` for card background
- `text-card-foreground` for primary text
- `text-muted-foreground` for instructions
- `border-border` for card border
- Existing button styles from `@rn-primitives`

**Error Handling Pattern:**
Follow existing pattern - no ConvexError needed for client-side permission UI.

### Technical Implementation Notes

1. **Permission Type Enum:**
```typescript
type PermissionType = 'microphone' | 'healthkit' | 'health_connect' | 'location';
```

2. **Unified Guidance Interface:**
```typescript
interface PermissionGuidanceConfig {
  type: PermissionType;
  title: string;
  message: string;
  instructions: string[];
  alternativePath?: {
    label: string;
    description: string;
  };
  settingsPath?: string; // Platform-specific deep link
}
```

3. **Component Props:**
```typescript
interface PermissionDeniedCardProps {
  config: PermissionGuidanceConfig;
  onOpenSettings: () => void;
  onRetry: () => void;
  onSkip?: () => void;
  isRetrying?: boolean;
}
```

### Critical Requirements

1. **NEVER block onboarding** - All permission denials must have fallback paths
2. **Platform-aware instructions** - iOS and Android have different Settings UIs
3. **Consistent haptic feedback** - Use `Haptics.notificationAsync(Warning)` on denial
4. **Design system compliance** - Use existing card/button primitives

### Project Structure Notes

**Files to Create:**
- `apps/native/src/components/app/common/PermissionDeniedCard.tsx`
- `apps/native/src/lib/permission-guidance.ts`

**Files to Update:**
- `apps/native/src/components/app/onboarding/generative/VoiceInput.tsx` - Add permission guidance
- `apps/native/src/components/app/onboarding/generative/ConnectionCardTool.tsx` - Use new component
- `apps/native/src/hooks/use-voice-input.ts` - Add permission state if implementing full voice

### References

- [Source: architecture.md#Error Handling Patterns](docs/architecture.md#error-handling-patterns)
- [Source: epics.md#Story 8.4](docs/epics.md#story-84-permission-denied-guidance)
- [Source: prd-onboarding-mvp.md#FR59](docs/prd-onboarding-mvp.md#FR59)
- [Source: lib/healthkit.ts#L149-L160](apps/native/src/lib/healthkit.ts#L149-L160) - Permission guidance pattern
- [Source: hooks/use-healthkit.ts](apps/native/src/hooks/use-healthkit.ts) - Permission flow state machine
- [Source: hooks/use-voice-input.ts#L147-L153](apps/native/src/hooks/use-voice-input.ts#L147-L153) - Settings helper

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

