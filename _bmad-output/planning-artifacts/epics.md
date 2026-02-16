---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
status: complete
inputDocuments:
  - prd-onboarding-mvp.md
  - architecture.md
  - ux-onboarding-flow-v6-2026-02-13.md
  - architecture-backend-v2.md
  - data-model-comprehensive.md
lastUpdated: 2026-02-16
changelog:
  - "2026-02-16: Major restructure - Reorganized epics by implementation priority"
  - "2026-02-16: Added AI Infrastructure Completion stories (server-side tool execution, agentic loop)"
  - "2026-02-16: Moved HealthKit/Wearables to Epic 4 (high priority)"
  - "2026-02-16: Split Backend Architecture (Epic 5) and Plan Generation (Epic 6)"
  - "2026-02-16: Trial/Paywall moved to Epic 9 (lowest priority)"
implementationStatus:
  completed: "1.1-3.5"
  next: "3.6"
---

# Cadence - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Cadence, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

## Implementation Status

| Stories | Status | Notes |
|---------|--------|-------|
| 1.1 - 3.5 | ✅ IMPLEMENTED | Auth, consent, UI components, mock flow working |
| 3.6+ | 🔴 NOT STARTED | Backend wiring, AI infrastructure |

**Current Gap:** The streaming UI works beautifully with mock data, but server-side tool execution is not implemented. Tool calls render in UI, user responds, but nothing saves to the database.

## Requirements Inventory

### Functional Requirements

**1. Account & Authentication**
- FR1: User can create a new account using social login (Apple, Google)
- FR2: User can authenticate to access the app
- FR4: User can view and accept terms of service and privacy policy during onboarding
- FR5: User can provide explicit consent for health data collection and usage

**2. Data Integration**
- FR6: User can connect their Strava account via OAuth to import running data
- FR7: User can grant HealthKit access (iOS) to import running/activity data
- FR8: User can grant Health Connect access (Android) to import running/activity data
- FR9: User can skip wearable/data connection and proceed with conversational-only flow
- FR10: System can retrieve historical running activity data from connected sources
- FR11: User can see status of data sync in progress
- FR12: User can retry data connection if initial sync fails

**3. Conversational Flow**
- FR13: User can engage in natural language conversation with the coach
- FR14: User can respond to coach questions via multiple choice selection
- FR15: User can respond to coach questions via free text input
- FR16: User can respond to coach questions via voice input
- FR17: User can confirm or edit information the coach has captured about them
- FR18: Coach can ask contextually relevant follow-up questions based on prior responses
- FR19: Coach can reference information from earlier in the conversation
- FR20: Coach can adapt question flow based on user's stated goals and situation
- FR21: User can see progress through the onboarding flow (data completeness indicator)

**4. Data Analysis & Insights**
- FR22: System can analyze connected wearable data to identify running patterns (volume, frequency, pace, rest days)
- FR23: System can detect potential issues in training patterns (easy pace too fast, insufficient rest, etc.)
- FR24: System can estimate current fitness level from available data
- FR25: System can build runner profile from conversational input when no wearable data available
- FR26: User can see the coach's analysis reasoning in real-time (Thinking Stream)
- FR27: User can collapse/expand the Thinking Stream display
- FR28: Coach can surface specific, personalized insights about the user's running

**5. Goal & Context Capture**
- FR29: User can specify a race goal with target distance and date
- FR30: User can specify a time target for their goal race
- FR31: User can indicate they have no specific race goal ("Open Training" mode)
- FR32: User can describe their running experience level
- FR33: User can specify their typical weekly running schedule and availability
- FR34: User can disclose injury history
- FR35: User can describe their comeback situation if returning from injury
- FR36: User can indicate non-performance goals (confidence rebuilding, consistency, etc.)
- FR37: User can specify their preferred coaching style

**6. Plan Generation & Presentation**
- FR38: System can generate a personalized training plan based on runner profile and goals
- FR39: System can generate a trust-rebuilding protocol for comeback runners
- FR40: System can generate an open training cycle for users without race goals
- FR41: User can see their runner profile visualized (RadarChart with key dimensions)
- FR42: User can see their training progression visualized (ProgressChart with volume/intensity over time)
- FR43: User can see their typical training week visualized (CalendarWidget)
- FR44: User can see projected outcomes (estimated race time, confidence level)
- FR45: User can see the reasoning behind each major coaching decision (Decision Audit Trail)
- FR46: User can expand individual decisions to see detailed justification
- FR47: Coach can explain plan decisions using language appropriate to the user's situation

**7. Progress Tracking**
- FR48: System can track Runner Object data completeness throughout onboarding
- FR49: System can persist partial onboarding progress locally
- FR50: User can resume onboarding from where they left off if interrupted
- FR51: System can indicate which data fields are still needed

**8. Monetization & Trial**
- FR52: User can view the paywall screen after completing onboarding
- FR53: User can see what they get with a trial subscription
- FR54: User can start a free trial
- FR55: User can see pricing and subscription options

**9. Error Handling & Recovery**
- FR56: User can see a friendly message when network is unavailable
- FR57: User can see reconnection status when connection is restored
- FR58: System can resume from last stable state after connection interruption
- FR59: User can see helpful guidance if permission is denied

### NonFunctional Requirements

**Performance**
- NFR-P1: Thinking Stream text should begin streaming <2 seconds after trigger
- NFR-P2: LLM responses should begin streaming <3 seconds after user input
- NFR-P3: Strava/HealthKit data sync should complete <15 seconds for typical user history
- NFR-P4: Visual charts (Radar, Progress, Calendar) should render <1 second after data available
- NFR-P5: App startup to first coach message <5 seconds

**Security**
- NFR-S1: All data transmission must use TLS 1.2+ encryption
- NFR-S2: OAuth tokens (Strava) must be stored securely using platform secure storage (Keychain/Keystore)
- NFR-S3: User health data must not be logged in plain text
- NFR-S4: Session tokens must expire and refresh appropriately
- NFR-S5: GDPR right to erasure must be technically feasible

**Integration**
- NFR-I1: Strava OAuth flow must handle token refresh gracefully (no user re-auth mid-session)
- NFR-I2: HealthKit/Health Connect access must respect permission state changes
- NFR-I3: LLM API failures must fallback gracefully with user-friendly error and retry option
- NFR-I4: Network interruptions must not lose user progress (local state persistence)

**Reliability**
- NFR-R1: Onboarding flow must handle network interruption (resume from last stable state)
- NFR-R2: Partial progress must persist across app restarts (Runner Object cached locally)
- NFR-R3: LLM streaming must handle partial responses (graceful recovery if stream breaks)

**Accessibility (MVP Baseline)**
- NFR-A1: Text must be readable at system font size settings
- NFR-A2: Interactive elements must have sufficient tap targets (minimum 44pt)
- NFR-A3: Color must not be the only indicator of information (color blindness support)

### Additional Requirements

**From Architecture:**
- NOT a greenfield project - existing monorepo with infrastructure (Expo SDK 54, NativeWind, Convex auth)
- Vercel AI SDK integration required for LLM tool-calling
- Runner Object schema needed in Convex (runners table)
- Strava OAuth via expo-auth-session, tokens stored in Convex
- HealthKit integration requires EAS Build (custom dev client, no Expo Go)
- Design system tokens must be extended for Thinking Stream, charts, gradients
- Tool registry: renderMultipleChoice, renderOpenInput, renderThinkingStream, renderConfirmation, renderConnectionCard, renderRadarChart, renderProgressChart, renderCalendarWidget
- Victory Native XL for charts, Rive for animations
- ~25 new files to create across backend and native app

**From UX V6:**
- Runner Object model with identity, physical, running, goals, schedule, health, coaching, connections, inferred data sections
- Generative UI paradigm: LLM calls tools that render UI components
- Additional UI tools: NumericInput, PaceInput, DateInput, DaySelector, SubscriptionCard
- Progress bar = data_completeness percentage of Runner Object
- 4-Act structure: Meeting + Data Bridge, Getting to Know Each Other, The Analysis, Revision & Handoff
- Name confirmation required from OAuth immediately
- Dual-path parity: wearable-connected AND no-data paths must feel equally polished
- Decision audit trail with expandable "why" sections
- Haptic feedback patterns: Arrival pulse, Insight tap, Question pause

**Regulatory/Compliance:**
- Wellness positioning only (not medical) - avoid FDA medical device classification
- GDPR compliance for EU users (explicit consent, right to erasure, data portability)
- CCPA/CPRA for California users (disclosure, opt-out, sensitive data handling)
- Comply with Apple HealthKit and Strava API terms of service
- Clear data usage consent during onboarding

**Platform Requirements:**
- React Native with Expo
- iOS 15+ (HealthKit features), Android 10+ (Health Connect APIs)
- Contextual permission requests with value explanation
- Graceful degradation if permissions denied
- Network required for onboarding (LLM, OAuth, sync)
- Local caching of partial progress

### FR Coverage Map

