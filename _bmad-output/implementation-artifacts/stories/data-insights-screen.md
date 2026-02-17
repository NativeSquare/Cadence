# Dev Story: Data Insights Screen (Post-Wearable Connection)

**Story ID:** 4-7-data-insights-screen
**Epic:** Epic 4 - Wearable Data Integration
**Status:** Done
**Implemented:** 2026-02-17
**References:**
- Prototype: `_bmad-output/brainstorming/cadence-insights.jsx`
- Replaced: `apps/native/src/components/app/onboarding/mocks/screens/ThinkingDataMock.tsx`

---

## Implementation Summary

**Files Created (7):**
| File | Purpose |
|------|---------|
| `packages/backend/convex/table/activities.ts` | Convex query wrapper for Soma activities |
| `apps/native/src/lib/insights/types.ts` | TypeScript interfaces |
| `apps/native/src/lib/insights/compute-insights.ts` | O(n) single-pass insight computation |
| `apps/native/src/lib/insights/decision-tree.ts` | Card selection logic |
| `apps/native/src/lib/insights/format-utils.ts` | Formatting helpers |
| `apps/native/src/lib/insights/index.ts` | Module exports |
| `apps/native/src/components/app/onboarding/screens/DataInsightsScreen.tsx` | Main component |

**Files Modified (1):**
| File | Change |
|------|--------|
| `apps/native/src/components/app/onboarding/OnboardingFlowMock.tsx` | Replaced ThinkingDataMock with DataInsightsScreen on DATA path |

**Key Features:**
- Queries activities from Convex (Soma component) via `listMyActivities`
- Computes insights client-side in O(n) - no AI calls, no backend compute
- Shows 4-5 emotionally relevant lines based on decision tree priorities
- Handles fallback: 0 activities triggers switch to NO DATA path
- Reuses exact styling from ThinkingDataMock for visual consistency

---

## Purpose

Show the runner that we actually read their data — and that we *understand* them. Build trust and emotional connection before the conversation screens begin.

**Key constraint:** No AI calls. No expensive backend compute. This is onboarding — the user isn't paying yet, and we want fast emotional impact. All computation happens client-side using pure JS on data already in Convex.

---

## Screen Flow

```
[Wearable OAuth completes]
        ↓
  Phase 1: CONNECTING        (2–4 seconds)
  Status indicator + activity counter
        ↓
  Phase 2: INSIGHTS          (15–25 seconds)
  4–5 insight lines revealed sequentially
        ↓
  Phase 3: CLOSING           (2 seconds)
  Coach message + confidence badge + Continue button
        ↓
  [Goals screen]
```

No loading spinner. No terminal aesthetic. The coach talks to you while displaying what it sees.

---

## Architecture Integration

### Data Source

Activities are stored in the **Soma component** using the Terra schema. By the time this screen renders, the backend has already ingested activities via:
- Strava OAuth → `connectStravaOAuth()` → `soma.syncStrava()`
- HealthKit → `ingestHealthKitData()` → `soma.ingestActivity()`

The screen queries them client-side via Convex.

### Current Flow Position

```
WearableScreen (screen 1)
    ↓
    ├── hasData = true  → DataInsightsScreen (this story)
    │                           ↓
    │                     GoalsScreen (screen 3)
    │
    └── hasData = false → SelfReportMock
                                ↓
                          GoalsScreen (screen 3)
```

This screen **replaces** `ThinkingDataMock` on the DATA path.

---

## Data Pipeline

### Input: Soma Activity Schema

Query activities via new Convex wrapper. Minimum fields needed:

```typescript
interface SomaActivity {
  _id: string;
  metadata: {
    start_time: string;        // ISO-8601
    end_time: string;          // ISO-8601
    name?: string;             // "Easy Run", "Long Run", etc.
    city?: string;             // "Paris", "London", etc.
  };
  distance_data?: {
    summary?: {
      distance_meters?: number;
      elevation?: {
        gain_actual_meters?: number;
      };
    };
  };
  movement_data?: {
    avg_pace_minutes_per_kilometer?: number;
  };
  heart_rate_data?: {
    summary?: {
      avg_hr_bpm?: number;
    };
  };
}
```

