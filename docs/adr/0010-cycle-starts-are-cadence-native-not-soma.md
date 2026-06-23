# Manually-logged Cycle Starts are Cadence-native, separate from Soma Menstruation (merge deferred)

We want women to log their menstrual cycle by hand — a Profile page where the Runner records the day her period started ("J1") and reads back the **Cycle** and **Phase** derived from it. This is the first step toward crossing cycle data with the post-session **ressenti** (the luteal phase is where raised perceived effort and degraded sleep make the cross valuable). But the menstrual subject already has a home: Soma owns a `menstruation` table, fed by Garmin/HealthKit webhooks. The glossary (CONTEXT.md) classified "menstruation" as a Soma read-only field. So the question is where the *manually-logged* data lives, and what happens when the Soma webhooks eventually land and there are two sources for the same subject.

We make manually-logged cycle data a **Cadence-native concept, deliberately separate from Soma**, and we **defer** deciding how the two sources reconcile.

- **A self-report is not a wearable measurement — so it is not Soma's.** Soma's reason to exist is "what the body did, as a device recorded it." A J1 typed by the Runner is a *declaration* — the same nature as the voice debrief, not biometrics. Forcing it into Soma's `menstruation` table would require fabricating a `connectionId` (the table is keyed to a wearable connection) and would blur the boundary that makes Soma legible. So Cycle Starts live in a Cadence-owned `cycleStarts` table, and the glossary gains a Cadence-native **Cycle** section distinct from the Soma **Menstruation** line.

- **Store one fact, derive the rest on read — the VDOT pattern.** The only stored fact is the **Cycle Start** (a calendar day). **Cycle** length and current **Phase** are *derived on read* from the sequence of starts, never stored — exactly as paces and race predictions derive from the single stored VDOT. Cycle length is the **median of recent observed spans** (a single aberrant cycle — travel, illness — must not deform it), with a **28-day cycle / 5-day period / ovulation = length − 14** default set when history is too thin.

- **Honest about thin history, the `noSignal` posture.** Cycle length needs ≥2 starts to observe even one span. The derivation tiers its confidence like **Readiness**: the current cycle *day* is certain from the last start and shown immediately; the current *phase* is computed but flagged as an estimate while it runs on the default; and **no forward date prediction** of the next period is made at all in this slice — describing the present (day + phase) is in scope, forecasting a future date is not.

- **Scope is the marker only.** A Cycle Start is a single date. **Daily flow** (light/medium/heavy) is out of scope — only the start day is recorded. Operations are **add + delete** (editing a single date is delete-then-add); saisie allows **backfill** (past dates), forbids **future dates**, and forbids a **duplicate** same calendar day. No Soma webhook integration in this slice.

- **The page is visible to everyone — no sex attribute introduced.** The `users` table has no sex/gender field today, and adding one is a cross-cutting decision (it would also touch paces/VDOT and race prediction) that deserves its own moment, not a smuggle through this page. The Cycle entry simply appears in Profile for all Runners; men ignore it. A real gating need can introduce the attribute later.

- **The future merge is left undecided (posture 3).** When Soma webhooks eventually ingest wearable menstrual data, there will be two sources for the same subject. We do **not** decide now whether the wearable supersedes the manual log, whether the Runner's declared J1 always wins, or how they blend. We build the manual table without presuming the answer, and decide deliberately when Soma's side is actually built and there is a reader that has to reconcile them.

## Consequences

- **Menstruation now has two homes, on purpose.** A future reader will see menstrual data in both Soma (`menstruation`, wearable) and Cadence (`cycleStarts`, self-reported) and should read this as deliberate provenance separation, not duplication to be collapsed. The CONTEXT.md "Cycle Start vs Menstruation" ambiguity entry exists to keep the language from drifting.

- **Cycle and Phase are derivations, not schema.** There is no stored phase. Anything that wants the current phase recomputes it from the Cycle Starts. If a future reader (the ressenti cross, a Coach restitution) needs a *frozen* phase snapshot for durability — the argument that justified persisting `readiness` in ADR-0009 — that will be a new, separate decision; we do not pre-freeze it here, consistent with "defer the snapshot until there's a reader."

- **The eventual cross with the ressenti is named but not built.** This slice is the logging surface only. Crossing Phase with the post-session **Concern tier** (does the luteal phase corroborate a debrief the way Readiness does?) is the next chantier and will get its own decision; the glossary marks the concept read-only until then.

- **Deferring the merge is a real bet, not an oversight.** If wearable adoption is high, two sources for the same subject will need reconciliation sooner than expected, and posture 3 means that work is unspecified until then. We accept that to avoid designing a merge against a Soma side that does not yet exist.
