
export type Row = {
  "Pilot Full Name": string;
  "Flight Date"?: string;
  "Aircraft Registration"?: string;
  "Aircraft Make/Model"?: string;
  "Route From (ICAO)"?: string;
  "Route To (ICAO)"?: string;
  "Total Flight Time (HH:MM)"?: string; // e.g., "1:30"
};

function toHours(hhmm?: string): number {
  if (!hhmm) return 0;
  const m = String(hhmm).trim().match(/^(\d+):(\d{1,2})$/);
  if (!m) return 0;
  const h = parseInt(m[1], 10) || 0;
  const min = parseInt(m[2], 10) || 0;
  return +(h + min / 60).toFixed(2);
}

function slugify(s: string) {
  return s.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

export function buildMetrics(rows: Row[]) {
  const byPilot = new Map<string, {
    id: string; name: string; totalFlights: number; totalHours: number;
    lastFlightDate?: string; aircraftTypes: Set<string>; flights: any[];
  }>();

  let totalFlights = 0;
  let totalHours = 0;

  for (const r of rows) {
    const name = (r["Pilot Full Name"] || "").trim();
    if (!name) continue;

    const id = slugify(name);
    const hours = toHours(r["Total Flight Time (HH:MM)"]);
    const dateISO = r["Flight Date"] ? new Date(r["Flight Date"]).toISOString().slice(0,10) : undefined;

    if (!byPilot.has(id)) {
      byPilot.set(id, {
        id, name, totalFlights: 0, totalHours: 0,
        lastFlightDate: undefined, aircraftTypes: new Set(), flights: []
      });
    }
    const P = byPilot.get(id)!;
    P.totalFlights += 1;
    P.totalHours = +(P.totalHours + hours).toFixed(2);
    if (r["Aircraft Make/Model"]) P.aircraftTypes.add(String(r["Aircraft Make/Model"]));
    if (dateISO && (!P.lastFlightDate || dateISO > P.lastFlightDate)) P.lastFlightDate = dateISO;

    P.flights.push({
      date: dateISO,
      aircraftReg: r["Aircraft Registration"] ?? "",
      aircraftType: r["Aircraft Make/Model"] ?? "",
      hours,
      route: [r["Route From (ICAO)"] ?? "", r["Route To (ICAO)"] ?? ""].filter(Boolean).join(" → ")
    });

    totalFlights += 1;
    totalHours = +(totalHours + hours).toFixed(2);
  }

  const pilots = Array.from(byPilot.values()).map(p => ({
    ...p,
    aircraftTypes: Array.from(p.aircraftTypes).sort(),
  })).sort((a,b)=> a.name.localeCompare(b.name));

  return {
    generatedAt: new Date().toISOString(),
    summary: { totalFlights, totalHours },
    pilots
  };
}
