# Cadence Backend Architecture v2

**Date:** 2026-02-16
**Author:** Winston (Architect) + NativeSquare
**Status:** Draft for Review
**Supersedes:** architecture.md (partial - backend sections only)

---

## Codebase Context

> **For agents working on this codebase**: This section provides essential context about the technology stack and project structure.

### Monorepo Structure

```
Cadence/
├── apps/
│   ├── native/                 # Expo React Native app (iOS/Android)
│   │   ├── src/
│   │   │   ├── components/     # UI components (onboarding, chat, viz)
│   │   │   ├── lib/            # Utilities, hooks, design tokens
│   │   │   └── app/            # Expo Router pages
│   │   └── app.json            # Expo config
│   │
│   └── web/                    # NextJS web app (landing, dashboard)
│       ├── src/
│       │   ├── app/            # App Router pages
│       │   └── components/
│       └── next.config.js
│
├── packages/
│   └── backend/                # Convex backend (shared by native + web)
│       └── convex/
│           ├── schema.ts       # Database schema
│           ├── table/          # Table definitions (runners, users, etc.)
│           ├── ai/             # AI streaming, tools, prompts
│           ├── integrations/   # Strava, HealthKit adapters
│           ├── training/       # Plan generation, knowledge base
│           └── lib/            # Shared utilities
│
└── package.json                # Workspace root (pnpm)
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Mobile App** | Expo + React Native | iOS/Android native app |
| **Web App** | NextJS 14 (App Router) | Landing page, web dashboard |
| **Backend** | Convex | Database, real-time, serverless functions |
| **AI** | OpenAI GPT-4o | Conversational AI, tool calling |
| **Auth** | Convex Auth | Social login (Apple, Google) |
| **Styling** | NativeWind (mobile), Tailwind (web) | Utility-first CSS |

### Convex Fundamentals

Convex is a **reactive backend** with TypeScript-first development. Key patterns:

```typescript
// QUERY: Read data (reactive, auto-updates UI)
export const getRunner = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// MUTATION: Write data (transactional)
export const updateRunner = mutation({
  args: { runnerId: v.id("runners"), update: v.any() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runnerId, args.update);
  },
});

// ACTION: Side effects (API calls, complex logic)
export const syncStrava = action({
  args: { runnerId: v.id("runners") },
  handler: async (ctx, args) => {
    // Can call external APIs
    const activities = await fetchFromStrava();
    // Must use runMutation/runQuery to access DB
    await ctx.runMutation(internal.activities.upsert, { ... });
  },
});
```

**Frontend usage (React hooks):**

```typescript
// In React components:
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function MyComponent() {
  // Reactive query - auto-updates when data changes
  const runner = useQuery(api.runners.getRunner, { userId });

  // Mutation function
  const updateRunner = useMutation(api.runners.updateRunner);

  // Call mutation
  await updateRunner({ runnerId, update: { ... } });
}
```

**CRITICAL**: Always use `useQuery` and `useMutation` hooks when interacting with Convex from React. This is one of the main reasons we use Convex - reactive data that auto-updates the UI.

---

## Executive Summary

This document defines the complete backend architecture for Cadence's AI running coach. It addresses three critical challenges:

1. **The Runner Object Problem**: How to structure user data for both conversational collection AND wearable data import, with a path to the Terra API aggregation layer.

2. **The Context Problem**: How to give the AI coach enough context to be genuinely helpful without overwhelming the context window or building complex infrastructure for MVP.

3. **The MVP vs Scale Problem**: How to ship in 5 days with Convex + LLM providers only, while designing for future complexity (queues, pipelines, multi-agent orchestration).

**Core Architecture Decision**: Build a **single-agent conversational system** with **structured data persistence** for MVP. The architecture is designed so that adding multi-agent orchestration, Terra API, and advanced memory systems are additive changes, not rewrites.

---

## Module Isolation Philosophy

> **CRITICAL**: The backend is composed of **isolated modules** that work independently but combine to create the complete system. This modularity enables independent testing, development, and scaling.

### Core Modules

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MODULE ISOLATION ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Each module has:                                                           │
│   • Single responsibility                                                    │
│   • Defined inputs and outputs                                               │
│   • No direct database access from other modules (use interfaces)            │
│   • Independent test suite                                                   │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                      MODULE 1: RUNNER DATA MODEL                      │  │
│   │                                                                       │  │
│   │   Responsibility: Store and manage runner profile state               │  │
│   │                                                                       │  │
│   │   Inputs:                                                             │  │
│   │   • User input (via Tool Handler)                                     │  │
│   │   • Inferred values (via Inference Engine interface)                  │  │
│   │                                                                       │  │
│   │   Outputs:                                                            │  │
│   │   • Complete Runner Object with provenance                            │  │
│   │                                                                       │  │
│   │   Files: convex/table/runners.ts, convex/runners/*.ts                 │  │
│   │   Interface: RunnerRepository                                         │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│                                      ▼                                       │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                      MODULE 2: INFERENCE ENGINE                       │  │
│   │                                                                       │  │
│   │   Responsibility: Calculate derived metrics from historical data     │  │
│   │                                                                       │  │
│   │   Inputs:                                                             │  │
│   │   • Historical data tables (activities, sleep, daily)                 │  │
│   │   • Runner profile (for context: age, injuries)                       │  │
│   │                                                                       │  │
│   │   Outputs:                                                            │  │
│   │   • CurrentState object (ATL, CTL, TSB, readiness, risk)              │  │
│   │                                                                       │  │
│   │   Files: convex/lib/inferenceEngine.ts                                │  │
│   │   Interface: InferenceEngine.calculate(runnerId) → CurrentState       │  │
│   │                                                                       │  │
│   │   ISOLATED: Does NOT write directly to runners table.                 │  │
│   │             Returns values that Runner module stores.                 │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│                                      ▼                                       │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                      MODULE 3: PLAN GENERATOR                         │  │
│   │                                                                       │  │
│   │   Responsibility: Create training plans from runner profile           │  │
│   │                                                                       │  │
│   │   Inputs:                                                             │  │
│   │   • Runner Object (complete profile)                                  │  │
│   │   • Knowledge Base entries (via KB interface)                         │  │
│   │   • Safeguard rules (via Safeguard interface)                         │  │
│   │                                                                       │  │
│   │   Outputs:                                                            │  │
│   │   • Training Plan with justifications at all zoom levels              │  │
│   │   • Planned Sessions with justifications                              │  │
│   │   • Decision audit trail                                              │  │
│   │                                                                       │  │
│   │   Files: convex/training/plan-generator.ts                            │  │
│   │   Interface: PlanGenerator.generate(runner) → Plan                    │  │
│   │                                                                       │  │
│   │   ISOLATED: Does NOT read directly from DB except via interfaces.     │  │
│   │             Receives Runner Object as input parameter.                │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│                                      ▼                                       │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                      MODULE 4: KNOWLEDGE BASE                         │  │
│   │                                                                       │  │
│   │   Responsibility: Store and query training science knowledge          │  │
│   │                                                                       │  │
│   │   Inputs:                                                             │  │
│   │   • Query context (tags, category, runner context)                    │  │
│   │                                                                       │  │
│   │   Outputs:                                                            │  │
│   │   • Relevant KB entries with summaries                                │  │
│   │                                                                       │  │
│   │   Files: convex/knowledge/query.ts, convex/schema/knowledgeBase.ts    │  │
│   │   Interface: KnowledgeBase.query(context) → KBEntry[]                 │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│                                      ▼                                       │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                      MODULE 5: SAFEGUARDS                             │  │
│   │                                                                       │  │
│   │   Responsibility: Validate decisions against safety rules             │  │
│   │                                                                       │  │
│   │   Inputs:                                                             │  │
│   │   • Proposed decision (field, value)                                  │  │
│   │   • Runner context (age, injuries, experience)                        │  │
│   │                                                                       │  │
│   │   Outputs:                                                            │  │
│   │   • Validation result (pass/fail/adjust)                              │  │
│   │   • Adjusted value if needed                                          │  │
│   │   • Reason for adjustment                                             │  │
│   │                                                                       │  │
│   │   Files: convex/safeguards/check.ts, convex/schema/safeguards.ts      │  │
│   │   Interface: Safeguards.check(decision, context) → ValidationResult   │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Module Communication Rules

1. **No Cross-Module Direct DB Access**: Modules don't read other modules' tables directly. Use interfaces.

2. **Explicit Dependencies**: Each module declares what it needs as function parameters.

3. **Stateless Calculations**: Inference Engine and Plan Generator are pure functions (given inputs, produce outputs).

4. **Single Writer Principle**: Only one module writes to each table.

| Table | Owner Module | Writers |
|-------|--------------|---------|
| `runners` | Runner Data Model | Tool Handler, Inference Engine (via interface) |
| `activities` | Historical Data | Wearable Adapter only |
| `trainingPlans` | Plan Generator | Plan Generator only |
| `knowledgeBase` | Knowledge Base | Admin/seeder only |
| `safeguards` | Safeguards | Admin/seeder only |

---

## Table of Contents

1. [Current State Assessment](#current-state-assessment)
2. [Data Architecture](#data-architecture)
3. [Wearable Integration Strategy](#wearable-integration-strategy)
4. [AI Architecture](#ai-architecture)
5. [Onboarding Flow Implementation](#onboarding-flow-implementation)
6. [Training Engine Integration](#training-engine-integration)
7. [MVP Scope Definition](#mvp-scope-definition)
8. [Implementation Roadmap](#implementation-roadmap)

---

## Current State Assessment

### What Already Works

| Component | Status | Location |
|-----------|--------|----------|
| Authentication | ✅ Complete | `packages/backend/convex/auth.ts` - Apple, Google, Password |
| User Table | ✅ Complete | `packages/backend/convex/table/users.ts` |
| Runner Object Schema | ✅ Complete | `packages/backend/convex/table/runners.ts` (740 lines) |
| Conversation Persistence | ✅ Complete | `packages/backend/convex/ai/messages.ts` |
| AI Streaming Endpoint | ✅ Complete | `packages/backend/convex/ai/http_action.ts` |
| Tool Definitions | ✅ Complete | `packages/backend/convex/ai/tools/index.ts` |
| System Prompt | ✅ Complete | `packages/backend/convex/ai/prompts/onboarding_coach.ts` |
| Strava Connection Schema | ✅ Schema only | `packages/backend/convex/table/stravaConnections.ts` |
| Onboarding UI | ✅ Complete | `apps/native/src/components/app/onboarding/` |
| Generative UI Tools | ✅ Complete | `apps/native/src/components/app/onboarding/generative/` |

### What's Missing for MVP

| Component | Status | Required For |
|-----------|--------|--------------|
| Tool Result → Runner Object | ❌ Not Implemented | Saving user responses to profile |
| Strava OAuth Flow | ❌ Not Implemented | Wearable data import |
| HealthKit Integration | ❌ Not Implemented | iOS health data import |
| Wearable Data → Runner Object | ❌ Not Implemented | Populating inferred fields |
| Plan Generation | ❌ Not Implemented | Creating training plans |
| Backend → Frontend Tool Wiring | ❌ Not Implemented | Real AI conversation |

---

## Data Architecture

### Design Principles

1. **Single Source of Truth**: The `runners` table is the canonical user profile. All data (conversational, wearable, inferred) flows into it.

2. **Terra-Informed Schema**: Structure wearable data fields to align with Terra's data models, making future migration trivial.

3. **Separation of Concerns**:
   - `runners` = current state (what we know now)
   - `activities` = historical records (what happened)
   - `messages` = conversation log (how we learned it)

4. **Progressive Enhancement**: Start with what users tell us, enhance with wearable data, refine with behavioral patterns.

### The Runner Object (Revised)

The existing schema is solid. Here's what needs to change:

```
runners (EXISTING - keep as-is for MVP)
├── identity { name, nameConfirmed }
├── physical { age, weight, height }
├── running { experienceLevel, monthsRunning, currentFrequency, ... }
├── goals { goalType, raceDistance, raceDate, targetTime, ... }
├── schedule { availableDays, blockedDays, preferredTime, ... }
├── health { pastInjuries, currentPain, recoveryStyle, ... }
├── coaching { coachingVoice, dataOrientation, biggestChallenge, ... }
├── connections { stravaConnected, wearableConnected, wearableType, ... }
├── inferred { avgWeeklyVolume, easyPaceActual, estimatedFitness, ... }
├── legal { termsAcceptedAt, privacyAcceptedAt, healthConsentAt, ... }
└── conversationState { dataCompleteness, readyForPlan, currentPhase, ... }
```

**Key Insight**: The current schema already handles both self-reported AND inferred data. The `inferred` section is where wearable-derived data goes. No schema change needed for MVP.

### New Table: Activities (For Wearable Data)

This table stores raw activity records from wearables. Designed to align with Terra's Activity model for future migration.

```typescript
// packages/backend/convex/table/activities.ts (NEW)

