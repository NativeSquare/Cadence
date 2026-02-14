/**
 * MockPathContext - Provides DATA vs NO DATA path state to all screens.
 *
 * Used by OnboardingFlowMock to allow path toggling for testing.
 * All child screens read hasData from this context.
 *
 * Source: Story 3.5 - Task 2 (AC#2, #7)
 */

import { createContext, useContext, useState, type ReactNode } from "react";

// =============================================================================
// Types
// =============================================================================

export interface MockPathContextValue {
  /** True if wearable data available (DATA path), false for self-reported only */
  hasData: boolean;
  /** Toggle between DATA and NO DATA paths */
  togglePath: () => void;
  /** Set path explicitly */
  setPath: (path: "data" | "no-data") => void;
}

interface MockPathProviderProps {
  /** Initial path: 'data' or 'no-data' */
  initialPath?: "data" | "no-data";
  /** Children to wrap */
  children: ReactNode;
}

// =============================================================================
// Context
// =============================================================================

const MockPathContext = createContext<MockPathContextValue | null>(null);

// =============================================================================
// Provider Component
// =============================================================================

export function MockPathProvider({
  initialPath = "no-data",
  children,
}: MockPathProviderProps) {
  const [hasData, setHasData] = useState(initialPath === "data");

  const togglePath = () => setHasData((prev) => !prev);
  const setPath = (path: "data" | "no-data") => setHasData(path === "data");

  return (
    <MockPathContext.Provider value={{ hasData, togglePath, setPath }}>
      {children}
    </MockPathContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Access the mock path context.
 * Must be used within a MockPathProvider.
 */
export function useMockPath(): MockPathContextValue {
  const context = useContext(MockPathContext);
  if (!context) {
    throw new Error("useMockPath must be used within MockPathProvider");
  }
  return context;
}

/**
 * Optional access to mock path context.
 * Returns null if not within a MockPathProvider (for standalone screen testing).
 */
export function useMockPathOptional(): MockPathContextValue | null {
  return useContext(MockPathContext);
}
