---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
status: complete
inputDocuments:
  - prd-onboarding-mvp.md
  - architecture.md
  - ux-onboarding-flow-v6-2026-02-13.md
---

# Cadence - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Cadence, decomposing the requirements from the PRD, UX Design if it exists, and Architecture requirements into implementable stories.

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
| FR6 | Epic 6 | Strava OAuth connection |
| FR7 | Epic 6 | HealthKit access (iOS) |
| FR8 | Epic 6 | Health Connect access (Android) |
| FR9 | Epic 6 | Skip wearable connection |
| FR10 | Epic 6 | Retrieve historical data |
| FR11 | Epic 6 | Data sync status |
| FR12 | Epic 6 | Retry data connection |
| FR13 | Epic 2 | Natural language conversation |
| FR14 | Epic 2 | Multiple choice responses |
| FR15 | Epic 2 | Free text responses |
| FR16 | Epic 2 | Voice input responses |
| FR17 | Epic 2 | Confirm/edit captured info |
| FR18 | Epic 2 | Contextual follow-up questions |
| FR19 | Epic 2 | Reference earlier conversation |
| FR20 | Epic 2 | Adapt question flow |
| FR21 | Epic 2 | Progress indicator |
| FR22 | Epic 6 | Analyze wearable data patterns |
| FR23 | Epic 6 | Detect training issues |
| FR24 | Epic 6 | Estimate fitness level |
| FR25 | Epic 2 | Build profile from conversation |
| FR26 | Epic 6 | Thinking Stream display |
| FR27 | Epic 6 | Collapse/expand Thinking Stream |
| FR28 | Epic 2 | Surface personalized insights |
| FR29 | Epic 2 | Specify race goal |
| FR30 | Epic 2 | Specify time target |
| FR31 | Epic 2 | Open Training mode |
| FR32 | Epic 2 | Describe experience level |
| FR33 | Epic 2 | Specify schedule/availability |
| FR34 | Epic 2 | Disclose injury history |
| FR35 | Epic 2 | Describe comeback situation |
| FR36 | Epic 2 | Non-performance goals |
| FR37 | Epic 2 | Preferred coaching style |
| FR38 | Epic 3 | Generate personalized plan |
| FR39 | Epic 3 | Trust-rebuilding protocol |
| FR40 | Epic 3 | Open training cycle |
| FR41 | Epic 3 | RadarChart visualization |
| FR42 | Epic 3 | ProgressChart visualization |
| FR43 | Epic 3 | CalendarWidget visualization |
| FR44 | Epic 3 | Projected outcomes |
| FR45 | Epic 3 | Decision Audit Trail |
| FR46 | Epic 3 | Expandable decision details |
| FR47 | Epic 3 | Appropriate coaching language |
| FR48 | Epic 1 | Track data completeness |
| FR49 | Epic 1 | Persist partial progress |
| FR50 | Epic 1 | Resume onboarding |
| FR51 | Epic 1 | Indicate missing fields |
| FR52 | Epic 4 | View paywall screen |
| FR53 | Epic 4 | See trial benefits |
| FR54 | Epic 4 | Start free trial |
| FR55 | Epic 4 | See pricing options |
| FR56 | Epic 5 | Network unavailable message |
| FR57 | Epic 5 | Reconnection status |
| FR58 | Epic 5 | Resume from stable state |
| FR59 | Epic 5 | Permission denied guidance |

## Epic List

### Epic 1: Foundation & Runner Object Setup
User can sign up/login via social login, confirm their identity, and the system can track their onboarding progress.
**FRs covered:** FR1, FR2, FR4, FR5, FR48, FR49, FR50, FR51

### Epic 2: Conversational Profile Building
User can engage in natural conversation with the coach, answer questions via multiple modes, and build their complete runner profile (no-wearable path initially with mock buttons).
**FRs covered:** FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR25, FR28, FR29, FR30, FR31, FR32, FR33, FR34, FR35, FR36, FR37

