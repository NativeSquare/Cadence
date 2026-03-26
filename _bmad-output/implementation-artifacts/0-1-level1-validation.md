# Story 0.1 — Validation Level 1 (tsc + unit tests)

Status: done

## Story

As a Mission Control pipeline,
I need the target repo's TypeScript compilation and unit tests to pass,
So that the dev->review gate never crashes on toolchain problems during real epic stories.

## Acceptance Criteria

1. **AC1 — TypeScript compilation passes**
   **Given** this repo
   **When** you run `npx tsc --build --noEmit`
   **Then** it exits with code 0 (no type errors)
   - If TypeScript is not installed, install it via `pnpm`
   - If there are pre-existing TS errors, fix them (path aliases, missing types, tsconfig issues)
   - For monorepos: ensure project references are correct and `tsc --build --noEmit` works

2. **AC2 — Unit test runner works**
   **Given** this repo
   **When** you run `npx vitest run`
   **Then** it exits with code 0
   - Test runner detected: **none (will install vitest)**
   - No test runner detected — you must install vitest and create a smoke test
   - If no test runner exists: install vitest (`pnpm add -D vitest`) and create `src/__tests__/smoke.test.ts` with `expect(true).toBe(true)`
   - If tests fail: fix the failing tests or configuration

3. **AC3 — Pre-commit hooks do not block commits**
   **Given** this repo (no pre-commit hooks detected)
   **When** you run `git commit --allow-empty -m "test: epic0 hook validation"`
   **Then** the commit succeeds (hooks pass or are configured to not block)
   - If the commit succeeds: clean up with `git reset HEAD~1`
   - If hooks fail and cannot be fixed quickly: add a `## Git Commit` section to the repo's `CLAUDE.md` instructing to use `--no-verify`

4. **AC4 — Idempotent pass-through**
   **Given** a repo where tsc passes, tests pass, and hooks are OK
   **When** this story runs
   **Then** it completes as `done` with no modifications needed

## Tasks

