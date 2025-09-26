# Dashboard Notes

## Data Source
- Dashboard data is loaded from `metrics.json` hosted on Vercel Blob storage using the client-safe base URL defined in `NEXT_PUBLIC_BLOB_URL_BASE`.
- The Next.js page forces dynamic rendering (`revalidate = 0`, `dynamic = "force-dynamic"`) and fetches with `cache: "no-store"` plus a cache-busting timestamp to ensure fresh data.

## Public Blob URL
- Configure the read-only base URL in `.env.local` via `NEXT_PUBLIC_BLOB_URL_BASE`.
- Server-only keys such as `BLOB_READ_WRITE_TOKEN` should be injected through deployment secrets, not checked into the repository.

## Re-running Ingest
- Use `node scripts/ingest-once.mjs` to regenerate `metrics.json`.
- The script uploads with `allowOverwrite: true`, so rerunning safely replaces the existing blob without duplication.

## Adjusting Filters
- Client-side pilot filters live in `src/components/PilotGrid.tsx`.
- Update the search or date logic inside the `useMemo` blocks to change filter behavior while keeping data processing fully client-side.
