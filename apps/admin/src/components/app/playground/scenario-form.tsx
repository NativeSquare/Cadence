"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";

import { DAY_LABELS, isoDow } from "./format";

export type ScenarioState = {
  format: "5k" | "10k";
  planStartDate: string; // yyyy-mm-dd
  raceDate: string; // yyyy-mm-dd
  sessionsPerWeek: number;
  availableDays: number[]; // 0=Mon … 6=Sun
  pacingMode: "time" | "vdot";
  targetMinutes: number;
  targetSeconds: number;
  vdot: number;
  currentKm: number;
  locale: "en" | "fr";
};

export function ScenarioForm({
  value,
  onChange,
}: {
  value: ScenarioState;
  onChange: (next: ScenarioState) => void;
}) {
  const set = <K extends keyof ScenarioState>(key: K, v: ScenarioState[K]) =>
    onChange({ ...value, [key]: v });

  const raceDow = value.raceDate ? isoDow(value.raceDate) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Scenario</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label>Distance</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={value.format}
            onValueChange={(v) =>
              v && set("format", v as ScenarioState["format"])
            }
          >
            <ToggleGroupItem value="5k">5K</ToggleGroupItem>
            <ToggleGroupItem value="10k">10K</ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="planStart">Plan start</Label>
            <Input
              id="planStart"
              type="date"
              value={value.planStartDate}
              onChange={(e) => set("planStartDate", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="raceDate">Race date</Label>
            <Input
              id="raceDate"
              type="date"
              value={value.raceDate}
              onChange={(e) => set("raceDate", e.target.value)}
            />
            {raceDow !== null && (
              <span className="text-muted-foreground text-xs">
                {DAY_LABELS[raceDow]}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>Sessions / week</Label>
            <Select
              value={String(value.sessionsPerWeek)}
              onValueChange={(v) => set("sessionsPerWeek", Number(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 3, 4, 5, 6].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currentKm">Current weekly km</Label>
            <Input
              id="currentKm"
              type="number"
              min={0}
              value={value.currentKm}
              onChange={(e) => set("currentKm", Number(e.target.value))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Available days</Label>
          <ToggleGroup
            type="multiple"
            variant="outline"
            value={value.availableDays.map(String)}
            onValueChange={(vals) =>
              set(
                "availableDays",
                vals.map(Number).sort((a, b) => a - b),
              )
            }
          >
            {DAY_LABELS.map((label, i) => (
              <ToggleGroupItem key={label} value={String(i)} aria-label={label}>
                {label.slice(0, 1)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Pacing</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={value.pacingMode}
            onValueChange={(v) =>
              v && set("pacingMode", v as ScenarioState["pacingMode"])
            }
          >
            <ToggleGroupItem value="time">Target time</ToggleGroupItem>
            <ToggleGroupItem value="vdot">Direct VDOT</ToggleGroupItem>
          </ToggleGroup>

          {value.pacingMode === "time" ? (
            <div className="mt-1 flex items-end gap-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="min" className="text-xs">
                  min
                </Label>
                <Input
                  id="min"
                  type="number"
                  min={0}
                  className="w-20"
                  value={value.targetMinutes}
                  onChange={(e) => set("targetMinutes", Number(e.target.value))}
                />
              </div>
              <span className="pb-2.5">:</span>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="sec" className="text-xs">
                  sec
                </Label>
                <Input
                  id="sec"
                  type="number"
                  min={0}
                  max={59}
                  className="w-20"
                  value={value.targetSeconds}
                  onChange={(e) => set("targetSeconds", Number(e.target.value))}
                />
              </div>
              <Badge variant="secondary" className="mb-1.5">
                {value.format === "10k" ? "10K target" : "5K target"}
              </Badge>
            </div>
          ) : (
            <div className="mt-1 flex flex-col gap-1.5">
              <Label htmlFor="vdot" className="text-xs">
                VDOT
              </Label>
              <Input
                id="vdot"
                type="number"
                min={20}
                max={85}
                className="w-28"
                value={value.vdot}
                onChange={(e) => set("vdot", Number(e.target.value))}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label>Locale</Label>
          <Select
            value={value.locale}
            onValueChange={(v) => set("locale", v as ScenarioState["locale"])}
          >
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">en</SelectItem>
              <SelectItem value="fr">fr</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
