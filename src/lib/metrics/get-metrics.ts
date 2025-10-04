
import 'server-only';

import { promises as fs } from 'node:fs';
import path from 'node:path';

import { MetricsSchema, type Metrics } from '../ingestion/schema';
import { runIngestion } from '../ingestion/run-ingestion';

const DEFAULT_BLOB_KEY = 'metrics.json';
export const METRICS_REVALIDATE_SECONDS = 300;

function stripWeirdBytes(s: string) {
  return s.replace(/^\uFEFF/, '').replace(/^[\u0000-\u001F]+/, '');
}

export async function getMetrics(): Promise<unknown> {
  const root = process.cwd();
  const candidates = ['metrics.json', 'metrics.view.json'];
  for (const name of candidates) {
    try {
      const text = await fs.readFile(path.join(root, name), 'utf8');
      return JSON.parse(stripWeirdBytes(text));
    } catch (err) {
      const error = err as NodeJS.ErrnoException;
      if (error?.code !== 'ENOENT') {
        throw error;
      }
    }
  }
  throw new Error('No metrics.json or metrics.view.json at repo root');
}

export async function fetchMetricsJson(pilotName?: string): Promise<Metrics> {
  const blobUrl = getMetricsBlobUrl(pilotName);

  if (!blobUrl) {
    return fetchMetricsViaIngestion(pilotName);
  }

  const response = await fetch(blobUrl, {
    next: {
      revalidate: METRICS_REVALIDATE_SECONDS,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return fetchMetricsViaIngestion(pilotName);
    }
    throw new Error(`Failed to fetch metrics from blob: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const validation = MetricsSchema.safeParse(data);

  if (!validation.success) {
    throw new Error('Invalid metrics data from blob', {
      cause: validation.error,
    });
  }

  return validation.data;
}

export function getMetricsBlobUrl(pilotName?: string): string | null {
  const base = process.env.BLOB_URL?.replace(/\/$/, '');
  const key = pilotName ? `metrics-${pilotName}.json` : DEFAULT_BLOB_KEY;

  if (!base) {
    return null;
  }

  return `${base}/${key}`;
}

async function fetchMetricsViaIngestion(pilotName?: string): Promise<Metrics> {
  const dataSourceUrl = process.env.DATA_SOURCE_URL;

  if (!dataSourceUrl) {
    throw new Error('DATA_SOURCE_URL is not defined in the environment variables.');
  }

  const { metrics } = await runIngestion({
    dataSourceUrl,
    dryRun: false,
    pilotName,
  });

  return metrics;
}
