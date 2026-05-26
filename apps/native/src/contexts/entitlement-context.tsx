import {
  configurePurchases,
  identifyUser,
  isProActive,
  isPurchasesSupported,
  logoutPurchases,
  toSubscriptionSync,
} from "@/lib/purchases";
import { api } from "@packages/backend/convex/_generated/api";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import Purchases, { type CustomerInfo } from "react-native-purchases";

type EntitlementValue = {
  /** True when the user holds the active "pro" entitlement. */
  isPro: boolean;
  /** True until the initial entitlement state has been resolved. */
  isLoading: boolean;
  /**
   * Whether the hard paywall should be enforced at all. Only true once billing
   * is configured (API key present + native build) — keeps dev/web unblocked.
   */
  gateActive: boolean;
};

const EntitlementContext = createContext<EntitlementValue>({
  isPro: false,
  isLoading: true,
  gateActive: false,
});

export function useEntitlement(): EntitlementValue {
  return useContext(EntitlementContext);
}

export function EntitlementProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useConvexAuth();
  const user = useQuery(
    api.table.users.currentUser,
    isAuthenticated ? {} : "skip",
  );
  const syncSubscription = useMutation(api.table.users.syncSubscription);

  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(isPurchasesSupported);

  // Reflect a CustomerInfo into local state and mirror it into Convex so the
  // backend can gate expensive ops. (The RevenueCat webhook is the
  // authoritative writer; this just avoids webhook latency after a purchase.)
  const apply = useCallback(
    (info: CustomerInfo | null) => {
      setIsPro(isProActive(info));
      if (info) {
        syncSubscription(toSubscriptionSync(info)).catch((e) =>
          console.warn("[entitlement] sync failed", e),
        );
      }
    },
    [syncSubscription],
  );

  // Configure the SDK once at startup.
  useEffect(() => {
    configurePurchases();
  }, []);

  // Bind/unbind RevenueCat identity to the Convex user and resolve entitlement.
  useEffect(() => {
    if (!isPurchasesSupported) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;

    if (isAuthenticated) {
      if (!user?._id) return; // wait for the user doc before identifying
      identifyUser(user._id).then((info) => {
        if (cancelled) return;
        apply(info);
        setIsLoading(false);
      });
    } else {
      logoutPurchases().then(() => {
        if (cancelled) return;
        setIsPro(false);
        setIsLoading(false);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?._id, apply]);

  // Live updates: renewals, expirations, purchases made outside the app, etc.
  useEffect(() => {
    if (!isPurchasesSupported) return;
    const listener = (info: CustomerInfo) => apply(info);
    Purchases.addCustomerInfoUpdateListener(listener);
    return () => {
      Purchases.removeCustomerInfoUpdateListener(listener);
    };
  }, [apply]);

  return (
    <EntitlementContext.Provider
      value={{ isPro, isLoading, gateActive: isPurchasesSupported }}
    >
      {children}
    </EntitlementContext.Provider>
  );
}
