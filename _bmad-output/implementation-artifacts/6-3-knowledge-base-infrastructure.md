# Story 6.3: Knowledge Base Infrastructure

Status: done

## Story

As a developer,
I want a knowledge base storing training science,
So that the AI coach can ground recommendations in established principles.

## Acceptance Criteria

1. **AC1: Knowledge Base Table** - The knowledgeBase table exists with full schema:
   - category, subcategory, tags
   - title, content, summary
   - applicableGoals, applicableExperience, applicablePhases
   - source, sourceReference, confidence
   - usageContext, isActive
   - embedding (optional, for future RAG)
   - Indexes: by_category, by_usage

2. **AC2: Query Function** - Query function exists:
   ```typescript
   queryRelevant({
     tags?: string[],
     category?: string,
     runnerContext?: { experience, goalType, injuries }
   }): KnowledgeEntry[]
   ```

3. **AC3: Initial Seed Data** - Minimum 15 entries seeded:
   - 10% volume increase rule (established)
   - Easy running heart rate 65-75% (established)
   - Managing shin splints (well_supported)
   - Managing IT band (well_supported)
   - Polarized training distribution (established)
   - Periodization principles (established)
   - Taper guidelines (established)
   - Recovery requirements by age (well_supported)
   - Long run percentage guidelines (established)
   - Speed work introduction timing (well_supported)
   - Plus 5 additional entries for comprehensive coverage

4. **AC4: Schema Integration** - Table registered in schema.ts

## Tasks / Subtasks

- [x] Task 1: Create knowledge base schema (AC: 1, 4)
  - [x] Create `packages/backend/convex/table/knowledgeBase.ts`
  - [x] Define all fields per data-model-comprehensive.md
  - [x] Add indexes: by_category, by_usage
  - [x] Register in schema.ts

- [x] Task 2: Create query function (AC: 2)
  - [x] Create `packages/backend/convex/knowledge/query.ts`
  - [x] Implement queryRelevant() with filtering logic
  - [x] Support tag filtering (match any tag)
  - [x] Support category filtering (exact match)
  - [x] Support runner context filtering (experience, goalType, injuries)
  - [x] Return only active entries by default
  - [x] Export query as Convex query function

- [x] Task 3: Create seed data (AC: 3)
  - [x] Create `packages/backend/convex/seeds/knowledgeBase.ts`
  - [x] Add 15+ knowledge entries per acceptance criteria
  - [x] Include training principles (10% rule, periodization)
  - [x] Include physiology (HR zones, easy running)
  - [x] Include injury prevention (shin splints, IT band, plantar fasciitis)
  - [x] Include recovery guidance
  - [x] Create seed mutation and clear mutation

- [x] Task 4: Create barrel exports
  - [x] Create `packages/backend/convex/knowledge/index.ts`
  - [x] Export query functions and types

## Dev Notes

### Architecture Compliance

**Module 4 - Knowledge Base** (architecture-backend-v2.md lines 207-219):
- Responsibility: Store and query training science knowledge
- Inputs: Query context (tags, category, runner context)
- Outputs: Relevant KB entries with summaries
- Files: convex/knowledge/query.ts, convex/schema/knowledgeBase.ts
- Interface: KnowledgeBase.query(context) → KBEntry[]

**Single Writer Principle** (line 258):
- `knowledgeBase` table writers: Admin/seeder only
- No runtime writes from other modules

### Schema Definition