activities: defineTable({
  // Foreign keys
  runnerId: v.id("runners"),
  userId: v.id("users"),

  // Terra-aligned metadata
  externalId: v.optional(v.string()),        // summary_id equivalent
  source: v.string(),                         // "strava" | "healthkit" | "manual" | "terra"

  // Core fields (Terra Activity model aligned)
  startTime: v.number(),                      // Unix timestamp
  endTime: v.number(),
  activityType: v.string(),                   // "running" | "cycling" | "swimming" | etc.
  name: v.optional(v.string()),               // "Morning Run"

  // Distance & Movement
  distanceMeters: v.optional(v.number()),
  durationSeconds: v.optional(v.number()),
  elevationGainMeters: v.optional(v.number()),
  steps: v.optional(v.number()),

  // Pace & Speed
  avgPaceSecondsPerKm: v.optional(v.number()),
  maxPaceSecondsPerKm: v.optional(v.number()),
  avgSpeedKmh: v.optional(v.number()),

  // Heart Rate
  avgHeartRate: v.optional(v.number()),
  maxHeartRate: v.optional(v.number()),
  restingHeartRate: v.optional(v.number()),

  // Training Load
  calories: v.optional(v.number()),
  trainingLoad: v.optional(v.number()),       // Strava's suffer score, etc.
  perceivedExertion: v.optional(v.number()),  // 1-10 scale

  // Cadence
  avgCadence: v.optional(v.number()),

  // Recovery/Readiness (from daily summaries)
  recoveryScore: v.optional(v.number()),
  hrvMs: v.optional(v.number()),

  // Samples (store as JSON for MVP, separate table later)
  heartRateSamples: v.optional(v.string()),   // JSON array for MVP
  paceSamples: v.optional(v.string()),        // JSON array for MVP

  // Metadata
  rawPayload: v.optional(v.string()),         // Original API response (debugging)
  importedAt: v.number(),
  lastSyncedAt: v.number(),
})
.index("by_runnerId", ["runnerId"])
.index("by_userId", ["userId"])
.index("by_startTime", ["runnerId", "startTime"])
.index("by_source", ["runnerId", "source"])
.index("by_externalId", ["source", "externalId"])
```

### New Table: Daily Summaries (For Aggregate Health Data)

```typescript
// packages/backend/convex/table/dailySummaries.ts (NEW)

dailySummaries: defineTable({
  runnerId: v.id("runners"),
  userId: v.id("users"),

  // Date (one record per day)
  date: v.string(),                           // "2026-02-16" format

  // Activity Totals
  totalDistanceMeters: v.optional(v.number()),
  totalDurationSeconds: v.optional(v.number()),
  totalSteps: v.optional(v.number()),
  totalCalories: v.optional(v.number()),
  activityCount: v.optional(v.number()),

  // Heart Rate Summary
  restingHeartRate: v.optional(v.number()),
  avgHeartRate: v.optional(v.number()),
  maxHeartRate: v.optional(v.number()),
  hrvMs: v.optional(v.number()),

  // Sleep (from HealthKit/wearable)
  sleepDurationMinutes: v.optional(v.number()),
  sleepQuality: v.optional(v.string()),       // "good" | "fair" | "poor"
  deepSleepMinutes: v.optional(v.number()),
  remSleepMinutes: v.optional(v.number()),

  // Readiness/Recovery (device-specific)
  readinessScore: v.optional(v.number()),     // 0-100
  recoveryScore: v.optional(v.number()),      // 0-100
  stressLevel: v.optional(v.number()),        // 0-100

  // Source tracking
  sources: v.array(v.string()),               // ["strava", "healthkit"]

  // Metadata
  lastUpdatedAt: v.number(),
})
.index("by_runnerId_date", ["runnerId", "date"])
.index("by_userId", ["userId"])
```

### Data Flow Architecture (Complete)

The system has **TWO distinct data input paths** that feed into the Runner Object:

1. **User Input Path**: Onboarding conversation → Tool Handler → Runner Object (direct fields)
2. **Wearable Data Path**: APIs → Adapter Layer → Historical Tables → Inference Engine → Runner Object (inferred fields)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW ARCHITECTURE (COMPLETE)                          │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                      │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║  PATH 1: USER INPUT (Onboarding Conversation)                                  ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════╝  │
│                                                                                      │
│   ┌──────────────┐                                                                   │
│   │     USER     │                                                                   │
│   │  (Mobile UI) │                                                                   │
│   └──────┬───────┘                                                                   │
│          │                                                                           │
│          ▼                                                                           │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                      ONBOARDING CONVERSATION                                 │   │
│   │                                                                              │   │
│   │   AI Coach asks question → User responds via Tool UI → Tool Result           │   │
│   │                                                                              │   │
│   │   Example Flow:                                                              │   │
│   │   1. AI: "How many days per week can you realistically run?"                │   │
│   │   2. AI calls: renderSlider({ targetField: "schedule.availableDays" })      │   │
│   │   3. User slides to "4" and submits                                         │   │
│   │   4. Frontend sends: submitToolResult({ targetField, value: 4 })            │   │
│   └──────────────────────────────────┬──────────────────────────────────────────┘   │
│                                      │                                               │
│                                      ▼                                               │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                      TOOL RESULT HANDLER                                     │   │
│   │                                                                              │   │
│   │   1. Validate the tool result                                               │   │
│   │   2. Map targetField → Runner Object field                                  │   │
│   │   3. Update Runner Object DIRECTLY                                          │   │
│   │   4. Track data provenance: source = "user_reported"                        │   │
│   │   5. Recalculate data completeness                                          │   │
│   │   6. Append to conversation history                                         │   │
│   │                                                                              │   │
│   │   CRITICAL: User-provided values go DIRECTLY to Runner Object,              │   │
│   │   NOT through Inference Engine (they're facts, not calculations)            │   │
│   └──────────────────────────────────┬──────────────────────────────────────────┘   │
│                                      │                                               │
│                                      ▼                                               │
│                           ┌────────────────────┐                                     │
│                           │   RUNNER OBJECT    │                                     │
│                           │                    │                                     │
│                           │ Direct fields:     │                                     │
│                           │ • goals.*          │                                     │
│                           │ • schedule.*       │                                     │
│                           │ • health.*         │                                     │
│                           │ • coaching.*       │                                     │
│                           │ • running.easyPace │ (self-reported)                     │
│                           └────────────────────┘                                     │
│                                                                                      │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║  PATH 2: WEARABLE DATA (Strava, HealthKit, Garmin, etc.)                       ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════╝  │
│                                                                                      │
│   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐         │
│   │    STRAVA    │   │  HEALTHKIT   │   │    GARMIN    │   │    COROS     │         │
│   │  (OAuth API) │   │  (Native)    │   │  (Future)    │   │  (Future)    │         │
│   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘   └──────┬───────┘         │
│          │                  │                  │                  │                 │
│          ▼                  ▼                  ▼                  ▼                 │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                    WEARABLE ADAPTER LAYER (Convex Component)                 │   │
│   │                                                                              │   │
│   │   Built as a reusable Convex component, enhanced as sources are added.      │   │
│   │                                                                              │   │
│   │   normalizeActivity(stravaActivity) → Activity (affects activities table)   │   │
│   │   normalizeActivity(healthKitWorkout) → Activity                            │   │
│   │   normalizeSleep(healthKitSleep) → SleepSession (affects sleepSessions)     │   │
│   │   normalizeDailySummary(garminDaily) → DailySummary (affects dailySummaries)│   │
│   │   normalizeBody(healthKitWeight) → BodyMeasurement (affects bodyMeasurements)│   │
│   │                                                                              │   │
│   │   KEY: Each source can potentially affect ALL historical tables.            │   │
│   │   Future: Replace individual adapters with Terra webhook handler.           │   │
│   └────────────────────────────────┬────────────────────────────────────────────┘   │
│                                    │                                                 │
│                                    ▼                                                 │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                  HISTORICAL DATA TABLES (Convex Components)                  │   │
│   │                                                                              │   │
│   │   Built as reusable Convex components matching Terra data models 1-1.       │   │
│   │                                                                              │   │
│   │   ┌────────────────┐  ┌────────────────┐  ┌────────────────┐                │   │
│   │   │  activities    │  │ sleepSessions  │  │dailySummaries  │                │   │
│   │   │                │  │                │  │                │                │   │
│   │   │ - workouts     │  │ - sleep records│  │ - daily totals │                │   │
│   │   │ - runs         │  │ - HRV          │  │ - readiness    │                │   │
│   │   │ - GPS data     │  │ - stages       │  │ - stress       │                │   │
│   │   └───────┬────────┘  └───────┬────────┘  └───────┬────────┘                │   │
│   │           │                   │                   │                          │   │
│   │   ┌────────────────┐          │                   │                          │   │
│   │   │bodyMeasurements│          │                   │                          │   │
│   │   │                │          │                   │                          │   │
│   │   │ - weight       │          │                   │                          │   │
│   │   │ - body comp    │          │                   │                          │   │
│   │   └───────┬────────┘          │                   │                          │   │
│   │           │                   │                   │                          │   │
│   │           └───────────────────┼───────────────────┘                          │   │
│   │                               │                                              │   │
│   │                               ▼                                              │   │
│   │          ┌──────────────────────────────────────────┐                        │   │
│   │          │           SOURCE PRECEDENCE               │                        │   │
│   │          │                                          │                        │   │
│   │          │ When multiple sources provide same data: │                        │   │
│   │          │                                          │                        │   │
│   │          │ 1. User manual entry (highest trust)     │                        │   │
│   │          │ 2. Primary wearable device               │                        │   │
│   │          │ 3. Secondary connected sources           │                        │   │
│   │          │ 4. Inferred/calculated (lowest trust)    │                        │   │
│   │          │                                          │                        │   │
│   │          │ Configurable per-field, stored in        │                        │   │
│   │          │ runner.connections.sourcePriority        │                        │   │
│   │          └──────────────────┬───────────────────────┘                        │   │
│   │                             │                                                │   │
│   └─────────────────────────────┼────────────────────────────────────────────────┘   │
│                                 │                                                    │
│                                 ▼                                                    │
│   ┌─────────────────────────────────────────────────────────────────────────────┐   │
│   │                         INFERENCE ENGINE                                     │   │
│   │                                                                              │   │
│   │   Runs on: data import, daily cron, before plan generation                  │   │
│   │                                                                              │   │
│   │   Calculates (from historical tables):                                       │   │
│   │   - avgWeeklyVolume (from activities, last 4 weeks)                         │   │
│   │   - actualEasyPace (from HR zones in activities)                            │   │
│   │   - trainingLoadTrend (ATL/CTL from recent runs)                            │   │
│   │   - estimatedFitness (VDOT estimation from race efforts)                    │   │
│   │   - injuryRiskFactors (from volume ramp + injury history)                   │   │
│   │   - consistency score (from training patterns)                              │   │
│   │                                                                              │   │
│   │   Updates: runners.currentState (inferred fields ONLY)                      │   │
│   │   Does NOT overwrite user-provided fields                                   │   │
│   └──────────────────────────────┬──────────────────────────────────────────────┘   │
│                                  │                                                   │
│                                  ▼                                                   │
│                        ┌────────────────────┐                                        │
│                        │   RUNNER OBJECT    │                                        │
│                        │                    │                                        │
│                        │ Inferred fields:   │                                        │
│                        │ • currentState.*   │                                        │
│                        │ • running.actual*  │                                        │
│                        │ • running.vdot     │                                        │
│                        └────────────────────┘                                        │
│                                                                                      │
│  ╔═══════════════════════════════════════════════════════════════════════════════╗  │
│  ║  DOWNSTREAM: Plan Generation & AI Coaching                                    ║  │
│  ╚═══════════════════════════════════════════════════════════════════════════════╝  │
│                                                                                      │
│                        ┌────────────────────┐                                        │
│                        │   RUNNER OBJECT    │                                        │
│                        │   (Complete View)  │                                        │
│                        │                    │                                        │
│                        │ User-reported +    │                                        │
│                        │ Inferred +         │                                        │
│                        │ Connections        │                                        │
│                        └─────────┬──────────┘                                        │
│                                  │                                                   │
│              ┌───────────────────┼───────────────────┐                               │
│              ▼                   ▼                   ▼                               │
│   ┌────────────────┐   ┌────────────────┐   ┌────────────────┐                      │
│   │ AI CONTEXT     │   │PLAN GENERATOR  │   │  SAFEGUARDS    │                      │
│   │ ASSEMBLY       │   │                │   │    CHECK       │                      │
│   │                │   │ Expert Scaffold │   │                │                      │
│   │ Builds prompt  │   │ + Knowledge    │   │ Validates all  │                      │
│   │ for coach AI   │   │ Base + LLM     │   │ decisions      │                      │
│   └────────────────┘   └────────────────┘   └────────────────┘                      │
│                                                                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Wearable Integration Strategy

### MVP Strategy: Direct Integrations

For MVP, we integrate directly with Strava and HealthKit. This is more work than Terra but:
- Zero per-user costs
- Full control over data
- Faster iteration on what data matters

**Post-MVP**: Evaluate Terra API based on user demand for other wearables (Garmin, COROS, Polar).

### Strava Integration

```typescript
// packages/backend/convex/integrations/strava/oauth.ts

// 1. Generate auth URL (called from frontend)
export const getAuthUrl = action({
  handler: async (ctx) => {
    const redirectUri = `${process.env.CONVEX_SITE_URL}/api/strava/callback`;
    const scope = "activity:read_all,profile:read_all";
    return `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${redirectUri}&scope=${scope}`;
  }
});

// 2. OAuth callback handler (HTTP route)
export const handleCallback = httpAction(async (ctx, request) => {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");

  // Exchange code for tokens
  const tokenResponse = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    body: JSON.stringify({
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code"
    })
  });

  const tokens = await tokenResponse.json();

  // Store connection
  await ctx.runMutation(internal.strava.saveConnection, {
    athleteId: tokens.athlete.id,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expires_at,
  });

  // Trigger initial sync
  await ctx.scheduler.runAfter(0, internal.strava.syncActivities, { ... });

  // Redirect back to app
  return Response.redirect(`cadence://onboarding/wearable-success`);
});

