"use client";
import { useEffect, useMemo, useState } from "react";

type Flight = {
  hours?: number;
  role?: string;
  category?: string;
};

type Pilot = { flights?: Flight[] };

type RechartsPkg = {
  PieChart: any; Pie: any; Cell: any; Legend: any; ResponsiveContainer: any;
};

const COLORS = ["#0F172A", "#1E293B", "#334155", "#475569"];

function computeData(pilot?: Pilot) {
  const totals = { IFR: 0, PIC: 0, SIC: 0, VFR: 0 };
  for (const flight of pilot?.flights || []) {
    const hours = flight.hours ?? 0;
    const role = (flight.role || "").toLowerCase();
    const category = (flight.category || "").toLowerCase();

    if (role.includes("pic")) totals.PIC += hours;
    if (role.includes("sic")) totals.SIC += hours;
    if (category.includes("ifr")) totals.IFR += hours;
    if (!category.includes("ifr")) totals.VFR += hours;
  }

  return [
    { name: "IFR", value: +totals.IFR.toFixed(2) },
    { name: "PIC", value: +totals.PIC.toFixed(2) },
    { name: "SIC", value: +totals.SIC.toFixed(2) },
    { name: "VFR", value: +totals.VFR.toFixed(2) },
  ];
}

export default function FlightHoursPie({ pilot }: { pilot?: Pilot }) {
  const [R, setR] = useState<RechartsPkg | null>(null);

  useEffect(() => {
    let mounted = true;
    import("recharts")
      .then((m) => {
        if (mounted) {
          setR({
            PieChart: m.PieChart,
            Pie: m.Pie,
            Cell: m.Cell,
            Legend: m.Legend,
            ResponsiveContainer: m.ResponsiveContainer,
          });
        }
      })
      .catch(() => {
        if (mounted) setR(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const data = useMemo(() => computeData(pilot), [pilot]);
  const hasData = data.some((item) => item.value > 0);

  if (!R || !hasData) {
    const summary = data
      .map((item) => `${item.name}: ${item.value.toFixed(2)}`)
      .join(" \u2022 ");
    return (
      <div className="rounded-2xl border p-5">
        <h2 className="text-xl font-semibold mb-3">Flight Hours</h2>
        <div className="text-sm opacity-70">
          {!R
            ? "Chart unavailable (library not loaded)."
            : summary || "No flight hour categories recorded."}
        </div>
      </div>
    );
  }

  const { PieChart, Pie, Cell, Legend, ResponsiveContainer } = R;
  return (
    <div className="rounded-2xl border p-5">
      <h2 className="text-xl font-semibold mb-3">Flight Hours</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius="80%">
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
