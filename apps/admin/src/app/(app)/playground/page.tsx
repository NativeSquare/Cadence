"use client";

import { useState } from "react";

import {
  type BuildFiveKPlanInputs,
  buildFiveKPlan,
  type FiveKPlanTrace,
} from "@packages/backend/convex/agoge/plans/buildFiveKPlan";
import { buildTenKPlan } from "@packages/backend/convex/agoge/plans/buildTenKPlan";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import {
  ScenarioForm,
  type ScenarioState,
} from "@/components/app/playground/scenario-form";
import { TraceView } from "@/components/app/playground/trace-view";

/** today + `days` as YYYY-MM-DD (UTC), used only for sensible form defaults. */
function ymdFromNow(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const DEFAULT_SCENARIO: ScenarioState = {
  format: "5k",
  planStartDate: ymdFromNow(0),
  raceDate: ymdFromNow(84), // ~12 weeks out
  sessionsPerWeek: 5,
  availableDays: [0, 1, 3, 5, 6],
  pacingMode: "time",
  targetMinutes: 21,
  targetSeconds: 0,
  vdot: 50,
  currentKm: 30,
  locale: "fr",
};

function toInputs(s: ScenarioState): BuildFiveKPlanInputs {
  return {
    planStartYmd: s.planStartDate,
    raceYmd: s.raceDate,
    currentKm: s.currentKm,
    schedule: {
      availableDays: s.availableDays,
      sessionsPerWeek: s.sessionsPerWeek,
    },
    locale: s.locale,
    raceDistanceMeters: s.format === "10k" ? 10000 : 5000,
    ...(s.pacingMode === "vdot"
      ? { vdot: s.vdot }
      : { targetTimeSeconds: s.targetMinutes * 60 + s.targetSeconds }),
  };
}

function validate(s: ScenarioState): string | null {
  if (!s.planStartDate || !s.raceDate)
    return "Set a plan start and a race date.";
  if (s.raceDate <= s.planStartDate)
    return "Race date must be after plan start.";
  if (s.availableDays.length === 0) return "Pick at least one available day.";
  return null;
}

type Result = { trace: FiveKPlanTrace | null; error: string | null };

export default function PlaygroundPage() {
  const [scenario, setScenario] = useState<ScenarioState>(DEFAULT_SCENARIO);
  const [result, setResult] = useState<Result | null>(null);

  function generate() {
    const error = validate(scenario);
    if (error) {
      setResult({ trace: null, error });
      return;
    }
    try {
      const build = scenario.format === "10k" ? buildTenKPlan : buildFiveKPlan;
      setResult({ trace: build(toInputs(scenario)), error: null });
    } catch (e) {
      setResult({
        trace: null,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return (
    <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="px-4 lg:px-6">
        <h1 className="text-2xl font-bold">Plan Playground</h1>
        <p className="text-muted-foreground text-sm">
          Pick a distance, set a scenario, hit <strong>Generate Plan</strong>,
          and watch the real generation logic run step by step — the same{" "}
          <code className="text-xs">
            {scenario.format === "10k" ? "buildTenKPlan" : "buildFiveKPlan"}
          </code>{" "}
          production uses, but nothing is written to the database.
        </p>
      </div>

      <div className="flex flex-col gap-4 px-4 lg:px-6">
        <div className="max-w-2xl">
          <ScenarioForm value={scenario} onChange={setScenario} />
        </div>

        <div>
          <Button size="lg" onClick={generate}>
            Generate Plan
          </Button>
        </div>

        {result?.error ? (
          <Alert variant="destructive" className="max-w-2xl">
            <AlertTitle>Cannot build plan</AlertTitle>
            <AlertDescription>{result.error}</AlertDescription>
          </Alert>
        ) : result?.trace ? (
          <TraceView trace={result.trace} />
        ) : (
          <p className="text-muted-foreground text-sm">
            No plan generated yet.
          </p>
        )}
      </div>
    </div>
  );
}
