/**
 * Persisted "verbose" preference for the Coach chat UI.
 *
 * When verbose is OFF (default), the chat hides reading-tool pills like
 * "Checking sessions…" so the conversation reads cleanly. Power users can
 * flip it ON via the chat header to see every tool the coach calls.
 *
 * Stored in AsyncStorage so it survives app restarts; module-scoped so
 * any subscribed component reflects the current value regardless of mount
 * order. Mirrors the `useHealthKitSyncProgress` pattern.
 */

import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "coach.verbose.v1";

let value = false;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

async function hydrate() {
  if (hydrated) return;
  hydrated = true;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw === "1" && value !== true) {
      value = true;
      emit();
    }
  } catch (err) {
    console.warn("[coach-verbose] hydrate failed", err);
  }
}

void hydrate();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  return value;
}

export function setCoachVerbose(next: boolean): void {
  if (value === next) return;
  value = next;
  emit();
  AsyncStorage.setItem(STORAGE_KEY, next ? "1" : "0").catch((err) => {
    console.warn("[coach-verbose] persist failed", err);
  });
}

export function toggleCoachVerbose(): void {
  setCoachVerbose(!value);
}

export function useCoachVerbose(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
