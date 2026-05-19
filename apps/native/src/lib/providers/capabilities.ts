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
  Footprints,
  Scale,
  type LucideIcon,
} from "lucide-react-native";

export const PROVIDERS = [
  "GARMIN",
  "HEALTHKIT",
  "STRAVA",
  "COROS",
  "WITHINGS",
  "OURA",
  "GOOGLE_FIT",
  "FITBIT",
  "SUUNTO",
  "INBODY",
] as const;
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
 * Data types exposed as Analytics sections (dropdown).
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
  { key: "daily", Icon: Footprints },
  { key: "body", Icon: Scale },
  { key: "menstruation", Icon: Droplet },
  { key: "nutrition", Icon: Apple },
];

/**
 * Which data types each provider can deliver. Used to:
 *   - decide whether an Analytics section is "locked" (no connected provider
 *     tracks it),
 *   - filter the Connections screen by ?filter=<dataType>.
 *
 * Mirrors Terra's per-provider scope (Body / Daily / Menstruation / Nutrition
 * / Sleep). Garmin lacks Nutrition; COROS exposes only Daily + Sleep; Strava
 * is activities-only. Withings/Oura/Google Fit/Fitbit/Suunto/InBody are
 * "coming soon" — capabilities listed reflect what we plan to ingest.
 */
export const PROVIDER_CAPABILITIES: Record<Provider, readonly DataTypeKey[]> =
  {
    GARMIN: ["activities", "sleep", "daily", "body", "menstruation"],
    HEALTHKIT: [
      "activities",
      "sleep",
      "daily",
      "body",
      "nutrition",
      "menstruation",
    ],
    STRAVA: ["activities"],
    COROS: ["daily", "sleep"],
    WITHINGS: ["body", "sleep", "daily"],
    OURA: ["sleep", "daily", "body"],
    GOOGLE_FIT: ["activities", "sleep", "daily", "body", "nutrition"],
    FITBIT: [
      "activities",
      "sleep",
      "daily",
      "body",
      "nutrition",
      "menstruation",
    ],
    SUUNTO: ["activities", "sleep", "daily"],
    INBODY: ["body"],
  };

/**
 * Terra-style "collected" data types shown as capability pills on the
 * Apps & Devices cards. Activities are excluded — they are surfaced via the
 * separate workout-export capability rather than passive sync here.
 */
export type TerraDataTypeKey = Exclude<DataTypeKey, "activities">;

export const TERRA_DATA_TYPES: { key: TerraDataTypeKey; Icon: LucideIcon }[] = [
  { key: "body", Icon: Scale },
  { key: "daily", Icon: Footprints },
  { key: "menstruation", Icon: Droplet },
  { key: "nutrition", Icon: Apple },
  { key: "sleep", Icon: Moon },
];

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
