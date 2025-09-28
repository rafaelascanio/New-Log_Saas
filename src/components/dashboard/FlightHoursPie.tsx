"use client";

import { useMemo } from "react";

let HasRecharts = true;
let PieChart: any, Pie: any, Cell: any, Legend: any, ResponsiveContainer: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Re = require("recharts");
  PieChart = Re.PieChart;
  Pie = Re.Pie;
  Cell = Re.Cell;
  Legend = Re.Legend;
  ResponsiveContainer = Re.ResponsiveContainer;
} catch {
  HasRecharts = false;
}

type Pilot = Record<string, unknown>;

const COLORS = ["#22c55e", "#3b82f6", "#f97316", "#a855f7", "#14b8a6", "#facc15"];

export default function FlightHoursPie({ pilot }: { pilot: Pilot }) {
  void pilot;
  const data = useMemo(
    () => [
      { name: "IFR", value: 0 },
      { name: "PIC", value: 0 },
      { name: "SIC", value: 0 },
      { name: "VFR", value: 0 },
    ],
    []
  );

  if (!HasRecharts) {
    return (
      <div className="rounded-2xl border p-5">
        <h2 className="text-xl font-semibold mb-3">Flight Hours</h2>
        <div className="text-sm opacity-70">
          Chart library unavailable; add category totals to enable chart.
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border p-5">
      <h2 className="text-xl font-semibold mb-3">Flight Hours</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius="80%">
              {data.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
