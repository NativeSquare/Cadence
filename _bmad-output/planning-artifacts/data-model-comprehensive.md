# Cadence Comprehensive Data Model

**Date:** 2026-02-16
**Author:** Winston (Architect) + NativeSquare
**Status:** Draft for Review
**Purpose:** Exhaustive, Terra-informed data model for the entire Cadence system

---

## Design Philosophy

### Core Principle: Build Once, Fill Later

> "I would prefer a big schema where we don't have all the data for the MVP than a schema we will have to rebuild from scratch."

This document defines the **complete** data model. For MVP, many fields will be null. That's fine. The schema is ready for:
- Manual user input (onboarding conversation)
- Strava import
- HealthKit import
- Terra API (future)
- Garmin direct (future)
- COROS direct (future)

### Data Source Agnosticism

Every data point can come from multiple sources. We track:
- **What** the value is
- **Where** it came from (source)
- **When** it was last updated
- **How confident** we are (for inferred values)

### Separation: Historical Records vs Current State

| Concept | Storage | Purpose |
|---------|---------|---------|
| **Historical Records** | `activities`, `sleepSessions`, `dailySummaries`, `bodyMeasurements` | What happened (immutable events) |
| **Current State** | `runners` | What we know now (derived, updated) |

The Runner Object is a **materialized view** of historical data + user preferences. It's what the AI sees.

---

## Table of Contents

