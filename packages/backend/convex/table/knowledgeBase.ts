import { defineTable } from "convex/server";
import { v } from "convex/values";

// =============================================================================
// Knowledge Base Table Schema (Story 6.3)
// =============================================================================
// Stores training science knowledge for AI coach recommendations.
// Used by: Plan Generator, AI Coach (RAG), Safeguard explanations
//
// Reference: data-model-comprehensive.md#Knowledge-Base-Tier-5
// Reference: architecture-backend-v2.md#Module-4-Knowledge-Base

// Category types for knowledge entries
const categoryValues = v.union(
  v.literal("physiology"),
  v.literal("training_principles"),
  v.literal("periodization"),
  v.literal("recovery"),
  v.literal("injury_prevention"),
  v.literal("nutrition"),
  v.literal("mental")
);

// Confidence levels for knowledge entries
const confidenceValues = v.union(
  v.literal("established"), // Well-proven, widely accepted
  v.literal("well_supported"), // Good evidence, generally accepted
  v.literal("emerging"), // Promising research, gaining acceptance
  v.literal("experimental") // New research, limited evidence
);

// Usage context - where this knowledge should be applied
const usageContextValues = v.union(
  v.literal("plan_generation"),
  v.literal("coaching_advice"),
  v.literal("explanation"),
  v.literal("safety")
);

export const knowledgeBase = defineTable({
  // Categorization
  category: categoryValues,
  subcategory: v.optional(v.string()),
  tags: v.array(v.string()),

  // Content
  title: v.string(),
  content: v.string(),
  summary: v.string(),

  // Applicability
  applicableGoals: v.optional(v.array(v.string())), // ["race", "base_building"]
  applicableExperience: v.optional(v.array(v.string())), // ["beginner", "intermediate", "advanced"]
  applicablePhases: v.optional(v.array(v.string())), // ["base", "build", "peak", "taper"]

  // Source & Validation
  source: v.string(), // "daniels_running_formula" | "pfitzinger" | "research_paper" | "established_practice"
  sourceReference: v.optional(v.string()),
  validatedBy: v.optional(v.array(v.string())),
  validatedAt: v.optional(v.number()),
  confidence: confidenceValues,

  // Usage
  usageContext: usageContextValues,
  isActive: v.boolean(),

  // Embedding (For future RAG)
  embedding: v.optional(v.array(v.float64())),
  embeddingModel: v.optional(v.string()),

  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
  version: v.number(),
})
  .index("by_category", ["category"])
  .index("by_usage", ["usageContext", "isActive"]);

// =============================================================================
// Exported Types
// =============================================================================

export type KnowledgeEntry = typeof knowledgeBase.validator.type;
export type KnowledgeCategory = typeof categoryValues.type;
export type KnowledgeConfidence = typeof confidenceValues.type;
export type KnowledgeUsageContext = typeof usageContextValues.type;
