# Training Engine Architecture

> **Core Challenge**: How do we build a training engine that performs well with limited data, is fully interpretable, and has a clear path to improvement over time?

---

## Constraints

- ~5 coaches available for initial knowledge extraction
- Need MVP-ready system without massive training data
- Interpretability is non-negotiable (aligns with transparency positioning)
- Must have clear system to incorporate new data over time

---

## Why Not Pure DRL?

Deep Reinforcement Learning (as referenced in domain research) achieves impressive results:
- 12.3% performance improvement over rule-based
- 43% injury rate reduction

But it requires:
- Massive training data
- Black-box decisions (can't explain WHY)
- Significant infrastructure

**For MVP**: Not viable. We need interpretability from day 1.

---

## Proposed Architecture: Expert Scaffold + Learning Layer

The key insight: **Separate "what to train" from "how much to train".**

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    TRAINING ENGINE ARCHITECTURE                          │
│                      (Interpretable Hybrid)                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  LAYER 1: EXPERT SCAFFOLD (Rule-Based, Fully Interpretable)              │
│  ═══════════════════════════════════════════════════════════             │
│                                                                          │
│  This layer encodes established training science. It answers:            │
│  "What TYPE of training should happen when?"                             │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  PERIODIZATION TEMPLATES                                           │  │
│  │  ──────────────────────────                                        │  │
│  │  • Marathon 16-week structure                                      │  │
│  │  • Half marathon 12-week structure                                 │  │
│  │  • 10K 8-week structure                                            │  │
│  │  • etc.                                                            │  │
│  │                                                                    │  │
│  │  Each template defines:                                            │  │
│  │  • Phase sequence (Base → Build → Peak → Taper)                    │  │
│  │  • Phase durations (as % of total time)                            │  │
│  │  • Session type distribution per phase                             │  │
│  │  • Key workout types per phase                                     │  │
│  │  • Recovery week placement                                         │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                              │                                           │
│                              ▼                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  CONSTRAINT SOLVER                                                 │  │
│  │  ─────────────────────                                             │  │
│  │  Takes template + runner constraints → produces valid schedule     │  │
│  │                                                                    │  │
│  │  Rules:                                                            │  │
│  │  • Never schedule hard sessions on consecutive days                │  │
│  │  • Long run on preferred day (Sat/Sun)                             │  │
│  │  • Respect blocked days                                            │  │
│  │  • Place recovery days after hard sessions                         │  │
│  │  • etc.                                                            │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                              │                                           │
│                              ▼                                           │
│  LAYER 2: CALIBRATION ENGINE (Data-Informed, Interpretable)              │
│  ═══════════════════════════════════════════════════════════             │
│                                                                          │
│  This layer personalizes the scaffold. It answers:                       │
│  "How MUCH should this runner do?"                                       │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  LOAD CALIBRATION                                                  │  │
│  │  ─────────────────────                                             │  │
│  │                                                                    │  │
│  │  Starting point formula (interpretable):                           │  │
│  │                                                                    │  │
│  │  base_volume = current_weekly_volume                               │  │
│  │  peak_volume = race_distance × multiplier[goal_type]               │  │
│  │  weekly_increase = min(10%, safe_increase[injury_history])         │  │
│  │                                                                    │  │
│  │  Session intensity from VDOT tables (Daniels):                     │  │
│  │  • Easy pace = VDOT_easy(current_vdot)                             │  │
│  │  • Tempo pace = VDOT_threshold(current_vdot)                       │  │
│  │  • Interval pace = VDOT_interval(current_vdot)                     │  │
│  │                                                                    │  │
│  │  Every number traces to a formula or lookup table.                 │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                              │                                           │
│                              ▼                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  INDIVIDUAL MODIFIERS (Coach-Encoded Heuristics)                   │  │
│  │  ───────────────────────────────────────────────────               │  │
│  │                                                                    │  │
│  │  Adjustments based on profile, each with clear rationale:          │  │
│  │                                                                    │  │
│  │  IF injury_history.shin_splints THEN                               │  │
│  │    volume_cap *= 0.9                                               │  │
│  │    reason: "Reduced volume ceiling due to shin splint history"     │  │
│  │                                                                    │  │
│  │  IF age > 50 THEN                                                  │  │
│  │    recovery_days += 1                                              │  │
│  │    reason: "Additional recovery day for age-appropriate training"  │  │
│  │                                                                    │  │
│  │  IF training_experience < 12_months THEN                           │  │
│  │    intensity_ceiling = "moderate"                                  │  │
│  │    reason: "Limiting intensity for newer runner"                   │  │
│  │                                                                    │  │
│  │  ⚠️  NOTE: Coaches may not give us precise numbers (0.9, +1 day).  │  │
│  │  We'll get VARIABLES to watch. Numbers need data or precise Qs.   │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                              │                                           │
│                              ▼                                           │
│  LAYER 3: LEARNING LAYER (Future Enhancement)                            │
│  ═══════════════════════════════════════════════════════════             │
│                                                                          │
│  This layer learns from outcomes. Initially minimal, grows over time.    │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  OUTCOME TRACKING                                                  │  │
│  │  ─────────────────────                                             │  │
│  │                                                                    │  │
│  │  For every plan:                                                   │  │
│  │  • Compliance rate (sessions completed as prescribed)              │  │
│  │  • Modification rate (sessions adjusted)                           │  │
│  │  • Skip rate (sessions missed)                                     │  │
│  │  • Injury events                                                   │  │
│  │  • Performance outcome (race result vs. target)                    │  │
│  │  • Subjective satisfaction                                         │  │
│  │                                                                    │  │
│  │  This builds the dataset for future learning.                      │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  MODIFIER LEARNING (Post-MVP)                                      │  │
│  │  ───────────────────────────                                       │  │
│  │                                                                    │  │
│  │  With enough data, learn adjustments to the modifier weights:      │  │
│  │                                                                    │  │
│  │  "Runners with shin splint history who we reduced volume by 10%    │  │
│  │   had 15% fewer re-injuries. Updating modifier from 0.9 to 0.85."  │  │
│  │                                                                    │  │
│  │  Each learned adjustment is:                                       │  │
│  │  • Backed by data (N runners, X outcomes)                          │  │
│  │  • Reviewable by coaches                                           │  │
│  │  • Reversible if wrong                                             │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## The Coach Collaboration System

### Phase 1: Knowledge Extraction (Before MVP)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    COACH KNOWLEDGE EXTRACTION                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  SESSION 1: PERIODIZATION REVIEW                                         │
│  ────────────────────────────────                                        │
│                                                                          │
│  Present coaches with template structures:                               │
│  "Here's our default 16-week marathon structure. What would you change?" │
│                                                                          │
│  Capture:                                                                │
│  • Disagreements between coaches (valuable signal)                       │
│  • Common adjustments they all make                                      │
│  • Edge cases they've seen                                               │
│                                                                          │
│  SESSION 2: MODIFIER ELICITATION                                         │
│  ─────────────────────────────────                                       │
│                                                                          │
│  Present runner profiles, ask: "How would you adjust for this runner?"   │
│                                                                          │
│  Profile A: "45-year-old, returning after IT band injury, 30km/week"     │
│  Profile B: "28-year-old, no injuries, aggressive personality, 50km/wk"  │
│  Profile C: "35-year-old, first marathon, very cautious, 25km/week"      │
│                                                                          │
│  Capture their reasoning as rules:                                       │
│  • "For IT band history, I always reduce hill work initially"            │
│  • "Aggressive runners need to be held back on easy days"                │
│  • "First-timers need more explanation, longer base phase"               │
│                                                                          │
│  ⚠️  EXPECT: Variables/factors to watch, NOT precise numbers.            │
│  Numbers will come from data history or very precise follow-up Qs.       │
│                                                                          │
│  SESSION 3: FAILURE ANALYSIS                                             │
│  ────────────────────────────────                                        │
│                                                                          │
│  "Tell me about athletes whose training went wrong. What happened?"      │
│                                                                          │
│  Capture:                                                                │
│  • Warning signs they look for                                           │
│  • Interventions they wish they'd made                                   │
│  • Patterns that predict problems                                        │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Phase 2: Ongoing Feedback Loop (During/After MVP)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    COACH FEEDBACK INTERFACE                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  PLAN REVIEW QUEUE                                                       │
│  ─────────────────────                                                   │
│                                                                          │
│  Weekly: Coaches review a sample of generated plans                      │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  RUNNER: Alex, 32, Half Marathon Goal                              │  │
│  │  ──────────────────────────────────────────                        │  │
│  │                                                                    │  │
│  │  System generated: 12-week plan, peak 55km, 4 days/week            │  │
│  │                                                                    │  │
│  │  Key decisions:                                                    │  │
│  │  • Base phase: 4 weeks (33%)                                       │  │
│  │  • First tempo: Week 5                                             │  │
│  │  • Peak volume: Week 9                                             │  │
│  │  • Long run cap: 18km                                              │  │
│  │                                                                    │  │
│  │  Coach feedback:                                                   │  │
│  │  ○ Approve as-is                                                   │  │
│  │  ○ Approve with notes                                              │  │
│  │  ○ Would modify: [___________________________]                     │  │
│  │  ○ Reject — here's what I'd do instead                             │  │
│  │                                                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  Each modification becomes a data point:                                 │
│  • Input: Runner profile + System decision                               │
│  • Output: Coach adjustment + Reasoning                                  │
│                                                                          │
│  After N similar adjustments → propose new rule for validation           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Decision Audit Trail

Every decision must be traceable. This is how we maintain interpretability even as the system learns.

```yaml
PlanDecision:
  decision_id: uuid
  decision_type: enum  # periodization | volume | intensity | session_placement | modification

  what_was_decided: string
  # e.g., "Peak volume set to 55km/week"

  decision_source:
    primary: enum  # template | formula | modifier | coach_rule | learned

    if template:
      template_name: string
      template_rule: string
      # "Marathon 16-week template specifies peak at 65-70% of weeks"

    if formula:
      formula_name: string
      formula: string
      inputs: object
      calculation: string
      # "peak_volume = race_distance(21.1) × 2.5 = 52.75, rounded to 55"

    if modifier:
      modifier_name: string
      trigger_condition: string
      adjustment: string
      reason: string
      # "Shin splint history modifier: volume_cap × 0.9"
      # "Reason: Historical injury increases re-injury risk with high volume"

    if coach_rule:
      rule_id: string
      rule_text: string
      source_coach: string
      validation_date: date
      # "Rule: First-time marathoners get 20% longer base phase"
      # "Source: Coach Maria, validated 2026-01"

    if learned:
      model_version: string
      training_data_size: number
      confidence: number
      supporting_evidence: string
      # "Based on 847 similar runners, this adjustment improved outcomes by 12%"
      # "Confidence: 0.78"
      coach_approved: boolean  # Learned adjustments require coach sign-off

  alternatives_considered: []
    - option: string
      why_rejected: string
```

---

## MVP vs. Future State

### MVP (Launch)

| Component | Approach |
|-----------|----------|
| Periodization | Template-based, coach-validated |
| Load calculation | Formula-based (Daniels VDOT, standard progressions) |
| Personalization | Modifier rules — variables from coaches, conservative defaults for numbers |
| Daily adaptation | Rule-based (HRV low → reduce intensity) |
| Learning | None — but collect ALL outcome data |

### 6 Months Post-Launch

| Component | Evolution |
|-----------|-----------|
| Periodization | Same templates, but coach feedback refines them |
| Load calculation | Same formulas, but coefficients tuned from outcomes |
| Personalization | New modifier rules from coach feedback + outcome analysis |
| Daily adaptation | Patterns emerge from what works |
| Learning | Begin A/B testing rule modifications |

### 12+ Months

| Component | Evolution |
|-----------|-----------|
| Periodization | Data suggests template variations for runner types |
| Load calculation | Individual response modeling begins |
| Personalization | ML suggests new modifiers, coaches validate |
| Daily adaptation | Predictive models for readiness |
| Learning | Full feedback loop, continuous improvement |

---

## Key Questions for Coach Sessions

These questions are designed to extract actionable knowledge. Note that we may not get precise numbers — we'll get variables/factors, and numbers will need to come from data or very precise follow-up questions.

### Session 1: Template Validation

1. "Here's our default [marathon/half/10K] structure. What's wrong with it?"
2. "When do you deviate from this? Give me specific examples."
3. "What's the minimum time you'd accept for each race distance?"
4. "How do you decide phase lengths? What makes you extend or shorten a phase?"

### Session 2: Modifier Elicitation

**For each factor, ask:**
- "Does this change how you coach? How?"
- "Can you give me a specific example of an athlete where this mattered?"
- "If you had to put a number on it, how much would you adjust?"

**Factors to probe:**
- Age (especially 40+, 50+, 60+)
- Injury history (by type: stress fractures, soft tissue, joint)
- Training experience (months/years)
- Running background (former athlete vs. late starter)
- Personality type (aggressive vs. cautious)
- Life stress level
- Sleep quality
- Weight/BMI
- Previous training failures

### Session 3: Red Lines & Safety

1. "What would you NEVER do, regardless of what the runner wants?"
2. "What are the hard safety limits you always enforce?"
3. "When do you tell someone their goal is unrealistic? How do you have that conversation?"
4. "What warning signs make you intervene immediately?"

### Session 4: Failure Analysis

1. "Tell me about athletes whose training went wrong. What happened?"
2. "Looking back, what would you have done differently?"
3. "What patterns predict problems before they happen?"
4. "When a plan isn't working, how do you know? What do you look for?"

### Session 5: Uncertainty & Communication

1. "When you're unsure about a runner, what do you do?"
2. "How do you communicate uncertainty to athletes?"
3. "How do you handle runners who want to override your recommendations?"
4. "What do you tell someone when they're not ready for their goal?"

---

## The Modifier Challenge

**Reality check**: Coaches will likely give us:
- A list of variables/factors that matter
- Directional guidance ("reduce volume", "add recovery")
- Anecdotes and examples

They probably WON'T give us:
- Precise coefficients (×0.9, +1 day)
- Quantified thresholds (age > 47.3)
- Statistical confidence

**Solutions:**

1. **Start conservative** — Use literature-backed defaults where available (e.g., 10% rule)

2. **Use ranges** — "Reduce volume by 5-15% for injury history" and start at 10%

3. **Precise scenario questions** — Instead of "how much do you reduce for age?", ask:
   - "Runner A is 35, running 50km/week. What peak volume?"
   - "Runner B is 55, running 50km/week. What peak volume?"
   - Calculate the implicit modifier from their answers

4. **Track and learn** — The outcome data will eventually tell us what the right numbers are

---

## Open Questions

1. **How do we handle coach disagreement?** If 3 coaches say "reduce volume for shin splints" but disagree on how much, what's our default?

2. **What's the minimum viable modifier set?** Which factors are essential for MVP vs. nice-to-have?

3. **How do we validate learned adjustments?** What confidence threshold before we change a rule?

4. **Coach availability** — How much ongoing time can we realistically get from the 5 coaches?

---

## Related Documents

- [conversational-onboarding-architecture.md](conversational-onboarding-architecture.md) — How we collect runner data
- [onboarding-ux-flow.md](onboarding-ux-flow.md) — Visual UX for onboarding
- Domain research (Wassim) — Academic foundations for training science
