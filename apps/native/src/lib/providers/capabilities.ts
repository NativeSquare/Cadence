/**
 * Provider capability map and shared data-type catalog.
 *
 * Hand-maintained: when adding a provider or wiring a new data type into a
 * provider's ingestion, update PROVIDER_CAPABILITIES below.
 */

import {
  Activity,
  Moon,
  Droplet,
  Apple,
  type LucideIcon,
} from "lucide-react-native";

export const PROVIDERS = ["GARMIN", "HEALTHKIT", "STRAVA", "COROS"] as const;
export type Provider = (typeof PROVIDERS)[number];

export type DataTypeKey =
  | "activities"
  | "sleep"
  | "menstruation"
  | "nutrition"
  | "daily"
  | "body";

/**
 * Display priority used by per-provider stats panels (provider detail screen).
 * Order is independent of ANALYTICS_DATA_TYPES.
 */
export const DATA_TYPE_ORDER: DataTypeKey[] = [
  "activities",
  "sleep",
  "daily",
  "body",
  "nutrition",
  "menstruation",
];

/**
 * Data types exposed as Analytics sections (dropdown). Excludes `daily` and
 * `body` which feed other surfaces but don't have a dedicated chart yet.
 *
 * `activities` reads "Training" in the dropdown — the dropdown label key
 * uses `analytics.dataTypes.<key>`.
 */
export const ANALYTICS_DATA_TYPES: {
  key: DataTypeKey;
  Icon: LucideIcon;
}[] = [
  { key: "activities", Icon: Activity },
  { key: "sleep", Icon: Moon },
  { key: "menstruation", Icon: Droplet },
  { key: "nutrition", Icon: Apple },
];

/**
 * Which data types each provider can deliver. Used to:
 *   - decide whether an Analytics section is "locked" (no connected provider
 *     tracks it),
 *   - filter the Connections screen by ?filter=<dataType>.
 *
 * Apple Health + Garmin both cover the full set; Strava is activities-only;
 * COROS is a stub (tracks activities once implemented).
 */
export const PROVIDER_CAPABILITIES: Record<Provider, readonly DataTypeKey[]> =
  {
    GARMIN: [
      "activities",
      "sleep",
      "daily",
      "body",
      "nutrition",
      "menstruation",
    ],
    HEALTHKIT: [
      "activities",
      "sleep",
      "daily",
      "body",
      "nutrition",
      "menstruation",
    ],
    STRAVA: ["activities"],
    COROS: ["activities"],
  };

export function dataTypesFor(provider: Provider): readonly DataTypeKey[] {
  return PROVIDER_CAPABILITIES[provider];
}

export function providerTracks(
  provider: Provider,
  dataType: DataTypeKey,
): boolean {
  return PROVIDER_CAPABILITIES[provider].includes(dataType);
}

export function getProvidersTracking(dataType: DataTypeKey): Provider[] {
  return PROVIDERS.filter((p) => providerTracks(p, dataType));
}