### Epic 3: Plan Generation & Visualization
User sees their personalized training plan with RadarChart, ProgressChart, CalendarWidget, and can explore the reasoning behind every decision.
**FRs covered:** FR38, FR39, FR40, FR41, FR42, FR43, FR44, FR45, FR46, FR47

### Epic 4: Onboarding Completion & Trial Conversion
User can review/adjust their plan, view the paywall, start a free trial, and transition to the home screen.
**FRs covered:** FR52, FR53, FR54, FR55

### Epic 5: Error Handling & Resilience
User experiences graceful handling of network issues, permission denials, and can always resume where they left off.
**FRs covered:** FR56, FR57, FR58, FR59

### Epic 6: Wearable Data Connection & Analysis
User can connect Strava/HealthKit, see their running data synced, and watch the coach analyze it in real-time via Thinking Stream. (Deferred until licenses obtained)
**FRs covered:** FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR22, FR23, FR24, FR26, FR27

---

## Epic 1: Foundation & Runner Object Setup

User can sign up/login via social login, confirm their identity, and the system can track their onboarding progress.

### Story 1.1: Runner Object Schema & CRUD

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

### Story 1.2: Social Login Integration

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

### Story 1.3: Onboarding Consent Flow

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

### Story 1.4: Health Data Consent

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

### Story 1.5: Name Confirmation Screen

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

### Story 1.6: Progress Tracking & Persistence

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

## Epic 2: Conversational Profile Building

User can engage in natural conversation with the coach, answer questions via multiple modes, and build their complete runner profile (no-wearable path initially with mock buttons).

### Story 2.1: AI SDK Integration & Streaming Infrastructure

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

### Story 2.2: Generative UI Tool Renderer

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

### Story 2.3: Multiple Choice Input Tool

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

### Story 2.4: Open Text Input Tool

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

### Story 2.5: Voice Input Capability

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

### Story 2.6: Confirmation Card Tool

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

### Story 2.7: Wearable Connection Mock (Skip Path)

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

### Story 2.8: Runner Profile Phase

As a user,
I want to tell the coach about my running experience and current volume,
So that the plan can be calibrated to my level.

**Acceptance Criteria:**

**Given** the user is in the profile phase
**When** the coach asks about experience level
**Then** options are presented: beginner, returning, casual, serious (FR32)
**And** the user can select or provide free text

**Given** the user is not a beginner
**When** experience is captured
**Then** follow-up questions ask about current frequency (days/week)
**And** current volume (weekly km)
**And** easy pace (if known)

**Given** the user provides profile information
**When** each answer is submitted
**Then** the corresponding Runner Object fields are updated
**And** the progress bar advances
**And** the coach acknowledges with contextual response

**Given** the user volunteers extra information in free text
**When** the LLM parses their response
**Then** relevant fields are extracted and populated
**And** the coach acknowledges: "Good to know — I was going to ask about that"

---

### Story 2.9: Goals Phase

As a user,
I want to tell the coach what I'm working toward,
So that the plan serves my specific objectives.

**Acceptance Criteria:**

**Given** the user enters the goals phase
**When** the coach asks about goals
**Then** options are presented: race, speed, base building, return to fitness, general health (FR29)

**Given** the user selects "race" goal
**When** they confirm the selection
**Then** follow-up asks for race distance
**And** follow-up asks for race date (DateInput)
**And** follow-up asks for target time (optional, can skip with "Help me figure it out") (FR30)

**Given** the user selects a non-race goal
**When** they confirm the selection
**Then** the coach adapts to "Open Training" mode (FR31)
**And** appropriate follow-ups are asked based on goal type

**Given** the user has no specific race goal
**When** they indicate this
**Then** the coach proposes rolling improvement cycle
**And** asks what would feel like an accomplishment

---

### Story 2.10: Schedule & Availability Phase