// 3. Sync activities (scheduled + on-demand)
export const syncActivities = internalAction({
  args: { runnerId: v.id("runners"), fullSync: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const connection = await ctx.runQuery(internal.strava.getConnection, { ... });

    // Refresh token if needed
    if (connection.expiresAt < Date.now() / 1000) {
      await refreshToken(ctx, connection);
    }

    // Fetch activities (last 30 days for initial, last 7 days for incremental)
    const activities = await fetchStravaActivities(connection.accessToken, {
      after: args.fullSync ? thirtyDaysAgo : sevenDaysAgo
    });

    // Normalize and store
    for (const activity of activities) {
      const normalized = normalizeStravaActivity(activity);
      await ctx.runMutation(internal.activities.upsert, normalized);
    }

    // Update runner.inferred
    await ctx.runMutation(internal.runners.recalculateInferred, { runnerId: args.runnerId });
  }
});
```

### HealthKit Integration (iOS Only)

HealthKit runs client-side. The native app reads data and sends it to Convex.

```typescript
// apps/native/src/lib/healthkit.ts

import AppleHealthKit from 'react-native-health';

export async function syncHealthKitData(runnerId: string) {
  const options = {
    startDate: thirtyDaysAgo.toISOString(),
    endDate: new Date().toISOString(),
  };

  // Get workouts
  const workouts = await AppleHealthKit.getWorkouts(options);

  // Get daily summaries (steps, heart rate, sleep)
  const steps = await AppleHealthKit.getDailyStepCountSamples(options);
  const heartRate = await AppleHealthKit.getHeartRateSamples(options);
  const sleep = await AppleHealthKit.getSleepSamples(options);

  // Normalize and send to Convex
  const normalizedActivities = workouts
    .filter(w => w.activityType === 'Running')
    .map(normalizeHealthKitWorkout);

  const normalizedSummaries = aggregateToDailySummaries(steps, heartRate, sleep);

  // Batch upsert to Convex
  await convex.mutation(api.integrations.healthkit.syncBatch, {
    runnerId,
    activities: normalizedActivities,
    dailySummaries: normalizedSummaries,
  });
}
```

### Normalizer Functions

```typescript
// packages/backend/convex/integrations/normalizers.ts

export function normalizeStravaActivity(strava: StravaActivity): Activity {
  return {
    externalId: strava.id.toString(),
    source: "strava",
    startTime: new Date(strava.start_date).getTime(),
    endTime: new Date(strava.start_date).getTime() + strava.elapsed_time * 1000,
    activityType: mapStravaType(strava.type), // "Run" → "running"
    name: strava.name,
    distanceMeters: strava.distance,
    durationSeconds: strava.moving_time,
    elevationGainMeters: strava.total_elevation_gain,
    avgPaceSecondsPerKm: strava.moving_time / (strava.distance / 1000),
    avgHeartRate: strava.average_heartrate,
    maxHeartRate: strava.max_heartrate,
    calories: strava.calories,
    trainingLoad: strava.suffer_score,
    avgCadence: strava.average_cadence ? strava.average_cadence * 2 : undefined,
  };
}

export function normalizeHealthKitWorkout(hk: HKWorkout): Activity {
  return {
    externalId: hk.uuid,
    source: "healthkit",
    startTime: new Date(hk.startDate).getTime(),
    endTime: new Date(hk.endDate).getTime(),
    activityType: "running", // We filter for running workouts
    name: `HealthKit Run`,
    distanceMeters: hk.distance,
    durationSeconds: hk.duration,
    calories: hk.calories,
    avgHeartRate: hk.metadata?.HKAverageHeartRate,
    // HealthKit doesn't provide pace directly, calculate it
    avgPaceSecondsPerKm: hk.duration / (hk.distance / 1000),
  };
}
```

---

## AI Architecture

### MVP: Single-Agent with Rich Context

For MVP, we use a single conversational agent. The sophistication comes from:
1. **Rich context assembly** (not multi-agent orchestration)
2. **Structured tool outputs** (not free-form text)
3. **Persistent memory** (via conversation history + runner profile)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        AI ARCHITECTURE (MVP)                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      CONTEXT ASSEMBLY                                │   │
│   │                                                                      │   │
│   │   buildSystemPrompt(runner, conversation, recentActivities)         │   │
│   │                                                                      │   │
│   │   Components:                                                        │   │
│   │   ├── Base prompt (coaching persona, rules)          ~500 tokens    │   │
│   │   ├── Runner profile summary                          ~800 tokens    │   │
│   │   ├── Recent activities summary (4 weeks)            ~400 tokens    │   │
│   │   ├── Current conversation context                   ~500 tokens    │   │
│   │   ├── Phase-specific instructions                    ~300 tokens    │   │
│   │   └── Tool definitions                               ~600 tokens    │   │
│   │                                                      ──────────      │   │
│   │                                               Total: ~3100 tokens    │   │
│   │                                                                      │   │
│   │   Response reserve: ~1500 tokens                                     │   │
│   │   ─────────────────────────────────────────────────────────────     │   │
│   │   Working context: ~4600 tokens (well within 128k limit)             │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      AI STREAMING ENDPOINT                           │   │
│   │                                                                      │   │
│   │   POST /api/ai/stream                                                │   │
│   │                                                                      │   │
│   │   1. Authenticate user                                               │   │
│   │   2. Get or create conversation                                      │   │
│   │   3. Fetch runner profile                                            │   │
│   │   4. Fetch recent activities (summarized)                            │   │
│   │   5. Build system prompt with all context                            │   │
│   │   6. Stream response with tool calls                                 │   │
│   │   7. Persist message to conversation                                 │   │
│   │   8. Return SSE stream                                               │   │
│   │                                                                      │   │
│   │   Model: gpt-4o (fast, good tool calling)                            │   │
│   │   Fallback: gpt-4o-mini (cost savings, still capable)               │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      TOOL EXECUTION FLOW                             │   │
│   │                                                                      │   │
│   │   Frontend receives tool call → Renders UI component                │   │
│   │                                    │                                 │   │
│   │                                    ▼                                 │   │
│   │   User submits response ─────► POST /api/ai/tool-result             │   │
│   │                                    │                                 │   │
│   │                                    ▼                                 │   │
│   │   Backend: updateRunner() with field mapping                        │   │
│   │   Backend: appendToolResult() to conversation                       │   │
│   │   Backend: Continue streaming if more to say                        │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Tool Result → Runner Object Mapping

This is the critical piece that's currently missing. When a tool returns a result, we need to map it to the runner profile.

**CRITICAL: Justification Tracking for User Input (Path 1)**

Every piece of user input is stored with **provenance metadata** so the system can later explain: "You told me X, so I stored X." This is essential for justifications.

```typescript
// packages/backend/convex/ai/types.ts

/**
 * DataProvenance tracks WHERE data came from, so justifications can reference it.
 *
 * Example: When plan says "4 days/week because that's your availability",
 * we need to trace back to: "User selected 4 via slider on question about available days"
 */
interface DataProvenance {
  source: "user_input" | "wearable" | "inferred" | "default";

  // For user_input: how they provided it
  inputMethod?: "slider" | "selection" | "text" | "confirmation" | "multi_select";

  // The question that was asked (for justification: "You were asked X")
  questionAsked?: string;

  // The tool that collected it
  toolName?: string;
  toolCallId?: string;

  // When it was collected
  collectedAt: number;

  // Conversation context
  conversationId?: Id<"conversations">;
  messageIndex?: number;  // Which message in the conversation
}

/**
 * FieldValue wraps every Runner Object field with provenance.
 */
interface FieldValue<T> {
  value: T;
  provenance: DataProvenance;

  // For inferred values: confidence and reasoning
  confidence?: number;      // 0-1
  inferredFrom?: string[];  // ["activities.last4weeks", "hr_zones"]
}
```

**How Provenance Enables Justifications:**

```typescript
// When generating a plan justification:

const runner = await getRunner(runnerId);

// Build justification that references the actual question asked
if (runner.schedule.availableDays.provenance.source === "user_input") {
  const justification = buildJustification({
    decision: "4 sessions per week",
    because: [{
      factor: "available_days",
      value: runner.schedule.availableDays.value,
      provenanceExplanation: `You said you can run ${runner.schedule.availableDays.value} days per week`,
      originalQuestion: runner.schedule.availableDays.provenance.questionAsked,
      // "How many days per week can you realistically run?"
    }]
  });
  // Output: "4 sessions per week because you said you can run 4 days per week"
}
```

**Field Mappings with Provenance:**

```typescript
// packages/backend/convex/ai/tool-result-handler.ts

const FIELD_MAPPINGS: Record<string, (value: any) => Partial<RunnerUpdate>> = {
  // Profile fields
  "running.experienceLevel": (v) => ({ running: { experienceLevel: v } }),
  "running.monthsRunning": (v) => ({ running: { monthsRunning: parseInt(v) } }),
  "running.currentFrequency": (v) => ({ running: { currentFrequency: parseInt(v) } }),
  "running.currentVolume": (v) => ({ running: { currentVolume: parseVolume(v) } }),
  "running.easyPace": (v) => ({ running: { easyPace: v } }),
  "running.longestRecentRun": (v) => ({ running: { longestRecentRun: parseDistance(v) } }),

  // Goal fields
  "goals.goalType": (v) => ({ goals: { goalType: v } }),
  "goals.raceDistance": (v) => ({ goals: { raceDistance: parseRaceDistance(v) } }),
  "goals.raceDate": (v) => ({ goals: { raceDate: parseDate(v) } }),
  "goals.targetTime": (v) => ({ goals: { targetTime: parseTime(v) } }),

  // Schedule fields
  "schedule.availableDays": (v) => ({ schedule: { availableDays: parseInt(v) } }),
  "schedule.blockedDays": (v) => ({ schedule: { blockedDays: v } }),
  "schedule.preferredTime": (v) => ({ schedule: { preferredTime: v } }),

  // Health fields
  "health.pastInjuries": (v) => ({ health: { pastInjuries: v } }),
  "health.currentPain": (v) => ({ health: { currentPain: v } }),
  "health.recoveryStyle": (v) => ({ health: { recoveryStyle: v } }),
  "health.sleepQuality": (v) => ({ health: { sleepQuality: v } }),
  "health.stressLevel": (v) => ({ health: { stressLevel: v } }),

  // Coaching fields
  "coaching.coachingVoice": (v) => ({ coaching: { coachingVoice: v } }),
  "coaching.dataOrientation": (v) => ({ coaching: { dataOrientation: v } }),
  "coaching.biggestChallenge": (v) => ({ coaching: { biggestChallenge: v } }),

  // Connections
  "connections.stravaConnected": (v) => ({ connections: { stravaConnected: v === true } }),
  "connections.wearableConnected": (v) => ({ connections: { wearableConnected: v === true } }),
  "connections.wearableType": (v) => ({ connections: { wearableType: v } }),
};

export const handleToolResult = mutation({
  args: {
    conversationId: v.id("conversations"),
    toolCallId: v.string(),
    toolName: v.string(),
    targetField: v.string(),
    value: v.any(),
    questionAsked: v.optional(v.string()),  // The question that prompted this response
    inputMethod: v.optional(v.string()),     // "slider" | "selection" | etc.
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    const runner = await ctx.db.get(conversation.runnerId);
    const messageCount = await ctx.db
      .query("messages")
      .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
      .collect();

    // Build provenance for this field
    const provenance: DataProvenance = {
      source: "user_input",
      inputMethod: args.inputMethod as any,
      questionAsked: args.questionAsked,
      toolName: args.toolName,
      toolCallId: args.toolCallId,
      collectedAt: Date.now(),
      conversationId: args.conversationId,
      messageIndex: messageCount.length,
    };

    // Map tool result to runner update WITH provenance
    const mapper = FIELD_MAPPINGS[args.targetField];
    if (mapper) {
      const baseUpdate = mapper(args.value);
      // Wrap value with provenance
      const updateWithProvenance = wrapWithProvenance(baseUpdate, provenance);
      await ctx.db.patch(runner._id, deepMerge(runner, updateWithProvenance));
    }

    // Recalculate completeness and phase
    await recalculateDataCompleteness(ctx, runner._id);

    // Append tool result to conversation (also serves as audit trail)
    await appendToolResult(ctx, args.conversationId, {
      toolCallId: args.toolCallId,
      toolName: args.toolName,
      targetField: args.targetField,
      result: { success: true, value: args.value },
      provenance,  // Store provenance in conversation too for debugging
    });
  }
});

// Helper to wrap field updates with provenance
function wrapWithProvenance(
  update: Partial<Runner>,
  provenance: DataProvenance
): Partial<Runner> {
  // Recursively wrap leaf values with { value, provenance }
  // This allows the justification system to trace any field back to its source
  return deepMapLeaves(update, (value) => ({
    value,
    provenance,
  }));
}
```

### Context Assembly Implementation

```typescript
// packages/backend/convex/ai/context.ts

export async function buildCoachContext(
  ctx: QueryCtx,
  runnerId: Id<"runners">
): Promise<CoachContext> {
  const runner = await ctx.db.get(runnerId);
  const conversation = await getActiveConversation(ctx, runnerId);
  const recentMessages = await getRecentMessages(ctx, conversation._id, 20);
  const recentActivities = await getRecentActivities(ctx, runnerId, 28); // 4 weeks
  const dailySummaries = await getRecentDailySummaries(ctx, runnerId, 7);

  return {
    runner: summarizeRunner(runner),
    conversation: {
      phase: conversation.phase,
      messageCount: recentMessages.length,
      lastUserMessage: recentMessages.find(m => m.role === "user")?.content,
    },
    activities: summarizeActivities(recentActivities),
    wellness: summarizeDailySummaries(dailySummaries),
  };
}

