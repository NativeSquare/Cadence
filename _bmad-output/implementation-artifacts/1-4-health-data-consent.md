# Story 1.4: Health Data Consent

Status: done

---

## Story

As a **new user**,
I want **to explicitly consent to health data collection**,
So that **I understand how my running and fitness data will be used**.

---

## IMPORTANT: Monorepo Cross-App Work

This story requires work in **TWO apps** of the monorepo:

| App | Purpose |
|-----|---------|
| `apps/native` | Health consent screen with in-app expandable sections |
| `apps/web` | Health Data Practices page (for detailed info link) |

**Website URL:** `https://cadence.nativesquare.fr` (uses env var from Story 1.3)

---

## Acceptance Criteria

### AC1: Health Consent Screen Display
**Given** the user has accepted terms of service
**When** they reach the health data consent screen
**Then** they see a clear explanation of what health data will be collected
**And** they see how the data will be used (personalization, improvement)
**And** they see their rights (GDPR/CCPA: access, deletion, portability)

### AC2: Consent Action
**Given** the user is on the health data consent screen
**When** they tap "I Consent"
**Then** their explicit consent is recorded with timestamp
**And** they proceed to the onboarding flow (name confirmation)

### AC3: Learn More Option
**Given** the user is on the health data consent screen
**When** they tap "Learn More" or equivalent
**Then** they see expanded details about data handling practices (in-app OR web link)

### AC4: Health Data Page Exists on Web
**Given** the user wants full details on health data practices
**When** they access the health data page
**Then** comprehensive information is available on the website

---

## Tasks / Subtasks

### Part A: Native App (`apps/native`)

