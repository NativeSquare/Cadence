import { v } from "convex/values";
import { query } from "../_generated/server";

// =============================================================================
// Knowledge Base Query Functions (Story 6.3)
// =============================================================================
// Query functions for accessing training science knowledge.
// Used by: Plan Generator, AI Coach, Safeguard explanations
//
// Reference: architecture-backend-v2.md#Module-4-Knowledge-Base

// =============================================================================
// Shared Validators (extracted to avoid duplication)
// =============================================================================

const categoryValidator = v.union(
  v.literal("physiology"),
  v.literal("training_principles"),
  v.literal("periodization"),
  v.literal("recovery"),
  v.literal("injury_prevention"),
  v.literal("nutrition"),
  v.literal("mental")
);

const confidenceValidator = v.union(
  v.literal("established"),
  v.literal("well_supported"),
  v.literal("emerging"),
  v.literal("experimental")
);

const usageContextValidator = v.union(
  v.literal("plan_generation"),
  v.literal("coaching_advice"),
  v.literal("explanation"),
  v.literal("safety")
);

/**
 * Shared return type validator for knowledge entries.
 * Extracted to avoid duplication across query functions.
 */
const knowledgeEntryValidator = v.object({
  _id: v.id("knowledgeBase"),
  _creationTime: v.number(),
  category: categoryValidator,
  subcategory: v.optional(v.string()),
  tags: v.array(v.string()),
  title: v.string(),
  content: v.string(),
  summary: v.string(),
  applicableGoals: v.optional(v.array(v.string())),
  applicableExperience: v.optional(v.array(v.string())),
  applicablePhases: v.optional(v.array(v.string())),
  source: v.string(),
  sourceReference: v.optional(v.string()),
  validatedBy: v.optional(v.array(v.string())),
  validatedAt: v.optional(v.number()),
  confidence: confidenceValidator,
  usageContext: usageContextValidator,
  isActive: v.boolean(),
  embedding: v.optional(v.array(v.float64())),
  embeddingModel: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  version: v.number(),
});

// =============================================================================
// Query Functions
// =============================================================================

/**
 * Query relevant knowledge entries with flexible filtering.
 *
 * Supports:
 * - Tag filtering (match any tag)
 * - Category filtering (exact match, index-optimized)
 * - Runner context filtering (experience, goalType, injuries)
 * - Pagination via cursor
 *
 * AC #2: Query function per specification
 */
export const queryRelevant = query({
  args: {
    tags: v.optional(v.array(v.string())),
    category: v.optional(categoryValidator),
    runnerContext: v.optional(
      v.object({
        experience: v.optional(v.string()),
        goalType: v.optional(v.string()),
        injuries: v.optional(v.array(v.string())),
      })
    ),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    entries: v.array(knowledgeEntryValidator),
    nextCursor: v.union(v.string(), v.null()),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const pageSize = args.limit ?? 50;

    // Use index-based query when category is specified for better performance
    let baseQuery;
    if (args.category) {
      baseQuery = ctx.db
        .query("knowledgeBase")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .filter((q) => q.eq(q.field("isActive"), true));
    } else {
      baseQuery = ctx.db
        .query("knowledgeBase")
        .filter((q) => q.eq(q.field("isActive"), true));
    }

    // Paginate the query
    const paginatedResult = await baseQuery.paginate({
      numItems: pageSize + 1, // Fetch one extra to check if there's more
      cursor: args.cursor ? JSON.parse(args.cursor) : null,
    });

    let entries = paginatedResult.page;
    const hasMore = entries.length > pageSize;
    if (hasMore) {
      entries = entries.slice(0, pageSize);
    }

    // Filter by tags if specified (match any tag)
    if (args.tags && args.tags.length > 0) {
      entries = entries.filter((e) =>
        args.tags!.some((tag) => e.tags.includes(tag))
      );
    }

    // Filter by runner context if specified
    if (args.runnerContext) {
      const runnerCtx = args.runnerContext;

      entries = entries.filter((e) => {
        // Check experience match
        if (runnerCtx.experience && e.applicableExperience) {
          if (!e.applicableExperience.includes(runnerCtx.experience)) {
            return false;
          }
        }

        // Check goal type match
        if (runnerCtx.goalType && e.applicableGoals) {
          if (!e.applicableGoals.includes(runnerCtx.goalType)) {
            return false;
          }
        }

        // Injury matching - include entries relevant to runner's injuries
        // This is an inclusion filter, not exclusion
        // Entries without injury tags still pass through
        if (runnerCtx.injuries && runnerCtx.injuries.length > 0) {
          const hasInjuryTag = e.tags.some((tag) =>
            tag.toLowerCase().includes("injury")
          );
          if (hasInjuryTag) {
            // For injury-related entries, check if any runner injury matches
            const injuryTags = runnerCtx.injuries.map((i) => i.toLowerCase());
            const matchesInjury = e.tags.some((tag) =>
              injuryTags.some(
                (injury) =>
                  tag.toLowerCase().includes(injury) ||
                  injury.includes(tag.toLowerCase())
              )
            );
            // Keep injury entries that match runner's injuries
            if (!matchesInjury) {
              return false;
            }
          }
        }

        return true;
      });
    }

    return {
      entries,
      nextCursor: paginatedResult.continueCursor
        ? JSON.stringify(paginatedResult.continueCursor)
        : null,
      hasMore: !paginatedResult.isDone,
    };
  },
});

