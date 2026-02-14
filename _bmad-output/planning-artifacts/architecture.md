---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments:
  - prd-onboarding-mvp.md
  - product-brief-Cadence-2026-02-10.md
  - ux-onboarding-flow-v6-2026-02-13.md
  - research/domain-ai-running-coaching-research-2026-02-10.md
  - research/technical-wearable-api-landscape-research-2026-02-13.md
  - research/training-engine-architecture.md
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-02-13'
project_name: 'Cadence'
user_name: 'NativeSquare'
date: '2026-02-13'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
59 FRs across 9 domains: authentication, data integration, conversational flow, data analysis, goal capture, plan generation, progress tracking, monetization, and error handling. The core architectural challenge is the Generative UI paradigm — the LLM calls tools that render UI components dynamically, making this a tool-calling AI application rather than a traditional chat interface.

**Non-Functional Requirements:**
- Performance: Sub-2s streaming start, sub-15s data sync, sub-1s chart rendering
- Security: TLS 1.2+, platform secure storage for OAuth tokens, no plain-text health data logging
- Reliability: Network interruption recovery, partial progress persistence, graceful LLM fallbacks
- Accessibility: System font respect, 44pt touch targets, color-blind safe design

**Scale & Complexity:**
- Primary domain: Mobile (React Native/Expo) + AI/LLM integration
- Complexity level: HIGH
- Estimated architectural components: 15-20 major modules

### Technical Constraints & Dependencies

| Constraint | Impact |
|------------|--------|
| React Native + Expo | Framework choice, managed workflow, native module access via Expo modules |
| Vercel AI SDK | LLM integration, tool-calling support, streaming architecture |
| NativeWind + Design System | **MANDATORY** — token-based styling, semantic color system |
| iOS 15+ / Android 10+ | Platform API requirements for HealthKit/Health Connect |
| Strava + HealthKit (MVP) | Initial wearable integration scope |
| Wellness positioning | Regulatory constraint — no medical claims, GDPR/CCPA compliance |

### Cross-Cutting Concerns Identified

1. **Streaming Architecture** — Real-time LLM streaming to UI with haptic synchronization
2. **Design System** — NativeWind with semantic tokens matching Product Brief visual identity
3. **Data Persistence** — Runner Object survives restarts, interruptions; local-first with sync
4. **Error Resilience** — Graceful degradation for LLM failures, network issues, permission denials
5. **Dual-Path Parity** — Wearable and no-wearable flows must feel equally polished

---

## Starter Template Evaluation

### Existing Codebase Assessment

This is **NOT a greenfield project**. The monorepo is already established with significant infrastructure:

**Monorepo Structure (Turborepo + pnpm):**
- `apps/native` — Expo SDK 54 app (primary focus for onboarding MVP)
- `apps/admin` — Admin panel (Next.js)
- `apps/web` — Marketing/web app (Next.js)
- `packages/backend` — Convex backend with auth, migrations, emails
- `packages/shared` — Shared TypeScript code
- `packages/transactional` — React Email templates

### Native App Stack (apps/native)

| Layer | Implementation |
|-------|----------------|
| **Framework** | Expo SDK ~54.0.25, React Native 0.81.5, React 19.1.0 |
| **Styling** | NativeWind v4.2.1 with CSS variables design system |
| **Routing** | Expo Router (file-based) |
| **UI Primitives** | `@rn-primitives/*` — accessible component library |
| **Auth** | Convex auth with email/password, verification flows |
| **State** | React hooks + Convex real-time subscriptions |
| **Haptics** | expo-haptics integrated |
| **Icons** | Lucide React Native |

### Design System Status

The design system is **already configured** with semantic CSS variables in NativeWind:

- `--background: 0 0% 3.9%` — Near-black background (matches Product Brief)
- `--primary: 73 100% 61%` — Lime green accent (matches Product Brief)
- `--muted-foreground: 0 0% 63.9%` — Secondary text

**MANDATORY requirement**: Extend this system with additional semantic tokens for:
- Thinking stream styling (monospace text on card surface)
- Chart colors (RadarChart, ProgressChart)
- Gradient definitions for CTAs

