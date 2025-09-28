"use client";

type Pilot = {
  totalFlights?: number;
  totalHours?: number;
};

export default function FlightHoursCard({ pilot }: { pilot: Pilot }) {
  const flights = pilot.totalFlights ?? 0;
  const total = pilot.totalHours ?? 0;
  const pic = 0;
  const sic = 0;
  const ifr = 0;
  const day = 0;
  const night = 0;

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
        <Cell label="Total" value={total} />
        <Cell label="PIC" value={pic} />
        <Cell label="SIC" value={sic} />
        <Cell label="IFR" value={ifr} />
        <Cell label="Day" value={day} />
        <Cell label="Night" value={night} />
      </div>
    </div>
  );
}
