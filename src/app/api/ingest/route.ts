
import { runIngestion } from '@/lib/ingestion';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // This is a placeholder URL. Replace with your actual data source URL.
    const dataSourceUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT_3_hB-3J3g-b-2Jg-2Jg-2Jg-2Jg-2Jg-2Jg-2Jg-2Jg-2Jg-2Jg-2Jg-2Jg-2Jg-2Jg-2Jg-2Jg-2Jg/pub?output=csv';
    const result = await runIngestion({ dataSourceUrl });
    return NextResponse.json({ success: true, blob: result.blob });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