### Onboarding Prototype Status

Onboarding components **already exist** in `apps/native/src/components/app/onboarding/`:

| Component | Status | Notes |
|-----------|--------|-------|
| `onboarding-flow.tsx` | Prototype | Scene-based flow controller with state machine |
| `streaming-text.tsx` | Built | Phrase streaming with haptic sync |
| `thinking-block.tsx` | Built | Collapsible thinking stream |
| `coach-text.tsx` | Built | Coach message rendering |
| `connection-card.tsx` | Built | Wearable connection UI (mock) |
| `section-flow.tsx` | Built | Question section flow |
| `question-inputs.tsx` | Built | Multiple choice, open input |

### Backend Stack (packages/backend)

| Layer | Implementation |
|-------|----------------|
| **Database** | Convex (real-time, serverless) |
| **Auth** | `@convex-dev/auth` with social login (Apple, Google) |
| **Email** | Resend via `@convex-dev/resend` |
| **Migrations** | `@convex-dev/migrations` |

### What Needs to be Added (Architecture Scope)

1. **Vercel AI SDK integration** — LLM tool-calling for generative UI
2. **Runner Object schema** — Convex schema for runner profile data
3. **Strava OAuth** — `expo-auth-session` integration
4. **HealthKit/Health Connect** — Native module integration
5. **Visual plan components** — RadarChart, ProgressChart, CalendarWidget
6. **Design system extension** — Additional tokens per Product Brief

**Note:** No starter template initialization needed. Architecture decisions focus on extending the existing codebase.

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
1. LLM Integration Architecture — Server-side via Convex HTTP Actions
2. Generative UI Pattern — AI SDK switch statement on `part.type`
3. Runner Object Schema — Hybrid single doc + activity log
4. Wearable Integration — Platform-specific (Strava server-side, HealthKit client-side)

**Important Decisions (Shape Architecture):**
5. Charting & Animation Libraries — Victory Native XL + Rive

**Deferred Decisions (Post-MVP):**
- Background sync scheduling
- Push notification architecture
- Offline-first caching strategy

---

### LLM Integration Architecture

| Aspect | Decision |
|--------|----------|
| **Execution** | Server-side via Convex HTTP Actions |
| **SDK** | Vercel AI SDK v6.x with `@ai-sdk/openai` |
| **Initial Model** | OpenAI gpt-4o (provider-swappable) |
| **Streaming** | SSE to client + delta persistence to Convex |
| **Tool Calling** | AI SDK `tool()` helper, results persist to Runner Object |

**Architecture Flow:**
```
Mobile Client → Convex HTTP Action → OpenAI (via AI SDK)
                      ↓
              Stream to client (SSE)
                      +
              Persist deltas to Convex
                      +
              Tool calls update Runner Object
```

**Runtime Compatibility (Verified February 2025):**

Convex default runtime is confirmed compatible with Vercel AI SDK v6.x:

| Requirement | Status |
|-------------|--------|
| `TextDecoderStream` | Supported (added April 2025) |
| `streamText()` in HTTP Actions | Works in default runtime |
| `toTextStreamResponse()` | Returns SSE stream correctly |
| Web Streams API | Full support (ReadableStream, WritableStream, TransformStream) |

**Two Streaming Approaches Available:**

| Approach | Implementation | Trade-offs |
|----------|----------------|------------|
| **HTTP Action Streaming** | `streamText().toTextStreamResponse()` returns SSE directly | Simple, real-time, no persistence |
| **Delta Streaming** | Chunks saved to DB via `DeltaStreamer`, clients subscribe via `useQuery` | Survives disconnects, multi-client sync, slightly more complex |

**Recommended:** Use Delta Streaming for onboarding flow (matches "partial progress persistence" NFR).

**Runtime Options:**
- Default runtime (no `"use node"`) — No cold starts, sufficient for AI SDK streaming
- Node.js runtime (`"use node"` directive) — Escape hatch if edge cases arise

**Optional Enhancement:** Convex provides an official `@convex-dev/agent` component that wraps AI SDK with built-in persistence via `agent.streamText({ saveStreamDeltas: true })`.

---