As a user,
I want to tell the coach my available training days,
So that the plan fits my life.

**Acceptance Criteria:**

**Given** the user enters the schedule phase
**When** the coach asks about availability
**Then** options for training days are presented (2-3, 4-5, 6-7 days) (FR33)

**Given** the user specifies available days
**When** they confirm
**Then** a DaySelector may ask about blocked days (days completely off-limits)
**And** the user can select specific days or "No blocked days"

**Given** the user has specified schedule
**When** the phase completes
**Then** schedule.available_days and schedule.blocked_days are populated
**And** the progress bar advances

---

### Story 2.11: Health & Injury Phase

As a user,
I want to tell the coach about my injury history and current health,
So that the plan protects me from re-injury.

**Acceptance Criteria:**

**Given** the user enters the health phase
**When** the coach asks about past injuries
**Then** common injury options are presented (shin splints, IT band, plantar, knee, achilles, stress fracture, hip/glute, none) (FR34)
**And** multi-select is allowed
**And** free text "Other" option is available

**Given** the user has injury history
**When** they report past injuries
**Then** follow-up asks about current pain/issues
**And** follow-up asks about recovery style (quick, slow, push through, no injuries)

**Given** the user indicates "push through" recovery style
**When** that's captured
**Then** the coach acknowledges this as a risk factor
**And** notes it will be monitored in planning

**Given** the user is returning from injury (FR35)
**When** the coach detects comeback situation
**Then** sensitive language is used
**And** non-performance goals like confidence rebuilding are explored (FR36)

**Given** the health phase continues
**When** sleep and stress questions are asked
**Then** sleep quality options are presented (solid, inconsistent, poor)
**And** stress level options are presented (low, moderate, high, survival)

---

### Story 2.12: Coaching Preferences Phase

As a user,
I want to tell the coach how I prefer to be coached,
So that the experience matches my personality.

**Acceptance Criteria:**

**Given** the user enters the coaching phase
**When** the coach asks about coaching style
**Then** options are presented: tough love, encouraging, analytical, minimalist (FR37)

**Given** the user selects a coaching style
**When** the coach responds
**Then** the response mirrors the selected style
**And** coaching.coaching_voice is updated

**Given** the coach asks about biggest challenge
**When** options are presented
**Then** they include: consistency, time, motivation, injury fear, pacing, stuck
**And** free text is allowed

**Given** all coaching preferences are captured
**When** the phase completes
**Then** relevant Runner Object fields are populated
**And** progress bar approaches completion

---

### Story 2.13: Final Check & Profile Completion

As a user,
I want a chance to add anything else before plan generation,
So that the coach has the complete picture.

**Acceptance Criteria:**

**Given** all profile phases are complete
**When** the final check is reached
**Then** the coach asks: "Anything else you want me to know?"
**And** an OpenInput with suggestedResponses is shown ("No, I think that covers it", "Actually, there's one more thing...")

**Given** the user adds additional information
**When** they submit
**Then** the LLM parses and updates relevant fields
**And** the coach acknowledges: "Good to know. That's going into the mix."

**Given** the user indicates nothing more to add
**When** they confirm
**Then** progress bar hits 100%
**And** the conversation state is set to ready_for_plan
**And** transition to plan generation begins (FR25, FR28)

---

## Epic 3: Plan Generation & Visualization

User sees their personalized training plan with RadarChart, ProgressChart, CalendarWidget, and can explore the reasoning behind every decision.

### Story 3.1: Plan Generation Engine

As a user,
I want my training plan generated based on my complete profile,
So that I receive personalized coaching.

**Acceptance Criteria:**

**Given** the Runner Object is complete (100% data_completeness)
**When** plan generation is triggered
**Then** the LLM analyzes the complete profile
**And** generates a structured training plan
**And** the plan includes periodization, weekly structure, and session types (FR38)

