// scripts/ingest-once.mjs
import { put } from "@vercel/blob";
import { parse } from "csv-parse/sync";

// ===== ENV =====
const DATA_SOURCE_URL = process.env.DATA_SOURCE_URL;
const BLOB_READ_WRITE_TOKEN =
  process.env.BLOB_READ_WRITE_TOKEN ||
  process.env.VERCEL_BLOB_RW_TOKEN ||
  process.env.BLOB_TOKEN;

if (!DATA_SOURCE_URL) {
  console.error("ERROR: Missing DATA_SOURCE_URL");
  process.exit(1);
}
if (!BLOB_READ_WRITE_TOKEN) {
  console.error("ERROR: Missing BLOB_READ_WRITE_TOKEN");
  process.exit(1);
}

// ===== HEADER ALIASING =====
const CANON = {
  pilotName: "pilotName",
  licenseNumber: "licenseNumber",
  nationality: "nationality",
  dateOfBirth: "dateOfBirth",
  licenseType: "licenseType",
  licenseIssueDate: "licenseIssueDate",
  licenseExpiryDate: "licenseExpiryDate",
  date: "date",
  aircraft: "aircraft",
  aircraftReg: "aircraftReg",
  route: "route",
  hours: "hours",
  role: "role",     // PIC | SIC
  rules: "rules",   // IFR | VFR
  night: "night",   // true/false (or 1/0)
};

const HEADER_ALIASES = new Map([
  // Pilot identity (from your CSV)
  [/^pilot\s*full\s*name$/i, CANON.pilotName],
  [/^license\s*number$/i, CANON.licenseNumber],
  [/^nationality$/i, CANON.nationality],
  [/^date\s*of\s*birth$/i, CANON.dateOfBirth],
  [/^license\s*type$/i, CANON.licenseType],
  [/^issuing\s*authority$/i, "issuingAuthority"], // optional, not used yet
  [/^license\s*issue\s*date$/i, CANON.licenseIssueDate],
  [/^license\s*expiry\s*date$/i, CANON.licenseExpiryDate],

  // Flight fields (from your CSV)
  [/^flight\s*date$/i, CANON.date],
  [/^aircraft\s*registration$/i, CANON.aircraftReg],
  [/^aircraft\s*make\/model$/i, CANON.aircraft],
  [/^route\s*from\s*\(icao\)$/i, "fromIcao"],
  [/^route\s*to\s*\(icao\)$/i, "toIcao"],
  [/^total\s*flight\s*time\s*\(hh:mm\)$/i, CANON.hours],

  // Time buckets (used to derive role/rules/night + aggregates)
  [/^day\s*time\s*\(hh:mm\)$/i, "dayTime"],
  [/^night\s*time\s*\(hh:mm\)$/i, "nightTime"],
  [/^ifr\s*time\s*\(hh:mm\)$/i, "ifrTime"],
  [/^pic\s*time\s*\(hh:mm\)$/i, "picTime"],
  [/^sic\s*time\s*\(hh:mm\)$/i, "sicTime"],

  // Optional extras we may use later
  [/^approach\s*type$/i, "approachType"],
  [/^approach\s*count$/i, "approachCount"],
  [/^simulator\s*device$/i, "simDevice"],
  [/^simulator\s*time\s*\(hh:mm\)$/i, "simTime"],
  [/^cross\s*country\s*time\s*\(hh:mm\)$/i, "xcTime"],
  [/^solo\s*time\s*\(hh:mm\)$/i, "soloTime"],
  [/^dual\s*received\s*\(hh:mm\)$/i, "dualTime"],
  [/^instructor\s*time\s*\(hh:mm\)$/i, "cfiiTime"],
  [/^remarks$/i, "remarks"],
  [/^certification\s*type$/i, "certType"],
  [/^issued\s*by$/i, "certIssuedBy"],
  [/^certification\s*issue\s*date$/i, "certIssueDate"],
  [/^certification\s*valid\s*until$/i, "certValidUntil"],
  [/^certification\s*description$/i, "certDescription"],
  [/^certification\s*status$/i, "certStatus"],
]);