Everything beyond `metadata.start_time` is optional. The decision tree gracefully degrades.

### Convex Query Wrapper

**New file:** `packages/backend/convex/table/activities.ts`

Soma's `listActivities` is an internal query. We need a public wrapper:

```typescript
import { getAuthUserId } from "@convex-dev/auth/server";
import { query } from "../_generated/server";
import { components } from "../_generated/api";
import { v } from "convex/values";

export const listMyActivities = query({
  args: {
    startTime: v.optional(v.string()),  // ISO-8601
    endTime: v.optional(v.string()),
    limit: v.optional(v.number()),
    order: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    return await ctx.runQuery(
      components.soma.public.listActivities,
      {
        userId: userId as string,
        startTime: args.startTime,
        endTime: args.endTime,
        limit: args.limit,
        order: args.order ?? "desc",
      }
    );
  },
});
```

### Computation (Pure JS, O(n) Single Pass)

**New file:** `apps/native/src/lib/insights/compute-insights.ts`

All computation runs in a single pass through the activities array. For 1000 activities, <10ms.

```typescript
interface ActivityInsights {
  // Counts
  totalRuns: number;

  // Date bounds
  firstRunDate: Date | null;
  lastRunDate: Date | null;
  daysSinceLastRun: number;
  journeyWeeks: number;          // weeks between first and last run

  // Volume metrics
  totalDistanceKm: number;
  totalElevationM: number;
  avgDistanceKm: number;
  avgWeeklyKm: number;           // totalDistanceKm / journeyWeeks

  // Performance metrics
  fastestPace: number | null;    // min/km (lower is faster)
  fastestPaceRun: SomaActivity | null;
  longestDistanceKm: number;
  longestRun: SomaActivity | null;

  // Patterns
  activeWeeksLast12: number;     // Weeks with ≥1 run in last 84 days
  topCity: string | null;
  topCityCount: number;

  // Data quality flags
  hasHeartRateData: boolean;     // >50% of runs have HR
  hasPaceData: boolean;          // >50% of runs have pace
  hasElevationData: boolean;     // >30% of runs have elevation
  hasGeoData: boolean;           // any run has city
}
```

**Implementation sketch:**

