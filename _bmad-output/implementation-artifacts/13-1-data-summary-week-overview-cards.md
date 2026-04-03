# Story 13.1 — Data Summary and Week Overview Cards

Status: ready-for-dev

## Story

**As a** runner,
**I want** to see my training data presented visually in the chat when the coach looks up my data,
**So that** I can quickly grasp my training picture without reading walls of text.

---

## Architecture Overview

### Key Insight: UI Tools vs Action Tools

The codebase has two distinct tool categories that flow through **separate rendering paths**:

| Category | Naming Convention | Rendering Path | User Interaction |
|----------|------------------|----------------|------------------|
| **UI tools** | `render*` prefix | Onboarding: `tool-renderer.tsx`; Coach: currently unhandled (falls through to `null`) | Display-only or input collection |
| **Action tools** | `propose*` prefix | `CoachToolRenderer.tsx` via `isActionTool()` check (`toolName.startsWith("propose")`) | Accept/Reject confirmation |

**Current gap:** `CoachChatView.tsx` (line 239) filters tool-call parts with `isActionTool()` which only matches `propose*` tools. Any `render*` tool called by the coach in non-onboarding mode is silently ignored. This story must add a parallel rendering path for `render*` UI tools in the coach chat.

### Files Inventory

| Layer | File | Action |
|-------|------|--------|
| UI tool schemas | `packages/backend/convex/ai/tools/index.ts` | **Modify** - add `renderDataSummary` and `renderWeekOverview` |
| Coach prompt | `packages/backend/convex/ai/prompts/coach_os.ts` | **Modify** - update `UI_TOOL_INSTRUCTIONS` |
| Coach tool renderer | `apps/native/src/components/app/coach/CoachToolRenderer.tsx` | **Modify** - add cases for new UI tools |
| Coach chat view | `apps/native/src/components/app/coach/CoachChatView.tsx` | **Modify** - add `isUiTool()` filter + rendering path |
| DataSummaryCard | `apps/native/src/components/app/coach/cards/DataSummaryCard.tsx` | **New file** |
| WeekOverviewCard | `apps/native/src/components/app/coach/cards/WeekOverviewCard.tsx` | **New file** |
| Cards index | `apps/native/src/components/app/coach/cards/index.ts` | **New file** |
| Coach index | `apps/native/src/components/app/coach/index.ts` | **Modify** - re-export cards |

---

## Acceptance Criteria

### AC 1 — DataSummaryCard UI Component

**Given** the coach calls the `renderDataSummary` UI tool
**When** the card renders in the chat
**Then** it displays:
- A title row (e.g., "Your March Training Summary")
- Key-value metric rows, each with: label, value, optional unit, optional trend indicator (up/down/stable), optional status color (green/yellow/red)
- Metrics rendered in a clean vertical list with subtle dividers
- The card uses the light content theme (`w1` background, `wText`/`wSub`/`wMute` text hierarchy)
- Entry animation via `FadeIn` from `react-native-reanimated`

**And** the card is display-only (no buttons, no confirmation, no state machine).

### AC 2 — WeekOverviewCard (Read-Only)

**Given** the coach calls the `renderWeekOverview` UI tool
**When** the card renders in the chat
**Then** it displays:
- A title row (e.g., "This Week's Plan" or "Week of March 30")
- 7 day rows (Mon-Sun), each showing: day name, session name/type (or "Rest"), duration, status indicator dot
- Session type color-coded using `SESSION_TYPE_COLORS` from `design-tokens.ts`
- Rest days shown in muted gray
- No approve/reject buttons (read-only mode)

**And** the card is display-only (same as DataSummaryCard).

**Note:** Story 12.4 defines a `BatchChangesCard` / `WeekOverviewCard` for batch proposals with accept/reject. That component handles interactive mutations. This story creates a **separate read-only card** in a `cards/` directory. If 12.4 is implemented later, both can coexist because they serve different purposes (read-only display vs. mutation proposal).

### AC 3 — CoachToolRenderer Integration

