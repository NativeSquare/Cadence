// Website URL constants (Story 1.3)
export const WEBSITE_URL =
  process.env.EXPO_PUBLIC_WEBSITE_URL || "https://cadence.nativesquare.fr";

export const LEGAL_URLS = {
  terms: `${WEBSITE_URL}/terms`,
  privacy: `${WEBSITE_URL}/privacy`,
  healthData: `${WEBSITE_URL}/health-data`,
} as const;
