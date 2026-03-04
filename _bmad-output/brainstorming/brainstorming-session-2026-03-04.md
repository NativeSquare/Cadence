---
stepsCompleted: [1]
inputDocuments: []
session_topic: 'Analytics page UI revamp - framing, layout, grouping, and unlock experience for training analytics'
session_goals: 'Define the visual layout, information hierarchy, interaction model, and placement-run unlock mechanic for the analytics tab'
selected_approach: ''
techniques_used: []
ideas_generated: []
context_file: ''
---

# Brainstorming Session Results

**Facilitator:** NativeSquare
**Date:** 2026-03-04

## Session Overview

**Topic:** Analytics page UI revamp -- framing, layout, grouping, interaction model, and unlock experience for training analytics

**Goals:**
- Define the visual layout and information hierarchy for analytics
- Determine how to group and order the chart components
- Design the "placement runs" unlock mechanic (10-run threshold)
- Explore interactive chart experiences (clickable/expandable)
- Settle on radar chart dimensions for runner profile
- Reference Strava and COROS for proven patterns

### Context Guidance

_Cadence is an AI running coach app for performance-oriented runners. The analytics tab (route `analytics`) needs to display:_

1. **Plan Progress** (top) -- Condensed training block overview (Build/Peak/Taper/Race)
2. **Runner Profile Radar** -- 6-axis radar (reuse onboarding component: Endurance, Speed, Recovery, Consistency, Injury Risk, Race Ready)
3. **Prediction Charts** -- Estimated race chronos + speed graphs
4. **Volume Evolution** -- Volume over time (Strava-style)
5. **Zone Time Evolution** -- Time-in-zones over time, user-editable zone thresholds (COROS-style)
6. **Health Metrics** -- Heart rate and relevant health measures

_Unlock mechanic: Analytics gated behind 10 completed runs ("placement runs"), similar to League of Legends placement matches._

_Layout: Scrollable single-page view for MVP, with interactive/clickable charts._

### Session Setup

- Existing radar chart component can be reused from onboarding (`RadarChart.tsx`)
- Existing analytics components exist but are disconnected (histograms, line charts, stats grid)
- Charts should be interactive (clickable/expandable)
- Strava and COROS are primary design references
- MVP approach: scrollable view, not tabbed
