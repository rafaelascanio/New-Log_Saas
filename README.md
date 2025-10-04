![CI](https://github.com/USER/REPO/actions/workflows/ci.yml/badge.svg)

# Pilot Logbook Dashboard Prototype

This project is a front-end prototype of a public, read-only pilot logbook dashboard.

## Features

- **Data Ingestion**: Data is auto-ingested from a single source (Google Sheet published as CSV or S3/Drive dropbox) by a scheduled job (Vercel Cron).
- **Data Validation**: The ingestion job validates the data using Zod schemas.
- **Data Transformation**: The data is transformed in a Worker/Node task and persisted as a ready-to-serve `metrics.json` in Vercel Blob.
- **UI**: The Next.js App Router UI reads `metrics.json` using ISR revalidation + SWR for snappy updates.
- **Charts**: Charts are rendered using Recharts.
- **Deployment**: The application is deployed on Vercel (edge CDN).
- **Monitoring**: Sentry is used for monitoring.

## Getting Started

1.  **Choose a data source**:
    - Option A: Google Sheet → File → Share → Publish to the web → CSV link
    - Option B: S3/Drive "dropbox" folder with a single latest CSV/XLSX file

2.  **Configure environment variables**:
    - Create a `.env.local` file and add the following variables:
      ```
      DATA_SOURCE_URL=<your_data_source_url>
      BLOB_READ_WRITE_TOKEN=<your_vercel_blob_token>
      SENTRY_DSN=<your_sentry_dsn>
      NEXT_PUBLIC_SENTRY_DSN=<your_sentry_dsn>
      ```

3.  **Install dependencies**:

    ```bash
    npm install
    ```

4.  **Run the development server**:
    ```bash
    npm run dev
    ```

## Freshness Badge and Stale Banner

- The UI displays a "Last updated" badge with the timestamp from `metrics.json.updatedAt`.
- If the data is older than 24 hours, a yellow "stale data" banner is displayed.

## Performance Budgets

- **Web Vitals (mobile)**: p75 LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1
- **Initial route JS**: ≤ 150KB gzip (delta +10KB per PR requires justification)
- **Initial render**: p95 < 2s for 50k-point summaries; interaction p95 < 100ms
- **Cron wall-time**: ≤ 15s
- **`metrics.json` size**: ≤ 1MB (paginate sections if exceeded)

## Vercel Blob Configuration

- The `metrics.json` file is stored in Vercel Blob.
- The ingestion worker writes to the Blob with atomic writes and last-good fallback.
- The UI reads from the Blob with ISR revalidation.

## How it verifies

The GitHub Actions CI workflow runs `pnpm install`, `pnpm typecheck`, `pnpm test`, and `pnpm build` to ensure dependencies install cleanly, the TypeScript project compiles, helper/adapter tests pass, and the application builds without errors.