- [x] Task 1: Validate TypeScript (`npx tsc --build --noEmit`)
  - [x] 1.1: Verify TypeScript is installed (`node_modules/.bin/tsc` exists). If not, run `pnpm install`.
  - [x] 1.2: Run `npx tsc --build --noEmit` and check exit code
  - [x] 1.3: If tsc fails, analyze and fix errors (tsconfig paths, missing @types/*, project references)
  - [x] 1.4: Re-run `npx tsc --build --noEmit` until it passes

- [x] Task 2: Validate test runner (`npx vitest run`)
  - [x] 2.1: Verify test runner binary exists in `node_modules/.bin/`. If not, run `pnpm install`.
  - [x] 2.2: Run `npx vitest run` and check exit code
  - [x] 2.3: If no test runner detected: install vitest and create a smoke test
  - [x] 2.4: If tests fail, fix them
  - [x] 2.5: Re-run until exit code 0

- [x] Task 3: Validate pre-commit hooks
  - [x] 3.1: Run `git commit --allow-empty -m "test: epic0 hook validation"`
  - [x] 3.2: If commit succeeds, run `git reset HEAD~1` to clean up
  - [x] 3.3: If commit fails: try to fix hooks, or add `--no-verify` instruction to CLAUDE.md

- [x] Task 4: Final verification
  - [x] 4.1: Run `npx tsc --build --noEmit` one final time
  - [x] 4.2: Run `npx vitest run` one final time
  - [x] 4.3: Write signal file with status "done" if everything passes

## Dev Notes

- Package manager: **pnpm**
- Project type: **monorepo**
- Workspaces: apps\admin, apps\native, apps\web, packages\backend, packages\shared, packages\transactional
- Type checker: **tsc**
- Test runner: **none (will install vitest)**
   - No test runner detected — you must install vitest and create a smoke test
- Pre-commit hooks: **none detected**
- Install command: `pnpm install`

### Important

- Do NOT skip pre-existing errors. Fixing them is the whole point of this story.
- Do NOT install dependencies globally. Use `npx` or devDependencies.
- Do NOT replace config files wholesale. Fix what's broken.
- Use `pnpm` as the package manager (detected from lockfile/packageManager field).
- Commit your fixes with message: `fix(epic0): validate toolchain — tsc + unit tests + hooks`

## Dev Agent Record

### Task 1 — TypeScript compilation
- Installed `typescript` as root devDependency
- Created root `tsconfig.json` with project references to all workspace projects
- Added `composite: true` to all workspace tsconfigs (admin, web, native, backend/convex, transactional)
- Fixed 138 pre-existing TS errors across admin, web, native, backend:
  - **admin**: Added `convex` dependency, fixed implicit any types, changed invalid button variant `icon-xs` → `icon-sm`, fixed unknown type narrowing
  - **web**: Added `convex` dependency, fixed unknown type narrowing in getConvexErrorMessage
  - **native**: Fixed tabBarTestID access, SharedValue vs boolean types, missing PHASES export in calendar constants, victory-native chart generics (index signatures), image uploader type widening, StreamMessageContent type, null checks in use-analytics-data, push notification API updates, TS2742 portable type exports
  - **backend**: Added `@types/node` + `zod` dependencies, upgraded lib to ES2022, typed `connections.ts` empty object, fixed TS2742 on convex.config.ts with `any` annotation, fixed test mock assertions with `as unknown as`

### Task 2 — Vitest
- Installed `vitest` at root and in packages/backend
- Created `vitest.config.ts` scoping tests to `src/` and `packages/backend/`
- Created `src/__tests__/smoke.test.ts` smoke test
- Fixed failing planGenerator test (added "easy" tag to mock KB entry for tag-match coverage)
- Result: 6 test files, 216 tests all passing

### Task 3 — Pre-commit hooks
- `git commit --allow-empty` succeeded (no hooks blocking)
- Cleaned up with `git reset HEAD~1`

### Task 4 — Final verification
- `npx tsc --build --noEmit` → exit 0
- `npx vitest run` → 216/216 passing

## File List

- `tsconfig.json` (new — root project references)
- `vitest.config.ts` (new — test runner config)
- `src/__tests__/smoke.test.ts` (new — smoke test)
- `package.json` (added typescript, vitest devDeps)
- `pnpm-lock.yaml` (lockfile update)
- `apps/admin/package.json` (added convex dep)
- `apps/admin/tsconfig.json` (added composite)
- `apps/admin/src/components/app/dashboard/pending-invites.tsx` (typed param)
- `apps/admin/src/components/app/dashboard/user-table.tsx` (typed param)
- `apps/admin/src/components/ui/combobox.tsx` (icon-xs → icon-sm)
- `apps/admin/src/utils/getConvexErrorMessage.ts` (type narrowing)
- `apps/web/package.json` (added convex dep)
- `apps/web/tsconfig.json` (added composite)
- `apps/web/src/utils/getConvexErrorMessage.ts` (type narrowing)
- `apps/native/tsconfig.json` (added composite)
- `apps/native/src/app/(app)/(tabs)/_layout.tsx` (tabBarTestID cast)
- `apps/native/src/components/app/analytics/volume-bar-chart.tsx` (SharedValue fix)
- `apps/native/src/components/app/calendar/constants.ts` (added PHASES export)
- `apps/native/src/components/app/calendar/Legend.tsx` (typed params — if changed)
- `apps/native/src/components/app/session/PaceProfileChart.tsx` (index signature)
- `apps/native/src/components/app/session/SegmentBarChart.tsx` (index signature)
- `apps/native/src/components/custom/image-uploader.tsx` (widened type)
- `apps/native/src/components/app/feedback/image-uploader-field.tsx` (widened type)
- `apps/native/src/components/ui/aspect-ratio.tsx` (explicit export type)
- `apps/native/src/components/ui/collapsible.tsx` (explicit export type)
- `apps/native/src/hooks/use-ai-chat.ts` (StreamMessageContent type)
- `apps/native/src/hooks/use-analytics-data.ts` (null checks)
- `apps/native/src/hooks/use-push-notifications.ts` (notification API update)
- `packages/backend/package.json` (added @types/node, zod, vitest)
- `packages/backend/convex/tsconfig.json` (composite, ES2022 lib, node types)
- `packages/backend/convex/convex.config.ts` (any annotation for TS2742)
- `packages/backend/convex/integrations/connections.ts` (typed empty object)
- `packages/backend/convex/training/planGenerator.test.ts` (mock tag + assertion fixes)
- `packages/transactional/tsconfig.json` (added composite)
