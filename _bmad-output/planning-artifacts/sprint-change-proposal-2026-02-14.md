# Sprint Change Proposal: UI-First Approach

**Date:** 2026-02-14
**Triggered by:** Story 2-7 completion revealing premature backend focus
**Proposed by:** Scrum Master (Bob)
**Status:** Pending Approval

---

## 1. Issue Summary

### Problem Statement

The current sprint structure prioritizes backend conversation phase wiring (stories 2-8 through 2-13) before the UI/UX is finalized. A complete UI prototype (`cadence-v3.jsx`) now exists that defines the exact visual design for all onboarding screens after the wearable connection prompt.

**The risk:** Building backend logic for UI that hasn't been visually validated.

**The opportunity:** The prototype provides pixel-perfect reference for 13 screens including streaming text, choice cards, MiniAnalysis (visible processing), RadarChart, ProgressionChart, CalendarWidget, DecisionAudit, and Paywall.

### Discovery Context

- Story 2-7 (Wearable Connection Mock) completed successfully
- User identified that remaining stories (2-8 to 2-13) focus on "phases" without clear UI specs
- Prototype `cadence-v3.jsx` (999 lines) provides the missing visual specification
- Brief `claude-code-brief.md` documents exact design patterns (28ms streaming, MiniAnalysis, etc.)

### What's Working (No Changes)

- Stories 2-1 through 2-7: All done or in review
- Backend infrastructure: Convex, AI SDK, tool-calling, streaming
- Early UI: Auth, consent, name confirmation, wearable prompt
- Design foundations: NativeWind, basic components

---

## 2. Impact Analysis

### Epic Impact

| Epic | Impact | Action Required |
|------|--------|-----------------|
| Epic 1 | None | No changes (complete) |
| Epic 2 | **High** | Rewrite stories 2-8 to 2-13 as UI-focused |
| Epic 3 | **Medium** | Resequence to UI-first with mock data |
| Epic 4 | **Medium** | Add Paywall UI story before integration |
| Epic 5 | None | No changes (deferred) |
| Epic 6 | None | No changes (deferred) |

### Artifact Impact

| Artifact | Impact |
|----------|--------|
| PRD | None - scope unchanged |
| Architecture | Minor - document mock-first pattern |
| UX Spec | Reference prototype as canonical source |
| Sprint Status | Story rewrites required |
| Epics.md | Story rewrites required |

---

## 3. Recommended Approach

**Direct Adjustment** - Rewrite remaining stories without rollback.

### Rationale

1. **No code rollback needed** - Stories 2-1 to 2-7 are valid and reusable
2. **Clear target** - Prototype defines exact UI specs
3. **Faster iteration** - Mock data allows visual validation before backend wiring
4. **Backend ready** - AI SDK infrastructure waits for polished UI
5. **User-requested** - Explicit preference for UI-first

### Risk Assessment

- **Effort:** Medium (story rewriting, no code loss)
- **Risk:** Low (clear prototype reference, existing foundation)
- **Timeline:** Neutral (same work, different order)

---

## 4. Detailed Change Proposals

### Epic 2: Conversational Profile Building

**Stories 2-1 to 2-7: UNCHANGED**

---

#### Story 2-8 (REWRITTEN)

**OLD:** Runner Profile Phase
**NEW:** Design Tokens & Animation Alignment

**Description:**
Align design system with prototype tokens (`cadence-v3.jsx` lines 4-16) and create animation primitives (lines 23-35).

**Files:**
- `apps/native/src/lib/design-tokens.ts` (create)
- `apps/native/src/lib/animations.ts` (create)
- `apps/native/tailwind.config.js` (extend)

**Acceptance Criteria:**
- [ ] Colors match prototype: lime #C8FF00, orange #FF8A00, red #FF5A5A, blue #5B9EFF
- [ ] 6 gray opacity levels configured
- [ ] Fonts: Outfit (coach), JetBrains Mono (data)
- [ ] Animation presets: springUp, fadeUp, fadeIn, scaleIn, pulseGlow
- [ ] Spring timing matches prototype feel

**Size:** S
**Depends on:** Nothing

---

#### Story 2-9 (REWRITTEN)

**OLD:** Goals Phase
**NEW:** Streaming Text & Cursor Polish

**Description:**
Match prototype StreamBlock exactly (lines 85-93). Every coach message must stream.

**Files:**
- `apps/native/src/components/app/onboarding/streaming-text.tsx` (modify)

**Acceptance Criteria:**
- [ ] Text streams at 28ms per character
- [ ] Blinking lime cursor during streaming (0.8s interval)
- [ ] Cursor disappears on completion
- [ ] Support delay parameter
- [ ] Support onDone callback

**Size:** S
**Depends on:** 2-8

---

#### Story 2-10 (REWRITTEN)

