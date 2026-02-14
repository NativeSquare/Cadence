# Story 1.3: Onboarding Consent Flow

Status: ready-for-dev

---

## Story

As a **new user**,
I want **to review and accept terms of service and privacy policy**,
So that **I understand my rights and obligations before using the app**.

---

## IMPORTANT: Monorepo Cross-App Work

This story requires work in **TWO apps** of the monorepo:

| App | Purpose |
|-----|---------|
| `apps/native` | Mobile consent screen, links to web pages |
| `apps/web` | Terms of Service and Privacy Policy pages |

**Website URL:** `https://cadence.nativesquare.fr`

---

## Acceptance Criteria

### AC1: Consent Screen Gate
**Given** the user has completed authentication
**When** they haven't yet accepted terms
**Then** they are shown a consent screen before proceeding to onboarding

### AC2: View Terms of Service
**Given** the user is on the consent screen
**When** they tap to view Terms of Service
**Then** the full terms are displayed (opens web browser to website)

### AC3: View Privacy Policy
**Given** the user is on the consent screen
**When** they tap to view Privacy Policy
**Then** the full privacy policy is displayed (opens web browser to website)

### AC4: Accept and Proceed
**Given** the user has reviewed the terms
**When** they tap "I Accept" / confirm acceptance
**Then** the acceptance is recorded with timestamp in their user record
**And** they proceed to the health data consent screen

### AC5: Web Pages Exist and Load
**Given** a user taps a legal link
**When** the browser opens
**Then** the Terms/Privacy page loads correctly on the marketing website

---

## Tasks / Subtasks

### Part A: Native App (`apps/native`)

- [ ] **Task 1: Add Website URL Environment Variable**
  - [ ] Add `EXPO_PUBLIC_WEBSITE_URL=https://cadence.nativesquare.fr` to `apps/native/.env.local`
  - [ ] Create constants file to expose the URL: `apps/native/src/lib/constants.ts`
  - [ ] Export `WEBSITE_URL`, `TERMS_URL`, `PRIVACY_URL`