```typescript
export function computeInsights(activities: SomaActivity[]): ActivityInsights {
  const now = Date.now();
  const twelveWeeksAgo = now - 12 * 7 * 24 * 60 * 60 * 1000;

  let totalDistanceM = 0;
  let totalElevationM = 0;
  let fastestPace: number | null = null;
  let fastestPaceRun: SomaActivity | null = null;
  let longestDistanceM = 0;
  let longestRun: SomaActivity | null = null;
  let firstRunTs = Infinity;
  let lastRunTs = 0;
  let paceCount = 0;
  let hrCount = 0;
  let elevCount = 0;
  const cityFreq = new Map<string, number>();
  const activeWeekSet = new Set<string>();

  for (const activity of activities) {
    const startTs = new Date(activity.metadata.start_time).getTime();
    const distanceM = activity.distance_data?.summary?.distance_meters ?? 0;
    const elevM = activity.distance_data?.summary?.elevation?.gain_actual_meters;
    const pace = activity.movement_data?.avg_pace_minutes_per_kilometer;
    const hr = activity.heart_rate_data?.summary?.avg_hr_bpm;
    const city = activity.metadata.city;

    // Accumulate totals
    totalDistanceM += distanceM;
    if (elevM != null) { totalElevationM += elevM; elevCount++; }

    // Track date bounds
    if (startTs < firstRunTs) firstRunTs = startTs;
    if (startTs > lastRunTs) lastRunTs = startTs;

    // Track extremes
    if (distanceM > longestDistanceM) {
      longestDistanceM = distanceM;
      longestRun = activity;
    }
    if (pace != null && pace > 0) {
      paceCount++;
      if (fastestPace === null || pace < fastestPace) {
        fastestPace = pace;
        fastestPaceRun = activity;
      }
    }

    // Track HR presence
    if (hr != null) hrCount++;

    // Track city frequency
    if (city) cityFreq.set(city, (cityFreq.get(city) ?? 0) + 1);

    // Track active weeks in last 12 weeks
    if (startTs >= twelveWeeksAgo) {
      activeWeekSet.add(getISOWeek(new Date(startTs)));
    }
  }

  // Derive computed metrics
  const totalRuns = activities.length;
  const firstRunDate = firstRunTs < Infinity ? new Date(firstRunTs) : null;
  const lastRunDate = lastRunTs > 0 ? new Date(lastRunTs) : null;
  const daysSinceLastRun = lastRunDate
    ? Math.floor((now - lastRunTs) / (24 * 60 * 60 * 1000))
    : Infinity;
  const journeyWeeks = firstRunDate && lastRunDate
    ? Math.max(1, (lastRunTs - firstRunTs) / (7 * 24 * 60 * 60 * 1000))
    : 1;

  const totalDistanceKm = totalDistanceM / 1000;
  const avgDistanceKm = totalRuns > 0 ? totalDistanceKm / totalRuns : 0;
  const avgWeeklyKm = totalDistanceKm / journeyWeeks;
  const longestDistanceKm = longestDistanceM / 1000;

  // Find top city
  let topCity: string | null = null;
  let topCityCount = 0;
  for (const [city, count] of cityFreq) {
    if (count > topCityCount) { topCity = city; topCityCount = count; }
  }

  return {
    totalRuns,
    firstRunDate,
    lastRunDate,
    daysSinceLastRun,
    journeyWeeks,
    totalDistanceKm,
    totalElevationM,
    avgDistanceKm,
    avgWeeklyKm,
    fastestPace,
    fastestPaceRun,
    longestDistanceKm,
    longestRun,
    activeWeeksLast12: activeWeekSet.size,
    topCity,
    topCityCount,
    hasHeartRateData: hrCount > totalRuns * 0.5,
    hasPaceData: paceCount > totalRuns * 0.5,
    hasElevationData: elevCount > totalRuns * 0.3,
    hasGeoData: cityFreq.size > 0,
  };
}

function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(
    ((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
  );
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
}
```

---

## Decision Tree — Card Selection

**New file:** `apps/native/src/lib/insights/decision-tree.ts`

The tree selects **4-5 insight lines** from a pool of **8 possible types**. Order matters — lines display sequentially and build emotional impact.

### Line Types

| Type | Trigger | Color | Example |
|------|---------|-------|---------|
| `sys` | Always | g4 (dim) | "Connecting to Strava..." |
| `dat` | Data observation | g2 (white) | "Weekly average: 38km." |
| `warn` | Attention flag | red | "Last run was 45 days ago." |
| `pos` | Achievement | lime | "12/12 weeks active. Elite consistency." |
| `res` | Conclusion | lime | "Profile confidence: HIGH" |

### Selection Logic

