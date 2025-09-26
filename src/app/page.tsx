import React from "react";

type Metrics = {
  summary: { totalFlights: number; totalHours: number };
  pilots: {
    id: string; name: string; totalFlights: number; totalHours: number;
    lastFlightDate?: string; aircraftTypes?: string[];
  }[];
};

async function getMetrics(): Promise<Metrics> {
  const base = process.env.NEXT_PUBLIC_BLOB_URL_BASE!;
  const res = await fetch(`${base}/metrics.json?ts=${Date.now()}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`metrics fetch failed: ${res.status}`);
  const metrics = await res.json();
  return metrics;
}

export default async function Page() {
  const m = await getMetrics();

  return (
    <main className="mx-auto max-w-7xl p-6 space-y-6">
      {/* Top summary */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl border p-4">
          <div className="text-sm opacity-70">Total Flights</div>
          <div className="text-3xl font-semibold">{m.summary.totalFlights}</div>
        </div>
        <div className="rounded-2xl border p-4">
          <div className="text-sm opacity-70">Total Hours</div>
          <div className="text-3xl font-semibold">{m.summary.totalHours}</div>
        </div>
      </section>

      {/* One card per pilot */}
      <section>
        <h2 className="text-xl font-semibold mb-3">Pilots</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {m.pilots.map(p => (
            <a key={p.id} href={`/pilot/${p.id}`} className="rounded-2xl border p-4 hover:shadow-sm">
              <div className="text-lg font-semibold">{p.name}</div>
              <div className="text-sm opacity-70">Flights: {p.totalFlights}</div>
              <div className="text-sm opacity-70">Hours: {p.totalHours}</div>
              <div className="text-sm opacity-70">
                Last flight: {p.lastFlightDate ?? "—"}
              </div>
              {!!p.aircraftTypes?.length && (
                <div className="text-xs mt-2 opacity-70">Types: {p.aircraftTypes.join(", ")}</div>
              )}
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}