1. [Historical Data Tables (Terra-Aligned)](#historical-data-tables)
2. [Runner Object (Current State)](#runner-object-current-state)
3. [Training Plans & Sessions](#training-plans--sessions)
4. [Knowledge Base (Tier 5)](#knowledge-base-tier-5)
5. [Safeguards System](#safeguards-system)
6. [Data Flow & Relationships](#data-flow--relationships)

---

## Historical Data Tables

These tables store raw events from wearables. Schema is aligned with Terra for future migration.

> **Implementation Note: Convex Components**
>
> All historical data tables (`activities`, `sleepSessions`, `dailySummaries`, `bodyMeasurements`)
> are built as **Convex reusable components** with 1-1 field mapping to Terra data models.
> This enables:
> - Drop-in replacement when migrating to Terra API
> - Consistent schema across all data sources
> - Reusable adapter patterns for each wearable
>
> **CRITICAL: Each source can affect ALL historical tables.**
> For example, HealthKit may write to `activities` (workouts), `sleepSessions` (sleep data),
> `dailySummaries` (steps, calories), and `bodyMeasurements` (weight). The Wearable Adapter
> Layer handles routing data from each source to the appropriate tables.

### Table: `activities`

Stores individual workout/activity records. Primary source: Strava, HealthKit workouts, manual entry.

```typescript
// packages/backend/convex/schema/activities.ts

activities: defineTable({
  // ═══════════════════════════════════════════════════════════════════════════
  // FOREIGN KEYS
  // ═══════════════════════════════════════════════════════════════════════════
  runnerId: v.id("runners"),
  userId: v.id("users"),

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA (Terra: metadata)
  // ═══════════════════════════════════════════════════════════════════════════
  externalId: v.optional(v.string()),           // summary_id from provider
  source: v.string(),                            // "strava" | "healthkit" | "garmin" | "coros" | "terra" | "manual"
  startTime: v.number(),                         // Unix timestamp (ms)
  endTime: v.number(),                           // Unix timestamp (ms)
  activityType: v.string(),                      // "running" | "cycling" | "swimming" | etc. (Terra ActivityType)
  name: v.optional(v.string()),                  // "Morning Run"
  uploadType: v.optional(v.string()),            // "automatic" | "manual" | "update"
  city: v.optional(v.string()),
  country: v.optional(v.string()),
  timestampLocalization: v.optional(v.number()), // 0=UTC, 1=local

  // ═══════════════════════════════════════════════════════════════════════════
  // DISTANCE DATA (Terra: distance_data)
  // ═══════════════════════════════════════════════════════════════════════════
  distanceMeters: v.optional(v.number()),
  steps: v.optional(v.number()),
  floorsClimbed: v.optional(v.number()),

  // Elevation
  elevationGainMeters: v.optional(v.number()),
  elevationLossMeters: v.optional(v.number()),
  elevationAvgMeters: v.optional(v.number()),
  elevationMaxMeters: v.optional(v.number()),
  elevationMinMeters: v.optional(v.number()),

  // Swimming specific
  swimLaps: v.optional(v.number()),
  swimStrokes: v.optional(v.number()),
  poolLengthMeters: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════════════
  // MOVEMENT DATA (Terra: movement_data)
  // ═══════════════════════════════════════════════════════════════════════════
  durationSeconds: v.optional(v.number()),       // Total elapsed time
  movingTimeSeconds: v.optional(v.number()),     // Time actually moving

  // Speed
  avgSpeedMetersPerSecond: v.optional(v.number()),
  maxSpeedMetersPerSecond: v.optional(v.number()),
  normalizedSpeedMetersPerSecond: v.optional(v.number()),

  // Pace (running-specific)
  avgPaceMinutesPerKm: v.optional(v.number()),
  maxPaceMinutesPerKm: v.optional(v.number()),

  // Cadence
  avgCadenceRpm: v.optional(v.number()),         // Steps per minute / 2 for running
  maxCadenceRpm: v.optional(v.number()),

  // Torque (cycling)
  avgTorqueNewtonMeters: v.optional(v.number()),
  maxTorqueNewtonMeters: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════════════
  // HEART RATE DATA (Terra: heart_rate_data)
  // ═══════════════════════════════════════════════════════════════════════════
  avgHeartRateBpm: v.optional(v.number()),
  maxHeartRateBpm: v.optional(v.number()),
  minHeartRateBpm: v.optional(v.number()),
  restingHeartRateBpm: v.optional(v.number()),
  userMaxHeartRateBpm: v.optional(v.number()),

  // HRV
  avgHrvRmssd: v.optional(v.number()),
  avgHrvSdnn: v.optional(v.number()),

  // Heart rate zones (duration in each zone, seconds)
  hrZone0Seconds: v.optional(v.number()),
  hrZone1Seconds: v.optional(v.number()),
  hrZone2Seconds: v.optional(v.number()),
  hrZone3Seconds: v.optional(v.number()),
  hrZone4Seconds: v.optional(v.number()),
  hrZone5Seconds: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════════════
  // CALORIES & ENERGY (Terra: calories_data, energy_data)
  // ═══════════════════════════════════════════════════════════════════════════
  totalBurnedCalories: v.optional(v.number()),
  netActivityCalories: v.optional(v.number()),
  bmrCalories: v.optional(v.number()),
  energyKilojoules: v.optional(v.number()),
  workKilojoules: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════════════
  // POWER DATA (Terra: power_data) - Cycling/Running power
  // ═══════════════════════════════════════════════════════════════════════════
  avgWatts: v.optional(v.number()),
  maxWatts: v.optional(v.number()),
  normalizedPowerWatts: v.optional(v.number()),
  functionalThresholdPower: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════════════
  // OXYGEN DATA (Terra: oxygen_data)
  // ═══════════════════════════════════════════════════════════════════════════
  avgOxygenSaturation: v.optional(v.number()),   // SpO2 percentage
  vo2MaxMlPerMinPerKg: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════════════
  // STRAIN & TRAINING LOAD (Terra: strain_data, TSS_data)
  // ═══════════════════════════════════════════════════════════════════════════
  strainLevel: v.optional(v.number()),           // Whoop-style strain
  trainingStressScore: v.optional(v.number()),   // TSS
  intensityFactor: v.optional(v.number()),       // IF
  sufferScore: v.optional(v.number()),           // Strava suffer score
  perceivedExertion: v.optional(v.number()),     // RPE 1-10, user-provided

  // ═══════════════════════════════════════════════════════════════════════════
  // MET DATA (Terra: MET_data)
  // ═══════════════════════════════════════════════════════════════════════════
  avgMetLevel: v.optional(v.number()),
  highIntensityMinutes: v.optional(v.number()),
  moderateIntensityMinutes: v.optional(v.number()),
  lowIntensityMinutes: v.optional(v.number()),
  inactiveMinutes: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIVE DURATIONS (Terra: active_durations_data)
  // ═══════════════════════════════════════════════════════════════════════════
  activitySeconds: v.optional(v.number()),
  inactivitySeconds: v.optional(v.number()),
  restSeconds: v.optional(v.number()),
  lowIntensitySeconds: v.optional(v.number()),
  moderateIntensitySeconds: v.optional(v.number()),
  vigorousIntensitySeconds: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════════════
  // POSITION DATA (Terra: position_data, polyline_map_data)
  // ═══════════════════════════════════════════════════════════════════════════
  startLatitude: v.optional(v.number()),
  startLongitude: v.optional(v.number()),
  endLatitude: v.optional(v.number()),
  endLongitude: v.optional(v.number()),
  summaryPolyline: v.optional(v.string()),       // Encoded polyline for map

  // ═══════════════════════════════════════════════════════════════════════════
  // LAP DATA (Terra: lap_data) - Stored as JSON for MVP
  // ═══════════════════════════════════════════════════════════════════════════
  laps: v.optional(v.string()),                  // JSON: Array<LapSample>
  splits: v.optional(v.string()),                // JSON: Per-km/mile splits

  // ═══════════════════════════════════════════════════════════════════════════
  // SAMPLES (High-frequency data, stored as JSON for MVP)
  // ═══════════════════════════════════════════════════════════════════════════
  heartRateSamples: v.optional(v.string()),      // JSON: Array<{timestamp, bpm}>
  cadenceSamples: v.optional(v.string()),        // JSON: Array<{timestamp, rpm}>
  speedSamples: v.optional(v.string()),          // JSON: Array<{timestamp, mps}>
  positionSamples: v.optional(v.string()),       // JSON: Array<{timestamp, lat, lng, alt}>
  powerSamples: v.optional(v.string()),          // JSON: Array<{timestamp, watts}>

  // ═══════════════════════════════════════════════════════════════════════════
  // DEVICE DATA (Terra: device_data)
  // ═══════════════════════════════════════════════════════════════════════════
  deviceManufacturer: v.optional(v.string()),
  deviceName: v.optional(v.string()),
  deviceSoftwareVersion: v.optional(v.string()),

  // ═══════════════════════════════════════════════════════════════════════════
  // CADENCE-SPECIFIC EXTENSIONS
  // ═══════════════════════════════════════════════════════════════════════════

  // Session classification (our own)
  sessionType: v.optional(v.string()),           // "easy" | "tempo" | "interval" | "long" | "recovery" | "race"
  sessionTypeSource: v.optional(v.string()),     // "inferred" | "user" | "plan"
  sessionTypeConfidence: v.optional(v.number()), // 0-1 if inferred

  // Plan linkage
  plannedSessionId: v.optional(v.id("plannedSessions")), // If this was a planned session
  planAdherence: v.optional(v.number()),         // 0-1, how well did it match the plan

  // User feedback
  userNotes: v.optional(v.string()),
  userRating: v.optional(v.number()),            // 1-5 how the run felt
  userTags: v.optional(v.array(v.string())),     // ["tired", "legs_heavy", "breakthrough"]

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════════════
  rawPayload: v.optional(v.string()),            // Original API response (debugging)
  importedAt: v.number(),
  lastSyncedAt: v.number(),
})
.index("by_runnerId", ["runnerId"])
.index("by_userId", ["userId"])
.index("by_startTime", ["runnerId", "startTime"])
.index("by_source", ["runnerId", "source"])
.index("by_externalId", ["source", "externalId"])
.index("by_type", ["runnerId", "activityType"])
.index("by_sessionType", ["runnerId", "sessionType"])
```

### Table: `sleepSessions`

Stores individual sleep records. Primary source: HealthKit, Garmin, Oura, Whoop.

```typescript
// packages/backend/convex/schema/sleepSessions.ts

sleepSessions: defineTable({
  // ═══════════════════════════════════════════════════════════════════════════
  // FOREIGN KEYS
  // ═══════════════════════════════════════════════════════════════════════════
  runnerId: v.id("runners"),
  userId: v.id("users"),

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA (Terra: metadata)
  // ═══════════════════════════════════════════════════════════════════════════
  externalId: v.optional(v.string()),
  source: v.string(),                            // "healthkit" | "garmin" | "oura" | "whoop" | "terra" | "manual"
  startTime: v.number(),                         // Unix timestamp (ms)
  endTime: v.number(),
  isNap: v.optional(v.boolean()),
  uploadType: v.optional(v.string()),

  // ═══════════════════════════════════════════════════════════════════════════
  // SLEEP DURATIONS (Terra: sleep_durations_data)
  // ═══════════════════════════════════════════════════════════════════════════

  // Asleep states
  totalAsleepSeconds: v.optional(v.number()),
  deepSleepSeconds: v.optional(v.number()),
  lightSleepSeconds: v.optional(v.number()),
  remSleepSeconds: v.optional(v.number()),
  numRemEvents: v.optional(v.number()),

  // Awake states
  totalAwakeSeconds: v.optional(v.number()),
  awakeInterruptionSeconds: v.optional(v.number()),
  numWakeupEvents: v.optional(v.number()),
  numOutOfBedEvents: v.optional(v.number()),
  sleepLatencySeconds: v.optional(v.number()),   // Time to fall asleep
  wakeUpLatencySeconds: v.optional(v.number()),  // Time to get out of bed after waking

  // Other
  inBedSeconds: v.optional(v.number()),
  unmeasurableSleepSeconds: v.optional(v.number()),
  sleepEfficiency: v.optional(v.number()),       // 0-1, asleep/inBed

  // ═══════════════════════════════════════════════════════════════════════════
  // HEART RATE DATA (Terra: heart_rate_data)
  // ═══════════════════════════════════════════════════════════════════════════
  avgHeartRateBpm: v.optional(v.number()),
  minHeartRateBpm: v.optional(v.number()),
  maxHeartRateBpm: v.optional(v.number()),
  restingHeartRateBpm: v.optional(v.number()),
  avgHrvRmssd: v.optional(v.number()),
  avgHrvSdnn: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════════════
  // RESPIRATION DATA (Terra: respiration_data)
  // ═══════════════════════════════════════════════════════════════════════════
  avgBreathsPerMin: v.optional(v.number()),
  minBreathsPerMin: v.optional(v.number()),
  maxBreathsPerMin: v.optional(v.number()),
  avgOxygenSaturation: v.optional(v.number()),
  numSnoringEvents: v.optional(v.number()),
  totalSnoringSeconds: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════════════
  // READINESS DATA (Terra: readiness_data)
  // ═══════════════════════════════════════════════════════════════════════════
  readinessScore: v.optional(v.number()),        // 0-100
  recoveryLevel: v.optional(v.string()),         // "very_poor" | "poor" | "compromised" | "ok" | "good" | "very_good"

  // ═══════════════════════════════════════════════════════════════════════════
  // TEMPERATURE DATA (Terra: temperature_data)
  // ═══════════════════════════════════════════════════════════════════════════
  temperatureDelta: v.optional(v.number()),      // Deviation from baseline

  // ═══════════════════════════════════════════════════════════════════════════
  // SCORES (Terra: scores, data_enrichment)
  // ═══════════════════════════════════════════════════════════════════════════
  sleepScore: v.optional(v.number()),            // 0-100
  sleepContributors: v.optional(v.string()),     // JSON: factors affecting score

  // ═══════════════════════════════════════════════════════════════════════════
  // SAMPLES (High-frequency data)
  // ═══════════════════════════════════════════════════════════════════════════
  hypnogramSamples: v.optional(v.string()),      // JSON: sleep stages over time
  heartRateSamples: v.optional(v.string()),
  hrvSamples: v.optional(v.string()),

  // ═══════════════════════════════════════════════════════════════════════════
  // DEVICE DATA
  // ═══════════════════════════════════════════════════════════════════════════
  deviceManufacturer: v.optional(v.string()),
  deviceName: v.optional(v.string()),

  // ═══════════════════════════════════════════════════════════════════════════
  // CADENCE-SPECIFIC EXTENSIONS
  // ═══════════════════════════════════════════════════════════════════════════
  userNotes: v.optional(v.string()),
  qualityRating: v.optional(v.number()),         // User's subjective 1-5 rating
  disturbanceFactors: v.optional(v.array(v.string())), // ["alcohol", "late_meal", "stress"]

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════════════
  importedAt: v.number(),
  lastSyncedAt: v.number(),
})
.index("by_runnerId", ["runnerId"])
.index("by_startTime", ["runnerId", "startTime"])
.index("by_source", ["runnerId", "source"])
```

### Table: `dailySummaries`

Daily aggregated metrics. One record per runner per day. Updated throughout the day.

```typescript
// packages/backend/convex/schema/dailySummaries.ts

dailySummaries: defineTable({
  // ═══════════════════════════════════════════════════════════════════════════
  // FOREIGN KEYS
  // ═══════════════════════════════════════════════════════════════════════════
  runnerId: v.id("runners"),
  userId: v.id("users"),

  // ═══════════════════════════════════════════════════════════════════════════
  // DATE IDENTIFIER
  // ═══════════════════════════════════════════════════════════════════════════
  date: v.string(),                              // "2026-02-16" format
  startTime: v.number(),                         // Start of day (UTC)
  endTime: v.number(),                           // End of day (UTC)

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIVE DURATIONS (Terra: active_durations_data)
  // ═══════════════════════════════════════════════════════════════════════════
  activitySeconds: v.optional(v.number()),
  inactivitySeconds: v.optional(v.number()),
  restSeconds: v.optional(v.number()),
  lowIntensitySeconds: v.optional(v.number()),
  moderateIntensitySeconds: v.optional(v.number()),
  vigorousIntensitySeconds: v.optional(v.number()),
  standingHoursCount: v.optional(v.number()),
  standingSeconds: v.optional(v.number()),
  numInactivePeriods: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════════════
  // DISTANCE DATA (Terra: distance_data)
  // ═══════════════════════════════════════════════════════════════════════════
  totalDistanceMeters: v.optional(v.number()),
  totalSteps: v.optional(v.number()),
  floorsClimbed: v.optional(v.number()),
  elevationGainMeters: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════════════
  // CALORIES DATA (Terra: calories_data)
  // ═══════════════════════════════════════════════════════════════════════════
  totalBurnedCalories: v.optional(v.number()),
  netActivityCalories: v.optional(v.number()),
  bmrCalories: v.optional(v.number()),
  netIntakeCalories: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════════════
  // HEART RATE DATA (Terra: heart_rate_data)
  // ═══════════════════════════════════════════════════════════════════════════
  avgHeartRateBpm: v.optional(v.number()),
  maxHeartRateBpm: v.optional(v.number()),
  minHeartRateBpm: v.optional(v.number()),
  restingHeartRateBpm: v.optional(v.number()),
  avgHrvRmssd: v.optional(v.number()),
  avgHrvSdnn: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════════════
  // OXYGEN DATA (Terra: oxygen_data)
  // ═══════════════════════════════════════════════════════════════════════════
  avgOxygenSaturation: v.optional(v.number()),
  vo2MaxMlPerMinPerKg: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════════════
  // MET DATA (Terra: MET_data)
  // ═══════════════════════════════════════════════════════════════════════════
  avgMetLevel: v.optional(v.number()),
  highIntensityMinutes: v.optional(v.number()),
  moderateIntensityMinutes: v.optional(v.number()),
  lowIntensityMinutes: v.optional(v.number()),
  inactiveMinutes: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════════════
  // STRAIN DATA (Terra: strain_data)
  // ═══════════════════════════════════════════════════════════════════════════
  strainLevel: v.optional(v.number()),           // Daily strain (Whoop-style)
  acuteTrainingLoad: v.optional(v.number()),     // ATL - recent load
  chronicTrainingLoad: v.optional(v.number()),   // CTL - fitness baseline
  trainingStressBalance: v.optional(v.number()), // TSB = CTL - ATL

  // ═══════════════════════════════════════════════════════════════════════════
  // STRESS DATA (Terra: stress_data)
  // ═══════════════════════════════════════════════════════════════════════════
  avgStressLevel: v.optional(v.number()),
  maxStressLevel: v.optional(v.number()),
  stressRating: v.optional(v.number()),
  lowStressSeconds: v.optional(v.number()),
  mediumStressSeconds: v.optional(v.number()),
  highStressSeconds: v.optional(v.number()),
  restStressSeconds: v.optional(v.number()),

  // Body battery (Garmin)
  bodyBatteryHigh: v.optional(v.number()),
  bodyBatteryLow: v.optional(v.number()),
  bodyBatteryCurrent: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCORES (Terra: scores, data_enrichment)
  // ═══════════════════════════════════════════════════════════════════════════
  activityScore: v.optional(v.number()),
  recoveryScore: v.optional(v.number()),
  sleepScore: v.optional(v.number()),
  readinessScore: v.optional(v.number()),
  cardiovascularScore: v.optional(v.number()),
  respiratoryScore: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIVITY SUMMARY (Our aggregation)
  // ═══════════════════════════════════════════════════════════════════════════
  activityCount: v.optional(v.number()),
  runCount: v.optional(v.number()),
  runDistanceMeters: v.optional(v.number()),
  runDurationSeconds: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════════════
  // SLEEP SUMMARY (Pulled from sleepSessions)
  // ═══════════════════════════════════════════════════════════════════════════
  sleepDurationSeconds: v.optional(v.number()),
  deepSleepSeconds: v.optional(v.number()),
  remSleepSeconds: v.optional(v.number()),
  sleepEfficiency: v.optional(v.number()),
  sleepStartTime: v.optional(v.number()),
  sleepEndTime: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════════════
  // SOURCES
  // ═══════════════════════════════════════════════════════════════════════════
  sources: v.array(v.string()),                  // ["strava", "healthkit", "garmin"]

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════════════
  lastUpdatedAt: v.number(),
})
.index("by_runnerId_date", ["runnerId", "date"])
.index("by_userId", ["userId"])
```

### Table: `bodyMeasurements`

Biometric measurements over time. Source: scales, manual entry, health apps.

```typescript
// packages/backend/convex/schema/bodyMeasurements.ts

bodyMeasurements: defineTable({
  // ═══════════════════════════════════════════════════════════════════════════
  // FOREIGN KEYS
  // ═══════════════════════════════════════════════════════════════════════════
  runnerId: v.id("runners"),
  userId: v.id("users"),

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════════════
  timestamp: v.number(),
  source: v.string(),
  measurementType: v.string(),                   // "weight" | "body_composition" | "blood_pressure" | "glucose"

  // ═══════════════════════════════════════════════════════════════════════════
  // WEIGHT & BODY COMPOSITION
  // ═══════════════════════════════════════════════════════════════════════════
  weightKg: v.optional(v.number()),
  bodyFatPercentage: v.optional(v.number()),
  muscleMassKg: v.optional(v.number()),
  boneMassKg: v.optional(v.number()),
  waterPercentage: v.optional(v.number()),
  bmi: v.optional(v.number()),
  visceralFat: v.optional(v.number()),
  metabolicAge: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════════════
  // BLOOD PRESSURE (Terra: blood_pressure_data)
  // ═══════════════════════════════════════════════════════════════════════════
  systolicMmHg: v.optional(v.number()),
  diastolicMmHg: v.optional(v.number()),
  pulseBpm: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════════════
  // GLUCOSE (Terra: glucose_data)
  // ═══════════════════════════════════════════════════════════════════════════
  bloodGlucoseMgPerDl: v.optional(v.number()),
  glucoseFlag: v.optional(v.string()),           // "normal" | "high" | "low"
  glucoseTrendArrow: v.optional(v.string()),     // "rising" | "flat" | "falling"

  // ═══════════════════════════════════════════════════════════════════════════
  // TEMPERATURE (Terra: temperature_data)
  // ═══════════════════════════════════════════════════════════════════════════
  bodyTemperatureCelsius: v.optional(v.number()),
  skinTemperatureCelsius: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════════════
  // HYDRATION (Terra: hydration_data)
  // ═══════════════════════════════════════════════════════════════════════════
  waterConsumptionMl: v.optional(v.number()),

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════════════
  importedAt: v.number(),
})
.index("by_runnerId", ["runnerId"])
.index("by_timestamp", ["runnerId", "timestamp"])
.index("by_type", ["runnerId", "measurementType"])
```

---

## Runner Object (Current State)

The Runner Object is the **canonical view** of what we know about a runner RIGHT NOW. It's built from:
- Direct user input (onboarding, preferences)
- Derived metrics (calculated from historical data)
- Latest readings (most recent biometrics)

### Revised Runner Schema

The existing schema is good. Here's the enhanced version with Terra-alignment:

```typescript
// packages/backend/convex/schema/runners.ts (ENHANCED)

runners: defineTable({
  // ═══════════════════════════════════════════════════════════════════════════
  // FOREIGN KEYS
  // ═══════════════════════════════════════════════════════════════════════════
  userId: v.id("users"),

  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTITY (User-provided)
  // ═══════════════════════════════════════════════════════════════════════════
  identity: v.object({
    name: v.string(),
    nameConfirmed: v.boolean(),
    preferredName: v.optional(v.string()),       // What to call them
    timezone: v.optional(v.string()),            // "America/New_York"
    locale: v.optional(v.string()),              // "en-US"
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // PHYSICAL PROFILE (User-provided + Wearable)
  // ═══════════════════════════════════════════════════════════════════════════
  physical: v.object({
    // User-provided
    age: v.optional(v.number()),
    dateOfBirth: v.optional(v.number()),         // Unix timestamp
    biologicalSex: v.optional(v.string()),       // "male" | "female" | "other"
    heightCm: v.optional(v.number()),

    // Latest from wearable/manual
    weightKg: v.optional(v.number()),
    weightSource: v.optional(v.string()),        // "manual" | "healthkit" | "garmin"
    weightUpdatedAt: v.optional(v.number()),

    bodyFatPercentage: v.optional(v.number()),
    bmi: v.optional(v.number()),

    // Physiological limits (user-set or calculated)
    maxHeartRate: v.optional(v.number()),
    maxHeartRateSource: v.optional(v.string()),  // "age_formula" | "test" | "observed"
    restingHeartRate: v.optional(v.number()),
    restingHeartRateSource: v.optional(v.string()),

    // Lactate/threshold (from testing or estimation)
    lactateThresholdHeartRate: v.optional(v.number()),
    functionalThresholdPace: v.optional(v.string()), // "4:30/km"
    functionalThresholdPower: v.optional(v.number()), // watts, if power runner
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // RUNNING PROFILE (User-provided + Derived)
  // ═══════════════════════════════════════════════════════════════════════════
  running: v.object({
    // User-provided
    experienceLevel: v.optional(v.string()),     // "beginner" | "returning" | "casual" | "serious" | "competitive"
    monthsRunning: v.optional(v.number()),
    runningBackground: v.optional(v.string()),   // "never" | "youth_sports" | "college" | "adult_hobby"

    // Self-reported current state
    currentFrequency: v.optional(v.number()),    // Days per week
    currentVolume: v.optional(v.number()),       // Km per week
    easyPace: v.optional(v.string()),            // "5:40/km" self-reported
    longestRecentRun: v.optional(v.number()),    // Km

    // Derived from wearable data (updated by inference engine)
    actualWeeklyVolume: v.optional(v.number()),  // Calculated from activities
    actualWeeklyVolumeSource: v.optional(v.string()),
    actualEasyPace: v.optional(v.string()),      // Calculated from HR zones
    actualLongRunDistance: v.optional(v.number()),
    trainingConsistency: v.optional(v.string()), // "high" | "moderate" | "low"
    trainingConsistencyScore: v.optional(v.number()), // 0-100

    // Running economy / fitness estimation
    vdot: v.optional(v.number()),                // Jack Daniels VDOT
    vdotSource: v.optional(v.string()),          // "race" | "time_trial" | "estimated"
    vdotUpdatedAt: v.optional(v.number()),
    vo2Max: v.optional(v.number()),              // From wearable
    vo2MaxSource: v.optional(v.string()),

    // Pace zones (calculated from VDOT or threshold)
    paceZones: v.optional(v.object({
      recovery: v.optional(v.string()),          // "6:30-7:00/km"
      easy: v.optional(v.string()),
      marathon: v.optional(v.string()),
      threshold: v.optional(v.string()),
      interval: v.optional(v.string()),
      repetition: v.optional(v.string()),
    })),

    // Heart rate zones
    hrZones: v.optional(v.object({
      zone1: v.optional(v.object({ min: v.number(), max: v.number() })),
      zone2: v.optional(v.object({ min: v.number(), max: v.number() })),
      zone3: v.optional(v.object({ min: v.number(), max: v.number() })),
      zone4: v.optional(v.object({ min: v.number(), max: v.number() })),
      zone5: v.optional(v.object({ min: v.number(), max: v.number() })),
    })),

    // Personal bests (from races/activities)
    personalBests: v.optional(v.object({
      fiveK: v.optional(v.object({ time: v.number(), date: v.number(), source: v.string() })),
      tenK: v.optional(v.object({ time: v.number(), date: v.number(), source: v.string() })),
      halfMarathon: v.optional(v.object({ time: v.number(), date: v.number(), source: v.string() })),
      marathon: v.optional(v.object({ time: v.number(), date: v.number(), source: v.string() })),
    })),
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // GOALS (User-provided)
  // ═══════════════════════════════════════════════════════════════════════════
  goals: v.object({
    goalType: v.optional(v.string()),            // "race" | "speed" | "base_building" | "return_to_fitness" | "general_health"

    // If race goal
    raceDistance: v.optional(v.number()),        // Km
    raceDistanceLabel: v.optional(v.string()),   // "half_marathon"
    raceDate: v.optional(v.number()),            // Unix timestamp
    raceName: v.optional(v.string()),            // "Boston Marathon"
    targetTime: v.optional(v.number()),          // Seconds
    targetPace: v.optional(v.string()),          // "5:00/km"
    goalPriority: v.optional(v.string()),        // "finish" | "time_goal" | "pr" | "qualify"

    // If non-race goal
    targetVolume: v.optional(v.number()),        // Km/week for base building
    targetPaceImprovement: v.optional(v.string()), // For speed goal

    // Secondary goals
    secondaryGoals: v.optional(v.array(v.string())), // ["improve_endurance", "lose_weight", "build_habit"]

    // Goal feasibility (set by plan generator)
    goalFeasibility: v.optional(v.string()),     // "achievable" | "ambitious" | "unlikely" | "needs_adjustment"
    goalFeasibilityReason: v.optional(v.string()),
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCHEDULE (User-provided)
  // ═══════════════════════════════════════════════════════════════════════════
  schedule: v.object({
    availableDays: v.optional(v.number()),       // Total days can run
    preferredDays: v.optional(v.array(v.string())), // ["monday", "wednesday", "saturday"]
    blockedDays: v.optional(v.array(v.string())), // ["tuesday", "thursday"]
    preferredTime: v.optional(v.string()),       // "morning" | "midday" | "evening" | "varies"
    longRunDay: v.optional(v.string()),          // "saturday" | "sunday"

    // Constraints
    maxSessionDurationMinutes: v.optional(v.number()),
    hasGymAccess: v.optional(v.boolean()),
    hasTrackAccess: v.optional(v.boolean()),
    hasHillsAccess: v.optional(v.boolean()),

    // Calendar integration
    calendarConnected: v.optional(v.boolean()),
    calendarProvider: v.optional(v.string()),    // "google" | "apple" | "outlook"
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // HEALTH & INJURY (User-provided + Inferred)
  // ═══════════════════════════════════════════════════════════════════════════
  health: v.object({
    // Injury history
    pastInjuries: v.optional(v.array(v.string())), // ["shin_splints", "itbs", "plantar_fasciitis"]
    injuryDetails: v.optional(v.array(v.object({
      type: v.string(),
      severity: v.optional(v.string()),          // "minor" | "moderate" | "severe"
      dateOccurred: v.optional(v.number()),
      dateRecovered: v.optional(v.number()),
      notes: v.optional(v.string()),
    }))),
    currentPain: v.optional(v.array(v.string())),

    // Recovery profile
    recoveryStyle: v.optional(v.string()),       // "quick" | "slow" | "push_through" | "no_injuries"

    // Lifestyle factors
    sleepQuality: v.optional(v.string()),        // "solid" | "inconsistent" | "poor"
    stressLevel: v.optional(v.string()),         // "low" | "moderate" | "high" | "survival"
    nutritionQuality: v.optional(v.string()),    // "dialed" | "decent" | "chaotic"
    alcoholFrequency: v.optional(v.string()),    // "never" | "rarely" | "weekly" | "daily"

    // Medical
    medicalConditions: v.optional(v.array(v.string())), // For awareness, not diagnosis
    medications: v.optional(v.array(v.string())),
    hasPhysicianClearance: v.optional(v.boolean()),

    // Menstrual cycle (if applicable)
    tracksMenstrualCycle: v.optional(v.boolean()),
    currentCyclePhase: v.optional(v.string()),   // "menstrual" | "follicular" | "ovulation" | "luteal"
    cycleAffectsTraining: v.optional(v.boolean()),
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // COACHING PREFERENCES (User-provided)
  // ═══════════════════════════════════════════════════════════════════════════
  coaching: v.object({
    coachingVoice: v.optional(v.string()),       // "tough_love" | "encouraging" | "analytical" | "minimalist"
    dataOrientation: v.optional(v.string()),     // "data_driven" | "curious" | "feel_based"
    feedbackFrequency: v.optional(v.string()),   // "daily" | "after_runs" | "weekly" | "minimal"

    // Motivations
    biggestChallenge: v.optional(v.string()),
    motivations: v.optional(v.array(v.string())),// ["health", "competition", "stress_relief", "social"]
    skipTriggers: v.optional(v.array(v.string())), // What makes them skip runs

    // Communication
    preferredNotificationTime: v.optional(v.string()),
    notificationsEnabled: v.optional(v.boolean()),
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // WEARABLE CONNECTIONS (System-managed)
  // ═══════════════════════════════════════════════════════════════════════════
  connections: v.object({
    // Primary wearable
    wearableConnected: v.optional(v.boolean()),
    primaryWearable: v.optional(v.string()),     // "garmin" | "apple_watch" | "coros" | "polar" | "whoop"

    // Specific connections
    stravaConnected: v.optional(v.boolean()),
    stravaAthleteId: v.optional(v.string()),
    stravaLastSync: v.optional(v.number()),

    healthkitConnected: v.optional(v.boolean()),
    healthkitLastSync: v.optional(v.number()),

    garminConnected: v.optional(v.boolean()),
    garminLastSync: v.optional(v.number()),

    corosConnected: v.optional(v.boolean()),
    corosLastSync: v.optional(v.number()),

    polarConnected: v.optional(v.boolean()),
    polarLastSync: v.optional(v.number()),

    whoopConnected: v.optional(v.boolean()),
    whoopLastSync: v.optional(v.number()),

    terraConnected: v.optional(v.boolean()),     // For future
    terraUserId: v.optional(v.string()),

    // Calendar
    calendarConnected: v.optional(v.boolean()),
    calendarProvider: v.optional(v.string()),

    // ═══════════════════════════════════════════════════════════════════════
    // SOURCE PRECEDENCE CONFIGURATION
    // ═══════════════════════════════════════════════════════════════════════
    // When multiple sources provide conflicting data, these rules decide which wins.
    // See architecture-backend-v2.md "Source Precedence System" for full details.
    //
    // Default priority (lower = higher priority):
    //   manual=0, primary_wearable=1, strava=2, healthkit=2, inferred=10
    //
    // Field-specific overrides exist for:
    //   - heart_rate: prefers device with optical sensor
    //   - distance: prefers GPS-based source
    //   - duration: prefers device source
    sourcePrecedence: v.optional(v.object({
      // User can customize priority order
      customPriority: v.optional(v.array(v.object({
        source: v.string(),                      // "manual" | "strava" | "healthkit" | "garmin" | "coros" | "inferred"
        priority: v.number(),                    // 0 = highest priority
      }))),
      // Override primary wearable (if different from auto-detected)
      primarySourceOverride: v.optional(v.string()),
      // When was precedence last updated
      lastUpdatedAt: v.optional(v.number()),
    })),
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // CURRENT STATE (Derived from recent data)
  // ═══════════════════════════════════════════════════════════════════════════
  currentState: v.object({
    // Training load
    acuteTrainingLoad: v.optional(v.number()),   // ATL (7-day)
    chronicTrainingLoad: v.optional(v.number()), // CTL (42-day)
    trainingStressBalance: v.optional(v.number()), // TSB (form)
    trainingLoadTrend: v.optional(v.string()),   // "building" | "maintaining" | "declining" | "erratic"

    // Freshness/readiness
    readinessScore: v.optional(v.number()),      // 0-100
    readinessFactors: v.optional(v.array(v.string())), // ["good_sleep", "low_hrv", "high_volume"]

    // Recent patterns (updated by inference engine)
    last7DaysVolume: v.optional(v.number()),
    last7DaysRunCount: v.optional(v.number()),
    last28DaysVolume: v.optional(v.number()),
    last28DaysRunCount: v.optional(v.number()),

    // Risk assessment
    injuryRiskLevel: v.optional(v.string()),     // "low" | "moderate" | "elevated" | "high"
    injuryRiskFactors: v.optional(v.array(v.string())),
    overtrainingRisk: v.optional(v.string()),

    // Latest biometrics
    latestRestingHr: v.optional(v.number()),
    latestHrv: v.optional(v.number()),
    latestWeight: v.optional(v.number()),
    latestSleepScore: v.optional(v.number()),

    // Updated timestamp
    lastCalculatedAt: v.optional(v.number()),
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGAL / CONSENT (System-managed)
  // ═══════════════════════════════════════════════════════════════════════════
  legal: v.object({
    termsAcceptedAt: v.optional(v.number()),
    privacyAcceptedAt: v.optional(v.number()),
    healthConsentAt: v.optional(v.number()),
    consentVersion: v.optional(v.string()),
    marketingOptIn: v.optional(v.boolean()),
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // CONVERSATION STATE (System-managed)
  // ═══════════════════════════════════════════════════════════════════════════
  conversationState: v.object({
    dataCompleteness: v.optional(v.number()),    // 0-100
    readyForPlan: v.optional(v.boolean()),
    currentPhase: v.optional(v.string()),
    onboardingCompletedAt: v.optional(v.number()),
    fieldsToConfirm: v.optional(v.array(v.string())),
    fieldsMissing: v.optional(v.array(v.string())),
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════════════
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_userId", ["userId"])
```

---

## Training Plans & Sessions

### Table: `trainingPlans`

The overall plan structure. Supports **three zoom levels**: Season (macro), Weekly (meso), Daily (micro).

**UI Requirements (from RadarChart.tsx and ProgressionChart.tsx):**

```typescript
// RadarChart needs runner profile snapshot at plan creation time
interface RadarDataPoint {
  label: string;           // "Endurance" | "Speed" | "Recovery" | "Consistency" | "Injury Risk" | "Race Ready"
  value: number;           // 0-100
  uncertain?: boolean;     // Orange color for estimated values
}

// ProgressionChart needs week-by-week volume/intensity data
interface WeekData {
  week: number;
  volume: number;          // km, typically 0-80 scale
  intensity: number;       // 0-100 scale
  recovery?: boolean;      // Is this a recovery week?
  label?: string;          // "Recovery" or "Race"
}
```

**Schema designed to support multi-level zoom:**

```typescript
// packages/backend/convex/schema/trainingPlans.ts

trainingPlans: defineTable({
  runnerId: v.id("runners"),
  userId: v.id("users"),

  // ═══════════════════════════════════════════════════════════════════════════
  // PLAN METADATA
  // ═══════════════════════════════════════════════════════════════════════════
  name: v.string(),                              // "Half Marathon - 12 Week Plan"
  goalType: v.string(),
  targetEvent: v.optional(v.string()),           // "Boston Marathon"
  targetDate: v.optional(v.number()),
  targetTime: v.optional(v.number()),            // Seconds

  startDate: v.number(),
  endDate: v.number(),
  durationWeeks: v.number(),

  status: v.string(),                            // "draft" | "active" | "paused" | "completed" | "abandoned"

  // ═══════════════════════════════════════════════════════════════════════════
  // ZOOM LEVEL 1: SEASON / MACRO VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  // This is the "big picture" - why this plan exists and how it's structured

  seasonView: v.object({
    // Coach's overall philosophy for this plan
    coachSummary: v.string(),                    // 2-3 sentence overview
    // Example: "This 12-week plan progressively builds your aerobic base before
    //          sharpening with threshold work. We're prioritizing durability over
    //          speed given your shin splint history."

    // Key strategic decisions explained
    periodizationJustification: v.string(),      // Why this approach?
    // Example: "Using polarized distribution (80% easy / 20% hard) because
    //          research shows it's effective for time-crunched athletes, and
    //          your history suggests you respond well to easy volume."

    volumeStrategyJustification: v.string(),     // Why these volume numbers?
    // Example: "Starting at 30km/week (your current baseline) and building to
    //          50km peak. Conservative 7% increases due to injury history."

    keyMilestones: v.array(v.object({
      weekNumber: v.number(),
      milestone: v.string(),                     // "First 20km long run"
      significance: v.string(),                  // "Proves race-day endurance is building"
    })),

    // Risk assessment at season level
    identifiedRisks: v.array(v.object({
      risk: v.string(),                          // "Shin splint recurrence"
      mitigation: v.string(),                    // "7% volume increases, extra rest after long runs"
      monitoringSignals: v.array(v.string()),    // ["shin tenderness", "pace decline"]
    })),

    // What success looks like
    expectedOutcomes: v.object({
      primaryGoal: v.string(),                   // "Finish half marathon under 2:00"
      confidenceLevel: v.string(),               // "achievable" | "ambitious" | "stretch"
      confidenceReason: v.string(),
      secondaryOutcomes: v.array(v.string()),    // ["Improved aerobic base", "Better pacing intuition"]
    }),
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // ZOOM LEVEL 2: WEEKLY / MESO VIEW
  // ═══════════════════════════════════════════════════════════════════════════
  // Week-by-week structure for ProgressionChart and weekly planning

  weeklyPlan: v.array(v.object({
    weekNumber: v.number(),                      // 1, 2, 3...
    weekStartDate: v.number(),                   // Unix timestamp
    weekEndDate: v.number(),

    // Phase context
    phaseName: v.string(),                       // "Base", "Build", "Peak", "Taper"
    phaseWeekNumber: v.number(),                 // Week 2 of Base phase

    // For ProgressionChart visualization
    volumeKm: v.number(),                        // Total km this week
    intensityScore: v.number(),                  // 0-100, weighted intensity
    isRecoveryWeek: v.boolean(),
    weekLabel: v.optional(v.string()),           // "Recovery" | "Race" | null

    // Session breakdown
    keySessions: v.number(),                     // Count of hard sessions
    easyRuns: v.number(),                        // Count of easy sessions
    restDays: v.number(),                        // Count of rest days

    // Weekly coach commentary
    weekFocus: v.string(),                       // What's the main goal this week?
    // Example: "Building aerobic endurance with volume increase"

    weekJustification: v.string(),               // Why is this week structured this way?
    // Example: "Increasing volume by 7% from last week. Long run moves to Sunday
    //          because you mentioned a busy Saturday this week."

    coachNotes: v.optional(v.string()),          // Any special considerations
    // Example: "Pay attention to how your shins feel after Tuesday's hill sprints.
    //          If any tenderness, swap Thursday's tempo for an easy run."

    // Comparison to previous week
    volumeChangePercent: v.number(),             // +7% or -20% (recovery)
    intensityChangeNote: v.optional(v.string()), // "Adding intervals this week"

    // What to watch for
    warningSignals: v.optional(v.array(v.string())), // ["Persistent fatigue", "HR creep"]
  })),

  // ═══════════════════════════════════════════════════════════════════════════
  // RUNNER SNAPSHOT AT PLAN CREATION (For RadarChart)
  // ═══════════════════════════════════════════════════════════════════════════
  // Captures the runner's profile when plan was generated, for visualization

  runnerSnapshot: v.object({
    capturedAt: v.number(),                      // When snapshot was taken

    // For RadarChart display (6 axes)
    profileRadar: v.array(v.object({
      label: v.string(),                         // "Endurance" | "Speed" | "Recovery" | "Consistency" | "Injury Risk" | "Race Ready"
      value: v.number(),                         // 0-100
      uncertain: v.boolean(),                    // True if estimated/inferred
    })),

    // Underlying data used to compute radar
    fitnessIndicators: v.object({
      currentVdot: v.optional(v.number()),
      currentWeeklyVolume: v.optional(v.number()),
      recentConsistencyScore: v.optional(v.number()),
      estimatedVo2Max: v.optional(v.number()),
      injuryHistoryCount: v.optional(v.number()),
      daysToGoal: v.optional(v.number()),
    }),

    // Notable factors that influenced the plan
    planInfluencers: v.array(v.object({
      factor: v.string(),                        // "shin_splint_history"
      impact: v.string(),                        // "Conservative volume increases (7% vs 10%)"
      dataSource: v.string(),                    // "user_reported" | "inferred" | "wearable"
    })),
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // LEGACY PLAN STRUCTURE (Still needed for generator logic)
  // ═══════════════════════════════════════════════════════════════════════════
  templateId: v.optional(v.string()),            // Base template used
  periodizationModel: v.string(),                // "linear" | "block" | "polarized" | "pyramidal"

  phases: v.array(v.object({
    name: v.string(),                            // "Base", "Build", "Peak", "Taper"
    startWeek: v.number(),
    endWeek: v.number(),
    focus: v.string(),                           // "aerobic_base" | "threshold" | "speed" | "race_prep"
    weeklyVolumeTarget: v.number(),              // Km
    intensityDistribution: v.object({
      easy: v.number(),                          // Percentage
      moderate: v.number(),
      hard: v.number(),
    }),
    // Phase-level justification
    phaseJustification: v.string(),              // Why this phase matters in the plan
    // Example for Build phase: "Now that you've established your aerobic base,
    //          we introduce threshold work to raise your lactate ceiling. This
    //          is where half marathon pace starts to feel more sustainable."
  })),

  // ═══════════════════════════════════════════════════════════════════════════
  // LOAD PARAMETERS (From plan generator)
  // ═══════════════════════════════════════════════════════════════════════════
  loadParameters: v.object({
    baseVolume: v.number(),
    peakVolume: v.number(),
    weeklyIncreasePercent: v.number(),
    maxLongRunPercent: v.number(),               // % of weekly volume
    recoveryWeekFrequency: v.number(),           // Every N weeks
    recoveryWeekReduction: v.number(),           // % reduction
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // PACES (Calculated for this plan)
  // ═══════════════════════════════════════════════════════════════════════════
  targetPaces: v.object({
    recovery: v.string(),
    easy: v.string(),
    marathon: v.string(),
    threshold: v.string(),
    interval: v.string(),
    repetition: v.string(),
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // DECISION AUDIT (Why this plan?)
  // ═══════════════════════════════════════════════════════════════════════════
  decisions: v.array(v.object({
    decisionType: v.string(),                    // "periodization" | "volume" | "intensity" | "session_placement"
    what: v.string(),                            // "Peak volume set to 55km/week"
    source: v.string(),                          // "template" | "formula" | "modifier" | "coach_rule"
    reasoning: v.string(),                       // Human-readable explanation
    confidence: v.optional(v.number()),          // 0-1 for inferred decisions
    relatedRule: v.optional(v.string()),         // Reference to knowledge base
  })),

  // ═══════════════════════════════════════════════════════════════════════════
  // SAFEGUARD CHECKS (What limits were applied?)
  // ═══════════════════════════════════════════════════════════════════════════
  safeguardApplications: v.array(v.object({
    safeguardId: v.string(),
    applied: v.boolean(),
    originalValue: v.optional(v.any()),
    adjustedValue: v.optional(v.any()),
    reason: v.string(),
  })),

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════════════
  generatedAt: v.number(),
  generatorVersion: v.string(),
  lastModifiedAt: v.number(),
  modificationHistory: v.optional(v.array(v.object({
    timestamp: v.number(),
    changeType: v.string(),
    description: v.string(),
  }))),
})
.index("by_runnerId", ["runnerId"])
.index("by_status", ["runnerId", "status"])
```

### Multi-Level Zoom Explained

The plan object now supports three zoom levels, each with its own justification:

| Zoom Level | What It Shows | Justification Level | UI Component |
|------------|---------------|---------------------|--------------|
| **Season** | 12-week big picture | "Why this overall approach?" | RadarChart, overall plan view |
| **Weekly** | Week-by-week structure | "Why this week looks this way?" | ProgressionChart, weekly breakdown |
| **Daily** | Individual sessions | "Why this session today?" | CalendarWidget, session cards |

**Example Justifications at Each Level:**

```typescript
// SEASON LEVEL (seasonView.coachSummary)
"This 12-week plan is designed for your half marathon goal with a conservative
approach given your shin splint history. We're using polarized training - mostly
easy running with targeted hard sessions - because research shows this works
well for runners returning from injury. Your peak week will be week 9 at 50km,
with a proper 3-week taper."

// WEEKLY LEVEL (weeklyPlan[6].weekJustification)
"Week 7 is where we introduce your first real threshold session. You've built
4 weeks of consistent easy running, and your training logs show no shin issues.
The 20-minute tempo on Tuesday is a controlled test - if it goes well, we'll
progress to longer efforts next week."

// DAILY LEVEL (plannedSessions.justification)
"Tuesday tempo sets the tone for the week. You're fresh from the weekend,
mentally sharp. The effort is high but controlled - we're teaching your body
to clear lactate at half marathon pace. Don't chase the pace; let the effort
guide you."
```

### Table: `plannedSessions`

Individual sessions within a plan. Schema informed by CalendarWidget UI requirements.

**UI Requirements (from CalendarWidget.tsx):**
```typescript
// The UI needs these fields for each session card:
interface SessionData {
  type: "Tempo" | "Easy" | "Intervals" | "Long Run" | "Rest";
  dur: string;           // "50 min" - human-readable duration
  effort: string;        // "7/10" - effort level display
  key: boolean;          // Is this a key session?
  pace?: string;         // "4:55–5:05/km" - target pace range
  desc?: string;         // What is this session about
  structure?: string;    // "10 min warm-up → 30 min tempo → 10 min cool-down"
  why?: string;          // WHY this session is here (justification)
}
```

**Schema designed to support this UI:**

```typescript
// packages/backend/convex/schema/plannedSessions.ts

plannedSessions: defineTable({
  planId: v.id("trainingPlans"),
  runnerId: v.id("runners"),

  // ═══════════════════════════════════════════════════════════════════════════
  // SCHEDULE
  // ═══════════════════════════════════════════════════════════════════════════
  weekNumber: v.number(),                        // Week 1, 2, 3...
  dayOfWeek: v.string(),                         // "monday", "tuesday", etc.
  dayOfWeekShort: v.string(),                    // "Mon", "Tue", etc. (for UI)
  scheduledDate: v.number(),                     // Unix timestamp

  // ═══════════════════════════════════════════════════════════════════════════
  // SESSION TYPE & CLASSIFICATION (UI: type, key)
  // ═══════════════════════════════════════════════════════════════════════════
  sessionType: v.string(),                       // "tempo" | "easy" | "intervals" | "long_run" | "rest" | "recovery" | "race"
  sessionTypeDisplay: v.string(),                // "Tempo" | "Easy" | "Intervals" | "Long Run" | "Rest" (for UI)
  sessionSubtype: v.optional(v.string()),        // "progression" | "fartlek" | "hills" | "track"
  isKeySession: v.boolean(),                     // true for quality sessions (UI: key)
  isRestDay: v.boolean(),                        // true for rest days

  // ═══════════════════════════════════════════════════════════════════════════
  // DURATION & EFFORT (UI: dur, effort)
  // ═══════════════════════════════════════════════════════════════════════════
  targetDurationSeconds: v.optional(v.number()), // Stored as seconds for calculations
  targetDurationDisplay: v.string(),             // "50 min" | "90 min" | "—" (for UI)
  targetDistanceMeters: v.optional(v.number()),  // Alternative to duration
  effortLevel: v.optional(v.number()),           // 0-10 numeric
  effortDisplay: v.string(),                     // "7/10" | "3/10" | "0/10" (for UI)

  // ═══════════════════════════════════════════════════════════════════════════
  // PACE TARGETS (UI: pace)
  // ═══════════════════════════════════════════════════════════════════════════
  targetPaceMin: v.optional(v.string()),         // "4:55/km" - faster end of range
  targetPaceMax: v.optional(v.string()),         // "5:05/km" - slower end of range
  targetPaceDisplay: v.optional(v.string()),     // "4:55–5:05/km" (for UI)
  targetHeartRateZone: v.optional(v.number()),   // 1-5
  targetHeartRateMin: v.optional(v.number()),    // BPM
  targetHeartRateMax: v.optional(v.number()),    // BPM

  // ═══════════════════════════════════════════════════════════════════════════
  // DESCRIPTION (UI: desc)
  // ═══════════════════════════════════════════════════════════════════════════
  description: v.string(),                       // Full description of what this session is
  // Example: "Sustained effort at comfortably hard pace. This builds your lactate
  //          threshold — the pace you can hold without accumulating fatigue."

  // ═══════════════════════════════════════════════════════════════════════════
  // STRUCTURE (UI: structure)
  // ═══════════════════════════════════════════════════════════════════════════
  structureDisplay: v.optional(v.string()),      // "10 min warm-up → 30 min tempo → 10 min cool-down" (for UI)

  // Detailed structure (for calculations and validation)
  structureSegments: v.optional(v.array(v.object({
    segmentType: v.string(),                     // "warmup" | "main" | "cooldown" | "recovery" | "work"
    durationSeconds: v.optional(v.number()),
    distanceMeters: v.optional(v.number()),
    targetPace: v.optional(v.string()),
    targetHeartRate: v.optional(v.number()),
    targetEffort: v.optional(v.number()),        // 1-10
    repetitions: v.optional(v.number()),         // For intervals: 6 x 800m
    recoverySeconds: v.optional(v.number()),     // Recovery between reps
    notes: v.optional(v.string()),
  }))),

  // ═══════════════════════════════════════════════════════════════════════════
  // JUSTIFICATION - THE "WHY" (UI: why) - CRITICAL FOR TRUST
  // ═══════════════════════════════════════════════════════════════════════════
  justification: v.string(),                     // WHY this session is placed here
  // Example: "Monday tempo sets the tone for the week. You're fresh from the weekend,
  //          mentally sharp. The effort is high but controlled."

  // Additional reasoning context
  physiologicalTarget: v.string(),               // "aerobic_base" | "lactate_threshold" | "vo2max" | "economy" | "recovery"
  placementRationale: v.optional(v.string()),    // Why THIS day specifically
  keyPoints: v.optional(v.array(v.string())),    // What to focus on during the session

  // Decision audit (links to knowledge base / safeguards)
  relatedKnowledgeIds: v.optional(v.array(v.string())), // Which KB entries informed this
  relatedSafeguardIds: v.optional(v.array(v.string())), // Which safeguards were checked

  // ═══════════════════════════════════════════════════════════════════════════
  // FLEXIBILITY & ALTERNATIVES
  // ═══════════════════════════════════════════════════════════════════════════
  isMoveable: v.boolean(),                       // Can be rescheduled within the week
  canBeSplit: v.optional(v.boolean()),           // Can be split into two sessions
  alternatives: v.optional(v.array(v.object({
    sessionType: v.string(),
    description: v.string(),
    whenToUse: v.string(),                       // "If legs are heavy" | "If short on time"
  }))),

  // ═══════════════════════════════════════════════════════════════════════════
  // EXECUTION TRACKING (Post-run)
  // ═══════════════════════════════════════════════════════════════════════════
  status: v.string(),                            // "scheduled" | "completed" | "skipped" | "modified" | "rescheduled"
  completedActivityId: v.optional(v.id("activities")),
  completedAt: v.optional(v.number()),
  adherenceScore: v.optional(v.number()),        // 0-1 how well did execution match plan

  // If modified or skipped
  skipReason: v.optional(v.string()),
  modificationNotes: v.optional(v.string()),
  actualDurationSeconds: v.optional(v.number()),
  actualDistanceMeters: v.optional(v.number()),
  userFeedback: v.optional(v.string()),          // How did it feel?
  userRating: v.optional(v.number()),            // 1-5 satisfaction

  // ═══════════════════════════════════════════════════════════════════════════
  // UI STYLING (Computed, but stored for efficiency)
  // ═══════════════════════════════════════════════════════════════════════════
  colorTheme: v.optional(v.string()),            // "lime" | "gray" - for UI styling
})
.index("by_planId", ["planId"])
.index("by_runnerId", ["runnerId"])
.index("by_date", ["runnerId", "scheduledDate"])
.index("by_week", ["planId", "weekNumber"])
.index("by_status", ["runnerId", "status"])
```

---

## Knowledge Base (Tier 5)

The knowledge base contains training science that grounds the AI's recommendations.

### Table: `knowledgeBase`

```typescript
// packages/backend/convex/schema/knowledgeBase.ts

knowledgeBase: defineTable({
  // ═══════════════════════════════════════════════════════════════════════════
  // CATEGORIZATION
  // ═══════════════════════════════════════════════════════════════════════════
  category: v.string(),                          // "physiology" | "training_principles" | "periodization" | "recovery" | "injury_prevention" | "nutrition" | "mental"
  subcategory: v.optional(v.string()),
  tags: v.array(v.string()),

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTENT
  // ═══════════════════════════════════════════════════════════════════════════
  title: v.string(),
  content: v.string(),                           // The actual knowledge
  summary: v.string(),                           // One-line summary for context

  // ═══════════════════════════════════════════════════════════════════════════
  // APPLICABILITY
  // ═══════════════════════════════════════════════════════════════════════════
  applicableGoals: v.optional(v.array(v.string())),       // ["race", "base_building"]
  applicableExperience: v.optional(v.array(v.string())),  // ["beginner", "intermediate"]
  applicablePhases: v.optional(v.array(v.string())),      // ["base", "build", "peak"]

  // ═══════════════════════════════════════════════════════════════════════════
  // SOURCE & VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════
  source: v.string(),                            // "daniels_running_formula" | "pfitzinger" | "coach_interview" | "research_paper"
  sourceReference: v.optional(v.string()),       // Citation or page number
  validatedBy: v.optional(v.array(v.string())),  // Coach names who validated
  validatedAt: v.optional(v.number()),
  confidence: v.string(),                        // "established" | "well_supported" | "emerging" | "experimental"

  // ═══════════════════════════════════════════════════════════════════════════
  // USAGE
  // ═══════════════════════════════════════════════════════════════════════════
  usageContext: v.string(),                      // "plan_generation" | "coaching_advice" | "explanation" | "safety"
  isActive: v.boolean(),

  // ═══════════════════════════════════════════════════════════════════════════
  // EMBEDDING (For RAG)
  // ═══════════════════════════════════════════════════════════════════════════
  embedding: v.optional(v.array(v.float64())),   // Vector embedding for semantic search
  embeddingModel: v.optional(v.string()),

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════════════
  createdAt: v.number(),
  updatedAt: v.number(),
  version: v.number(),
})
.index("by_category", ["category"])
.index("by_usage", ["usageContext", "isActive"])
```

### Example Knowledge Base Entries

```typescript
// Seed data examples

const KNOWLEDGE_BASE_SEEDS = [
  {
    category: "training_principles",
    subcategory: "progression",
    title: "10% Rule for Volume Increase",
    content: "Weekly training volume should not increase by more than 10% week-over-week to minimize injury risk. This applies to both distance and duration. For runners with injury history, consider 5-7% increases.",
    summary: "Limit weekly volume increase to 10%",
    source: "established_practice",
    confidence: "established",
    usageContext: "plan_generation",
    tags: ["volume", "progression", "injury_prevention"],
  },
  {
    category: "physiology",
    subcategory: "heart_rate_zones",
    title: "Easy Running Heart Rate",
    content: "Easy/aerobic running should be performed at 65-75% of maximum heart rate, or at a conversational pace where you can speak in full sentences. This intensity builds aerobic base without excessive fatigue.",
    summary: "Easy running: 65-75% max HR, conversational",
    source: "daniels_running_formula",
    confidence: "established",
    usageContext: "coaching_advice",
    tags: ["heart_rate", "easy_running", "aerobic"],
  },
  {
    category: "injury_prevention",
    subcategory: "shin_splints",
    title: "Managing Shin Splint History",
    content: "Runners with a history of shin splints should: 1) Limit volume increases to 5-7% per week, 2) Avoid consecutive high-impact days, 3) Include regular calf strengthening, 4) Monitor for early warning signs (mild shin discomfort). Consider reducing hill work in early plan phases.",
    summary: "Shin splint history: 5-7% increases, no consecutive hard days",
    source: "coach_interview",
    validatedBy: ["Coach_Maria", "Coach_James"],
    confidence: "well_supported",
    usageContext: "plan_generation",
    tags: ["injury", "shin_splints", "volume", "modification"],
  },
];
```

---

## Safeguards System

Safeguards are hard and soft limits that the plan generator MUST respect.

### Table: `safeguards`

```typescript
// packages/backend/convex/schema/safeguards.ts

safeguards: defineTable({
  // ═══════════════════════════════════════════════════════════════════════════
  // IDENTIFICATION
  // ═══════════════════════════════════════════════════════════════════════════
  name: v.string(),                              // "max_volume_increase"
  description: v.string(),
  category: v.string(),                          // "volume" | "intensity" | "frequency" | "recovery" | "safety"

  // ═══════════════════════════════════════════════════════════════════════════
  // RULE DEFINITION
  // ═══════════════════════════════════════════════════════════════════════════
  ruleType: v.string(),                          // "hard_limit" | "soft_limit" | "warning"

  // The condition that triggers this safeguard
  condition: v.object({
    field: v.string(),                           // "weeklyVolumeIncrease" | "consecutiveHardDays" | etc.
    operator: v.string(),                        // ">" | "<" | ">=" | "<=" | "==" | "contains"
    threshold: v.any(),                          // The limit value

    // Optional: Only apply to certain runner profiles
    applicableWhen: v.optional(v.object({
      experienceLevel: v.optional(v.array(v.string())),
      hasInjuryHistory: v.optional(v.boolean()),
      injuryTypes: v.optional(v.array(v.string())),
      age: v.optional(v.object({ operator: v.string(), value: v.number() })),
    })),
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // ACTION
  // ═══════════════════════════════════════════════════════════════════════════
  action: v.object({
    type: v.string(),                            // "cap" | "reduce" | "block" | "warn" | "require_confirmation"
    adjustment: v.optional(v.any()),             // How to adjust if action is "cap" or "reduce"
    message: v.string(),                         // Message to show/log
    severity: v.string(),                        // "info" | "warning" | "critical"
  }),

  // ═══════════════════════════════════════════════════════════════════════════
  // SOURCE & VALIDATION
  // ═══════════════════════════════════════════════════════════════════════════
  source: v.string(),
  rationale: v.string(),                         // Why this safeguard exists
  isActive: v.boolean(),
  priority: v.number(),                          // Lower = higher priority (checked first)

  // ═══════════════════════════════════════════════════════════════════════════
  // METADATA
  // ═══════════════════════════════════════════════════════════════════════════
  createdAt: v.number(),
  updatedAt: v.number(),
})
.index("by_category", ["category", "isActive"])
.index("by_priority", ["isActive", "priority"])
```

### Example Safeguards

```typescript
const SAFEGUARDS_SEEDS = [
  {
    name: "max_volume_increase_10_percent",
    description: "Weekly volume cannot increase more than 10% from previous week",
    category: "volume",
    ruleType: "hard_limit",
    condition: {
      field: "weeklyVolumeIncrease",
      operator: ">",
      threshold: 0.10,
    },
    action: {
      type: "cap",
      adjustment: 0.10,
      message: "Volume increase capped at 10% to prevent overuse injury",
      severity: "warning",
    },
    source: "established_practice",
    rationale: "Rapid volume increases are the #1 cause of running injuries",
    isActive: true,
    priority: 1,
  },
  {
    name: "max_volume_increase_injury_history",
    description: "Runners with injury history: max 7% weekly increase",
    category: "volume",
    ruleType: "hard_limit",
    condition: {
      field: "weeklyVolumeIncrease",
      operator: ">",
      threshold: 0.07,
      applicableWhen: {
        hasInjuryHistory: true,
      },
    },
    action: {
      type: "cap",
      adjustment: 0.07,
      message: "Volume increase capped at 7% due to injury history",
      severity: "warning",
    },
    source: "coach_consensus",
    rationale: "Injury-prone runners need more conservative progression",
    isActive: true,
    priority: 0, // Higher priority than general rule
  },
  {
    name: "no_consecutive_hard_days",
    description: "Cannot schedule hard sessions on consecutive days",
    category: "intensity",
    ruleType: "hard_limit",
    condition: {
      field: "consecutiveHardDays",
      operator: ">",
      threshold: 1,
    },
    action: {
      type: "block",
      message: "Hard sessions must have at least one easy/rest day between them",
      severity: "critical",
    },
    source: "physiology",
    rationale: "Recovery is when adaptation occurs; consecutive hard days prevent recovery",
    isActive: true,
    priority: 1,
  },
  {
    name: "long_run_max_percentage",
    description: "Long run should not exceed 30% of weekly volume",
    category: "volume",
    ruleType: "soft_limit",
    condition: {
      field: "longRunPercentage",
      operator: ">",
      threshold: 0.30,
    },
    action: {
      type: "warn",
      message: "Long run exceeds 30% of weekly volume - consider redistributing",
      severity: "info",
    },
    source: "daniels_running_formula",
    rationale: "Excessive long run volume increases injury risk without proportional benefit",
    isActive: true,
    priority: 5,
  },
  {
    name: "minimum_rest_days",
    description: "Must have at least 1 rest day per week",
    category: "recovery",
    ruleType: "hard_limit",
    condition: {
      field: "restDaysPerWeek",
      operator: "<",
      threshold: 1,
    },
    action: {
      type: "require_confirmation",
      message: "Plan has no rest days this week - are you sure?",
      severity: "warning",
    },
    source: "established_practice",
    rationale: "Even elite athletes need recovery time",
    isActive: true,
    priority: 2,
  },
  {
    name: "age_50_plus_recovery",
    description: "Runners 50+ need additional recovery time",
    category: "recovery",
    ruleType: "soft_limit",
    condition: {
      field: "hardSessionsPerWeek",
      operator: ">",
      threshold: 2,
      applicableWhen: {
        age: { operator: ">=", value: 50 },
      },
    },
    action: {
      type: "warn",
      message: "Consider limiting hard sessions to 2/week for age-appropriate recovery",
      severity: "info",
    },
    source: "coach_consensus",
    rationale: "Recovery capacity decreases with age",
    isActive: true,
    priority: 3,
  },
];
```

---

## Data Flow & Relationships

> **Source Precedence**: When multiple sources provide conflicting data for the same field,
> the system uses precedence rules to resolve conflicts. Priority order (default):
> `manual > primary_wearable > strava = healthkit > inferred`
>
> Field-specific rules apply (e.g., HR prefers optical sensor device, distance prefers GPS).
> See `runner.connections.sourcePrecedence` for user customization.

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DATA FLOW & RELATIONSHIPS                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   DATA SOURCES                           HISTORICAL TABLES                       │
│   ────────────                           ────────────────                        │
│                                                                                  │
│   IMPORTANT: Each source may write to ANY/ALL historical tables.                 │
│   The adapter layer routes data to the appropriate table(s).                     │
│                                                                                  │
│                                         ┌────────────────┐                       │
│                              ┌─────────▶│  activities    │                       │
│   ┌──────────┐               │          └────────────────┘                       │
│   │  STRAVA  │───adapter─────┤                                                   │
│   └──────────┘               │          ┌────────────────┐                       │
│                              └─────────▶│dailySummaries  │                       │
│                                         └────────────────┘                       │
│                                                                                  │
│                                         ┌────────────────┐                       │
│                              ┌─────────▶│  activities    │                       │
│   ┌──────────┐               │          └────────────────┘                       │
│   │HEALTHKIT │───adapter─────┼─────────▶│ sleepSessions  │                       │
│   └──────────┘               │          └────────────────┘                       │
│                              │          ┌────────────────┐                       │
│                              ├─────────▶│dailySummaries  │                       │
│                              │          └────────────────┘                       │
│                              │          ┌────────────────┐                       │
│                              └─────────▶│bodyMeasurements│                       │
│                                         └────────────────┘                       │
│                                                                                  │
│   ┌──────────┐                          ┌────────────────┐                       │
│   │  GARMIN  │───adapter────┬──────────▶│  activities    │                       │
│   └──────────┘              │           ├────────────────┤                       │
│                             ├──────────▶│ sleepSessions  │                       │
│                             │           ├────────────────┤                       │
│                             ├──────────▶│dailySummaries  │                       │
│                             │           ├────────────────┤                       │
│                             └──────────▶│bodyMeasurements│                       │
│                                         └────────────────┘                       │
│                                                                                  │
│   ┌──────────┐              (same pattern for all sources)                       │
│   │  COROS   │───adapter────────────────▶ ALL TABLES                             │
│   └──────────┘                                                                   │
│                                                                                  │
│   ┌──────────┐                                                                   │
│   │  TERRA   │───adapter────────────────▶ ALL TABLES                             │
│   └──────────┘ (future)                                                          │
│                                                                                  │
│   ═══════════════════════════════════════════════════════════════════════════    │
│   TWO DATA INPUT PATHS (see architecture-backend-v2.md for full details)         │
│   ═══════════════════════════════════════════════════════════════════════════    │
│                                                                                  │
│   PATH 1: USER INPUT (Onboarding Conversation)                                   │
│   ─────────────────────────────────────────────                                  │
│                                                                                  │
│   ┌──────────┐                                ┌────────────────┐                 │
│   │  USER    │                                │    RUNNER      │                 │
│   │  INPUT   │────────── DIRECT ─────────────▶│    OBJECT      │                 │
│   └──────────┘       (Tool Handler)           │                │                 │
│                                               │ identity, goals│                 │
│   User-provided values are FACTS,             │ schedule, etc. │                 │
│   NOT calculations. They bypass               │ updated direct │                 │
│   the Inference Engine entirely.              └────────────────┘                 │
│                                                                                  │
│   PATH 2: WEARABLE DATA                                                          │
│   ─────────────────────                                                          │
│                                                                                  │
│   Historical    Source          Inference     Runner Object                      │
│    Tables ────▶ Precedence ───▶ Engine ─────▶ (currentState only)                │
│                                      │                                           │
│                       ┌──────────────┴───────────────┐                           │
│                       │   INFERENCE ENGINE            │                           │
│                       │                               │                           │
│                       │   ONLY updates currentState:  │                           │
│                       │   - acuteTrainingLoad (ATL)   │                           │
│                       │   - chronicTrainingLoad (CTL) │                           │
│                       │   - trainingStressBalance     │                           │
│                       │   - readinessScore            │                           │
│                       │   - injuryRiskLevel           │                           │
│                       │   - last7DaysVolume           │                           │
│                       │   - latestRestingHr/HRV       │                           │
│                       └──────────────┬───────────────┘                           │
│                                      │                                           │
│                                      ▼                                           │
│                               ┌────────────────┐                                 │
│                               │    RUNNER      │◀─── User preferences (PATH 1)   │
│                               │    OBJECT      │◀─── Goals (PATH 1)              │
│                               │                │◀─── Schedule (PATH 1)           │
│                               │ currentState   │◀─── Health history (PATH 1)     │
│                               │ from PATH 2    │                                 │
│                               └───────┬────────┘                                 │
│                                               │                                  │
│              ┌────────────────────────────────┼────────────────────────────────┐ │
│              │                                │                                │ │
│              ▼                                ▼                                ▼ │
│   ┌────────────────┐               ┌────────────────┐               ┌──────────┐│
│   │  AI CONTEXT    │               │ PLAN GENERATOR │               │SAFEGUARDS││
│   │   ASSEMBLY     │               │                │◀──────────────│  CHECK   ││
│   │                │               │ Uses:          │               │          ││
│   │ Builds prompt  │               │ - Runner       │               │ Validates││
│   │ for coach AI   │               │ - Knowledge    │               │ all      ││
│   │                │               │ - Safeguards   │               │ decisions││
│   └────────────────┘               └───────┬────────┘               └──────────┘│
│                                            │                                    │
│                                            ▼                                    │
│                               ┌─────────────────────────┐                       │
│                               │    TRAINING PLAN        │                       │
│                               │                         │                       │
│                               │ - Phases                │                       │
│                               │ - Weekly structure      │                       │
│                               │ - Decision audit trail  │                       │
│                               │ - Safeguard log         │                       │
│                               └────────────┬────────────┘                       │
│                                            │                                    │
│                                            ▼                                    │
│                               ┌─────────────────────────┐                       │
│                               │   PLANNED SESSIONS      │                       │
│                               │                         │                       │
│                               │ - Daily workouts        │                       │
│                               │ - Justifications        │                       │
│                               │ - Execution tracking    │                       │
│                               └─────────────────────────┘                       │
│                                                                                  │
│   KNOWLEDGE BASE                                                                 │
│   ──────────────                                                                 │
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                                                                         │   │
│   │  Training Science    Periodization    Recovery    Injury Prevention    │   │
│   │  ─────────────────   ─────────────    ────────    ─────────────────    │   │
│   │  • 10% rule          • Base phase     • Sleep     • Shin splints       │   │
│   │  • HR zones          • Build phase    • Stress    • IT band            │   │
│   │  • Easy running      • Peak phase     • Nutrition • Plantar fasciitis  │   │
│   │  • Long run %        • Taper          • Rest days • Achilles           │   │
│   │                                                                         │   │
│   │  Used by: Plan Generator, AI Coach (RAG), Safeguard explanations       │   │
│   │                                                                         │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Summary: What's Different From v1

| Aspect | v1 (Previous) | v2 (This Document) |
|--------|---------------|---------------------|
| Schema Philosophy | MVP-focused, add fields later | Exhaustive from day one, fill later |
| Historical Data | Single `activities` table | Full set: activities, sleep, daily, body |
| Terra Alignment | Partial | Complete field mapping |
| Runner Object | Inferred section | Full `currentState` + detailed sections |
| Training Plans | Mentioned | Full schema with multi-level zoom |
| Plan Zoom Levels | N/A | Season → Weekly → Daily with justifications |
| Plan Visualization | N/A | RadarChart snapshot, ProgressionChart data |
| Knowledge Base | "Future" | Complete Tier 5 schema with examples |
| Safeguards | Not defined | Full system with hard/soft limits |
| Data Sources | Specific (Strava, HealthKit) | Adapter pattern, source-agnostic |

---

## Next Steps

1. **Review this data model** — Is it exhaustive enough?
2. **Implement schema changes** — Update Convex schema.ts
3. **Seed knowledge base** — Add initial training science
4. **Seed safeguards** — Add core safety rules
5. **Build inference engine** — Calculate currentState from historical data
6. **Build plan generator** — Use Runner + Knowledge + Safeguards

---

*Document Version: 2026-02-16-v3*
*Status: Draft for Review*

**Changelog:**
- v3 (2026-02-16):
  - Added Convex Components note: Historical tables are reusable components with 1-1 Terra mapping
  - Added clarification: Each source can write to ALL historical tables
  - Added `runner.connections.sourcePrecedence` field for conflict resolution configuration
  - Updated Data Flow diagram to show TWO data paths:
    - PATH 1: User Input → Direct to Runner Object (bypasses Inference Engine)
    - PATH 2: Wearable Data → Historical Tables → Inference Engine → Runner Object (currentState only)
  - Added Source Precedence callout box with default priority order
  - Aligned with architecture-backend-v2.md updates
- v2 (2026-02-16): Added multi-level zoom (Season/Weekly/Daily) to trainingPlans, RadarChart snapshot, ProgressionChart data structure
