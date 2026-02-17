/**
 * Adapter Registry
 *
 * Central registry for wearable data adapters.
 * Provides source-agnostic access to adapters via getAdapter().
 *
 * NOTE: HealthKit data is now ingested through the @nativesquare/soma
 * Convex component. This registry remains for any future non-Soma adapters
 * (e.g., Strava direct integration, manual entry).
 */

import type { DataAdapter, DataSource } from "./types";

/** Registry of all registered adapters */
const adapters: Map<DataSource, DataAdapter> = new Map([
  // HealthKit: migrated to @nativesquare/soma component
  // Future: ["strava", stravaAdapter], ["garmin", garminAdapter]
]);

/**
 * Get an adapter by source name.
 *
 * @param source - The data source identifier
 * @returns The adapter for the specified source
 * @throws Error if no adapter is registered for the source
 */
export function getAdapter(source: DataSource): DataAdapter {
  const adapter = adapters.get(source);
  if (!adapter) {
    throw new Error(`No adapter registered for source: ${source}`);
  }
  return adapter;
}

/**
 * Register a new adapter.
 * Primarily used for testing or dynamic adapter loading.
 *
 * @param adapter - The adapter to register
 */
export function registerAdapter(adapter: DataAdapter): void {
  adapters.set(adapter.source, adapter);
}

/**
 * Get all supported data sources.
 *
 * @returns Array of registered source identifiers
 */
export function getSupportedSources(): DataSource[] {
  return Array.from(adapters.keys());
}
