import { runIngestion } from '@/src/lib/ingestion';
import { Metrics } from '@/src/lib/ingestion/schema';

async function getMetrics(): Promise<Metrics> {
  const dataSourceUrl = process.env.DATA_SOURCE_URL;
  if (!dataSourceUrl) {
    throw new Error('DATA_SOURCE_URL is not defined in the environment variables.');
  }

  // We are running this on the server, so we can use the Vercel Blob SDK
  // The runIngestion function will use the `put` function from `@vercel/blob`
  // which should be configured with the environment variables.
  const result = await runIngestion({ dataSourceUrl });
  return result.metrics;
}

export default async function Page() {
  const metrics = await getMetrics();

  return (
    <div style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Flight Log Dashboard</h1>
        <p style={{ color: '#666' }}>Last updated: {new Date(metrics.updatedAt).toLocaleString()}</p>
      </header>

      <main>
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Totals</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ border: '1px solid #eee', padding: '1rem', borderRadius: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Flights</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{metrics.totals.flights}</p>
            </div>
            <div style={{ border: '1px solid #eee', padding: '1rem', borderRadius: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Total Hours</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{metrics.totals.totalHours.toFixed(1)}</p>
            </div>
            <div style={{ border: '1px solid #eee', padding: '1rem', borderRadius: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>PIC Hours</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{metrics.totals.picHours.toFixed(1)}</p>
            </div>
            {/* Add more totals as needed */}
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Rolling Totals</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ border: '1px solid #eee', padding: '1rem', borderRadius: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Last 7 Days</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{metrics.rollingTotals.last7Days.toFixed(1)}</p>
            </div>
            <div style={{ border: '1px solid #eee', padding: '1rem', borderRadius: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Last 30 Days</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{metrics.rollingTotals.last30Days.toFixed(1)}</p>
            </div>
            <div style={{ border: '1px solid #eee', padding: '1rem', borderRadius: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Last 90 Days</h3>
              <p style={{ fontSize: '2rem', fontWeight: 'bold' }}>{metrics.rollingTotals.last90Days.toFixed(1)}</p>
            </div>
          </div>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>By Aircraft</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {Object.entries(metrics.byAircraft).map(([aircraft, data]) => (
              <div key={aircraft} style={{ border: '1px solid #eee', padding: '1rem', borderRadius: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{aircraft}</h3>
                <p>Flights: {data.flights}</p>
                <p>Hours: {data.hours.toFixed(1)}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>By Month</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {metrics.byMonth.map((data) => (
              <div key={data.month} style={{ border: '1px solid #eee', padding: '1rem', borderRadius: '0.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{data.month}</h3>
                <p>Flights: {data.flights}</p>
                <p>Hours: {data.hours.toFixed(1)}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
