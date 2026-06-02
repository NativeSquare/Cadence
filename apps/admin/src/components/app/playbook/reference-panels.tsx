"use client";

import type {
  FiveKConstants,
  FiveKTaperRules,
  RepCount,
} from "@packages/backend/convex/agoge/plans/fiveKPlaybook";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { DAY_LABELS } from "../playground/format";
import { minutes, recovery } from "./format";

/** "8–12 (12 when weekly km ≥ 70% of peak)" from a volume-conditional RepCount. */
function repCountLabel(r: RepCount): string {
  return `${r.lo}–${r.hi} (${r.hi} when weekly km ≥ ${Math.round(
    r.hiThreshold * 100,
  )}% of peak)`;
}

/** Per-session structure (reps × distance/duration, intensity, recovery). */
export function SessionSpecsPanel({ c }: { c: FiveKConstants }) {
  const rows: Array<{
    name: string;
    work: string;
    intensity: string;
    rec: string;
  }> = [
    {
      name: "SV1 long run",
      work: `${c.sv1Block.reps} × ${minutes(c.sv1Block.workSec)} blocks`,
      intensity: "SV1 (aerobic threshold)",
      rec: `${recovery(c.sv1Block.recoverySec)} @ easy`,
    },
    {
      name: "SV2 threshold",
      work: `${repCountLabel(c.reps.sv2)} × ${c.repDistancesM.sv2}m`,
      intensity: "T (threshold)",
      rec: `${recovery(c.recoveriesSec.sv2)} @ easy`,
    },
    {
      name: "VMA courte",
      work: `${repCountLabel(c.reps.vmaShort)} × ${c.repDistancesM.vmaShort}m`,
      intensity: "I (VO₂max)",
      rec: `${recovery(c.recoveriesSec.vmaShort)} @ easy`,
    },
    {
      name: "VMA longue",
      work: `${repCountLabel(c.reps.vmaLong)} × ${c.repDistancesM.vmaLong}m`,
      intensity: "I (VO₂max)",
      rec: `${recovery(c.recoveriesSec.vmaLong)} @ easy`,
    },
    {
      name: "Mixte",
      work: `${c.mixed.first.reps} × ${c.mixed.first.repDistanceM}m + ${c.mixed.second.reps} × ${c.mixed.second.repDistanceM}m`,
      intensity: "T then I",
      rec: `${recovery(c.recoveriesSec.sv2)} / ${recovery(
        c.recoveriesSec.vmaShort,
      )}, bridge ${recovery(c.recoveriesSec.mixedBridge)}`,
    },
    {
      name: "Race-pace 5K",
      work: `${c.reps.racePace} × ${c.repDistancesM.racePace}m`,
      intensity: "5K goal pace",
      rec: `${recovery(c.recoveriesSec.racePace)} @ easy`,
    },
    {
      name: "Taper tune-up",
      work: `${c.reps.taperTuneUp} × ${c.taperTuneUp.repDistanceM}m`,
      intensity: "5K goal pace",
      rec: `${recovery(c.recoveriesSec.racePace)} @ easy`,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Session structures</CardTitle>
        <CardDescription>
          What each session type prescribes. Rep counts that scale with volume
          show the low–high range and the threshold at which the higher count
          kicks in.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session</TableHead>
              <TableHead>Work</TableHead>
              <TableHead>Intensity</TableHead>
              <TableHead>Recovery</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.name}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.work}</TableCell>
                <TableCell className="text-muted-foreground">
                  {r.intensity}
                </TableCell>
                <TableCell className="text-muted-foreground">{r.rec}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/** Easy-run / warmup / cooldown duration bands (scaled by weekly volume). */
export function DurationsPanel({ c }: { c: FiveKConstants }) {
  const d = c.durationsSec;
  const rows = [
    { name: "Easy run", value: `${minutes(d.easyMin)} – ${minutes(d.easyMax)}` },
    { name: "Warmup", value: `${minutes(d.warmupMin)} – ${minutes(d.warmupMax)}` },
    {
      name: "Cooldown",
      value: `${minutes(d.cooldownMin)} – ${minutes(d.cooldownMax)}`,
    },
    { name: "Race-eve shakeout", value: `${minutes(d.shakeout)} (fixed)` },
  ];
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Durations</CardTitle>
        <CardDescription>
          Bands scale linearly between min and max with weekly volume (weekly km
          ÷ peak km); the shakeout is fixed.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.name}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {r.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/** Taper composition rules + the race-day → taper-length table. */
export function TaperPanel({ taper }: { taper: FiveKTaperRules }) {
  const t = taper.taperDays;
  const taperDaysFor = (dow: number) =>
    dow <= t.earlyWeekCutoffDow ? dow + t.earlyAddend : dow + t.lateAddend;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Taper rules</CardTitle>
        <CardDescription>
          The taper is the variable tail that carries the plan to race day. Its
          length depends on which weekday the race falls on.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Race-eve shakeout</TableCell>
              <TableCell className="text-muted-foreground">
                Only for athletes training ≥{" "}
                {taper.shakeoutMinSessionsPerWeek} days/week
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Pace tune-up</TableCell>
              <TableCell className="text-muted-foreground">
                On a scheduled day {taper.tuneUpWindowDaysBeforeRace.lo}–
                {taper.tuneUpWindowDaysBeforeRace.hi} days before the race
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Race-week budget</TableCell>
              <TableCell className="text-muted-foreground">
                Sessions per week − {taper.raceWeekBudgetOffset} (the race itself
                is the last session)
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <div>
          <p className="text-muted-foreground mb-2 text-sm font-medium">
            Taper length by race weekday
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Race day</TableHead>
                <TableHead>Taper length</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {DAY_LABELS.map((label, dow) => (
                <TableRow key={label}>
                  <TableCell className="font-medium">{label}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {taperDaysFor(dow)} days
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
