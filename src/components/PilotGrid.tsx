"use client";
import { useMemo, useState } from "react";

export type Pilot = {
  id: string;
  name: string;
  totalFlights: number;
  totalHours: number;
  lastFlightDate?: string;
  flights?: any[];
};

export default function PilotGrid({ pilots }: { pilots: Pilot[] }) {
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const filtered = useMemo(() => {
    const qn = q.trim().toLowerCase();
    return (pilots || []).filter((p) => {
      const okName = qn ? p.name.toLowerCase().includes(qn) : true;
      const d = p.lastFlightDate ?? "";
      const okFrom = from ? d >= from : true;
      const okTo = to ? d <= to : true;
      return okName && okFrom && okTo;
    });
  }, [pilots, q, from, to]);

  const counts = useMemo(
    () => ({
      pilots: filtered.length,
      flights: filtered.reduce((s, p) => s + (p.totalFlights || 0), 0),
      hours: +filtered.reduce((s, p) => s + (p.totalHours || 0), 0).toFixed(2),
    }),
    [filtered]
  );

  return (
    <section className="space-y-3">
      <div className="rounded-2xl border p-4 space-y-3">
        <div className="text-sm font-medium">Filters</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="Search pilot…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="From (YYYY-MM-DD)"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
          <input
            className="border rounded-lg px-3 py-2"
            placeholder="To (YYYY-MM-DD)"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className="text-xs opacity-70">
          Showing {counts.pilots} pilots, {counts.flights} flights, {counts.hours} hours.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <a key={p.id} href={`/pilot/${p.id}`} className="rounded-2xl border p-4 hover:shadow-sm">
            <div className="text-lg font-semibold">{p.name}</div>
            <div className="text-sm opacity-70">Flights: {p.totalFlights}</div>
            <div className="text-sm opacity-70">Hours: {p.totalHours}</div>
            <div className="text-sm opacity-70">Last flight: {p.lastFlightDate ?? "—"}</div>
          </a>
        ))}
      </div>
    </section>
  );
}
