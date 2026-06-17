# Reset autonomous proactive triggers to zero

Cadence accumulated three autonomous, system-initiated plan behaviours that fire without the runner asking: the HRV-low reshape (`hrv_low_v1`), an adherence-substitute reshape (`adherence_low_v1`), and the Weekly Review (`weekly_review_v1`, a Monday cron that auto-misses past-due sessions and reshapes the upcoming week). An audit (2026-06-17) found the first two were already **dead** — `applyModificationAndRecord`, `interventionFiredSince`, `getHrvReadiness`, and the notification helpers had no live caller after the daily ruleset was removed — and the Weekly Review, while wired, encoded quantitative-threshold judgments we no longer trust as "making sense."

We **remove all autonomous proactive triggers, resetting to zero**, so the proactive layer can be rebuilt deliberately later rather than carried as half-live machinery. Concretely this deletes:

- the HRV trigger path: `getHrvReadiness`, the dev seeds (`seedHrvForTesting`, `seedFakeInterventionForTesting`, …), and the analytics marker overlay (`analytics/interventions:list`);
- the Weekly Review in full: its cron, `engine/weeklyReview.ts` + `weeklyReview.core.ts` + tests, the `weeklyReviews` table, and its Coach narration — **including auto-miss**;
- the `coachInterventionsEnabled` user flag, its mutation, and its settings toggle (orphaned once the cron is gone).

What **stays**: the runner-initiated post-session **ease** (Chemin B — Coach offers, Runner decides, Engine acts) and the **Guardrails** that validate manual edits. The HRV **display** chart stays as read-only Analytics context (`analytics/hrv.ts`), independent of any trigger.

## Consequences

- **Chemin A (the Engine deciding *and* acting on confirmed signals) currently has no live path.** The product is, for now, reactive only: the Engine acts solely when the Runner decides. This is intentional — the foundation for rebuilding Chemin A "properly," not a permanent stance.
- **Auto-miss is gone.** Past-due `planned` workouts stay `planned` in the DB until the runner triages them. This is masked in the UI — `deriveWorkoutStatus` derives `needs_feedback` from the date, the NeedsFeedback screen offers one-tap "Mark Missed," and the daily needs-feedback reminder still nudges — so no automatic writer of `missed` status remains. If the DB should later reflect `missed` without user action, that returns as part of the rebuilt proactive layer.
- **The cost to rebuild is real**, which is why this is an ADR: the Weekly Review engine, its pure core, and its tests are deleted, not parked. A future reader who sees the concept in git history should read this as a deliberate reset, not an accident.
- This **complements ADR-0002**: that ADR retired the Intervention *record*; this one retires the autonomous *triggers* that used to write it. Together they leave a single journal spine (`journalEntry`) and exactly one live reshape path (runner-initiated ease).
- **Residue resolved.** ADR-0001 flagged the `coachInterventions` table and "Coach intervention" UI as naming debt from the abandoned full-AI era. This removal clears it.