### Generative UI Implementation

| Aspect | Decision |
|--------|----------|
| **Pattern** | AI SDK switch statement on `part.type` |
| **Tool Naming** | `tool-${toolName}` convention |
| **State Handling** | `part.state` for streaming/loading/error |
| **Components** | Map tool types to existing onboarding components |

**Rendering Pattern:**
```typescript
{message.parts.map(part => {
  switch (part.type) {
    case 'tool-renderMultipleChoice':
      return <MultipleChoiceInput {...part.output} />;
    case 'tool-renderThinkingStream':
      return <ThinkingBlock {...part.output} />;
    // ... additional tools
  }
})}
```

---

### Data Architecture

| Aspect | Decision |
|--------|----------|
| **Pattern** | Single document per runner |
| **Main Table** | `runners` — current state, single subscription |
| **Validation** | Zod schemas (already in dependencies) |

**Schema Design:**
- `runners` — Complete Runner Object, updated atomically

---

### Wearable Integration

| Platform | Pattern |
|----------|---------|
| **Strava** | Server-side: OAuth via `expo-auth-session`, tokens in Convex, data fetched via Convex actions |
| **HealthKit** | Client-side: `react-native-health` with EAS Build custom dev client |

**Build Requirement:** EAS Build required (HealthKit needs custom native code, no Expo Go)

**Token Security:**
- Strava: Refresh tokens stored in Convex, access tokens cached with 5-min expiry buffer
- HealthKit: On-device only (Apple requirement)

---

### Visual Components & Animation

| Aspect | Decision |
|--------|----------|
| **Charting Library** | `victory-native` (victory-native-xl) — Skia-powered |
| **Animation Library** | `@rive-app/react-native` + `react-native-nitro-modules` |
| **RadarChart** | Custom via Skia or Rive animation |
| **ProgressChart** | Victory Native Line/Area charts |
| **CalendarWidget** | Custom component |

**Dependencies to Add:**

| Package | Purpose |
|---------|---------|
| `victory-native` | Cartesian charts (Line, Area, Bar, Pie) |
| `@shopify/react-native-skia` | Victory Native peer dep + custom drawing |
| `@rive-app/react-native` | Designer-friendly animations |
| `react-native-nitro-modules` | Rive peer dependency |

**Already Installed:**
- `react-native-reanimated` v4.1.6
- `react-native-gesture-handler` v2.28.0

---

### Decision Impact Analysis

**Implementation Sequence:**
1. Convex schema for Runner Object
2. AI SDK integration in Convex HTTP action
3. Tool definitions matching existing onboarding components
4. Strava OAuth flow
5. HealthKit integration (requires EAS Build switch)
6. Chart components + Rive animations with design system tokens

**Cross-Component Dependencies:**
- LLM tools → Runner Object schema (tools update specific fields)
- Streaming → Existing ThinkingBlock/StreamingText components
- Wearable data → Runner Object wearableData field
- Charts/Animations → Design system tokens for consistent styling

---

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**9 conflict areas addressed** to ensure AI agents write compatible, consistent code.

---

### Naming Patterns

**Convex (Database):**

| Element | Convention | Example |
|---------|------------|---------|
| Tables | camelCase plural | `runners` |
| Fields | camelCase | `userId`, `goalType` |
| Foreign Keys | `{table}Id` | `runnerId` |
| Indexes | `by_{field}` | `by_userId` |

**Files & Components:**

| Element | Convention | Example |
|---------|------------|---------|
| Components | PascalCase.tsx | `ThinkingBlock.tsx` |
| Hooks | use-{name}.ts | `use-runner.ts` |
| Utils | kebab-case.ts | `format-date.ts` |
| Directories | kebab-case | `onboarding/` |

**AI SDK Tools:**

| Element | Convention | Example |
|---------|------------|---------|
| Tool Names | camelCase | `renderMultipleChoice` |
| Part Types | `tool-{camelCase}` | `tool-renderMultipleChoice` |

