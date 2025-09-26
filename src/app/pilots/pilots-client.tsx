'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Metrics } from '@/lib/ingestion/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PilotsClient({ fallbackData }: { fallbackData: Metrics }) {
  const { data: metrics, error } = useSWR<Metrics>('/api/metrics', fetcher, {
    fallbackData,
    revalidateOnFocus: true,
  });
  const [search, setSearch] = useState('');

  if (error) return <div>Failed to load</div>;
  if (!metrics) return <div>Loading...</div>;

  const filteredPilots = metrics.pilots.filter((pilot) =>
    pilot.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search by pilot name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPilots.map((pilot) => (
          <Card key={pilot.id}>
            <CardHeader>
              <CardTitle>
                <Link href={`/pilots/${pilot.id}`}>{pilot.name}</Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Total Hours: {pilot.totalHours.toFixed(1)}</p>
              <p>Flights: {pilot.totalFlights}</p>
              <p>Last Flight: {pilot.lastFlightDate ? new Date(pilot.lastFlightDate).toLocaleDateString() : 'N/A'}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}