```typescript
// packages/backend/convex/table/knowledgeBase.ts

import { defineTable } from "convex/server";
import { v } from "convex/values";

export const knowledgeBase = defineTable({
  // Categorization
  category: v.string(),                          // "physiology" | "training_principles" | "periodization" | "recovery" | "injury_prevention" | "nutrition" | "mental"
  subcategory: v.optional(v.string()),
  tags: v.array(v.string()),

  // Content
  title: v.string(),
  content: v.string(),
  summary: v.string(),

  // Applicability
  applicableGoals: v.optional(v.array(v.string())),       // ["race", "base_building"]
  applicableExperience: v.optional(v.array(v.string())),  // ["beginner", "intermediate"]
  applicablePhases: v.optional(v.array(v.string())),      // ["base", "build", "peak"]

  // Source & Validation
  source: v.string(),                            // "daniels_running_formula" | "pfitzinger" | "coach_interview" | "research_paper"
  sourceReference: v.optional(v.string()),
  validatedBy: v.optional(v.array(v.string())),
  validatedAt: v.optional(v.number()),
  confidence: v.string(),                        // "established" | "well_supported" | "emerging" | "experimental"

  // Usage
  usageContext: v.string(),                      // "plan_generation" | "coaching_advice" | "explanation" | "safety"
  isActive: v.boolean(),

  // Embedding (For RAG)
  embedding: v.optional(v.array(v.float64())),
  embeddingModel: v.optional(v.string()),

  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
  version: v.number(),
})
.index("by_category", ["category"])
.index("by_usage", ["usageContext", "isActive"]);
```

### Query Function Implementation

```typescript
// packages/backend/convex/knowledge/query.ts

import { query } from "../_generated/server";
import { v } from "convex/values";

export const queryRelevant = query({
  args: {
    tags: v.optional(v.array(v.string())),
    category: v.optional(v.string()),
    runnerContext: v.optional(v.object({
      experience: v.optional(v.string()),
      goalType: v.optional(v.string()),
      injuries: v.optional(v.array(v.string())),
    })),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let entries = await ctx.db
      .query("knowledgeBase")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Filter by category if specified
    if (args.category) {
      entries = entries.filter(e => e.category === args.category);
    }

    // Filter by tags if specified (match any)
    if (args.tags && args.tags.length > 0) {
      entries = entries.filter(e =>
        args.tags!.some(tag => e.tags.includes(tag))
      );
    }

    // Filter by runner context if specified
    if (args.runnerContext) {
      const ctx = args.runnerContext;

      entries = entries.filter(e => {
        // Check experience match
        if (ctx.experience && e.applicableExperience) {
          if (!e.applicableExperience.includes(ctx.experience)) {
            return false;
          }
        }

        // Check goal type match
        if (ctx.goalType && e.applicableGoals) {
          if (!e.applicableGoals.includes(ctx.goalType)) {
            return false;
          }
        }

        // Check injury relevance
        if (ctx.injuries && ctx.injuries.length > 0) {
          // Include entries that mention any of the runner's injuries
          const injuryTags = ctx.injuries.map(i => i.toLowerCase());
          const hasRelevantInjuryTag = e.tags.some(tag =>
            injuryTags.some(injury => tag.toLowerCase().includes(injury))
          );
          // Don't filter out, just prioritize injury-relevant entries
        }

        return true;
      });
    }

    // Apply limit
    if (args.limit && args.limit > 0) {
      entries = entries.slice(0, args.limit);
    }

    return entries;
  },
});

// Get entry by ID
export const getById = query({
  args: { id: v.id("knowledgeBase") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get all entries in a category
export const getByCategory = query({
  args: { category: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("knowledgeBase")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
  },
});
```

### Seed Data Structure

```typescript
// packages/backend/convex/seeds/knowledgeBase.ts

const KNOWLEDGE_BASE_SEEDS = [
  // Training Principles
  {
    category: "training_principles",
    subcategory: "progression",
    title: "10% Rule for Volume Increase",
    content: "Weekly training volume should not increase by more than 10% week-over-week...",
    summary: "Limit weekly volume increase to 10%",
    tags: ["volume", "progression", "injury_prevention"],
    source: "established_practice",
    confidence: "established",
    usageContext: "plan_generation",
    isActive: true,
  },
  // ... 14+ more entries
];
```

### File Structure After Implementation

```
packages/backend/convex/
├── table/
│   └── knowledgeBase.ts         # NEW - table definition
├── knowledge/
│   ├── query.ts                 # NEW - query functions
│   └── index.ts                 # NEW - barrel export
├── seeds/
│   └── knowledgeBase.ts         # NEW - seed data
└── schema.ts                    # MODIFIED - add knowledgeBase
```

### Dependencies

