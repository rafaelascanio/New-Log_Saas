import { NextResponse } from 'next/server';

import { fetchMetricsJson, METRICS_REVALIDATE_SECONDS } from '@/src/lib/metrics/get-metrics';

export const revalidate = 0;

export async function GET() {
  try {
    const metrics = await fetchMetricsJson();

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': `s-maxage=${Math.floor(METRICS_REVALIDATE_SECONDS / 2)}, stale-while-revalidate=${METRICS_REVALIDATE_SECONDS}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unable to load metrics data.' },
      { status: 500 },
    );
  }
}
