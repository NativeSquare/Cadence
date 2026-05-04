import type { ComponentType } from "react";
import {
  Activity,
  AlarmClock,
  Battery,
  BicepsFlexed,
  Brain,
  CalendarRange,
  Droplets,
  Flag,
  Footprints,
  Gauge,
  HeartHandshake,
  HeartPulse,
  Lightbulb,
  Moon,
  Mountain,
  Percent,
  PieChart,
  Pill,
  Repeat,
  Scale,
  ShieldCheck,
  Smile,
  Sparkles,
  Stethoscope,
  Target,
  Thermometer,
  TimerReset,
  TrendingUp,
  Trophy,
  Utensils,
  Waves,
  Wind,
  Zap,
} from "lucide-react-native";

export type SectionId = "training" | "health";

export type WindowKey =
  | "today"
  | "yesterday"
  | "7d"
  | "14d"
  | "30d"
  | "90d"
  | "365d"
  | "all"
  | "4w"
  | "12w"
  | "26w"
  | "52w"
  | "1y"
  | "2y"
  | "currentBlock"
  | "currentPlan"
  | "na";

export const WINDOW_LABEL: Record<WindowKey, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "7d",
  "14d": "14d",
  "30d": "30d",
  "90d": "90d",
  "365d": "365d",
  all: "All",
  "4w": "4w",
  "12w": "12w",
  "26w": "26w",
  "52w": "52w",
  "1y": "1y",
  "2y": "2y",
  currentBlock: "Block",
  currentPlan: "Plan",
  na: "—",
};

export type ChartKind =
  | "stackedBar"
  | "stackedBar100"
  | "bar"
  | "rangeBar"
  | "line"
  | "lineWithBand"
  | "lineWithDots"
  | "multiLine"
  | "dualLine"
  | "dualBar"
  | "dualAxisBarLine"
  | "scatter"
  | "donut"
  | "horizontalBar"
  | "stackedHorizontalBar"
  | "rangePlot"
  | "areaBandPercentile"
  | "gantt"
  | "kpiStrip"
  | "pillList";

export type CardConfig = {
  id: string;
  title: string;
  chart: ChartKind;
  source: string;
  Icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  defaultWindow: WindowKey;
  windows: WindowKey[];
};

export type OptInCta = {
  copy: string;
  buttonLabel: string;
};

export type SubsectionConfig = {
  id: string;
  title: string;
  cards: CardConfig[];
  optIn?: OptInCta;
};

