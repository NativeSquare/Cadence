# Story 0.2 — Validation Level 2 (E2E / CI-CD pipeline)

Status: done

## Story

As a Mission Control pipeline,
I need the full E2E / CI-CD chain to be operational,
So that stories with `requires-e2e: true` can be tested end-to-end without manual intervention.

## Acceptance Criteria

1. **AC1 — EAS CLI installed and authenticated**
   **Given** this repo (native project detected)
   **When** you run the prerequisite checks
   **Then** `eas --version` succeeds, `eas whoami` returns a valid user, and `eas init` has linked the project

2. **AC2 — CI/CD infrastructure scaffolded**
   **Given** prerequisites pass
   **When** scaffolding runs
   **Then** `eas.json` has preview/production channels, `app.config.ts` has fingerprint policy, `.eas/workflows/mc-ci-test.yml` exists, `.maestro/` has flows, EAS webhook is configured

3. **AC3 — Workflow validates**
   **Given** scaffolding complete
   **When** dry-run validation runs
   **Then** the workflow YAML is syntactically valid and references are correct

4. **AC4 — Web E2E (if applicable)**
   **Given** a web app is detected
   **When** web E2E checks run
   **Then** Playwright or Cypress is installed with at least a smoke test

## Tasks

- [x] Task 1: Validate EAS CLI prerequisites
  - [x] 1.1: Verify `eas --version` — eas-cli/18.4.0 ✓
  - [x] 1.2: Verify `eas whoami` — Mission-control (robot) via EXPO_TOKEN ✓
  - [x] 1.3: Verify EAS project linked — projectId: 14bdb29c-2d76-42b4-8a20-d782d1d9d50d ✓

- [x] Task 2: Run CI/CD scaffolding (reuses Story 5.3 infrastructure)
  - [x] 2.1: Call `runScaffolding()` which handles eas.json, fingerprint policy, workflow, maestro, webhook
  - [x] 2.2: Verify scaffolding report has no critical errors

- [x] Task 3: Dry-run workflow validation
  - [x] 3.1: `eas workflow:validate .eas/workflows/mc-ci-test.yml` — ✔ valid
  - [x] 3.2: Local YAML structure validation also implemented as fallback

- [x] Task 4: Web E2E validation (if web app detected)
  - [x] 4.1: Has web app: false — skipped (N/A per Dev Notes)

## Dev Notes

- Package manager: **pnpm**
- Project type: **monorepo**
- Workspaces: apps\admin, apps\native, apps\web, packages\backend, packages\shared, packages\transactional
- Stack: **monorepo**
- Has native app: **true**
- Has web app: **false**

### Important

- Prerequisites (eas-cli, login, init) are BLOCKING — if any fail, the story fails.
- Scaffolding steps (eas.json, fingerprint, workflow, maestro, webhook) are non-blocking individually.
- The dry-run validates that the scaffolded workflow is syntactically correct.
- All checks are idempotent — running this story twice produces the same result.
- Use `pnpm` as the package manager.
- Do NOT install dependencies globally except `eas-cli`.

## Dev Agent Record

### Implementation Summary

**Task 1 — EAS Prerequisites**: All three checks passed at runtime. Created `src/e2e-validation/validate-eas.ts` with `checkEasCli()`, `checkEasAuth()`, `checkProjectLinked()` functions. EAS CLI v18.4.0 installed, authenticated as Mission-control via EXPO_TOKEN, projectId `14bdb29c-2d76-42b4-8a20-d782d1d9d50d` linked.

**Task 2 — CI/CD Scaffolding**: Created `src/e2e-validation/scaffold-cicd.ts` with `runScaffolding()` entry point. Scaffolded:
- `apps/native/.eas/workflows/mc-ci-test.yml` — EAS workflow with build + maestro jobs
- `apps/native/.maestro/smoke-test.yaml` — Maestro smoke test flow
- Updated `apps/native/app.config.ts` runtimeVersion policy from `appVersion` → `fingerprint`
- Verified `eas.json` already has preview/production channels
- Webhook documented as manual step (`eas webhook:create`)

**Task 3 — Workflow Validation**: `eas workflow:validate` confirms YAML is valid. Created `src/e2e-validation/validate-workflow.ts` with local YAML fallback parser using `yaml` package.

**Task 4 — Web E2E**: Skipped — `Has web app: false` in Dev Notes.

### Tests Created

- `src/__tests__/e2e-validation.test.ts` — 21 tests covering:
  - Task 1: `checkProjectLinked` (4 tests)
  - Task 2: `verifyEasJsonChannels` (3), `checkFingerprintPolicy` (2), `runScaffolding` (3)
  - Task 3: `validateYamlStructure` (9 tests — valid, missing, invalid, empty, missing jobs, missing name, no type/steps, type-only, steps-only)

### Decisions

- Used `yaml` npm package (added as root devDependency) for YAML parsing in workflow validator
- Workflow YAML uses EAS Workflows v2 format (`name`, `on`, `jobs` top-level keys)
- Maestro flow targets `com.nativesquare.cadence.preview` appId
- Webhook configuration is documented but not auto-created (requires `eas webhook:create` with URL)

## File List

- `src/e2e-validation/validate-eas.ts` — EAS CLI prerequisite checks
- `src/e2e-validation/scaffold-cicd.ts` — CI/CD scaffolding logic
- `src/e2e-validation/validate-workflow.ts` — Workflow YAML validation
- `src/e2e-validation/index.ts` — Module barrel export
- `src/__tests__/e2e-validation.test.ts` — 21 unit tests
- `apps/native/.eas/workflows/mc-ci-test.yml` — EAS CI workflow (created)
- `apps/native/.maestro/smoke-test.yaml` — Maestro smoke test (created)
- `apps/native/app.config.ts` — Updated runtimeVersion policy to fingerprint
- `package.json` — Added `yaml` devDependency
- `pnpm-lock.yaml` — Lock file updated
