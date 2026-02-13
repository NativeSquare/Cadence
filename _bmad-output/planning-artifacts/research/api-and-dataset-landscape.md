# API & Dataset Landscape for AI Running Coach

> **Purpose**: Identify available data sources to ensure the AI coach creates realistic, grounded advice — not hallucinated training plans.

---

## Executive Summary

| Source Type | Best For | Limitations |
|-------------|----------|-------------|
| **Strava API** | Activity history, GPS routes, segment performance | No HRV, limited biometrics, user must authorize |
| **Garmin Health API** | Rich biometrics (HRV, sleep, stress, Body Battery) | Commercial license required, device-dependent |
| **TrainingPeaks API** | Structured workouts, TSS/CTL/ATL metrics | Approved developers only, 7-10 day approval |
| **Public Datasets** | Model training, validation, benchmarking | Historical only, no real-time integration |

---

## 1. Strava API

**Documentation**: [developers.strava.com](https://developers.strava.com/docs/reference/)

### Available Data

#### Activity Data
| Field | Description |
|-------|-------------|
| `distance` | Distance in meters |
| `moving_time` / `elapsed_time` | Duration in seconds |
| `total_elevation_gain` | Elevation in meters |
| `average_speed` / `max_speed` | Speed metrics |
| `average_heartrate` / `max_heartrate` | HR if recorded |
| `average_cadence` | Steps per minute |
| `average_watts` / `max_watts` | Power data (if available) |
| `calories` | Energy expenditure |
| `suffer_score` | Strava's relative effort metric |
| `start_latlng` / `end_latlng` | GPS coordinates |
| `map.polyline` | Encoded route |
| `laps[]` | Split data per lap |
| `segment_efforts[]` | Performance on known segments |
| `activity_zones[]` | Time in HR/power zones |

#### Athlete Data
| Field | Description |
|-------|-------------|
| `weight` | Athlete weight |
| `ftp` | Functional Threshold Power |
| `bikes[]` / `shoes[]` | Equipment with distance tracked |
| `all_run_totals` | Lifetime run stats |
| `ytd_run_totals` | Year-to-date stats |
| `recent_run_totals` | Last 4 weeks |

### Limitations
- **No HRV data** — Strava doesn't capture or expose HRV
- **No sleep/recovery metrics** — Activity-focused only
- **User authorization required** — OAuth 2.0, user must grant access
- **Rate limits** — 15-minute and daily caps per application
- **No bulk access** — Can't pull "all public athletes"

### Use Case for Cadence
- Import training history for new users
- Validate prescribed sessions were completed
- Analyze segment performance for benchmark races
- Track equipment wear (shoe mileage)

---

## 2. Garmin Health API

**Documentation**: [developer.garmin.com/gc-developer-program/health-api/](https://developer.garmin.com/gc-developer-program/health-api/)

### Available Data

#### Health Metrics
| Metric | Description |
|--------|-------------|
| `steps` | Daily step count |
| `heart_rate` | Continuous HR monitoring |
| `hrv` | Heart Rate Variability (beat-to-beat) |
| `sleep` | Duration, stages, quality, sleep score |
| `stress` | Stress level throughout day |
| `body_battery` | Energy reserve metric |
| `respiration` | Breathing rate |
| `pulse_ox` | Blood oxygen saturation |
| `calories` | Energy expenditure |
| `intensity_minutes` | Moderate/vigorous activity duration |
| `body_composition` | Weight, body fat % (if scale connected) |

#### Activity Data
| Metric | Description |
|--------|-------------|
| `activities` | Workout details similar to Strava |
| `epoch_summaries` | Time-bucketed activity data |

### Access Requirements
- **Commercial license required** — Not available for personal use
- **Partner application process** — Must demonstrate commercial fitness application
- **Push or Pull architecture** — Can subscribe to specific data feeds
- **JSON format** — Standard data delivery

### Limitations
- **Device-dependent** — Only works with Garmin devices
- **Commercial only** — Need legitimate business case
- **No real-time streaming** — Data available after sync

### Use Case for Cadence
- **Primary biometric source** for Garmin users
- HRV-based readiness assessment
- Sleep quality for recovery modeling
- Stress correlation with training load
- Body Battery for fatigue estimation

---

## 3. TrainingPeaks API

**Documentation**: [github.com/TrainingPeaks/PartnersAPI/wiki](https://github.com/TrainingPeaks/PartnersAPI/wiki)

### Available Data

#### Workout Data
| Field | Description |
|-------|-------------|
| `duration` | Workout length |
| `distance` | Distance covered |
| `heart_rate` | HR metrics |
| `cadence` | Steps/revolutions per minute |
| `power` | Power output |
| `tss` | Training Stress Score |
| `if` | Intensity Factor |

#### Performance Metrics
| Metric | Description |
|--------|-------------|
| `ctl` | Chronic Training Load (fitness) |
| `atl` | Acute Training Load (fatigue) |
| `tsb` | Training Stress Balance (form) |
| `ftp` | Functional Threshold Power |

#### Athlete Data
| Field | Description |
|-------|-------------|
| `profile` | Basic athlete info |
| `zones` | Training zone configuration |
| `training_history` | Historical workouts |

### Access Requirements
- **Approved developers only** — Submit at api.trainingpeaks.com/request-access
- **7-10 day approval process**
- **Commercial fitness application required**

### Limitations
- **Premium user base** — TrainingPeaks users skew serious/coached
- **Not for personal use**
- **Limited to their ecosystem**

### Use Case for Cadence
- Import structured training history
- Leverage existing TSS/CTL calculations
- Athletes migrating from TrainingPeaks have rich historical data

---

## 4. Public Datasets

### A. Long-Distance Running Training Dataset (Figshare)

**Source**: [figshare.com/articles/dataset/16620238](https://figshare.com/articles/dataset/A_public_dataset_on_long-distance_running_training_in_2019_and_2020/16620238)

| Attribute | Value |
|-----------|-------|
| Records | 10,703,690 training sessions |
| Athletes | 36,412 unique runners |
| Period | 2019-2020 |
| Format | Parquet (Pandas) |

**Schema:**
```
- datetime: Date of activity
- athlete: Anonymous ID (integer)
- distance: Kilometers (float)
- duration: Minutes (float)
- gender: 'M' or 'F'
- age_group: '18-34', '35-54', '55+'
- country: Location
- marathon_history: Past marathon participation
```

**Sampling**: Available aggregated by day, week, month, quarter

**Use Case**: Training volume patterns, age/gender comparisons, COVID impact analysis

**Limitation**: No performance data (pace, HR), no workout type classification

---

### B. Ultra-Marathon Running Dataset (Kaggle)

**Source**: [kaggle.com/datasets/aiaiaidavid/the-big-dataset-of-ultra-marathon-running](https://www.kaggle.com/datasets/aiaiaidavid/the-big-dataset-of-ultra-marathon-running)

| Attribute | Value |
|-----------|-------|
| Records | 7+ million race results |
| Period | 1798-2022 |
| Format | CSV |

**Contains**: Race results, finish times, event details

**Use Case**: Race time prediction, ultra-distance benchmarking

---

### C. Marathon Time Predictions Dataset (Kaggle)

**Source**: [kaggle.com/datasets/girardi69/marathon-time-predictions](https://www.kaggle.com/datasets/girardi69/marathon-time-predictions)

**Use Case**: Building/validating marathon finish time prediction models

---

### D. Mid-Long Distance Runners Injuries Dataset

**Source**: [github.com/josedv82/public_sport_science_datasets](https://github.com/josedv82/public_sport_science_datasets)

| Attribute | Value |
|-----------|-------|
| Period | 7 years of training logs |
| Variables | 70+ metrics |
| Format | CSV |

**Contains**: Training logs (daily/weekly), injury records, distance, intensity, RPE, training quality

**Use Case**: Injury prediction model training, load-injury correlation analysis

---

### E. Running Biomechanics Dataset (Figshare)

**Source**: [figshare.com/articles/dataset/4543435](https://figshare.com/articles/dataset/A_comprehensive_public_data_set_of_running_biomechanics_and_the_effects_of_running_speed_on_lower_extremity_kinematics_and_kinetics/4543435)

**Contains**: Lower extremity kinematics and kinetics at various running speeds

**Use Case**: Biomechanical injury risk modeling (requires lab-grade data, not wearable)

---

### F. MMASH Dataset (PhysioNet)

**Source**: PhysioNet

**Contains**:
- Beat-to-beat heart data (HRV)
- Accelerometer data
- Sleep quality
- Physical activity levels
- Psychological markers

**Subjects**: 22 healthy individuals

**Use Case**: HRV-readiness correlation research, small-scale validation

---

## 5. Relevant Research Papers

### Training Optimization

| Paper | Key Finding |
|-------|-------------|
| [Sports Training DRL System](https://link.springer.com/article/10.1007/s44163-025-00473-9) (2025) | DQN-based training decision support achieved 88-92% personalized strategy matching |
| [AI in Sports Coaching](https://www.scirp.org/journal/paperinformation?paperid=138552) (2024) | AI can revolutionize training efficiency and reduce injury risks |

### Injury Prediction

| Paper | Key Finding |
|-------|-------------|
| [Time-Series Injury Prediction](https://pmc.ncbi.nlm.nih.gov/articles/PMC10773721/) (2024) | Deep learning on time-series wearable data for injury risk |
| [ML Injury Prediction Scoping Review](https://pmc.ncbi.nlm.nih.gov/articles/PMC12013557/) (2024) | Random Forest: 87.5% accuracy, CNN: 91% for video analysis |
| [Wearable Injury Prevention](https://www.sciencedirect.com/science/article/pii/S2665917424000308) (2024) | Real-time wearable data enables predictive analytics |
| [Musculoskeletal Loading Prediction](https://pubmed.ncbi.nlm.nih.gov/38857523/) (2024) | Instrumented insoles can predict loading at injury-prone locations |

### AI Coaching

| Paper | Key Finding |
|-------|-------------|
| [Systematic Review of AI Coaching](https://www.emerald.com/insight/content/doi/10.1108/jwam-11-2024-0164/full/html) (2025) | AI coaches can match human coaches for specific tasks; LLMs make coaching affordable/accessible |
| [AI/ML in Sports](https://pmc.ncbi.nlm.nih.gov/articles/PMC11215955/) (2024) | Wearables + AI enable real-time feedback; chatbots can automate engagement |

---

## 6. Recommended Approach for Cadence

### Phase 1: MVP Data Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│  PRIMARY: Strava Integration                                        │
│  ─────────────────────────────                                      │
│  • Easiest OAuth flow, most users have accounts                     │
│  • Activity history for training load estimation                    │
│  • Segment data for race performance benchmarking                   │
│  • Sufficient for plan generation grounding                         │
│                                                                     │
│  SECONDARY: Garmin Health API (if approved)                         │
│  ───────────────────────────────────────────                        │
│  • HRV for readiness assessment                                     │
│  • Sleep for recovery modeling                                      │
│  • Body Battery for fatigue                                         │
│  • Requires commercial license application                          │
│                                                                     │
│  FALLBACK: Manual Input + Validation                                │
│  ─────────────────────────────────────                              │
│  • User self-reports recent training                                │
│  • System validates against known patterns                          │
│  • Conservative assumptions when data sparse                        │
└─────────────────────────────────────────────────────────────────────┘
```

### Phase 2: Model Training & Validation

```
┌─────────────────────────────────────────────────────────────────────┐
│  TRAINING DATA                                                      │
│  ─────────────────                                                  │
│  1. Figshare Long-Distance Dataset (10.7M sessions)                 │
│     → Training volume patterns by demographic                       │
│     → What "normal" training looks like                             │
│                                                                     │
│  2. Injury Dataset (7 years, 70+ variables)                         │
│     → Load-injury correlations                                      │
│     → Warning sign patterns                                         │
│                                                                     │
│  3. Marathon/Ultra Race Results                                     │
│     → Performance prediction validation                             │
│     → Goal feasibility assessment                                   │
│                                                                     │
│  VALIDATION APPROACH                                                │
│  ───────────────────                                                │
│  • Generate plan for historical athlete profile                     │
│  • Compare to what they actually did                                │
│  • Check if our plan would have predicted their outcome             │
└─────────────────────────────────────────────────────────────────────┘
```

### Grounding the AI (Anti-Hallucination Strategy)

```
┌─────────────────────────────────────────────────────────────────────┐
│  RULE: LLM explains, deterministic systems decide                   │
│  ─────────────────────────────────────────────────                  │
│                                                                     │
│  ❌ DON'T: Ask LLM "What should this runner's peak volume be?"      │
│  ✅ DO: Calculate peak volume from formulas, ask LLM to explain it  │
│                                                                     │
│  The training engine (formulas, rules, constraints) produces:       │
│  • Specific numbers (45km peak, 5:30/km tempo pace)                 │
│  • Structured plan (week by week)                                   │
│  • Feasibility assessment (achievable/stretch/unlikely)             │
│                                                                     │
│  The LLM layer:                                                     │
│  • Conducts the conversation naturally                              │
│  • Extracts entities from user responses                            │
│  • Explains the plan in human terms                                 │
│  • Answers follow-up questions                                      │
│                                                                     │
│  EVERY number shown to user must trace to:                          │
│  • A formula (VDOT tables, % progressions)                          │
│  • User's actual data (Strava import)                               │
│  • A validated heuristic (coach-approved rule)                      │
│  • Literature reference (10% rule, etc.)                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 7. Open Questions

1. **Garmin API Access**: Should we apply for commercial license now? Timeline could impact MVP.

2. **Apple Health**: Worth investigating HealthKit for iOS users without Garmin?

3. **WHOOP API**: Premium biometric data, but WHOOP users are a specific demographic.

4. **Data Partnerships**: Could we partner with a coach who has historical athlete data?

5. **Synthetic Data**: Could we generate realistic training logs to augment limited real data?

---

## Sources

### API Documentation
- [Strava API v3 Reference](https://developers.strava.com/docs/reference/)
- [Garmin Health API](https://developer.garmin.com/gc-developer-program/health-api/)
- [TrainingPeaks API Help](https://help.trainingpeaks.com/hc/en-us/articles/234441128-TrainingPeaks-API)

### Datasets
- [Long-Distance Running Dataset (Figshare)](https://figshare.com/articles/dataset/A_public_dataset_on_long-distance_running_training_in_2019_and_2020/16620238)
- [Ultra-Marathon Dataset (Kaggle)](https://www.kaggle.com/datasets/aiaiaidavid/the-big-dataset-of-ultra-marathon-running)
- [Marathon Time Predictions (Kaggle)](https://www.kaggle.com/datasets/girardi69/marathon-time-predictions)
- [Public Sport Science Datasets (GitHub)](https://github.com/josedv82/public_sport_science_datasets)

### Research Papers
- [AI in Sports Coaching (SCIRP, 2024)](https://www.scirp.org/journal/paperinformation?paperid=138552)
- [AI/ML in Sports (PMC, 2024)](https://pmc.ncbi.nlm.nih.gov/articles/PMC11215955/)
- [Systematic Review of AI Coaching (Emerald, 2025)](https://www.emerald.com/insight/content/doi/10.1108/jwam-11-2024-0164/full/html)
- [Time-Series Injury Prediction (PMC, 2024)](https://pmc.ncbi.nlm.nih.gov/articles/PMC10773721/)
- [ML Injury Prediction Review (PMC, 2024)](https://pmc.ncbi.nlm.nih.gov/articles/PMC12013557/)
- [DRL Sports Training System (Springer, 2025)](https://link.springer.com/article/10.1007/s44163-025-00473-9)
