import { safeMaxDate, toIsoDate, hhmmToDecimal } from "@/lib/time";
import {
  DashboardMetrics,
  DashboardSummary,
  FlightRow,
  MetricsData,
  MetricsView,
  PilotMetricsFull,
} from "@/types/metrics";

const EXPECTED_PILOT_KEYS = ["id", "name", "flights"] as const;
const EXPECTED_FLIGHT_KEYS = ["date", "hours"] as const;

const CATEGORY_FIELDS: Record<string, string> = {
  "Aircraft LSA": "LSA",
  "Aircraft Single Engine": "Single",
  "Aircraft Multi Engine": "Multi",
  "Aircraft Turboprop": "Turboprop",
  "Aircraft Turbojet": "Turbojet",
  "Aircraft Helicopter": "Helicopter",
  "Aircraft Glider": "Glider",
  "Aircraft Ultralight Motorized": "Ultralight M",
  "Aircraft Ultralight Non-Motorized": "Ultralight NM",
};

const isDevelopment = process.env.NODE_ENV !== "production";

type FlightMetrics = {
  hours: number;
  dayHours?: number;
  nightHours?: number;
  picHours?: number;
  sicHours?: number;
  ifrHours?: number;
  categories: string[];
};

type NormalizedFlight = {
  flight: FlightRow;
  metrics: FlightMetrics;
};

function parseDecimal(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return hhmmToDecimal(trimmed);
  }

  return undefined;
}

function parseInteger(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  }
  return undefined;
}

function stringOrUndefined(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString();
  }
  return undefined;
}

function parseBooleanFlag(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return ["true", "1", "yes", "y"].includes(normalized);
  }
  return false;
}

function deriveRoute(
  base: unknown,
  from: unknown,
  to: unknown
): string | undefined {
  const baseRoute = stringOrUndefined(base);
  if (baseRoute) {
    return baseRoute;
  }
  const origin = stringOrUndefined(from);
  const destination = stringOrUndefined(to);
  if (!origin && !destination) {
    return undefined;
  }
  if (origin && destination) {
    return `${origin} -> ${destination}`;
  }
  return origin ?? destination ?? undefined;
}

function collectCategories(source: Record<string, unknown>): string[] {
  const categories = new Set<string>();
  for (const [field, label] of Object.entries(CATEGORY_FIELDS)) {
    if (field in source && parseBooleanFlag(source[field])) {
      categories.add(label);
    }
  }
  return Array.from(categories);
}