function aliasKey(raw) {
  for (const [re, canon] of HEADER_ALIASES.entries()) {
    if (re.test(raw)) return canon;
  }
  return raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

// ===== HELPERS =====
function toNumberHours(v) {
  if (v == null) return 0;
  const s = String(v).trim();
  const m = s.match(/^(\d+):(\d{1,2})$/); // HH:MM
  if (m) return +(parseInt(m[1], 10) + parseInt(m[2], 10) / 60).toFixed(2);
  const n = parseFloat(s.replace(",", "."));
  return Number.isFinite(n) ? +n.toFixed(2) : 0;
}

function slugifyName(n) {
  return String(n || "unknown")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}

function asISODate(s) {
  const v = String(s || "").trim();
  if (!v) return "";
  const t = Date.parse(v);
  return Number.isNaN(t) ? v : new Date(t).toISOString().slice(0, 10);
}

// ===== FETCH CSV =====
const resp = await fetch(DATA_SOURCE_URL, { headers: { "User-Agent": "ingest-once/1.0" } });
if (!resp.ok) {
  console.error(`ERROR: Failed to fetch CSV. HTTP ${resp.status}`);
  process.exit(1);
}
const csvText = await resp.text();

// ===== PARSE + NORMALIZE HEADERS =====
const rows = parse(csvText, { columns: true, skip_empty_lines: true });
const normalizedRows = rows.map((row) => {
  const out = {};
  for (const [key, val] of Object.entries(row)) {
    const a = aliasKey(key);
    out[a] = typeof val === "string" ? val.trim() : val;
  }
  return out;
});

// ===== BUILD PILOTS & FLIGHTS =====
const pilotMap = new Map(); // id -> accumulator

for (const r of normalizedRows) {
  const name = r[CANON.pilotName] || r.name || "Unknown";
  const id = slugifyName(name);

  if (!pilotMap.has(id)) {
    pilotMap.set(id, {
      id,
      name,
      licenseNumber: "",
      nationality: "",
      dateOfBirth: "",
      licenseType: "",
      licenseIssueDate: "",
      licenseExpiryDate: "",
      flights: [],
      aircraftTypesSet: new Set(),
      lastFlightDate: "",
    });
  }
  const p = pilotMap.get(id);

  // keep last non-empty metadata
  for (const key of [
    CANON.licenseNumber,
    CANON.nationality,
    CANON.dateOfBirth,
    CANON.licenseType,
    CANON.licenseIssueDate,
    CANON.licenseExpiryDate,
  ]) {
    if (r[key]) p[key] = r[key];
  }

  // --- build flight if we have basics from your CSV columns ---
  const flightDate = r[CANON.date];                // "Flight Date"
  const aircraft   = r[CANON.aircraft];            // "Aircraft Make/Model"
  const hoursNum   = toNumberHours(r[CANON.hours]); // "Total Flight Time (HH:MM)"
  const fromIcao   = r["fromIcao"];                // "Route From (ICAO)"
  const toIcao     = r["toIcao"];                  // "Route To (ICAO)"

  if (flightDate && aircraft) {
    // derive role / rules / night from time buckets
    const picH   = toNumberHours(r["picTime"]);
    const sicH   = toNumberHours(r["sicTime"]);
    const ifrH   = toNumberHours(r["ifrTime"]);
    const nightH = toNumberHours(r["nightTime"]);

    const role   = picH > 0 ? "PIC" : (sicH > 0 ? "SIC" : "");
    const rules  = ifrH > 0 ? "IFR" : "VFR";
    const night  = nightH > 0;

    const dateISO = asISODate(flightDate);
    const route = (fromIcao || toIcao)
      ? `${fromIcao || ""} -> ${toIcao || ""}`.trim()
      : (r[CANON.route] || "");

    p.flights.push({
      date: dateISO || String(flightDate),
      aircraft,
      aircraftReg: r[CANON.aircraftReg] || "",
      route,
      hours: hoursNum,
      role,
      rules,
      night,
    });

    if (aircraft) p.aircraftTypesSet.add(aircraft);
    if (dateISO && (!p.lastFlightDate || new Date(dateISO) > new Date(p.lastFlightDate))) {
      p.lastFlightDate = dateISO;
    }
  }
}

// ===== AGGREGATE & OUTPUT METRICS =====
const pilots = [];
for (const p of pilotMap.values()) {
  const totals = p.flights.reduce(
    (acc, f) => {
      acc.totalFlights += 1;
      acc.totalHours += f.hours;
      if (f.role === "PIC") acc.pic += f.hours;
      if (f.role === "SIC") acc.sic += f.hours;
      if (f.rules === "IFR") acc.ifr += f.hours;
      if (f.night) acc.night += f.hours; else acc.day += f.hours;
      return acc;
    },
    { totalFlights: 0, totalHours: 0, pic: 0, sic: 0, ifr: 0, day: 0, night: 0 }
  );

  pilots.push({
    id: p.id,
    name: p.name,
    licenseNumber: p.licenseNumber || "",
    nationality: p.nationality || "",
    dateOfBirth: p.dateOfBirth || "",
    licenseType: p.licenseType || "",
    licenseIssueDate: p.licenseIssueDate || "",
    licenseExpiryDate: p.licenseExpiryDate || "",
    totalFlights: totals.totalFlights,
    totalHours: +totals.totalHours.toFixed(2),
    dayHours: +totals.day.toFixed(2),
    nightHours: +totals.night.toFixed(2),
    picHours: +totals.pic.toFixed(2),
    sicHours: +totals.sic.toFixed(2),
    ifrHours: +totals.ifr.toFixed(2),
    aircraftTypes: Array.from(p.aircraftTypesSet),
    lastFlightDate: p.lastFlightDate || "",
    flights: p.flights,
  });
}

const metrics = { pilots };

// ===== UPLOAD TO VERCEL BLOB =====
const out = await put(
  "metrics.json",
  new Blob([JSON.stringify(metrics, null, 2)], { type: "application/json" }),
  { access: "public", token: BLOB_READ_WRITE_TOKEN, allowOverwrite: true }
);

console.log(`✅ Uploaded metrics.json: ${out.url}`);
console.log(`➡ Set NEXT_PUBLIC_BLOB_URL_BASE=${out.url.replace(/\/metrics\.json$/, "")}`);
