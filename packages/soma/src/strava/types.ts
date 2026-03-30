// ─── Strava API Response Types ───────────────────────────────────────────────
// TypeScript interfaces representing Strava API v3 data shapes.
// Derived from the Strava OpenAPI spec (strava.json).
//
// These types define the CONTRACT for data coming from the Strava API.
// They are used by transformers, the API client, and OAuth helpers.

// ─── Athlete ─────────────────────────────────────────────────────────────────

export interface SummaryAthlete {
  id: number;
  resource_state: number;
  firstname?: string;
  lastname?: string;
}

export interface DetailedAthlete {
  id: number;
  username: string | null;
  resource_state: number;
  firstname: string;
  lastname: string;
  city: string | null;
  state: string | null;
  country: string | null;
  sex: "M" | "F" | null;
  premium: boolean;
  summit: boolean;
  created_at: string; // ISO-8601
  updated_at: string; // ISO-8601
  badge_type_id: number;
  profile_medium: string;
  profile: string;
  friend: string | null;
  follower: string | null;
  follower_count: number;
  friend_count: number;
  mutual_friend_count: number;
  athlete_type: number;
  date_preference: string;
  measurement_preference: string;
  ftp: number | null;
  weight: number | null;
  clubs: SummaryClub[];
  bikes: SummaryGear[];
  shoes: SummaryGear[];
}

// ─── Club ────────────────────────────────────────────────────────────────────

export interface SummaryClub {
  id: number;
  resource_state: number;
  name: string;
  profile_medium: string;
  sport_type: string;
  city: string;
  state: string;
  country: string;
  member_count: number;
  featured: boolean;
  verified: boolean;
  url: string;
}

// ─── Gear ────────────────────────────────────────────────────────────────────

export interface SummaryGear {
  id: string;
  primary: boolean;
  name: string;
  resource_state: number;
  distance: number;
}

// ─── Map ─────────────────────────────────────────────────────────────────────

export interface PolylineMap {
  id: string;
  polyline: string | null;
  resource_state: number;
  summary_polyline: string | null;
}

// ─── Activity ────────────────────────────────────────────────────────────────

export interface SummaryActivity {
  resource_state: number;
  athlete: SummaryAthlete;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  sport_type: StravaSportType;
  workout_type: number | null;
  id: number;
  external_id: string | null;
  upload_id: number | null;
  start_date: string; // ISO-8601
  start_date_local: string; // ISO-8601
  timezone: string;
  utc_offset: number;
  start_latlng: [number, number] | null;
  end_latlng: [number, number] | null;
  location_city: string | null;
  location_state: string | null;
  location_country: string | null;
  achievement_count: number;
  kudos_count: number;
  comment_count: number;
  athlete_count: number;
  photo_count: number;
  map: PolylineMap;
  trainer: boolean;
  commute: boolean;
  manual: boolean;
  private: boolean;
  flagged: boolean;
  gear_id: string | null;
  from_accepted_tag: boolean;
  average_speed: number;
  max_speed: number;
  average_cadence?: number;
  average_watts?: number;
  weighted_average_watts?: number;
  kilojoules?: number;
  device_watts?: boolean;
  has_heartrate: boolean;
  average_heartrate?: number;
  max_heartrate?: number;
  max_watts?: number;
  pr_count: number;
  total_photo_count: number;
  has_kudoed: boolean;
  suffer_score?: number | null;
  device_name?: string;
}

export interface DetailedActivity extends SummaryActivity {
  description: string | null;
  calories: number;
  gear: SummaryGear | null;
  segment_efforts: SegmentEffort[];
  splits_metric: Split[];
  splits_standard?: Split[];
  laps: Lap[];
  best_efforts?: SegmentEffort[];
  photos?: ActivityPhotos;
  embed_token: string;
  average_temp?: number;
  elev_high?: number;
  elev_low?: number;
  hide_from_home?: boolean;
  partner_brand_tag: string | null;
  highlighted_kudosers?: HighlightedKudoser[];
  segment_leaderboard_opt_out?: boolean;
  leaderboard_opt_out?: boolean;
}

// ─── Segment Effort ──────────────────────────────────────────────────────────

export interface SegmentEffort {
  id: number;
  resource_state: number;
  name: string;
  activity: { id: number; resource_state: number };
  athlete: SummaryAthlete;
  elapsed_time: number;
  moving_time: number;
  start_date: string;
  start_date_local: string;
  distance: number;
  start_index: number;
  end_index: number;
  average_cadence?: number;
  device_watts?: boolean;
  average_watts?: number;
  segment: SummarySegment;
  kom_rank: number | null;
  pr_rank: number | null;
  achievements: unknown[];
  hidden: boolean;
}