**Given** the user has a race goal
**When** the plan is generated
**Then** it targets their race date and distance
**And** includes appropriate build, peak, and taper phases
**And** estimated outcomes are calculated

**Given** the user is a comeback runner (FR39)
**When** the plan is generated
**Then** a trust-rebuilding protocol is created
**And** focus is on confidence milestones, not pace targets
**And** permission to stop is built into sessions

**Given** the user has no race goal (FR40)
**When** the plan is generated
**Then** an open training cycle is created
**And** rolling improvement metrics are defined
**And** flexibility is emphasized

---

### Story 3.2: Thinking Stream for Plan Analysis

As a user,
I want to see the coach's reasoning as it analyzes my profile,
So that I trust the plan is truly personalized.

**Acceptance Criteria:**

**Given** plan generation begins
**When** the analysis phase starts
**Then** a ThinkingStream component displays
**And** lines stream one by one showing the analysis

**Given** the thinking stream is active
**When** insights are generated
**Then** specific data points are referenced (volume, pace, rest days)
**And** gaps and risks are identified
**And** periodization decisions are explained

**Given** the thinking stream completes
**When** collapsible is true
**Then** the stream collapses to "▸ Thinking"
**And** the user can expand to review later
**And** the coach's summary response appears

---

### Story 3.3: RadarChart Runner Profile Visualization

As a user,
I want to see my runner profile as a visual radar chart,
So that I understand my strengths and areas for improvement.

**Acceptance Criteria:**

**Given** plan presentation begins
**When** the RadarChart tool is called
**Then** a FIFA-style web graph renders (FR41)
**And** axes include: Endurance Base, Speed, Recovery Discipline, Consistency, Injury Resilience, Race Readiness

**Given** the chart data is provided
**When** the chart animates in
**Then** each axis fills to its calculated value
**And** the animation is smooth (<1 second per NFR-P4)
**And** design system tokens are used for colors

**Given** the chart is displayed
**When** the coach explains it
**Then** strengths and weaknesses are verbally highlighted
**And** the user understands what the chart represents

---

### Story 3.4: ProgressChart Volume Visualization

As a user,
I want to see my training volume progression over the plan duration,
So that I understand how my training will build.

**Acceptance Criteria:**

**Given** plan presentation continues
**When** the ProgressChart tool is called
**Then** a line/area chart renders showing weeks on x-axis (FR42)
**And** volume (bars) and intensity (line) are displayed
**And** annotations mark recovery weeks and race week

**Given** the chart data is provided
**When** the chart animates in
**Then** the visualization is clear and readable
**And** the user can see the build-rest-build pattern

**Given** the chart is displayed
**When** the coach explains it
**Then** recovery weeks are highlighted as intentional
**And** the taper is explained for race goals

---

### Story 3.5: CalendarWidget Weekly Structure

As a user,
I want to see my typical training week visualized,
So that I understand what each day looks like.

**Acceptance Criteria:**

**Given** plan presentation continues
**When** the CalendarWidget tool is called
**Then** a weekly calendar view renders (FR43)
**And** each day shows session type, description, and duration
**And** key sessions are highlighted

**Given** the calendar displays
**When** the user views it
**Then** they see their personalized weekly structure
**And** rest days are explicitly marked
**And** session types match their goals (tempo, intervals, long run, easy)

**Given** the coach explains the calendar
**When** key sessions are discussed
**Then** the reasoning for placement is provided (e.g., "Tempo on Monday because Tuesday is busy")

---

### Story 3.6: Projected Outcomes Display

As a user,
I want to see what results I can expect from the plan,
So that I have clear expectations and motivation.

**Acceptance Criteria:**

**Given** plan presentation nears completion
**When** projected outcomes are calculated
**Then** the coach presents estimated race time or improvement (FR44)
**And** confidence level is stated (e.g., "75% confidence")

**Given** the user has a time goal
**When** the projection is presented
**Then** current estimated time is shown
**And** target time is shown
**And** the gap and achievability are discussed

