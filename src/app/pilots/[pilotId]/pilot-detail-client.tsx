'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Flight, Pilot } from '@/lib/ingestion/schema';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

type AggregatedMonth = { month: string; hours: number; flights: number };

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A';

export default function PilotDetailClient({
  pilot,
  flights,
}: {
  pilot: Pilot;
  flights: Flight[];
}) {
  const sortedFlights = useMemo(() => {
    return [...flights]
      .filter((flight) => Boolean(flight.date))
      .sort((a, b) => new Date(b.date ?? '').getTime() - new Date(a.date ?? '').getTime());
  }, [flights]);

  const recentFlights = useMemo(() => sortedFlights.slice(0, 12), [sortedFlights]);

  const monthlyTotals = useMemo(() => {
    const totals = sortedFlights.reduce<Map<string, AggregatedMonth>>((acc, flight) => {
      const date = flight.date ? new Date(flight.date) : null;
      if (!date) return acc;
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const prettyMonth = date.toLocaleString('default', { month: 'short', year: 'numeric' });
      const existing = acc.get(monthKey) ?? { month: prettyMonth, hours: 0, flights: 0 };
      existing.hours += flight.hours;
      existing.flights += 1;
      acc.set(monthKey, existing);
      return acc;
    }, new Map());

    return Array.from(totals.entries())
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([, value]) => value);
  }, [sortedFlights]);

  const topAircraft = useMemo(() => {
    const usage = flights.reduce<Record<string, { hours: number; flights: number }>>((acc, flight) => {
      const key = flight.aircraft || 'Unknown';
      if (!acc[key]) {
        acc[key] = { hours: 0, flights: 0 };
      }
      acc[key].hours += flight.hours;
      acc[key].flights += 1;
      return acc;
    }, {});

    return Object.entries(usage)
      .sort((a, b) => b[1].hours - a[1].hours)
      .slice(0, 5);
  }, [flights]);

  const lastFlight = sortedFlights[0];

  return (
    <div className="container mx-auto space-y-6 p-4">
      <section className="grid gap-4 md:grid-cols-[2fr,1fr]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-3xl font-semibold">{pilot.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Active on {pilot.aircraftTypes.length} aircraft type{pilot.aircraftTypes.length === 1 ? '' : 's'}
            </p>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border bg-muted/50 p-4 text-center">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Total Hours</dt>
                <dd className="text-2xl font-semibold">{pilot.totalHours.toFixed(1)}</dd>
              </div>
              <div className="rounded-xl border bg-muted/50 p-4 text-center">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Flights Logged</dt>
                <dd className="text-2xl font-semibold">{pilot.totalFlights}</dd>
              </div>
              <div className="rounded-xl border bg-muted/50 p-4 text-center">
                <dt className="text-xs uppercase tracking-wide text-muted-foreground">Last Flight</dt>
                <dd className="text-2xl font-semibold">{formatDate(pilot.lastFlightDate)}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Primary Aircraft</CardTitle>
          </CardHeader>
          <CardContent>
            {topAircraft.length === 0 ? (
              <p className="text-sm text-muted-foreground">No aircraft usage recorded.</p>
            ) : (
              <ul className="space-y-2 text-sm text-muted-foreground">
                {topAircraft.map(([aircraft, stats]) => (
                  <li key={aircraft} className="flex items-center justify-between rounded-lg border p-2">
                    <span className="font-medium text-foreground">{aircraft}</span>
                    <span>
                      {stats.hours.toFixed(1)} hrs • {stats.flights} flight{stats.flights === 1 ? '' : 's'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Monthly Hours Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-80">
            {monthlyTotals.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No flights recorded for charting yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTotals}>
                  <XAxis dataKey="month" tickMargin={8} />
                  <YAxis width={40} />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(1)} hrs`}
                    labelFormatter={(label) => `Month of ${label}`}
                  />
                  <Line type="monotone" dataKey="hours" stroke="#2563eb" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Most Recent Flight</CardTitle>
          </CardHeader>
          <CardContent>
            {lastFlight ? (
              <dl className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-foreground">Date</dt>
                  <dd>{formatDate(lastFlight.date)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-foreground">Aircraft</dt>
                  <dd>{lastFlight.aircraft}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-foreground">Route</dt>
                  <dd>{lastFlight.route}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-foreground">Hours</dt>
                  <dd>{lastFlight.hours.toFixed(1)}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">No flights recorded yet.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Recent Flights</CardTitle>
        </CardHeader>
        <CardContent>
          <Table data-testid="pilot-flight-table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Date</TableHead>
                <TableHead>Aircraft</TableHead>
                <TableHead>Route</TableHead>
                <TableHead className="text-right">Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentFlights.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    No flights available.
                  </TableCell>
                </TableRow>
              ) : (
                recentFlights.map((flight, index) => (
                  <TableRow key={`${flight.date}-${flight.route}-${index}`}>
                    <TableCell>{formatDate(flight.date)}</TableCell>
                    <TableCell>{flight.aircraft || 'Unknown'}</TableCell>
                    <TableCell>{flight.route}</TableCell>
                    <TableCell className="text-right">{flight.hours.toFixed(1)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
