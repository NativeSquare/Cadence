/**
 * Module-scoped progress store for the HealthKit background sync.
 *
 * The sync runs non-blocking after `useHealthKit().connect()` returns, so its
 * state must survive the calling component unmounting (e.g. the user
 * navigating away from the Connections screen). Keeping state in a
 * module singleton rather than React state means any subscribed component
 * reflects the current phase regardless of mount order.
 */

import { useSyncExternalStore } from "react";

export type HealthKitSyncPhase =
  | "idle"
  | "connecting"
  | "syncing"
  | "complete"
  | "error";

export type HealthKitSyncProgress = {
  phase: HealthKitSyncPhase;
  error?: string;
};

const INITIAL_STATE: HealthKitSyncProgress = {
  phase: "idle",
};

let state: HealthKitSyncProgress = INITIAL_STATE;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function getHealthKitSyncState(): HealthKitSyncProgress {
  return state;
}

export function setHealthKitSyncState(
  patch: Partial<HealthKitSyncProgress>,
): void {
  state = { ...state, ...patch };
  emit();
}

export function resetHealthKitSyncState(): void {
  state = INITIAL_STATE;
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useHealthKitSyncProgress(): HealthKitSyncProgress {
  return useSyncExternalStore(subscribe, getHealthKitSyncState, getHealthKitSyncState);
}
