// ─── HKWorkoutActivityType → Terra ActivityType ──────────────────────────────
// Maps Apple HealthKit workout activity type raw values to Terra's ActivityType
// enum used by the Soma schema.
//
// HK values: https://developer.apple.com/documentation/healthkit/hkworkoutactivitytype
// Terra values: https://docs.tryterra.co/reference/health-and-fitness-api/data-models#activitytype

const activityTypeMap: Record<number, number> = {
  // HK AmericanFootball (1) → Terra American Football (27)
  1: 27,
  // HK Archery (2) → Terra Archery (119)
  2: 119,
  // HK AustralianFootball (3) → Terra Australian Football (28)
  3: 28,
  // HK Badminton (4) → Terra Badminton (10)
  4: 10,
  // HK Baseball (5) → Terra Baseball (11)
  5: 11,
  // HK Basketball (6) → Terra Basketball (12)
  6: 12,
  // HK Bowling (7) → Terra Other (108)
  7: 108,
  // HK Boxing (8) → Terra Boxing (20)
  8: 20,
  // HK Climbing (9) → Terra Rock Climbing (52)
  9: 52,
  // HK Cricket (10) → Terra Cricket (23)
  10: 23,
  // HK CrossTraining (11) → Terra Crossfit (113)
  11: 113,
  // HK Curling (12) → Terra Curling (106)
  12: 106,
  // HK Cycling (13) → Terra Biking (1)
  13: 1,
  // HK Dance (14) → Terra Dancing (24)
  14: 24,
  // HK DanceInspiredTraining (15) → Terra Dancing (24)
  15: 24,
  // HK Elliptical (16) → Terra Elliptical (25)
  16: 25,
  // HK EquestrianSports (17) → Terra Horseback Riding (37)
  17: 37,
  // HK Fencing (18) → Terra Fencing (26)
  18: 26,
  // HK Fishing (19) → Terra Fishing (131)
  19: 131,
  // HK FunctionalStrengthTraining (20) → Terra Strength Training (80)
  20: 80,
  // HK Golf (21) → Terra Golf (32)
  21: 32,
  // HK Gymnastics (22) → Terra Gymnastics (33)
  22: 33,
  // HK Handball (23) → Terra Handball (34)
  23: 34,
  // HK Hiking (24) → Terra Hiking (35)
  24: 35,
  // HK Hockey (25) → Terra Hockey (36)
  25: 36,
  // HK Hunting (26) → Terra Other (108)
  26: 108,
  // HK Lacrosse (27) → Terra Lacrosse (124)
  27: 124,
  // HK MartialArts (28) → Terra Martial Arts (44)
  28: 44,
  // HK MindAndBody (29) → Terra Meditation (45)
  29: 45,
  // HK MixedMetabolicCardioTraining (30) → Terra Cardio Training (123)
  30: 123,
  // HK PaddleSports (31) → Terra Paddling (129)
  31: 129,
  // HK Play (32) → Terra Other (108)
  32: 108,
  // HK PreparationAndRecovery (33) → Terra Stretching (125)
  33: 125,
  // HK Racquetball (34) → Terra Racquetball (51)
  34: 51,
  // HK Rowing (35) → Terra Rowing (53)
  35: 53,
  // HK Rugby (36) → Terra Rugby (55)
  36: 55,
  // HK Running (37) → Terra Running (8)
  37: 8,
  // HK Sailing (38) → Terra Sailing (59)
  38: 59,
  // HK SkatingSports (39) → Terra Skating (62)
  39: 62,
  // HK SnowSports (40) → Terra Skiing (65)
  40: 65,
  // HK Soccer (41) → Terra English Football (29)
  41: 29,
  // HK Softball (42) → Terra Softball (120)
  42: 120,
  // HK Squash (43) → Terra Squash (76)
  43: 76,
  // HK StairClimbing (44) → Terra Stair Climbing (77)
  44: 77,
  // HK SurfingSports (45) → Terra Surfing (81)
  45: 81,
  // HK Swimming (46) → Terra Swimming (82)
  46: 82,
  // HK TableTennis (47) → Terra Table Tennis (85)
  47: 85,
  // HK Tennis (48) → Terra Tennis (87)
  48: 87,
  // HK TrackAndField (49) → Terra Running (8)
  49: 8,
  // HK TraditionalStrengthTraining (50) → Terra Strength Training (80)
  50: 80,
  // HK Volleyball (51) → Terra Volleyball (89)
  51: 89,
  // HK Walking (52) → Terra Walking (7)
  52: 7,
  // HK WaterFitness (53) → Terra Swimming (82)
  53: 82,
  // HK WaterPolo (54) → Terra Waterpolo (96)
  54: 96,
  // HK WaterSports (55) → Terra Other (108)
  55: 108,
  // HK Wrestling (56) → Terra Martial Arts (44)
  56: 44,
  // HK Yoga (57) → Terra Yoga (100)
  57: 100,
  // HK Barre (58) → Terra Dancing (24)
  58: 24,
  // HK CoreTraining (59) → Terra Calisthenics (21)
  59: 21,
  // HK CrossCountrySkiing (60) → Terra Cross Country Skiing (67)
  60: 67,
  // HK DownhillSkiing (61) → Terra Downhill Skiing (68)
  61: 68,
  // HK Flexibility (62) → Terra Stretching (125)
  62: 125,
  // HK HighIntensityIntervalTraining (63) → Terra HIIT (114)
  63: 114,
  // HK JumpRope (64) → Terra Jumping Rope (39)
  64: 39,
  // HK Kickboxing (65) → Terra Kickboxing (42)
  65: 42,
  // HK Pilates (66) → Terra Pilates (49)
  66: 49,
  // HK Snowboarding (67) → Terra Snowboarding (73)
  67: 73,
  // HK Stairs (68) → Terra Stair Climbing (77)
  68: 77,
  // HK StepTraining (69) → Terra Stair Climbing Machine (78)
  69: 78,
  // HK WheelchairWalkPace (70) → Terra Wheelchair (98)
  70: 98,
  // HK WheelchairRunPace (71) → Terra Wheelchair (98)
  71: 98,
  // HK TaiChi (72) → Terra Meditation (45)
  72: 45,
  // HK MixedCardio (73) → Terra Cardio Training (123)
  73: 123,
  // HK HandCycling (74) → Terra Handbiking (14)
  74: 14,
  // HK DiscSports (75) → Terra Frisbee (30)
  75: 30,
  // HK FitnessGaming (76) → Terra Other (108)
  76: 108,
  // HK CardioDance (77) → Terra Dancing (24)
  77: 24,
  // HK SocialDance (78) → Terra Dancing (24)
  78: 24,
  // HK Pickleball (79) → Terra Other (108)
  79: 108,
  // HK Cooldown (80) → Terra Stretching (125)
  80: 125,
  // HK SwimBikeRun (82) → Terra Triathlon (126)
  82: 126,
  // HK Transition (83) → Terra Other (108)
  83: 108,
  // HK UnderwaterDiving (84) → Terra Diving (102)
  84: 102,
  // HK Other (3000) → Terra Other (108)
  3000: 108,
};

/**
 * Map an HKWorkoutActivityType raw value to the Terra ActivityType enum.
 * Returns Terra "Other" (108) for unknown types.
 */
export function mapActivityType(hkActivityType: number): number {
  return activityTypeMap[hkActivityType] ?? 108;
}
