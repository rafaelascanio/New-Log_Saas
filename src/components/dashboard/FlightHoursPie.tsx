"use client";
import { useEffect, useMemo, useState } from "react";

type RechartsPkg = {
  PieChart: any; Pie: any; Cell: any; Legend: any; ResponsiveContainer: any;
};

export default function FlightHoursPie({ pilot }: { pilot: any }) {
  const [R, setR] = useState<RechartsPkg | null>(null);

  useEffect(() => {
    let mounted = true;
    import("recharts")
      .then((m) => { if (mounted) setR({ PieChart: m.PieChart, Pie: m.Pie, Cell: m.Cell, Legend: m.Legend, ResponsiveContainer: m.ResponsiveContainer }); })
      .catch(() => { if (mounted) setR(null); });
    return () => { mounted = false; };
  }, []);

  const data = useMemo(() => ([
    { name: "IFR", value: 0 },
    { name: "PIC", value: 0 },
    { name: "SIC", value: 0 },
    { name: "VFR", value: 0 },
  ]), []);

  if (!R) {
    return (
      <div className="rounded-2xl border p-5">
        <h2 className="text-xl font-semibold mb-3">Flight Hours</h2>
        <div className="text-sm opacity-70">Chart unavailable (library not loaded).</div>
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
              {data.map((_, i) => <Cell key={i} />)}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}