**Given** `renderDataSummary` or `renderWeekOverview` tool results arrive in the coach chat
**When** `CoachChatView` processes message parts
**Then** it:
1. Identifies UI tool calls via `isUiTool()` (alongside existing `isActionTool()`)
2. Renders them through `CoachToolRenderer` which dispatches to the correct card
3. UI tools render without `executeMutation`/`onAccepted`/`onRejected` props (they are display-only)

### AC 4 — UI Tool Definitions

**Given** the AI tool registry in `packages/backend/convex/ai/tools/index.ts`
**When** `renderDataSummary` and `renderWeekOverview` are defined
**Then** they use the Vercel AI SDK `tool()` with Zod schemas
**And** their descriptions clearly guide the LLM on when to use visual presentation vs. text

---

## Tasks / Subtasks

### Task 1: Define `renderDataSummary` UI tool (AC 4)

**File:** `packages/backend/convex/ai/tools/index.ts`

1.1. Add the following tool definition after `renderConnectionCard`:

```ts
// =============================================================================
// Data Summary Card (Story 13.1)
// =============================================================================

/**
 * Data summary display tool
 * Renders a visual card with key-value metrics, trend indicators, and status colors.
 * Used when the coach looks up training data and wants to present it visually.
 */
export const renderDataSummary = tool({
  description:
    "Display a visual data summary card with key metrics, trends, and status indicators. Use when presenting training summaries, weekly stats, biometric overviews, or any structured data that benefits from visual formatting instead of plain text. Always prefer this over listing numbers in a text message.",
  inputSchema: z.object({
    title: z
      .string()
      .describe("Card title, e.g. 'Your March Training Summary' or 'Recovery Status'"),
    subtitle: z
      .string()
      .optional()
      .describe("Optional subtitle for additional context, e.g. 'Last 7 days'"),
    metrics: z
      .array(
        z.object({
          label: z.string().describe("Metric label, e.g. 'Total Distance'"),
          value: z.string().describe("Metric value as display string, e.g. '42.5'"),
          unit: z.string().optional().describe("Unit label, e.g. 'km', 'min', 'bpm'"),
          trend: z
            .enum(["up", "down", "stable"])
            .optional()
            .describe("Trend direction compared to previous period"),
          trendLabel: z
            .string()
            .optional()
            .describe("Trend context, e.g. '+12% vs last week'"),
          status: z
            .enum(["good", "warning", "alert", "neutral"])
            .optional()
            .describe(
              "Status color coding: good=green (on track), warning=yellow (attention needed), alert=red (concern), neutral=default (no judgment)"
            ),
        })
      )
      .min(1)
      .describe("Array of metrics to display"),
    footnote: z
      .string()
      .optional()
      .describe("Optional footnote text at the bottom, e.g. 'Based on Garmin data from last 4 weeks'"),
  }),
});
```

1.2. Add `renderDataSummary` to the `uiTools` export:

```ts
export const uiTools = {
  renderMultipleChoice,
  renderOpenInput,
  renderConfirmation,
  renderVoiceInput,
  renderProgress,
  renderConnectionCard,
  renderDataSummary,      // <-- add
  renderWeekOverview,     // <-- add (from Task 2)
};
```

### Task 2: Define `renderWeekOverview` UI tool (AC 4)

**File:** `packages/backend/convex/ai/tools/index.ts`

2.1. Add the following tool definition after `renderDataSummary`:

```ts
// =============================================================================
// Week Overview Card (Story 13.1)
// =============================================================================

/**
 * Week overview display tool
 * Renders a 7-day view of the training week showing each day's session.
 * Read-only presentation — no approve/reject buttons.
 */
export const renderWeekOverview = tool({
  description:
    "Display a visual week overview card showing each day's planned session, duration, and completion status. Use when the runner asks about their week, when presenting the upcoming schedule, or after looking up planned sessions for context. This is a read-only display — for proposing changes to multiple sessions, use proposeBatchChanges instead.",
  inputSchema: z.object({
    title: z
      .string()
      .describe("Card title, e.g. 'This Week' or 'Week of March 30'"),
    weekStartDate: z
      .string()
      .optional()
      .describe("ISO date of the Monday, e.g. '2026-03-30'"),
    days: z
      .array(
        z.object({
          dayName: z
            .string()
            .describe("Short day name, e.g. 'Mon', 'Tue', 'Wed'"),
          date: z
            .string()
            .optional()
            .describe("Date display, e.g. 'Mar 30'"),
          sessionName: z
            .string()
            .optional()
            .describe("Session name, e.g. 'Easy Run', 'Tempo'. Omit or set to 'Rest' for rest days."),
          sessionType: z
            .string()
            .optional()
            .describe("Session type for color coding, e.g. 'easy', 'tempo', 'long_run', 'rest'"),
          duration: z
            .string()
            .optional()
            .describe("Duration display, e.g. '45 min'. Omit for rest days."),
          status: z
            .enum(["scheduled", "completed", "skipped", "missed", "rest", "today"])
            .optional()
            .describe("Session status for visual indicator"),
        })
      )
      .min(1)
      .max(7)
      .describe("Array of days to display (typically 7 for Mon-Sun)"),
    totalDistance: z
      .string()
      .optional()
      .describe("Total weekly distance, e.g. '45 km'"),
    totalDuration: z
      .string()
      .optional()
      .describe("Total weekly duration, e.g. '5h 30min'"),
  }),
});
```

### Task 3: Create `DataSummaryCard` component (AC 1)

**File:** `apps/native/src/components/app/coach/cards/DataSummaryCard.tsx` (new)

3.1. Full component implementation:

```tsx
/**
 * DataSummaryCard
 *
 * Read-only display card for structured training data.
 * Renders key-value metric rows with trend indicators and status colors.
 *
 * Source: Story 13.1 - AC#1
 */

import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME } from "@/lib/design-tokens";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
} from "lucide-react-native";

// =============================================================================
// Types
// =============================================================================

export interface DataSummaryMetric {
  label: string;
  value: string;
  unit?: string;
  trend?: "up" | "down" | "stable";
  trendLabel?: string;
  status?: "good" | "warning" | "alert" | "neutral";
}

export interface DataSummaryArgs {
  title: string;
  subtitle?: string;
  metrics: DataSummaryMetric[];
  footnote?: string;
}

// =============================================================================
// Status Colors
// =============================================================================

const STATUS_COLORS: Record<NonNullable<DataSummaryMetric["status"]>, string> = {
  good: COLORS.grn,       // #4ADE80
  warning: "#FFB800",     // amber/yellow
  alert: COLORS.red,      // #FF5A5A
  neutral: LIGHT_THEME.wText,
};

const STATUS_BG: Record<NonNullable<DataSummaryMetric["status"]>, string> = {
  good: COLORS.grnDim,    // rgba(74,222,128,0.12)
  warning: "rgba(255,184,0,0.12)",
  alert: COLORS.redDim,   // rgba(255,90,90,0.12)
  neutral: "transparent",
};

// =============================================================================
// Trend Icon
// =============================================================================

const TREND_ICON_SIZE = 14;

function TrendIndicator({ trend, status }: { trend: DataSummaryMetric["trend"]; status?: DataSummaryMetric["status"] }) {
  if (!trend) return null;

  // Trend arrow color follows status if provided, else contextual defaults
  const color = status && status !== "neutral"
    ? STATUS_COLORS[status]
    : trend === "up"
      ? COLORS.grn
      : trend === "down"
        ? COLORS.red
        : LIGHT_THEME.wMute;

  switch (trend) {
    case "up":
      return <TrendingUp size={TREND_ICON_SIZE} color={color} />;
    case "down":
      return <TrendingDown size={TREND_ICON_SIZE} color={color} />;
    case "stable":
      return <Minus size={TREND_ICON_SIZE} color={color} />;
  }
}

// =============================================================================
// Metric Row
// =============================================================================

function MetricRow({ metric, isLast }: { metric: DataSummaryMetric; isLast: boolean }) {
  const statusColor = metric.status ? STATUS_COLORS[metric.status] : LIGHT_THEME.wText;
  const hasTrendOrStatus = metric.trend || (metric.status && metric.status !== "neutral");

  return (
    <View
      style={{
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: LIGHT_THEME.wBrd,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Label */}
      <Text
        style={{
          color: LIGHT_THEME.wSub,
          fontSize: 14,
          flex: 1,
        }}
      >
        {metric.label}
      </Text>

      {/* Value + Unit + Trend */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        {/* Status dot (only if status is non-neutral) */}
        {metric.status && metric.status !== "neutral" && (
          <View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: STATUS_COLORS[metric.status],
            }}
          />
        )}

        {/* Value */}
        <Text
          style={{
            color: statusColor,
            fontSize: 16,
            fontWeight: "700",
          }}
        >
          {metric.value}
        </Text>

        {/* Unit */}
        {metric.unit && (
          <Text
            style={{
              color: LIGHT_THEME.wMute,
              fontSize: 13,
            }}
          >
            {metric.unit}
          </Text>
        )}

        {/* Trend arrow */}
        <TrendIndicator trend={metric.trend} status={metric.status} />
      </View>

      {/* Trend label (below value row, if present) — handled outside for layout */}
    </View>
  );
}

// =============================================================================
// Component
// =============================================================================

interface DataSummaryCardProps {
  args: DataSummaryArgs;
}

export function DataSummaryCard({ args }: DataSummaryCardProps) {
  const { title, subtitle, metrics, footnote } = args;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={{
        borderWidth: 1,
        borderColor: LIGHT_THEME.wBrd,
        borderRadius: 16,
        overflow: "hidden",
        marginVertical: 8,
        backgroundColor: LIGHT_THEME.w1,
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 14,
          paddingBottom: subtitle ? 4 : 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: "rgba(0,0,0,0.02)",
        }}
      >
        <BarChart3 size={16} color={LIGHT_THEME.wSub} />
        <Text
          style={{
            color: LIGHT_THEME.wText,
            fontSize: 15,
            fontWeight: "600",
            flex: 1,
          }}
        >
          {title}
        </Text>
      </View>

      {/* Subtitle */}
      {subtitle && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 10 }}>
          <Text
            style={{
              color: LIGHT_THEME.wMute,
              fontSize: 12,
            }}
          >
            {subtitle}
          </Text>
        </View>
      )}

      {/* Metric rows */}
      <View>
        {metrics.map((metric, index) => (
          <MetricRow
            key={`${metric.label}-${index}`}
            metric={metric}
            isLast={index === metrics.length - 1}
          />
        ))}
      </View>

      {/* Footnote */}
      {footnote && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: LIGHT_THEME.wBrd,
          }}
        >
          <Text
            style={{
              color: LIGHT_THEME.wMute,
              fontSize: 11,
              fontStyle: "italic",
            }}
          >
            {footnote}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}
```

### Task 4: Create `WeekOverviewCard` component (AC 2)

**File:** `apps/native/src/components/app/coach/cards/WeekOverviewCard.tsx` (new)

4.1. Full component implementation:

```tsx
/**
 * WeekOverviewCard
 *
 * Read-only display card showing a 7-day training week overview.
 * Each day shows the session type, duration, and completion status.
 *
 * Source: Story 13.1 - AC#2
 */

import { View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Text } from "@/components/ui/text";
import { COLORS, LIGHT_THEME, SESSION_TYPE_COLORS } from "@/lib/design-tokens";
import { getSessionCategory } from "@/lib/design-tokens";
import { Calendar, Check, X, Minus } from "lucide-react-native";

// =============================================================================
// Types
// =============================================================================

export interface WeekDay {
  dayName: string;
  date?: string;
  sessionName?: string;
  sessionType?: string;
  duration?: string;
  status?: "scheduled" | "completed" | "skipped" | "missed" | "rest" | "today";
}

export interface WeekOverviewArgs {
  title: string;
  weekStartDate?: string;
  days: WeekDay[];
  totalDistance?: string;
  totalDuration?: string;
}

// =============================================================================
// Status Indicators
// =============================================================================

const STATUS_DOT_SIZE = 8;

function StatusDot({ status }: { status?: WeekDay["status"] }) {
  switch (status) {
    case "completed":
      return <Check size={12} color={COLORS.grn} />;
    case "skipped":
      return <X size={12} color={LIGHT_THEME.wMute} />;
    case "missed":
      return <X size={12} color={COLORS.red} />;
    case "rest":
      return (
        <Minus size={12} color={LIGHT_THEME.wMute} />
      );
    case "today":
      return (
        <View
          style={{
            width: STATUS_DOT_SIZE,
            height: STATUS_DOT_SIZE,
            borderRadius: STATUS_DOT_SIZE / 2,
            backgroundColor: COLORS.lime,
          }}
        />
      );
    case "scheduled":
    default:
      return (
        <View
          style={{
            width: STATUS_DOT_SIZE,
            height: STATUS_DOT_SIZE,
            borderRadius: STATUS_DOT_SIZE / 2,
            backgroundColor: LIGHT_THEME.wBrd,
          }}
        />
      );
  }
}

// =============================================================================
// Day Row
// =============================================================================

function DayRow({ day, isLast }: { day: WeekDay; isLast: boolean }) {
  const isRest = !day.sessionName || day.sessionName.toLowerCase() === "rest" || day.status === "rest";
  const isToday = day.status === "today";
  const isCompleted = day.status === "completed";
  const isSkippedOrMissed = day.status === "skipped" || day.status === "missed";

  const sessionColor = !isRest && day.sessionType
    ? SESSION_TYPE_COLORS[getSessionCategory(day.sessionType)] ?? COLORS.ora
    : LIGHT_THEME.wMute;

  return (
    <View
      style={{
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: LIGHT_THEME.wBrd,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: isToday ? "rgba(200,255,0,0.04)" : "transparent",
      }}
    >
      {/* Day name */}
      <Text
        style={{
          width: 36,
          color: isToday ? LIGHT_THEME.wText : LIGHT_THEME.wSub,
          fontSize: 13,
          fontWeight: isToday ? "700" : "500",
        }}
      >
        {day.dayName}
      </Text>

      {/* Date */}
      {day.date && (
        <Text
          style={{
            width: 48,
            color: LIGHT_THEME.wMute,
            fontSize: 12,
          }}
        >
          {day.date}
        </Text>
      )}

      {/* Session type color bar */}
      {!isRest && (
        <View
          style={{
            width: 3,
            height: 20,
            borderRadius: 1.5,
            backgroundColor: sessionColor,
            marginRight: 10,
          }}
        />
      )}

      {/* Session name or Rest */}
      <Text
        style={{
          flex: 1,
          color: isRest
            ? LIGHT_THEME.wMute
            : isSkippedOrMissed
              ? LIGHT_THEME.wMute
              : LIGHT_THEME.wText,
          fontSize: 14,
          fontWeight: isRest ? "400" : "500",
          textDecorationLine: isSkippedOrMissed ? "line-through" : "none",
        }}
        numberOfLines={1}
      >
        {isRest ? "Rest" : day.sessionName}
      </Text>

      {/* Duration */}
      {!isRest && day.duration && (
        <Text
          style={{
            color: isSkippedOrMissed ? LIGHT_THEME.wMute : LIGHT_THEME.wSub,
            fontSize: 13,
            marginRight: 8,
            textDecorationLine: isSkippedOrMissed ? "line-through" : "none",
          }}
        >
          {day.duration}
        </Text>
      )}

      {/* Status indicator */}
      <StatusDot status={day.status} />
    </View>
  );
}

// =============================================================================
// Component
// =============================================================================

interface WeekOverviewCardProps {
  args: WeekOverviewArgs;
}

export function WeekOverviewCard({ args }: WeekOverviewCardProps) {
  const { title, days, totalDistance, totalDuration } = args;
  const hasTotals = totalDistance || totalDuration;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      style={{
        borderWidth: 1,
        borderColor: LIGHT_THEME.wBrd,
        borderRadius: 16,
        overflow: "hidden",
        marginVertical: 8,
        backgroundColor: LIGHT_THEME.w1,
      }}
    >
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          backgroundColor: "rgba(0,0,0,0.02)",
        }}
      >
        <Calendar size={16} color={LIGHT_THEME.wSub} />
        <Text
          style={{
            color: LIGHT_THEME.wText,
            fontSize: 15,
            fontWeight: "600",
            flex: 1,
          }}
        >
          {title}
        </Text>
      </View>

      {/* Day rows */}
      <View>
        {days.map((day, index) => (
          <DayRow
            key={`${day.dayName}-${index}`}
            day={day}
            isLast={index === days.length - 1 && !hasTotals}
          />
        ))}
      </View>

      {/* Totals footer */}
      {hasTotals && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: LIGHT_THEME.wBrd,
            flexDirection: "row",
            justifyContent: "flex-end",
            gap: 16,
          }}
        >
          {totalDistance && (
            <Text style={{ color: LIGHT_THEME.wSub, fontSize: 13 }}>
              {totalDistance}
            </Text>
          )}
          {totalDuration && (
            <Text style={{ color: LIGHT_THEME.wSub, fontSize: 13 }}>
              {totalDuration}
            </Text>
          )}
        </View>
      )}
    </Animated.View>
  );
}
```

