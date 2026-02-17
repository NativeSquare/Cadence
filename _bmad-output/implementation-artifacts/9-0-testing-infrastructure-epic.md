# Epic 9: Testing Infrastructure & Coverage

**Epic Status:** 🔴 HIGH PRIORITY - Blocking Production Readiness
**Created:** 2026-02-17
**Author:** John (PM)

---

## Executive Summary

The Cadence codebase has **minimal testing infrastructure**. Despite 40+ implementation stories being completed, only 7 test files exist—and they **cannot run** because no test framework is configured. This epic establishes a comprehensive testing foundation and systematically adds coverage across all critical modules.

### Why This Matters

1. **Existing tests are stranded**: `inferenceEngine.test.ts` has 350+ lines of tests that can't execute
2. **No safety net**: Changes to AI streaming, tool execution, or data adapters have no validation
3. **Manual testing fatigue**: Every implementation artifact lists manual test checklists—these should be automated
4. **Blocks CI/CD**: Can't implement quality gates without test infrastructure

---

## Current State Assessment

### Test Files That Exist (But Can't Run)

| Location | File | Lines | Status |
|----------|------|-------|--------|
| Backend | `inferenceEngine.test.ts` | 350+ | convex-test not configured |
| Backend | `planGenerator.test.ts` | ~100 | convex-test not configured |
| Backend | `queries.test.ts` | ~50 | convex-test not configured |
| Backend | `sync.test.ts` (HealthKit) | ~80 | convex-test not configured |
| Backend | `http_action.test.ts` | ~60 | convex-test not configured |
| Native | `use-network-status.test.ts` | ~40 | jest not installed |
| Native | `PermissionDeniedCard.test.ts` | ~30 | jest not installed |

### What's Missing

| Category | Gap | Impact |
|----------|-----|--------|
| Framework Setup | convex-test not configured | All backend tests dead |
| Framework Setup | jest not configured for native | All native tests dead |
| Root Scripts | No turbo test tasks | Can't run tests from monorepo root |
| Coverage | No coverage reporting | No visibility into what's tested |
| CI/CD | No test automation | No quality gates |

---

## Epic Scope

### In Scope

1. **Backend Testing Framework** (packages/backend)
   - vitest configuration
   - convex-test for Convex functions
   - Mock utilities for external services

2. **Native App Testing Framework** (apps/native)
   - jest with Expo preset
   - React Native Testing Library
   - Component and hook testing

3. **Monorepo Integration**
   - Root-level turbo test tasks
   - Parallel test execution
   - Coverage aggregation

4. **Test Coverage for Critical Modules**
   - AI streaming infrastructure
   - Tool execution and handlers
   - Inference engine
   - Onboarding flows
   - Generative UI components

### Out of Scope

- Web app tests (apps/web) - minimal functionality, lower priority
- E2E tests with Detox/Maestro - post-MVP
- Visual regression testing - post-MVP
- Performance benchmarking - post-MVP

---

## Story Breakdown

### Story 9.1: Convex Backend Test Setup

As a developer,
I want `convex-test` configured for the backend package,
So that existing tests can run and Convex functions can be tested with real database state.

**Acceptance Criteria:**

1. `convex-test` installed in `packages/backend`
2. `pnpm test` runs all `*.test.ts` files in backend
3. `pnpm test:watch` available for development
4. Can create test contexts with seeded data
5. Can test mutations with transaction semantics
6. Can test queries with indexes
7. Existing `inferenceEngine.test.ts` passes (update imports from vitest to convex-test)
8. Test utilities for common patterns (create runner, create activity)

**Technical Notes:**

```typescript
// packages/backend/convex/test/setup.ts
import { convexTest } from "convex-test";
import schema from "../schema";

// Create a test instance with our schema
export function createTestCtx() {
  return convexTest(schema);
}

// Seed utilities
export async function seedRunner(t: ReturnType<typeof convexTest>, overrides = {}) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("runners", {
      userId: "test-user-id",
      identity: { name: "Test Runner", nameConfirmed: true },
      // ... default runner data
      ...overrides,
    });
  });
}

export async function seedActivity(t: ReturnType<typeof convexTest>, runnerId: Id<"runners">, overrides = {}) {
  return await t.run(async (ctx) => {
    return await ctx.db.insert("activities", {
      runnerId,
      source: "mock",
      startTime: Date.now(),
      activityType: "running",
      // ... default activity data
      ...overrides,
    });
  });
}
```