**Given** the user has no race goal
**When** outcomes are presented
**Then** improvement trajectory is described
**And** milestones are defined
**And** success metrics are personalized

---

### Story 3.7: Decision Audit Trail

As a user,
I want to see why each major coaching decision was made,
So that I trust and understand the plan.

**Acceptance Criteria:**

**Given** plan presentation completes
**When** the Decision Audit Trail is shown
**Then** collapsible sections display for each major decision (FR45)
**And** decisions include: volume cap, rest days, session placement, pace targets

**Given** a decision section is collapsed
**When** the user taps to expand
**Then** detailed justification is revealed (FR46)
**And** justification references specific user data or stated preferences

**Given** the audit trail is displayed
**When** the coach introduces it
**Then** the coach says "And here's why I made these choices"
**And** transparency is emphasized as a feature

---

### Story 3.8: Adaptive Coaching Language

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

---

## Epic 4: Onboarding Completion & Trial Conversion

User can review/adjust their plan, view the paywall, start a free trial, and transition to the home screen.

### Story 4.1: Plan Revision Option

As a user,
I want the option to adjust my plan before committing,
So that I have ownership over my training.

**Acceptance Criteria:**

**Given** plan presentation is complete
**When** the coach asks about adjustments
**Then** an OpenInput is shown with suggestedResponses
**And** options include: "Looks good to me", "I'd like to change something", "Can I see the first week in detail?"

**Given** the user wants to make changes
**When** they describe the adjustment
**Then** the coach discusses the change
**And** the plan is modified if appropriate
**And** the user is shown the updated element

**Given** the user approves the plan
**When** they confirm
**Then** the plan is finalized
**And** transition to paywall begins

---

### Story 4.2: Paywall Screen

As a user,
I want to see a clear paywall with trial option,
So that I understand the value and can start my trial.

**Acceptance Criteria:**

**Given** the plan is finalized
**When** the paywall screen appears
**Then** trial duration is clearly shown (e.g., 7 days free) (FR52)
**And** features included are listed (FR53)
**And** the CTA button is prominent ("Start Free Trial")

**Given** the user views the paywall
**When** they see the features list
**Then** it includes: full training plan, daily adaptive sessions, visible reasoning, unlimited adjustments

**Given** the user is on the paywall
**When** they want to see pricing
**Then** subscription options and prices are displayed (FR55)
**And** billing terms are clear

---

### Story 4.3: Trial Activation

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

**Given** the user taps "Maybe later" / skip
**When** they choose to defer
**Then** they still proceed to home screen
**And** limited functionality is available
**And** they can start trial later from settings

---

### Story 4.4: Home Screen Transition

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
**And** the coach is quiet but present

**Given** the handoff happens
**When** the coach delivers final message
**Then** it's dynamic based on first session timing
**And** examples: "Your first session is tomorrow morning" or "You could start today if you're feeling it"

---

## Epic 5: Error Handling & Resilience

User experiences graceful handling of network issues, permission denials, and can always resume where they left off.

### Story 5.1: Network Unavailable Handling

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

---

### Story 5.2: Connection Lost Mid-Flow

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
**Then** the Thinking Stream can pause/resume gracefully
**And** partial responses are handled

---

### Story 5.3: LLM Failure Fallback

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
**When** no response is received
**Then** the timeout is handled gracefully
**And** the user can retry
**And** their previous input is preserved

**Given** multiple failures occur
**When** retries are exhausted
**Then** a more detailed error with support contact is shown
**And** the user's progress is saved locally

---

### Story 5.4: Permission Denied Guidance

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

---

## Epic 6: Wearable Data Connection & Analysis

User can connect Strava/HealthKit, see their running data synced, and watch the coach analyze it in real-time via Thinking Stream. (Deferred until licenses obtained)

### Story 6.1: Strava OAuth Integration

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
**Then** access token and refresh token are stored
**And** connections.strava_connected is set to true
**And** data fetch is triggered