| FR | Epic | Description |
|----|------|-------------|
| FR1 | Epic 1 | Account creation (social login) |
| FR2 | Epic 1 | Authentication |
| FR4 | Epic 1 | Terms/privacy acceptance |
| FR5 | Epic 1 | Health data consent |
| FR6 | Epic 7 | Strava OAuth connection |
| FR7 | Epic 4 | HealthKit access (iOS) |
| FR8 | Epic 7 | Health Connect access (Android) |
| FR9 | Epic 4 | Skip wearable connection |
| FR10 | Epic 4 | Retrieve historical data |
| FR11 | Epic 4 | Data sync status |
| FR12 | Epic 7 | Retry data connection |
| FR13 | Epic 2 | Natural language conversation |
| FR14 | Epic 2 | Multiple choice responses |
| FR15 | Epic 2 | Free text responses |
| FR16 | Epic 2 | Voice input responses |
| FR17 | Epic 2 | Confirm/edit captured info |
| FR18 | Epic 3 | Contextual follow-up questions |
| FR19 | Epic 3 | Reference earlier conversation |
| FR20 | Epic 3 | Adapt question flow |
| FR21 | Epic 2 | Progress indicator |
| FR22 | Epic 5 | Analyze wearable data patterns |
| FR23 | Epic 5 | Detect training issues |
| FR24 | Epic 5 | Estimate fitness level |
| FR25 | Epic 3 | Build profile from conversation |
| FR26 | Epic 7 | Thinking Stream display |
| FR27 | Epic 7 | Collapse/expand Thinking Stream |
| FR28 | Epic 3 | Surface personalized insights |
| FR29 | Epic 2 | Specify race goal |
| FR30 | Epic 2 | Specify time target |
| FR31 | Epic 2 | Open Training mode |
| FR32 | Epic 2 | Describe experience level |
| FR33 | Epic 2 | Specify schedule/availability |
| FR34 | Epic 2 | Disclose injury history |
| FR35 | Epic 2 | Describe comeback situation |
| FR36 | Epic 2 | Non-performance goals |
| FR37 | Epic 2 | Preferred coaching style |
| FR38 | Epic 6 | Generate personalized plan |
| FR39 | Epic 6 | Trust-rebuilding protocol |
| FR40 | Epic 6 | Open training cycle |
| FR41 | Epic 3 | RadarChart visualization |
| FR42 | Epic 3 | ProgressChart visualization |
| FR43 | Epic 3 | CalendarWidget visualization |
| FR44 | Epic 6 | Projected outcomes |
| FR45 | Epic 6 | Decision Audit Trail |
| FR46 | Epic 3 | Expandable decision details |
| FR47 | Epic 3 | Appropriate coaching language |
| FR48 | Epic 1 | Track data completeness |
| FR49 | Epic 1 | Persist partial progress |
| FR50 | Epic 1 | Resume onboarding |
| FR51 | Epic 1 | Indicate missing fields |
| FR52 | Epic 9 | View paywall screen |
| FR53 | Epic 9 | See trial benefits |
| FR54 | Epic 9 | Start free trial |
| FR55 | Epic 9 | See pricing options |
| FR56 | Epic 8 | Network unavailable message |
| FR57 | Epic 8 | Reconnection status |
| FR58 | Epic 8 | Resume from stable state |
| FR59 | Epic 8 | Permission denied guidance |

## Epic List (Priority Order)

### Epic 1: Foundation & Runner Object Setup ✅ IMPLEMENTED
User can sign up/login via social login, confirm their identity, and the system can track their onboarding progress.
**FRs covered:** FR1, FR2, FR4, FR5, FR48, FR49, FR50, FR51

### Epic 2: Conversational Profile Building ✅ IMPLEMENTED
User can engage in natural conversation with the coach, answer questions via multiple modes, and build their complete runner profile (no-wearable path initially with mock buttons).
**FRs covered:** FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR25, FR28, FR29, FR30, FR31, FR32, FR33, FR34, FR35, FR36, FR37

### Epic 3: Plan Generation & Visualization 🔶 PARTIAL (3.1-3.5 done, 3.6+ pending)
User sees their personalized training plan with RadarChart, ProgressChart, CalendarWidget, and can explore the reasoning behind every decision. **UI components built with mock data first, then wired to backend.**
**FRs covered:** FR38, FR39, FR40, FR41, FR42, FR43, FR44, FR45, FR46, FR47

### Epic 4: Wearable Data Integration 🔴 HIGH PRIORITY
User can connect HealthKit (iOS), see their running data synced, and the backend stores it in Terra-aligned tables.
**FRs covered:** FR7, FR9, FR10, FR11

### Epic 5: Backend Data Architecture 🔴 HIGH PRIORITY
Backend infrastructure for storing historical data (Terra-aligned), calculating current state, and preparing data for plan generation.
**FRs covered:** FR22, FR23, FR24 (backend implementation)
**Architecture docs:** data-model-comprehensive.md, architecture-backend-v2.md

### Epic 6: Plan Generation Engine 🔴 HIGH PRIORITY
The AI-powered plan generator that uses Knowledge Base + Safeguards to create personalized, justified, safe training plans.
**FRs covered:** FR38, FR39, FR40, FR44, FR45 (backend implementation)

### Epic 7: Strava & Additional Wearable Connections 🟡 MEDIUM PRIORITY
User can connect Strava via OAuth, see Thinking Stream analysis, and sync data from additional providers.
**FRs covered:** FR6, FR8, FR12, FR26, FR27

### Epic 8: Error Handling & Resilience 🟡 MEDIUM PRIORITY
User experiences graceful handling of network issues, permission denials, and can always resume where they left off.
**FRs covered:** FR56, FR57, FR58, FR59

### Epic 9: Trial & Paywall ⚪ LOW PRIORITY (MVP non-essential)
User can view the paywall, start a free trial, and transition to the home screen.
**FRs covered:** FR52, FR53, FR54, FR55

---

## Epic 1: Foundation & Runner Object Setup ✅ IMPLEMENTED

User can sign up/login via social login, confirm their identity, and the system can track their onboarding progress.

### Story 1.1: Runner Object Schema & CRUD ✅

As a developer,
I want the Runner Object data model created in Convex,
So that all onboarding data can be stored and tracked consistently.

**Acceptance Criteria:**

**Given** the Convex backend is running
**When** the schema is deployed
**Then** a `runners` table exists with fields for identity, physical, running, goals, schedule, health, coaching, connections, and inferred data sections
**And** basic CRUD mutations exist: createRunner, updateRunner, getRunner
**And** an index exists on runners by userId

---

### Story 1.2: Social Login Integration ✅

As a new user,
I want to sign up using Apple or Google,
So that I can quickly create an account without managing another password.

**Acceptance Criteria:**

**Given** the user is on the login/signup screen
**When** they tap "Continue with Apple"
**Then** the Apple Sign-In flow is initiated
**And** upon successful auth, a user record is created in Convex
**And** the user's name is extracted from the OAuth payload and stored
**And** the user is redirected to onboarding

**Given** the user is on the login/signup screen
**When** they tap "Continue with Google"
**Then** the Google Sign-In flow is initiated
**And** upon successful auth, a user record is created in Convex
**And** the user's name is extracted from the OAuth payload and stored
**And** the user is redirected to onboarding

**Given** a user already has an account with that email
**When** they sign in with social login
**Then** they are logged into their existing account (account linking)

---

### Story 1.3: Onboarding Consent Flow ✅

As a new user,
I want to review and accept terms of service and privacy policy,
So that I understand my rights and obligations before using the app.

**Acceptance Criteria:**

**Given** the user has completed authentication
**When** they haven't yet accepted terms
**Then** they are shown a consent screen before proceeding to onboarding

**Given** the user is on the consent screen
**When** they tap to view Terms of Service
**Then** the full terms are displayed (in-app or web view)

**Given** the user is on the consent screen
**When** they tap to view Privacy Policy
**Then** the full privacy policy is displayed (in-app or web view)

**Given** the user has reviewed the terms
**When** they tap "I Accept" / confirm acceptance
**Then** the acceptance is recorded with timestamp in their user record
**And** they proceed to the health data consent screen

---

### Story 1.4: Health Data Consent ✅

As a new user,
I want to explicitly consent to health data collection,
So that I understand how my running and fitness data will be used.

**Acceptance Criteria:**

**Given** the user has accepted terms of service
**When** they reach the health data consent screen
**Then** they see a clear explanation of what health data will be collected
**And** they see how the data will be used (personalization, improvement)
**And** they see their rights (GDPR/CCPA: access, deletion, portability)

**Given** the user is on the health data consent screen
**When** they tap "I Consent"
**Then** their explicit consent is recorded with timestamp
**And** they proceed to the onboarding flow (name confirmation)

**Given** the user is on the health data consent screen
**When** they tap "Learn More" or equivalent
**Then** they see expanded details about data handling practices

---

### Story 1.5: Name Confirmation Screen ✅

As a new user,
I want the coach to confirm my name from OAuth,
So that the experience feels personal from the first moment.

**Acceptance Criteria:**

**Given** the user has completed consent flows
**When** they enter the onboarding flow
**Then** the screen shows "Hey! You're {name}, right?" with name from OAuth

**Given** the user sees their name displayed
**When** they tap "That's me"
**Then** identity.name_confirmed is set to true in Runner Object
**And** the progress bar appears showing ~5% complete
**And** they proceed to the next onboarding scene

**Given** the user sees their name displayed
**When** they tap "Actually, it's..."
**Then** a text input appears to enter their preferred name
**And** upon submission, identity.name is updated
**And** identity.name_confirmed is set to true
**And** they proceed to the next onboarding scene

---

### Story 1.6: Progress Tracking & Persistence ✅

As a user going through onboarding,
I want my progress to be saved automatically,
So that I can resume where I left off if I close the app.

**Acceptance Criteria:**

**Given** the user is in the onboarding flow
**When** any Runner Object field is updated
**Then** data_completeness percentage is recalculated
**And** the progress bar UI updates to reflect the new percentage

**Given** the user has partially completed onboarding
**When** they close the app and reopen later
**Then** their Runner Object state is persisted
**And** they resume from where they left off (not from the beginning)

**Given** the user has partially completed onboarding
**When** they view the progress indicator
**Then** they see a percentage representing fields_filled / required_fields
**And** they can understand how much remains

**Given** the onboarding flow needs certain fields
**When** required fields are missing
**Then** the system can identify and indicate which fields are still needed
**And** the coach can adapt questions based on what's missing

---

## Epic 2: Conversational Profile Building ✅ IMPLEMENTED

User can engage in natural conversation with the coach, answer questions via multiple modes, and build their complete runner profile (no-wearable path initially with mock buttons).

### Story 2.1: AI SDK Integration & Streaming Infrastructure ✅

As a developer,
I want the LLM integration set up with Vercel AI SDK via Convex HTTP Actions,
So that the coach can have streaming conversations with tool-calling capabilities.

**Acceptance Criteria:**