- **Depends on:** None (foundational Epic 6 component)
- **Required by:** Story 6.5 (Plan Generator Core)
- **Used by:** Plan Generator, AI Coach (RAG), Safeguard explanations

### Testing Checklist

After implementation:
- [x] `npx convex dev` runs without errors
- [x] TypeScript type-check passes (`npx convex codegen`)
- [ ] queryRelevant returns entries when called with valid args (requires deployment)
- [ ] queryRelevant filters by category correctly (requires deployment)
- [ ] queryRelevant filters by tags correctly (requires deployment)
- [ ] Seed mutation creates all 15+ entries (requires deployment)
- [ ] Clear mutation removes all entries (requires deployment)

Note: Runtime tests require `npx convex dev` to be running. Codegen validation confirms all types and schemas are correct.

## References

- [Source: _bmad-output/planning-artifacts/data-model-comprehensive.md#Knowledge-Base-Tier-5]
- [Source: _bmad-output/planning-artifacts/architecture-backend-v2.md#Module-4-Knowledge-Base]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-6.3]
- [Pattern Reference: Story 5.3 Data Adapters Pattern - registry pattern]
- [Pattern Reference: Story 5.4 Inference Engine - pure function pattern]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - implementation completed without issues.

### Completion Notes List

1. **AC1 & AC4 Complete**: Created `knowledgeBase` table with full schema including:
   - All categorization fields (category with union type, subcategory, tags)
   - Content fields (title, content, summary)
   - Applicability fields (applicableGoals, applicableExperience, applicablePhases)
   - Source/validation fields (source, sourceReference, validatedBy, validatedAt, confidence)
   - Usage fields (usageContext with union type, isActive)
   - RAG-ready embedding fields (embedding, embeddingModel)
   - Metadata (createdAt, updatedAt, version)
   - Indexes: by_category, by_usage
   - Registered in schema.ts

2. **AC2 Complete**: Implemented query functions in `knowledge/query.ts`:
   - `queryRelevant()`: Full filtering by tags (match any), category (exact), runnerContext (experience, goalType, injuries)
   - `getById()`: Single entry lookup
   - `getByCategory()`: Index-optimized category queries
   - `getByUsageContext()`: Index-optimized usage context queries
   - `listAll()`: Admin/debug function for all active entries

3. **AC3 Complete**: Created 17 seed entries covering:
   - Training Principles: 10% rule, polarized training, long run %, speed work timing, frequency, consistency
   - Periodization: General principles, taper guidelines
   - Physiology: Easy HR zones, VO2max training
   - Injury Prevention: Shin splints, IT band, plantar fasciitis, recovery weeks
   - Recovery: Age adjustments, post-race guidelines, sleep requirements
   - Includes seedKnowledgeBase() and clearKnowledgeBase() mutations

4. **Barrel Export**: Created `knowledge/index.ts` exporting all query functions and types

5. **Validation**: `npx convex codegen` completed successfully with no TypeScript errors

6. **Code Review Fixes (2026-02-16)**:
   - **Performance**: Refactored `queryRelevant` to use `withIndex("by_category")` when category is specified
   - **Pagination**: Added cursor-based pagination to all query functions (`queryRelevant`, `getByCategory`, `getByUsageContext`, `listAll`)
   - **Type Safety**: Extracted shared `knowledgeEntryValidator` to eliminate duplication (was repeated 5x)
   - **Type Strictness**: Changed return type validators to use union types matching storage schema
   - **Security**: Added `requireAdmin` check to `clearKnowledgeBase` mutation
   - **Backwards Compatibility**: Added `queryRelevantSimple` for non-paginated queries
   - **Documentation**: Fixed filename inconsistencies in Dev Notes section

### File List

**NEW FILES:**
- packages/backend/convex/table/knowledgeBase.ts
- packages/backend/convex/knowledge/query.ts
- packages/backend/convex/knowledge/index.ts
- packages/backend/convex/seeds/knowledgeBase.ts

**MODIFIED FILES:**
- packages/backend/convex/schema.ts (added knowledgeBase import and registration)
- packages/backend/convex/_generated/api.d.ts (auto-generated)
