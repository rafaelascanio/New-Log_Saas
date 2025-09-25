import { FlightRecord, Metrics } from './schema';

export interface MetricsOptions {
  sourceUrl: string;
  totalRows: number;
  issues: Metrics['issues'];
  now?: Date;
}

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function buildMetrics(flights: FlightRecord[], options: MetricsOptions): Metrics {
  const { now = new Date(), sourceUrl, totalRows, issues } = options;

  const totals = flights.reduce(
    (acc, flight) => {
      acc.flights += 1;
      acc.totalHours += flight.totalTime;
      acc.picHours += flight.pic;
      acc.sicHours += flight.sic;
      acc.dualHours += flight.dual;
      acc.nightHours += flight.night;
      acc.ifrHours += flight.ifr;
      acc.approaches += flight.approaches;
      acc.dayLandings += flight.landingsDay;
      acc.nightLandings += flight.landingsNight;
      return acc;
    },
    {
      flights: 0,
      totalHours: 0,
      picHours: 0,
      sicHours: 0,
      dualHours: 0,
      nightHours: 0,
      ifrHours: 0,
      approaches: 0,
      dayLandings: 0,
      nightLandings: 0,
    },
  );

  const sortedFlights = [...flights].sort((a, b) => a.date.getTime() - b.date.getTime());
  const latestFlight = sortedFlights.at(-1) ?? null;
  const latestFlightDate = latestFlight ? latestFlight.date.toISOString() : null;
  const daysSinceLastFlight = latestFlight
    ? Math.floor((stripTime(now).getTime() - latestFlight.date.getTime()) / ONE_DAY_MS)
    : null;
  const stale = daysSinceLastFlight !== null ? daysSinceLastFlight >= 1 : true;

  const rollingTotals = calculateRollingTotals(sortedFlights, now);
  const byAircraft = calculateAircraftBreakdown(flights);
  const byMonth = calculateMonthlyTotals(flights);

  return {
    updatedAt: now.toISOString(),
    source: {
      url: sourceUrl,
      rows: {
        total: totalRows,
        valid: flights.length,
        invalid: issues.length,
      },
    },
    recency: {
      latestFlightDate,
      daysSinceLastFlight,
      stale,
    },
    totals,
    rollingTotals,
    byAircraft,
    byMonth,
    issues,
  };
}

function calculateRollingTotals(flights: FlightRecord[], now: Date) {
  const nowTime = stripTime(now).getTime();
  const thresholds = [7, 30, 90].map((days) => nowTime - days * ONE_DAY_MS);

  const totals = {
    last7Days: 0,
    last30Days: 0,
    last90Days: 0,
  };

  flights.forEach((flight) => {
    const flightTime = flight.date.getTime();

    if (flightTime >= thresholds[0]) {
      totals.last7Days += flight.totalTime;
    }

    if (flightTime >= thresholds[1]) {
      totals.last30Days += flight.totalTime;
    }

    if (flightTime >= thresholds[2]) {
      totals.last90Days += flight.totalTime;
    }
  });

  return totals;
}

function calculateAircraftBreakdown(flights: FlightRecord[]) {
  return flights.reduce<Record<string, { flights: number; hours: number; picHours: number; nightHours: number }>>(
    (acc, flight) => {
      const key = flight.aircraftModel;
      if (!acc[key]) {
        acc[key] = {
          flights: 0,
          hours: 0,
          picHours: 0,
          nightHours: 0,
        };
      }

      acc[key].flights += 1;
      acc[key].hours += flight.totalTime;
      acc[key].picHours += flight.pic;
      acc[key].nightHours += flight.night;
      return acc;
    },
    {},
  );
}

function calculateMonthlyTotals(flights: FlightRecord[]) {
  const map = new Map<string, { flights: number; hours: number }>();

  flights.forEach((flight) => {
    const monthKey = `${flight.date.getUTCFullYear()}-${String(flight.date.getUTCMonth() + 1).padStart(2, '0')}`;
    const bucket = map.get(monthKey) ?? { flights: 0, hours: 0 };
    bucket.flights += 1;
    bucket.hours += flight.totalTime;
    map.set(monthKey, bucket);
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([month, totals]) => ({ month, ...totals }));
}

function stripTime(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