**OLD:** Schedule Availability Phase
**NEW:** FreeformInput Enhancement & MiniAnalysis Component

**Description:**
Build MiniAnalysis visible processing (lines 165-256) and enhanced FreeformInput (lines 261-352).

**Files:**
- `apps/native/src/components/app/onboarding/generative/MiniAnalysis.tsx` (create)
- `apps/native/src/components/app/onboarding/generative/FreeformInput.tsx` (create)

**Acceptance Criteria:**

MiniAnalysis:
- [ ] User message in bordered card
- [ ] Orange pulsing dot + "Analyzing..." during processing
- [ ] Monospace lines appear one by one (280ms each)
- [ ] Pattern extraction: goals, timelines, injuries, schedule
- [ ] Flags with ⚠ in orange
- [ ] "Added to profile ✓" in lime
- [ ] Border transitions to lime when complete

FreeformInput:
- [ ] Textarea with placeholder
- [ ] Quick-tap pill chips above
- [ ] Microphone button
- [ ] Character count
- [ ] Send button animates in when text present

**Size:** M
**Depends on:** 2-8, 2-9

---

#### Story 2-11 (REWRITTEN)

**OLD:** Health Injury Phase
**NEW:** Choice Cards & Confidence Badge

**Description:**
Polish Choice component (lines 128-149) and create ConfidenceBadge (lines 152-160).

**Files:**
- `apps/native/src/components/app/onboarding/generative/MultipleChoiceInput.tsx` (modify)
- `apps/native/src/components/app/onboarding/generative/ConfidenceBadge.tsx` (create)

**Acceptance Criteria:**

Choice Cards:
- [ ] 14px border radius, subtle border
- [ ] Selected: lime border, lime-tint background, checkmark animation
- [ ] Flagged state: red-tint for warnings
- [ ] Multi-select: square checkboxes (6px radius)
- [ ] Single-select: round radio (11px radius)
- [ ] Press feedback: scale(0.98)

ConfidenceBadge:
- [ ] HIGH (lime), MODERATE (orange), LOW (red)
- [ ] "DATA" or "SELF-REPORTED" label
- [ ] Pill shape with dot indicator
- [ ] Monospace text

**Size:** S
**Depends on:** 2-8

---

#### Story 2-12 (REWRITTEN)

**OLD:** Coaching Preferences Phase
**NEW:** Conversation Screen Flow (Mock Data)

**Description:**
Build all conversation phase screens with mock data, matching prototype (lines 473-678).

**Files:**
- `apps/native/src/components/app/onboarding/screens/SelfReportScreen.tsx`
- `apps/native/src/components/app/onboarding/screens/GoalsScreen.tsx`
- `apps/native/src/components/app/onboarding/screens/HealthScreen.tsx`
- `apps/native/src/components/app/onboarding/screens/StyleScreen.tsx`
- `apps/native/src/components/app/onboarding/screens/OpenQuestionScreen.tsx`

**Acceptance Criteria:**

SelfReport:
- [ ] Weekly km options: <20, 20-40, 40-60, 60+, unsure
- [ ] Days per week: numeric buttons 2-7
- [ ] Longest run: <10, 10-15, 15-20, 20+
- [ ] MODERATE badge after completion

Goals:
- [ ] Options: race, speed, base, return, health
- [ ] "Something else" triggers FreeformInput
- [ ] Freeform triggers MiniAnalysis
- [ ] Race follow-up: distance

Health:
- [ ] Multi-select: shin splints, IT band, plantar, knee, achilles, none
- [ ] Recovery style: quick, slow, push through
- [ ] "Push through" triggers warning card

Style:
- [ ] Coaching: tough love, encouraging, analytical, minimalist
- [ ] Challenge: consistency, pacing, time, stuck

OpenQuestion:
- [ ] FreeformInput with skip pills
- [ ] Freeform triggers MiniAnalysis

**ALL SCREENS USE MOCK DATA**

**Size:** L
**Depends on:** 2-9, 2-10, 2-11

---

#### Story 2-13 (REWRITTEN)

**OLD:** Final Check & Profile Completion
**NEW:** Transition & Loading States

**Description:**
Build transition screen (lines 683-699).

**Files:**
- `apps/native/src/components/app/onboarding/screens/TransitionScreen.tsx`

**Acceptance Criteria:**
- [ ] Coach: "Okay. I believe I have what I need..."
- [ ] Second message: "Give me a second..."
- [ ] Progress bar hits 100%
- [ ] Spinning loader (lime, 1s rotation)
- [ ] Auto-advance after ~2.5s

**Size:** S
**Depends on:** 2-9

---

### Epic 3: Plan Generation & Visualization (REVISED)

---

#### Story 3-1: RadarChart Component

**Focus:** Build with mock data first (prototype lines 704-726)