**Tool Registry:**
- `renderMultipleChoice` — Multi-select question
- `renderOpenInput` — Free text input
- `renderThinkingStream` — Collapsible reasoning
- `renderConfirmation` — Yes/No confirmation
- `renderConnectionCard` — Wearable connection
- `renderRadarChart` — Runner profile visualization
- `renderProgressChart` — Training volume over time
- `renderCalendarWidget` — Weekly schedule

---

### Structure Patterns

**Component Organization:**
```
components/
├── app/onboarding/    # Onboarding flow components
├── app/charts/        # Chart components (NEW)
├── blocks/            # Reusable form blocks
├── custom/            # Custom UI components
├── shared/            # Cross-feature shared
└── ui/                # Primitives
```

---

### TypeScript Patterns

| Element | Convention | Example |
|---------|------------|---------|
| Types | PascalCase | `RunnerObject` |
| Props | `{Component}Props` | `ThinkingBlockProps` |
| Zod Schemas | camelCase + Schema | `runnerSchema` |
| Exports | Named (not default) | `export function X()` |

---

### State Management Patterns

| Scope | Pattern |
|-------|---------|
| Server State | Convex `useQuery`/`useMutation` |
| UI State | React `useState` |
| Streaming | Custom hooks returning `{ data, isStreaming }` |

**Anti-pattern:** Never duplicate Convex data in local state.

---

### Error Handling Patterns

**Use ConvexError with standardized codes:**
- `RUNNER_NOT_FOUND` — Runner profile doesn't exist
- `UNAUTHORIZED` — Authentication required
- `STRAVA_TOKEN_EXPIRED` — Token refresh needed
- `LLM_TIMEOUT` — AI response timeout
- `VALIDATION_ERROR` — Zod validation failed

---

### Design System Patterns

**Use semantic tokens, never hardcode colors:**
```typescript
// ✓ Good
className="bg-background text-primary"

// ✗ Bad
style={{ backgroundColor: '#0a0a0a' }}
```

**New tokens to define:**
- `--thinking-bg` — Thinking stream background
- `--chart-primary` — Primary chart color (lime)
- `--chart-secondary` — Secondary chart color

---

### Enforcement Guidelines

**All AI Agents MUST:**
1. Follow naming conventions exactly
2. Place files in designated directories
3. Use Convex for server state (no Redux/Zustand)
4. Use existing UI primitives before creating new ones
5. Extend design tokens rather than hardcoding
6. Use typed `ConvexError` for errors

**Verification:** ESLint, Prettier, TypeScript strict mode, Convex schema validation

---

## Project Structure & Boundaries

### Requirements to Structure Mapping

| FR Category | Location |
|-------------|----------|
| Account & Auth (FR1-5) | `apps/native/src/app/(auth)/` — EXISTS |
| Data Integration (FR6-12) | `packages/backend/convex/integrations/` — NEW |
| Conversational Flow (FR13-21) | `apps/native/src/components/app/onboarding/` — EXISTS |
| Data Analysis (FR22-28) | `packages/backend/convex/ai/` — NEW |
| Goal & Context (FR29-37) | `apps/native/src/components/app/onboarding/` — EXISTS |
| Plan Generation (FR38-47) | `packages/backend/convex/ai/` + `apps/native/src/components/app/charts/` — NEW |

---

### Complete Project Directory Structure

