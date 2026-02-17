# Story 8.4: Permission Denied Guidance

Status: complete

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

- [x] Task 1: Create reusable PermissionDeniedGuidance component (AC: #1, #3)
  - [x] 1.1: Define PermissionGuidanceConfig type for different permission types
  - [x] 1.2: Create PermissionDeniedCard component with title, message, instructions
  - [x] 1.3: Add "Open Settings" button using existing `openAppSettings()` pattern
  - [x] 1.4: Add "Try Again" button for retry after settings change
  - [x] 1.5: Add "Continue Without" button for skip/fallback path
  - [x] 1.6: Style with design system tokens (use existing card patterns)

- [x] Task 2: Implement microphone permission guidance (AC: #2) **[MVP STUB]**
  - [x] 2.1: Add `MICROPHONE_PERMISSION_GUIDANCE` constant (in PermissionDeniedCard)
  - [x] 2.2: Update use-voice-input hook with permission_denied status type
  - [x] 2.3: Text input remains available (graceful degradation via stub error)
  - [x] 2.4: Add haptic feedback on guidance display
  - Note: Voice input is deferred for MVP per PRD. Full permission_denied flow activates post-MVP when expo-av is installed.

- [x] Task 3: Enhance HealthKit permission guidance (AC: #4)
  - [x] 3.1: Update ConnectionCardTool to use PermissionDeniedCard component
  - [x] 3.2: "Skip" path remains prominent via onSkip callback
  - [x] 3.3: Guidance includes alternative instructions for enabling later
  - [x] 3.4: Integration with existing use-healthkit.ts permission flow

- [x] Task 4: Create unified permission guidance constants (AC: #1, #3)
  - [x] 4.1: PERMISSION_GUIDANCE constant in PermissionDeniedCard.tsx
  - [x] 4.2: Platform-specific instructions included
  - [x] 4.3: openAppSettings helper via Platform and Linking

- [x] Task 5: Test all permission denial scenarios
  - [x] 5.1: Voice permission stub with fallback to text ready
  - [x] 5.2: HealthKit denial shows PermissionDeniedCard with skip option
  - [x] 5.3: Settings return handled via retryAfterSettings
  - [x] 5.4: Onboarding can complete without permissions (skip paths available)

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

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

N/A

### Completion Notes List

- Created PermissionDeniedCard component with unified guidance for all permission types
- Added support for healthkit, microphone, notifications, camera, and location permissions
- Integrated platform-specific Settings opening (iOS app-settings: vs Android openSettings)
- Updated ConnectionCardTool to show PermissionDeniedCard when HealthKit permission denied
- Enhanced use-voice-input.ts with permission_denied status type and retryPermission callback
- All skip/fallback paths implemented to ensure onboarding can complete without permissions
- **MVP Note:** Microphone permission flow is stubbed - voice input deferred per PRD. Type infrastructure ready for post-MVP activation.

### File List

**Modified:**
- `apps/native/src/hooks/use-voice-input.ts` - Added permission_denied status type, retryPermission stub
- `apps/native/src/hooks/use-healthkit.ts` - permissionDenied state, retryAfterSettings callback for AC#3, AC#4
- `apps/native/src/components/app/onboarding/generative/ConnectionCardTool.tsx` - PermissionDeniedCard integration

**Created:**
- `apps/native/src/components/app/onboarding/generative/PermissionDeniedCard.tsx` - Unified permission guidance UI

