import { Platform } from "react-native";
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";

// RevenueCat entitlement identifier — must match the entitlement configured in
// the RevenueCat dashboard. A single "Cadence Pro" entitlement gates the app.
export const ENTITLEMENT_ID = "Cadence Pro";

// RevenueCat offering identifier. We read `offerings.current` first (an offering
// literally named "default" is auto-marked current) and fall back to this id.
const OFFERING_ID = "default";

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;

function apiKey(): string | undefined {
  if (Platform.OS === "ios") return IOS_KEY;
  if (Platform.OS === "android") return ANDROID_KEY;
  return undefined;
}

// Billing is only live on a platform that has an API key configured. Until the
// key is set (and a custom dev client built — RevenueCat has native code, so
// Expo Go won't work), the paywall gate stays OFF so local/web dev is
// unaffected. Flip on automatically once EXPO_PUBLIC_REVENUECAT_IOS_KEY exists.
export const isPurchasesSupported =
  (Platform.OS === "ios" || Platform.OS === "android") && !!apiKey();

let configured = false;

/** Configure the SDK exactly once. No-op when billing isn't supported. */
export function configurePurchases(): void {
  if (configured || !isPurchasesSupported) return;
  const key = apiKey();
  if (!key) return;
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({ apiKey: key });
  configured = true;
}

/** True when the CustomerInfo grants the active "pro" entitlement. */
export function isProActive(info: CustomerInfo | null | undefined): boolean {
  return !!info?.entitlements.active[ENTITLEMENT_ID];
}

export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!isPurchasesSupported) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current ?? offerings.all[OFFERING_ID] ?? null;
}

/** Bind the RevenueCat app_user_id to our Convex user id. */
export async function identifyUser(
  appUserId: string,
): Promise<CustomerInfo | null> {
  if (!isPurchasesSupported) return null;
  try {
    const { customerInfo } = await Purchases.logIn(appUserId);
    return customerInfo;
  } catch (e) {
    console.warn("[purchases] logIn failed", e);
    return null;
  }
}

export async function logoutPurchases(): Promise<void> {
  if (!isPurchasesSupported) return;
  try {
    // logOut throws if the current user is already anonymous — safe to ignore.
    await Purchases.logOut();
  } catch {
    /* already anonymous */
  }
}

export type PurchaseResult =
  | { status: "success"; customerInfo: CustomerInfo }
  | { status: "cancelled" }
  | { status: "error"; message: string };

function hasProp<K extends string>(o: unknown, k: K): o is Record<K, unknown> {
  return typeof o === "object" && o !== null && k in o;
}

function purchaseError(e: unknown): PurchaseResult {
  if (hasProp(e, "userCancelled") && e.userCancelled) {
    return { status: "cancelled" };
  }
  const message =
    hasProp(e, "message") && typeof e.message === "string"
      ? e.message
      : "Something went wrong.";
  return { status: "error", message };
}

export async function purchase(pkg: PurchasesPackage): Promise<PurchaseResult> {
  if (!isPurchasesSupported) {
    return { status: "error", message: "In-app purchases are unavailable." };
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { status: "success", customerInfo };
  } catch (e) {
    return purchaseError(e);
  }
}

export async function restore(): Promise<PurchaseResult> {
  if (!isPurchasesSupported) {
    return { status: "error", message: "In-app purchases are unavailable." };
  }
  try {
    const customerInfo = await Purchases.restorePurchases();
    return { status: "success", customerInfo };
  } catch (e) {
    return purchaseError(e);
  }
}

/** Shape expected by `api.table.users.syncSubscription`. */
export function toSubscriptionSync(info: CustomerInfo) {
  const ent = info.entitlements.active[ENTITLEMENT_ID];
  return {
    active: !!ent,
    productId: ent?.productIdentifier,
    expiresAt: ent?.expirationDate ?? undefined,
    isTrial: ent?.periodType === "TRIAL",
    willRenew: ent?.willRenew,
    store: ent?.store,
  };
}
