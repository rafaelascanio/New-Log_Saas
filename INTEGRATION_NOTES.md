# Integration Notes

## Data sources
- `src/app/page.tsx` loads metrics from local files inside the repository root.
- Priority order:
  1. `metrics.json` (aggregated output).
  2. `metrics.view.json` (per-flight view).
  3. `source.csv` (fallback slice when the JSON exports are missing).
- The CSV fallback parses up to 200 rows to keep the dev experience lightweight.
- The adapter in `src/lib/adapters/toDashboardMetrics.ts` normalises all sources into `DashboardMetrics`.

## Switching sources
- Replace `metrics.json` or `metrics.view.json` with a fresh export and redeploy; the loader prefers the aggregated JSON when present.
- For local experiments you can temporarily remove the JSON files so that the CSV fallback is used.
- The CSV fallback expects the header names bundled with the sample file; keep those intact if you regenerate the CSV.

## UI notes
- The dashboard is rendered by `src/components/EnhancedPilotDashboard.tsx`.
- Framer Motion is available at runtime; during type-only checks a lightweight declaration lives at `src/types/framer-motion.d.ts` to satisfy the compiler when modules are not installed.
