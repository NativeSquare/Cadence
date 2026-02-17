/**
 * Network Context
 *
 * Provides app-wide network connectivity state.
 * Wraps the useNetworkStatus hook to provide context values.
 *
 * Source: Story 8.1 - AC#2, AC#3, AC#4
 */

import { createContext, useContext, type ReactNode } from "react";
import {
  useNetworkStatus,
  type NetworkStatus,
  type ConnectionType,
} from "@/hooks/use-network-status";

// =============================================================================
// Types
// =============================================================================

interface NetworkContextValue {
  /** Current network status: 'online' | 'offline' | 'unknown' */
  status: NetworkStatus;
  /** Connection type: 'wifi' | 'cellular' | 'ethernet' | 'none' | 'unknown' */
  connectionType: ConnectionType;
  /** Whether device has any network connection */
  isConnected: boolean;
  /** Whether internet is actually reachable (can be null during check) */
  isInternetReachable: boolean | null;
  /** Convenience: true when status is 'online' */
  isOnline: boolean;
  /** Convenience: true when status is 'offline' */
  isOffline: boolean;
  /** Manually refresh network state (for retry functionality) */
  refresh: () => Promise<boolean>;
}

// =============================================================================
// Context
// =============================================================================

const NetworkContext = createContext<NetworkContextValue | null>(null);

// =============================================================================
// Provider
// =============================================================================

interface NetworkProviderProps {
  children: ReactNode;
}

/**
 * NetworkProvider wraps the app to provide network state.
 *
 * Should be placed near the root of the app, typically in _layout.tsx.
 *
 * @example
 * <NetworkProvider>
 *   <App />
 * </NetworkProvider>
 */
export function NetworkProvider({ children }: NetworkProviderProps) {
  const networkState = useNetworkStatus();

  return (
    <NetworkContext.Provider value={networkState}>
      {children}
    </NetworkContext.Provider>
  );
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Hook to access network connectivity state.
 *
 * @throws Error if used outside NetworkProvider
 *
 * @example
 * function MyComponent() {
 *   const { isOnline, isOffline, connectionType } = useNetwork();
 *
 *   if (isOffline) {
 *     return <OfflineScreen />;
 *   }
 *
 *   return <OnlineContent />;
 * }
 */
export function useNetwork(): NetworkContextValue {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}

/**
 * Optional hook that returns null if used outside provider.
 * Useful for components that may or may not be within the provider.
 */
export function useNetworkOptional(): NetworkContextValue | null {
  return useContext(NetworkContext);
}