export const TRAINING_INVENTORY: SubsectionConfig[] = [
  {
    id: "1A",
    title: "Volume & Frequency",
    cards: [
      {
        id: "T1",
        title: "Weekly distance, by workout type",
        chart: "stackedBar",
        source: "Workout.actual.distanceMeters · grouped by ISO week, stacked by type",
        Icon: TrendingUp,
        defaultWindow: "12w",
        windows: ["4w", "12w", "26w", "52w"],
      },
      {
        id: "T2",
        title: "Weekly time, by workout type",
        chart: "stackedBar",
        source: "Workout.actual.durationSeconds · grouped by week × type",
        Icon: TimerReset,
        defaultWindow: "12w",
        windows: ["4w", "12w", "26w", "52w"],
      },
      {
        id: "T3",
        title: "Sessions per week, by status",
        chart: "stackedBar",
        source: "Count of Workout per week, stacked by status",
        Icon: Repeat,
        defaultWindow: "12w",
        windows: ["4w", "12w", "26w"],
      },
      {
        id: "T4",
        title: "Weekly elevation gain",
        chart: "bar",
        source: "Sum of Workout.actual.elevationGainMeters per week",
        Icon: Mountain,
        defaultWindow: "12w",
        windows: ["4w", "12w", "26w", "52w"],
      },
      {
        id: "T5",
        title: "Long-run progression",
        chart: "line",
        source: "Max actual.distanceMeters where type=long, per week",
        Icon: Footprints,
        defaultWindow: "26w",
        windows: ["12w", "26w", "52w"],
      },
    ],
  },
  {
    id: "1B",
    title: "Composition",
    cards: [
      {
        id: "T6",
        title: "Workout type distribution",
        chart: "donut",
        source: "% of completed Workouts by type",
        Icon: PieChart,
        defaultWindow: "12w",
        windows: ["4w", "12w", "currentBlock", "26w"],
      },
      {
        id: "T7",
        title: "Intensity distribution (zone time)",
        chart: "stackedHorizontalBar",
        source: "actual.avgHr × athlete Zone.boundaries (kind=hr), summed by zone",
        Icon: Gauge,
        defaultWindow: "12w",
        windows: ["4w", "12w", "currentBlock"],
      },
    ],
  },
  {
    id: "1C",
    title: "Performance Trends",
    cards: [
      {
        id: "T8",
        title: "Easy-pace drift",
        chart: "lineWithDots",
        source: "actual.avgPaceMps for type=easy · per workout + weekly mean",
        Icon: Waves,
        defaultWindow: "26w",
        windows: ["12w", "26w", "52w"],
      },
      {
        id: "T9",
        title: "Threshold-pace progression",
        chart: "lineWithDots",
        source: "actual.avgPaceMps for type ∈ {threshold, tempo}",
        Icon: Zap,
        defaultWindow: "26w",
        windows: ["12w", "26w", "52w", "all"],
      },
      {
        id: "T10",
        title: "Race results",
        chart: "scatter",
        source: "Race.result.finishTimeSec × distanceMeters, color=priority",
        Icon: Flag,
        defaultWindow: "1y",
        windows: ["1y", "2y", "all"],
      },
      {
        id: "T11",
        title: "PR progression by distance",
        chart: "multiLine",
        source: "Best Race.result.finishTimeSec per format over time",
        Icon: Trophy,
        defaultWindow: "all",
        windows: ["1y", "2y", "all"],
      },
    ],
  },
  {
    id: "1D",
    title: "Plan Compliance",
    cards: [
      {
        id: "T12",
        title: "Adherence score over time",
        chart: "lineWithDots",
        source: "Workout.adherence.score · weekly mean overlay",
        Icon: ShieldCheck,
        defaultWindow: "12w",
        windows: ["4w", "12w", "26w", "52w"],
      },
      {
        id: "T13",
        title: "Adherence breakdown",
        chart: "horizontalBar",
        source: "Mean of duration/distance/intensity/structure match",
        Icon: Percent,
        defaultWindow: "currentBlock",
        windows: ["4w", "12w", "currentBlock"],
      },
      {
        id: "T14",
        title: "Planned vs actual weekly distance",
        chart: "dualLine",
        source: "Sum of planned.distanceMeters vs actual.distanceMeters per week",
        Icon: Target,
        defaultWindow: "12w",
        windows: ["4w", "12w", "26w", "52w"],
      },
      {
        id: "T15",
        title: "Status mix per week",
        chart: "stackedBar100",
        source: "% completed / missed / skipped per week",
        Icon: Activity,
        defaultWindow: "12w",
        windows: ["4w", "12w", "26w"],
      },
    ],
  },
  {
    id: "1E",
    title: "Block & Race Context",
    cards: [
      {
        id: "T16",
        title: "Block timeline",
        chart: "gantt",
        source: "Block.startDate / endDate / type",
        Icon: CalendarRange,
        defaultWindow: "currentPlan",
        windows: ["currentPlan", "1y", "all"],
      },
      {
        id: "T17",
        title: "Block adherence",
        chart: "bar",
        source: "Mean Workout.adherence.score grouped by blockId",
        Icon: BicepsFlexed,
        defaultWindow: "currentPlan",
        windows: ["currentPlan", "1y"],
      },
      {
        id: "T18",
        title: "Days to next race",
        chart: "kpiStrip",
        source: "Race.date − today, color by priority",
        Icon: AlarmClock,
        defaultWindow: "na",
        windows: ["na"],
      },
      {
        id: "T19",
        title: "Goals status",
        chart: "pillList",
        source: "Goal.title / rank / status / targetDate",
        Icon: Target,
        defaultWindow: "na",
        windows: ["na"],
      },
    ],
  },
  {
    id: "1F",
    title: "Subjective Load",
    optIn: {
      copy: "Add an RPE rating after each session to track perceived effort over time.",
      buttonLabel: "Start logging RPE",
    },
    cards: [
      {
        id: "T20",
        title: "RPE trend",
        chart: "lineWithDots",
        source: "Workout.actual.rpe per workout",
        Icon: Smile,
        defaultWindow: "12w",
        windows: ["4w", "12w", "26w"],
      },
      {
        id: "T21",
        title: "RPE vs avg-HR",
        chart: "scatter",
        source: "actual.rpe × actual.avgHr · color = workout type",
        Icon: Brain,
        defaultWindow: "12w",
        windows: ["4w", "12w"],
      },
    ],
  },
];