```typescript
// packages/backend/convex/lib/inferenceEngine.test.ts (updated)
import { convexTest } from "convex-test";
import { expect, test, describe, beforeEach } from "vitest"; // convex-test uses vitest internally
import schema from "../schema";
import { seedRunner, seedActivity } from "../test/setup";

describe("InferenceEngine", () => {
  let t: ReturnType<typeof convexTest>;

  beforeEach(() => {
    t = convexTest(schema);
  });

  test("calculates ATL from last 7 days", async () => {
    const runnerId = await seedRunner(t);
    // seed activities...

    const result = await t.run(async (ctx) => {
      return await calculateCurrentState(ctx, runnerId);
    });

    expect(result.acuteTrainingLoad).toBeGreaterThan(0);
  });
});
```

**Package.json scripts:**
```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage"
  }
}
```

**Note:** `convex-test` uses vitest internally for the test runner, but provides Convex-specific test utilities for database operations.

**Estimated Effort:** 4-6 hours

---

### Story 9.2: Native App Test Framework Setup

As a developer,
I want jest configured for the native app,
So that I can test React Native components and hooks.

**Acceptance Criteria:**

1. jest installed with jest-expo preset
2. @testing-library/react-native configured
3. @testing-library/jest-native matchers available
4. `pnpm test` runs all tests in apps/native
5. `pnpm test:watch` available for development
6. Existing `PermissionDeniedCard.test.ts` passes
7. Mock setup for common dependencies (expo-haptics, convex)

**Technical Notes:**