// ─── Segment ─────────────────────────────────────────────────────────────────

export interface SummarySegment {
  id: number;
  resource_state: number;
  name: string;
  activity_type: string;
  distance: number;
  average_grade: number;
  maximum_grade: number;
  elevation_high: number;
  elevation_low: number;
  start_latlng: [number, number];
  end_latlng: [number, number];
  climb_category: number;
  city: string;
  state: string;
  country: string;
  private: boolean;
  hazardous: boolean;
  starred: boolean;
}

// ─── Lap ─────────────────────────────────────────────────────────────────────

export interface Lap {
  id: number;
  resource_state: number;
  name: string;
  activity: { id: number; resource_state: number };
  athlete: SummaryAthlete;
  elapsed_time: number;
  moving_time: number;
  start_date: string; // ISO-8601
  start_date_local: string;
  distance: number;
  start_index: number;
  end_index: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
  average_cadence?: number;
  device_watts?: boolean;
  average_watts?: number;
  lap_index: number;
  split: number;
  average_heartrate?: number;
  max_heartrate?: number;
}

// ─── Split ───────────────────────────────────────────────────────────────────

export interface Split {
  distance: number;
  elapsed_time: number;
  elevation_difference: number;
  moving_time: number;
  split: number;
  average_speed: number;
  pace_zone: number;
  average_heartrate?: number;
  average_grade_adjusted_speed?: number;
}

// ─── Streams ─────────────────────────────────────────────────────────────────
// Activity streams are time-series data returned by GET /activities/{id}/streams.

export interface Stream<T = number> {
  type: string;
  data: T[];
  series_type: string;
  original_size: number;
  resolution: string;
}

export interface StreamSet {
  time?: Stream<number>;
  distance?: Stream<number>;
  latlng?: Stream<[number, number]>;
  altitude?: Stream<number>;
  heartrate?: Stream<number>;
  cadence?: Stream<number>;
  watts?: Stream<number>;
  temp?: Stream<number>;
  moving?: Stream<boolean>;
  grade_smooth?: Stream<number>;
  velocity_smooth?: Stream<number>;
}

// ─── Photos ──────────────────────────────────────────────────────────────────

export interface ActivityPhotos {
  primary: {
    id: number | null;
    unique_id: string;
    urls: Record<string, string>;
    source: number;
  } | null;
  use_primary_photo: boolean;
  count: number;
}

export interface HighlightedKudoser {
  destination_url: string;
  display_name: string;
  avatar_url: string;
  show_name: boolean;
}

// ─── OAuth ───────────────────────────────────────────────────────────────────

export interface OAuthTokenResponse {
  token_type: string;
  expires_at: number; // Unix timestamp
  expires_in: number; // seconds
  refresh_token: string;
  access_token: string;
  athlete: DetailedAthlete;
}

// ─── Sport Type ──────────────────────────────────────────────────────────────
// All known Strava sport_type values from the API spec.

export type StravaSportType =
  | "AlpineSki"
  | "BackcountrySki"
  | "Badminton"
  | "Canoeing"
  | "Crossfit"
  | "EBikeRide"
  | "Elliptical"
  | "EMountainBikeRide"
  | "Golf"
  | "GravelRide"
  | "Handcycle"
  | "HighIntensityIntervalTraining"
  | "Hike"
  | "IceSkate"
  | "InlineSkate"
  | "Kayaking"
  | "Kitesurf"
  | "MountainBikeRide"
  | "NordicSki"
  | "Pickleball"
  | "Pilates"
  | "Racquetball"
  | "Ride"
  | "RockClimbing"
  | "RollerSki"
  | "Rowing"
  | "Run"
  | "Sail"
  | "Skateboard"
  | "Snowboard"
  | "Snowshoe"
  | "Soccer"
  | "Squash"
  | "StairStepper"
  | "StandUpPaddling"
  | "Surfing"
  | "Swim"
  | "TableTennis"
  | "Tennis"
  | "TrailRun"
  | "Velomobile"
  | "VirtualRide"
  | "VirtualRow"
  | "VirtualRun"
  | "Walk"
  | "WeightTraining"
  | "Wheelchair"
  | "Windsurf"
  | "Workout"
  | "Yoga"
  | (string & {});
