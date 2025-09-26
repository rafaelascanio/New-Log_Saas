
import { put } from "@vercel/blob";
import { parse } from "csv-parse/sync";

function toHours(hhmm) {
  const m = String(hhmm || "").trim().match(/^(\d+):(\d{1,2})$/);
  return m ? +(parseInt(m[1]) + parseInt(m[2]) / 60).toFixed(2) : 0;
}

function slugify(s) {
  return s.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

function buildMetrics(rows) {
  const byPilot = new Map();
  let totalFlights = 0, totalHours = 0;

  for (const r of rows) {
    const name = r["Pilot Full Name"];
    if (!name) continue;
    const id = slugify(name);
    const hours = toHours(r["Total Flight Time (HH:MM)"]);
    const dateISO = r["Flight Date"] ? new Date(r["Flight Date"]).toISOString().slice(0,10) : undefined;
    if (!byPilot.has(id)) byPilot.set(id, { id, name, totalFlights:0, totalHours:0, lastFlightDate:undefined, flights:[] });
    const P = byPilot.get(id);
    P.totalFlights++; P.totalHours = +(P.totalHours + hours).toFixed(2);
    if (dateISO && (!P.lastFlightDate || dateISO > P.lastFlightDate)) P.lastFlightDate = dateISO;
    P.flights.push({ date: dateISO, hours });
    totalFlights++; totalHours = +(totalHours + hours).toFixed(2);
  }
  return { generatedAt: new Date().toISOString(), summary:{ totalFlights, totalHours }, pilots:[...byPilot.values()] };
}

const url = process.env.DATA_SOURCE_URL;
const token = process.env.BLOB_READ_WRITE_TOKEN;
if (!url || !token) throw new Error("Missing env vars");

const res = await fetch(url);
const csv = await res.text();
const rows = parse(csv, { columns:true, skip_empty_lines:true, trim:true });
const metrics = buildMetrics(rows);

const out = await put("metrics.json", new Blob([JSON.stringify(metrics,null,2)],{type:"application/json"}), { access:"public", token, allowOverwrite: true });
console.log("✅ Uploaded metrics.json to:", out.url);
console.log("➡ Set NEXT_PUBLIC_BLOB_URL_BASE=", out.url.replace(/\/metrics\.json$/,""));
