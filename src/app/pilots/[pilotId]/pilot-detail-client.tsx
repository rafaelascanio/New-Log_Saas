
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Flight, Pilot } from '@/lib/ingestion/schema';
import {
  Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';

export default function PilotDetailClient({
  pilot,
  flights,
}: {
  pilot: Pilot;
  flights: Flight[];
}) {
  const monthlyTotals = flights.reduce<Record<string, { hours: number; flights: number }>>((acc, flight) => {
    if (!flight.date) return acc;
    const month = new Date(flight.date).toLocaleString('default', { month: 'short', year: 'numeric' });
    if (!acc[month]) {
      acc[month] = { hours: 0, flights: 0 };
    }
    acc[month].hours += flight.hours;
    acc[month].flights += 1;
    return acc;
  }, {});

  const chartData = Object.entries(monthlyTotals).map(([month, { hours }]) => ({ month, hours }));

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{pilot.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Total Hours: {pilot.totalHours.toFixed(1)}</p>
          <p>Flights: {pilot.totalFlights}</p>
          <p>Last Flight: {pilot.lastFlightDate ? new Date(pilot.lastFlightDate).toLocaleDateString() : 'N/A'}</p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Hours Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="hours" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Recent Flights</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Aircraft</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Hours</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flights.slice(0, 10).map((flight, index) => (
                <TableRow key={index}>
                  <TableCell>{flight.date ? new Date(flight.date).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell>{flight.aircraft}</TableCell>
                  <TableCell>{flight.route}</TableCell>
                  <TableCell>{flight.hours.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
