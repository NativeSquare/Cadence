// =============================================================================
// Knowledge Base Module Barrel Export (Story 6.3)
// =============================================================================
// Re-exports all knowledge base query functions and types.
//
// Usage:
//   import { queryRelevant, getByCategory } from "./knowledge";
//   import type { KnowledgeEntry } from "./knowledge";

// Query functions
export {
  queryRelevant,
  queryRelevantSimple,
  getById,
  getByCategory,
  getByUsageContext,
  listAll,
} from "./query";

// Types from table definition
export type {
  KnowledgeEntry,
  KnowledgeCategory,
  KnowledgeConfidence,
  KnowledgeUsageContext,
} from "../table/knowledgeBase";