- [x] **Task 1: Create Health Consent Screen** (AC: #1)
  - [x] Create `apps/native/src/app/(onboarding)/health-consent.tsx`
  - [x] Design clear, friendly explanation of data collection
  - [x] List data types: running activities, pace, distance, heart rate (if connected)
  - [x] Explain usage: personalization, plan generation, improvement

- [x] **Task 2: Display User Rights** (AC: #1)
  - [x] GDPR rights section: access, rectification, erasure, portability
  - [x] CCPA rights section: know, delete, opt-out
  - [x] Contact information for data requests

- [x] **Task 3: Create "Learn More" Expandable Sections** (AC: #3)
  - [x] In-app collapsible/accordion component for quick details
  - [x] Include: data storage, retention, third-party sharing
  - [x] Include: security measures, encryption
  - [x] Optional: "Full Details" link to web page

- [x] **Task 4: Add Consent Button** (AC: #2)
  - [x] Primary CTA: "I Consent" or "I Understand & Consent"
  - [x] Style with lime green gradient
  - [x] Clear visual hierarchy

- [x] **Task 5: Record Health Consent** (AC: #2)
  - [x] Create mutation `acceptHealthConsent()`
  - [x] Record `healthConsentAt` timestamp
  - [x] Store consent version for compliance tracking

- [x] **Task 6: Navigate to Name Confirmation** (AC: #2)
  - [x] After consent, route to onboarding name confirmation
  - [x] Update `conversation_state.current_phase` to 'intro'

### Part B: Web App (`apps/web`)

- [x] **Task 7: Create Health Data Practices Page** (AC: #4)
  - [x] Create `apps/web/src/app/health-data/page.tsx`
  - [x] Use same legal-style layout as terms/privacy pages
  - [x] Comprehensive content about health data handling
  - [x] Include all expandable content from native app, plus more detail

- [x] **Task 8: Add Link from Native App (Optional)**
  - [x] Add "View Full Details" link in native app
  - [x] Opens: `WebBrowser.openBrowserAsync(LEGAL_URLS.healthData)`

---

## Dev Notes

### Uses Constants from Story 1.3

The env variable and constants file should already exist from Story 1.3:

```typescript
// apps/native/src/lib/constants.ts (already created in 1.3)
export const LEGAL_URLS = {
  terms: `${WEBSITE_URL}/terms`,
  privacy: `${WEBSITE_URL}/privacy`,
  healthData: `${WEBSITE_URL}/health-data`, // Used here
} as const;
```

### Health Consent Screen Design

```
┌─────────────────────────────────┐
│                                 │
│   [Heart + Shield Icon]         │
│                                 │
│   Your Data, Your Control       │
│                                 │
│   To create your personalized   │
│   training plan, we'll use:     │
│                                 │
│   ┌─────────────────────────┐   │
│   │ Running activities       │   │
│   │ Pace and distance       │   │
│   │ Training frequency       │   │
│   │ Goals and preferences    │   │
│   └─────────────────────────┘   │
│                                 │
│   We use this to:               │
│   • Build your runner profile   │
│   • Generate personalized plans │
│   • Track your progress         │
│                                 │
│   ▸ Where is my data stored?    │
│   ▸ How long is data kept?      │
│   ▸ Is my data shared?          │
│   ▸ View Full Details ↗         │
│                                 │
│   Your Rights:                  │
│   Access • Delete • Export      │
│                                 │
│   ┌─────────────────────────┐   │
│   │    I Understand & Agree  │   │
│   └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

### Web App Health Data Page

**File: `apps/web/src/app/health-data/page.tsx`**
```tsx
export default function HealthDataPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Health Data Practices</h1>
        <p className="text-muted-foreground mb-4">Last updated: February 2026</p>

        <section className="prose prose-invert max-w-none">
          <h2>What Data We Collect</h2>
          <p>Cadence collects running and fitness data to provide personalized coaching:</p>
          <ul>
            <li><strong>Profile Information:</strong> Name, age, weight (optional)</li>
            <li><strong>Running Data:</strong> Experience level, frequency, volume, pace</li>
            <li><strong>Goals:</strong> Race targets, time goals, training objectives</li>
            <li><strong>Schedule:</strong> Available training days, time preferences</li>
            <li><strong>Health Context:</strong> Past injuries, sleep quality, stress levels</li>
            <li><strong>Connected Data:</strong> Strava activities, Apple Health data (if connected)</li>
          </ul>

          <h2>How We Use Your Data</h2>
          <ul>
            <li>Generate personalized training plans</li>
            <li>Adapt coaching to your goals and situation</li>
            <li>Track your progress over time</li>
            <li>Improve our coaching algorithms</li>
          </ul>

          <h2>Data Storage & Security</h2>
          <p>Your data is stored securely using industry-standard encryption:</p>
          <ul>
            <li>All data encrypted in transit (TLS 1.2+)</li>
            <li>Data encrypted at rest</li>
            <li>OAuth tokens stored securely, never in plain text</li>
            <li>Health data never logged in plain text</li>
          </ul>

          <h2>Data Retention</h2>
          <p>Your data is retained while you have an active account. You can request deletion at any time.</p>

          <h2>Third-Party Sharing</h2>
          <p>We do not sell your data. We use AI services (OpenAI) to generate training plans, which requires processing your profile data. See our Privacy Policy for full details.</p>

          <h2>Your Rights</h2>
          <h3>GDPR Rights (EU Users)</h3>
          <ul>
            <li><strong>Access:</strong> Request a copy of your data</li>
            <li><strong>Rectification:</strong> Correct inaccurate data</li>
            <li><strong>Erasure:</strong> Request deletion of your data</li>
            <li><strong>Portability:</strong> Export your data</li>
          </ul>

          <h3>CCPA Rights (California Users)</h3>
          <ul>
            <li><strong>Right to Know:</strong> What data we collect and why</li>
            <li><strong>Right to Delete:</strong> Request deletion of your data</li>
            <li><strong>Right to Opt-Out:</strong> We do not sell personal information</li>
          </ul>

          <h2>Contact Us</h2>
          <p>For data-related requests: <a href="mailto:privacy@cadence.nativesquare.fr">privacy@cadence.nativesquare.fr</a></p>

          <h2>Wellness Disclaimer</h2>
          <p>Cadence provides fitness and wellness coaching. It is not a medical device and does not provide medical advice, diagnosis, or treatment. Always consult a healthcare professional for medical concerns.</p>
        </section>
      </div>
    </main>
  );
}
```

### ExpandableSection Component

```tsx
// apps/native/src/components/app/onboarding/ExpandableSection.tsx
interface ExpandableSectionProps {
  title: string;
  children: React.ReactNode;
}

export function ExpandableSection({ title, children }: ExpandableSectionProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable onPress={() => setExpanded(!expanded)} className="py-2">
      <View className="flex-row items-center gap-2">
        <ChevronRight
          size={16}
          className={cn(
            "text-muted-foreground",
            expanded && "rotate-90"
          )}
        />
        <Text className="text-primary">{title}</Text>
      </View>
      {expanded && (
        <View className="mt-2 pl-6">
          {children}
        </View>
      )}
    </Pressable>
  );
}
```

### Consent Recording Mutation

```typescript
// packages/backend/convex/table/runners.ts

export const acceptHealthConsent = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ code: "UNAUTHORIZED" });

    const runner = await ctx.db
      .query("runners")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique();

    if (!runner) throw new ConvexError({ code: "RUNNER_NOT_FOUND" });

    const now = Date.now();
    await ctx.db.patch(runner._id, {
      legal: {
        ...runner.legal,
        healthConsentAt: now,
        healthConsentVersion: "1.0",
      },
      conversation_state: {
        ...runner.conversation_state,
        current_phase: "intro",
      },
    });
  },
});
```

### Wellness Positioning (IMPORTANT)

**DO say:**
- "Personalized training guidance"
- "Fitness improvement"
- "Running performance"
- "Wellness coaching"

**DO NOT say:**
- "Medical advice"
- "Diagnosis"
- "Treatment"
- "Health condition"

This keeps us in wellness category, not FDA-regulated medical device.

### Project Structure Notes

**Files to Create:**

| App | File | Purpose |
|-----|------|---------|
| native | `apps/native/src/app/(onboarding)/health-consent.tsx` | Health consent screen |
| native | `apps/native/src/components/app/onboarding/ExpandableSection.tsx` | Collapsible sections |
| native | `apps/native/src/components/app/onboarding/DataExplainer.tsx` | Data explanation component |
| web | `apps/web/src/app/health-data/page.tsx` | Health data practices page |

**Files to Modify:**

| App | File | Change |
|-----|------|--------|
| backend | `packages/backend/convex/table/runners.ts` | Add acceptHealthConsent mutation |

### Testing Checklist

**Native App:**
- [ ] Health consent screen displays after terms acceptance
- [ ] All data types clearly listed
- [ ] User rights displayed correctly
- [ ] Expandable sections work (expand/collapse)
- [ ] "View Full Details" link opens web page (if implemented)
- [ ] Consent recorded with timestamp
- [ ] Navigation to name confirmation works
- [ ] Cannot proceed without consenting

**Web App:**
- [ ] Health data page loads at `/health-data`
- [ ] Page is styled correctly (dark theme)
- [ ] Content is comprehensive and readable
- [ ] Links to privacy policy work

### Dependencies

**Story 1.3 must be complete:**
- Terms consent flow must work first
- Legal fields must exist in Runner Object
- Environment variable and constants must be set up

### References

- [Source: architecture.md#Security Requirements] - NFR-S1-S5 security requirements
- [Source: epics.md#Story 1.4] - Original acceptance criteria
- [Source: prd-onboarding-mvp.md#Regulatory/Compliance] - GDPR/CCPA requirements
- [Source: ux-onboarding-flow-v6] - Runner Object model and data sections

---

## Dev Agent Record

### Agent Model Used
Claude Opus 4.5 (claude-opus-4-5-20251101)

### Completion Notes List
- [x] Health consent screen created in native app
- [x] Expandable sections working (inline ExpandableSection component)
- [x] Data types clearly explained
- [x] User rights displayed
- [x] Health data page created in web app
- [x] Consent recorded with timestamp via acceptHealthConsent mutation
- [x] Navigation to name confirmation works (via onboarding index redirect)

### File List
**Native App:**
- `apps/native/src/app/(onboarding)/health-consent.tsx` (created)

**Web App:**
- `apps/web/src/app/health-data/page.tsx` (created)

**Backend:**
- `packages/backend/convex/table/runners.ts` (modified - added acceptHealthConsent mutation)

### Change Log
- 2026-02-14: Implemented health data consent flow (Story 1.4)