function summarizeActivities(activities: Activity[]): string {
  if (activities.length === 0) {
    return "No recent activity data available.";
  }

  const stats = {
    totalRuns: activities.filter(a => a.activityType === "running").length,
    totalDistance: activities.reduce((sum, a) => sum + (a.distanceMeters || 0), 0) / 1000,
    avgPace: calculateAvgPace(activities),
    longestRun: Math.max(...activities.map(a => a.distanceMeters || 0)) / 1000,
    totalElevation: activities.reduce((sum, a) => sum + (a.elevationGainMeters || 0), 0),
  };

  return `Last 4 weeks: ${stats.totalRuns} runs, ${stats.totalDistance.toFixed(1)}km total, ` +
         `avg pace ${stats.avgPace}, longest run ${stats.longestRun.toFixed(1)}km`;
}
```

---

## Onboarding Flow Implementation

### Phase Progression

The conversation moves through phases based on data completeness:

```
intro → data_bridge → profile → goals → schedule → health → coaching → analysis → complete
```

**Key Rule**: The AI doesn't explicitly announce phases. It flows naturally, using `renderProgress` and `renderConfirmation` at transition points.

### Onboarding Questions: Mandatory vs Adaptive

Not all questions are created equal. Some MUST be asked, others depend on runner profile or wearable data.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ONBOARDING QUESTION LOGIC                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  MANDATORY QUESTIONS (Always asked, regardless of wearable connection)      │
│  ══════════════════════════════════════════════════════════════════════════ │
│                                                                              │
│  Phase: INTRO                                                                │
│  ├── identity.name          "What should I call you?"         ALWAYS        │
│  └── identity.nameConfirmed "Is [name] correct?"              ALWAYS        │
│                                                                              │
│  Phase: GOALS (These define WHY we're training)                             │
│  ├── goals.goalType         "Race / Speed / Base building?"   ALWAYS        │
│  ├── goals.raceDistance     "Which distance?"                 IF race       │
│  ├── goals.raceDate         "When is the race?"               IF race       │
│  └── goals.targetTime       "Do you have a time goal?"        IF race       │
│                                                                              │
│  Phase: SCHEDULE (Constraints we can't infer)                               │
│  ├── schedule.availableDays "How many days can you run?"      ALWAYS        │
│  ├── schedule.blockedDays   "Any days that never work?"       ALWAYS        │
│  └── schedule.preferredTime "Morning, midday, or evening?"    ALWAYS        │
│                                                                              │
│  Phase: HEALTH (Safety-critical, never skip)                                │
│  ├── health.pastInjuries    "Any past running injuries?"      ALWAYS        │
│  └── health.currentPain     "Any current pain/discomfort?"    ALWAYS        │
│                                                                              │
│  Phase: COACHING (Personalization)                                          │
│  └── coaching.coachingVoice "How should I coach you?"         ALWAYS        │
│                                                                              │
│  ADAPTIVE QUESTIONS (Asked only if data not available)                      │
│  ══════════════════════════════════════════════════════════════════════════ │
│                                                                              │
│  Phase: DATA_BRIDGE                                                         │
│  └── connections.wearable   "Connect Strava/HealthKit?"       ALWAYS (choice)│
│                                                                              │
│  Phase: PROFILE (Can be inferred from wearable)                             │
│  ├── running.experienceLevel "How would you describe...?"     ALWAYS *      │
│  ├── running.currentFrequency "How many days/week running?"   IF no wearable│
│  ├── running.currentVolume   "Roughly how many km/week?"      IF no wearable│
│  ├── running.easyPace        "What's your easy pace?"         IF no wearable│
│  └── running.longestRecentRun "Longest run recently?"         IF no wearable│
│                                                                              │
│  * experienceLevel is ALWAYS asked because it's about self-perception,      │
│    not data. A "serious" runner with low volume is different from a         │
│    "beginner" with high volume.                                             │
│                                                                              │
│  CONDITIONAL QUESTIONS (Based on answers to previous questions)             │
│  ══════════════════════════════════════════════════════════════════════════ │
│                                                                              │
│  IF pastInjuries includes shin_splints:                                     │
│  └── "How did they affect your training?"                     CONDITIONAL   │
│                                                                              │
│  IF goalType === "race" AND raceDistance >= 21km (half+):                  │
│  └── "Have you run this distance before?"                     CONDITIONAL   │
│                                                                              │
│  IF wearable connected AND data shows inconsistent training:               │
│  └── "I noticed some gaps in your training. What typically causes skips?"  │
│                                                                              │
│  IF experienceLevel === "beginner":                                         │
│  └── "What got you into running?"                             CONDITIONAL   │
│                                                                              │
│  SKIPPED WHEN WEARABLE PROVIDES DATA                                        │
│  ══════════════════════════════════════════════════════════════════════════ │
│                                                                              │
│  When wearable is connected AND we have 4+ weeks of data:                   │
│                                                                              │
│  ├── running.currentFrequency → SKIP, infer from activities                │
│  ├── running.currentVolume    → SKIP, calculate from activities            │
│  ├── running.easyPace         → SKIP, calculate from HR zones              │
│  ├── running.longestRecentRun → SKIP, find max from activities             │
│  │                                                                          │
│  │   INSTEAD, we CONFIRM inferred data:                                     │
│  │   "Based on your Strava data, you've been running about 25km/week       │
│  │    with your longest run at 12km. Does that sound right?"               │
│  │                                                                          │
│  │   Tool: renderConfirmation({ confirming: "inferred_profile" })          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Question Flow Logic Implementation

```typescript
// packages/backend/convex/ai/question-flow.ts

interface QuestionDecision {
  field: string;
  action: "ask" | "skip" | "confirm";
  reason: string;
  inferredValue?: any;
}

export function determineNextQuestion(
  runner: Runner,
  wearableData: WearableDataSummary | null
): QuestionDecision {

  // ===== PHASE: PROFILE =====

  // experienceLevel - ALWAYS ask (self-perception)
  if (!runner.running.experienceLevel) {
    return { field: "running.experienceLevel", action: "ask", reason: "mandatory" };
  }

  // currentFrequency - conditional
  if (!runner.running.currentFrequency) {
    if (wearableData && wearableData.weeklyRunCount !== null) {
      // Have wearable data - confirm instead of ask
      return {
        field: "running.currentFrequency",
        action: "confirm",
        reason: "wearable_data_available",
        inferredValue: wearableData.weeklyRunCount
      };
    } else {
      return { field: "running.currentFrequency", action: "ask", reason: "no_wearable_data" };
    }
  }

  // currentVolume - conditional
  if (!runner.running.currentVolume) {
    if (wearableData && wearableData.weeklyVolumeKm !== null) {
      return {
        field: "running.currentVolume",
        action: "confirm",
        reason: "wearable_data_available",
        inferredValue: wearableData.weeklyVolumeKm
      };
    } else {
      return { field: "running.currentVolume", action: "ask", reason: "no_wearable_data" };
    }
  }

  // ===== PHASE: GOALS (always ask) =====

  if (!runner.goals.goalType) {
    return { field: "goals.goalType", action: "ask", reason: "mandatory" };
  }

  if (runner.goals.goalType === "race") {
    if (!runner.goals.raceDistance) {
      return { field: "goals.raceDistance", action: "ask", reason: "mandatory_for_race" };
    }
    if (!runner.goals.raceDate) {
      return { field: "goals.raceDate", action: "ask", reason: "mandatory_for_race" };
    }
  }

  // ===== CONDITIONAL QUESTIONS =====

  // If half marathon or longer, ask about prior experience
  if (runner.goals.raceDistance && runner.goals.raceDistance >= 21) {
    if (runner.running.personalBests?.halfMarathon === undefined &&
        !runner.running.hasRunRaceDistance) {
      return {
        field: "running.hasRunRaceDistance",
        action: "ask",
        reason: "conditional_first_long_race"
      };
    }
  }

  // If injuries mentioned, dig deeper
  if (runner.health.pastInjuries?.includes("shin_splints") &&
      !runner.health.injuryDetails?.find(d => d.type === "shin_splints")) {
    return {
      field: "health.injuryDetails.shin_splints",
      action: "ask",
      reason: "conditional_injury_detail"
    };
  }

  // ... continue for all fields

  return { field: null, action: "complete", reason: "all_questions_answered" };
}
```

### Backend Wiring: Phase Requirements

```typescript
// packages/backend/convex/ai/onboarding-flow.ts

// Phase requirements - what fields must be filled before phase is "complete"
const PHASE_REQUIREMENTS = {
  intro: ["identity.nameConfirmed"],

  data_bridge: [
    "connections.wearableDecisionMade", // true = connected or explicitly skipped
  ],

  profile: (runner: Runner) => {
    // Different requirements based on wearable status
    const base = ["running.experienceLevel"];
    if (!runner.connections.wearableConnected) {
      // No wearable - need self-reported data
      return [...base, "running.currentFrequency", "running.currentVolume"];
    } else {
      // Wearable connected - need confirmation
      return [...base, "running.profileConfirmed"];
    }
  },

  goals: (runner: Runner) => {
    const base = ["goals.goalType"];
    if (runner.goals.goalType === "race") {
      return [...base, "goals.raceDistance", "goals.raceDate"];
    }
    return base;
  },

  schedule: [
    "schedule.availableDays",
    "schedule.preferredTime",
  ],

  health: [
    "health.pastInjuriesAsked", // Can be empty array, but must be asked
    "health.currentPainAsked",
  ],

  coaching: [
    "coaching.coachingVoice",
  ],

  analysis: [], // AI's summary phase, no requirements
};

// Determine current phase based on what's filled
export function determinePhase(runner: Runner): OnboardingPhase {
  for (const [phase, requirements] of Object.entries(PHASE_REQUIREMENTS)) {
    const reqs = typeof requirements === "function" ? requirements(runner) : requirements;
    if (!areFieldsFilled(runner, reqs)) {
      return phase as OnboardingPhase;
    }
  }
  return "complete";
}
```

### Tool Submission Endpoint

```typescript
// packages/backend/convex/ai/tool-submission.ts

