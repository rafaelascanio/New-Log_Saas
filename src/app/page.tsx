import PilotGrid from "@/components/PilotGrid";
import PilotProfileCard from "@/components/dashboard/PilotProfileCard";
import FlightHoursCard from "@/components/dashboard/FlightHoursCard";
import LastFlightCard from "@/components/dashboard/LastFlightCard";
import CertificationsCard from "@/components/dashboard/CertificationsCard";
import FlightHoursPie from "@/components/dashboard/FlightHoursPie";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type Flight = {
  date?: string;
  hours?: number;
  route?: string;
  aircraft?: string;
  aircraftReg?: string;
  aircraftType?: string;
  category?: string;
};

type Pilot = {
  id: string;
  name: string;
  totalFlights: number;
  totalHours: number;
  lastFlightDate?: string;
  flights?: Flight[];
};

type Metrics = {
  summary: { totalFlights: number; totalHours: number };
  pilots: Pilot[];
};

async function loadMetrics(): Promise<Metrics> {
  const base = process.env.NEXT_PUBLIC_BLOB_URL_BASE!;
  const init: RequestInit = process.env.NODE_ENV === "development" ? { cache: "no-store" } : {};
  const r = await fetch(`${base}/metrics.json?ts=${Date.now()}`, init);
  if (!r.ok) throw new Error(`metrics.json ${r.status}`);
  return r.json();
}

export default async function Page({
  searchParams,
}: {
  searchParams: { pilotId?: string };
}) {
  try {
    const metrics = await loadMetrics();

    const selectedPilotId = searchParams.pilotId;
    const selectedPilot = selectedPilotId
      ? metrics.pilots.find((pilot) => pilot.id === selectedPilotId) ?? null
      : null;

    if (!selectedPilot) {
      return (
        <main className="mx-auto max-w-7xl p-6 space-y-6">
          <h1 className="text-2xl font-semibold">Pilot Logbook</h1>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border p-4">
              <div className="text-sm opacity-70">Flights</div>
              <div className="text-3xl font-semibold">{metrics.summary?.totalFlights ?? 0}</div>
            </div>
            <div className="rounded-2xl border p-4">
              <div className="text-sm opacity-70">Total Hours</div>
              <div className="text-3xl font-semibold">{metrics.summary?.totalHours ?? 0}</div>
            </div>
          </section>

          <PilotGrid pilots={metrics.pilots || []} />
        </main>
      );
    }

    return (
      <main className="mx-auto max-w-7xl p-6 space-y-8">
        <h1 className="text-2xl font-semibold">Pilot Logbook</h1>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PilotProfileCard pilot={selectedPilot} />
          <FlightHoursCard pilot={selectedPilot} />
          <LastFlightCard pilot={selectedPilot} />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <CertificationsCard />
          <FlightHoursPie pilot={selectedPilot} />
        </section>
      </main>
    );
  } catch (error) {
    console.error("Failed to load metrics", error);
    return (
      <main className="mx-auto max-w-3xl p-6 space-y-4">
        <h1 className="text-2xl font-semibold">Pilot Logbook</h1>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {"It isn't loaded"}
        </div>
      </main>
    );
  }
}
