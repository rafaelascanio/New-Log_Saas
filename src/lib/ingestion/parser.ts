import { parse } from 'csv-parse/sync';
import { RawFlightSchema, FlightSchema, type FlightRecord, type RawFlightRecord } from './schema';

type KeyAlias = keyof RawFlightRecord;

const HEADER_ALIASES: Record<string, KeyAlias> = Object.fromEntries(
  Object.entries({
    date: 'date',
    flightdate: 'date',
    'flight date': 'date',
    aircraft: 'aircraftModel',
    'aircraft model': 'aircraftModel',
    'aircraft type': 'aircraftModel',
    aircraftmodel: 'aircraftModel',
    tail: 'tailNumber',
    tailnumber: 'tailNumber',
    registration: 'tailNumber',
    from: 'origin',
    origin: 'origin',
    dep: 'origin',
    departure: 'origin',
    to: 'destination',
    destination: 'destination',
    arr: 'destination',
    arrival: 'destination',
    number: 'flightNumber',
    'flight number': 'flightNumber',
    total: 'totalTime',
    'total time': 'totalTime',
    duration: 'totalTime',
    hours: 'totalTime',
    pic: 'pic',
    'pic time': 'pic',
    command: 'pic',
    sic: 'sic',
    copilot: 'sic',
    dual: 'dual',
    instruction: 'dual',
    night: 'night',
    ifr: 'ifr',
    approaches: 'approaches',
    appr: 'approaches',
    'landings day': 'landingsDay',
    'landings (day)': 'landingsDay',
    'day landings': 'landingsDay',
    landings: 'landingsDay',
    'landings night': 'landingsNight',
    'landings (night)': 'landingsNight',
    'night landings': 'landingsNight',
    remarks: 'remarks',
    notes: 'remarks',
  }).map(([key, alias]) => [normalizeKey(key), alias]),
) as Record<string, KeyAlias>;

export interface ParseOptions {
  strictColumns?: boolean;
}

export interface ParseResult {
  flights: FlightRecord[];
  issues: Array<{
    rowNumber: number;
    errors: string[];
  }>;
  totalRows: number;
}

export function parseCsvFlights(csv: string, options: ParseOptions = {}): ParseResult {
  const rows = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const flights: FlightRecord[] = [];
  const issues: ParseResult['issues'] = [];

  rows.forEach((row, index) => {
    const normalized = normalizeRow(row, options.strictColumns);
    const validation = FlightSchema.safeParse(normalized);

    if (validation.success) {
      flights.push(validation.data);
      return;
    }

    const rawValidation = RawFlightSchema.safeParse(normalized);
    const messages = validation.error.issues.map((issue) => issue.message);

    if (!rawValidation.success) {
      messages.push(...rawValidation.error.issues.map((issue) => issue.message));
    }

    issues.push({
      rowNumber: index + 2,
      errors: dedupe(messages),
    });
  });

  return {
    flights,
    issues,
    totalRows: rows.length,
  };
}

function normalizeRow(row: Record<string, string>, strictColumns = false): RawFlightRecord {
  const normalized: RawFlightRecord = {};

  Object.entries(row).forEach(([rawKey, rawValue]) => {
    const normalizedKey = normalizeKey(rawKey);
    const alias = HEADER_ALIASES[normalizedKey];

    if (!alias) {
      if (strictColumns) {
        normalized[rawKey as keyof RawFlightRecord] = rawValue;
      }
      return;
    }

    normalized[alias] = rawValue;
  });

  return normalized;
}

function normalizeKey(key: string): string {
  return key.replace(/[^a-z0-9]+/gi, '').toLowerCase();
}

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

