import path from "node:path";
import { promises as fs } from "node:fs";

import EnhancedPilotDashboard from "@/components/EnhancedPilotDashboard";
import { toDashboardMetrics } from "@/lib/adapters/toDashboardMetrics";
import { hhmmToDecimal, toIsoDate } from "@/lib/time";
import {
  MetricsData,
  MetricsDataSchema,
  MetricsView,
  MetricsViewSchema,
} from "@/types/metrics";

export const revalidate = 0;
export const dynamic = "force-dynamic";

type MetricsInput = MetricsData | MetricsView;

type CsvModule = typeof import("csv-parse/sync");

type PilotAccumulator = {
  id: string;
  name: string;
  licenseNumber?: string;
  nationality?: string;
  dateOfBirth?: string;
  licenseType?: string;
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
  flights: Record<string, unknown>[];
  aircraftTypes: Set<string>;
};

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function fileHasContent(filePath: string): Promise<boolean> {
  if (!(await fileExists(filePath))) {
    return false;
  }
  const stats = await fs.stat(filePath);
  return stats.size > 0;
}

async function loadJsonFile<T>(
  filePath: string,
  schema: { parse: (input: unknown) => T }
): Promise<T | null> {
  if (!(await fileHasContent(filePath))) {
    return null;
  }
  try {
    const buffer = await fs.readFile(filePath);
    const text = buffer.toString("utf8").replace(/^\uFEFF/, "").trim();
    if (!text) return null;
    const parsed = JSON.parse(text);
    return schema.parse(parsed);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(`Failed to load ${path.basename(filePath)}:`, error);
    }
    return null;
  }
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizeRoute(from?: string, to?: string): string | undefined {
  const origin = from?.trim();
  const destination = to?.trim();
  if (!origin && !destination) return undefined;
  if (origin && destination) return `${origin} -> ${destination}`;
  return origin ?? destination ?? undefined;
}

