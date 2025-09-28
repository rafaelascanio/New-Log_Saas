"use client";

type Pilot = {
  totalFlights: number;
  totalHours: number;
  flights?: Array<{ hours?: number; category?: string; role?: string; lighting?: string }>;
};

type Totals = {
  pic: number;
  sic: number;
  ifr: number;
  day: number;
  night: number;
};

function computeBreakdown(pilot: Pilot): Totals {
  const totals: Totals = { pic: 0, sic: 0, ifr: 0, day: 0, night: 0 };
  for (const flight of pilot.flights || []) {
    const hours = flight.hours ?? 0;
    const role = (flight.role || "").toLowerCase();
    const category = (flight.category || "").toLowerCase();
    const lighting = (flight.lighting || "").toLowerCase();

    if (role.includes("pic")) totals.pic += hours;
    if (role.includes("sic")) totals.sic += hours;
    if (category.includes("ifr")) totals.ifr += hours;
    if (lighting.includes("night")) totals.night += hours;
    if (lighting.includes("day") || (!lighting && !category.includes("night"))) totals.day += hours;
  }

  return {
    pic: +totals.pic.toFixed(2),
    sic: +totals.sic.toFixed(2),
    ifr: +totals.ifr.toFixed(2),
    day: +totals.day.toFixed(2),
    night: +totals.night.toFixed(2),
  };
}

export default function FlightHoursCard({ pilot }: { pilot: Pilot }) {
  const flights = pilot.totalFlights ?? 0;
  const total = pilot.totalHours ?? 0;
  const breakdown = computeBreakdown(pilot);

  const Cell = ({ label, value }: { label: string; value: string | number }) => (
    <div className="rounded-xl border p-3 text-center">
      <div className="text-xs opacity-70">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );

  return (
    <div className="rounded-2xl border p-5 space-y-4">
      <h2 className="text-xl font-semibold">Flight Hours Breakdown</h2>
      <div className="grid grid-cols-3 gap-3">
        <Cell label="Flights" value={flights} />
        <Cell label="Total" value={Number(total).toFixed(2)} />
        <Cell label="PIC" value={breakdown.pic} />
        <Cell label="SIC" value={breakdown.sic} />
        <Cell label="IFR" value={breakdown.ifr} />
        <Cell label="Day" value={breakdown.day} />
        <Cell label="Night" value={breakdown.night} />
      </div>
    </div>
  );
}
