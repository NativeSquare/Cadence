"use client";

import type { Composition } from "@packages/backend/convex/agoge/plans/fiveKPlaybook";

import { Badge } from "@/components/ui/badge";
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

import { PHASE_STYLES } from "../playground/format";
import {
  isQualityTemplate,
  roleTemplateLabel,
  SLOT_ROWS,
  templatesForSlots,
} from "./format";

/**
 * One phase's weekly session composition, as a table: rows = sessions per week
 * (2 → "6+"), each cell the ordered list of that week's sessions. This is the
 * "Tier A" coaching grid — what a coach reads to see what a week contains.
 */
export function CompositionTable({
  title,
  intent,
  phaseColor,
  composition,
}: {
  title: string;
  intent: string;
  /** Keys into PHASE_STYLES (shared with the playground) for the badge colour. */
  phaseColor: "base" | "build" | "peak";
  composition: Composition;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Badge variant="outline" className={PHASE_STYLES[phaseColor]}>
            {title}
          </Badge>
        </CardTitle>
        <CardDescription>{intent}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-28">Sessions / week</TableHead>
              <TableHead>Sessions that week</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {SLOT_ROWS.map((slots) => {
              const templates = templatesForSlots(composition, slots);
              const label = slots === 6 ? "6+" : String(slots);
              return (
                <TableRow key={slots}>
                  <TableCell className="text-muted-foreground font-medium">
                    {label}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {templates.map((t, i) => (
                        <Badge
                          // Order within a week is not semantic (placeRoles
                          // re-lays them), so index keys are fine here.
                          key={i}
                          variant={isQualityTemplate(t) ? "default" : "secondary"}
                        >
                          {roleTemplateLabel(t)}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
