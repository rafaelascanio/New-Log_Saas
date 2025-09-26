import { fetchMetricsJson } from '@/lib/metrics/get-metrics';
import PilotDetailClient from './pilot-detail-client';
import { notFound } from 'next/navigation';
import type { Pilot } from '@/lib/ingestion/schema';

export default async function PilotDetailPage({ params }: { params: { pilotId: string } }) {
  const metrics = await fetchMetricsJson();
  const pilot = metrics.pilots.find((p: Pilot) => p.id === params.pilotId);

  if (!pilot) {
    notFound();
  }

  const flights = pilot.flights;

  return <PilotDetailClient pilot={pilot} flights={flights} />;
}