```
Cadence/
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
│
├── apps/
│   ├── native/                     # ══════ EXPO APP (MVP FOCUS) ══════
│   │   ├── package.json
│   │   ├── app.config.ts
│   │   ├── eas.json
│   │   ├── metro.config.js
│   │   ├── tailwind.config.ts
│   │   │
│   │   ├── assets/
│   │   │   └── rive/               # ← NEW: Rive animation files
│   │   │
│   │   └── src/
│   │       ├── app/
│   │       │   ├── (auth)/         # ← EXISTS
│   │       │   ├── (onboarding)/   # ← EXISTS
│   │       │   └── (app)/          # ← EXISTS
│   │       │
│   │       ├── components/
│   │       │   ├── ui/             # ← EXISTS: Primitives
│   │       │   ├── custom/         # ← EXISTS: Custom UI
│   │       │   ├── blocks/         # ← EXISTS: Form blocks
│   │       │   ├── shared/         # ← EXISTS: Cross-feature
│   │       │   └── app/
│   │       │       ├── onboarding/ # ← EXISTS + generative/ NEW
│   │       │       │   └── generative/    # ← NEW: AI SDK tool components
│   │       │       │       ├── tool-renderer.tsx
│   │       │       │       ├── MultipleChoiceInput.tsx
│   │       │       │       ├── OpenInput.tsx
│   │       │       │       ├── ThinkingStream.tsx
│   │       │       │       └── ConfirmationCard.tsx
│   │       │       │
│   │       │       └── charts/     # ← NEW: Chart components
│   │       │           ├── RadarChart.tsx
│   │       │           ├── ProgressChart.tsx
│   │       │           └── CalendarWidget.tsx
│   │       │
│   │       ├── hooks/
│   │       │   ├── use-runner.ts          # ← NEW
│   │       │   ├── use-onboarding.ts      # ← NEW
│   │       │   ├── use-strava.ts          # ← NEW
│   │       │   └── use-healthkit.ts       # ← NEW
│   │       │
│   │       └── lib/
│   │           ├── convex.ts              # ← NEW
│   │           └── ai-stream.ts           # ← NEW
│   │
│   ├── admin/                      # (NOT MVP)
│   └── web/                        # (NOT MVP)
│
├── packages/
│   ├── backend/
│   │   └── convex/
│   │       ├── schema.ts           # ← UPDATE: Add runners
│   │       ├── http.ts             # ← UPDATE: Add AI streaming endpoint
│   │       │
│   │       ├── table/
│   │       │   ├── runners.ts      # ← NEW
│   │       │
│   │       ├── ai/                 # ← NEW: AI/LLM integration
│   │       │   ├── http-action.ts
│   │       │   ├── tools/
│   │       │   │   ├── renderMultipleChoice.ts
│   │       │   │   ├── renderThinkingStream.ts
│   │       │   │   ├── renderRadarChart.ts
│   │       │   │   └── ...
│   │       │   └── prompts/
│   │       │       └── onboarding-coach.ts
│   │       │
│   │       └── integrations/       # ← NEW
│   │           └── strava/
│   │               ├── oauth.ts
│   │               └── activities.ts
│   │
│   ├── shared/
│   │   └── src/
│   │       ├── types/
│   │       │   ├── runner.ts       # ← NEW
│   │       │   └── goals.ts        # ← NEW
│   │       └── schemas/
│   │           └── runner.ts       # ← NEW
│   │
│   └── transactional/              # (EXISTS)
```

---

### Architectural Boundaries

**API Boundaries:**

| Boundary | Endpoint/Location |
|----------|-------------------|
| AI Streaming | Convex HTTP Action `/api/ai/stream` |
| Runner CRUD | Convex mutations/queries in `table/runners.ts` |
| Strava OAuth | External → Convex `integrations/strava/` |
| OpenAI | Server-side only via AI SDK |

**Component Boundaries:**

| Layer | Rule |
|-------|------|
| UI Components | No direct Convex calls — use hooks |
| Hooks | Bridge between UI and Convex |
| Convex Functions | Pure data operations, no UI logic |
| AI Tools | Return data, don't render |

**Data Flow:**

```
Mobile Client → HTTP Stream → Convex HTTP Action → OpenAI
                    ↓
            Stream to client (SSE)
                    +
            Tool calls → Convex mutations → runners table
                    ↓
            Client subscription → UI update
```

---

### Files to Create (MVP)

**~24 new files across:**

| Location | Count | Purpose |
|----------|-------|---------|
| `packages/backend/convex/ai/` | 12 | AI integration + tools |
| `packages/backend/convex/integrations/` | 3 | Strava OAuth |
| `packages/backend/convex/table/` | 1 | runners |
| `apps/native/src/components/app/charts/` | 4 | Chart components |
| `apps/native/src/components/app/onboarding/generative/` | 6 | Tool renderer |
| `apps/native/src/hooks/` | 4 | Data hooks |
| `packages/shared/src/` | 4 | Shared types |

