
import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { MetricsSchema, type Metrics } from '../ingestion/schema';
import { runIngestion } from '../ingestion/run-ingestion';

const DEFAULT_BLOB_KEY = 'metrics.json';
export const METRICS_REVALIDATE_SECONDS = 300;

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