export const HEALTH_INVENTORY: SubsectionConfig[] = [
  {
    id: "2A",
    title: "Cardiovascular",
    cards: [
      {
        id: "H1",
        title: "Resting HR trend",
        chart: "line",
        source: "Daily.heart_rate_data.summary.resting_hr_bpm",
        Icon: HeartPulse,
        defaultWindow: "30d",
        windows: ["7d", "30d", "90d", "365d"],
      },
      {
        id: "H2",
        title: "HRV (RMSSD), with 7d rolling",
        chart: "lineWithBand",
        source: "Daily.heart_rate_data.summary.avg_hrv_rmssd",
        Icon: Sparkles,
        defaultWindow: "30d",
        windows: ["7d", "30d", "90d"],
      },
      {
        id: "H3",
        title: "Sleep HR (min)",
        chart: "line",
        source: "Sleep.heart_rate_data.summary.min_hr_bpm",
        Icon: HeartHandshake,
        defaultWindow: "30d",
        windows: ["7d", "30d", "90d"],
      },
    ],
  },
  {
    id: "2B",
    title: "Sleep",
    cards: [
      {
        id: "H4",
        title: "Sleep duration by stage",
        chart: "stackedBar",
        source: "Sleep.sleep_durations_data.asleep.duration_*_sleep_state_seconds + awake",
        Icon: Moon,
        defaultWindow: "14d",
        windows: ["7d", "14d", "30d", "90d"],
      },
      {
        id: "H5",
        title: "Sleep score",
        chart: "line",
        source: "Sleep.scores.sleep · or Daily.scores.sleep",
        Icon: Sparkles,
        defaultWindow: "30d",
        windows: ["7d", "30d", "90d", "365d"],
      },
      {
        id: "H6",
        title: "Sleep efficiency",
        chart: "line",
        source: "Sleep.sleep_durations_data.sleep_efficiency",
        Icon: Percent,
        defaultWindow: "30d",
        windows: ["7d", "30d", "90d"],
      },
      {
        id: "H7",
        title: "Wake-up events & sleep latency",
        chart: "dualAxisBarLine",
        source: "awake.num_wakeup_events · awake.sleep_latency_seconds",
        Icon: AlarmClock,
        defaultWindow: "30d",
        windows: ["7d", "30d", "90d"],
      },
    ],
  },
  {
    id: "2C",
    title: "Recovery & Readiness",
    cards: [
      {
        id: "H8",
        title: "Recovery score",
        chart: "line",
        source: "Daily.scores.recovery",
        Icon: Battery,
        defaultWindow: "30d",
        windows: ["7d", "30d", "90d"],
      },
      {
        id: "H9",
        title: "Readiness score",
        chart: "line",
        source: "Sleep.readiness_data.readiness · per morning",
        Icon: ShieldCheck,
        defaultWindow: "30d",
        windows: ["7d", "30d", "90d"],
      },
      {
        id: "H10",
        title: "Skin temperature delta (night)",
        chart: "line",
        source: "Sleep.temperature_data.delta",
        Icon: Thermometer,
        defaultWindow: "30d",
        windows: ["30d", "90d"],
      },
    ],
  },
  {
    id: "2D",
    title: "Stress & Energy",
    cards: [
      {
        id: "H11",
        title: "Daily avg stress",
        chart: "line",
        source: "Daily.stress_data.avg_stress_level",
        Icon: Brain,
        defaultWindow: "30d",
        windows: ["7d", "30d", "90d"],
      },
      {
        id: "H12",
        title: "Stress duration distribution",
        chart: "stackedBar100",
        source: "Daily.stress_data.{rest,low,medium,high}_stress_duration_seconds",
        Icon: Activity,
        defaultWindow: "14d",
        windows: ["7d", "14d", "30d"],
      },
      {
        id: "H13",
        title: "Body battery (today)",
        chart: "line",
        source: "Daily.stress_data.body_battery_samples[]",
        Icon: Battery,
        defaultWindow: "today",
        windows: ["today", "yesterday"],
      },
      {
        id: "H14",
        title: "Body-battery low/high per day",
        chart: "rangeBar",
        source: "Min/max from body_battery_samples per day",
        Icon: TrendingUp,
        defaultWindow: "14d",
        windows: ["7d", "14d", "30d"],
      },
    ],
  },
  {
    id: "2E",
    title: "Respiratory & Oxygen",
    cards: [
      {
        id: "H15",
        title: "Resting breathing rate",
        chart: "line",
        source: "Daily.respiration_data.breaths_data.avg_breaths_per_min",
        Icon: Wind,
        defaultWindow: "30d",
        windows: ["30d", "90d"],
      },
      {
        id: "H16",
        title: "SpO₂ trend",
        chart: "line",
        source: "Daily.oxygen_data.avg_saturation_percentage",
        Icon: Droplets,
        defaultWindow: "30d",
        windows: ["30d", "90d"],
      },
    ],
  },
  {
    id: "2F",
    title: "Fitness Marker",
    cards: [
      {
        id: "H17",
        title: "VO₂max trend",
        chart: "line",
        source: "Daily.oxygen_data.vo2max_ml_per_min_per_kg",
        Icon: Lightbulb,
        defaultWindow: "90d",
        windows: ["30d", "90d", "365d", "all"],
      },
    ],
  },
  {
    id: "2G",
    title: "General Activity",
    cards: [
      {
        id: "H18",
        title: "Steps per day",
        chart: "bar",
        source: "Daily.distance_data.steps",
        Icon: Footprints,
        defaultWindow: "14d",
        windows: ["7d", "14d", "30d", "90d"],
      },
      {
        id: "H19",
        title: "Active minutes (intensity tiers)",
        chart: "stackedBar",
        source: "Daily.MET_data.num_low/moderate/vigorous_intensity_minutes",
        Icon: Activity,
        defaultWindow: "14d",
        windows: ["7d", "14d", "30d"],
      },
      {
        id: "H20",
        title: "Calories — burned vs intake",
        chart: "dualBar",
        source: "Daily.calories_data.total_burned_calories vs net_intake_calories",
        Icon: Zap,
        defaultWindow: "14d",
        windows: ["7d", "14d", "30d"],
      },
    ],
  },
  {
    id: "2H",
    title: "Composite Wellness Scores",
    optIn: {
      copy: "These scores are derived by Garmin's data enrichment. If you don't see them, check that your latest sync went through.",
      buttonLabel: "Check sync status",
    },
    cards: [
      {
        id: "H21",
        title: "Wellness scores (multi-line)",
        chart: "multiLine",
        source: "Daily.data_enrichment.{cardiovascular, immune, respiratory, readiness}_score",
        Icon: ShieldCheck,
        defaultWindow: "30d",
        windows: ["30d", "90d"],
      },
    ],
  },
  {
    id: "2I",
    title: "Body Composition",
    optIn: {
      copy: "Connect a smart scale or log weight manually to see body composition trends.",
      buttonLabel: "Log weight",
    },
    cards: [
      {
        id: "H22",
        title: "Weight trend",
        chart: "line",
        source: "Body.measurements_data.measurements (weight_kg)",
        Icon: Scale,
        defaultWindow: "90d",
        windows: ["30d", "90d", "365d"],
      },
      {
        id: "H23",
        title: "Body fat % trend",
        chart: "line",
        source: "Body.measurements_data.measurements (body_fat_pct)",
        Icon: Percent,
        defaultWindow: "90d",
        windows: ["90d", "365d"],
      },
    ],
  },
  {
    id: "2J",
    title: "Cardiovascular Lab",
    optIn: {
      copy: "Log a blood-pressure reading manually or connect a BP monitor to track cardiovascular health.",
      buttonLabel: "Log BP reading",
    },
    cards: [
      {
        id: "H24",
        title: "Blood pressure",
        chart: "rangePlot",
        source: "Body.blood_pressure_data.blood_pressure_samples (systolic / diastolic)",
        Icon: Stethoscope,
        defaultWindow: "90d",
        windows: ["30d", "90d", "365d"],
      },
    ],
  },
  {
    id: "2K",
    title: "Glucose",
    optIn: {
      copy: "Connect a CGM or log glucose readings to surface daily patterns and time-in-range.",
      buttonLabel: "Connect CGM",
    },
    cards: [
      {
        id: "H25",
        title: "Glucose daily AGP",
        chart: "areaBandPercentile",
        source: "Body.glucose_data.daily_patterns or aggregate of blood_glucose_samples",
        Icon: Pill,
        defaultWindow: "14d",
        windows: ["14d", "30d", "90d"],
      },
      {
        id: "H26",
        title: "Time-in-range",
        chart: "stackedBar100",
        source: "Body.glucose_data.time_in_range",
        Icon: Percent,
        defaultWindow: "14d",
        windows: ["14d", "30d"],
      },
    ],
  },
  {
    id: "2L",
    title: "Nutrition",
    optIn: {
      copy: "Log meals and macros to track fueling patterns alongside training load.",
      buttonLabel: "Start logging nutrition",
    },
    cards: [
      {
        id: "H27",
        title: "Daily macros",
        chart: "stackedBar",
        source: "Nutrition.summary.macros.{protein_g, carbohydrates_g, fat_g}",
        Icon: Utensils,
        defaultWindow: "14d",
        windows: ["7d", "14d", "30d"],
      },
      {
        id: "H28",
        title: "Hydration",
        chart: "bar",
        source: "Nutrition.summary.water_ml",
        Icon: Droplets,
        defaultWindow: "14d",
        windows: ["7d", "14d", "30d"],
      },
    ],
  },
];
