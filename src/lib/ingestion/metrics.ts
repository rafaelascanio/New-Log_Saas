export type Row = {
  "Pilot Full Name": string;
  "Flight Date"?: string;
  "Aircraft Registration"?: string;
  "Registration"?: string;
  "Aircraft Make/Model"?: string;
  "Aircraft Type"?: string;
  "Aircraft Model"?: string;
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

function firstNonEmpty(values: Array<string | undefined>): string {
  for (const value of values) {
    const text = (value ?? "").toString().trim();
    if (text) {
      return text;
    }
  }
  return "";
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
    const dateISO = r["Flight Date"] ? new Date(r["Flight Date"]).toISOString().slice(0, 10) : undefined;
    const aircraftName = firstNonEmpty([
      r["Aircraft Make/Model"],
      r["Aircraft Type"],
      r["Aircraft Model"],
    ]) || "Unknown";
    const aircraftReg = firstNonEmpty([
      r["Aircraft Registration"],
      r["Registration"],
    ]);
    const route = [
      firstNonEmpty([r["Route From (ICAO)"]]),
      firstNonEmpty([r["Route To (ICAO)"]]),
    ].filter(Boolean).join(" -> ");

    if (!byPilot.has(id)) {
      byPilot.set(id, {
        id, name, totalFlights: 0, totalHours: 0,
        lastFlightDate: undefined, aircraftTypes: new Set(), flights: []
      });
    }
    const P = byPilot.get(id)!;
    P.totalFlights += 1;
    P.totalHours = +(P.totalHours + hours).toFixed(2);
    if (aircraftName && aircraftName !== "Unknown") {
      P.aircraftTypes.add(aircraftName);
    }
    if (dateISO && (!P.lastFlightDate || dateISO > P.lastFlightDate)) P.lastFlightDate = dateISO;

    P.flights.push({
      date: dateISO ?? "",
      aircraft: aircraftName,
      aircraftReg,
      route,
      hours,
    });

    totalFlights += 1;
    totalHours = +(totalHours + hours).toFixed(2);
  }

  const pilots = Array.from(byPilot.values()).map(p => ({
    ...p,
    aircraftTypes: Array.from(p.aircraftTypes).sort(),
  })).sort((a, b) => a.name.localeCompare(b.name));

  return {
    generatedAt: new Date().toISOString(),
    summary: { totalFlights, totalHours },
    pilots,
  };
}