```typescript
export function selectInsightCards(insights: ActivityInsights): InsightCard[] {
  const cards: InsightCard[] = [];

  // === Phase 1: System lines (always) ===
  cards.push({ type: "sys", text: "Connecting to Strava..." });
  cards.push({ type: "sys", text: `Found ${insights.totalRuns} activities.` });
  cards.push({ type: "sys", text: "" }); // spacer

  // === Phase 2: Emotional insights (pick 3-4) ===

  // Priority 1: Recency check
  if (insights.daysSinceLastRun > 14) {
    cards.push({
      type: "warn",
      text: insights.daysSinceLastRun > 90
        ? `Last run was ${insights.daysSinceLastRun} days ago. Long break — but your body remembers.`
        : `Last run was ${insights.daysSinceLastRun} days ago. Let's change that.`
    });
  }

  // Priority 2: Consistency (most predictive of success)
  if (insights.activeWeeksLast12 >= 10) {
    cards.push({
      type: "pos",
      text: insights.activeWeeksLast12 === 12
        ? "12/12 weeks active. Perfect consistency."
        : `${insights.activeWeeksLast12}/12 weeks active. That's elite consistency.`
    });
  } else if (insights.activeWeeksLast12 >= 6) {
    cards.push({
      type: "dat",
      text: `${insights.activeWeeksLast12}/12 weeks active. Solid foundation.`
    });
  } else if (insights.totalRuns < 5) {
    cards.push({
      type: "dat",
      text: "Just getting started — we'll build this together."
    });
  }

  // Priority 3: Volume insight
  if (insights.avgWeeklyKm >= 50) {
    cards.push({
      type: "dat",
      text: `Weekly average: ${formatDistance(insights.avgWeeklyKm)}. High volume runner.`
    });
  } else if (insights.avgWeeklyKm >= 25) {
    cards.push({
      type: "dat",
      text: `Weekly average: ${formatDistance(insights.avgWeeklyKm)}.`
    });
  }

  // Priority 4: Speed OR distance achievement (not both)
  if (insights.fastestPace !== null && insights.fastestPace < 5.0) {
    cards.push({
      type: "pos",
      text: insights.fastestPace < 4.0
        ? `Fastest pace: ${formatPace(insights.fastestPace)}/km. That's fast.`
        : `Fastest pace: ${formatPace(insights.fastestPace)}/km. You've got wheels.`
    });
  } else if (insights.longestDistanceKm >= 21) {
    cards.push({
      type: "pos",
      text: `Longest run: ${formatDistance(insights.longestDistanceKm)}. Half marathon+ club.`
    });
  } else if (insights.longestDistanceKm >= 15) {
    cards.push({
      type: "dat",
      text: `Longest run: ${formatDistance(insights.longestDistanceKm)}.`
    });
  }

  // Priority 5: Elevation (if notable)
  if (insights.totalElevationM >= 5000 && insights.hasElevationData) {
    cards.push({
      type: "dat",
      text: insights.totalElevationM >= 20000
        ? `${Math.round(insights.totalElevationM).toLocaleString()}m elevation. Hill lover.`
        : `${Math.round(insights.totalElevationM).toLocaleString()}m elevation climbed.`
    });
  }

  // Priority 6: Location (if available and meaningful)
  if (insights.topCity && insights.totalRuns >= 10) {
    cards.push({
      type: "dat",
      text: `Most runs: ${insights.topCity}.`
    });
  }

  // === Phase 3: Conclusion ===
  cards.push({ type: "sys", text: "" }); // spacer

  const confidence = insights.totalRuns >= 20 ? "HIGH"
    : insights.totalRuns >= 10 ? "MODERATE"
    : "LOW";
  cards.push({
    type: "res",
    text: `Profile confidence: ${confidence}`
  });

  return cards;
}
```

---

## Format Utilities

**New file:** `apps/native/src/lib/insights/format-utils.ts`

```typescript
/** Format pace as "M:SS" string (e.g., 5.5 → "5:30") */
export function formatPace(paceMinPerKm: number): string {
  const mins = Math.floor(paceMinPerKm);
  const secs = Math.round((paceMinPerKm - mins) * 60);
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

/** Format distance with appropriate precision */
export function formatDistance(km: number): string {
  if (km >= 100) return `${Math.round(km)}km`;
  if (km >= 10) return `${km.toFixed(1)}km`;
  return `${km.toFixed(2)}km`;
}

/** Format date for display (e.g., "March 14, 2022") */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });
}

