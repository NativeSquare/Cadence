/**
 * Data Adapters Module
 *
 * Provides a unified interface for normalizing wearable data
 * from multiple sources into the Cadence activities schema.
 *
 * NOTE: HealthKit data is now ingested through the @nativesquare/soma
 * component. This module remains for any future non-Soma adapters.
 */

// Types
export type { DataAdapter, DataSource, PartialActivity } from "./types";

// Registry
export { getAdapter, registerAdapter, getSupportedSources } from "./registry";