```javascript
// apps/native/jest.config.js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['@testing-library/jest-native/extend-expect'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|nativewind)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

**Estimated Effort:** 3-4 hours

---

### Story 9.3: Monorepo Test Integration

As a developer,
I want to run all tests from the monorepo root,
So that CI/CD can execute tests across all packages.

**Acceptance Criteria:**

1. `pnpm test` at root runs tests in all packages
2. `pnpm test:coverage` aggregates coverage
3. turbo.json includes test tasks
4. Tests run in parallel where possible
5. Exit code reflects overall pass/fail status

**Technical Notes:**

```json
// turbo.json addition
{
  "tasks": {
    "test": {
      "dependsOn": ["^build"],
      "cache": false
    },
    "test:coverage": {
      "dependsOn": ["^build"],
      "cache": false
    }
  }
}
```

```json
// root package.json scripts
{
  "scripts": {
    "test": "turbo run test",
    "test:watch": "turbo run test:watch --parallel",
    "test:coverage": "turbo run test:coverage",
    "test:ci": "turbo run test:coverage --parallel"
  }
}
```

**Estimated Effort:** 1-2 hours

---

### Story 9.4: AI Streaming Test Suite

As a developer,
I want comprehensive tests for the AI streaming infrastructure,
So that SSE streaming, tool calling, and error handling are validated.

**Acceptance Criteria:**

1. Test SSE stream format correctness
2. Test auth validation (401 for missing/invalid tokens)
3. Test tool call parsing from stream
4. Test reconnection logic with exponential backoff
5. Test error responses (400 for invalid requests)
6. Test message persistence after stream completes
7. Minimum 80% coverage of `convex/ai/` directory

**Test Scenarios:**

```typescript
describe('AI Streaming', () => {
  describe('Authentication', () => {
    it('returns 401 for missing auth header');
    it('returns 401 for invalid token');
    it('accepts valid auth token');
  });

  describe('Stream Format', () => {
    it('sends SSE events in correct format');
    it('includes tool calls in stream');
    it('terminates stream correctly');
  });

  describe('Tool Execution', () => {
    it('parses tool calls from LLM response');
    it('executes tool handlers');
    it('returns tool results to LLM');
  });

  describe('Error Handling', () => {
    it('handles LLM timeout gracefully');
    it('retries on transient failures');
    it('returns user-friendly error messages');
  });
});
```

**Estimated Effort:** 8-10 hours

---

### Story 9.5: Tool Execution Test Suite

As a developer,
I want tests for all tool handlers and result processing,
So that user input correctly updates the Runner Object.

**Acceptance Criteria:**

1. Test each tool handler (renderSlider, renderMultipleChoice, etc.)
2. Test field mapping to Runner Object
3. Test provenance tracking on updates
4. Test data completeness recalculation
5. Test phase progression logic
6. Minimum 90% coverage of tool handlers

**Test Scenarios:**

```typescript
describe('Tool Result Handler', () => {
  describe('Field Mapping', () => {
    it('maps schedule.availableDays correctly');
    it('maps goals.raceDate with parsing');
    it('handles nested field updates');
  });

  describe('Provenance', () => {
    it('records source as user_input');
    it('stores question asked');
    it('tracks conversation context');
  });

  describe('Phase Progression', () => {
    it('advances from intro to data_bridge');
    it('requires all mandatory fields');
    it('handles conditional questions');
  });
});
```

**Estimated Effort:** 6-8 hours

---

### Story 9.6: Inference Engine Test Validation

As a developer,
I want the existing inference engine tests to pass,
So that training load calculations are validated.

**Acceptance Criteria:**

1. All existing tests in `inferenceEngine.test.ts` pass
2. Tests use Soma API (post-migration)
3. Sofa adapter tests added for data transformation
4. Edge cases covered (no data, partial data, outliers)
5. 100% coverage of inference engine module

**Note:** Tests already exist, this story validates they work after framework setup.

**Estimated Effort:** 2-3 hours

---

### Story 9.7: Onboarding Flow Test Suite (Native)

As a developer,
I want tests for all onboarding screens,
So that user flows are validated programmatically.

**Acceptance Criteria:**

1. Test consent screen rendering and interactions
2. Test health data consent expandable sections
3. Test name confirmation flow
4. Test progress bar updates
5. Test navigation between screens
6. Test state persistence (simulate app restart)
7. Minimum 80% coverage of onboarding components

**Test Scenarios:**

```typescript
describe('Onboarding Flow', () => {
  describe('Consent Screen', () => {
    it('renders terms and privacy links');
    it('enables accept button only after viewing');
    it('navigates to health consent on accept');
  });

  describe('Health Consent', () => {
    it('renders all data type categories');
    it('expands sections on tap');
    it('opens external link for full details');
  });

  describe('Name Confirmation', () => {
    it('displays OAuth-provided name');
    it('allows name editing');
    it('validates non-empty name');
  });

  describe('Progress Tracking', () => {
    it('shows correct percentage');
    it('persists across app close');
    it('resumes at correct screen');
  });
});
```

**Estimated Effort:** 10-12 hours

---

### Story 9.8: Generative UI Component Tests

As a developer,
I want tests for all generative UI tool components,
So that AI-rendered interfaces work correctly.

**Acceptance Criteria:**

1. Test MultipleChoice selection behavior
2. Test OpenText input and submission
3. Test Slider value changes
4. Test DatePicker interactions
5. Test ConfirmationCard actions
6. Test ConnectionCard wearable flows
7. Test all chart components (Radar, Progression, Calendar)
8. Minimum 75% coverage of generative components

**Test Scenarios:**

```typescript
describe('Generative UI Components', () => {
  describe('MultipleChoice', () => {
    it('renders all options');
    it('highlights selected option');
    it('calls onSelect with correct value');
  });

  describe('Slider', () => {
    it('respects min/max bounds');
    it('shows current value');
    it('triggers haptic on change');
  });

  describe('Charts', () => {
    it('renders RadarChart with all dimensions');
    it('renders ProgressionChart with data points');
    it('renders CalendarWidget with sessions');
  });
});
```

**Estimated Effort:** 12-15 hours

---

### Story 9.9: Mock Utilities & Test Fixtures

As a developer,
I want shared mock utilities and fixtures,
So that tests are consistent and maintainable.

**Acceptance Criteria:**

1. Mock runner factory with sensible defaults
2. Mock activity generator (configurable)
3. Mock conversation with tool calls
4. Mock Convex context for actions
5. Mock external services (OpenAI, Strava, HealthKit)
6. Fixtures exported from central location
7. Documentation for adding new mocks

**Technical Notes:**

```typescript
// packages/backend/convex/test/mocks/index.ts
export * from './runner.mock';
export * from './activity.mock';
export * from './conversation.mock';
export * from './openai.mock';

