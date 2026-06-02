"use client";

import { FIVE_K_PLAYBOOK as PB } from "@packages/backend/convex/agoge/plans/fiveKPlaybook";

import { CompositionTable } from "@/components/app/playbook/composition-table";
import {
  DurationsPanel,
  SessionSpecsPanel,
  TaperPanel,
} from "@/components/app/playbook/reference-panels";

/**
 * Read-only view of the 5K **playbook** — the coaching logic the plan generator
 * runs, as plain tables. This renders the very same `FIVE_K_PLAYBOOK` object the
 * engine reads (imported directly; it's pure data), so what a coach sees here is
 * exactly what production produces. Reading only — no editing yet.
 */
export default function PlaybookPage() {
  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold">5K Playbook</h1>
        <p className="text-muted-foreground text-sm">
          The coaching logic behind 5K plan generation, as readable tables — what
          each training week contains at every weekly frequency, the structure of
          each session, and the taper rules. This is the exact data the generator
          runs; changing it changes the plans.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 xl:grid-cols-2">
        <CompositionTable
          title="Base"
          phaseColor="base"
          intent="Easy running + VMA courte every week + an SV1 long run (no long run at 2 sessions/week)."
          composition={PB.compositions.base}
        />
        <CompositionTable
          title="Build · early (weeks 1–2)"
          phaseColor="build"
          intent="Easy running + SV2 threshold + VMA courte + SV1 long, scaled by frequency."
          composition={PB.compositions.buildEarly}
        />
        <CompositionTable
          title="Build · late (week 3+)"
          phaseColor="build"
          intent="Easy + SV2 + SV1 long, with one alternating quality slot — VMA longue ↔ Mixte by week."
          composition={PB.compositions.buildLate}
        />
        <CompositionTable
          title="Peak (spécifique)"
          phaseColor="peak"
          intent="Race-pace 5K sessions (7×800 @ goal pace) + easy runs only. No SV2, no SV1 long."
          composition={PB.compositions.peak}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 xl:grid-cols-2">
        <SessionSpecsPanel c={PB.constants} />
        <div className="flex flex-col gap-4">
          <DurationsPanel c={PB.constants} />
          <TaperPanel taper={PB.taper} />
        </div>
      </div>
    </div>
  );
}
