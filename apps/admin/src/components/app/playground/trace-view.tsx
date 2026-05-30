"use client";

import type { ReactNode } from "react";

import type {
  FiveKPlanTrace,
  TracedSession,
  TracedWeek,
} from "@packages/backend/convex/agoge/plans/buildFiveKPlan";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  DAY_LABELS,
  DROP_REASON_LABELS,
  isoDow,
  km,
  mpsToPace,
  PHASE_INTENT,
  PHASE_STYLES,
  roleLabel,
} from "./format";
import { VolumeChart } from "./volume-chart";
import { DayHeader, WeekCalendar, WeekRow } from "./week-calendar";

// --- Small building blocks ----------------------------------------------------

function Step({
  n,
  title,
  fn,
  what,
  children,
}: {
  n: number;
  title: string;
  fn: string;
  what: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-full text-xs font-semibold">
            {n}
          </span>
          {title}
          <code className="text-muted-foreground text-xs font-normal">
            {fn}
          </code>
        </CardTitle>
        <CardDescription>{what}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

/** Plain-language summary of a row's outcome. */
function dropText(s: TracedSession): string {
  return s.dropReason
    ? (DROP_REASON_LABELS[s.dropReason] ?? s.dropReason)
    : "dropped";
}

// --- Step 1: grid -------------------------------------------------------------

function GridStep({ trace }: { trace: FiveKPlanTrace }) {
  const { grid, inputs } = trace;
  const dow = isoDow(inputs.raceYmd);
  return (
    <Step
      n={1}
      title="Calendar grid"
      fn="fiveKGrid()"
      what="Anchors every week to a Monday grid and sizes the race-anchored taper from the race's day-of-week."
    >
      <p className="text-sm">
        The race falls on a <strong>{DAY_LABELS[dow]}</strong>, so the taper is{" "}
        <strong>{grid.taperDays} days</strong> and opens on{" "}
        <strong>{grid.taperStartYmd}</strong> (a Monday). That leaves{" "}
        <strong>{grid.preTaperWeeks}</strong> full Mon→Sun weeks for
        base/build/peak.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Grid start (Mon)" value={grid.gridStartYmd} />
        <Stat label="Taper start" value={grid.taperStartYmd} />
        <Stat label="Taper days" value={grid.taperDays} />
        <Stat label="Pre-taper weeks" value={grid.preTaperWeeks} />
      </div>
    </Step>
  );
}

// --- Step 2: phase split ------------------------------------------------------

function SplitStep({ trace }: { trace: FiveKPlanTrace }) {
  const { preTaperSplit, phaseByWeek } = trace;
  return (
    <Step
      n={2}
      title="Phase split"
      fn="fiveKPreTaperSplit() → expandPhases()"
      what="Distributes the pre-taper weeks: peak = 1 specific week, build = up to 4, base = the remainder."
    >
      <p className="text-sm">
        {preTaperSplit.base} base + {preTaperSplit.build} build +{" "}
        {preTaperSplit.peak} peak week
        {preTaperSplit.peak === 1 ? "" : "s"}, expanded week-by-week:
      </p>
      <div className="mt-3 flex flex-wrap gap-1">
        {phaseByWeek.map((p, i) => (
          <Badge
            key={i}
            variant="outline"
            className={PHASE_STYLES[p]}
            title={`Week ${i + 1}`}
          >
            W{i + 1} {p}
          </Badge>
        ))}
      </div>
    </Step>
  );
}

// --- Step 3: volume + paces ---------------------------------------------------

function VolumeStep({ trace }: { trace: FiveKPlanTrace }) {
  const { volumeCurve, resolved } = trace;
  return (
    <Step
      n={3}
      title="Volume & paces"
      fn="weeklyVolumeCurve() · trainingPaces()"
      what="Ramps weekly volume from current fitness toward peak (with periodic cutbacks), and derives training paces from VDOT."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(0,20rem)]">
        <VolumeChart
          volumeCurve={volumeCurve}
          planPeakKm={resolved.planPeakKm}
        />
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            <Stat label="VDOT" value={resolved.vdot?.toFixed(1) ?? "—"} />
            <Stat label="Peak km" value={Math.round(resolved.peakKm)} />
            <Stat
              label="Plan peak km"
              value={Math.round(resolved.planPeakKm)}
            />
          </div>
          {resolved.paces && (
            <div className="grid grid-cols-3 gap-2 text-sm">
              {(["E", "SV1", "M", "T", "I", "R"] as const).map((k) => (
                <Stat key={k} label={k} value={mpsToPace(resolved.paces?.[k])} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Step>
  );
}

// --- Step 4: weekly microcycles ----------------------------------------------

function WeekNarrative({ week }: { week: TracedWeek }) {
  const kept = week.sessions.filter((s) => !s.dropped);
  const dropped = week.sessions.filter((s) => s.dropped);
  const bag = week.sessions.map((s) => roleLabel(s.spec));
  const hardDays = kept
    .filter((s) => s.spec.structureSpec?.kind !== "easy_continuous")
    .map((s) => DAY_LABELS[s.dayOfWeek])
    .join(", ");

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold">Week {week.weekIndex + 1}</span>
        <Badge variant="outline" className={PHASE_STYLES[week.phase]}>
          {week.phase}
        </Badge>
        <span className="text-muted-foreground text-xs">
          {Math.round(week.weekKm)} km target · {week.sessions.length} sessions ·{" "}
          {week.weekStartYmd}
        </span>
      </div>

      <p className="text-sm">
        <span className="text-muted-foreground">rolesForPhase →</span>{" "}
        {bag.join(" · ")}
      </p>
      {hardDays && (
        <p className="text-muted-foreground text-xs">
          placeRoles spread the hard sessions across: {hardDays}
          {week.phase === "peak"
            ? " — the last race-pace spé is anchored to J-8→J-10 before the race."
            : ""}
        </p>
      )}

      <DayHeader />
      <WeekRow week={week} />

      {dropped.length > 0 && (
        <p className="text-xs text-rose-600">
          Dropped {dropped.length}:{" "}
          {dropped
            .map((s) => `${roleLabel(s.spec)} (${dropText(s)})`)
            .join(", ")}
        </p>
      )}
    </div>
  );
}

function WeeksStep({ trace }: { trace: FiveKPlanTrace }) {
  return (
    <Step
      n={4}
      title="Weekly microcycles"
      fn="microcycle5K() = rolesForPhase() → placeRoles() → roleToSessionSpec()"
      what="For each week: pick the session bag for the phase & frequency, lay it across the available days for recovery, then materialise each into a structured workout. Sessions outside the plan window are dropped here."
    >
      <div className="flex flex-col gap-4">
        {trace.weeks.map((week) => (
          <div key={week.weekIndex} className="flex flex-col gap-1.5">
            {(week.weekIndex === 0 ||
              trace.weeks[week.weekIndex - 1]?.phase !== week.phase) && (
              <p className="text-muted-foreground text-xs italic">
                {PHASE_INTENT[week.phase]}
              </p>
            )}
            <WeekNarrative week={week} />
          </div>
        ))}
      </div>
    </Step>
  );
}

// --- Step 5: taper ------------------------------------------------------------

function TaperStep({ trace }: { trace: FiveKPlanTrace }) {
  const kept = trace.taper.sessions.filter((s) => !s.dropped);
  return (
    <Step
      n={5}
      title="Taper"
      fn="taperSessions5K()"
      what={PHASE_INTENT.taper!}
    >
      {kept.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          No taper sessions for this scenario.
        </p>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {trace.taper.sessions
            .slice()
            .sort((a, b) => (a.dateYmd < b.dateYmd ? -1 : 1))
            .map((s, i) => (
              <li key={i} className="flex items-center gap-2">
                <span className="text-muted-foreground w-28 font-mono text-xs">
                  {s.dateYmd} {DAY_LABELS[s.dayOfWeek]}
                </span>
                {s.dropped ? (
                  <span className="text-rose-600 line-through">
                    {roleLabel(s.spec)}{" "}
                    <span className="text-xs no-underline">
                      ({dropText(s)})
                    </span>
                  </span>
                ) : (
                  <span>
                    {roleLabel(s.spec)}{" "}
                    <span className="text-muted-foreground text-xs">
                      — {s.workoutName}
                    </span>
                  </span>
                )}
              </li>
            ))}
        </ul>
      )}
    </Step>
  );
}

// --- Final plan breakdown -----------------------------------------------------

function FinalPlan({ trace }: { trace: FiveKPlanTrace }) {
  const rows = [
    ...trace.weeks.flatMap((w) =>
      w.sessions.map((s) => ({ ...s, phase: w.phase })),
    ),
    ...trace.taper.sessions.map((s) => ({ ...s, phase: "taper" })),
  ]
    .filter((s) => !s.dropped)
    .sort((a, b) => (a.dateYmd < b.dateYmd ? -1 : 1));

  const total = rows.length;

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="text-base">Final plan</CardTitle>
        <CardDescription>
          {total} workouts would be written · {trace.blocks.length} blocks
          {trace.race ? ` · race on ${trace.race.dateYmd}` : ""} — nothing is
          persisted.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          {trace.blocks.map((b) => (
            <div
              key={b.type}
              className="flex items-center gap-2 rounded-md border px-2 py-1"
            >
              <Badge variant="outline" className={PHASE_STYLES[b.type]}>
                {b.type}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {b.startYmd} → {b.endYmd}
              </span>
            </div>
          ))}
        </div>

        <WeekCalendar weeks={trace.weeks} taper={trace.taper.sessions} />

        <div>
          <p className="mb-2 text-sm font-medium">All workouts</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Km</TableHead>
                <TableHead>Workout</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">
                    {r.dateYmd}
                  </TableCell>
                  <TableCell>{DAY_LABELS[r.dayOfWeek]}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={PHASE_STYLES[r.phase]}>
                      {r.phase}
                    </Badge>
                  </TableCell>
                  <TableCell>{roleLabel(r.spec)}</TableCell>
                  <TableCell>{km(r.labelDistanceMeters)}</TableCell>
                  <TableCell className="max-w-72 truncate text-xs">
                    {r.workoutName ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
              {trace.race && (
                <TableRow className="bg-muted/40">
                  <TableCell className="font-mono text-xs">
                    {trace.race.dateYmd}
                  </TableCell>
                  <TableCell>{DAY_LABELS[isoDow(trace.race.dateYmd)]}</TableCell>
                  <TableCell>
                    <Badge variant="outline">race</Badge>
                  </TableCell>
                  <TableCell>Race</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell className="text-xs">Race day</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Top-level ----------------------------------------------------------------

export function TraceView({ trace }: { trace: FiveKPlanTrace }) {
  return (
    <div className="flex flex-col gap-4">
      <GridStep trace={trace} />
      <SplitStep trace={trace} />
      <VolumeStep trace={trace} />
      <WeeksStep trace={trace} />
      <TaperStep trace={trace} />
      <FinalPlan trace={trace} />
    </div>
  );
}