function normalizeFlight(raw: Record<string, unknown>): NormalizedFlight {
  const dateRaw = raw.date ?? raw["Flight Date"] ?? raw.flightDate;
  const date = stringOrUndefined(dateRaw);
  const isoDate = date ? toIsoDate(date) : "";

  const aircraft =
    stringOrUndefined(raw.aircraft) ??
    stringOrUndefined(raw["Aircraft Make/Model"]) ??
    stringOrUndefined(raw["Aircraft Type"]) ??
    stringOrUndefined(raw["Aircraft Model"]);

  const aircraftReg =
    stringOrUndefined(raw.aircraftReg) ??
    stringOrUndefined(raw["Aircraft Registration"]) ??
    stringOrUndefined(raw.registration);

  const route = deriveRoute(
    raw.route,
    raw.routeFrom ?? raw["Route From (ICAO)"],
    raw.routeTo ?? raw["Route To (ICAO)"]
  );

  const hoursRaw = raw.hours ?? raw["Total Flight Time (HH:MM)"];
  const hours = parseDecimal(hoursRaw) ?? 0;

  const dayHours =
    parseDecimal(raw.dayHours ?? raw.dayTime ?? raw["Day Time (HH:MM)"]);
  const nightHours =
    parseDecimal(raw.nightHours ?? raw.nightTime ?? raw["Night Time (HH:MM)"]);
  const picHours =
    parseDecimal(raw.picHours ?? raw.picTime ?? raw["PIC Time (HH:MM)"]);
  const sicHours =
    parseDecimal(raw.sicHours ?? raw.sicTime ?? raw["SIC Time (HH:MM)"]);
  const ifrHours =
    parseDecimal(raw.ifrHours ?? raw["IFR Time (HH:MM)"] ?? raw.ifrTime);

  const approachType =
    stringOrUndefined(raw.approachType ?? raw["Approach Type"]);
  const approachCount = parseInteger(
    raw.approachCount ?? raw["Approach Count"]
  );

  const simulatorType = stringOrUndefined(
    raw.simulatorType ?? raw["Simulator Type"] ?? raw["Simulator Device/Type"]
  );
  const simulatorTime = parseDecimal(
    raw.simulatorTime ?? raw["Simulator Time (HH:MM)"]
  );

  const crossCountryTime = parseDecimal(
    raw.crossCountryTime ?? raw["Cross Country Time (HH:MM)"]
  );
  const soloTime = parseDecimal(raw.soloTime ?? raw["Solo Time (HH:MM)"]);
  const picTime = picHours;
  const sicTime = sicHours;
  const dualReceived = parseDecimal(
    raw.dualReceived ?? raw["Dual Received (HH:MM)"]
  );
  const instructorTime = parseDecimal(
    raw.instructorTime ?? raw["Instructor Time (HH:MM)"]
  );

  const role = stringOrUndefined(raw.role ?? raw.Role);
  const rulesRaw = stringOrUndefined(raw.rules ?? raw.Rules);
  let rules = rulesRaw;
  if (!rules) {
    if (ifrHours && ifrHours > 0) {
      rules = "IFR";
    } else if (hours > 0) {
      rules = "VFR";
    }
  }

  const night =
    typeof raw.night === "boolean"
      ? raw.night
      : nightHours !== undefined && nightHours > 0;

  const remarks = stringOrUndefined(raw.remarks ?? raw.Remarks);

  const flight: FlightRow = {
    date: isoDate,
    aircraft,
    aircraftReg,
    route,
    hours,
    role: role ?? undefined,
    rules: rules ?? undefined,
    night,
  };

  if (approachType) {
    flight.approachType = approachType;
  }
  if (approachCount !== undefined) {
    flight.approachCount = approachCount;
  }
  if (simulatorType) {
    flight.simulatorType = simulatorType;
  }
  if (simulatorTime !== undefined && simulatorTime > 0) {
    flight.simulatorTime = simulatorTime;
  }
  if (crossCountryTime !== undefined && crossCountryTime > 0) {
    flight.crossCountryTime = crossCountryTime;
  }
  if (soloTime !== undefined && soloTime > 0) {
    flight.soloTime = soloTime;
  }
  if (picTime !== undefined && picTime > 0) {
    flight.picTime = picTime;
  }
  if (sicTime !== undefined && sicTime > 0) {
    flight.sicTime = sicTime;
  }
  if (dualReceived !== undefined && dualReceived > 0) {
    flight.dualReceived = dualReceived;
  }
  if (instructorTime !== undefined && instructorTime > 0) {
    flight.instructorTime = instructorTime;
  }
  if (remarks) {
    flight.remarks = remarks;
  }

  const categories = collectCategories(raw);
  if (categories.length > 0) {
    (flight as FlightRow & { categories?: string[] }).categories = categories;
  }

  return {
    flight,
    metrics: {
      hours,
      dayHours,
      nightHours,
      picHours,
      sicHours,
      ifrHours,
      categories,
    },
  };
}

function warnMissing(entity: string, id: string, keys: readonly string[]): void {
  if (!isDevelopment) return;
  if (keys.length === 0) return;
  // eslint-disable-next-line no-console
  console.warn(`Missing ${entity} keys for ${id}: ${keys.join(", ")}`);
}

