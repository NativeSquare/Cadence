"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function VolumeChart({
  volumeCurve,
  planPeakKm,
}: {
  volumeCurve: number[];
  planPeakKm: number;
}) {
  const data = volumeCurve.map((value, i) => ({
    week: `W${i + 1}`,
    km: Math.round(value),
  }));

  if (data.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No pre-taper weeks for this scenario.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="week" fontSize={12} />
        <YAxis fontSize={12} unit=" km" width={56} />
        <Tooltip />
        <ReferenceLine
          y={Math.round(planPeakKm)}
          stroke="currentColor"
          strokeDasharray="4 4"
          className="text-rose-400"
          label={{
            value: `peak ${Math.round(planPeakKm)}`,
            position: "insideTopRight",
            fontSize: 11,
          }}
        />
        <Line
          type="monotone"
          dataKey="km"
          stroke="currentColor"
          className="text-sky-500"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