export const submitToolResult = mutation({
  args: {
    conversationId: v.id("conversations"),
    toolCallId: v.string(),
    toolName: v.string(),
    result: v.object({
      targetField: v.optional(v.string()),
      value: v.any(),
      skipped: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");

    // Update runner if field mapping exists
    if (args.result.targetField && !args.result.skipped) {
      await handleToolResult(ctx, {
        runnerId: conversation.runnerId,
        targetField: args.result.targetField,
        value: args.result.value,
      });
    }

    // Mark tool call as complete in conversation
    await ctx.db.patch(args.conversationId, {
      pendingToolCall: null,
      updatedAt: Date.now(),
    });

    // Get updated runner
    const runner = await ctx.db.get(conversation.runnerId);

    // Check if phase should advance
    const newPhase = determinePhase(runner);
    if (newPhase !== conversation.phase) {
      await ctx.db.patch(args.conversationId, {
        phase: newPhase,
      });
    }

    return {
      success: true,
      dataCompleteness: runner.conversationState.dataCompleteness,
      currentPhase: newPhase,
      readyForPlan: runner.conversationState.readyForPlan,
    };
  }
});
```

---

## Training Engine Integration

### Architecture: Expert Scaffold + Expert Control Layer

The Plan Generator uses a **two-layer architecture**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PLAN GENERATION ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     EXPERT CONTROL LAYER                             │   │
│   │                                                                      │   │
│   │   ┌─────────────────────┐    ┌─────────────────────┐                │   │
│   │   │   KNOWLEDGE BASE    │    │     SAFEGUARDS      │                │   │
│   │   │                     │    │                     │                │   │
│   │   │ Training science    │    │ Hard & soft limits  │                │   │
│   │   │ that INFORMS        │    │ that CONSTRAIN      │                │   │
│   │   │ decisions           │    │ decisions           │                │   │
│   │   │                     │    │                     │                │   │
│   │   │ • 10% rule          │    │ • Max volume 10%    │                │   │
│   │   │ • HR zones          │    │ • No consecutive    │                │   │
│   │   │ • Periodization     │    │   hard days         │                │   │
│   │   │ • Injury mgmt       │    │ • Min rest days     │                │   │
│   │   └──────────┬──────────┘    └──────────┬──────────┘                │   │
│   │              │                          │                            │   │
│   │              └───────────┬──────────────┘                            │   │
│   │                          │                                           │   │
│   │                          ▼                                           │   │
│   │   ┌─────────────────────────────────────────────────────────────┐   │   │
│   │   │               EXPERT CONTROL INTERFACE                       │   │   │
│   │   │                                                              │   │   │
│   │   │   queryKnowledge(context) → relevant KB entries             │   │   │
│   │   │   checkSafeguards(decision) → violations, adjustments       │   │   │
│   │   │   explainDecision(decision) → justification                 │   │   │
│   │   └─────────────────────────────────────────────────────────────┘   │   │
│   │                          │                                           │   │
│   └──────────────────────────┼──────────────────────────────────────────┘   │
│                              │                                               │
│                              ▼                                               │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        EXPERT SCAFFOLD                               │   │
│   │                                                                      │   │
│   │   Deterministic rule-based plan generation with KB/Safeguard hooks  │   │
│   │                                                                      │   │
│   │   STEP 1: Template Selection                                        │   │
│   │   ───────────────────────────                                       │   │
│   │   Input: runner.goals                                               │   │
│   │   Output: Base template (e.g., HALF_MARATHON_12_WEEK)              │   │
│   │   Decision logged: { type: "template", selected: "half_12" }        │   │
│   │                                                                      │   │
│   │   STEP 2: Load Parameter Calculation                                │   │
│   │   ──────────────────────────────────                                │   │
│   │   Input: runner profile + wearable data                             │   │
│   │   KB Query: "volume_progression", "pace_zones"                      │   │
│   │   Output: { baseVolume, peakVolume, paces, weeklyIncrease }        │   │
│   │   Decisions logged with KB references                               │   │
│   │                                                                      │   │
│   │   STEP 3: Modifier Application                                      │   │
│   │   ─────────────────────────────                                     │   │
│   │   Input: load params + runner profile                               │   │
│   │   KB Query: injury-specific rules, age-related adjustments          │   │
│   │   Output: adjusted parameters                                       │   │
│   │   Decisions logged: "reduced weeklyIncrease due to shin_splints"    │   │
│   │                                                                      │   │
│   │   STEP 4: Safeguard Validation (CRITICAL)                           │   │
│   │   ───────────────────────────────────────                           │   │
│   │   For EVERY decision:                                               │   │
│   │     violations = checkSafeguards(decision)                          │   │
│   │     if violations.hard: MUST adjust (cannot proceed)                │   │
│   │     if violations.soft: LOG warning, may adjust                     │   │
│   │   All applications logged to plan.safeguardApplications             │   │
│   │                                                                      │   │
│   │   STEP 5: Week-by-Week Generation                                   │   │
│   │   ───────────────────────────────                                   │   │
│   │   For each week:                                                    │   │
│   │     - Calculate volume target                                       │   │
│   │     - Distribute sessions across available days                     │   │
│   │     - Check safeguards (consecutive hard days, etc.)                │   │
│   │     - Generate justification for the week                           │   │
│   │                                                                      │   │
│   │   STEP 6: Session Generation                                        │   │
│   │   ──────────────────────────                                        │   │
│   │   For each session:                                                 │   │
│   │     - Determine type (easy, tempo, intervals, long)                 │   │
│   │     - Calculate targets (pace, duration, structure)                 │   │
│   │     - Generate justification (why this session, why this day)       │   │
│   │     - Link to KB entries that informed it                           │   │
│   │                                                                      │   │
│   │   STEP 7: Plan Assembly                                             │   │
│   │   ─────────────────────                                             │   │
│   │   Assemble:                                                         │   │
│   │     - seasonView (LLM synthesizes from all decisions)               │   │
│   │     - weeklyPlan (from step 5)                                      │   │
│   │     - plannedSessions (from step 6)                                 │   │
│   │     - runnerSnapshot (current state at plan creation)               │   │
│   │     - decisions (complete audit trail)                              │   │
│   │     - safeguardApplications (what was validated/adjusted)           │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Expert Scaffold Implementation

```typescript
// packages/backend/convex/training/plan-generator.ts

export const generatePlan = action({
  args: { runnerId: v.id("runners") },
  handler: async (ctx, args) => {
    const runner = await ctx.runQuery(internal.runners.get, { id: args.runnerId });
    const decisions: Decision[] = [];
    const safeguardApplications: SafeguardApplication[] = [];

    // =========================================================================
    // STEP 1: Template Selection
    // =========================================================================
    const template = selectTemplate(runner.goals);
    decisions.push({
      decisionType: "template_selection",
      what: `Selected ${template.id} template`,
      source: "goal_mapping",
      reasoning: `Goal type "${runner.goals.goalType}" with race distance ${runner.goals.raceDistance}km maps to ${template.name}`,
      because: [{ factor: "goal_type", value: runner.goals.goalType }]
    });

    // =========================================================================
    // STEP 2: Load Parameter Calculation with KB Integration
    // =========================================================================
    const kbContext = await ctx.runQuery(internal.knowledge.queryRelevant, {
      tags: ["volume_progression", "pace_zones"],
      runnerContext: {
        experience: runner.running.experienceLevel,
        goalType: runner.goals.goalType
      }
    });

    const loadParams = calculateLoadParams(runner, kbContext);
    decisions.push({
      decisionType: "volume_baseline",
      what: `Base volume: ${loadParams.baseVolume}km/week`,
      source: "runner_data",
      reasoning: `Using ${runner.connections.wearableConnected ? "wearable-measured" : "self-reported"} current volume`,
      relatedKnowledge: kbContext.map(k => k._id),
      because: [{
        factor: "current_volume",
        value: runner.running.currentVolume || runner.running.actualWeeklyVolume,
        source: runner.connections.wearableConnected ? "wearable" : "user_reported"
      }]
    });

    // =========================================================================
    // STEP 3: Modifier Application with KB Queries
    // =========================================================================
    let adjustedParams = { ...loadParams };

    // Query KB for injury-specific rules
    if (runner.health.pastInjuries?.length) {
      const injuryKb = await ctx.runQuery(internal.knowledge.queryRelevant, {
        tags: runner.health.pastInjuries, // ["shin_splints", "itbs"]
        category: "injury_prevention"
      });

      for (const injury of runner.health.pastInjuries) {
        const modifier = getInjuryModifier(injury, injuryKb);
        if (modifier) {
          const before = adjustedParams.weeklyIncrease;
          adjustedParams.weeklyIncrease *= modifier.volumeFactor;
          decisions.push({
            decisionType: "injury_modifier",
            what: `Weekly increase reduced from ${(before * 100).toFixed(0)}% to ${(adjustedParams.weeklyIncrease * 100).toFixed(0)}%`,
            source: "knowledge_base",
            reasoning: injuryKb.find(k => k.tags.includes(injury))?.summary || `Conservative approach due to ${injury} history`,
            relatedKnowledge: injuryKb.map(k => k._id),
            because: [{
              factor: "injury_history",
              value: injury,
              source: "user_reported",
              impact: `Volume increase reduced by ${((1 - modifier.volumeFactor) * 100).toFixed(0)}%`
            }]
          });
        }
      }
    }

    // =========================================================================
    // STEP 4: Safeguard Validation
    // =========================================================================
    const safeguards = await ctx.runQuery(internal.safeguards.getActive);

    // Check volume increase safeguard
    const volumeCheck = checkSafeguard(safeguards, {
      field: "weeklyVolumeIncrease",
      value: adjustedParams.weeklyIncrease,
      runnerContext: {
        hasInjuryHistory: runner.health.pastInjuries?.length > 0,
        age: runner.physical.age,
        experienceLevel: runner.running.experienceLevel
      }
    });

    if (volumeCheck.violated) {
      safeguardApplications.push({
        safeguardId: volumeCheck.safeguard.name,
        applied: true,
        originalValue: adjustedParams.weeklyIncrease,
        adjustedValue: volumeCheck.adjustedValue,
        reason: volumeCheck.safeguard.action.message
      });
      adjustedParams.weeklyIncrease = volumeCheck.adjustedValue;
    }

    // =========================================================================
    // STEP 5 & 6: Week and Session Generation
    // =========================================================================
    const weeklyPlan = generateWeeklyPlan(template, adjustedParams, runner, decisions);
    const sessions = generateSessions(weeklyPlan, adjustedParams, runner, safeguards, decisions);

    // =========================================================================
    // STEP 7: Season View Generation (LLM Synthesis)
    // =========================================================================
    const seasonView = await generateSeasonView(runner, decisions, safeguardApplications);

    // =========================================================================
    // STEP 8: Runner Snapshot for RadarChart
    // =========================================================================
    const runnerSnapshot = captureRunnerSnapshot(runner, decisions);

    // =========================================================================
    // Store Complete Plan
    // =========================================================================
    const planId = await ctx.runMutation(internal.plans.create, {
      runnerId: args.runnerId,
      userId: runner.userId,
      name: `${template.name} - ${runner.goals.raceName || "Training Plan"}`,
      goalType: runner.goals.goalType,
      targetDate: runner.goals.raceDate,
      targetTime: runner.goals.targetTime,
      startDate: Date.now(),
      endDate: runner.goals.raceDate || Date.now() + template.durationWeeks * 7 * 24 * 60 * 60 * 1000,
      durationWeeks: template.durationWeeks,
      status: "draft",
      seasonView,
      weeklyPlan,
      runnerSnapshot,
      templateId: template.id,
      periodizationModel: template.periodization,
      phases: template.phases,
      loadParameters: adjustedParams,
      targetPaces: calculatePaces(adjustedParams.estimatedVdot),
      decisions,
      safeguardApplications,
      generatedAt: Date.now(),
      generatorVersion: "v1.0.0",
      lastModifiedAt: Date.now(),
    });

    // Store sessions
    for (const session of sessions) {
      await ctx.runMutation(internal.sessions.create, {
        planId,
        runnerId: args.runnerId,
        ...session
      });
    }

    return planId;
  }
});
```

### Knowledge Base Integration

```typescript
// packages/backend/convex/knowledge/query.ts

export const queryRelevant = query({
  args: {
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    runnerContext: v.optional(v.object({
      experience: v.optional(v.string()),
      goalType: v.optional(v.string()),
      injuries: v.optional(v.array(v.string())),
    }))
  },
  handler: async (ctx, args) => {
    let entries = await ctx.db
      .query("knowledgeBase")
      .filter(q => q.eq(q.field("isActive"), true))
      .collect();

    // Filter by tags
    if (args.tags?.length) {
      entries = entries.filter(e =>
        args.tags!.some(tag => e.tags.includes(tag))
      );
    }

    // Filter by category
    if (args.category) {
      entries = entries.filter(e => e.category === args.category);
    }

    // Filter by applicability
    if (args.runnerContext?.experience) {
      entries = entries.filter(e =>
        !e.applicableExperience ||
        e.applicableExperience.includes(args.runnerContext!.experience!)
      );
    }

    // Sort by confidence (established > well_supported > emerging)
    const confidenceOrder = { established: 0, well_supported: 1, emerging: 2, experimental: 3 };
    entries.sort((a, b) =>
      (confidenceOrder[a.confidence] || 4) - (confidenceOrder[b.confidence] || 4)
    );

    return entries;
  }
});
```

### Safeguard Checking

```typescript
// packages/backend/convex/safeguards/check.ts

interface SafeguardCheckResult {
  violated: boolean;
  safeguard: Safeguard;
  originalValue: any;
  adjustedValue?: any;
}

export function checkSafeguard(
  safeguards: Safeguard[],
  context: {
    field: string;
    value: any;
    runnerContext: {
      hasInjuryHistory?: boolean;
      age?: number;
      experienceLevel?: string;
    };
  }
): SafeguardCheckResult | null {
  // Find applicable safeguards, sorted by priority
  const applicable = safeguards
    .filter(s => s.condition.field === context.field)
    .filter(s => {
      // Check applicableWhen conditions
      const when = s.condition.applicableWhen;
      if (!when) return true;
      if (when.hasInjuryHistory !== undefined &&
          when.hasInjuryHistory !== context.runnerContext.hasInjuryHistory) {
        return false;
      }
      if (when.age && context.runnerContext.age) {
        const { operator, value } = when.age;
        if (operator === ">=" && context.runnerContext.age < value) return false;
        if (operator === "<" && context.runnerContext.age >= value) return false;
      }
      return true;
    })
    .sort((a, b) => a.priority - b.priority); // Lower priority = check first

  for (const safeguard of applicable) {
    const { operator, threshold } = safeguard.condition;
    let violated = false;

    switch (operator) {
      case ">":  violated = context.value > threshold; break;
      case ">=": violated = context.value >= threshold; break;
      case "<":  violated = context.value < threshold; break;
      case "<=": violated = context.value <= threshold; break;
      case "==": violated = context.value === threshold; break;
    }

    if (violated) {
      // Apply action
      let adjustedValue = context.value;
      if (safeguard.action.type === "cap") {
        adjustedValue = safeguard.action.adjustment;
      } else if (safeguard.action.type === "reduce") {
        adjustedValue = context.value * (1 - safeguard.action.adjustment);
      }

      return {
        violated: true,
        safeguard,
        originalValue: context.value,
        adjustedValue
      };
    }
  }

  return null;
}
```

---

## Knowledge Base & Safeguards: Technical Implementation

### Knowledge Base Implementation

The Knowledge Base is a **Convex table** with training science entries. It serves two purposes:
1. **Inform plan generation** with evidence-based rules
2. **Explain decisions** in justifications

```typescript
// packages/backend/convex/schema/knowledgeBase.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const knowledgeBase = defineTable({
  // Categorization
  category: v.string(),           // "physiology" | "training_principles" | "injury_prevention"
  subcategory: v.optional(v.string()),
  tags: v.array(v.string()),      // ["volume", "progression", "shin_splints"]

  // Content
  title: v.string(),
  content: v.string(),            // Full explanation
  summary: v.string(),            // One-liner for justifications

  // Applicability filters
  applicableGoals: v.optional(v.array(v.string())),
  applicableExperience: v.optional(v.array(v.string())),
  applicablePhases: v.optional(v.array(v.string())),

  // Source & confidence
  source: v.string(),             // "daniels_running_formula" | "research_paper"
  confidence: v.string(),         // "established" | "well_supported" | "emerging"

  // Usage
  usageContext: v.string(),       // "plan_generation" | "coaching_advice"
  isActive: v.boolean(),

  // RAG support (future)
  embedding: v.optional(v.array(v.float64())),
})
.index("by_category", ["category", "isActive"])
.index("by_tags", ["tags"]);
```

**Querying the Knowledge Base:**

```typescript
// packages/backend/convex/knowledge/query.ts

import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Query relevant knowledge base entries.
 *
 * Usage from React:
 *   const entries = useQuery(api.knowledge.queryRelevant, { tags: ["shin_splints"] });
 *
 * Usage from backend (in actions):
 *   const entries = await ctx.runQuery(internal.knowledge.queryRelevant, { tags });
 */