async function loadFromCsv(filePath: string): Promise<MetricsView | null> {
  if (!(await fileHasContent(filePath))) {
    return null;
  }

  const csvText = await fs.readFile(filePath, "utf8");
  if (!csvText.trim()) {
    return { pilots: [] };
  }

  const { parse }: CsvModule = await import("csv-parse/sync");
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
  }) as Record<string, string>[];

  const rows = records.slice(0, 200);
  const pilots = new Map<string, PilotAccumulator>();

  for (const row of rows) {
    const name = row["Pilot Full Name"]?.trim();
    if (!name) continue;

    const id = slugify(name);
    if (!pilots.has(id)) {
      pilots.set(id, {
        id,
        name,
        licenseNumber: row["License Number"]?.trim(),
        nationality: row["Nationality"]?.trim(),
        dateOfBirth: row["Date of Birth"]?.trim(),
        licenseType: row["License Type"]?.trim(),
        licenseIssueDate: row["License Issue Date"]?.trim(),
        licenseExpiryDate: row["License Expiry Date"]?.trim(),
        flights: [],
        aircraftTypes: new Set<string>(),
      });
    }

    const pilot = pilots.get(id)!;
    const aircraft =
      row["Aircraft Make/Model"]?.trim() ||
      row["Aircraft Type"]?.trim() ||
      row["Aircraft Model"]?.trim();
    if (aircraft) {
      pilot.aircraftTypes.add(aircraft);
    }

    const flightTime = hhmmToDecimal(row["Total Flight Time (HH:MM)"]);
    const nightTime = hhmmToDecimal(row["Night Time (HH:MM)"]);
    const ifrTime = hhmmToDecimal(row["IFR Time (HH:MM)"]);

    const flight: Record<string, unknown> = {
      date: toIsoDate(row["Flight Date"] ?? ""),
      aircraft,
      aircraftReg: row["Aircraft Registration"]?.trim(),
      route: normalizeRoute(row["Route From (ICAO)"], row["Route To (ICAO)"]),
      hours: flightTime,
      night: nightTime > 0,
      approachType: row["Approach Type"]?.trim(),
      approachCount: row["Approach Count"]?.trim(),
      simulatorType: row["Simulator Type"]?.trim(),
      simulatorTime: row["Simulator Time (HH:MM)"]?.trim(),
      crossCountryTime: row["Cross Country Time (HH:MM)"]?.trim(),
      soloTime: row["Solo Time (HH:MM)"]?.trim(),
      picTime: row["PIC Time (HH:MM)"]?.trim(),
      sicTime: row["SIC Time (HH:MM)"]?.trim(),
      dualReceived: row["Dual Received (HH:MM)"]?.trim(),
      instructorTime: row["Instructor Time (HH:MM)"]?.trim(),
      remarks: row["Remarks"]?.trim(),
      Role: row["Role"]?.trim(),
      Rules: row["Rules"]?.trim(),
      "Day Time (HH:MM)": row["Day Time (HH:MM)"],
      "Night Time (HH:MM)": row["Night Time (HH:MM)"],
      "IFR Time (HH:MM)": row["IFR Time (HH:MM)"],
      "PIC Time (HH:MM)": row["PIC Time (HH:MM)"],
      "SIC Time (HH:MM)": row["SIC Time (HH:MM)"],
      "Simulator Time (HH:MM)": row["Simulator Time (HH:MM)"],
      "Cross Country Time (HH:MM)": row["Cross Country Time (HH:MM)"],
      "Solo Time (HH:MM)": row["Solo Time (HH:MM)"],
      "Dual Received (HH:MM)": row["Dual Received (HH:MM)"],
      "Instructor Time (HH:MM)": row["Instructor Time (HH:MM)"],
      "Aircraft LSA": row["Aircraft LSA"],
      "Aircraft Single Engine": row["Aircraft Single Engine"],
      "Aircraft Multi Engine": row["Aircraft Multi Engine"],
      "Aircraft Turboprop": row["Aircraft Turboprop"],
      "Aircraft Turbojet": row["Aircraft Turbojet"],
      "Aircraft Helicopter": row["Aircraft Helicopter"],
      "Aircraft Glider": row["Aircraft Glider"],
      "Aircraft Ultralight Motorized": row["Aircraft Ultralight Motorized"],
      "Aircraft Ultralight Non-Motorized": row["Aircraft Ultralight Non-Motorized"],
    };

    if (!flight.Rules && ifrTime > 0) {
      flight.Rules = "IFR";
    } else if (!flight.Rules && flightTime > 0) {
      flight.Rules = "VFR";
    }

    pilot.flights.push(flight);
  }

  const pilotList = Array.from(pilots.values()).map((pilot) => ({
    id: pilot.id,
    name: pilot.name,
    licenseNumber: pilot.licenseNumber,
    nationality: pilot.nationality,
    dateOfBirth: pilot.dateOfBirth,
    licenseType: pilot.licenseType,
    licenseIssueDate: pilot.licenseIssueDate,
    licenseExpiryDate: pilot.licenseExpiryDate,
    aircraftTypes: pilot.aircraftTypes.size
      ? Array.from(pilot.aircraftTypes.values())
      : undefined,
    flights: pilot.flights,
  }));

  return { pilots: pilotList };
}

async function loadMetrics(): Promise<MetricsInput> {
  const baseDir = process.cwd();
  const metricsPath = path.join(baseDir, "metrics.json");
  const viewPath = path.join(baseDir, "metrics.view.json");
  const csvPath = path.join(baseDir, "source.csv");

  const metricsData = await loadJsonFile(metricsPath, MetricsDataSchema);
  if (metricsData && (metricsData.summary || metricsData.pilots)) {
    return metricsData;
  }

  const metricsView = await loadJsonFile(viewPath, MetricsViewSchema);
  if (metricsView) {
    return metricsView;
  }

  const fallback = await loadFromCsv(csvPath);
  if (fallback) {
    return fallback;
  }

  return { pilots: [] };
}

export default async function Page() {
  const data = await loadMetrics();
  const metrics = toDashboardMetrics(data);

  return (
    <main className="mx-auto max-w-7xl p-6">
      <EnhancedPilotDashboard metrics={metrics} />
    </main>
  );
}
