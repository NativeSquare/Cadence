// ─── Strava SportType → Terra ActivityType ───────────────────────────────────
// Maps Strava sport_type strings to Terra's ActivityType numeric enum
// used by the Soma schema.
//
// Strava values: https://developers.strava.com/docs/reference/#api-models-SportType
// Terra values:  https://docs.tryterra.co/reference/health-and-fitness-api/data-models#activitytype

import type { StravaSportType } from "../types.js";

const sportTypeMap: Record<string, number> = {
  // ── Cycling ────────────────────────────────────────────────────────────────
  // Terra Biking = 1
  Ride: 1,
  MountainBikeRide: 1,
  GravelRide: 1,
  EBikeRide: 1,
  EMountainBikeRide: 1,
  VirtualRide: 1,
  Velomobile: 1,

  // ── Running ────────────────────────────────────────────────────────────────
  // Terra Running = 8
  Run: 8,
  TrailRun: 8,
  VirtualRun: 8,

  // ── Walking ────────────────────────────────────────────────────────────────
  // Terra Walking = 7
  Walk: 7,

  // ── Swimming ───────────────────────────────────────────────────────────────
  // Terra Swimming = 82
  Swim: 82,

  // ── Hiking ─────────────────────────────────────────────────────────────────
  // Terra Hiking = 35
  Hike: 35,

  // ── Snow Sports ────────────────────────────────────────────────────────────
  AlpineSki: 66,          // Terra Alpine Skiing
  BackcountrySki: 66,     // Terra Alpine Skiing
  NordicSki: 67,          // Terra Cross Country Skiing
  Snowboard: 73,          // Terra Snowboarding
  Snowshoe: 74,           // Terra Snowshoeing

  // ── Water Sports ───────────────────────────────────────────────────────────
  Rowing: 53,             // Terra Rowing
  VirtualRow: 53,         // Terra Rowing
  Kayaking: 40,           // Terra Kayaking
  Canoeing: 22,           // Terra Canoeing
  Sail: 59,               // Terra Sailing
  Surfing: 81,            // Terra Surfing
  Kitesurf: 41,           // Terra Kitesurfing
  Windsurf: 99,           // Terra Windsurfing
  StandUpPaddling: 129,   // Terra Paddling

  // ── Skating ────────────────────────────────────────────────────────────────
  IceSkate: 62,           // Terra Skating
  InlineSkate: 62,        // Terra Skating
  Skateboard: 62,         // Terra Skating
  RollerSki: 62,          // Terra Skating

  // ── Racket Sports ──────────────────────────────────────────────────────────
  Tennis: 87,             // Terra Tennis
  TableTennis: 85,        // Terra Table Tennis
  Badminton: 10,          // Terra Badminton
  Racquetball: 51,        // Terra Racquetball
  Squash: 76,             // Terra Squash
  Pickleball: 108,        // Terra Other (no direct mapping)

  // ── Gym / Fitness ──────────────────────────────────────────────────────────
  WeightTraining: 80,     // Terra Strength Training
  Crossfit: 113,          // Terra Crossfit
  Elliptical: 25,         // Terra Elliptical
  StairStepper: 78,       // Terra Stair Climbing Machine
  Yoga: 100,              // Terra Yoga
  Pilates: 49,            // Terra Pilates
  HighIntensityIntervalTraining: 114, // Terra HIIT

  // ── Climbing ───────────────────────────────────────────────────────────────
  RockClimbing: 52,       // Terra Rock Climbing

  // ── Team Sports ────────────────────────────────────────────────────────────
  Soccer: 29,             // Terra English Football

  // ── Other ──────────────────────────────────────────────────────────────────
  Golf: 32,               // Terra Golf
  Handcycle: 14,          // Terra Handbiking
  Wheelchair: 98,         // Terra Wheelchair
  Workout: 108,           // Terra Other
};

/**
 * Map a Strava sport_type string to the Terra ActivityType enum.
 * Returns Terra "Other" (108) for unknown types.
 */
export function mapSportType(sportType: StravaSportType): number {
  return sportTypeMap[sportType] ?? 108;
}