### Task 5: Create cards barrel export (AC 1, AC 2)

**File:** `apps/native/src/components/app/coach/cards/index.ts` (new)

```ts
export { DataSummaryCard } from "./DataSummaryCard";
export type { DataSummaryArgs, DataSummaryMetric } from "./DataSummaryCard";

export { WeekOverviewCard } from "./WeekOverviewCard";
export type { WeekOverviewArgs, WeekDay } from "./WeekOverviewCard";
```

### Task 6: Update `CoachToolRenderer` to handle UI tools (AC 3)

**File:** `apps/native/src/components/app/coach/CoachToolRenderer.tsx`

6.1. Add imports for the new cards at the top:

```ts
import {
  DataSummaryCard,
  WeekOverviewCard,
} from "./cards";
import type { DataSummaryArgs } from "./cards";
import type { WeekOverviewArgs } from "./cards";
```

6.2. Add new cases to the switch statement before the `default` case:

```ts
    // ─────────────────────────────────────────────────────────────────
    // Read-Only UI Cards (no confirmation needed)
    // ─────────────────────────────────────────────────────────────────

    case "renderDataSummary":
      return (
        <DataSummaryCard args={args as DataSummaryArgs} />
      );

    case "renderWeekOverview":
      return (
        <WeekOverviewCard args={args as WeekOverviewArgs} />
      );
```

