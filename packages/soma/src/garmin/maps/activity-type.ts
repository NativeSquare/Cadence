// ─── Garmin ActivityType → Terra ActivityType ─────────────────────────────────
// Maps Garmin activity type strings to Terra's ActivityType numeric enum
// used by the Soma schema.
//
// Garmin values: Garmin Health API activity type strings
// Terra values:  https://docs.tryterra.co/reference/health-and-fitness-api/data-models#activitytype

// Garmin activityType is a free-form string in the spec

const activityTypeMap: Record<string, number> = {
  // ── Running ─────────────────────────────────────────────────────────────
  // Terra Running = 8
  RUNNING: 8,
  INDOOR_RUNNING: 8,
  TRAIL_RUNNING: 8,
  TREADMILL_RUNNING: 8,

  // ── Cycling ─────────────────────────────────────────────────────────────
  // Terra Biking = 1
  CYCLING: 1,
  INDOOR_CYCLING: 1,
  MOUNTAIN_BIKING: 1,
  GRAVEL_CYCLING: 1,
  VIRTUAL_RIDE: 1,

  // ── Walking ─────────────────────────────────────────────────────────────
  // Terra Walking = 7
  WALKING: 7,

  // ── Hiking ──────────────────────────────────────────────────────────────
  // Terra Hiking = 35
  HIKING: 35,

  // ── Swimming ────────────────────────────────────────────────────────────
  // Terra Swimming = 82
  SWIMMING: 82,
  OPEN_WATER_SWIMMING: 82,
  LAP_SWIMMING: 82,
  POOL_SWIMMING: 82,

  // ── Gym / Fitness ───────────────────────────────────────────────────────
  STRENGTH_TRAINING: 80,  // Terra Strength Training
  YOGA: 100,              // Terra Yoga
  PILATES: 49,            // Terra Pilates
  CARDIO: 108,            // Terra Other
  ELLIPTICAL: 25,         // Terra Elliptical
  STAIR_CLIMBING: 78,     // Terra Stair Climbing Machine
  CROSSFIT: 113,          // Terra Crossfit
  HIIT: 114,              // Terra HIIT
  FITNESS_EQUIPMENT: 108, // Terra Other
  BREATHWORK: 108,        // Terra Other

  // ── Snow Sports ─────────────────────────────────────────────────────────
  CROSS_COUNTRY_SKIING: 67, // Terra Cross Country Skiing
  ALPINE_SKIING: 66,        // Terra Alpine Skiing
  SNOWBOARDING: 73,         // Terra Snowboarding
  SNOWSHOEING: 74,          // Terra Snowshoeing

  // ── Water Sports ────────────────────────────────────────────────────────
  ROWING: 53,           // Terra Rowing
  INDOOR_ROWING: 53,    // Terra Rowing
  KAYAKING: 40,         // Terra Kayaking
  CANOEING: 22,         // Terra Canoeing
  SAILING: 59,          // Terra Sailing
  SURFING: 81,          // Terra Surfing
  KITESURFING: 41,      // Terra Kitesurfing
  WINDSURFING: 99,      // Terra Windsurfing
  PADDLEBOARDING: 129,  // Terra Paddling

  // ── Skating ─────────────────────────────────────────────────────────────
  SKATING: 62,        // Terra Skating
  INLINE_SKATING: 62, // Terra Skating

  // ── Racket Sports ───────────────────────────────────────────────────────
  TENNIS: 87,       // Terra Tennis
  TABLE_TENNIS: 85, // Terra Table Tennis
  BADMINTON: 10,    // Terra Badminton
  RACQUETBALL: 51,  // Terra Racquetball
  SQUASH: 76,       // Terra Squash

  // ── Climbing ────────────────────────────────────────────────────────────
  ROCK_CLIMBING: 52, // Terra Rock Climbing
  BOULDERING: 52,    // Terra Rock Climbing

  // ── Team Sports ─────────────────────────────────────────────────────────
  SOCCER: 29,       // Terra English Football
  BASKETBALL: 11,   // Terra Basketball
  VOLLEYBALL: 94,   // Terra Volleyball
  CRICKET: 23,      // Terra Cricket
  RUGBY: 57,        // Terra Rugby

  // ── Combat Sports ───────────────────────────────────────────────────────
  BOXING: 16,        // Terra Boxing
  MARTIAL_ARTS: 44,  // Terra Martial Arts

  // ── Golf ────────────────────────────────────────────────────────────────
  GOLF: 32, // Terra Golf

  // ── Accessibility ───────────────────────────────────────────────────────
  HANDCYCLING: 14,            // Terra Handbiking
  WHEELCHAIR_PUSH_WALKING: 98, // Terra Wheelchair
  WHEELCHAIR_PUSH_RUNNING: 98, // Terra Wheelchair

  // ── Other ───────────────────────────────────────────────────────────────
  OTHER: 108,        // Terra Other
  MULTI_SPORT: 108,  // Terra Other
  FLOOR_CLIMBING: 78, // Terra Stair Climbing Machine
};

/**
 * Map a Garmin activity type string to the Terra ActivityType enum.
 * Returns Terra "Other" (108) for unknown types.
 */
export function mapActivityType(activityType: string): number {
  return activityTypeMap[activityType] ?? 108;
}
