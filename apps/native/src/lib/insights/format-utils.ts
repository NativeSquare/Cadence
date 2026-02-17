// =============================================================================
// Format Utilities for Insights
// =============================================================================
// Helper functions to format pace, distance, and dates for display.

/**
 * Format pace as "M:SS" string.
 * @param paceMinPerKm - Pace in decimal minutes per kilometer (e.g., 5.5 → "5:30")
 */
export function formatPace(paceMinPerKm: number): string {
  const mins = Math.floor(paceMinPerKm);
  const secs = Math.round((paceMinPerKm - mins) * 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

/**
 * Format distance with appropriate precision.
 * @param km - Distance in kilometers
 */
export function formatDistance(km: number): string {
  if (km >= 100) return `${Math.round(km)}km`;
  if (km >= 10) return `${km.toFixed(1)}km`;
  return `${km.toFixed(2)}km`;
}

/**
 * Format date for display (e.g., "March 14, 2022").
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Format relative time (e.g., "3 months ago").
 */
export function formatRelativeDate(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));

  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;

  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);

  if (months > 0) {
    return `${years} year${years > 1 ? "s" : ""} and ${months} months ago`;
  }
  return `${years} year${years > 1 ? "s" : ""} ago`;
}

/**
 * Format a number with locale-specific thousands separator.
 * @param num - Number to format
 */
export function formatNumber(num: number): string {
  return Math.round(num).toLocaleString();
}

/**
 * Get a relatable distance comparison for total km run.
 * Makes large numbers feel personal and tangible.
 */
export function distanceComparison(km: number): string {
  if (km >= 40000) return "around the Earth";
  if (km >= 12000) return "Paris to Tokyo and back";
  if (km >= 8500) return "Paris to Tokyo";
  if (km >= 6000) return "across the Atlantic";
  if (km >= 3500) return "New York to Los Angeles";
  if (km >= 1500) return "Paris to Athens";
  if (km >= 800) return "London to Rome";
  if (km >= 300) return "Paris to London and back";
  if (km >= 100) return "a hundred kilometers of ground covered";
  return "a good start";
}

/**
 * Get runner identity based on average run distance.
 */
export function runnerIdentity(avgDistKm: number): string {
  if (avgDistKm >= 30) return "ultrarunner";
  if (avgDistKm >= 18) return "marathon-distance runner";
  if (avgDistKm >= 12) return "half-marathon runner";
  if (avgDistKm >= 8) return "10K runner";
  if (avgDistKm >= 4) return "5K runner";
  return "runner";
}
