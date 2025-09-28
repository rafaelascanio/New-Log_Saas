import { put } from "@vercel/blob";
import { parse } from "csv-parse/sync";

function toHours(hhmm) {
  const m = String(hhmm || "").trim().match(/^(\d+):(\d{1,2})$/);
  return m ? +(parseInt(m[1], 10) + parseInt(m[2], 10) / 60).toFixed(2) : 0;
}

function slugify(s) {
  return s.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

function firstNonEmpty(values) {
  for (const value of values) {
    const text = (value ?? "").toString().trim();
    if (text) {
      return text;
    }
  }
  return "";
}

function buildMetrics(rows) {
  const byPilot = new Map();
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
        id,
        name,
        totalFlights: 0,
        totalHours: 0,
        lastFlightDate: undefined,
        aircraftTypes: new Set(),
        flights: [],
      });
    }

    const pilot = byPilot.get(id);
    pilot.totalFlights += 1;
    pilot.totalHours = +(pilot.totalHours + hours).toFixed(2);
    if (aircraftName && aircraftName !== "Unknown") {
      pilot.aircraftTypes.add(aircraftName);
    }
    if (dateISO && (!pilot.lastFlightDate || dateISO > pilot.lastFlightDate)) {
      pilot.lastFlightDate = dateISO;
    }

    pilot.flights.push({
      date: dateISO ?? "",
      aircraft: aircraftName,
      aircraftReg,
      route,
      hours,
    });

    totalFlights += 1;
    totalHours = +(totalHours + hours).toFixed(2);
  }

  const pilots = Array.from(byPilot.values())
    .map((pilot) => ({
      ...pilot,
      aircraftTypes: Array.from(pilot.aircraftTypes).sort(),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    generatedAt: new Date().toISOString(),
    summary: { totalFlights, totalHours },
    pilots,
  };
}

const url = process.env.DATA_SOURCE_URL;
const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!url || !token) throw new Error("Missing env vars");

const res = await fetch(url);
const csv = await res.text();
const rows = parse(csv, { columns: true, skip_empty_lines: true, trim: true });
const metrics = buildMetrics(rows);

const out = await put(
  "metrics.json",
  new Blob([JSON.stringify(metrics, null, 2)], { type: "application/json" }),
  { access: "public", token, allowOverwrite: true },
);
console.log("Uploaded metrics.json to:", out.url);
console.log("Set NEXT_PUBLIC_BLOB_URL_BASE=", out.url.replace(/\/metrics\.json$/, ""));