---

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:**
All technology choices work together without conflicts:
- Expo SDK 54 + React 19.1.0 + NativeWind v4.2.1 — fully compatible, already running
- Vercel AI SDK v6 + Convex HTTP Actions — verified streaming support via SSE
- Victory Native XL + React Native Skia + Reanimated — peer dependencies satisfied
- Rive + Nitro Modules — compatible with Expo SDK 54 via EAS Build

**Pattern Consistency:**
Implementation patterns support all architectural decisions:
- Naming conventions (camelCase tables, PascalCase components) align with existing codebase
- AI SDK tool naming (`tool-{camelCase}`) integrates cleanly with generative UI pattern
- Error handling (ConvexError with codes) consistent with Convex patterns

**Structure Alignment:**
Project structure supports all architectural decisions:
- Feature-based component organization matches tool component mapping
- Convex directory structure supports AI integration layer
- Hooks layer properly bridges UI and Convex

### Requirements Coverage Validation

**Functional Requirements Coverage:**
51/51 MVP-scoped FRs (100%) have architectural support:
- FR1-5 (Auth): Existing Convex auth system
- FR6-12 (Data Integration): Strava OAuth + HealthKit patterns defined
- FR13-21 (Conversational Flow): AI SDK + generative UI architecture
- FR22-28 (Data Analysis): Convex AI actions + tool definitions
- FR29-37 (Goal & Context): Runner Object schema + tool registry
- FR38-47 (Plan Generation): Chart components + Rive animations

**Non-Functional Requirements Coverage:**
- Performance: Streaming architecture for sub-2s response start
- Security: Server-side token storage, TLS, no plain-text health data
- Reliability: ConvexError handling, graceful LLM fallbacks defined
- Accessibility: Design system tokens support system preferences

### Implementation Readiness Validation

**Decision Completeness:**
- All critical decisions documented with verified versions
- Implementation patterns comprehensive for naming, structure, state, errors
- Consistency rules clear and enforceable via ESLint/TypeScript
- Examples provided for generative UI, error handling, design tokens

**Structure Completeness:**
- Complete project tree with ~24 new files defined
- All directories and integration points specified
- Component boundaries well-defined (UI → Hooks → Convex)

**Pattern Completeness:**
- All conflict points addressed (naming, structure, format, communication)
- Tool registry fully enumerated
- Anti-patterns documented

### Gap Analysis Results

**Critical Gaps:** None identified

**Important Gaps (Addressable during implementation):**
- HealthKit permissions prompt copy (deferred to implementation)
- Rive animation asset specifications (depends on design deliverables)
- Exact RadarChart dimensions (iterative during UI development)

**Nice-to-Have Gaps:**
- Additional semantic tokens for future features
- Performance monitoring instrumentation
- Analytics event naming conventions

### Architecture Completeness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed (HIGH)
- [x] Technical constraints identified (6 constraints)
- [x] Cross-cutting concerns mapped (5 concerns)

**Architectural Decisions**
- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**
- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**
- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** HIGH — validation found no critical gaps

**Key Strengths:**
- Leverages existing, proven infrastructure (Convex, NativeWind, Expo Router)
- Clean separation between AI layer and UI components
- Hybrid Runner Object schema balances simplicity with auditability
- Platform-specific wearable patterns (server/client) follow vendor best practices

**Areas for Future Enhancement:**
- Background sync scheduling (post-MVP)
- Offline-first caching strategy (post-MVP)
- Push notification architecture (post-MVP)

### Implementation Handoff

**AI Agent Guidelines:**
- Follow all architectural decisions exactly as documented
- Use implementation patterns consistently across all components
- Respect project structure and boundaries
- Refer to this document for all architectural questions
- Extend design tokens rather than hardcoding colors

**First Implementation Priority:**

1. `packages/backend/convex/schema.ts` — Add `runners` table
2. `packages/backend/convex/table/runners.ts` — CRUD operations
3. `packages/backend/convex/http.ts` — Add AI streaming endpoint
4. `packages/backend/convex/ai/http-action.ts` — AI SDK integration
5. `packages/backend/convex/ai/tools/` — Tool definitions
6. `apps/native/src/components/app/onboarding/generative/tool-renderer.tsx` — Generative UI
7. Chart components after core flow is working

