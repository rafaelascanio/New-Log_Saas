import { fetchMetricsJson } from '@/lib/metrics/get-metrics';
import PilotsClient from './pilots-client';

export default async function PilotsPage() {
  const metrics = await fetchMetricsJson();

  return <PilotsClient fallbackData={metrics} />;
}