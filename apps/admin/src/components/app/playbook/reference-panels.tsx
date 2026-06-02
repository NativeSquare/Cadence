"use client";

import type {
  FiveKBanks,
  FiveKConstants,
  FiveKTaperRules,
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
import { bankEntryLabel, minutes } from "./format";

/** Each session type's difficulty-ordered bank — the generator draws one entry
 * per week, sliding by athlete level + walking up with plan progress. */
export function SessionSpecsPanel({ banks }: { banks: FiveKBanks }) {
  const groups: Array<{
    name: string;
    intensity: string;
    bank: FiveKBanks[keyof FiveKBanks];
  }> = [
    { name: "SV1 long run", intensity: "SV1 (aerobic threshold)", bank: banks.sv1Long },
    { name: "SV2 threshold", intensity: "T (threshold)", bank: banks.sv2 },
    { name: "VMA courte", intensity: "I (VO₂max)", bank: banks.vmaShort },
    { name: "VMA longue", intensity: "I (VO₂max)", bank: banks.vmaLong },
    { name: "Mixte", intensity: "T then I", bank: banks.mixed },
    { name: "Allure spé (5K)", intensity: "5K goal pace", bank: banks.racePace },
    { name: "Rappel d’allure (taper)", intensity: "5K goal pace", bank: banks.rappel },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Session banks</CardTitle>
        <CardDescription>
          Each session type is a difficulty-ordered bank (easiest → hardest). The
          generator draws one entry per week: the athlete’s level (VDOT) slides a
          window into the bank, and plan progress walks upward within it, so
          workouts get harder as the race approaches.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {groups.map((g) => (
          <div key={g.name}>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="font-medium">{g.name}</span>
              <span className="text-muted-foreground text-xs">{g.intensity}</span>
            </div>
            <ol className="text-muted-foreground list-decimal space-y-0.5 pl-5 text-sm">
              {g.bank.map((e, i) => (
                <li key={i}>{bankEntryLabel(e)}</li>
              ))}
            </ol>
          </div>
        ))}
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