/** Format relative time (e.g., "3 months ago") */
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
  if (months > 0) return `${years} year${years > 1 ? "s" : ""} and ${months} months ago`;
  return `${years} year${years > 1 ? "s" : ""} ago`;
}
```

---

## Fallback Scenarios

### Scenario A: Zero Activities

User connects Strava but has no running activities (maybe they cycle).

**Detection:** `activities.length === 0`

**Behavior:**
1. Show brief connecting animation
2. Display: "Hmm. No running activities yet."
3. Call `onNoData()` callback
4. Parent switches to NO DATA path → SelfReportMock

### Scenario B: Very Few Activities (<5)

**Detection:** `insights.totalRuns < 5`

**Behavior:**
- Show: "Just getting started — we'll build this together."
- Confidence: LOW
- Skip volume/pace/consistency cards (not meaningful)
- Continue normally to Goals screen

### Scenario C: No Pace Data

Some providers don't export pace. We can compute it if we have distance + duration.

**Detection:** `insights.hasPaceData === false`

**Fallback computation:**
```typescript
if (!activity.movement_data?.avg_pace_minutes_per_kilometer) {
  const distKm = (activity.distance_data?.summary?.distance_meters ?? 0) / 1000;
  const durMin = (new Date(activity.metadata.end_time).getTime() -
                 new Date(activity.metadata.start_time).getTime()) / 60000;
  if (distKm > 0 && durMin > 0) {
    const computedPace = durMin / distKm;
    // Use computedPace for insights
  }
}
```

If still no pace data: skip pace-related cards entirely.

### Scenario D: No City Data

**Detection:** `insights.topCity === null`

**Behavior:** Skip the city card. No visual gap — other cards fill the space.

### Scenario E: Long Break (>90 days)

**Detection:** `insights.daysSinceLastRun > 90`

**Behavior:**
- Priority 1 card: "Last run was X days ago. Long break — but your body remembers."
- Confidence may still be HIGH if historical data is rich

### Scenario F: Ancient Data (First run >2 years ago)

**Detection:** `insights.journeyWeeks >= 104`

**Behavior:**
- More emotional weight on journey: "Your first run was March 14, 2022. That was 2 years and 8 months ago."
- Note: "{totalRuns} runs since then. That's not a hobby — that's part of who you are."

---

## Component Implementation

**New file:** `apps/native/src/components/app/onboarding/screens/DataInsightsScreen.tsx`

### Props

```typescript
interface DataInsightsScreenProps {
  onNext: () => void;           // Continue to Goals screen
  onNoData?: () => void;        // Called if 0 activities (switch path)
}
```

### State

```typescript
type Phase = "connecting" | "insights" | "closing";

const [phase, setPhase] = useState<Phase>("connecting");
const [visibleLines, setVisibleLines] = useState(0);
const [showCoach, setShowCoach] = useState(false);
```

### Data Flow

```typescript
// Query activities from Convex
const activities = useQuery(api.table.activities.listMyActivities, {
  order: "desc",
});

// Compute insights when data loads
const insightCards = useMemo(() => {
  if (!activities || activities.length === 0) return [];
  const insights = computeInsights(activities);
  return selectInsightCards(insights);
}, [activities]);

// Handle no-data path
useEffect(() => {
  if (activities && activities.length === 0 && onNoData) {
    setTimeout(() => onNoData(), 500);
  }
}, [activities, onNoData]);
```

### Animation Timing

Lines appear sequentially with 320ms delay between each:

```typescript
useEffect(() => {
  if (phase !== "insights" || insightCards.length === 0) return;

  let i = 0;
  const interval = setInterval(() => {
    if (i < insightCards.length) {
      setVisibleLines(i + 1);
      i++;
    } else {
      clearInterval(interval);
      setTimeout(() => setPhase("closing"), 400);
      setTimeout(() => setShowCoach(true), 800);
    }
  }, 320);

  return () => clearInterval(interval);
}, [phase, insightCards]);
```

### Closing Phase

After all lines appear:
1. 400ms pause
2. Coach message appears: "Okay, I've got a picture forming. Let me fill in the gaps."
3. Confidence badge fades in
4. "Let's go" button appears

---

## Visual Design

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `lime` | #C8FF00 | Positive findings, confidence HIGH |
| `g1` | rgba(255,255,255,0.92) | Primary text |
| `g2` | rgba(255,255,255,0.70) | Data observations |
| `g3` | rgba(255,255,255,0.45) | Secondary text |
| `g4` | rgba(255,255,255,0.25) | System lines (dim) |
| `orange` | #FF8A00 | Moderate confidence |
| `red` | #FF5A5A | Warnings |

### Typography

| Element | Font | Size | Weight |
|---------|------|------|--------|
| Status label | JetBrains Mono | 11px | 500 |
| Insight lines | JetBrains Mono | 13px | 400/500 |
| Coach message | Outfit | 22px | 300 |
| Badge text | JetBrains Mono | 10px | 500 |
| Button | Outfit | 17px | 600 |

### Components to Reuse

From `ThinkingDataMock.tsx`:
- `Badge` component (confidence indicator)
- `Cursor` component (blinking cursor)
- Status dot animation
- Line fade-in animation (Reanimated FadeIn)
- Button styling

---

## Integration with OnboardingFlowMock

**File:** `apps/native/src/components/app/onboarding/OnboardingFlowMock.tsx`

### Changes

```typescript
// Add import
import { DataInsightsScreen } from "./screens/DataInsightsScreen";