function normalizePilot(pilot: Record<string, unknown>): PilotMetricsFull {
  const missingPilotKeys = EXPECTED_PILOT_KEYS.filter(
    (key) => !(key in pilot)
  );
  if (missingPilotKeys.length > 0) {
    warnMissing("pilot", String(pilot.id ?? pilot.name ?? "unknown"), missingPilotKeys);
  }

  const rawFlights: unknown = pilot.flights;
  const flightsSource = Array.isArray(rawFlights) ? rawFlights : [];

  let computedHours = 0;
  let computedDay = 0;
  let computedNight = 0;
  let computedPic = 0;
  let computedSic = 0;
  let computedIfr = 0;
  let hasDay = false;
  let hasNight = false;
  let hasPic = false;
  let hasSic = false;
  let hasIfr = false;

  const pilotCategorySet = new Set<string>();

  const flights = flightsSource.map((item, index) => {
    const record =
      typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};
    const missingFlightKeys = EXPECTED_FLIGHT_KEYS.filter((key) => !(key in record));
    if (missingFlightKeys.length > 0) {
      warnMissing("flight", `${pilot.id ?? pilot.name ?? "unknown"}#${index}`, missingFlightKeys);
    }

    const { flight, metrics } = normalizeFlight(record);
    computedHours += metrics.hours;

    if (metrics.dayHours !== undefined) {
      computedDay += metrics.dayHours;
      hasDay = true;
    }
    if (metrics.nightHours !== undefined) {
      computedNight += metrics.nightHours;
      hasNight = true;
    }
    if (metrics.picHours !== undefined) {
      computedPic += metrics.picHours;
      hasPic = true;
    }
    if (metrics.sicHours !== undefined) {
      computedSic += metrics.sicHours;
      hasSic = true;
    }
    if (metrics.ifrHours !== undefined) {
      computedIfr += metrics.ifrHours;
      hasIfr = true;
    }

    metrics.categories.forEach((category) => pilotCategorySet.add(category));

    return flight;
  });

  const totalFlights =
    typeof pilot.totalFlights === "number"
      ? pilot.totalFlights
      : flights.length;

  const totalHours =
    typeof pilot.totalHours === "number"
      ? pilot.totalHours
      : Number(computedHours.toFixed(2));

  const dayHours =
    typeof pilot.dayHours === "number"
      ? pilot.dayHours
      : hasDay
      ? Number(computedDay.toFixed(2))
      : undefined;
  const nightHours =
    typeof pilot.nightHours === "number"
      ? pilot.nightHours
      : hasNight
      ? Number(computedNight.toFixed(2))
      : undefined;
  const picHours =
    typeof pilot.picHours === "number"
      ? pilot.picHours
      : hasPic
      ? Number(computedPic.toFixed(2))
      : undefined;
  const sicHours =
    typeof pilot.sicHours === "number"
      ? pilot.sicHours
      : hasSic
      ? Number(computedSic.toFixed(2))
      : undefined;
  const ifrHours =
    typeof pilot.ifrHours === "number"
      ? pilot.ifrHours
      : hasIfr
      ? Number(computedIfr.toFixed(2))
      : undefined;

  const aircraftTypes = Array.isArray(pilot.aircraftTypes)
    ? (pilot.aircraftTypes as string[])
    : Array.from(
        new Set(
          flights
            .map((flight) => flight.aircraft)
            .filter((value): value is string => Boolean(value))
        )
      );

  const lastFlightSource = stringOrUndefined(pilot.lastFlightDate);
  const lastFlightDate = lastFlightSource
    ? toIsoDate(lastFlightSource)
    : safeMaxDate(flights.map((flight) => flight.date));

  const pilotRecord: PilotMetricsFull & { categories?: string[] } = {
    id: String(pilot.id ?? ""),
    name: String(pilot.name ?? ""),
    licenseNumber: stringOrUndefined(pilot.licenseNumber),
    nationality: stringOrUndefined(pilot.nationality),
    dateOfBirth: stringOrUndefined(pilot.dateOfBirth),
    licenseType: stringOrUndefined(pilot.licenseType),
    licenseIssueDate: stringOrUndefined(pilot.licenseIssueDate),
    licenseExpiryDate: stringOrUndefined(pilot.licenseExpiryDate),
    totalFlights,
    totalHours,
    flights,
  };

  if (dayHours !== undefined) {
    pilotRecord.dayHours = dayHours;
  }
  if (nightHours !== undefined) {
    pilotRecord.nightHours = nightHours;
  }
  if (picHours !== undefined) {
    pilotRecord.picHours = picHours;
  }
  if (sicHours !== undefined) {
    pilotRecord.sicHours = sicHours;
  }
  if (ifrHours !== undefined) {
    pilotRecord.ifrHours = ifrHours;
  }

  if (aircraftTypes.length > 0) {
    pilotRecord.aircraftTypes = aircraftTypes;
  }

  if (lastFlightDate) {
    pilotRecord.lastFlightDate = lastFlightDate;
  }

  if (pilotCategorySet.size > 0) {
    pilotRecord.categories = Array.from(pilotCategorySet);
  }

  return pilotRecord;
}

function buildSummary(
  input: MetricsView | MetricsData,
  pilots: PilotMetricsFull[],
  updatedAt?: string
): DashboardSummary {
  if (
    "summary" in input &&
    input.summary &&
    typeof input.summary.totalFlights === "number" &&
    typeof input.summary.totalHours === "number"
  ) {
    return {
      totalFlights: input.summary.totalFlights,
      totalHours: input.summary.totalHours,
      updatedAt,
    };
  }

  const totals = pilots.reduce(
    (acc, pilot) => {
      acc.flights += pilot.totalFlights;
      acc.hours += pilot.totalHours;
      return acc;
    },
    { flights: 0, hours: 0 }
  );

  return {
    totalFlights: totals.flights,
    totalHours: Number(totals.hours.toFixed(2)),
    updatedAt,
  };
}

export function toDashboardMetrics(
  input: MetricsView | MetricsData
): DashboardMetrics {
  const generatedAt =
    typeof (input as MetricsData).generatedAt === "string"
      ? (input as MetricsData).generatedAt.trim() || undefined
      : undefined;

  const pilotsSource = Array.isArray((input as MetricsView).pilots)
    ? ((input as MetricsView).pilots as Record<string, unknown>[])
    : [];

  const pilots = pilotsSource.map((pilot) => normalizePilot(pilot));

  const summary = buildSummary(input, pilots, generatedAt);

  return {
    summary,
    pilots,
  };
}
