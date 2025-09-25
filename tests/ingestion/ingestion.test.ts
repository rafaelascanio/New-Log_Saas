import { describe, expect, it, vi } from 'vitest';
import { buildMetrics, parseCsvFlights, runIngestion } from '@/src/lib/ingestion';

type PutFunction = (typeof import('@vercel/blob'))['put'];

const SAMPLE_CSV = `Date,Aircraft,Registration,From,To,Total Time,PIC,SIC,Night,IFR,Approaches,Landings (Day),Landings (Night),Remarks
2024-03-01,C172,N12345,KPDX,KSFO,2.5,2.5,0,0.5,1,2,1,0,Training flight
2024-02-15,SR22,N54321,KSFO,KRNO,1.2,1.2,0,0,0.2,0,1,0,Proficiency
2024-02-10,C172,,KBUR,KVNY,-1,0,0,0,0,0,0,0,Data error`;

describe('parseCsvFlights', () => {
  it('parses valid rows and reports issues for invalid ones', () => {
    const result = parseCsvFlights(SAMPLE_CSV);

    expect(result.flights).toHaveLength(2);
    expect(result.issues).toHaveLength(1);
    expect(result.totalRows).toBe(3);

    expect(result.flights[0]).toMatchObject({
      aircraftModel: 'C172',
      origin: 'KPDX',
      destination: 'KSFO',
      totalTime: 2.5,
      pic: 2.5,
    });

    expect(result.issues[0]).toEqual(
      expect.objectContaining({
        rowNumber: 4,
        errors: expect.arrayContaining(['Expected a non-negative number']),
      }),
    );
  });
});

describe('buildMetrics', () => {
  it('summarises totals, breakdowns and recency metadata', () => {
    const now = new Date('2024-03-10T12:00:00Z');
    const { flights, issues, totalRows } = parseCsvFlights(SAMPLE_CSV);
    const metrics = buildMetrics(flights, {
      sourceUrl: 'https://example.com/data.csv',
      totalRows,
      issues,
      now,
    });

    expect(metrics.updatedAt).toBe(now.toISOString());
    expect(metrics.totals.flights).toBe(2);
    expect(metrics.totals.totalHours).toBeCloseTo(3.7, 5);
    expect(metrics.totals.picHours).toBeCloseTo(3.7, 5);
    expect(metrics.rollingTotals.last30Days).toBeCloseTo(3.7, 5);
    expect(metrics.rollingTotals.last7Days).toBeCloseTo(2.5, 5);
    expect(metrics.byAircraft.C172.hours).toBeCloseTo(2.5, 5);
    expect(metrics.byAircraft.SR22.hours).toBeCloseTo(1.2, 5);
    expect(metrics.byMonth).toContainEqual({ month: '2024-02', flights: 1, hours: 1.2 });
    expect(metrics.byMonth).toContainEqual({ month: '2024-03', flights: 1, hours: 2.5 });
    expect(metrics.source.rows.invalid).toBe(1);
    expect(metrics.issues[0].rowNumber).toBe(4);
    expect(metrics.recency.stale).toBe(true);
  });
});

describe('runIngestion', () => {
  it('fetches, validates and persists metrics to the blob store', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      text: async () => SAMPLE_CSV,
    });
    const putMock = vi.fn().mockResolvedValue({ url: 'https://blob/metrics.json' });

    const now = new Date('2024-03-10T12:00:00Z');
    const result = await runIngestion({
      dataSourceUrl: 'https://example.com/data.csv',
      fetchImpl: fetchMock,
      putImpl: putMock as unknown as PutFunction,
      now,
    });

    expect(fetchMock).toHaveBeenCalledWith('https://example.com/data.csv');
    expect(putMock).toHaveBeenCalledWith(
      'metrics.json',
      expect.any(String),
      expect.objectContaining({ contentType: 'application/json' }),
    );

    const payload = JSON.parse(putMock.mock.calls[0][1]);
    expect(payload.source.rows.valid).toBe(2);
    expect(payload.source.rows.invalid).toBe(1);
    expect(result.metrics.updatedAt).toBe(now.toISOString());
    expect(result.blob).toEqual({ url: 'https://blob/metrics.json' });
    expect(putMock.mock.calls[0][2]).toMatchObject({ access: 'public' });
  });
});