**Acceptance Criteria:**
- [ ] 6-axis spider chart
- [ ] Polygon animates from center (1.4s)
- [ ] Uncertain values orange with "?"
- [ ] Confirmed values lime
- [ ] Low values red
- [ ] MOCK data

**Size:** M
**Depends on:** 2-8

---

#### Story 3-2: ProgressionChart Component

**Focus:** Build with mock data first (prototype lines 755-818)

**Acceptance Criteria:**
- [ ] 10-week volume bars with hatching
- [ ] Intensity line overlay
- [ ] Recovery weeks in blue
- [ ] Bars animate growing
- [ ] Line draws on
- [ ] MOCK data

**Size:** M
**Depends on:** 2-8

---

#### Story 3-3: CalendarWidget Component

**Focus:** Build with mock data first (prototype lines 823-858)

**Acceptance Criteria:**
- [ ] 7-day grid
- [ ] Session cards (type, duration)
- [ ] Key sessions highlighted
- [ ] Rest days minimal
- [ ] MOCK data

**Size:** S
**Depends on:** 2-8

---

#### Story 3-4: Verdict Screen with DecisionAudit

**NEW** (combines old 3-6 and 3-7)

**Focus:** Build verdict display and accordion (prototype lines 864-913)

**Acceptance Criteria:**

Verdict:
- [ ] Large time range display
- [ ] Confidence % and range
- [ ] Lime/orange based on confidence

DecisionAudit:
- [ ] Collapsible rows
- [ ] Expand shows justification
- [ ] References user data
- [ ] MOCK data

**Size:** M
**Depends on:** 2-8, 3-1, 3-2, 3-3

---

#### Story 3-5: Full Screen Flow Integration (Mock Data)

**NEW STORY**

**Focus:** Connect all screens into testable flow

**Acceptance Criteria:**
- [ ] Complete flow navigable with mock data
- [ ] Both DATA and NO DATA paths testable
- [ ] Smooth transitions
- [ ] Progress bar correct throughout

**Size:** M
**Depends on:** 2-12, 2-13, 3-1, 3-2, 3-3, 3-4

---

#### Story 3-6: Backend Wiring - Conversation Phases

**NEW STORY** (absorbs old 2-8 to 2-13 backend content)

**Focus:** Wire polished UI to AI tool infrastructure

**Acceptance Criteria:**
- [ ] Screens work with AI tool calls
- [ ] Runner Object updates via mutations
- [ ] Real data flows

**Size:** L
**Depends on:** 3-5

---

#### Story 3-7: Backend Wiring - Plan Generation & Viz

**NEW STORY** (absorbs old 3-1 plan generation)

**Focus:** Wire visualization to real plan data

**Size:** L
**Depends on:** 3-6

---

#### Story 3-8: Adaptive Coaching Language

**UNCHANGED**

**Size:** M
**Depends on:** 3-7

---

### Epic 4: Onboarding Completion (REVISED)

---

#### Story 4-1: Paywall Screen UI

**NEW STORY** (split from old 4-2)

**Focus:** Build paywall UI (prototype lines 918-944)

**Acceptance Criteria:**
- [ ] Coach intro streams
- [ ] "7-DAY FREE TRIAL" badge
- [ ] 4 feature bullets (adapt per path)
- [ ] €9.99/month display
- [ ] "Start Free Trial" CTA
- [ ] "Maybe later" secondary
- [ ] MOCK initially

**Size:** S
**Depends on:** 2-8, 2-9

---

#### Stories 4-2, 4-3, 4-4: UNCHANGED

---

## 5. Implementation Handoff

### Scope Classification: **MODERATE**

This change requires:
- Backlog reorganization (SM to update sprint-status.yaml and epics.md)
- No architectural changes
- No code rollback

### Responsibilities

| Role | Responsibility |
|------|----------------|
| **Scrum Master** | Update sprint-status.yaml, epics.md with new story definitions |
| **Development Team** | Implement stories in new order using prototype as reference |
| **Product Owner** | Review completed UI screens for alignment with vision |

### Success Criteria

1. All UI components match `cadence-v3.jsx` prototype visually
2. Complete onboarding flow testable with mock data
3. Both DATA and NO DATA paths visually complete
4. Backend wiring stories have polished UI to connect to

---

## 6. Approval

**Changes proposed above require explicit approval before implementation.**

- [ ] **User approves** Sprint Change Proposal
- [ ] Scrum Master updates sprint-status.yaml
- [ ] Scrum Master updates epics.md
- [ ] Development proceeds with new story order

---

## References

- Prototype: `_bmad-output/brainstorming/cadence-v3.jsx`
- Design Brief: `_bmad-output/brainstorming/claude-code-brief.md`
- Current Sprint: `_bmad-output/implementation-artifacts/sprint-status.yaml`
- Current Epics: `_bmad-output/planning-artifacts/epics.md`
