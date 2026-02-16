/**
 * Data Adapters Module
 *
 * Provides a unified interface for normalizing wearable data
 * from multiple sources into the Cadence activities schema.
 *
 * Usage:
 *   import { getAdapter } from "./lib/adapters";
 *   const adapter = getAdapter("healthkit");
 *   const activity = adapter.normalizeActivity(raw, runnerId, userId);
 */

// Types
export type { DataAdapter, DataSource, PartialActivity } from "./types";

// Adapters
export { healthkitAdapter } from "./healthkit";
export type { RawHealthKitWorkout } from "./healthkit";

// Registry
export { getAdapter, registerAdapter, getSupportedSources } from "./registry";
