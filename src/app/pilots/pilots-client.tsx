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

  const filteredPilots = metrics.pilots
    .filter((pilot) => pilot.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.totalHours - a.totalHours);

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search by pilot name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
          data-testid="pilot-search"
          aria-label="Search pilots by name"
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPilots.map((pilot) => (
          <Card key={pilot.id} data-testid="pilot-card" className="transition hover:-translate-y-1 hover:shadow-lg">
            <CardHeader>
              <CardTitle>
                <Link href={`/pilots/${pilot.id}`}>{pilot.name}</Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-foreground">Total Hours</dt>
                  <dd>{pilot.totalHours.toFixed(1)}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="font-medium text-foreground">Flights</dt>
                  <dd>{pilot.totalFlights}</dd>
                </div>

              </dl>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}