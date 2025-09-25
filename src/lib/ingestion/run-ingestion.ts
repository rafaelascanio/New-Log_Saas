import { put, type PutBlobResult } from '@vercel/blob';
import { buildMetrics } from './metrics';
import { parseCsvFlights } from './parser';
import type { Metrics } from './schema';

export interface RunIngestionOptions {
  dataSourceUrl: string;
  blobKey?: string;
  fetchImpl?: typeof fetch;
  putImpl?: typeof put;
  now?: Date;
  dryRun?: boolean;
}

export interface RunIngestionResult {
  metrics: Metrics;
  blob?: PutBlobResult;
}

export async function runIngestion(options: RunIngestionOptions): Promise<RunIngestionResult> {
  const {
    dataSourceUrl,
    blobKey = 'metrics.json',
    fetchImpl = fetch,
    putImpl,
    now = new Date(),
    dryRun = false,
  } = options;

  const response = await fetchImpl(dataSourceUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch data source: ${response.status} ${response.statusText}`);
  }

  const csv = await response.text();
  const parseResult = parseCsvFlights(csv);

  if (parseResult.flights.length === 0) {
    throw new Error('No valid flight data found in the data source');
  }

  const metrics = buildMetrics(parseResult.flights, {
    sourceUrl: dataSourceUrl,
    totalRows: parseResult.totalRows,
    issues: parseResult.issues,
    now,
  });

  let blob: PutBlobResult | undefined;

  if (!dryRun) {
    const writer = putImpl ?? put;
    blob = await writer(blobKey, JSON.stringify(metrics, null, 2), {
      access: 'public',
      contentType: 'application/json',
    });
  }

  return {
    metrics,
    blob,
  };
}