**Given** the Convex backend is configured
**When** an AI streaming endpoint is called
**Then** it connects to OpenAI via Vercel AI SDK
**And** responses stream back to the client via SSE
**And** the endpoint supports tool definitions for generative UI

**Given** a conversation is in progress
**When** the LLM generates a response
**Then** text streams to the client in real-time (<3 seconds to first token per NFR-P2)
**And** tool calls are parsed and returned with their arguments
**And** conversation history is maintained for context

**Given** the AI makes a tool call
**When** the tool execution completes
**Then** the result is persisted to the Runner Object as appropriate
**And** the conversation continues with the tool result in context

---

### Story 2.2: Generative UI Tool Renderer ✅

As a user,
I want to see dynamic UI components rendered based on the coach's responses,
So that I can interact naturally through the conversation.

**Acceptance Criteria:**

**Given** a message contains tool call parts
**When** the message is rendered
**Then** each tool part is mapped to its corresponding UI component via switch statement
**And** components render inline with the conversation flow

**Given** a tool is in "streaming" state
**When** it is being processed
**Then** an appropriate loading indicator is shown

**Given** a tool call completes
**When** the result is available
**Then** the component updates to show the interactive state
**And** the user can interact with it (select options, type, etc.)

**Given** the coach sends text before a tool call
**When** the message renders
**Then** the text streams with haptic feedback (phrase by phrase)
**And** the tool UI appears after the text completes

---

### Story 2.3: Multiple Choice Input Tool ✅

As a user,
I want to respond to coach questions by tapping options,
So that I can quickly answer structured questions.

**Acceptance Criteria:**

**Given** the coach calls the renderMultipleChoice tool
**When** the component renders
**Then** all options are displayed as tappable cards/buttons
**And** optional description text is shown below each option
**And** the question text (if provided) is displayed above options

**Given** allowMultiple is false
**When** the user taps an option
**Then** that option is selected and highlighted
**And** the selection is submitted to the conversation
**And** the Runner Object field (targetField) is updated

**Given** allowMultiple is true
**When** the user taps multiple options
**Then** all selected options are highlighted
**And** a "Done" or confirm button appears to submit

**Given** allowFreeText is true
**When** the user wants a custom answer
**Then** an "Other" option is available
**And** tapping it reveals a text input for custom response

**Given** allowSkip is true
**When** the user wants to skip
**Then** a skip option is displayed with custom skipLabel
**And** tapping it advances without filling the field

---

### Story 2.4: Open Text Input Tool ✅

As a user,
I want to type free-form responses to the coach,
So that I can share details that don't fit predefined options.

**Acceptance Criteria:**

**Given** the coach calls the renderOpenInput tool
**When** the component renders
**Then** a text input field is displayed with the placeholder text
**And** the prompt (if provided) is shown above

**Given** suggestedResponses are provided
**When** the component renders
**Then** quick-tap chips are shown (e.g., "No, that's all")
**And** tapping a chip submits that response

**Given** the user types a response
**When** they submit (tap send or press enter)
**Then** the response is sent to the conversation
**And** the LLM parses it to update relevant Runner Object fields

**Given** the input supports voice
**When** allowVoice is true
**Then** a microphone button is displayed
**And** the user can tap to record voice input

---

### Story 2.5: Voice Input Capability ✅

As a user,
I want to speak my responses to the coach,
So that I can interact hands-free or express myself more naturally.

**Acceptance Criteria:**

**Given** a tool has allowVoice enabled
**When** the user taps the microphone button
**Then** voice recording begins with visual feedback
**And** the device requests microphone permission if not granted

**Given** the user is recording voice
**When** they stop recording (tap again or pause)
**Then** the audio is transcribed to text
**And** the transcription is shown for review/edit
**And** the user can confirm or re-record

**Given** transcription completes
**When** the user confirms
**Then** the text is submitted as their response
**And** the conversation continues

**Given** microphone permission is denied
**When** the user tries to use voice input
**Then** a helpful message explains how to enable permission
**And** they can still use text input as fallback

---

### Story 2.6: Confirmation Card Tool ✅

As a user,
I want to confirm or correct information the coach captured,
So that my profile accurately reflects my situation.

**Acceptance Criteria:**

**Given** the coach calls the renderConfirmation tool
**When** the component renders
**Then** the statement to confirm is displayed prominently
**And** confirm and deny buttons are shown with their labels

**Given** the user taps the confirm button
**When** the confirmation is submitted
**Then** the targetField is marked as confirmed
**And** the conversation continues

**Given** the user taps the deny button
**When** they want to correct information
**Then** an appropriate edit interface appears (text input or options)
**And** they can provide the correct information
**And** the Runner Object is updated with the correction

---

### Story 2.7: Wearable Connection Mock (Skip Path) ✅

As a user without wearable data,
I want to skip the wearable connection and proceed conversationally,
So that I can still use the app without connected devices.

**Acceptance Criteria:**

**Given** the user reaches the wearable connection prompt
**When** they see the ConnectionCard
**Then** mock provider buttons are displayed (Strava, Apple Watch, etc.)
**And** a "I'll do this later" skip option is prominently available

**Given** the user taps a wearable provider (mock)
**When** the mock flow executes
**Then** a brief loading state is shown
**And** the flow proceeds to skip path (simulating "no data found" or skip)

**Given** the user taps "I'll do this later"
**When** the skip is confirmed
**Then** connections.strava_connected and connections.wearable_connected are set to false
**And** the coach responds: "No problem. I'll learn as we go."
**And** the conversation proceeds to profile building questions

---

### Story 2.8: Design Tokens & Animation Alignment ✅

*REVISED 2026-02-14: UI-first approach per sprint-change-proposal-2026-02-14.md*
*Reference: cadence-v3.jsx lines 4-35*

As a developer,
I want the design system aligned with the prototype tokens,
So that all UI components match the target visual design.

**Acceptance Criteria:**

**Given** the prototype defines specific design tokens
**When** the design system is configured
**Then** colors match: lime #C8FF00, orange #FF8A00, red #FF5A5A, blue #5B9EFF
**And** 6 gray opacity levels are configured (0.92, 0.70, 0.45, 0.25, 0.10, 0.06)
**And** fonts are configured: Outfit (coach voice), JetBrains Mono (data/monospace)

**Given** the prototype uses specific animations
**When** animation primitives are created
**Then** springUp animation overshoots then settles (0.5s ease)
**And** fadeUp animation moves up 14px while fading in
**And** scaleIn animation scales from 0.95 to 1.0
**And** pulseGlow animation cycles opacity for loading indicators
**And** all animations are exported as reusable presets

**Files:** `apps/native/src/lib/design-tokens.ts`, `apps/native/src/lib/animations.ts`, `tailwind.config.js`

---

### Story 2.9: Streaming Text & Cursor Polish ✅

*REVISED 2026-02-14: UI-first approach per sprint-change-proposal-2026-02-14.md*
*Reference: cadence-v3.jsx lines 41-93 (useStream hook, StreamBlock component)*

As a user,
I want coach messages to stream character by character with a blinking cursor,
So that the coach feels like it's speaking, not appearing.

**Acceptance Criteria:**

