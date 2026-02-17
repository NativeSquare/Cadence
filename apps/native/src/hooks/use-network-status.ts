import { useEffect, useState, useRef, useCallback } from "react";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

export type NetworkStatus = "online" | "offline" | "unknown";
export type ConnectionType = "wifi" | "cellular" | "ethernet" | "none" | "unknown";

interface NetworkState {
  status: NetworkStatus;
  connectionType: ConnectionType;
  isConnected: boolean;
  isInternetReachable: boolean | null;
}

const DEBOUNCE_MS = 500;

function mapConnectionType(state: NetInfoState): ConnectionType {
  if (!state.isConnected) return "none";
  switch (state.type) {
    case "wifi":
      return "wifi";
    case "cellular":
      return "cellular";
    case "ethernet":
      return "ethernet";
    default:
      return "unknown";
  }
}

function deriveNetworkStatus(state: NetInfoState): NetworkStatus {
  // Handle initial unknown state
  if (state.isConnected === null) return "unknown";

  // Consider both connection and internet reachability
  // isInternetReachable can be null during initial check
  if (!state.isConnected) return "offline";

  // If connected but internet not reachable (and we know it's not reachable)
  if (state.isInternetReachable === false) return "offline";

  return "online";
}

/**
 * Hook to monitor network connectivity status.
 *
 * Features:
 * - Real-time network state monitoring
 * - Debounced state changes to prevent flicker during brief disconnections
 * - Connection type detection (WiFi, cellular, etc.)
 * - Internet reachability check
 *
 * @returns Network state with status, connection type, and helper booleans
 */
export function useNetworkStatus() {
  const [state, setState] = useState<NetworkState>({
    status: "unknown",
    connectionType: "unknown",
    isConnected: false,
    isInternetReachable: null,
  });

  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastStateRef = useRef<NetInfoState | null>(null);

  // Refresh network state manually (for retry functionality)
  const refresh = useCallback(async () => {
    const netState = await NetInfo.fetch();
    setState({
      status: deriveNetworkStatus(netState),
      connectionType: mapConnectionType(netState),
      isConnected: netState.isConnected ?? false,
      isInternetReachable: netState.isInternetReachable,
    });
    return netState.isConnected ?? false;
  }, []);

  useEffect(() => {
    // Fetch initial state
    NetInfo.fetch().then((netState) => {
      lastStateRef.current = netState;
      setState({
        status: deriveNetworkStatus(netState),
        connectionType: mapConnectionType(netState),
        isConnected: netState.isConnected ?? false,
        isInternetReachable: netState.isInternetReachable,
      });
    });

    // Subscribe to network state changes with debounce
    const unsubscribe = NetInfo.addEventListener((netState) => {
      // Clear any pending debounce
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      const newStatus = deriveNetworkStatus(netState);
      const oldStatus = lastStateRef.current
        ? deriveNetworkStatus(lastStateRef.current)
        : "unknown";

      // If transitioning to offline, debounce to avoid flicker
      // If transitioning to online, update immediately for responsive UX
      if (newStatus === "offline" && oldStatus === "online") {
        debounceTimeoutRef.current = setTimeout(() => {
          lastStateRef.current = netState;
          setState({
            status: deriveNetworkStatus(netState),
            connectionType: mapConnectionType(netState),
            isConnected: netState.isConnected ?? false,
            isInternetReachable: netState.isInternetReachable,
          });
        }, DEBOUNCE_MS);
      } else {
        // Immediate update for online or unknown states
        lastStateRef.current = netState;
        setState({
          status: deriveNetworkStatus(netState),
          connectionType: mapConnectionType(netState),
          isConnected: netState.isConnected ?? false,
          isInternetReachable: netState.isInternetReachable,
        });
      }
    });

    return () => {
      unsubscribe();
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    isOnline: state.status === "online",
    isOffline: state.status === "offline",
    refresh,
  };
}
