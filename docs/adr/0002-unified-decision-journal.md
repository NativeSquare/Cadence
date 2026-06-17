# One journal spine for all decisions; retire the Intervention table

We had two records for things that touch a **Workout**: `journalEntry` (the runner's qualitative voice — audio, transcript, derived signals, and a minimal `decision` intention) and `coachInterventions` (the Engine's executed, revertible plan mutation — trigger signals, before/after snapshot, revert state). They overlapped on exactly one path (the post-session ease, which wrote to both) and otherwise extended in opposite directions: `journalEntry` into voice-with-no-mutation, `coachInterventions` into mutation-with-no-voice (the autonomous `hrv_low_v1` / adherence reshapes).

We **unify them into a single journal spine** (`journalEntry`). A row is a **Decision**: a moment where a **Trigger** prompted a choice to act or not, made by the **Engine** (Chemin A — a *system* decision) or the **Runner** (Chemin B). The spine carries voice (when present) and the executed mutation's before/after state (when it acted) on the same row. This gives the future moat reader — the *outcome-labeled decision log* / restitution — a single place to read decisions and label outcomes, instead of a join across two tables.

Two scope decisions bound the change:

- **Only content-bearing evaluations get a row** (Reading A). A row means a mutation fired, voice was captured, or the runner actively chose at a presented fork (Keep `go` included). Silent no-op evaluations — the Monday cron that scans HRV and finds nothing — write **nothing**. The alternative (logging every trigger evaluation, including "looked, did nothing") would turn the spine into an unbounded evaluation audit log with no reader, the opposite of minimal.
- **Revert (the undo) is dropped.** The before/after snapshot is retained as analytics signal, but `revertIntervention` and the revert card go away. The informational "Adjusted by coach" badge stays — it reads "this row carries a mutation" and remains the runner-facing transparency surface.

## Consequences

- This **supersedes the 2026-06-16 "Decision vs Intervention" resolution**, which kept them as distinct records. The distinction was one day old and unbuilt beyond the minimal `decision` field, so the reversal cost is low now and rises fast once data accumulates.
- **Dropping revert removes shipped, user-facing functionality** (the revert card + `revertIntervention`). This is a deliberate product call, accepted to avoid carrying plan-snapshot state purely for an undo. A future revert/outcome feature can still reconstruct intent from the retained before/after snapshot.
- The merged table is **heterogeneous**: rows are voice-only, mutation-only, or both, discriminated by `kind`/author. Every current `journalEntry` reader gains a `kind`/content filter, and the autonomous-reshape readers (`activeForWorkout`, `activeInterventionWorkoutIds`, `analytics/interventions:list`, `weeklyReview`, `interventionFiredSince`) move onto `journalEntry`. This is the cost paid for a single spine.
- A **data migration** folds existing `coachInterventions` rows into `journalEntry` as system-decision rows, after which the table and its file are removed. Reversing the merge later means splitting a live table — expensive — which is why this is an ADR.
- Naming residue from ADR-0001 (the "coachInterventions" / "Coach intervention" name for an Engine action) is resolved by this merge rather than left as debt.

## Addendum (2026-06-17) — overridden by the clean-slate removal

When we executed this merge we tightened two clauses, in light of the decision to strip all autonomous proactive triggers (see ADR-0003):

- **The before/after snapshot is *not* retained.** This ADR said to keep it "as analytics signal." It has no reader: the revert card is gone, the analytics overlay is deleted with the HRV cleanup, and restitution/outcome is unbuilt. Storing it now is speculative infra, so `easeConflictingSession` performs the reshape but records **nothing extra**. The surviving trace of an ease is `journalEntry.decision === "ease"` on the debrief entry. A real snapshot returns when restitution/outcome is built with a reader behind it.
- **No data backfill.** This ADR proposed folding existing `coachInterventions` rows into `journalEntry`. Unnecessary: the only real rows are `post_session_ease`, whose debrief workouts already carry a `journalEntry` with `decision: "ease"`; everything else is dev-seed / HRV junk. We **drop the table outright**.
- **The "Adjusted by coach" badge is dropped** (`coachAdjusted` removed end to end), not kept. The badge marked the *eased upcoming* workout, whose only record was the `coachInterventions` row; `journalEntry.decision` sits on a *different* (debrief) workout and can't stand in for it. The in-the-moment CoachResponse confirmation remains the runner's transparency surface.