**Given** a coach message is rendered
**When** streaming begins
**Then** text appears at exactly 28ms per character
**And** a blinking lime cursor (#C8FF00) follows the text
**And** cursor blinks at 0.8s interval with sharp on/off (not fade)

**Given** streaming completes
**When** all characters are displayed
**Then** the cursor disappears
**And** onDone callback fires if provided

**Given** a delay parameter is specified
**When** the component mounts
**Then** streaming waits for the delay before starting

**Given** multiple StreamBlocks are on screen
**When** they have sequential delays
**Then** they stream one after another naturally

**Files:** `apps/native/src/components/app/onboarding/streaming-text.tsx`

---

### Story 2.10: FreeformInput Enhancement & MiniAnalysis Component ✅

*REVISED 2026-02-14: UI-first approach per sprint-change-proposal-2026-02-14.md*
*Reference: cadence-v3.jsx lines 165-352 (MiniAnalysis, FreeformInput)*

As a user,
I want to see visible processing when I submit freeform text,
So that I trust the AI is actually analyzing what I said.

**Acceptance Criteria:**

**MiniAnalysis Component:**

**Given** the user submits freeform text
**When** analysis begins
**Then** the user's message displays in a bordered card
**And** an orange pulsing dot appears with "Analyzing..." label
**And** monospace terminal lines appear one by one (280ms per line)

**Given** analysis is processing
**When** patterns are detected in the text
**Then** relevant extractions are shown (race goals, timelines, injuries, schedule)
**And** important context is flagged with ⚠ markers in orange

**Given** analysis completes
**When** processing finishes
**Then** "Added to profile ✓" appears in lime
**And** container border transitions from gray to lime
**And** coach streaming response follows

**FreeformInput Component:**

**Given** the user sees a freeform input
**When** the component renders
**Then** a textarea with placeholder text is displayed
**And** quick-tap pill chips appear above (e.g., "No, that covers it")
**And** a microphone button is available for voice input
**And** character count displays below

**Given** the user types text
**When** text is present
**Then** a send button animates in (scaleIn)
**And** tapping sends the text and triggers MiniAnalysis

**Given** the user taps a pill chip
**When** the chip is selected
**Then** that response submits immediately
**And** MiniAnalysis may or may not fire depending on content

**Files:** `apps/native/src/components/app/onboarding/generative/MiniAnalysis.tsx`, `apps/native/src/components/app/onboarding/generative/FreeformInput.tsx`

---

### Story 2.11: Choice Cards & Confidence Badge ✅

*REVISED 2026-02-14: UI-first approach per sprint-change-proposal-2026-02-14.md*
*Reference: cadence-v3.jsx lines 128-160 (Choice, Badge)*

As a user,
I want polished selection cards and confidence indicators,
So that interactions feel premium and data quality is clear.

**Acceptance Criteria:**

**Choice Cards:**

**Given** choices are displayed
**When** rendered
**Then** cards have 14px border radius with subtle gray border
**And** unselected state shows transparent background

**Given** the user selects a choice
**When** selection occurs
**Then** lime border appears with lime-tinted background
**And** checkmark animates in (checkPop animation)
**And** haptic feedback fires

**Given** a choice is flagged (e.g., "push through" recovery)
**When** that option is selected
**Then** background tints red instead of lime
**And** description shows warning styling

**Given** multi-select mode is enabled
**When** checkboxes render
**Then** they use square corners (6px radius)

**Given** single-select mode is enabled
**When** radio buttons render
**Then** they use round corners (11px radius)

**Given** the user presses a choice
**When** touch is active
**Then** card scales to 0.98 for tactile feedback

**ConfidenceBadge Component:**

**Given** confidence level is HIGH
**When** badge renders
**Then** it displays in lime (#C8FF00) with "DATA" label

**Given** confidence level is MODERATE
**When** badge renders
**Then** it displays in orange (#FF8A00) with "SELF-REPORTED" label

**Given** confidence level is LOW
**When** badge renders
**Then** it displays in red (#FF5A5A)

**Files:** `apps/native/src/components/app/onboarding/generative/MultipleChoiceInput.tsx`, `apps/native/src/components/app/onboarding/generative/ConfidenceBadge.tsx`

---

### Story 2.12: Conversation Screen Flow (Mock Data) ✅

*REVISED 2026-02-14: UI-first approach per sprint-change-proposal-2026-02-14.md*
*Reference: cadence-v3.jsx lines 473-678 (SelfReport, Goals, Health, StyleScr, OpenQuestion)*

As a user,
I want to experience the complete conversation flow visually,
So that the UX can be validated before backend wiring.

**Acceptance Criteria:**

**SelfReport Screen (NO DATA path):**

**Given** the user skipped wearable connection
**When** SelfReport screen renders
**Then** coach streams: "No worries — I can work with what you tell me..."
**And** weekly km question shows: <20km, 20-40km, 40-60km, 60km+, I'm not sure
**And** days per week shows numeric buttons 2-7
**And** longest run shows: <10km, 10-15km, 15-20km, 20km+
**And** MODERATE confidence badge appears after completion

**Goals Screen:**

**Given** the user reaches goals
**When** screen renders
**Then** coach streams: "What are you working toward?"
**And** options display: Training for a race, Getting faster, Building mileage, Getting back in shape, General health
**And** "Something else — let me explain" triggers FreeformInput
**And** freeform submission triggers MiniAnalysis
**And** selecting "race" shows distance follow-up

**Health Screen:**

**Given** the user reaches health
**When** screen renders
**Then** multi-select injury list displays: Shin splints, IT band, Plantar fasciitis, Knee pain, Achilles issues, None
**And** recovery style follow-up shows: bounce back quick, takes a while, push through
**And** selecting "push through" triggers red-tinted warning card with coaching acknowledgment

**Style Screen:**

**Given** the user reaches coaching preferences
**When** screen renders
**Then** coaching style options display: Tough love, Encouraging, Analytical, Minimalist
**And** biggest challenge shows: Consistency, Pacing, Time, Stuck
**And** progress bar approaches completion

**OpenQuestion Screen:**

**Given** the user reaches final check
**When** screen renders
**Then** coach streams: "Anything else you want me to know?"
**And** FreeformInput displays with pills: "No, that covers it", "One more thing..."
**And** freeform submission triggers MiniAnalysis
**And** skip pill advances directly

**All screens use MOCK DATA - no backend calls**

**Files:** `apps/native/src/components/app/onboarding/screens/SelfReportScreen.tsx`, `GoalsScreen.tsx`, `HealthScreen.tsx`, `StyleScreen.tsx`, `OpenQuestionScreen.tsx`

---

### Story 2.13: Transition & Loading States ✅

*REVISED 2026-02-14: UI-first approach per sprint-change-proposal-2026-02-14.md*
*Reference: cadence-v3.jsx lines 683-699 (TransitionScr)*

As a user,
I want a polished transition between conversation and plan presentation,
So that the plan generation feels intentional and exciting.

**Acceptance Criteria:**

**Given** the conversation flow completes
**When** transition screen appears
**Then** coach streams: "Okay. I believe I have what I need to draft your game plan."
**And** second message streams: "Give me a second to put this together..."

**Given** messages have streamed
**When** loading state begins
**Then** progress bar animates to 100%
**And** spinning loader appears (lime border-top on circle, 1s rotation)
**And** loader is centered on screen

**Given** loading is complete
**When** ~2.5s has elapsed
**Then** screen auto-advances to visualization (RadarChart)
**And** transition is smooth fade

**Files:** `apps/native/src/components/app/onboarding/screens/TransitionScreen.tsx`

---

## Epic 3: Plan Generation & Visualization

*REVISED 2026-02-14: UI-first approach per sprint-change-proposal-2026-02-14.md*

User sees their personalized training plan with RadarChart, ProgressChart, CalendarWidget, and can explore the reasoning behind every decision. **UI components built with mock data first, then wired to backend.**

### Story 3.1: RadarChart Component ✅

*Reference: cadence-v3.jsx lines 704-750 (RadarSVG, RadarScreen)*

As a user,
I want to see my runner profile as a visual radar chart,
So that I understand my strengths and areas for improvement.

**Acceptance Criteria:**

**Given** the RadarChart component is rendered
**When** data is provided (mock initially)
**Then** a 6-axis spider chart displays: Endurance, Speed, Recovery, Consistency, Injury Risk, Race Ready
**And** polygon fills from center outward with eased animation (1.4s duration)
**And** grid lines appear at 25%, 50%, 75%, 100%

**Given** the animation completes
**When** values are displayed
**Then** axis labels position around perimeter
**And** value labels show percentage with count-up animation
**And** uncertain values (NO DATA path) show in orange with "?" suffix
**And** confirmed values (DATA path) show in lime
**And** low values (<50) show in red

**Given** coach commentary is needed
**When** RadarScreen displays
**Then** coach streams explanation of strengths and weaknesses
**And** ConfidenceBadge shows HIGH (DATA) or MODERATE (NO DATA)

**Uses MOCK DATA initially**

**Files:** `apps/native/src/components/app/onboarding/viz/RadarChart.tsx`, `apps/native/src/components/app/onboarding/screens/RadarScreen.tsx`

---

### Story 3.2: ProgressionChart Component ✅

*Reference: cadence-v3.jsx lines 755-818 (ProgressionScreen)*

As a user,
I want to see my training volume progression over the plan duration,
So that I understand how my training will build.

**Acceptance Criteria:**

**Given** the ProgressionChart component is rendered
**When** data is provided (mock initially)
**Then** 10-week view displays with volume bars
**And** bars animate growing from bottom (growBar animation, 0.6s each with stagger)
**And** hatched/lined fill pattern appears inside bars

**Given** the chart includes intensity
**When** the line renders
**Then** intensity line overlays bars as polyline with dots at each week
**And** line draws on with stroke-dashoffset animation (1.2s)

**Given** recovery weeks are marked
**When** weeks 4, 7, 10 render
**Then** they display in blue tint (#5B9EFF)
**And** "Recovery" or "Race" label appears below

**Given** the legend is shown
**When** chart displays
**Then** legend shows: VOLUME (bar), INTENSITY (line), RECOVERY (blue)

**Given** coach commentary is needed
**When** ProgressionScreen displays
**Then** coach streams explanation of build-rest-build pattern
**And** DATA path emphasizes deliberate recovery dips
**And** NO DATA path explains conservative start with ramp potential

**Uses MOCK DATA initially**

**Files:** `apps/native/src/components/app/onboarding/viz/ProgressionChart.tsx`, `apps/native/src/components/app/onboarding/screens/ProgressionScreen.tsx`

---

### Story 3.3: CalendarWidget Component ✅

*Reference: cadence-v3.jsx lines 823-858 (CalendarScreen)*

As a user,
I want to see my typical training week visualized,
So that I understand what each day looks like.

**Acceptance Criteria:**

**Given** the CalendarWidget component is rendered
**When** data is provided (mock initially)
**Then** 7-column grid displays (Mon-Sun)
**And** header shows "Typical Week — Build Phase"

**Given** sessions are displayed
**When** cards render
**Then** each shows session type (Tempo, Easy, Intervals, Long Run, Rest)
**And** duration displays below type
**And** cards animate in with scaleIn (0.3s stagger)

**Given** key sessions are marked
**When** Mon, Wed, Sun render
**Then** they show lime indicator dot
**And** lime border highlights the card

**Given** rest days display
**When** Thu, Sat render
**Then** minimal styling with "Rest" label
**And** no duration shown

**Given** coach commentary is needed
**When** CalendarScreen displays
**Then** coach streams: "Three key sessions... The rest is recovery. And yes — two actual rest days. Non-negotiable."

**Uses MOCK DATA initially**

**Files:** `apps/native/src/components/app/onboarding/viz/CalendarWidget.tsx`, `apps/native/src/components/app/onboarding/screens/CalendarScreen.tsx`

---

### Story 3.4: Verdict Screen with DecisionAudit ✅

*Reference: cadence-v3.jsx lines 864-913 (Verdict)*

As a user,
I want to see projected outcomes and understand the reasoning behind decisions,
So that I trust and own my training plan.

**Acceptance Criteria:**

**Verdict Display:**

**Given** the Verdict screen renders
**When** coach introduction streams
**Then** DATA path shows: "So here's where I think you land."
**And** NO DATA path shows: "Based on what you've told me, here's my best estimate."

**Given** projected time displays
**When** animation completes
**Then** large monospace time range appears (e.g., "1:43 — 1:46")
**And** confidence percentage shows (e.g., "75%")
**And** range shows (e.g., "±90s")
**And** DATA path: tighter range, lime tint, higher confidence
**And** NO DATA path: wider range (±6 min), orange tint, 50% confidence with explanation

**DecisionAudit Accordion:**

**Given** Decision Audit section displays
**When** header renders
**Then** "Decision Audit" label appears

**Given** decision rows display
**When** collapsed
**Then** each shows question: "Why 8% volume cap?", "Why two rest days?", "Why slow down easy pace?"
**And** arrow indicator shows collapsed state

**Given** user taps a decision row
**When** it expands
**Then** justification reveals with smooth animation
**And** justification references user data (e.g., "Shin splint history + push through recovery = higher risk")

**Uses MOCK DATA initially**

**Files:** `apps/native/src/components/app/onboarding/viz/DecisionAudit.tsx`, `apps/native/src/components/app/onboarding/screens/VerdictScreen.tsx`

---

### Story 3.5: Full Screen Flow Integration (Mock Data) ✅

*NEW STORY - validates complete UX before backend wiring*

As a developer,
I want to test the complete onboarding flow with mock data,
So that UX can be validated before backend integration.

**Acceptance Criteria:**

**Given** the mock flow is configured
**When** developer navigates through
**Then** complete flow is testable: Welcome → Wearable → SelfReport → Goals → Health → Style → OpenQuestion → Transition → Radar → Progression → Calendar → Verdict → Paywall

**Given** both paths need testing
**When** mock toggle is used
**Then** DATA path shows: high confidence, tight ranges, lime indicators
**And** NO DATA path shows: moderate confidence, wide ranges, orange uncertain markers

**Given** transitions between screens
**When** navigation occurs
**Then** smooth fade/slide transitions work correctly
**And** progress bar updates accurately across flow

**Given** visual regression is needed
**When** screens are captured
**Then** all screens render consistently for comparison

**Files:** `apps/native/src/components/app/onboarding/OnboardingFlowMock.tsx`, navigation configuration

---

### Story 3.6: Server-Side Tool Execution & Agentic Loop 🔴 NOT STARTED

*CRITICAL: This is the main gap preventing the onboarding from working*

As a developer,
I want tool calls to execute server-side and results to flow back to the LLM,
So that the conversation actually persists data and continues intelligently.

**Acceptance Criteria:**

**Given** the LLM makes a tool call (e.g., renderMultipleChoice)
**When** the user submits their response
**Then** the frontend POSTs the tool result to `/api/ai/tool-result` endpoint
**And** the backend receives: { conversationId, toolCallId, toolName, targetField, value }

**Given** a tool result is received
**When** the backend processes it
**Then** the tool handler executes the appropriate logic:
  - For data-collecting tools: update Runner Object via Convex mutation
  - For confirmation tools: mark field as confirmed
  - For connection tools: trigger OAuth flow or skip

**Given** tool execution completes
**When** the result is ready
**Then** the result is formatted according to Vercel AI SDK expectations
**And** the result is sent back through the SSE stream
**And** the AI SDK re-invokes the LLM with the tool result in context

**Given** the LLM receives the tool result
**When** it generates the next response
**Then** the agentic loop continues (either more text, more tools, or finish)
**And** up to 5 rounds of tool calling are supported (per existing stepCountIs(5))

**Given** a tool execution fails
**When** an error occurs
**Then** the error is logged
**And** a graceful error response is sent to the client
**And** the conversation can recover

**Files:**
- `packages/backend/convex/ai/http_action.ts` (enhance with tool execution)
- `packages/backend/convex/ai/tool-handlers.ts` (NEW - tool execution logic)
- `apps/native/src/hooks/use-ai-chat.ts` (ensure tool result submission)

---

### Story 3.7: Tool Result Handler & Runner Object Updates 🔴 NOT STARTED

As a developer,
I want tool results to update the Runner Object with proper field mapping,
So that user responses are persisted to their profile.

**Acceptance Criteria:**

**Given** a tool result with targetField is received
**When** the handler processes it
**Then** the targetField path is mapped to the Runner Object schema:
  - `running.experienceLevel` → runners.running.experienceLevel
  - `goals.goalType` → runners.goals.goalType
  - `schedule.availableDays` → runners.schedule.availableDays
  - etc.

**Given** a value needs transformation
**When** the handler processes it
**Then** values are transformed appropriately:
  - Numeric strings → numbers
  - Pace strings → seconds per km
  - Date strings → timestamps
  - Arrays → validated arrays

**Given** the Runner Object is updated
**When** the mutation completes
**Then** `conversationState.dataCompleteness` is recalculated
**And** `conversationState.fieldsMissing` is updated
**And** `conversationState.currentPhase` advances if requirements met

**Given** provenance tracking is needed
**When** a field is updated
**Then** the source is recorded: "user_input"
**And** the inputMethod is recorded: "selection" | "text" | "voice"
**And** the questionAsked is recorded for justification tracing
**And** timestamp is recorded

**Given** validation fails
**When** an invalid value is received
**Then** the error is handled gracefully
**And** the user is prompted to correct

**Files:**
- `packages/backend/convex/ai/tool-handlers.ts`
- `packages/backend/convex/runners/mutations.ts` (updateRunnerField mutation)
- `packages/backend/convex/ai/field-mappings.ts` (NEW - field mapping registry)

---

### Story 3.8: Conversation Phase Management 🔴 NOT STARTED

As a developer,
I want the conversation to progress through phases based on data completeness,
So that the coach knows what to ask next and when to generate the plan.

**Acceptance Criteria:**

**Given** phase requirements are defined
**When** the system evaluates progress
**Then** phases are: intro → data_bridge → profile → goals → schedule → health → coaching → analysis → complete

**Given** the intro phase
**When** identity.nameConfirmed is true
**Then** phase advances to data_bridge

**Given** the data_bridge phase
**When** wearable decision is made (connected OR skipped)
**Then** phase advances to profile

**Given** the profile phase (NO DATA path)
**When** required fields are filled: experienceLevel, currentFrequency, currentVolume
**Then** phase advances to goals

**Given** the profile phase (DATA path)
**When** wearable data is synced AND user confirms inferred values
**Then** phase advances to goals

**Given** subsequent phases
**When** their required fields are complete
**Then** phases advance automatically

**Given** analysis phase is reached
**When** all required fields are filled
**Then** readyForPlan becomes true
**And** plan generation is triggered

**Given** the system prompt is assembled
**When** the coach generates responses
**Then** phase-specific instructions guide the conversation
**And** the coach knows which fields to collect next

**Files:**
- `packages/backend/convex/ai/phase-manager.ts` (NEW)
- `packages/backend/convex/ai/prompts/onboarding_coach.ts` (enhance with phase context)

---

### Story 3.9: Backend Wiring - Visualization Data 🔴 NOT STARTED

As a user,
I want the visualization screens to show my actual profile and plan data,
So that the charts and projections are personalized to me.

**Acceptance Criteria:**

**Given** RadarChart needs real data
**When** plan generation completes
**Then** runnerSnapshot.profileRadar provides the 6 axis values
**And** uncertain flag is set based on data source (inferred vs confirmed)

**Given** ProgressionChart needs real data
**When** plan generation completes
**Then** weeklyPlan array provides volumeKm and intensityScore for each week
**And** isRecoveryWeek and weekLabel are populated

**Given** CalendarWidget needs real data
**When** plan generation completes
**Then** plannedSessions for week 1 are queried
**And** each session has sessionTypeDisplay, targetDurationDisplay, isKeySession

**Given** DecisionAudit needs real data
**When** plan generation completes
**Then** decisions array provides the audit trail
**And** safeguardApplications shows what limits were applied
**And** seasonView.expectedOutcomes provides confidence and reasoning

**Depends on:** Epic 6 (Plan Generation Engine)

**Files:**
- Modify visualization components to accept real data props
- Connect to Convex queries for plan data

---

### Story 3.10: Adaptive Coaching Language 🔴 NOT STARTED

As a user,
I want the coach to explain the plan in language that matches my situation,
So that the advice feels relevant and personal.

**Acceptance Criteria:**

**Given** the plan is being presented
**When** the coach explains decisions
**Then** language matches the user's coaching style preference (FR47)
**And** terminology matches experience level

**Given** the user is a comeback runner
**When** the coach discusses the plan
**Then** language is sensitive and supportive
**And** focus is on trust-rebuilding, not performance pressure

**Given** the user prefers "analytical" style
**When** the coach explains
**Then** data-heavy explanations are provided
**And** numbers and percentages are emphasized

**Given** the user prefers "minimalist" style
**When** the coach explains
**Then** explanations are concise
**And** only essential information is shared

**Given** the user prefers "tough love" style
**When** the coach explains
**Then** direct, no-nonsense language is used
**And** accountability is emphasized

**Depends on:** Story 3.9 (visualization data wired)

**Files:**
- `packages/backend/convex/ai/prompts/coaching-voice.ts` (NEW)
- Enhance system prompt with voice modulation

---

## Epic 4: Wearable Data Integration 🔴 HIGH PRIORITY

User can connect HealthKit (iOS), see their running data synced, and the backend stores it in normalized tables.

### Story 4.1: HealthKit Integration (iOS) 🔴 NOT STARTED

As an iOS user,
I want to grant HealthKit access,
So that the coach can analyze my Apple Watch running data.

**Acceptance Criteria:**

**Given** the user taps "Connect Apple Watch" on iOS
**When** HealthKit permission is requested
**Then** the native iOS permission dialog appears (FR7)
**And** requested data types include: running workouts, distance, duration, heart rate, HRV

**Given** permission is granted
**When** HealthKit access is confirmed
**Then** connections.healthkitConnected is set to true
**And** data fetch is triggered immediately
**And** sync status is shown to the user

**Given** historical data is fetched
**When** workouts are retrieved
**Then** last 90 days of running workouts are fetched
**And** each workout is normalized to our schema
**And** activities are stored in the activities table

**Given** permission is denied
**When** the user declines
**Then** graceful fallback to skip path
**And** guidance for enabling later is provided

**Note:** HealthKit requires EAS Build (custom dev client, no Expo Go)

**Files:**
- `apps/native/src/lib/healthkit.ts` (HealthKit client)
- `apps/native/src/hooks/use-healthkit-sync.ts` (sync hook)
- `packages/backend/convex/integrations/healthkit/sync.ts` (batch upsert action)

---

### Story 4.2: Mock Data Providers for Development 🔴 NOT STARTED

As a developer,
I want mock data providers that simulate wearable data,
So that I can test the full flow without real devices.

**Acceptance Criteria:**

**Given** the app is in development mode
**When** mock mode is enabled
**Then** a mock data provider can be selected: "Mock Garmin", "Mock Apple Watch", "Mock Strava"

**Given** mock HealthKit is selected
**When** sync is triggered
**Then** realistic mock activities are generated:
  - 12 weeks of running history
  - 3-5 runs per week
  - Variable distances (5-20km)
  - Realistic paces (5:00-7:00/km)
  - Heart rate data
  - Occasional rest weeks

**Given** mock Strava is selected
**When** sync is triggered
**Then** similar realistic mock activities are generated
**And** Strava-specific fields are populated (suffer_score, segment_efforts)

**Given** mock data is generated
**When** stored in the database
**Then** source is set to "mock_healthkit" or "mock_strava"
**And** data is indistinguishable from real data for testing

**Given** the user's exported HealthKit JSON is available
**When** imported as mock data
**Then** real historical patterns can be used for testing

**Files:**
- `packages/backend/convex/seeds/mock-activities.ts`
- `packages/backend/convex/lib/mock-data-generator.ts`
- `apps/native/src/lib/mock-providers.ts`

---

### Story 4.3: Data Normalization & Sync Pipeline 🔴 NOT STARTED

As a developer,
I want a consistent data normalization pipeline,
So that data from any provider is stored in a unified format.

**Acceptance Criteria:**

**Given** HealthKit workout data is received
**When** normalization runs
**Then** fields are mapped:
  - workoutActivityType → activityType ("running")
  - duration → durationSeconds
  - totalDistance → distanceMeters
  - totalEnergyBurned → calories
  - metadata.HKAverageHeartRate → avgHeartRate
  - startDate/endDate → startTime/endTime (Unix ms)

**Given** pace needs to be calculated
**When** distance and duration are available
**Then** avgPaceSecondsPerKm = durationSeconds / (distanceMeters / 1000)

**Given** the sync pipeline runs
**When** activities are processed
**Then** duplicates are detected by externalId
**And** existing records are updated (upsert behavior)
**And** new records are inserted
**And** rawPayload is preserved for debugging

**Given** sync completes
**When** Runner Object is updated
**Then** connections.healthkitLastSync is set to current timestamp
**And** inference engine is triggered to recalculate currentState

**Files:**
- `packages/backend/convex/lib/normalizers/healthkit.ts`
- `packages/backend/convex/integrations/sync-pipeline.ts`

---

## Epic 5: Backend Data Architecture 🔴 HIGH PRIORITY

Backend infrastructure for storing historical data (Terra-aligned), calculating current state, and preparing data for plan generation.

### Story 5.1: Historical Data Tables Schema 🔴 NOT STARTED

As a developer,
I want the complete historical data schema implemented in Convex,
So that wearable data from any provider can be stored in a unified format.

**Acceptance Criteria:**

**Given** the Convex backend is deployed
**When** the schema is created
**Then** `activities` table exists with Terra-aligned fields:
- Core: runnerId, userId, externalId, source
- Time: startTime, endTime, timezone
- Distance & Movement: distanceMeters, durationSeconds, elevationGainMeters, steps
- Pace & Speed: avgPaceSecondsPerKm, maxPaceSecondsPerKm, avgSpeedKmh
- Heart Rate: avgHeartRate, maxHeartRate, restingHeartRate, hrvMs
- Zones: hrZone1-5 minutes
- Training Load: calories, trainingLoad (TSS/suffer), perceivedExertion
- Power/Running: avgPower, avgCadence, groundContactTime, strideLength
- Cadence-specific: sessionType, planAdherence, userFeedback
- Samples: heartRateSamples, paceSamples (JSON for MVP)
- Metadata: rawPayload, importedAt, lastSyncedAt

**And** `sleepSessions` table exists with:
- Duration stages: totalSleepMinutes, deepSleepMinutes, lightSleepMinutes, remSleepMinutes, awakeMinutes
- Heart rate: avgHeartRate, lowestHeartRate, hrvMs
- Recovery: readinessScore, recoveryScore
- Respiration: avgBreathingRate

**And** `dailySummaries` table exists with:
- Aggregates: totalDistanceMeters, totalSteps, totalCalories, activityCount
- Heart: restingHeartRate, avgHeartRate, hrvMs
- Sleep summary: sleepDurationMinutes, sleepQuality
- Readiness: readinessScore, stressLevel
- Training load: acuteTrainingLoad, chronicTrainingLoad, trainingStressBalance

**And** `bodyMeasurements` table exists with:
- Weight, bodyFatPercent, muscleMass
- Blood pressure, glucose, temperature

**And** all tables have indexes for:
- Queries by runnerId
- Queries by date range (startTime)
- Queries by source provider

**Files:** `packages/backend/convex/schema/activities.ts`, `sleepSessions.ts`, `dailySummaries.ts`, `bodyMeasurements.ts`

---

### Story 5.2: Enhanced Runner Object with Provenance 🔴 NOT STARTED

As a developer,
I want the Runner Object schema enhanced with provenance tracking,
So that every field can be traced back to its source for justifications.

**Acceptance Criteria:**

**Given** the existing runners table
**When** the schema is enhanced
**Then** each field can optionally store provenance:
```typescript
{
  value: T,
  provenance: {
    source: "user_input" | "wearable" | "inferred" | "default",
    inputMethod?: "slider" | "selection" | "text" | "confirmation",
    questionAsked?: string,
    toolName?: string,
    collectedAt: number,
    confidence?: number,
    inferredFrom?: string[]
  }
}
```

**And** the `currentState` section is fully implemented:
- acuteTrainingLoad (ATL)
- chronicTrainingLoad (CTL)
- trainingStressBalance (TSB)
- trainingLoadTrend
- readinessScore, readinessFactors
- last7Days/last28Days volume and run count
- injuryRiskLevel, injuryRiskFactors
- latestRestingHr, latestHrv, latestWeight, latestSleepScore
- lastCalculatedAt

**And** helper functions exist:
- `getFieldValue(runner, path)` - returns value without provenance
- `getFieldWithProvenance(runner, path)` - returns full object
- `buildJustification(runner, decision)` - traces provenance for explanations

**Files:**
- `packages/backend/convex/schema/runners.ts` (enhance)
- `packages/backend/convex/lib/provenance-helpers.ts` (NEW)

---

### Story 5.3: Data Adapters Pattern 🔴 NOT STARTED

As a developer,
I want data adapters for each provider,
So that the system is source-agnostic and extensible.

**Acceptance Criteria:**

**Given** a data adapter interface exists
**When** adapters are implemented
**Then** each adapter provides:
```typescript
interface DataAdapter {
  source: string; // "healthkit" | "strava" | "garmin" | "manual"
  normalizeActivity(raw: any): Partial<Activity>;
  normalizeSleep?(raw: any): Partial<SleepSession>;
  normalizeBody?(raw: any): Partial<BodyMeasurement>;
  fetchActivities?(userId: string, dateRange: DateRange): Promise<Activity[]>;
}
```

**And** adapters exist for:
- HealthKit (iOS native)
- Manual entry (user-logged activities)
- (Future: Strava, Garmin, COROS, Terra)

**And** all adapters:
- Set `source` field to provider name
- Handle missing fields gracefully (optional fields)
- Preserve `rawPayload` for debugging
- Calculate derived fields (pace from distance/duration)

**And** adapter registry exists:
- `getAdapter(source: string): DataAdapter`
- `normalizeAndStore(source, rawData, runnerId)`

**Files:**
- `packages/backend/convex/lib/adapters/types.ts`
- `packages/backend/convex/lib/adapters/healthkit.ts`
- `packages/backend/convex/lib/adapters/manual.ts`
- `packages/backend/convex/lib/adapters/registry.ts`

---

### Story 5.4: Inference Engine for Current State 🔴 NOT STARTED

As a developer,
I want an inference engine that calculates the runner's current state from historical data,
So that the Runner Object's `currentState` is always up-to-date.

**Acceptance Criteria:**

**Given** the inference engine runs
**When** it processes a runner's history
**Then** it calculates training load metrics:
- ATL (Acute Training Load): 7-day exponentially weighted average
- CTL (Chronic Training Load): 42-day exponentially weighted average
- TSB (Training Stress Balance): CTL - ATL
- Training load trend: "building" | "maintaining" | "declining" | "erratic"

**And** it calculates injury risk:
- Ramp rate = (current week volume - 4 week avg) / 4 week avg
- Risk level based on: ramp rate + injury history + age
- Risk factors array populated

**And** it calculates recent patterns:
- last7DaysVolume, last7DaysRunCount
- last28DaysVolume, last28DaysRunCount
- Average pace by effort zone
- Consistency score (0-100)

**And** it pulls latest biometrics from daily summaries:
- latestRestingHr, latestHrv
- latestWeight, latestSleepScore

**Given** inference completes
**When** Runner Object is updated
**Then** only `currentState` section is modified
**And** lastCalculatedAt is set
**And** user-provided fields are NEVER overwritten

**Given** inference should run
**When** triggered:
- After each new activity import
- Daily via scheduled job
- On demand before plan generation

**Files:**
- `packages/backend/convex/lib/inference-engine.ts`
- `packages/backend/convex/scheduled/daily-inference.ts`

---

## Epic 6: Plan Generation Engine 🔴 HIGH PRIORITY

The AI-powered plan generator that uses Knowledge Base + Safeguards to create personalized, justified, safe training plans.

### Story 6.1: Training Plans with Multi-Level Zoom Schema 🔴 NOT STARTED

As a developer,
I want training plans to store data for Season/Weekly/Daily zoom levels,
So that the UI can show justifications at each level.

**Acceptance Criteria:**

**Given** a training plan is generated
**When** it is stored
**Then** `seasonView` contains:
- `coachSummary`: 2-3 sentence overview
- `periodizationJustification`: why this approach
- `volumeStrategyJustification`: why these numbers
- `keyMilestones`: array of { weekNumber, milestone, significance }
- `identifiedRisks`: array of { risk, mitigation, monitoringSignals }
- `expectedOutcomes`: { primaryGoal, confidenceLevel, confidenceReason, secondaryOutcomes }

**And** `weeklyPlan` contains array of weeks:
- weekNumber, weekStartDate, weekEndDate
- phaseName, phaseWeekNumber
- volumeKm, intensityScore (for ProgressionChart)
- isRecoveryWeek, weekLabel
- keySessions, easyRuns, restDays counts
- weekFocus, weekJustification, coachNotes
- volumeChangePercent, warningSignals

**And** `runnerSnapshot` contains:
- capturedAt timestamp
- profileRadar: array for RadarChart
- fitnessIndicators: VDOT, volume, consistency
- planInfluencers: factors that shaped the plan

**Files:** `packages/backend/convex/schema/trainingPlans.ts`

---

### Story 6.2: Planned Sessions Schema 🔴 NOT STARTED

As a developer,
I want planned sessions to include all UI-required fields plus justifications,
So that CalendarWidget can render with full coach reasoning.

**Acceptance Criteria:**

**Given** a session is planned
**When** it is stored
**Then** display fields exist:
- sessionTypeDisplay: "Tempo" | "Easy" | "Intervals" | "Long Run" | "Rest"
- targetDurationDisplay: "50 min" format
- effortDisplay: "7/10" format
- targetPaceDisplay: "4:55–5:05/km" format
- structureDisplay: "10 min warm-up → 30 min tempo → 10 min cool-down"

**And** justification fields exist:
- justification: WHY this session is placed here
- physiologicalTarget: what system we're training
- placementRationale: why THIS day
- keyPoints: what to focus on
- relatedKnowledgeIds: KB entries that informed this
- relatedSafeguardIds: safeguards that were checked

**And** flexibility fields exist:
- isMoveable, canBeSplit
- alternatives: array of backup options

**And** execution tracking fields exist:
- status: "scheduled" | "completed" | "skipped" | "modified"
- completedActivityId, adherenceScore

**Files:** `packages/backend/convex/schema/plannedSessions.ts`

---

### Story 6.3: Knowledge Base Infrastructure 🔴 NOT STARTED

As a developer,
I want a knowledge base storing training science,
So that the AI coach can ground recommendations in established principles.

**Acceptance Criteria:**

**Given** the knowledge base table is created
**When** entries are added
**Then** each entry contains:
- category, subcategory, tags
- title, content, summary
- applicableGoals, applicableExperience, applicablePhases
- source, sourceReference, confidence
- usageContext, isActive
- embedding (optional, for future RAG)

**And** query function exists:
```typescript
queryRelevant({
  tags?: string[],
  category?: string,
  runnerContext?: { experience, goalType, injuries }
}): KnowledgeEntry[]
```

**And** initial seed data includes (minimum 15 entries):
- 10% volume increase rule (established)
- Easy running heart rate 65-75% (established)
- Managing shin splints (well_supported)
- Managing IT band (well_supported)
- Polarized training distribution (established)
- Periodization principles (established)
- Taper guidelines (established)
- Recovery requirements by age (well_supported)
- Long run percentage guidelines (established)
- Speed work introduction timing (well_supported)

**Files:**
- `packages/backend/convex/schema/knowledgeBase.ts`
- `packages/backend/convex/knowledge/query.ts`
- `packages/backend/convex/seeds/knowledge-base.seed.ts`

---

### Story 6.4: Safeguards System 🔴 NOT STARTED

As a developer,
I want a safeguards system that validates all plan decisions,
So that generated plans cannot violate safety rules.

**Acceptance Criteria:**

**Given** the safeguards table is created
**When** rules are defined
**Then** each safeguard contains:
- name, description, category
- ruleType: "hard_limit" | "soft_limit" | "warning"
- condition: { field, operator, threshold, applicableWhen }
- action: { type, adjustment, message, severity }
- priority, isActive

**And** check function exists:
```typescript
checkSafeguards(
  decisions: Decision[],
  runnerContext: RunnerContext
): {
  violations: Violation[],
  adjustments: Adjustment[],
  warnings: Warning[]
}
```

**And** initial safeguards include (minimum 10):
- Max 10% volume increase (hard_limit)
- Max 7% for injury history (hard_limit, higher priority)
- No consecutive hard days (hard_limit)
- Long run max 30% of weekly volume (soft_limit)
- Minimum 1 rest day per week (hard_limit)
- Maximum 2 hard sessions per week for beginners (hard_limit)
- Age 50+ extra recovery (soft_limit)
- No speed work before base phase (soft_limit)
- Taper minimum 10 days for marathon (soft_limit)
- No volume increase after injury return for 4 weeks (hard_limit)

**And** all checks are logged to plan's safeguardApplications

**Files:**
- `packages/backend/convex/schema/safeguards.ts`
- `packages/backend/convex/safeguards/check.ts`
- `packages/backend/convex/seeds/safeguards.seed.ts`

---

### Story 6.5: Plan Generator Core 🔴 NOT STARTED

As a developer,
I want the plan generator to combine Runner Object + Knowledge Base + Safeguards,
So that plans are personalized, grounded, and safe.

**Acceptance Criteria:**

**Given** plan generation is triggered
**When** the generator runs
**Then** it follows these steps:

1. **Template Selection**
   - Match goal type + duration to template
   - Log decision: why this template

2. **Load Parameter Calculation**
   - Query KB for volume/pace principles
   - Calculate baseVolume, peakVolume, weeklyIncrease
   - Log decision: why these numbers

3. **Modifier Application**
   - Query KB for injury-specific rules
   - Apply age modifiers
   - Apply experience modifiers
   - Log each modification with reasoning

4. **Safeguard Validation**
   - Check every parameter against safeguards
   - Auto-adjust violations
   - Log all applications

5. **Week-by-Week Generation**
   - Generate weeklyPlan array
   - Include weekJustification for each week
   - Mark recovery weeks

6. **Session Generation**
   - Generate plannedSessions for each week
   - Include justification for each session
   - Link to KB entries

7. **Season View Synthesis**
   - Use LLM to generate coachSummary
   - Compile keyMilestones
   - Calculate expectedOutcomes

8. **Runner Snapshot**
   - Capture profileRadar values
   - Record planInfluencers

**And** the complete plan is stored with:
- All decisions in audit trail
- All safeguard applications logged
- Multi-level justifications populated

**Files:**
- `packages/backend/convex/training/plan-generator.ts`
- `packages/backend/convex/training/templates/` (plan templates)

---

### Story 6.6: Plan-to-UI Data Queries 🔴 NOT STARTED

As a developer,
I want efficient queries to fetch plan data for visualization components,
So that the UI can render quickly without over-fetching.

**Acceptance Criteria:**

**Given** RadarChart needs data
**When** queried
**Then** returns runnerSnapshot.profileRadar array only

**Given** ProgressionChart needs data
**When** queried
**Then** returns weeklyPlan with only: weekNumber, volumeKm, intensityScore, isRecoveryWeek, weekLabel

**Given** CalendarWidget needs data
**When** queried
**Then** returns plannedSessions for specified week with display fields only

**Given** DecisionAudit needs data
**When** queried
**Then** returns decisions array and safeguardApplications

**Given** Verdict needs data
**When** queried
**Then** returns seasonView.expectedOutcomes

**And** all queries are optimized:
- Use Convex indexes
- Return only required fields
- Support pagination for sessions

**Files:**
- `packages/backend/convex/training/queries.ts`

---

## Epic 7: Strava & Additional Wearable Connections 🟡 MEDIUM PRIORITY

User can connect Strava via OAuth, see Thinking Stream analysis, and sync data from additional providers.

### Story 7.1: Strava OAuth Integration 🟡 NOT STARTED

As a user,
I want to connect my Strava account,
So that the coach can analyze my running history.

**Acceptance Criteria:**

**Given** the user taps "Connect Strava"
**When** the OAuth flow initiates
**Then** expo-auth-session handles the OAuth redirect (FR6)
**And** the user authenticates with Strava
**And** tokens are securely stored in Convex (not on device)

**Given** OAuth completes successfully
**When** tokens are received
**Then** stravaConnections table is updated:
  - athleteId, accessToken, refreshToken, expiresAt
**And** connections.stravaConnected is set to true
**And** data fetch is scheduled

**Given** token refresh is needed
**When** accessToken is expired
**Then** refreshToken is used to get new tokens
**And** user is NOT interrupted

**Given** OAuth fails or is cancelled
**When** the flow returns
**Then** a helpful error message is shown
**And** retry option is available (FR12)

**Files:**
- `packages/backend/convex/integrations/strava/oauth.ts`
- `packages/backend/convex/schema/stravaConnections.ts`
- `apps/native/src/lib/strava-auth.ts`

---

### Story 7.2: Strava Activity Sync 🟡 NOT STARTED

As a user with Strava connected,
I want my activities synced automatically,
So that my profile stays current.

**Acceptance Criteria:**

**Given** Strava is connected
**When** initial sync runs
**Then** last 90 days of activities are fetched
**And** activities are normalized via Strava adapter
**And** activities are stored in activities table

**Given** incremental sync runs
**When** scheduled (daily)
**Then** only new activities since last sync are fetched
**And** stravaLastSync is updated

**Given** activity data is normalized
**When** Strava fields are mapped
**Then** mapping includes:
  - distance → distanceMeters
  - moving_time → durationSeconds
  - average_heartrate → avgHeartRate
  - suffer_score → trainingLoad
  - average_cadence * 2 → avgCadence

**Files:**
- `packages/backend/convex/integrations/strava/sync.ts`
- `packages/backend/convex/lib/adapters/strava.ts`

---

### Story 7.3: Health Connect Integration (Android) 🟡 NOT STARTED

As an Android user,
I want to grant Health Connect access,
So that the coach can analyze my wearable running data.

**Acceptance Criteria:**

**Given** the user taps wearable connection on Android
**When** Health Connect permission is requested
**Then** the Android Health Connect permission flow appears (FR8)
**And** requested data types include: exercise sessions, distance, heart rate

**Given** permission is granted
**When** Health Connect access is confirmed
**Then** connections.healthConnectConnected is set to true
**And** data fetch is triggered

**Given** Health Connect is not installed
**When** the user tries to connect
**Then** guidance is provided to install Health Connect from Play Store
**And** skip path remains accessible

**Files:**
- `apps/native/src/lib/health-connect.ts`
- `packages/backend/convex/lib/adapters/health-connect.ts`

---

### Story 7.4: Thinking Stream Analysis Display 🟡 NOT STARTED

As a user with connected data,
I want to see the coach analyze my running patterns in real-time,
So that I get immediate value from connecting.

**Acceptance Criteria:**

**Given** historical data is synced
**When** analysis begins
**Then** a ThinkingStream displays with data-specific insights (FR26)
**And** lines stream one by one (200ms per line)
**And** insights reference actual metrics:
  - "Weekly volume: 42-48km. Consistent. Nice."
  - "Easy pace from recent runs: 5:35-5:45/km."
  - "Rest days last month: 3. That's... not many."

**Given** the Thinking Stream completes
**When** user interaction resumes
**Then** stream can be collapsed/expanded (FR27)
**And** coach summarizes key findings conversationally

**Given** patterns are identified
**When** displayed
**Then** positive patterns are in lime
**And** concerning patterns are in orange with explanation

**Files:**
- `packages/backend/convex/ai/tools/thinkingStream.ts`
- `apps/native/src/components/app/onboarding/generative/ThinkingStream.tsx`

---

## Epic 8: Error Handling & Resilience 🟡 MEDIUM PRIORITY

User experiences graceful handling of network issues, permission denials, and can always resume where they left off.

### Story 8.1: Network Unavailable Handling 🟡 NOT STARTED

As a user,
I want to see a friendly message when offline,
So that I understand what's happening and what to do.

**Acceptance Criteria:**

**Given** the user has no network connection
**When** they try to start onboarding
**Then** a friendly message is shown (FR56)
**And** message explains: "I need to be online to get started. Connect to WiFi or cellular and let's try again."
**And** a retry option is available

**Given** the app detects network status
**When** connection is unavailable
**Then** network-dependent features are disabled gracefully
**And** local data remains accessible

**Files:**
- `apps/native/src/components/common/NetworkStatus.tsx`
- `apps/native/src/hooks/use-network-status.ts`

---

### Story 8.2: Connection Lost Mid-Flow 🟡 NOT STARTED

As a user,
I want the app to handle connection drops gracefully,
So that I don't lose my progress.

**Acceptance Criteria:**

**Given** the user is mid-onboarding
**When** network connection is lost
**Then** a reconnecting state is shown (FR57)
**And** the UI pauses rather than errors

**Given** connection is restored
**When** the app detects connectivity
**Then** the flow resumes from the last stable point (FR58)
**And** no data is lost
**And** the user sees confirmation of reconnection

**Given** a slow or flaky connection exists
**When** streaming is affected
**Then** the SSE stream can pause/resume gracefully
**And** partial responses are handled

**Files:**
- `apps/native/src/lib/ai-stream.ts` (enhance reconnection)
- `apps/native/src/components/common/ReconnectingOverlay.tsx`

---

### Story 8.3: LLM Failure Fallback 🟡 NOT STARTED

As a user,
I want the app to handle AI failures gracefully,
So that I can continue or retry without frustration.

**Acceptance Criteria:**

**Given** an LLM API call fails
**When** the error is detected
**Then** a user-friendly error message is shown
**And** a retry option is available
**And** the error is logged for debugging

**Given** the LLM times out
**When** no response is received within 30 seconds
**Then** the timeout is handled gracefully
**And** the user can retry
**And** their previous input is preserved

**Given** multiple failures occur
**When** 3 retries are exhausted
**Then** a more detailed error with support contact is shown
**And** the user's progress is saved locally

**Files:**
- `packages/backend/convex/ai/http_action.ts` (error handling)
- `apps/native/src/hooks/use-ai-chat.ts` (retry logic)

---

### Story 8.4: Permission Denied Guidance 🟡 NOT STARTED

As a user,
I want helpful guidance when I deny permissions,
So that I understand implications and can change my mind.

**Acceptance Criteria:**

**Given** a permission is requested (microphone, health data)
**When** the user denies it
**Then** helpful guidance is shown explaining the impact (FR59)
**And** alternative paths are offered
**And** instructions for enabling later in Settings are provided

**Given** microphone permission is denied
**When** the user tries voice input
**Then** text input remains fully functional
**And** the denial doesn't block onboarding progress

**Given** the user later wants to grant permission
**When** they access settings
**Then** clear instructions guide them to system settings
**And** the feature becomes available after granting

**Files:**
- `apps/native/src/components/common/PermissionDeniedCard.tsx`
- `apps/native/src/lib/permissions.ts`

---

## Epic 9: Trial & Paywall ⚪ LOW PRIORITY (MVP non-essential)

User can view the paywall, start a free trial, and transition to the home screen.

### Story 9.1: Paywall Screen UI ⚪ NOT STARTED

*Reference: cadence-v3.jsx lines 918-944 (PaywallScr)*

As a user,
I want to see a compelling paywall after experiencing my plan,
So that the value is clear before I commit.

**Acceptance Criteria:**

**Given** the Paywall screen renders
**When** coach introduction streams
**Then** "The plan's ready. The coaching is ready." displays
**And** "To unlock everything, start your free trial." follows

**Given** the trial badge displays
**When** rendered
**Then** "7-DAY FREE TRIAL" appears in lime pill badge

**Given** feature list displays
**When** rendered
**Then** bullets show appropriate path-specific benefits

**Given** pricing displays
**When** rendered
**Then** "€9.99/month after trial" shows clearly
**And** "Cancel anytime." appears below

**Given** CTAs display
**When** rendered
**Then** primary button: "Start Free Trial" (lime, full width)
**And** secondary: "Maybe later" (ghost text button)

**Files:** `apps/native/src/components/app/onboarding/screens/PaywallScreen.tsx`

---

### Story 9.2: Plan Revision Option ⚪ NOT STARTED

As a user,
I want the option to adjust my plan before committing,
So that I have ownership over my training.

**Acceptance Criteria:**

**Given** plan presentation is complete
**When** the coach asks about adjustments
**Then** options include: "Looks good to me", "I'd like to change something"

**Given** the user wants to make changes
**When** they describe the adjustment
**Then** the coach discusses the change
**And** the plan is modified if appropriate

**Given** the user approves the plan
**When** they confirm
**Then** transition to paywall begins

---

### Story 9.3: Trial Activation ⚪ NOT STARTED

As a user,
I want to start my free trial easily,
So that I can begin training immediately.

**Acceptance Criteria:**

**Given** the user is on the paywall
**When** they tap "Start Free Trial"
**Then** the trial is activated (FR54)
**And** a success confirmation is shown
**And** transition to home screen begins

**Given** the trial activates
**When** the subscription is created
**Then** trial end date is recorded
**And** the user's subscription status is updated

**Given** the user taps "Maybe later"
**When** they choose to defer
**Then** they still proceed to home screen
**And** limited functionality is available

---

### Story 9.4: Home Screen Transition ⚪ NOT STARTED

As a user,
I want to arrive at my home screen ready to train,
So that the onboarding concludes with clear next steps.

**Acceptance Criteria:**

**Given** trial is started or skipped
**When** onboarding completes
**Then** a smooth transition to home screen occurs
**And** tomorrow's session (or today's) is visible

**Given** the user reaches home screen
**When** they view it
**Then** the plan is loaded
**And** the first session is accessible

**Given** the handoff happens
**When** the coach delivers final message
**Then** it's dynamic based on first session timing

---

## Implementation Sequence

Based on dependencies and priorities:

### Phase 1: Complete the AI Loop (Stories 3.6-3.8)
**Goal:** Tool calls actually save data and conversation continues
1. Story 3.6: Server-Side Tool Execution
2. Story 3.7: Tool Result Handler
3. Story 3.8: Phase Management

### Phase 2: Wearable Foundation (Epic 4)
**Goal:** HealthKit works, mock data available for testing
1. Story 4.1: HealthKit Integration
2. Story 4.2: Mock Data Providers
3. Story 4.3: Normalization Pipeline

### Phase 3: Backend Infrastructure (Epic 5)
**Goal:** Historical data stored, current state calculated
1. Story 5.1: Historical Tables Schema
2. Story 5.2: Enhanced Runner Object
3. Story 5.3: Data Adapters
4. Story 5.4: Inference Engine

### Phase 4: Plan Generation (Epic 6)
**Goal:** Plans generated with full justifications
1. Story 6.1: Plan Schema (multi-level)
2. Story 6.2: Session Schema
3. Story 6.3: Knowledge Base
4. Story 6.4: Safeguards
5. Story 6.5: Generator Core
6. Story 6.6: UI Queries

### Phase 5: Wire Visualizations (Stories 3.9-3.10)
**Goal:** Charts show real data
1. Story 3.9: Visualization Data
2. Story 3.10: Adaptive Language

### Phase 6: Additional Wearables (Epic 7)
**Goal:** Strava, Health Connect, Thinking Stream
1. Story 7.1: Strava OAuth
2. Story 7.2: Strava Sync
3. Story 7.3: Health Connect
4. Story 7.4: Thinking Stream

### Phase 7: Polish (Epics 8-9)
**Goal:** Error handling, paywall
1. Epic 8: Error Handling
2. Epic 9: Trial & Paywall

---

*Document generated by BMAD workflow*
*Last updated: 2026-02-16*
