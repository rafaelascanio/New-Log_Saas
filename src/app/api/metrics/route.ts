import { NextResponse } from 'next/server';

import { getMetrics } from '@/lib/metrics/get-metrics';

export const revalidate = 0;
const CACHE_SECONDS = 300;

export async function GET() {
  try {
    const metrics = await getMetrics();

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': `s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Unable to load metrics data.' },
      { status: 500 },
    );
  }
}