- [ ] **Task 2: Add Consent Fields to Runner Schema** (AC: #1, #4)
  - [ ] Add `legal` object to runners table schema
  - [ ] Include: `termsAcceptedAt`, `privacyAcceptedAt`, `consentVersion`
  - [ ] Create mutation `acceptTerms()` that sets timestamps

- [ ] **Task 3: Create Consent Screen UI** (AC: #1)
  - [ ] Create `apps/native/src/app/(onboarding)/consent.tsx`
  - [ ] Design follows dark theme with primary accent
  - [ ] Include app logo or welcome message
  - [ ] Display consent summary text

- [ ] **Task 4: Add Terms of Service Link** (AC: #2)
  - [ ] Create tappable "Terms of Service" text/button
  - [ ] Open browser: `WebBrowser.openBrowserAsync(\`\${WEBSITE_URL}/terms\`)`

- [ ] **Task 5: Add Privacy Policy Link** (AC: #3)
  - [ ] Create tappable "Privacy Policy" text/button
  - [ ] Open browser: `WebBrowser.openBrowserAsync(\`\${WEBSITE_URL}/privacy\`)`

- [ ] **Task 6: Create Accept Button** (AC: #4)
  - [ ] Style as primary CTA (lime green gradient)
  - [ ] Text: "I Accept" or "Accept & Continue"

- [ ] **Task 7: Record Acceptance** (AC: #4)
  - [ ] On accept tap, call `acceptTerms` mutation
  - [ ] Store timestamps and consent version

- [ ] **Task 8: Implement Navigation Guard** (AC: #1)
  - [ ] Check `termsAcceptedAt` on app load after auth
  - [ ] If null, redirect to consent screen

- [ ] **Task 9: Route to Health Data Consent** (AC: #4)
  - [ ] After acceptance, navigate to health consent screen

### Part B: Web App (`apps/web`)

- [ ] **Task 10: Create Terms of Service Page** (AC: #5)
  - [ ] Create `apps/web/src/app/terms/page.tsx`
  - [ ] Create legal-style layout (centered content, readable width)
  - [ ] Add Terms of Service content (can use placeholder initially)
  - [ ] Include: last updated date, version number
  - [ ] Match website styling (dark theme preferred)

- [ ] **Task 11: Create Privacy Policy Page** (AC: #5)
  - [ ] Create `apps/web/src/app/privacy/page.tsx`
  - [ ] Same layout as Terms page
  - [ ] Add Privacy Policy content (can use placeholder initially)
  - [ ] Include: data collection, usage, rights, contact info
  - [ ] Include: GDPR/CCPA compliance sections

- [ ] **Task 12: Create Shared Legal Layout (Optional)**
  - [ ] Create `apps/web/src/app/(legal)/layout.tsx` if reusable layout needed
  - [ ] Style for readability: max-width container, good typography

---

## Dev Notes

### Environment Variable Setup

**File: `apps/native/.env.local`**
```env
# Website URLs for legal pages
EXPO_PUBLIC_WEBSITE_URL=https://cadence.nativesquare.fr
```

**File: `apps/native/src/lib/constants.ts`**
```typescript
export const WEBSITE_URL = process.env.EXPO_PUBLIC_WEBSITE_URL || 'https://cadence.nativesquare.fr';

export const LEGAL_URLS = {
  terms: `${WEBSITE_URL}/terms`,
  privacy: `${WEBSITE_URL}/privacy`,
  healthData: `${WEBSITE_URL}/health-data`, // For story 1.4
} as const;
```

### Opening Links from Native App

```typescript
import * as WebBrowser from 'expo-web-browser';
import { LEGAL_URLS } from '@/lib/constants';

const openTerms = async () => {
  await WebBrowser.openBrowserAsync(LEGAL_URLS.terms);
};

const openPrivacy = async () => {
  await WebBrowser.openBrowserAsync(LEGAL_URLS.privacy);
};
```

### Web App Page Structure

**File: `apps/web/src/app/terms/page.tsx`**
```tsx
export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        <p className="text-muted-foreground mb-4">Last updated: February 2026</p>

        <section className="prose prose-invert max-w-none">
          <h2>1. Acceptance of Terms</h2>
          <p>By accessing or using Cadence...</p>

          <h2>2. Description of Service</h2>
          <p>Cadence provides personalized running coaching...</p>

          {/* Add full terms content */}
        </section>
      </div>
    </main>
  );
}
```

**File: `apps/web/src/app/privacy/page.tsx`**
```tsx
export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-muted-foreground mb-4">Last updated: February 2026</p>

        <section className="prose prose-invert max-w-none">
          <h2>Information We Collect</h2>
          <p>We collect information you provide directly...</p>

          <h2>How We Use Your Information</h2>
          <p>We use your information to provide personalized training...</p>

          <h2>Your Rights (GDPR/CCPA)</h2>
          <p>You have the right to access, correct, delete...</p>

          <h2>Contact Us</h2>
          <p>Email: privacy@cadence.nativesquare.fr</p>
        </section>
      </div>
    </main>
  );
}
```

### Database Schema Update

**Add to runners table:**
```typescript
legal: v.optional(v.object({
  termsAcceptedAt: v.optional(v.number()),
  privacyAcceptedAt: v.optional(v.number()),
  healthConsentAt: v.optional(v.number()), // For story 1.4
  consentVersion: v.optional(v.string()),
})),
```

### Consent Screen Design

```
┌─────────────────────────────────┐
│                                 │
│         [App Logo]              │
│                                 │
│   Welcome to Cadence            │
│                                 │
│   Before we begin, please       │
│   review our legal terms.       │
│                                 │
│   By tapping Accept, you        │
│   agree to our:                 │
│                                 │
│   • Terms of Service ↗          │
│   • Privacy Policy ↗            │
│                                 │
│   ┌─────────────────────────┐   │
│   │     Accept & Continue    │   │
│   └─────────────────────────┘   │
│                                 │
└─────────────────────────────────┘
```

### Project Structure Notes

**Files to Create:**

| App | File | Purpose |
|-----|------|---------|
| native | `apps/native/.env.local` | Website URL env var |
| native | `apps/native/src/lib/constants.ts` | URL constants |
| native | `apps/native/src/app/(onboarding)/consent.tsx` | Consent screen |
| native | `apps/native/src/components/app/onboarding/LegalLink.tsx` | Tappable link |
| web | `apps/web/src/app/terms/page.tsx` | Terms of Service page |
| web | `apps/web/src/app/privacy/page.tsx` | Privacy Policy page |

**Files to Modify:**

| App | File | Change |
|-----|------|--------|
| backend | `packages/backend/convex/table/runners.ts` | Add legal fields |
| native | `apps/native/src/app/(onboarding)/_layout.tsx` | Navigation guard |

### Testing Checklist

**Native App:**
- [ ] Consent screen appears for new users after login
- [ ] Terms link opens browser to correct URL
- [ ] Privacy link opens browser to correct URL
- [ ] Accept button records timestamps
- [ ] User is not asked again after accepting
- [ ] Navigation to health consent works

**Web App:**
- [ ] Terms page loads at `/terms`
- [ ] Privacy page loads at `/privacy`
- [ ] Pages are styled correctly (dark theme)
- [ ] Content is readable and well-formatted

### Dependencies

**Story 1.1 must be complete:**
- Runner Object schema must exist to add legal fields

### References

- [Source: architecture.md#Design System Patterns] - Styling requirements
- [Source: epics.md#Story 1.3] - Original acceptance criteria
- [Source: prd-onboarding-mvp.md#Regulatory/Compliance] - GDPR/CCPA requirements

---

## Dev Agent Record

### Agent Model Used
{{agent_model_name_version}}

### Completion Notes List
- [ ] Env variable configured in native app
- [ ] Constants file created
- [ ] Consent screen created with proper styling
- [ ] Terms page created in web app
- [ ] Privacy page created in web app
- [ ] Links open correctly from native app
- [ ] Acceptance recorded with timestamps

### File List
**Native App:**
- `apps/native/.env.local` (created/modified)
- `apps/native/src/lib/constants.ts` (created)
- `apps/native/src/app/(onboarding)/consent.tsx` (created)
- `apps/native/src/components/app/onboarding/LegalLink.tsx` (created)
- `apps/native/src/app/(onboarding)/_layout.tsx` (modified)

**Web App:**
- `apps/web/src/app/terms/page.tsx` (created)
- `apps/web/src/app/privacy/page.tsx` (created)

**Backend:**
- `packages/backend/convex/table/runners.ts` (modified)