6.3. The existing `CoachToolRenderer` accepts `executeMutation`, `onAccepted`, `onRejected` props — UI tools simply ignore these. No changes needed to the component signature since the props are already optional in usage (the component just doesn't call them for UI tool cases).

### Task 7: Update `CoachChatView` to render UI tools alongside action tools (AC 3)

**File:** `apps/native/src/components/app/coach/CoachChatView.tsx`

This is the critical integration task. Currently, `CoachChatView` only extracts `propose*` tool calls from assistant messages. UI tools (`render*`) are silently dropped.

7.1. Add a `isUiDisplayTool` helper alongside the existing `isActionTool` (near line 239):

```ts
  /** Check if a tool-call part is an action tool (needs confirmation) */
  const isActionTool = (toolName: string) =>
    toolName.startsWith("propose");

  /** Check if a tool-call part is a read-only UI display tool (no confirmation) */
  const isUiDisplayTool = (toolName: string) =>
    toolName === "renderDataSummary" || toolName === "renderWeekOverview";
```

7.2. Update the message rendering loop (around line 326-366) to also extract and render UI tool parts. Modify the existing filter to include UI tools:

Replace the current `actionParts` filter and rendering block:

```tsx
{messages.map((message) => {
  // Extract tool calls from assistant message parts
  const actionParts =
    message.role === "assistant"
      ? message.parts.filter(
          (p) => p.type === "tool-call" && isActionTool(p.toolName),
        )
      : [];

  const uiParts =
    message.role === "assistant"
      ? message.parts.filter(
          (p) => p.type === "tool-call" && isUiDisplayTool(p.toolName),
        )
      : [];

  // Skip assistant messages with no text, no action tools, and no UI tools
  if (
    message.role === "assistant" &&
    !message.content &&
    actionParts.length === 0 &&
    uiParts.length === 0
  ) {
    return null;
  }

  return (
    <View key={message.id}>
      {/* Text bubble (only if there's text content) */}
      {message.content ? (
        <ChatMessageBubble
          message={message}
          isCoach={message.role === "assistant"}
        />
      ) : null}

      {/* Read-only UI cards (inline after text, before action cards) */}
      {uiParts.map((part: any) => (
        <CoachToolRenderer
          key={part.toolCallId}
          toolName={part.toolName}
          toolCallId={part.toolCallId}
          state={message.isStreaming ? "streaming" : "call"}
          args={part.args}
          executeMutation={handleExecuteMutation}
          onAccepted={handleActionAccepted}
          onRejected={handleActionRejected}
        />
      ))}

      {/* Action tool cards (after UI cards) */}
      {actionParts.map((part: any) => (
        <CoachToolRenderer
          key={part.toolCallId}
          toolName={part.toolName}
          toolCallId={part.toolCallId}
          state={message.isStreaming ? "streaming" : "call"}
          args={part.args}
          executeMutation={handleExecuteMutation}
          onAccepted={handleActionAccepted}
          onRejected={handleActionRejected}
        />
      ))}
    </View>
  );
})}
```

**Design note:** UI cards render before action cards within the same message, creating a natural flow: text explanation -> data visualization -> action proposal.

### Task 8: Update coach system prompt (AC 4)

**File:** `packages/backend/convex/ai/prompts/coach_os.ts`

8.1. Update the `UI_TOOL_INSTRUCTIONS` constant to include the new tools:

```ts
const UI_TOOL_INSTRUCTIONS = `## Interactive Tools
- renderMultipleChoice: When the runner needs to choose from options
- renderOpenInput: For free-form responses (pace, time, text)
- renderConfirmation: To verify data before acting on it
- renderProgress: To show progress on a multi-step flow
- renderConnectionCard: To offer wearable/data source connections
- renderDataSummary: Present structured training data visually (metrics, trends, status). Use whenever you look up training stats, biometrics, or any numeric data — a visual card is always better than listing numbers in text.
- renderWeekOverview: Show the week's training plan as a day-by-day visual card. Use when the runner asks about their week, when presenting upcoming sessions, or when providing context before suggesting changes.

### Data Presentation Rules
1. **Always use renderDataSummary** when presenting 3+ numeric metrics — never list them as plain text
2. **Always use renderWeekOverview** when discussing the weekly schedule — it gives the runner instant visual context
3. **Combine text + cards** — explain insights in text, then show the card for reference
4. **Include trend indicators** when you have comparison data (vs. last week, vs. average)
5. **Use status colors intentionally** — green for on-track metrics, yellow for attention areas, red for concerns, neutral for informational

Use interactive tools when they improve the experience, but don't over-use them — conversation should feel natural.`;
```

### Task 9: Update `uiTools` export (AC 4)

**File:** `packages/backend/convex/ai/tools/index.ts`

9.1. Update the `uiTools` object (this is the aggregate of Task 1 + Task 2):

```ts
export const uiTools = {
  renderMultipleChoice,
  renderOpenInput,
  renderConfirmation,
  renderVoiceInput,
  renderProgress,
  renderConnectionCard,
  renderDataSummary,
  renderWeekOverview,
};
```

Because `uiTools` feeds into `allTools` in `http_action.ts` (line 286: `{ ...uiTools, ...actionTools, ...memoryTools }`), the new tools are automatically available to the LLM. No changes needed in `http_action.ts`.

---

## Dev Notes

### Why separate `cards/` directory (not in `actions/`)?

The `actions/` directory contains components that share the `ActionCardWrapper` -> `ActionButtons` -> `useActionCardState` pattern (phase state machine, accept/reject/retry). The new cards are stateless display components with no user interaction beyond viewing. A `cards/` directory keeps this separation clean and prevents confusion about which components need mutation wiring.

### Why not reuse 12.4's WeekOverviewCard?

Story 12.4's `BatchChangesCard` is an action card (accept/reject batch mutations). Its week view is tightly coupled to the batch proposal state machine. The read-only `WeekOverviewCard` in this story is structurally different:
- No `ActionCardWrapper` (no phase colors, no header bar with status icon)
- No `ActionButtons` (no accept/reject)
- No `useActionCardState` (no state machine)
- Different data shape (simple day array vs. polymorphic batch changes)

If 12.4 is built first, the two components coexist. If this story is built first, 12.4 can optionally import `WeekOverviewCard` for its day-row rendering, but the interactive wrapper would still be separate.

### Trend indicator color logic

Trend arrows color is **contextual**, not fixed:
- If the metric has a `status`, the arrow inherits that status color (green "up" for good metrics, red "up" for concerning metrics like resting heart rate)
- If no status is set, "up" defaults to green, "down" to red, "stable" to muted gray
- This lets the LLM set `trend: "up", status: "alert"` for metrics where going up is bad (e.g., injury risk score)

### CoachToolRenderer props compatibility

The `CoachToolRenderer` currently requires `executeMutation`, `onAccepted`, `onRejected` props. For UI tools, these are passed but never invoked. This is acceptable because:
1. The switch cases for `renderDataSummary` and `renderWeekOverview` return components that don't use those props
2. Changing the component signature to make them optional would require updating all existing call sites
3. A future refactor could split `CoachToolRenderer` into `CoachActionRenderer` and `CoachUiRenderer`, but that's out of scope for 13.1

### Status color mapping to design tokens

| Status | Color | Token | Use Case |
|--------|-------|-------|----------|
| `good` | `#4ADE80` | `COLORS.grn` | On track, positive trend |
| `warning` | `#FFB800` | (custom amber) | Attention needed, borderline |
| `alert` | `#FF5A5A` | `COLORS.red` | Concern, negative trend |
| `neutral` | `#1A1A1A` | `LIGHT_THEME.wText` | Informational, no judgment |

Note: `#FFB800` is not in the existing design tokens (the closest is `COLORS.ylw` = `#FBBF24` and `COLORS.ora` = `#FF9500`). The PRD specifies `#FFB800` for warning states. If strict token adherence is preferred, use `COLORS.ylw` instead.

---

## Testing Checklist

- [ ] `renderDataSummary` tool appears in AI SDK tool registry
- [ ] `renderWeekOverview` tool appears in AI SDK tool registry
- [ ] DataSummaryCard renders with title, metrics, trends, and status colors
- [ ] DataSummaryCard handles edge cases: 1 metric, no trends, no status, no footnote
- [ ] WeekOverviewCard renders 7 days with correct session type colors
- [ ] WeekOverviewCard shows rest days in muted style
- [ ] WeekOverviewCard highlights "today" row with lime background
- [ ] WeekOverviewCard shows completed/skipped/missed status indicators
- [ ] CoachToolRenderer dispatches `renderDataSummary` to DataSummaryCard
- [ ] CoachToolRenderer dispatches `renderWeekOverview` to WeekOverviewCard
- [ ] CoachChatView renders UI tool cards inline in assistant messages
- [ ] UI tool cards appear after text but before any action cards in the same message
- [ ] Cards animate in with FadeIn
- [ ] Cards render correctly when message is not streaming (state = "call")
- [ ] Cards return null when message is still streaming (state = "streaming")
- [ ] Existing action tools (propose*) still work correctly after changes
- [ ] LLM receives both new tools via `allTools` spread in `http_action.ts`