export const queryRelevant = query({
  args: {
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    runnerContext: v.optional(v.object({
      experience: v.optional(v.string()),
      goalType: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    let entries = await ctx.db
      .query("knowledgeBase")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Filter by tags (any match)
    if (args.tags?.length) {
      entries = entries.filter((e) =>
        args.tags!.some((tag) => e.tags.includes(tag))
      );
    }

    // Filter by category
    if (args.category) {
      entries = entries.filter((e) => e.category === args.category);
    }

    // Sort by confidence level
    const confidenceOrder = { established: 0, well_supported: 1, emerging: 2 };
    return entries.sort(
      (a, b) => (confidenceOrder[a.confidence] ?? 3) - (confidenceOrder[b.confidence] ?? 3)
    );
  },
});
```

**Seeding the Knowledge Base:**

```typescript
// packages/backend/convex/seeds/knowledgeBase.seed.ts

import { mutation } from "./_generated/server";

export const seedKnowledgeBase = mutation({
  handler: async (ctx) => {
    const entries = [
      {
        category: "training_principles",
        tags: ["volume", "progression", "safety"],
        title: "10% Rule for Volume Increase",
        content: "Weekly training volume should not increase by more than 10% week-over-week...",
        summary: "Limit weekly volume increase to 10%",
        source: "established_practice",
        confidence: "established",
        usageContext: "plan_generation",
        isActive: true,
      },
      {
        category: "injury_prevention",
        tags: ["shin_splints", "volume", "modification"],
        title: "Managing Shin Splint History",
        content: "Runners with shin splint history should limit volume increases to 5-7%...",
        summary: "Shin splint history: 5-7% max increases, no consecutive hard days",
        source: "coach_consensus",
        confidence: "well_supported",
        usageContext: "plan_generation",
        isActive: true,
      },
      // ... more entries
    ];

    for (const entry of entries) {
      await ctx.db.insert("knowledgeBase", entry);
    }
  },
});
```

### Safeguards Implementation

Safeguards are **hard and soft limits** that prevent dangerous training recommendations.

```typescript
// packages/backend/convex/schema/safeguards.ts

export const safeguards = defineTable({
  // Identification
  name: v.string(),                // "max_volume_increase_10_percent"
  description: v.string(),
  category: v.string(),            // "volume" | "intensity" | "recovery"

  // Rule type
  ruleType: v.string(),            // "hard_limit" | "soft_limit" | "warning"

  // Condition
  condition: v.object({
    field: v.string(),             // "weeklyVolumeIncrease"
    operator: v.string(),          // ">" | "<" | ">=" | "<="
    threshold: v.any(),
    applicableWhen: v.optional(v.object({
      hasInjuryHistory: v.optional(v.boolean()),
      experienceLevels: v.optional(v.array(v.string())),
      age: v.optional(v.object({
        operator: v.string(),
        value: v.number(),
      })),
    })),
  }),

  // Action when violated
  action: v.object({
    type: v.string(),              // "cap" | "reduce" | "block" | "warn"
    adjustment: v.optional(v.any()),
    message: v.string(),
    severity: v.string(),          // "info" | "warning" | "critical"
  }),

  // Metadata
  priority: v.number(),            // Lower = checked first
  isActive: v.boolean(),
  source: v.string(),
  rationale: v.string(),
})
.index("by_category", ["category", "isActive"])
.index("by_priority", ["isActive", "priority"]);
```

**Safeguard Validator Service:**

```typescript
// packages/backend/convex/safeguards/validator.ts

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * SafeguardValidator - validates decisions against all active safeguards.
 *
 * Usage:
 *   const result = await ctx.runQuery(api.safeguards.validate, {
 *     decisions: [{ field: "weeklyVolumeIncrease", value: 0.12 }],
 *     runnerContext: { hasInjuryHistory: true, age: 45 }
 *   });
 */

interface ValidationInput {
  field: string;
  value: any;
}

interface ValidationResult {
  field: string;
  originalValue: any;
  finalValue: any;
  violations: SafeguardViolation[];
  adjustments: SafeguardAdjustment[];
}

interface SafeguardViolation {
  safeguardId: string;
  safeguardName: string;
  ruleType: "hard_limit" | "soft_limit" | "warning";
  message: string;
}

interface SafeguardAdjustment {
  safeguardId: string;
  originalValue: any;
  adjustedValue: any;
  reason: string;
}

export const validate = query({
  args: {
    decisions: v.array(v.object({
      field: v.string(),
      value: v.any(),
    })),
    runnerContext: v.object({
      hasInjuryHistory: v.optional(v.boolean()),
      age: v.optional(v.number()),
      experienceLevel: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args): Promise<ValidationResult[]> => {
    // Load all active safeguards, sorted by priority
    const safeguards = await ctx.db
      .query("safeguards")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const sortedSafeguards = safeguards.sort((a, b) => a.priority - b.priority);

    const results: ValidationResult[] = [];

    for (const decision of args.decisions) {
      const result: ValidationResult = {
        field: decision.field,
        originalValue: decision.value,
        finalValue: decision.value,
        violations: [],
        adjustments: [],
      };

      // Check each safeguard
      for (const safeguard of sortedSafeguards) {
        if (safeguard.condition.field !== decision.field) continue;

        // Check applicableWhen conditions
        if (!isApplicable(safeguard.condition.applicableWhen, args.runnerContext)) {
          continue;
        }

        // Check violation
        const violated = checkCondition(
          safeguard.condition.operator,
          result.finalValue,
          safeguard.condition.threshold
        );

        if (violated) {
          result.violations.push({
            safeguardId: safeguard._id,
            safeguardName: safeguard.name,
            ruleType: safeguard.ruleType as any,
            message: safeguard.action.message,
          });

          // Apply adjustment for hard limits
          if (safeguard.ruleType === "hard_limit" && safeguard.action.type === "cap") {
            const adjustedValue = safeguard.action.adjustment;
            result.adjustments.push({
              safeguardId: safeguard._id,
              originalValue: result.finalValue,
              adjustedValue,
              reason: safeguard.action.message,
            });
            result.finalValue = adjustedValue;
          }
        }
      }

      results.push(result);
    }

    return results;
  },
});

function isApplicable(
  when: any | undefined,
  context: { hasInjuryHistory?: boolean; age?: number; experienceLevel?: string }
): boolean {
  if (!when) return true;

  if (when.hasInjuryHistory !== undefined) {
    if (when.hasInjuryHistory !== context.hasInjuryHistory) return false;
  }

  if (when.age && context.age) {
    const { operator, value } = when.age;
    if (operator === ">=" && context.age < value) return false;
    if (operator === "<" && context.age >= value) return false;
  }

  return true;
}

function checkCondition(operator: string, value: any, threshold: any): boolean {
  switch (operator) {
    case ">": return value > threshold;
    case ">=": return value >= threshold;
    case "<": return value < threshold;
    case "<=": return value <= threshold;
    case "==": return value === threshold;
    default: return false;
  }
}
```

**Seeding Safeguards:**

```typescript
// packages/backend/convex/seeds/safeguards.seed.ts

export const seedSafeguards = mutation({
  handler: async (ctx) => {
    const safeguards = [
      {
        name: "max_volume_increase_10_percent",
        description: "Weekly volume cannot increase more than 10%",
        category: "volume",
        ruleType: "hard_limit",
        condition: {
          field: "weeklyVolumeIncrease",
          operator: ">",
          threshold: 0.10,
        },
        action: {
          type: "cap",
          adjustment: 0.10,
          message: "Volume increase capped at 10% to prevent overuse injury",
          severity: "warning",
        },
        priority: 10,
        isActive: true,
        source: "established_practice",
        rationale: "Rapid volume increases are the #1 cause of running injuries",
      },
      {
        name: "max_volume_increase_injury_history",
        description: "Runners with injury history: max 7% weekly increase",
        category: "volume",
        ruleType: "hard_limit",
        condition: {
          field: "weeklyVolumeIncrease",
          operator: ">",
          threshold: 0.07,
          applicableWhen: { hasInjuryHistory: true },
        },
        action: {
          type: "cap",
          adjustment: 0.07,
          message: "Volume increase capped at 7% due to injury history",
          severity: "warning",
        },
        priority: 5, // Higher priority (checked first)
        isActive: true,
        source: "coach_consensus",
        rationale: "Injury-prone runners need more conservative progression",
      },
      // ... more safeguards
    ];

    for (const safeguard of safeguards) {
      await ctx.db.insert("safeguards", safeguard);
    }
  },
});
```

---

## Justification System Architecture

### The Trust Problem

Justifications are **critical for user trust**. A nonsensical justification destroys credibility. Examples of BAD justifications:
- "This tempo run is scheduled because tempo runs are good" (circular)
- "We're building your base this week" (vague, no connection to user)
- "Based on your profile, we recommend this" (generic, unexplained)

Examples of GOOD justifications:
- "Tuesday tempo because you mentioned Wednesdays are busy - this gives you recovery time before Thursday's easy run"
- "7% volume increase (not 10%) because of your shin splint history last year"
- "Long run on Sunday at 16km - that's 2km more than last week, building toward your 21km race distance"

### Justification Generation Architecture

Justifications come from **three sources**, composed together:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      JUSTIFICATION GENERATION FLOW                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌────────────────────────────────────────────────────────────────────┐    │
│   │                    SOURCE 1: DECISION AUDIT TRAIL                   │    │
│   │                                                                     │    │
│   │   Every decision in plan generation is logged with:                 │    │
│   │                                                                     │    │
│   │   {                                                                 │    │
│   │     decisionType: "volume_increase",                               │    │
│   │     what: "Weekly volume increase set to 7%",                      │    │
│   │     because: [                                                     │    │
│   │       { factor: "injury_history", value: "shin_splints",           │    │
│   │         source: "user_reported", impact: "reduced from 10%" },     │    │
│   │       { factor: "safeguard", id: "max_volume_increase_injury",     │    │
│   │         impact: "capped at 7%" }                                   │    │
│   │     ],                                                              │    │
│   │     confidence: 0.95                                               │    │
│   │   }                                                                 │    │
│   │                                                                     │    │
│   │   The "because" array is the RAW MATERIAL for justifications       │    │
│   └─────────────────────────────────────┬───────────────────────────────┘    │
│                                         │                                    │
│   ┌─────────────────────────────────────┴───────────────────────────────┐    │
│   │                    SOURCE 2: KNOWLEDGE BASE                          │    │
│   │                                                                     │    │
│   │   Training science that EXPLAINS why the decision makes sense:      │    │
│   │                                                                     │    │
│   │   - "10% Rule" → explains why volume increases are limited          │    │
│   │   - "Easy Running HR" → explains why easy pace matters              │    │
│   │   - "Shin Splint Management" → explains injury-specific caution     │    │
│   │                                                                     │    │
│   │   KB entries include:                                               │    │
│   │   - title: Human-readable name                                      │    │
│   │   - summary: One-line explanation (for inline use)                  │    │
│   │   - content: Full explanation (for deep dives)                      │    │
│   └─────────────────────────────────────┬───────────────────────────────┘    │
│                                         │                                    │
│   ┌─────────────────────────────────────┴───────────────────────────────┐    │
│   │                    SOURCE 3: RUNNER CONTEXT                          │    │
│   │                                                                     │    │
│   │   Personal details that make justifications SPECIFIC:               │    │
│   │                                                                     │    │
│   │   - Schedule: "Wednesdays are busy" → session placement             │    │
│   │   - Goals: "Half marathon in 12 weeks" → plan structure             │    │
│   │   - Health: "Shin splints last year" → conservative increases       │    │
│   │   - Coaching: "Analytical style" → include numbers and percentages  │    │
│   │                                                                     │    │
│   │   These are FACTS from the Runner Object that ground justifications │    │
│   └─────────────────────────────────────┬───────────────────────────────┘    │
│                                         │                                    │
│                                         ▼                                    │
│   ┌─────────────────────────────────────────────────────────────────────┐    │
│   │                    JUSTIFICATION COMPOSER                            │    │
│   │                                                                     │    │
│   │   Two modes:                                                        │    │
│   │                                                                     │    │
│   │   MODE 1: Template Composition (fast, deterministic)                │    │
│   │   ─────────────────────────────────────────────────────             │    │
│   │   For common patterns, use templates with variable substitution:    │    │
│   │                                                                     │    │
│   │   Template: "Volume increase limited to {percent}% because {reason}"│    │
│   │   Variables: { percent: 7, reason: "of your shin splint history" }  │    │
│   │   Output: "Volume increase limited to 7% because of your shin       │    │
│   │            splint history"                                          │    │
│   │                                                                     │    │
│   │   MODE 2: LLM Synthesis (rich, personalized)                        │    │
│   │   ─────────────────────────────────────────────────────             │    │
│   │   For complex explanations, use LLM with structured inputs:         │    │
│   │                                                                     │    │
│   │   Prompt: "Given these decision factors: {factors}, and this        │    │
│   │           knowledge: {kb_summary}, and this runner context:         │    │
│   │           {runner_summary}, write a 1-2 sentence justification      │    │
│   │           that explains WHY this decision was made.                 │    │
│   │           Be specific. Reference their actual data."                │    │
│   │                                                                     │    │
│   │   CRITICAL RULES for LLM synthesis:                                 │    │
│   │   • MUST reference at least one specific runner data point          │    │
│   │   • MUST NOT use generic phrases like "based on your profile"       │    │
│   │   • MUST NOT invent facts not in the input                          │    │
│   │   • MUST be verifiable against the decision audit trail             │    │
│   └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Justification at Each Zoom Level

| Level | What's Justified | How It's Generated | Example |
|-------|-----------------|-------------------|---------|
| **Season** | Overall plan philosophy | LLM synthesis from runner profile + goal + constraints | "This 12-week plan prioritizes durability over speed because of your shin splint history. We're using polarized training..." |
| **Weekly** | Why this week looks this way | Template + LLM | "Week 7 introduces your first threshold session. You've completed 4 weeks of consistent easy running with no shin issues..." |
| **Daily** | Why this session, this day | Mostly templates | "Tuesday tempo because you're fresh from the weekend and have Wednesday free for recovery." |

### Justification Validation

Before storing a justification, validate it:

```typescript
// packages/backend/convex/lib/justificationValidator.ts

interface JustificationValidation {
  isValid: boolean;
  issues: string[];
}

export function validateJustification(
  justification: string,
  decisionAudit: DecisionRecord,
  runner: Runner
): JustificationValidation {
  const issues: string[] = [];

  // Check 1: Not too generic
  const genericPhrases = [
    "based on your profile",
    "according to best practices",
    "for optimal results",
    "to maximize your potential"
  ];
  for (const phrase of genericPhrases) {
    if (justification.toLowerCase().includes(phrase)) {
      issues.push(`Contains generic phrase: "${phrase}"`);
    }
  }

  // Check 2: References actual data
  const mustReferenceOne = [
    runner.goals.raceDistance && "race",
    runner.health.pastInjuries?.length && "injury",
    runner.schedule.availableDays && "days",
    runner.running.currentVolume && "km"
  ].filter(Boolean);

  const referencesData = mustReferenceOne.some(keyword =>
    justification.toLowerCase().includes(keyword as string)
  );

  if (!referencesData && mustReferenceOne.length > 0) {
    issues.push("Does not reference any specific runner data");
  }

  // Check 3: Consistent with decision audit
  // If we said "7% because injury history", justification should mention injury
  for (const factor of decisionAudit.because) {
    if (factor.factor === "injury_history" &&
        !justification.toLowerCase().includes("injury") &&
        !justification.toLowerCase().includes("shin") &&
        !justification.toLowerCase().includes("careful")) {
      issues.push("Decision was influenced by injury history but justification doesn't mention it");
    }
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}
```

### Justification Storage

Justifications are stored WITH their source data for auditability:

```typescript
// In plannedSessions
{
  justification: "Tuesday tempo because you're fresh from the weekend...",

  // What generated this justification
  justificationMeta: {
    generatedBy: "template" | "llm",
    templateId: "session_placement_fresh",  // if template
    llmPromptVersion: "v2",                 // if LLM

    // The inputs used to generate it
    inputFactors: [
      { type: "schedule", field: "preferredTime", value: "morning" },
      { type: "decision", what: "tempo_on_tuesday" }
    ],

    // Validation result
    validatedAt: 1708099200000,
    validationPassed: true
  }
}
```

---

## MVP Scope Definition

### In Scope (MVP)

| Component | Description | Priority | Status |
|-----------|-------------|----------|--------|
| Tool Result Handler | Map tool submissions to runner profile | P0 | To implement |
| Strava OAuth | Connect account, fetch activities | P0 | To implement |
| **HealthKit Integration** | iOS health data (activities, sleep, HR) | **P0** | **Ready to merge** |
| Activity Storage | Save activities to Convex | P0 | To implement |
| Historical Tables (Convex Components) | Terra-aligned schemas for activities, sleep, daily, body | P0 | To implement |
| Wearable Adapter Layer (Convex Component) | Normalize data from any source | P0 | To implement |
| Runner Inferred Recalc | Update inferred fields from activities | P0 | To implement |
| Context Assembly | Build AI prompt with runner + activity data | P0 | To implement |
| AI Streaming (wired) | Connect UI to real AI endpoint | P0 | Partially done |
| Plan Generation (basic) | Template-based plan with justifications | P1 | To implement |
| Source Precedence Rules | Handle multi-source data conflicts | P1 | To implement |

### Out of Scope (Post-MVP)

| Component | Description | Rationale |
|-----------|-------------|-----------|
| Terra API | Multi-wearable aggregation | Cost + complexity, direct integrations first |
| Garmin Direct | Garmin Connect API | Requires developer approval |
| COROS Direct | COROS API | Requires developer approval |
| Multi-agent orchestration | Specialist agents | Single-agent sufficient for MVP |
| Advanced memory (vector DB) | Semantic search beyond Convex | Convex arrays sufficient for MVP |
| Daily sync cron | Automated activity refresh | Manual sync for MVP |
| Push notifications | Proactive coaching | Post-onboarding feature |

---

## Convex Components Architecture

### Design Principle: Build as Reusable Components

Both the **Historical Data Tables** and the **Wearable Adapter Layer** are built as Convex components that can be enhanced incrementally.

### Historical Data Tables (Terra-Aligned)

These tables are a **1-1 match with Terra data models** for future migration:

```typescript
// packages/backend/convex/components/historicalData/index.ts

/**
 * Historical Data Component
 *
 * A reusable Convex component providing Terra-aligned storage for:
 * - activities (workouts, runs, GPS data)
 * - sleepSessions (sleep records, HRV, stages)
 * - dailySummaries (daily aggregated metrics)
 * - bodyMeasurements (weight, body composition)
 *
 * Each table includes:
 * - source: which provider sent this data
 * - externalId: deduplication across syncs
 * - rawPayload: original API response for debugging
 *
 * Component can be used by any Convex app needing health data storage.
 */

export { activities } from "./tables/activities";
export { sleepSessions } from "./tables/sleepSessions";
export { dailySummaries } from "./tables/dailySummaries";
export { bodyMeasurements } from "./tables/bodyMeasurements";

// Utility functions
export { upsertActivity } from "./functions/upsertActivity";
export { aggregateToDailySummary } from "./functions/aggregateToDailySummary";
```

### Wearable Adapter Layer (Convex Component)

```typescript
// packages/backend/convex/components/wearableAdapter/index.ts

/**
 * Wearable Adapter Component
 *
 * A reusable Convex component for normalizing data from any wearable source.
 * New adapters can be added without changing consumer code.
 *
 * Current adapters:
 * - strava: OAuth + activity sync
 * - healthkit: Native iOS (client-side reads, server-side storage)
 *
 * Future adapters (additive):
 * - garmin: Garmin Connect API
 * - coros: COROS API
 * - terra: Terra API (replaces individual adapters)
 */

export interface WearableAdapter {
  // Metadata
  source: string;                    // "strava" | "healthkit" | "garmin" | etc.
  supportsActivities: boolean;
  supportsSleep: boolean;
  supportsDaily: boolean;
  supportsBody: boolean;

  // Normalizers (convert provider format → our schema)
  normalizeActivity(raw: any): Activity;
  normalizeSleep?(raw: any): SleepSession;
  normalizeDaily?(raw: any): DailySummary;
  normalizeBody?(raw: any): BodyMeasurement;
}

// Registry of all adapters
export const adapters: Record<string, WearableAdapter> = {
  strava: stravaAdapter,
  healthkit: healthkitAdapter,
  manual: manualAdapter,
  // Future: garmin, coros, terra
};

// Unified sync function
export async function syncFromSource(
  ctx: ActionCtx,
  runnerId: Id<"runners">,
  source: string,
  options: SyncOptions
): Promise<SyncResult> {
  const adapter = adapters[source];
  if (!adapter) throw new Error(`Unknown source: ${source}`);

  // Fetch raw data (varies by source)
  const rawData = await fetchRawData(ctx, runnerId, source, options);

  // Normalize and store
  const results: SyncResult = {
    activities: 0,
    sleep: 0,
    daily: 0,
    body: 0,
    errors: []
  };

  for (const raw of rawData.activities || []) {
    try {
      const normalized = adapter.normalizeActivity(raw);
      await ctx.runMutation(internal.historicalData.upsertActivity, {
        runnerId,
        ...normalized
      });
      results.activities++;
    } catch (e) {
      results.errors.push({ type: "activity", raw, error: e.message });
    }
  }

  // Similar for sleep, daily, body...

  return results;
}
```

### Source Precedence System

```typescript
// packages/backend/convex/lib/sourcePrecedence.ts

/**
 * Source Precedence Rules
 *
 * When multiple sources provide the same data point, determine which takes precedence.
 * Default order (can be customized per-user in runner.connections.sourcePriority):
 *
 * 1. manual (highest trust - user explicitly entered)
 * 2. primary_wearable (user's main device)
 * 3. secondary sources (other connected services)
 * 4. inferred (lowest trust - calculated values)
 *
 * Example conflict:
 * - Strava says: 5.2km run at 5:30/km pace
 * - HealthKit says: 5.1km run at 5:35/km pace
 * - Which is correct?
 *
 * Resolution depends on:
 * - User's designated primary wearable
 * - Data freshness
 * - Field-specific rules (e.g., HR from device, distance from GPS)
 */

export interface SourcePriority {
  source: string;
  priority: number;  // Lower = higher priority
}

const DEFAULT_PRIORITY: SourcePriority[] = [
  { source: "manual", priority: 0 },
  { source: "primary_wearable", priority: 1 },
  { source: "strava", priority: 2 },
  { source: "healthkit", priority: 2 },
  { source: "garmin", priority: 2 },
  { source: "coros", priority: 2 },
  { source: "terra", priority: 2 },
  { source: "inferred", priority: 10 },
];

export function resolveConflict(
  values: { source: string; value: any; timestamp: number }[],
  fieldType: "distance" | "pace" | "heart_rate" | "duration" | "general",
  userPriority?: SourcePriority[]
): { value: any; source: string; reason: string } {
  const priority = userPriority || DEFAULT_PRIORITY;

  // Sort by priority, then by timestamp (newer wins for same priority)
  const sorted = values.sort((a, b) => {
    const aPriority = priority.find(p => p.source === a.source)?.priority ?? 5;
    const bPriority = priority.find(p => p.source === b.source)?.priority ?? 5;

    if (aPriority !== bPriority) return aPriority - bPriority;
    return b.timestamp - a.timestamp; // Newer wins
  });

  // Field-specific rules
  if (fieldType === "heart_rate") {
    // Prefer device with optical HR sensor
    const deviceSources = ["garmin", "coros", "healthkit"];
    const deviceValue = sorted.find(v => deviceSources.includes(v.source));
    if (deviceValue) {
      return {
        value: deviceValue.value,
        source: deviceValue.source,
        reason: "Device with HR sensor takes precedence for heart rate"
      };
    }
  }

  if (fieldType === "distance" && sorted.length > 1) {
    // Check if values are within 5% - if so, use primary, else warn
    const [first, second] = sorted;
    const diff = Math.abs(first.value - second.value) / first.value;
    if (diff > 0.05) {
      // Significant difference - log warning
      console.warn(`Distance conflict: ${first.source}=${first.value} vs ${second.source}=${second.value}`);
    }
  }

  return {
    value: sorted[0].value,
    source: sorted[0].source,
    reason: `Selected based on source priority (${sorted[0].source} > ${sorted.slice(1).map(v => v.source).join(", ")})`
  };
}
```

### MVP Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          MVP DATA FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────┐                                                           │
│   │   USER      │                                                           │
│   │  (Mobile)   │                                                           │
│   └──────┬──────┘                                                           │
│          │                                                                   │
│          ├────────────────────────────────────────────────────────────┐     │
│          │                                                            │     │
│          ▼                                                            ▼     │
│   ┌─────────────┐                                              ┌──────────┐ │
│   │ ONBOARDING  │                                              │  STRAVA  │ │
│   │    CHAT     │                                              │  OAUTH   │ │
│   │             │                                              │          │ │
│   │ AI streams  │                                              │ Connect  │ │
│   │ questions   │                                              │ account  │ │
│   │             │                                              │          │ │
│   │ User answers│                                              │ Fetch    │ │
│   │ via tools   │                                              │ runs     │ │
│   └──────┬──────┘                                              └────┬─────┘ │
│          │                                                          │       │
│          │                                                          │       │
│          ▼                                                          ▼       │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                         CONVEX BACKEND                               │  │
│   │                                                                      │  │
│   │   ┌────────────┐    ┌──────────────┐    ┌────────────────────────┐  │  │
│   │   │  runners   │◄───│ Tool Handler │◄───│  POST /api/ai/stream   │  │  │
│   │   │            │    │              │    │                        │  │  │
│   │   │  profile   │    │  Maps tool   │    │  Assembles context     │  │  │
│   │   │  goals     │    │  results to  │    │  Streams AI response   │  │  │
│   │   │  inferred  │    │  profile     │    │  Persists messages     │  │  │
│   │   └─────┬──────┘    └──────────────┘    └────────────────────────┘  │  │
│   │         │                                                            │  │
│   │         │                                                            │  │
│   │         ▼                                                            │  │
│   │   ┌────────────┐    ┌──────────────┐    ┌────────────────────────┐  │  │
│   │   │ activities │◄───│  Normalizer  │◄───│  Strava Sync Action    │  │  │
│   │   │            │    │              │    │                        │  │  │
│   │   │  All runs  │    │  Strava →    │    │  Fetches last 30 days │  │  │
│   │   │  from API  │    │  Unified     │    │  Stores in activities  │  │  │
│   │   └─────┬──────┘    └──────────────┘    └────────────────────────┘  │  │
│   │         │                                                            │  │
│   │         │                                                            │  │
│   │         ▼                                                            │  │
│   │   ┌──────────────────────────────────────────────────────────────┐  │  │
│   │   │                   INFERENCE ENGINE                            │  │  │
│   │   │                                                               │  │  │
│   │   │   Triggered: After activity sync, before plan generation     │  │  │
│   │   │                                                               │  │  │
│   │   │   Calculates:                                                 │  │  │
│   │   │   - avgWeeklyVolume (sum last 4 weeks / 4)                   │  │  │
│   │   │   - easyPaceActual (avg pace of easy runs)                   │  │  │
│   │   │   - trainingLoadTrend (volume trend direction)               │  │  │
│   │   │   - estimatedFitness (VDOT from recent races/hard runs)      │  │  │
│   │   │                                                               │  │  │
│   │   │   Updates: runners.inferred                                   │  │  │
│   │   └──────────────────────────────────────────────────────────────┘  │  │
│   │                                                                      │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Module Testing Strategy

> **CRITICAL**: Each module must be testable **independently** before integration. This ensures bugs are caught early and localized to specific modules.

### Testing Philosophy

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          TESTING PYRAMID                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│                         ┌───────────────┐                                    │
│                         │  Integration  │  ← Few: Full onboarding flow       │
│                         │    Tests      │    Plan generation → UI            │
│                         └───────────────┘                                    │
│                    ┌─────────────────────────┐                               │
│                    │      Module Tests       │  ← Many: Each module isolated  │
│                    │                         │    Mock dependencies           │
│                    └─────────────────────────┘                               │
│               ┌───────────────────────────────────┐                          │
│               │          Unit Tests               │  ← Most: Pure functions  │
│               │                                   │    Validators, calculators│
│               └───────────────────────────────────┘                          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Module Test Specifications

#### 1. Runner Data Model Tests

```typescript
// packages/backend/convex/__tests__/runners.test.ts

import { convexTest } from "convex-test";
import { expect, test, describe } from "vitest";
import { api, internal } from "./_generated/api";

describe("Runner Data Model", () => {
  test("stores user input with provenance", async () => {
    const t = convexTest();

    // Create a runner
    const runnerId = await t.mutation(api.runners.create, {
      userId: "test-user-id",
    });

    // Store a field with provenance
    await t.mutation(internal.runners.updateField, {
      runnerId,
      field: "schedule.availableDays",
      value: 4,
      provenance: {
        source: "user_input",
        questionAsked: "How many days can you run?",
        inputMethod: "slider",
        collectedAt: Date.now(),
      },
    });

    // Verify storage
    const runner = await t.query(api.runners.get, { runnerId });
    expect(runner.schedule.availableDays.value).toBe(4);
    expect(runner.schedule.availableDays.provenance.source).toBe("user_input");
    expect(runner.schedule.availableDays.provenance.questionAsked).toBe(
      "How many days can you run?"
    );
  });

  test("calculates data completeness correctly", async () => {
    const t = convexTest();
    const runnerId = await t.mutation(api.runners.create, { userId: "test" });

    // Empty runner should have low completeness
    let runner = await t.query(api.runners.get, { runnerId });
    expect(runner.conversationState.dataCompleteness).toBeLessThan(20);

    // Fill required fields
    await t.mutation(internal.runners.bulkUpdate, {
      runnerId,
      updates: {
        "identity.name": { value: "Alex", provenance: { source: "user_input" } },
        "goals.goalType": { value: "race", provenance: { source: "user_input" } },
        "schedule.availableDays": { value: 4, provenance: { source: "user_input" } },
      },
    });

    runner = await t.query(api.runners.get, { runnerId });
    expect(runner.conversationState.dataCompleteness).toBeGreaterThan(50);
  });
});
```

#### 2. Inference Engine Tests

```typescript
// packages/backend/convex/__tests__/inferenceEngine.test.ts

import { describe, test, expect } from "vitest";
import { calculateCurrentState } from "../lib/inferenceEngine";

describe("Inference Engine", () => {
  test("calculates ATL/CTL from activities", () => {
    const activities = [
      { distanceMeters: 10000, durationSeconds: 3600, startTime: daysAgo(1) },
      { distanceMeters: 8000, durationSeconds: 2880, startTime: daysAgo(3) },
      { distanceMeters: 15000, durationSeconds: 5400, startTime: daysAgo(5) },
      // ... 4 weeks of data
    ];

    const result = calculateCurrentState({ activities, runner: mockRunner });

    expect(result.acuteTrainingLoad).toBeGreaterThan(0);
    expect(result.chronicTrainingLoad).toBeGreaterThan(0);
    expect(result.trainingStressBalance).toBeDefined();
  });

  test("identifies injury risk from rapid volume increase", () => {
    const activities = [
      // Week 1: 20km
      { distanceMeters: 5000, startTime: daysAgo(7) },
      { distanceMeters: 5000, startTime: daysAgo(8) },
      { distanceMeters: 10000, startTime: daysAgo(10) },
      // Week 2: 35km (75% increase)
      { distanceMeters: 10000, startTime: daysAgo(1) },
      { distanceMeters: 10000, startTime: daysAgo(3) },
      { distanceMeters: 15000, startTime: daysAgo(5) },
    ];

    const result = calculateCurrentState({ activities, runner: mockRunner });

    expect(result.injuryRiskLevel).toBe("elevated");
    expect(result.injuryRiskFactors).toContain("rapid_volume_increase");
  });

  test("does NOT overwrite user-provided data", () => {
    const runner = {
      running: {
        easyPace: { value: "6:00/km", provenance: { source: "user_input" } },
      },
    };

    // Inference calculates different easy pace from HR zones
    const result = calculateCurrentState({
      activities: mockActivities,
      runner,
    });

    // User value should be preserved, inference goes to different field
    expect(result.running.easyPace).toBeUndefined(); // Don't overwrite
    expect(result.running.actualEasyPace).toBeDefined(); // Inferred value
  });
});
```

#### 3. Plan Generator Tests

```typescript
// packages/backend/convex/__tests__/planGenerator.test.ts

import { describe, test, expect } from "vitest";
import { generatePlan } from "../training/plan-generator";

describe("Plan Generator", () => {
  test("selects correct template for goal", async () => {
    const runner = {
      goals: { goalType: "race", raceDistance: 21.1, raceDate: weeksFromNow(12) },
      running: { currentVolume: 25 },
      schedule: { availableDays: 4 },
      health: { pastInjuries: [] },
    };

    const plan = await generatePlan({ runner, kb: mockKB, safeguards: mockSafeguards });

    expect(plan.templateId).toContain("half_marathon");
    expect(plan.durationWeeks).toBe(12);
  });

  test("applies injury modifiers from KB", async () => {
    const runner = {
      goals: { goalType: "race", raceDistance: 10 },
      running: { currentVolume: 30 },
      health: { pastInjuries: ["shin_splints"] },
    };

    const plan = await generatePlan({ runner, kb: mockKB, safeguards: mockSafeguards });

    // Should find decision about injury modifier
    const injuryDecision = plan.decisions.find(
      (d) => d.decisionType === "injury_modifier"
    );
    expect(injuryDecision).toBeDefined();
    expect(injuryDecision.reasoning).toContain("shin");

    // Weekly increase should be reduced
    expect(plan.loadParameters.weeklyIncrease).toBeLessThanOrEqual(0.07);
  });

  test("generates justifications at all zoom levels", async () => {
    const plan = await generatePlan({ runner: mockRunner, kb: mockKB, safeguards: mockSafeguards });

    // Season level
    expect(plan.seasonView.coachSummary).toBeDefined();
    expect(plan.seasonView.coachSummary.length).toBeGreaterThan(100);

    // Weekly level
    expect(plan.weeklyPlan.length).toBeGreaterThan(0);
    plan.weeklyPlan.forEach((week) => {
      expect(week.weekJustification).toBeDefined();
    });

    // Session level (checked via sessions)
    expect(plan.sessions.length).toBeGreaterThan(0);
    plan.sessions.forEach((session) => {
      expect(session.justification).toBeDefined();
    });
  });
});
```

#### 4. Knowledge Base Tests

```typescript
// packages/backend/convex/__tests__/knowledgeBase.test.ts

import { convexTest } from "convex-test";
import { describe, test, expect } from "vitest";

describe("Knowledge Base", () => {
  test("returns relevant entries for injury tags", async () => {
    const t = convexTest();

    // Seed some KB entries
    await t.mutation(internal.knowledge.seed);

    // Query for shin splints
    const entries = await t.query(api.knowledge.queryRelevant, {
      tags: ["shin_splints"],
    });

    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0].tags).toContain("shin_splints");
  });

  test("filters by experience level", async () => {
    const t = convexTest();
    await t.mutation(internal.knowledge.seed);

    const beginnerEntries = await t.query(api.knowledge.queryRelevant, {
      runnerContext: { experience: "beginner" },
    });

    // Should not include advanced-only entries
    beginnerEntries.forEach((entry) => {
      if (entry.applicableExperience) {
        expect(
          entry.applicableExperience.includes("beginner") ||
          entry.applicableExperience.length === 0
        ).toBe(true);
      }
    });
  });
});
```

#### 5. Safeguards Tests

```typescript
// packages/backend/convex/__tests__/safeguards.test.ts

import { convexTest } from "convex-test";
import { describe, test, expect } from "vitest";

describe("Safeguards", () => {
  test("caps volume increase at 10%", async () => {
    const t = convexTest();
    await t.mutation(internal.safeguards.seed);

    const result = await t.query(api.safeguards.validate, {
      decisions: [{ field: "weeklyVolumeIncrease", value: 0.15 }],
      runnerContext: { hasInjuryHistory: false },
    });

    expect(result[0].violations.length).toBe(1);
    expect(result[0].finalValue).toBe(0.10); // Capped
  });

  test("applies stricter limit for injury history", async () => {
    const t = convexTest();
    await t.mutation(internal.safeguards.seed);

    const result = await t.query(api.safeguards.validate, {
      decisions: [{ field: "weeklyVolumeIncrease", value: 0.09 }],
      runnerContext: { hasInjuryHistory: true },
    });

    // 9% is OK for normal runners, but not for injured
    expect(result[0].violations.length).toBe(1);
    expect(result[0].finalValue).toBe(0.07); // Stricter cap
  });

  test("respects priority order", async () => {
    const t = convexTest();
    await t.mutation(internal.safeguards.seed);

    // With injury history, the stricter rule (priority 5) should apply before general rule (priority 10)
    const result = await t.query(api.safeguards.validate, {
      decisions: [{ field: "weeklyVolumeIncrease", value: 0.12 }],
      runnerContext: { hasInjuryHistory: true },
    });

    // Should apply injury rule, not general rule
    expect(result[0].violations[0].safeguardName).toBe("max_volume_increase_injury_history");
  });
});
```

### Running Tests

```bash
# Run all backend tests
cd packages/backend
pnpm test

# Run specific module tests
pnpm test runners
pnpm test inferenceEngine
pnpm test planGenerator
pnpm test knowledgeBase
pnpm test safeguards

# Run with coverage
pnpm test --coverage

# Watch mode during development
pnpm test --watch
```

### Test Configuration

```typescript
// packages/backend/vitest.config.ts

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    include: ["convex/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["convex/**/*.ts"],
      exclude: ["convex/_generated/**", "convex/__tests__/**"],
    },
  },
});
```

---

## Implementation Roadmap

### Day 1: Tool Result Handler + Basic Wiring

**Goal**: User answers in chat → Data saved to runner profile

Tasks:
- [ ] Implement `handleToolResult` mutation with field mappings
- [ ] Implement `submitToolResult` mutation (frontend-callable)
- [ ] Wire frontend tool components to call `submitToolResult`
- [ ] Verify data flows from chat → runner profile

### Day 2: Strava Integration

**Goal**: User connects Strava → Activities saved to Convex

Tasks:
- [ ] Create `activities` table with schema
- [ ] Implement Strava OAuth flow (auth URL, callback handler)
- [ ] Implement `syncActivities` action
- [ ] Implement `normalizeStravaActivity` function
- [ ] Wire to frontend ConnectionCard

### Day 3: Context Assembly + AI Wiring

**Goal**: AI receives full context, responds intelligently

Tasks:
- [ ] Implement `buildCoachContext` with runner + activities
- [ ] Update system prompt to use dynamic context
- [ ] Implement inference engine (recalculate runner.inferred)
- [ ] Wire frontend to use real `/api/ai/stream` endpoint
- [ ] Test full conversation flow

### Day 4: Plan Generation + Visualization Wiring

**Goal**: Complete onboarding produces a training plan

Tasks:
- [ ] Implement basic plan generator (template-based)
- [ ] Create `plans` table
- [ ] Wire visualization screens (Radar, Progression, Calendar) to real data
- [ ] Implement Verdict screen with plan preview
- [ ] Test full onboarding → plan flow

### Day 5: Polish + Edge Cases

**Goal**: Production-ready onboarding

Tasks:
- [ ] Error handling (network failures, auth errors, rate limits)
- [ ] Loading states and fallbacks
- [ ] Edge cases (skip wearable, incomplete data, etc.)
- [ ] Manual testing of all paths
- [ ] Bug fixes

---

## Open Questions

1. **Strava Webhook vs Polling**: For MVP, do we poll on-demand or set up webhooks? Recommendation: Poll on-demand (user triggers sync).

2. **Plan Storage Schema**: How granular? Week-by-week? Day-by-day? Recommendation: Week-by-week with session types, details computed at display time.

3. **Conversation Persistence Strategy**: Keep all messages forever? Recommendation: Yes for MVP, add retention policy later.

4. **Error Recovery**: What happens if Strava sync fails mid-onboarding? Recommendation: Allow skip, retry later.

---

## Next Steps

1. **Review this document** with NativeSquare
2. **Prioritize** any open questions
3. **Start Day 1 implementation** with tool result handler

---

*Document Version: 2026-02-16-v2*
*Status: Draft for Review*

**Changelog:**
- v2 (2026-02-16):
  - Added Codebase Context section (monorepo structure, Expo + Convex + NextJS stack)
  - Added Module Isolation Philosophy section (5 core modules, communication rules)
  - Added Path 1 justification tracking with DataProvenance types
  - Added Knowledge Base & Safeguards technical implementation (schemas, seeds, validators)
  - Added Module Testing Strategy with test specifications for all modules
  - Updated code examples to use Convex syntax (useQuery, useMutation)
- v1 (2026-02-16): Initial architecture document
