# CODEX CHANGELOG

## Summary
- Updated pilot detail dashboard cards to support richer data display and safe fallbacks for missing metrics.
- Added single-pilot layout routing on `/?pilotId=<id>` while preserving the existing multi-pilot grid experience.
- Linked pilot cards in the grid to the new detail route and enabled dynamic chart rendering with textual fallback.

## Assumptions
- Placeholder personal details (license number, nationality, DOB, ATPL progress) remain unavailable from metrics and are shown as em dashes.
- Flight category metadata (PIC/SIC/IFR/VFR, lighting) is not yet delivered by `metrics.json`; zeros and textual summaries are rendered when absent.

## Testing
- `npm run build`
- `npm run dev` then visit `/`, use filters, and follow a pilot card to `/?pilotId=<id>` to confirm layout swap.

## Rollback
- Revert commits `3b79ff8`, `01c515b`, and `88accac` or delete the `feature/pilot-detail-ui` branch.
