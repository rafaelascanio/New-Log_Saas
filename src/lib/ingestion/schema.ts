import { z } from 'zod';

const NumberFromCsv = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) {
      return 0;
    }

    if (trimmed.includes(':')) {
      const [hours, minutes] = trimmed.split(':').map(Number);
      if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
        return hours + minutes / 60;
      }
    }

    const normalized = trimmed.replace(/,/g, '');
    const parsed = Number(normalized);

    if (Number.isNaN(parsed)) {
      return value;
    }

    return parsed;
  }

  return value;
}, z.number({ invalid_type_error: 'Expected numeric value' }));

const NonNegativeNumberFromCsv = NumberFromCsv.refine((value) => value >= 0, {
  message: 'Expected a non-negative number',
});

const DateFromCsv = z.preprocess((value) => {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (!trimmed) {
      return value;
    }

    const normalized = trimmed.replace(/\s+/g, ' ');

    const parsed = normalizeDate(normalized);

    return parsed ?? value;
  }

  return value;
}, z
  .date({ invalid_type_error: 'Expected a valid date string' })
  .transform((date) => normalizeToUtc(date)));

type RawFlightRecord = {
  date?: string;
  aircraftModel?: string;
  tailNumber?: string;
  origin?: string;
  destination?: string;
  flightNumber?: string;
  remarks?: string;
  totalTime?: string | number;
  pic?: string | number;
  sic?: string | number;
  dual?: string | number;
  night?: string | number;
  ifr?: string | number;
  approaches?: string | number;
  landingsDay?: string | number;
  landingsNight?: string | number;
};

export const RawFlightSchema: z.ZodType<RawFlightRecord> = z.object({
  date: z.string().optional(),
  aircraftModel: z.string().optional(),
  tailNumber: z.string().optional(),
  origin: z.string().optional(),
  destination: z.string().optional(),
  flightNumber: z.string().optional(),
  remarks: z.string().optional(),
  totalTime: z.union([z.string(), z.number()]).optional(),
  pic: z.union([z.string(), z.number()]).optional(),
  sic: z.union([z.string(), z.number()]).optional(),
  dual: z.union([z.string(), z.number()]).optional(),
  night: z.union([z.string(), z.number()]).optional(),
  ifr: z.union([z.string(), z.number()]).optional(),
  approaches: z.union([z.string(), z.number()]).optional(),
  landingsDay: z.union([z.string(), z.number()]).optional(),
  landingsNight: z.union([z.string(), z.number()]).optional(),
});

export const FlightSchema = z
  .object({
    date: DateFromCsv,
    aircraftModel: z.string().min(1, 'Aircraft model is required'),
    tailNumber: z.string().optional(),
    origin: z.string().min(1, 'Origin is required'),
    destination: z.string().min(1, 'Destination is required'),
    flightNumber: z.string().optional(),
    remarks: z.string().optional(),
    totalTime: NonNegativeNumberFromCsv,
    pic: NonNegativeNumberFromCsv.default(0),
    sic: NonNegativeNumberFromCsv.default(0),
    dual: NonNegativeNumberFromCsv.default(0),
    night: NonNegativeNumberFromCsv.default(0),
    ifr: NonNegativeNumberFromCsv.default(0),
    approaches: NonNegativeNumberFromCsv.default(0),
    landingsDay: NonNegativeNumberFromCsv.default(0),
    landingsNight: NonNegativeNumberFromCsv.default(0),
  })
  .refine((data) => data.totalTime >= data.pic + data.sic, {
    message: 'Total time cannot be less than PIC + SIC time',
    path: ['totalTime'],
  });

export type FlightRecord = z.infer<typeof FlightSchema>;

export interface Metrics {
  updatedAt: string;
  source: {
    url: string;
    rows: {
      total: number;
      valid: number;
      invalid: number;
    };
  };
  recency: {
    latestFlightDate: string | null;
    daysSinceLastFlight: number | null;
    stale: boolean;
  };
  totals: {
    flights: number;
    totalHours: number;
    picHours: number;
    sicHours: number;
    dualHours: number;
    nightHours: number;
    ifrHours: number;
    approaches: number;
    dayLandings: number;
    nightLandings: number;
  };
  rollingTotals: {
    last7Days: number;
    last30Days: number;
    last90Days: number;
  };
  byAircraft: Record<
    string,
    {
      flights: number;
      hours: number;
      picHours: number;
      nightHours: number;
    }
  >;
  byMonth: Array<{
    month: string;
    flights: number;
    hours: number;
  }>;
  issues: Array<{
    rowNumber: number;
    errors: string[];
  }>;
}


export const MetricsSchema: z.ZodType<Metrics> = z.object({
  updatedAt: z.string(),
  source: z.object({
    url: z.string().url(),
    rows: z.object({
      total: z.number().int().nonnegative(),
      valid: z.number().int().nonnegative(),
      invalid: z.number().int().nonnegative(),
    }),
  }),
  recency: z.object({
    latestFlightDate: z.string().nullable(),
    daysSinceLastFlight: z.number().nullable(),
    stale: z.boolean(),
  }),
  totals: z.object({
    flights: z.number().int().nonnegative(),
    totalHours: z.number().nonnegative(),
    picHours: z.number().nonnegative(),
    sicHours: z.number().nonnegative(),
    dualHours: z.number().nonnegative(),
    nightHours: z.number().nonnegative(),
    ifrHours: z.number().nonnegative(),
    approaches: z.number().nonnegative(),
    dayLandings: z.number().nonnegative(),
    nightLandings: z.number().nonnegative(),
  }),
  rollingTotals: z.object({
    last7Days: z.number().nonnegative(),
    last30Days: z.number().nonnegative(),
    last90Days: z.number().nonnegative(),
  }),
  byAircraft: z.record(
    z.object({
      flights: z.number().int().nonnegative(),
      hours: z.number().nonnegative(),
      picHours: z.number().nonnegative(),
      nightHours: z.number().nonnegative(),
    }),
  ),
  byMonth: z
    .array(
      z.object({
        month: z.string(),
        flights: z.number().int().nonnegative(),
        hours: z.number().nonnegative(),
      }),
    ),
  issues: z.array(
    z.object({
      rowNumber: z.number().int().positive(),
      errors: z.array(z.string()).nonempty(),
    }),
  ),
});

function normalizeDate(value: string): Date | null {
  const isoLike = Date.parse(value);
  if (!Number.isNaN(isoLike)) {
    return new Date(isoLike);
  }

  const [month, day, year] = value.split(/[\/-]/).map((part) => part.trim());

  if (month && day && year) {
    const normalizedYear = normalizeYear(year);
    const candidate = new Date(`${normalizedYear}-${pad(month)}-${pad(day)}T00:00:00Z`);
    if (!Number.isNaN(candidate.getTime())) {
      return candidate;
    }
  }

  return null;
}

function normalizeYear(year: string): string {
  if (year.length === 2) {
    const numeric = Number(year);
    if (numeric <= 68) {
      return `20${year.padStart(2, '0')}`;
    }
    return `19${year.padStart(2, '0')}`;
  }

  return year;
}

function pad(value: string): string {
  return value.padStart(2, '0');
}

function normalizeToUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export type { RawFlightRecord };
