/**
 * Network Status Hook Tests (Story 8.1, Task 2)
 *
 * NOTE: These tests require Jest and @testing-library/react-native to be installed.
 * Run: pnpm add -D jest @testing-library/react-native @types/jest react-test-renderer
 *
 * Tests cover:
 * - AC2: Network status detection (online/offline/unknown)
 * - AC4: Auto-detection of connectivity changes
 * - Debounce behavior prevents rapid state flicker
 * - Connection type detection (wifi, cellular, none)
 */

import { renderHook, act, waitFor } from "@testing-library/react-native";
import { useNetworkStatus } from "../use-network-status";

// Mock NetInfo
const mockAddEventListener = jest.fn();
const mockFetch = jest.fn();
const mockUnsubscribe = jest.fn();

jest.mock("@react-native-community/netinfo", () => ({
  addEventListener: (callback: (state: unknown) => void) => {
    mockAddEventListener(callback);
    return mockUnsubscribe;
  },
  fetch: () => mockFetch(),
}));

describe("useNetworkStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("initial state", () => {
    it("returns unknown status before network check completes", () => {
      mockFetch.mockResolvedValue({
        isConnected: null,
        isInternetReachable: null,
        type: "unknown",
      });

      const { result } = renderHook(() => useNetworkStatus());

      expect(result.current.status).toBe("unknown");
      expect(result.current.isOnline).toBe(false);
      expect(result.current.isOffline).toBe(false);
    });

    it("returns online when connected with internet reachable", async () => {
      mockFetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: "wifi",
      });

      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.status).toBe("online");
      });

      expect(result.current.isOnline).toBe(true);
      expect(result.current.isOffline).toBe(false);
      expect(result.current.connectionType).toBe("wifi");
    });

    it("returns offline when not connected", async () => {
      mockFetch.mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
        type: "none",
      });

      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.status).toBe("offline");
      });

      expect(result.current.isOnline).toBe(false);
      expect(result.current.isOffline).toBe(true);
      expect(result.current.connectionType).toBe("none");
    });
  });

  describe("connection type detection", () => {
    it("detects wifi connection", async () => {
      mockFetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: "wifi",
      });

      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.connectionType).toBe("wifi");
      });
    });

    it("detects cellular connection", async () => {
      mockFetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: "cellular",
      });

      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.connectionType).toBe("cellular");
      });
    });

    it("detects no connection (airplane mode)", async () => {
      mockFetch.mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
        type: "none",
      });

      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.connectionType).toBe("none");
      });
      expect(result.current.isOffline).toBe(true);
    });
  });

  describe("state changes", () => {
    it("updates state when network becomes available", async () => {
      mockFetch.mockResolvedValue({
        isConnected: false,
        isInternetReachable: false,
        type: "none",
      });

      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isOffline).toBe(true);
      });

      // Simulate network becoming available
      const listener = mockAddEventListener.mock.calls[0][0];
      act(() => {
        listener({
          isConnected: true,
          isInternetReachable: true,
          type: "wifi",
        });
      });

      // Online transitions should be immediate
      expect(result.current.status).toBe("online");
      expect(result.current.isOnline).toBe(true);
    });

    it("debounces transition to offline (500ms)", async () => {
      mockFetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: "wifi",
      });

      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });

      // Simulate network loss
      const listener = mockAddEventListener.mock.calls[0][0];
      act(() => {
        listener({
          isConnected: false,
          isInternetReachable: false,
          type: "none",
        });
      });

      // Should still be online (debouncing)
      expect(result.current.status).toBe("online");

      // Advance timers past debounce threshold
      act(() => {
        jest.advanceTimersByTime(600);
      });

      // Now should be offline
      expect(result.current.status).toBe("offline");
    });

    it("cancels offline transition if network returns within debounce", async () => {
      mockFetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: "wifi",
      });

      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isOnline).toBe(true);
      });

      const listener = mockAddEventListener.mock.calls[0][0];

      // Simulate brief network loss
      act(() => {
        listener({
          isConnected: false,
          isInternetReachable: false,
          type: "none",
        });
      });

      // Advance time but not past debounce
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Network returns
      act(() => {
        listener({
          isConnected: true,
          isInternetReachable: true,
          type: "cellular",
        });
      });

      // Should stay online (brief blip ignored)
      expect(result.current.status).toBe("online");

      // Advance past original debounce time
      act(() => {
        jest.advanceTimersByTime(500);
      });

      // Should still be online
      expect(result.current.status).toBe("online");
    });
  });

  describe("internet reachability", () => {
    it("returns offline when connected but internet not reachable", async () => {
      mockFetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: false,
        type: "wifi",
      });

      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.status).toBe("offline");
      });

      expect(result.current.isConnected).toBe(true);
      expect(result.current.isInternetReachable).toBe(false);
    });
  });

  describe("refresh", () => {
    it("manually refreshes network state", async () => {
      mockFetch
        .mockResolvedValueOnce({
          isConnected: false,
          isInternetReachable: false,
          type: "none",
        })
        .mockResolvedValueOnce({
          isConnected: true,
          isInternetReachable: true,
          type: "wifi",
        });

      const { result } = renderHook(() => useNetworkStatus());

      await waitFor(() => {
        expect(result.current.isOffline).toBe(true);
      });

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.isOnline).toBe(true);
    });
  });

  describe("cleanup", () => {
    it("unsubscribes from NetInfo on unmount", () => {
      mockFetch.mockResolvedValue({
        isConnected: true,
        isInternetReachable: true,
        type: "wifi",
      });

      const { unmount } = renderHook(() => useNetworkStatus());

      unmount();

      expect(mockUnsubscribe).toHaveBeenCalled();
    });
  });
});
