# Story 1.2: Social Login Integration

Status: ready-for-dev

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

- [ ] **Task 1: Verify Google Sign-In Works** (AC: #1)
  - [ ] Test Google Sign-In flow on device/simulator
  - [ ] Confirm user record is created in Convex

- [ ] **Task 2: Add Runner Object Auto-Creation** (AC: #3)
  - [ ] In auth success callback, check if Runner Object exists
  - [ ] If not, call `createRunner` mutation with initial state
  - [ ] Pre-populate `identity.name` from OAuth payload

- [ ] **Task 3: Mock Apple Sign-In Button** (AC: #2)
  - [ ] Keep Apple button visible (for UI completeness)
  - [ ] Style as disabled: `opacity-50` or muted colors
  - [ ] On tap: show toast "Apple Sign-In coming soon" or do nothing

- [ ] **Task 4: Implement Onboarding Redirect** (AC: #4)
  - [ ] After auth, check Runner Object `conversation_state`
  - [ ] If not complete, redirect to `/(onboarding)/consent`
  - [ ] If complete, redirect to `/(app)/home`

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

{{agent_model_name_version}}

### Completion Notes List

- [ ] Google Sign-In verified working
- [ ] Runner Object auto-created on first login
- [ ] Apple button mocked/disabled
- [ ] Onboarding redirect working

### File List

- `apps/native/src/app/(auth)/login.tsx` (modified - Apple button mocked)
- `apps/native/src/app/(onboarding)/_layout.tsx` (modified - redirect logic)
