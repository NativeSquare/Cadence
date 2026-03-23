# Story 0.3 — Validation Level 3 (Human review workflow)

Status: failed

## Story

As a Mission Control pipeline,
I need the human review workflow to be wired end-to-end,
So that stories with `requires-human-review: true` are routed through Approve/Reject before completion.

## Acceptance Criteria

1. **AC1 — Notification delivery**
   **Given** the Telegram notification system is configured
   **When** a test notification is sent via `notifyAlex()`
   **Then** the Telegram API returns a successful response (env vars `LINUS_BOT_TOKEN` and `ALEX_CHAT_ID` are set)

2. **AC2 — UI needs_review column**
   **Given** a story-run transitions to `needs_review`
   **When** the operator views the kanban board
   **Then** the story appears in the "Needs Review" column with Approve/Reject buttons visible

3. **AC3 — Approve workflow**
   **Given** a story in `needs_review` status
   **When** the operator clicks "Approve"
   **Then** `POST /review-story { action: "approve" }` triggers `storyRuns.approve` mutation, setting status to `done` with `completedAt`

4. **AC4 — Reject workflow**
   **Given** a story in `needs_review` status
   **When** the operator clicks "Reject" with a rejection report
   **Then** `POST /review-story { action: "reject", report }` triggers `storyRuns.reject` mutation, storing the `rejectionReport`

5. **AC5 — Rejection report passed to dev agent on resume**
   **Given** a rejected story with a `rejectionReport`
   **When** the story is resumed via Resume button
   **Then** the `rejectionReport` is included in the dev agent's `userMessage` for the next development cycle

## Tasks

- [ ] Task 1: Verify notification env vars (`LINUS_BOT_TOKEN`, `ALEX_CHAT_ID`)
- [ ] Task 2: Send test notification via `notifyAlex()` and confirm delivery
- [ ] Task 3: Verify UI wiring — `needs_review` column, Approve/Reject buttons, reject textarea
- [ ] Task 4: Verify `handleReviewStory()` approve/reject flow in sync-server
- [ ] Task 5: Verify `storyRuns.approve` and `storyRuns.reject` Convex mutations
- [ ] Task 6: Verify rejection report injection on resume

## Dev Notes

- Package manager: pnpm
- Project type: monorepo
- Workspaces: apps\admin, apps\native, apps\web, packages\backend, packages\shared, packages\transactional

- Notification system: Telegram via `notifyAlex()` (not Slack)
- UI components: dev-loop-tab.tsx (DO NOT modify)
- Convex mutations: storyRuns.ts (DO NOT modify)
- This is a verification-only story — no new code should be written by the dev agent

## Dev Agent Record

### Verification Date: 2026-03-23

### Result: FAILED — All prerequisite code is missing

All 6 tasks failed verification. This story requires verifying components that do not yet exist in the codebase. Exhaustive searches (glob, grep) across the entire monorepo confirmed zero matches outside the story spec itself.

#### Task 1: Verify notification env vars — FAILED
- `LINUS_BOT_TOKEN`: not found in any .env file or environment config
- `ALEX_CHAT_ID`: not found in any .env file or environment config
- Searched: `packages/backend/.env.preview`, `packages/backend/.env.prod`, all files matching `*env*`

#### Task 2: Send test notification via notifyAlex() — FAILED
- `notifyAlex()` function does not exist anywhere in the codebase
- Only notification code found: Expo push notifications in `packages/backend/convex/integrations/notifications.ts` (unrelated mobile push)

#### Task 3: Verify UI wiring — FAILED
- `dev-loop-tab.tsx` does not exist in any app (admin, web, native)
- No `needs_review` status handling found in any UI component
- No Approve/Reject button implementations found

#### Task 4: Verify handleReviewStory() — FAILED
- `handleReviewStory()` function does not exist anywhere
- No `/review-story` HTTP endpoint in `packages/backend/convex/http.ts`
- No sync-server directory or module found

#### Task 5: Verify storyRuns.approve and storyRuns.reject mutations — FAILED
- `storyRuns.ts` does not exist in `packages/backend/convex/table/`
- No `storyRuns` table, mutations, or schema definitions found

#### Task 6: Verify rejection report injection on resume — FAILED
- `rejectionReport` not referenced in any source file
- No resume logic found that could inject a rejection report

### Decisions
- Marked story as `failed` since this is verification-only and all prerequisites are absent
- No code was written (per story constraint)

## File List

No files changed (verification-only story, no implementation performed).