**Given** OAuth fails or is cancelled
**When** the flow returns
**Then** a helpful error message is shown
**And** retry option is available (FR12)
**And** skip path remains accessible

---

### Story 6.2: HealthKit Integration (iOS)

As an iOS user,
I want to grant HealthKit access,
So that the coach can analyze my Apple Watch running data.

**Acceptance Criteria:**

**Given** the user taps "Connect Apple Watch" on iOS
**When** HealthKit permission is requested
**Then** the native iOS permission dialog appears (FR7)
**And** requested data types include: running workouts, distance, heart rate, HRV

**Given** permission is granted
**When** HealthKit access is confirmed
**Then** connections.wearable_connected is set to true
**And** connections.wearable_type is set to "apple_watch"
**And** data fetch is triggered

**Given** permission is denied
**When** the user declines
**Then** graceful fallback to skip path
**And** guidance for enabling later is provided

---

### Story 6.3: Health Connect Integration (Android)

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
**Then** connections.wearable_connected is set to true
**And** data fetch is triggered

**Given** Health Connect is not installed
**When** the user tries to connect
**Then** guidance is provided to install Health Connect
**And** skip path remains accessible

---

### Story 6.4: Historical Data Retrieval

As a user with connected wearables,
I want my historical running data imported,
So that the coach has context about my training.

**Acceptance Criteria:**

**Given** wearable connection is established
**When** data retrieval begins
**Then** historical running activities are fetched (FR10)
**And** sync status is shown to the user (FR11)
**And** fetch completes in <15 seconds for typical history (NFR-P3)

**Given** Strava is connected
**When** activities are fetched
**Then** data is retrieved via Convex action (server-side)
**And** activities include: date, distance, duration, pace, type

**Given** HealthKit/Health Connect is connected
**When** workouts are fetched
**Then** data is retrieved client-side per platform requirements
**And** relevant metrics are extracted and normalized

---

### Story 6.5: Wearable Data Analysis Display

As a user with connected data,
I want to see the coach analyze my running patterns,
So that I get immediate value from connecting.

**Acceptance Criteria:**

**Given** historical data is fetched
**When** analysis begins
**Then** a ThinkingStream displays with data-specific insights (FR26)
**And** lines reference actual metrics: "Weekly volume: 42-48km. Consistent. Nice."

**Given** the Thinking Stream is active
**When** patterns are identified
**Then** insights are surfaced: volume, frequency, easy pace, rest days, workout patterns (FR22)
**And** potential issues are noted: "Rest days last month: 3. That's... not many." (FR23)

**Given** analysis completes
**When** the thinking collapses
**Then** the user can expand/collapse to review (FR27)
**And** the coach summarizes key findings conversationally

---

### Story 6.6: Fitness Level Estimation

As a user with connected data,
I want the coach to estimate my current fitness,
So that my plan is calibrated correctly.

**Acceptance Criteria:**

**Given** sufficient historical data exists
**When** fitness estimation runs
**Then** estimated current race times are calculated (FR24)
**And** training load trends are identified
**And** inferred fields in Runner Object are populated

**Given** fitness is estimated
**When** the coach presents findings
**Then** estimates are presented with appropriate confidence
**And** the user can confirm or adjust
**And** estimates inform plan generation

---

### Story 6.7: Skip Wearable Option (Real Implementation)

As a user who doesn't want to connect wearables,
I want a clear skip option,
So that I can proceed without feeling lesser.

**Acceptance Criteria:**

**Given** the wearable connection screen appears
**When** the user sees the skip option
**Then** "I'll do this later" is prominently displayed (FR9)
**And** the skip feels like a choice, not a fallback

**Given** the user taps skip
**When** the skip is processed
**Then** the coach responds warmly: "No problem. I'll learn as we go."
**And** the no-wearable path begins
**And** no negative messaging about missing data
