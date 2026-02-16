# Story 8.1: Network Unavailable Handling

Status: ready-for-dev

## Story

As a user,
I want to see a friendly message when offline,
so that I understand what's happening and what to do.

## Acceptance Criteria

1. **Given** the user has no network connection
   **When** they try to start onboarding
   **Then** a friendly message is shown (FR56)
   **And** message explains: "I need to be online to get started. Connect to WiFi or cellular and let's try again."
   **And** a retry option is available

2. **Given** the app detects network status
   **When** connection is unavailable
   **Then** network-dependent features are disabled gracefully
   **And** local data remains accessible

3. **Given** the app starts with no network
   **When** the user opens the app
   **Then** they see the offline state immediately (no loading then error)
   **And** the UI indicates what's blocked vs. available

4. **Given** network becomes available
   **When** the app detects connectivity restored
   **Then** the offline UI automatically dismisses
   **And** normal functionality resumes without manual retry

## Tasks / Subtasks

- [ ] Task 1: Add Network Monitoring Library (AC: #2, #4)
  - [ ] 1.1 Install `@react-native-community/netinfo` package
  - [ ] 1.2 Update app.json/app.config.ts if needed for Expo
  - [ ] 1.3 Verify compatibility with Expo SDK 54 and EAS Build

- [ ] Task 2: Create Network Status Hook (AC: #2, #3, #4)
  - [ ] 2.1 Create `apps/native/src/hooks/use-network-status.ts`
  - [ ] 2.2 Implement `useNetworkStatus()` hook with states: "online" | "offline" | "unknown"
  - [ ] 2.3 Subscribe to NetInfo state changes
  - [ ] 2.4 Handle edge cases: airplane mode, cellular only, wifi only
  - [ ] 2.5 Add debounce to prevent rapid state flicker (500ms)

- [ ] Task 3: Create Network Status Context Provider (AC: #2, #3)
  - [ ] 3.1 Create `apps/native/src/contexts/network-context.tsx`
  - [ ] 3.2 Provide `isOnline`, `isOffline`, `connectionType` values
  - [ ] 3.3 Wrap app root in provider (in `_layout.tsx`)
  - [ ] 3.4 Export `useNetwork()` hook for components

- [ ] Task 4: Create Offline Screen Component (AC: #1, #3)
  - [ ] 4.1 Create `apps/native/src/components/common/OfflineScreen.tsx`
  - [ ] 4.2 Display friendly message: "I need to be online to get started..."
  - [ ] 4.3 Show WiFi icon (or appropriate network icon) in lime accent
  - [ ] 4.4 Add "Try Again" button that checks network status
  - [ ] 4.5 Style with design system tokens (dark background, lime accent)

- [ ] Task 5: Create Network Status Banner Component (AC: #2, #4)
  - [ ] 5.1 Create `apps/native/src/components/common/NetworkStatusBanner.tsx`
  - [ ] 5.2 Show slim banner at top when offline (amber/orange warning color)
  - [ ] 5.3 Show "Back online" confirmation briefly when reconnected (green)
  - [ ] 5.4 Auto-dismiss reconnection banner after 2 seconds
  - [ ] 5.5 Add slide animation for banner appearance/dismissal

- [ ] Task 6: Integrate Network Check in Onboarding Entry (AC: #1, #3)
  - [ ] 6.1 Update `apps/native/src/app/(onboarding)/index.tsx` or entry screen
  - [ ] 6.2 Check network status before showing AI conversation
  - [ ] 6.3 Render OfflineScreen when `isOffline` is true
  - [ ] 6.4 Auto-transition to conversation when connection restored

- [ ] Task 7: Graceful Feature Disabling (AC: #2)
  - [ ] 7.1 Update `use-ai-chat.ts` to check network before sending
  - [ ] 7.2 Update voice input to check network before transcription
  - [ ] 7.3 Update HealthKit sync to check network before API calls
  - [ ] 7.4 Show appropriate disabled states in UI

## Dev Notes

### Current Codebase Analysis

**Network Monitoring: DOES NOT EXIST**
The codebase has no network status monitoring. All network-dependent code assumes connectivity:
- `ai-stream.ts` has reconnection logic but no proactive offline detection
- `use-ai-chat.ts` catches errors reactively, doesn't prevent attempts
- `use-healthkit.ts` catches sync errors but doesn't check connectivity first

**Existing Patterns to Follow:**

**Context Provider Pattern (ToolStateContext):**
[apps/native/src/components/app/onboarding/generative/tool-state-context.tsx](apps/native/src/components/app/onboarding/generative/tool-state-context.tsx) demonstrates the context pattern:
```typescript
const NetworkContext = createContext<NetworkContextValue | null>(null);
export function NetworkProvider({ children }: { children: React.ReactNode }) { ... }
export function useNetwork() { ... }
```

**Error State Hooks (useHealthKit):**
[apps/native/src/hooks/use-healthkit.ts](apps/native/src/hooks/use-healthkit.ts) demonstrates status state machine:
- Multiple states: "idle" | "authorizing" | "fetching" | "syncing" | "complete" | "error"
- Separate `error` state with message
- Callbacks for retry actions

**UI Components Available:**
- Alert component: `apps/native/src/components/ui/alert.tsx` - For inline banners
- AlertDialog: `apps/native/src/components/ui/alert-dialog.tsx` - For full-screen blocking UI
- Existing animations: FadeIn, FadeOut with reanimated

### Architecture Compliance

**Component Locations:**
- Hook: `apps/native/src/hooks/use-network-status.ts`
- Context: `apps/native/src/contexts/network-context.tsx` (new directory)
- Components: `apps/native/src/components/common/OfflineScreen.tsx`
- Components: `apps/native/src/components/common/NetworkStatusBanner.tsx`

**Naming Conventions (architecture.md):**
- Hooks: `use-{name}.ts` kebab-case
- Components: `PascalCase.tsx`
- Context: `{name}-context.tsx`

**Design System Requirements:**
Use semantic tokens from NativeWind:
- `bg-background` for screens
- `bg-destructive` / `bg-warning` for offline banner
- `text-primary` (lime) for accent elements
- `text-muted-foreground` for secondary text

### Technical Implementation

**1. NetInfo Integration:**
```typescript
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [state, setState] = useState<'online' | 'offline' | 'unknown'>('unknown');

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((netState: NetInfoState) => {
      setState(netState.isConnected ? 'online' : 'offline');
    });
    return unsubscribe;
  }, []);

  return { isOnline: state === 'online', isOffline: state === 'offline', state };
}
```

**2. Debounce for Stability:**
```typescript
// Prevent flicker during brief disconnections
const debouncedState = useDebouncedValue(networkState, 500);
```

**3. Offline Screen Layout:**
```tsx
// Centered content, friendly messaging, consistent with app styling
<View className="flex-1 bg-background items-center justify-center px-8">
  <WifiOff size={64} className="text-primary mb-6" />
  <Text className="text-2xl font-bold text-foreground text-center mb-4">
    No Connection
  </Text>
  <Text className="text-muted-foreground text-center mb-8">
    I need to be online to get started. Connect to WiFi or cellular and let's try again.
  </Text>
  <Button onPress={checkConnection} variant="default">
    <Text>Try Again</Text>
  </Button>
</View>
```

**4. Banner Animation:**
```typescript
// Use reanimated for smooth slide
const translateY = useSharedValue(-50);
useEffect(() => {
  translateY.value = withTiming(isOffline ? 0 : -50, { duration: 200 });
}, [isOffline]);
```

### Dependency to Install

```bash
cd apps/native
pnpm add @react-native-community/netinfo
```

**Expo Compatibility:**
NetInfo is compatible with Expo SDK 54. For managed workflow, no config plugin needed. For EAS Build (which this project uses), it works out of the box.

### Project Structure Notes

**Files to Create:**
1. `apps/native/src/hooks/use-network-status.ts` - Network monitoring hook
2. `apps/native/src/contexts/network-context.tsx` - App-wide network provider
3. `apps/native/src/components/common/OfflineScreen.tsx` - Full screen offline UI
4. `apps/native/src/components/common/NetworkStatusBanner.tsx` - Inline banner

**Files to Modify:**
1. `apps/native/src/app/_layout.tsx` - Wrap with NetworkProvider
2. `apps/native/src/app/(onboarding)/index.tsx` or entry - Add offline check
3. `apps/native/src/hooks/use-ai-chat.ts` - Add network check before send
4. `apps/native/package.json` - Add netinfo dependency

### Integration Points

**With Story 8.2 (Connection Lost Mid-Flow):**
This story provides the foundation for 8.2. The `useNetworkStatus` hook and context will be reused for mid-flow detection.

**With Story 8.3 (LLM Failure Fallback):**
Network errors detected here should use the same error classification from 8.3's `LLM_NETWORK_ERROR` code.

### References

- [Source: epics.md#Story-8.1] Story requirements and FR56
- [Source: architecture.md#Error-Handling-Patterns] Error handling conventions
- [Source: architecture.md#Project-Structure] Component locations
- [Source: NFR-I4] Network interruptions must not lose user progress
- [Source: NFR-R1] Onboarding flow must handle network interruption
- [Source: tool-state-context.tsx] Context provider pattern
- [Source: use-healthkit.ts] Status state machine pattern

### Testing Approach

1. **Unit Tests:**
   - Hook returns correct states for different NetInfo responses
   - Debounce prevents rapid state changes
   - Context provides values correctly

2. **Integration Tests:**
   - Offline screen renders when network unavailable
   - Auto-dismisses when network returns
   - Banner shows/hides appropriately

3. **Manual Testing:**
   - Enable airplane mode before app launch - see offline screen
   - Disable network mid-flow - see banner
   - Re-enable network - see auto-recovery
   - Test on both iOS and Android

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List