// packages/backend/convex/test/fixtures/index.ts
export { defaultRunner } from './runner.fixture';
export { weekOfActivities } from './activity.fixture';
export { onboardingConversation } from './conversation.fixture';
```

**Estimated Effort:** 4-6 hours

---

## Implementation Sequence

```
Phase 1: Framework Setup (Stories 9.1-9.3)
├── 9.1 Convex backend test setup (convex-test + vitest)
├── 9.2 Native jest setup (unblocks all native tests)
└── 9.3 Monorepo turbo integration (enables CI/CD)

Phase 2: Critical Path Tests (Stories 9.4-9.6)
├── 9.4 AI streaming tests (highest risk module)
├── 9.5 Tool execution tests (critical for onboarding)
└── 9.6 Inference engine validation (existing tests)

Phase 3: UI Coverage (Stories 9.7-9.8)
├── 9.7 Onboarding flow tests
└── 9.8 Generative UI tests

Phase 4: Infrastructure (Story 9.9)
└── 9.9 Mock utilities
```

---

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Backend test coverage | 70% | 0% |
| Native test coverage | 60% | 0% |
| CI test execution | < 5 min | N/A |
| Tests per critical module | 20+ | 0-5 |
| Flaky test rate | < 1% | N/A |

---

## Dependencies

| Story | Depends On | Blocks |
|-------|-----------|--------|
| 9.1 | None | 9.4, 9.5, 9.6 |
| 9.2 | None | 9.7, 9.8 |
| 9.3 | 9.1, 9.2 | CI/CD setup |
| 9.4 | 9.1 | None |
| 9.5 | 9.1 | None |
| 9.6 | 9.1 | None |
| 9.7 | 9.2 | None |
| 9.8 | 9.2 | None |
| 9.9 | 9.1, 9.2 | None |

---

## Technical Decisions

### Why convex-test for Convex Backend?

1. **Official Convex testing library** - purpose-built for testing Convex functions
2. Provides real database context for mutations and queries
3. Uses vitest internally as the test runner (no separate config needed)
4. Supports transaction testing and index testing
5. Type-safe test contexts from your schema

### Why jest for Native?

1. Standard for React Native (jest-expo preset)
2. Works with Expo SDK 54
3. Excellent snapshot testing
4. Large ecosystem of matchers
5. @testing-library/react-native integration

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Existing tests fail after setup | Run in isolation first, fix before integrating |
| Convex-test compatibility issues | Fall back to mocking ctx.db if needed |
| Slow test execution | Parallel execution, test caching |
| Flaky tests from timing | Use testing-library waitFor, avoid timeouts |
| Coverage gaps after initial pass | Incremental coverage increase per sprint |

---

## Appendix: Testing Patterns

### Backend Test Pattern

```typescript
// convex/module.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { convexTest } from 'convex-test';
import schema from './schema';
import { seedRunner } from './test/mocks';

describe('ModuleName', () => {
  let ctx: ReturnType<typeof convexTest>;

  beforeEach(() => {
    ctx = convexTest(schema);
  });

  it('does something', async () => {
    const runnerId = await seedRunner(ctx);
    // test logic
    expect(result).toBe(expected);
  });
});
```

### Native Component Test Pattern

```typescript
// components/MyComponent.test.tsx
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Expected Text')).toBeTruthy();
  });

  it('handles user interaction', async () => {
    const onPress = jest.fn();
    const { getByTestId } = render(<MyComponent onPress={onPress} />);

    fireEvent.press(getByTestId('button'));

    await waitFor(() => {
      expect(onPress).toHaveBeenCalled();
    });
  });
});
```

### Native Hook Test Pattern

```typescript
// hooks/useMyHook.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useMyHook } from './useMyHook';

describe('useMyHook', () => {
  it('returns initial state', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe(initialValue);
  });

  it('updates state on action', () => {
    const { result } = renderHook(() => useMyHook());

    act(() => {
      result.current.doSomething();
    });

    expect(result.current.value).toBe(newValue);
  });
});
```
