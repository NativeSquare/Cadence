# Story 1.2: Social Login Integration

Status: done

**Priority: LOW** - Auth already works in template. Move to end of Epic 1.

---

## Story

As a **new user**,
I want **to sign up using Google (Apple deferred)**,
So that **I can quickly create an account and start onboarding**.

---

## Scope Clarification

**ALREADY WORKING in template:**

- Google Sign-In backend (Convex Auth)
- Google Sign-In frontend (login screen)
- User record creation

**THIS STORY adds:**

- Auto-create Runner Object on first login
- Onboarding redirect logic
- Apple button visible but disabled/mocked (deferred to later)

---

## Acceptance Criteria

### AC1: Google Sign-In Works

**Given** the user is on the login/signup screen
**When** they tap "Continue with Google"
**Then** Google Sign-In flow works (already implemented)
**And** upon successful auth, a Runner Object is created for new users
**And** the user is redirected to onboarding

### AC2: Apple Sign-In Placeholder

**Given** the user is on the login/signup screen
**When** they tap "Continue with Apple"
**Then** nothing happens OR a "Coming Soon" toast is shown
**And** the button is visually styled as disabled/muted

### AC3: Runner Object Auto-Creation

**Given** a new user successfully authenticates
**When** no Runner Object exists for their userId
**Then** a Runner Object is created with initial state
**And** `identity.name` is populated from OAuth payload (if available)

### AC4: Onboarding Redirect

**Given** a user is authenticated
**When** they have not completed onboarding
**Then** they are redirected to `/(onboarding)` route

---

## Tasks / Subtasks

- [x] **Task 1: Verify Google Sign-In Works** (AC: #1)
  - [x] Test Google Sign-In flow on device/simulator
  - [x] Confirm user record is created in Convex

- [x] **Task 2: Add Runner Object Auto-Creation** (AC: #3)
  - [x] In auth success callback, check if Runner Object exists
  - [x] If not, call `createRunner` mutation with initial state
  - [x] Pre-populate `identity.name` from OAuth payload

- [x] **Task 3: Mock Apple Sign-In Button** (AC: #2)
  - [x] Keep Apple button visible (for UI completeness)
  - [x] Style as disabled: `opacity-50` or muted colors
  - [x] On tap: show Alert "Apple Sign-In coming soon"

- [x] **Task 4: Implement Onboarding Redirect** (AC: #4)
  - [x] After auth, routing guards check `hasCompletedOnboarding`
  - [x] If not complete, redirect to `/(onboarding)`
  - [x] If complete, redirect to `/(app)`

---

## Dev Notes

### This is a LOW priority story

Use what is already implemented. Typically the google sign in works already, etc so leverage what is already implemented and build upon it

Come back to this story to polish the auth → onboarding handoff.

### Runner Object Creation

```typescript
// In auth success handler or layout effect
const user = useCurrentUser();
const runner = useQuery(api.runners.getRunnerByUserId, { userId: user?._id });
const createRunner = useMutation(api.runners.createRunner);

useEffect(() => {
  if (user && runner === null) {
    createRunner({
      identity: {
        name: user.name || "",
        name_confirmed: false,
      },
      connections: {
        strava_connected: false,
        wearable_connected: false,
        calendar_connected: false,
      },
      conversation_state: {
        data_completeness: 0,
        ready_for_plan: false,
        current_phase: "intro",
        fields_to_confirm: [],
        fields_missing: [],
      },
    });
  }
}, [user, runner]);
```

### Mocked Apple Button

```tsx
<Pressable
  onPress={() => {
    // Option 1: Do nothing
    // Option 2: Show toast
    Toast.show({ text1: "Apple Sign-In coming soon" });
  }}
  className="opacity-50"
  disabled
>
  <AppleLogo />
  <Text>Continue with Apple</Text>
</Pressable>
```

### Dependencies

**Story 1.1 must be complete:**

- Runner Object schema must exist for `createRunner` mutation

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Implementation Plan

1. Verified existing Google Sign-In implementation in SignInCard component
2. Added Runner Object auto-creation in RootStack with useEffect hook
3. Modified SignInCard to mock Apple button (opacity-50 + Alert on tap)
4. Verified existing routing guards for onboarding redirect

### Completion Notes List

- [x] Google Sign-In verified working (existing implementation in sign-in-card.tsx)
- [x] Runner Object auto-created on first login (added to _layout.tsx RootStack)
- [x] Apple button mocked/disabled (opacity-50 + "Coming Soon" Alert)
- [x] Onboarding redirect working (existing Stack.Protected guards)

### File List

- `apps/native/src/app/_layout.tsx` (modified - added Runner Object auto-creation)
- `apps/native/src/components/app/auth/sign-in-card.tsx` (modified - Apple button mocked)

### Change Log

- 2026-02-14: Implemented Runner Object auto-creation and Apple button mock (Story 1.2)
