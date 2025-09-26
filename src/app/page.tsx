import PilotGrid from "@/components/PilotGrid";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type Metrics = {
  summary: { totalFlights: number; totalHours: number };
  pilots: {
    id: string;
    name: string;
    totalFlights: number;
    totalHours: number;
    lastFlightDate?: string;
    flights?: any[];
  }[];
};

async function loadMetrics(): Promise<Metrics> {
  const base = process.env.NEXT_PUBLIC_BLOB_URL_BASE!;
  const r = await fetch(`${base}/metrics.json?ts=${Date.now()}`, { cache: "no-store" });
  if (!r.ok) throw new Error(`metrics.json ${r.status}`);
  return r.json();
}

export default async function Page() {
  try {
    const m = await loadMetrics();

    return (
      <main className="mx-auto max-w-7xl p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Dashboard</h1>

        {/* Summary */}
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl border p-4">
            <div className="text-sm opacity-70">Total Flights</div>
            <div className="text-3xl font-semibold">{m.summary?.totalFlights ?? 0}</div>
          </div>
          <div className="rounded-2xl border p-4">
            <div className="text-sm opacity-70">Total Hours</div>
            <div className="text-3xl font-semibold">{m.summary?.totalHours ?? 0}</div>
          </div>
        </section>

        {/* Pilots */}
        <PilotGrid pilots={m.pilots || []} />
      </main>
    );
  } catch (error) {
    console.error("Failed to load metrics", error);
    return (
      <main className="mx-auto max-w-3xl p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          We couldn't load the latest metrics. Please try refreshing the page.
        </div>
      </main>
    );
  }
}