/**
 * Simple query without pagination for backwards compatibility.
 * Use queryRelevant for paginated results.
 */
export const queryRelevantSimple = query({
  args: {
    tags: v.optional(v.array(v.string())),
    category: v.optional(categoryValidator),
    runnerContext: v.optional(
      v.object({
        experience: v.optional(v.string()),
        goalType: v.optional(v.string()),
        injuries: v.optional(v.array(v.string())),
      })
    ),
    limit: v.optional(v.number()),
  },
  returns: v.array(knowledgeEntryValidator),
  handler: async (ctx, args) => {
    // Use index-based query when category is specified
    let entries;
    if (args.category) {
      entries = await ctx.db
        .query("knowledgeBase")
        .withIndex("by_category", (q) => q.eq("category", args.category!))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    } else {
      entries = await ctx.db
        .query("knowledgeBase")
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();
    }

    // Filter by tags if specified (match any tag)
    if (args.tags && args.tags.length > 0) {
      entries = entries.filter((e) =>
        args.tags!.some((tag) => e.tags.includes(tag))
      );
    }

    // Filter by runner context if specified
    if (args.runnerContext) {
      const runnerCtx = args.runnerContext;

      entries = entries.filter((e) => {
        if (runnerCtx.experience && e.applicableExperience) {
          if (!e.applicableExperience.includes(runnerCtx.experience)) {
            return false;
          }
        }
        if (runnerCtx.goalType && e.applicableGoals) {
          if (!e.applicableGoals.includes(runnerCtx.goalType)) {
            return false;
          }
        }
        if (runnerCtx.injuries && runnerCtx.injuries.length > 0) {
          const hasInjuryTag = e.tags.some((tag) =>
            tag.toLowerCase().includes("injury")
          );
          if (hasInjuryTag) {
            const injuryTags = runnerCtx.injuries.map((i) => i.toLowerCase());
            const matchesInjury = e.tags.some((tag) =>
              injuryTags.some(
                (injury) =>
                  tag.toLowerCase().includes(injury) ||
                  injury.includes(tag.toLowerCase())
              )
            );
            if (!matchesInjury) {
              return false;
            }
          }
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

/**
 * Get a single knowledge entry by ID.
 */
export const getById = query({
  args: { id: v.id("knowledgeBase") },
  returns: v.union(knowledgeEntryValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get all entries in a category.
 * Uses the by_category index for efficient querying.
 */
export const getByCategory = query({
  args: {
    category: categoryValidator,
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    entries: v.array(knowledgeEntryValidator),
    nextCursor: v.union(v.string(), v.null()),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const pageSize = args.limit ?? 50;

    const paginatedResult = await ctx.db
      .query("knowledgeBase")
      .withIndex("by_category", (q) => q.eq("category", args.category))
      .filter((q) => q.eq(q.field("isActive"), true))
      .paginate({
        numItems: pageSize,
        cursor: args.cursor ? JSON.parse(args.cursor) : null,
      });

    return {
      entries: paginatedResult.page,
      nextCursor: paginatedResult.continueCursor
        ? JSON.stringify(paginatedResult.continueCursor)
        : null,
      hasMore: !paginatedResult.isDone,
    };
  },
});

/**
 * Get entries by usage context.
 * Uses the by_usage index for efficient querying.
 */
export const getByUsageContext = query({
  args: {
    usageContext: usageContextValidator,
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    entries: v.array(knowledgeEntryValidator),
    nextCursor: v.union(v.string(), v.null()),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const pageSize = args.limit ?? 50;

    const paginatedResult = await ctx.db
      .query("knowledgeBase")
      .withIndex("by_usage", (q) =>
        q.eq("usageContext", args.usageContext).eq("isActive", true)
      )
      .paginate({
        numItems: pageSize,
        cursor: args.cursor ? JSON.parse(args.cursor) : null,
      });

    return {
      entries: paginatedResult.page,
      nextCursor: paginatedResult.continueCursor
        ? JSON.stringify(paginatedResult.continueCursor)
        : null,
      hasMore: !paginatedResult.isDone,
    };
  },
});

/**
 * Get all active entries with pagination (useful for debugging/admin).
 */
export const listAll = query({
  args: {
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    entries: v.array(knowledgeEntryValidator),
    nextCursor: v.union(v.string(), v.null()),
    hasMore: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const pageSize = args.limit ?? 50;

    const paginatedResult = await ctx.db
      .query("knowledgeBase")
      .filter((q) => q.eq(q.field("isActive"), true))
      .paginate({
        numItems: pageSize,
        cursor: args.cursor ? JSON.parse(args.cursor) : null,
      });

    return {
      entries: paginatedResult.page,
      nextCursor: paginatedResult.continueCursor
        ? JSON.stringify(paginatedResult.continueCursor)
        : null,
      hasMore: !paginatedResult.isDone,
    };
  },
});
