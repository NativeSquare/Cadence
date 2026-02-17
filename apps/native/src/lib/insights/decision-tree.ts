// =============================================================================
// Decision Tree for Insight Card Selection
// =============================================================================
// Selects 4-5 emotionally relevant insight cards based on activity data.
// Matches the prototype cadence-insights.jsx buildInsightCards function.

import type { ActivityInsights, InsightCard, ConfidenceLevel } from "./types";
import {
  formatPace,
  formatDistance,
  formatNumber,
  formatDate,
  formatRelativeDate,
  distanceComparison,
  runnerIdentity,
} from "./format-utils";

/**
 * Build insight cards based on activity data.
 * Uses decision tree to select 4-5 emotionally relevant cards.
 * Order matters — cards display sequentially and build emotional impact.
 *
 * @returns Array of InsightCard objects (max 5)
 */
export function buildInsightCards(insights: ActivityInsights): InsightCard[] {
  const cards: InsightCard[] = [];

  // ─── Always: Journey start (identity anchor) ───
  const journeyYears = insights.journeyWeeks / 52;

  if (journeyYears >= 2 && insights.firstRunDate) {
    // Long journey: emphasize the date
    const firstDate = formatDate(insights.firstRunDate);
    const timeAgo = formatRelativeDate(insights.firstRunDate);

    let note: string;
    if (insights.totalRuns > 500) {
      note = `${insights.totalRuns} runs since then. That's not a hobby — that's a part of who you are.`;
    } else if (insights.totalRuns > 100) {
      note = `${insights.totalRuns} runs since. You kept showing up.`;
    } else {
      note = `${insights.totalRuns} runs since. Every one counted.`;
    }

    cards.push({
      big: firstDate,
      sub: `Your first run. That was ${timeAgo}.`,
      note,
      accent: "lime",
    });
  } else {
    // Shorter journey: emphasize the count
    let note: string;
    if (journeyYears < 0.5) {
      note = "Still early — that's when the right coaching matters most.";
    } else {
      note = "Building momentum. I can see the trajectory.";
    }

    const timeAgo = insights.firstRunDate ? formatRelativeDate(insights.firstRunDate) : "recently";
    cards.push({
      big: `${insights.totalRuns} runs`,
      sub: `Started ${timeAgo}.`,
      note,
      accent: "lime",
    });
  }

  // ─── Always: Total distance with relatable comparison ───
  if (insights.totalDistanceKm >= 50) {
    cards.push({
      big: formatDistance(insights.totalDistanceKm),
      sub: `That's ${distanceComparison(insights.totalDistanceKm)}.`,
      note: null,
      accent: "white",
    });
  } else {
    cards.push({
      big: formatDistance(insights.totalDistanceKm),
      sub: "Every kilometer counts.",
      note: null,
      accent: "white",
    });
  }

  // ─── Conditional: Location callout ───
  if (insights.topCity && insights.totalRuns >= 10) {
    cards.push({
      big: insights.topCity,
      sub: "Your home turf.",
      note: "I'll factor local terrain and climate into your plan.",
      accent: "lime",
    });
  }

  // ─── Conditional: PR pace (if sub-6:00/km it's worth showing) ───
  if (
    insights.fastestPace !== null &&
    insights.fastestPace < 6.0 &&
    insights.fastestPaceRun
  ) {
    const paceStr = formatPace(insights.fastestPace);
    const prDate = formatDate(new Date(insights.fastestPaceRun.metadata.start_time));
    const dist = insights.fastestPaceRun.distance_data?.summary?.distance_meters ?? 0;
    const distStr = formatDistance(dist / 1000);

    let note: string;
    if (insights.fastestPace < 4.5) {
      note = "That's serious speed. We'll build on it.";
    } else if (insights.fastestPace < 5.0) {
      note = "Strong. There's more in the tank.";
    } else {
      note = "I bet you remember that run.";
    }

    cards.push({
      big: `${paceStr}/km`,
      sub: `Your fastest — ${distStr} on ${prDate}.`,
      note,
      accent: "lime",
    });
  }

  // ─── Conditional: Longest run (if 15km+) ───
  if (
    insights.longestDistanceKm >= 15 &&
    insights.longestRun &&
    // Don't show both pace and longest if we have too many cards
    cards.length < 4
  ) {
    const prDate = formatDate(new Date(insights.longestRun.metadata.start_time));

    let note: string;
    if (insights.longestDistanceKm >= 35) {
      note = "Ultrarunner territory. You know what deep fatigue feels like.";
    } else if (insights.longestDistanceKm >= 21) {
      note = "Half marathon distance and beyond. The endurance is there.";
    } else {
      note = "That's a solid long run. We'll build from here.";
    }

    cards.push({
      big: formatDistance(insights.longestDistanceKm),
      sub: `Your longest. ${prDate}.`,
      note,
      accent: "white",
    });
  }

  // ─── Conditional: Comeback or consistency ───
  if (insights.daysSinceLastRun > 30) {
    // Comeback angle
    let note: string;
    if (insights.daysSinceLastRun > 90) {
      note =
        "A long break — but your body remembers more than you think. We'll be smart about the ramp.";
    } else {
      note = "A few weeks off. The fitness is still there. Let's rebuild the rhythm.";
    }

    cards.push({
      big: `${insights.daysSinceLastRun} days`,
      sub: "Since your last run.",
      note,
      accent: "orange",
    });
  } else if (insights.activeWeeksLast12 >= 10) {
    // Consistency callout
    let note: string;
    if (insights.activeWeeksLast12 === 12) {
      note = "Perfect consistency. That's rare. We'll push the intensity.";
    } else {
      note = "Solid rhythm. Consistency is the hardest part — you've got it.";
    }

    cards.push({
      big: `${insights.activeWeeksLast12}/12 weeks`,
      sub: "Active in the last 3 months.",
      note,
      accent: "lime",
    });
  }

  // ─── Conditional: Elevation (if mountainous) ───
  if (insights.totalElevationM > 10000 && insights.hasElevationData && cards.length < 5) {
    let note: string;
    if (insights.totalElevationM > 50000) {
      note = "That's Everest five times over. You like climbing.";
    } else if (insights.totalElevationM > 20000) {
      note = "More than twice Everest. The legs are there.";
    } else {
      note = "Not afraid of hills. Good — hills build strength.";
    }

    cards.push({
      big: `${formatNumber(insights.totalElevationM)} m`,
      sub: "Total elevation gained.",
      note,
      accent: "white",
    });
  }

  // ─── Conditional: Weekly volume identity ───
  if (insights.avgWeeklyKm > 15 && cards.length < 5) {
    // Don't duplicate if we already have a "weeks" card
    const hasWeeksCard = cards.some((c) => c.big.includes("week"));
    if (!hasWeeksCard) {
      const identity = runnerIdentity(insights.avgDistanceKm);
      let note: string | null = null;
      if (insights.avgWeeklyKm > 60) {
        note = "High mileage. Recovery matters more than you think.";
      } else if (insights.avgWeeklyKm > 40) {
        note = "Solid base. Room to build but also room to overdo it.";
      }

      cards.push({
        big: `~${Math.round(insights.avgWeeklyKm)} km/week`,
        sub: `Average volume. ${identity.charAt(0).toUpperCase() + identity.slice(1)} by habit.`,
        note,
        accent: "white",
      });
    }
  }

  // Cap at 5 cards max
  return cards.slice(0, 5);
}

/**
 * Determine confidence level based on data quality and quantity.
 */
export function getConfidenceLevel(insights: ActivityInsights): ConfidenceLevel {
  if (insights.totalRuns >= 20) return "HIGH";
  if (insights.totalRuns >= 10) return "MODERATE";
  return "LOW";
}

/**
 * Get the coach closing message based on insights.
 */
export function getCoachClosingMessage(insights: ActivityInsights): string {
  if (insights.totalRuns < 5) {
    return "Not much history yet — but enough to start. Let me learn more about you.";
  }
  return "I already know a lot. Let me ask a few more things to get the full picture.";
}

// Keep the line-based function for backwards compatibility
export { selectInsightLines } from "./decision-tree-lines";
