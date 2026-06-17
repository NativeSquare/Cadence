# Deterministic Engine, LLM only narrates

We originally built Cadence "full-AI": an LLM generated the **Plan** and adapted it over time. The per-decision token cost made that unviable at scale, so we pivoted: **all plan logic is now deterministic** (generation, reshapes, guardrails, weekly review — the **Engine**), and **the LLM's only job is to narrate** deterministic results in the runner's voice (the **Coach**). The Coach is strictly read-only on the plan.

## Consequences

- A future reader sees residue from the old strategy and may misread it as live AI behaviour. Known residue: the `coachInterventions` table and "Coach intervention" UI are named for an actor that no longer *decides* (the **Engine** decides; the Coach only narrates); guardrails carry a `philosophy.*` error-code prefix even though the "Philosophy" abstraction module was deleted.
- The boundary is a hard invariant, not a preference: **no LLM-as-judge** anywhere in plan logic. Multi-signal decisions stay coded rules even when complex. Reintroducing LLM authorship over the plan would reverse this ADR, not extend it.
- The qualitative wedge (Journal) does use an LLM, but only to *extract* structured signals from a transcript and to *narrate* — never to mutate the plan.
