"use client";

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
  lastFlightDate?: string;
  flights?: Flight[];
};

function getLastFlight(flights: Flight[]) {
  return flights.reduce<Flight | undefined>((latest, flight) => {
    if (!flight.date) return latest;
    if (!latest || !latest.date) return flight;
    return new Date(flight.date) > new Date(latest.date) ? flight : latest;
  }, undefined);
}

export default function LastFlightCard({ pilot }: { pilot: Pilot }) {
  const flights = pilot.flights || [];
  const last = getLastFlight(flights);

  const aircraft = last?.aircraftType || last?.aircraft || "—";
  const reg = last?.aircraftReg ? ` • ${last.aircraftReg}` : "";
  const route = last?.route || "—";
  const duration = typeof last?.hours === "number" ? `${last.hours.toFixed(2)} h` : "—";
  const type = last?.category || "—";
  const dateLabel = last?.date ? new Date(last.date).toLocaleDateString() : "—";

  return (
    <div className="rounded-2xl border p-5 space-y-3">
      <h2 className="text-xl font-semibold">Last Flight</h2>
      <div className="space-y-2 text-sm">
        <div>{dateLabel}</div>
        <div>
          {aircraft}
          {reg}
        </div>
        <div>{route}</div>
        <div>
          {duration} | {type}
        </div>
      </div>
    </div>
  );
}
