import { buildMetricsJson } from '@/src/lib/ingestion';
import { FlightRecord } from '@/src/lib/ingestion/schema';

describe('buildMetricsJson', () => {
  it('should correctly build pilot summaries', () => {
    const flights: FlightRecord[] = [
      {
        date: new Date('2024-01-15'),
        aircraftModel: 'Cessna 172',
        origin: 'KSQL',
        destination: 'KPAO',
        totalTime: 1.2,
        pic: 1.2,
        sic: 0,
        dual: 0,
        night: 0,
        ifr: 0,
        approaches: 0,
        landingsDay: 1,
        landingsNight: 0,
        pilotName: 'John Doe',
      },
      {
        date: new Date('2024-01-20'),
        aircraftModel: 'Cessna 172',
        origin: 'KPAO',
        destination: 'KSQL',
        totalTime: 1.3,
        pic: 1.3,
        sic: 0,
        dual: 0,
        night: 0,
        ifr: 0,
        approaches: 0,
        landingsDay: 1,
        landingsNight: 0,
        pilotName: 'John Doe',
      },
      {
        date: new Date('2024-02-10'),
        aircraftModel: 'Piper PA-28',
        origin: 'KSQL',
        destination: 'KOAK',
        totalTime: 1.5,
        pic: 1.5,
        sic: 0,
        dual: 0,
        night: 0,
        ifr: 0,
        approaches: 0,
        landingsDay: 1,
        landingsNight: 0,
        pilotName: 'Jane Smith',
      },
    ];

    const metrics = buildMetricsJson(flights, {
      sourceUrl: 'test.csv',
      totalRows: 3,
      issues: [],
    });

    expect(metrics.pilots).toHaveLength(2);

    const johnDoe = metrics.pilots.find((p) => p.name === 'John Doe');
    expect(johnDoe).toBeDefined();
    expect(johnDoe?.totalHours).toBe(2.5);
    expect(johnDoe?.picHours).toBe(2.5);
    expect(johnDoe?.flightCount).toBe(2);
    expect(johnDoe?.lastFlightDate).toBe(new Date('2024-01-20').toISOString());

    const janeSmith = metrics.pilots.find((p) => p.name === 'Jane Smith');
    expect(janeSmith).toBeDefined();
    expect(janeSmith?.totalHours).toBe(1.5);
    expect(janeSmith?.picHours).toBe(1.5);
    expect(janeSmith?.flightCount).toBe(1);
    expect(janeSmith?.lastFlightDate).toBe(new Date('2024-02-10').toISOString());

    // Check for sorting
    expect(metrics.pilots[0].name).toBe('Jane Smith');
    expect(metrics.pilots[1].name).toBe('John Doe');
  });
});