// In renderScreen switch case for "selfReport" (around line 160):
case "selfReport":
  return hasData ? (
    <DataInsightsScreen
      onNext={goToNext}
      onNoData={() => {
        // User connected but has 0 activities
        setPath("no-data");
        // Component will re-render with SelfReportMock
      }}
    />
  ) : (
    <SelfReportMock onNext={goToNext} />
  );
```

---

## File Structure Summary

### New Files (6)

| Path | Purpose |
|------|---------|
| `packages/backend/convex/table/activities.ts` | Convex query wrapper for Soma activities |
| `apps/native/src/lib/insights/types.ts` | TypeScript interfaces |
| `apps/native/src/lib/insights/compute-insights.ts` | O(n) insight computation |
| `apps/native/src/lib/insights/decision-tree.ts` | Card selection logic |
| `apps/native/src/lib/insights/format-utils.ts` | Formatting helpers |
| `apps/native/src/components/app/onboarding/screens/DataInsightsScreen.tsx` | Main component |

### Modified Files (1)

| Path | Change |
|------|--------|
| `apps/native/src/components/app/onboarding/OnboardingFlowMock.tsx` | Render DataInsightsScreen on DATA path |

---

## Sentence Authoring Rules

All sentences follow these constraints:

1. **No exclamation marks.** The coach is calm and observant.
2. **No questions.** The coach states what it sees.
3. **No superlatives unless earned.** "That's elite" only for 10+/12 weeks.
4. **Second person only.** "Your fastest" not "The fastest run."
5. **Short.** Max 15 words per line.
6. **Specific > generic.** "847 runs" not "hundreds of runs."
7. **Emotional triggers:** "consistency", "remember", "part of who you are"

---

## Testing Matrix

| Scenario | Activities | Expected Cards | Confidence |
|----------|------------|----------------|------------|
| Power user | 847, 3 years, Paris, sub-5 pace | Journey + Volume + Speed + Consistency + City | HIGH |
| New runner | 12, 2 months | Getting started + Longest | MODERATE |
| Comeback | 200, 45 days since last | Welcome back + Volume + Consistency | HIGH |
| Long break | 300, 120 days since last | Long break warning + Volume + Longest | HIGH |
| Mountain runner | 400, 25000m elev | Volume + Elevation + Consistency | HIGH |
| Minimal data | 3, 1 week | Getting started | LOW |
| Empty account | 0 | None | → NO DATA path |
| No geo | 500, city=null | All except city card | HIGH |
| No pace | 100, computed from duration | Computed pace or skip | HIGH |

---

## Verification Checklist

### Unit Tests
- [ ] `compute-insights.test.ts` — Edge cases, empty arrays, missing fields
- [ ] `decision-tree.test.ts` — All card selection branches
- [ ] `format-utils.test.ts` — Pace/distance/date formatting

### Integration Tests
- [ ] Query returns activities from Soma
- [ ] 0 activities triggers onNoData callback
- [ ] Path switching works correctly

### Manual Testing
1. [ ] Run `seedMockActivities` with beginner profile → verify LOW confidence
2. [ ] Run `seedMockActivities` with advanced profile → verify HIGH confidence
3. [ ] Connect real Strava → verify real data appears
4. [ ] Test with empty Strava account → verify NO DATA path
5. [ ] Test animation timing feels natural (not too fast, not too slow)
6. [ ] Verify Continue button appears after coach message

---

## What This Screen Does NOT Do

- **No AI inference.** Everything is reduce/sort/filter.
- **No training plan generation.** That happens later.
- **No radar chart.** That's a later screen.
- **No user input.** This is a "sit back and watch" moment.
- **No data guessing.** If we don't have pace, we don't show pace.

The screen's only job: **make the runner feel seen.**
