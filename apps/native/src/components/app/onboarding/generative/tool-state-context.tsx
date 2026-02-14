/**
 * Tool State Context
 *
 * Context and hook for tracking tool call lifecycle states.
 * Manages streaming, executing, complete, and error states.
 *
 * Source: Story 2.2 - AC#2, AC#3
 */

import { createContext, useContext, useCallback, useMemo, ReactNode } from "react";
import { useState } from "react";
import type { ToolState } from "./types";

// =============================================================================
// Types
// =============================================================================

interface ToolStateEntry {
  state: ToolState;
  toolName: string;
  updatedAt: number;
}

interface ToolStateContextValue {
  /** Get the current state of a tool call */
  getToolState: (toolCallId: string) => ToolState;
  /** Update the state of a tool call */
  setToolState: (toolCallId: string, toolName: string, state: ToolState) => void;
  /** Check if a tool is in a specific state */
  isToolInState: (toolCallId: string, state: ToolState) => boolean;
  /** Clear all tool states (for cleanup) */
  clearAllStates: () => void;
}

// =============================================================================
// Context
// =============================================================================

const ToolStateContext = createContext<ToolStateContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

interface ToolStateProviderProps {
  children: ReactNode;
}

export function ToolStateProvider({ children }: ToolStateProviderProps) {
  const [toolStates, setToolStates] = useState<Map<string, ToolStateEntry>>(
    () => new Map()
  );

  const getToolState = useCallback(
    (toolCallId: string): ToolState => {
      const entry = toolStates.get(toolCallId);
      return entry?.state ?? "streaming";
    },
    [toolStates]
  );

  const setToolState = useCallback(
    (toolCallId: string, toolName: string, state: ToolState) => {
      setToolStates((prev) => {
        const next = new Map(prev);
        next.set(toolCallId, {
          state,
          toolName,
          updatedAt: Date.now(),
        });
        return next;
      });
    },
    []
  );

  const isToolInState = useCallback(
    (toolCallId: string, state: ToolState): boolean => {
      return getToolState(toolCallId) === state;
    },
    [getToolState]
  );

  const clearAllStates = useCallback(() => {
    setToolStates(new Map());
  }, []);

  const value = useMemo(
    () => ({
      getToolState,
      setToolState,
      isToolInState,
      clearAllStates,
    }),
    [getToolState, setToolState, isToolInState, clearAllStates]
  );

  return (
    <ToolStateContext.Provider value={value}>
      {children}
    </ToolStateContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access tool state management
 *
 * @example
 * const { getToolState, setToolState } = useToolStateContext();
 *
 * // Check current state
 * const state = getToolState(toolCallId);
 *
 * // Update state when tool completes
 * setToolState(toolCallId, 'renderMultipleChoice', 'result');
 */
export function useToolStateContext(): ToolStateContextValue {
  const context = useContext(ToolStateContext);
  if (!context) {
    throw new Error("useToolStateContext must be used within a ToolStateProvider");
  }
  return context;
}

/**
 * Hook for a specific tool call's state
 *
 * @example
 * const { state, setState, isComplete } = useToolState('tool_123', 'renderMultipleChoice');
 */
export function useToolState(toolCallId: string, toolName: string) {
  const { getToolState, setToolState, isToolInState } = useToolStateContext();

  const state = getToolState(toolCallId);

  const setState = useCallback(
    (newState: ToolState) => {
      setToolState(toolCallId, toolName, newState);
    },
    [toolCallId, toolName, setToolState]
  );

  const isStreaming = isToolInState(toolCallId, "streaming");
  const isExecuting = isToolInState(toolCallId, "call");
  const isComplete = isToolInState(toolCallId, "result");
  const isError = isToolInState(toolCallId, "error");

  return {
    state,
    setState,
    isStreaming,
    isExecuting,
    isComplete,
    isError,
  };
}
