import { put, type PutBlobResult } from '@vercel/blob';
import { buildMetrics, type Row } from './metrics';
import { parse } from 'csv-parse/sync';

export interface RunIngestionOptions {
  dataSourceUrl: string;
  blobKey?: string;
  fetchImpl?: typeof fetch;
  putImpl?: typeof put;
  now?: Date;
  dryRun?: boolean;
  pilotName?: string;
}

export interface RunIngestionResult {
  metrics: any;
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
    pilotName,
  } = options;

  const response = await fetchImpl(dataSourceUrl);

  if (!response.ok) {
    throw new Error(`Failed to fetch data source: ${response.status} ${response.statusText}`);
  }

  const csv = await response.text();
  const rows = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Row[];

  if (rows.length === 0) {
    throw new Error('No valid flight data found in the data source');
  }

  const metrics = buildMetrics(rows);

  let blob: PutBlobResult | undefined;

  if (!dryRun) {
    const writer = putImpl ?? put;
    const key = pilotName ? `metrics-${pilotName}.json` : blobKey;
    blob = await writer(key, JSON.stringify(metrics, null, 2), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true,
    });
  }

  return {
    metrics,
    blob,
  };
}
