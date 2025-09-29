"use client";

type Flight = {
  date?: string;
  hours?: number;
  route?: string;
  aircraftReg?: string;
  aircraft?: string;
  category?: string;
};

type Pilot = { flights?: Flight[] };

function formatDate(date?: string) {
  if (!date) return "—";
  try {
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return date;
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return date;
  }
}

export default function LastFlightCard({ pilot }: { pilot: Pilot }) {
  const flights = pilot.flights || [];
  const last = [...flights].sort((a, b) => (b.date || "").localeCompare(a.date || ""))[0];

  const aircraft = last?.aircraft || "—";
  const reg = last?.aircraftReg ? ` - ${last.aircraftReg}` : "";
  const route = last?.route || "—";
  const duration = last?.hours != null ? `${last.hours.toFixed(2)} h` : "—";
  const type = last?.category || "—";
  const when = formatDate(last?.date);

  return (
    <div className="rounded-2xl border p-5 space-y-3">
      <h2 className="text-xl font-semibold">Last Flight</h2>
      <div className="space-y-2 text-sm">
        <div className="flex flex-col">
          <span className="font-medium">Date</span>
          <span>{when}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-medium">Aircraft</span>
          <span>{aircraft}{reg}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-medium">Route</span>
          <span>{route}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-medium">Duration / Type</span>
          <span>{duration} | {type}</span>
        </div>
      </div>
    </div>
  );
}
