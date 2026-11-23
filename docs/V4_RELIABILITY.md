# Pixel-NAS reliability update

This change set hardens the dashboard and introduces a conservative, optional ingestion ledger. It does not replace the existing Resilio Sync or Google Photos workflow.

## What changed

- Battery telemetry now handles a legitimate 0% value correctly and reports unavailable readings explicitly.
- Storage telemetry uses Node's filesystem `statfs` API rather than parsing locale- and Android-version-dependent `df` output.
- The storage watchdog validates readings, reports webhook failures, retries with a cooldown, persists its pause latch, and requires manual restart acknowledgement.
- The previous stop-webhook URL and GET method are preserved by default.
- The dashboard binds to loopback by default; non-loopback binding requires a bearer token.
- The API has cache-control headers, bounded JSON bodies, allowlisted CORS origins and authenticated routes when remote access is enabled.
- Express 5 SPA fallback uses a named wildcard route.
- The optional SQLite ledger waits for stable files, calculates SHA-256, records changes/missing files and keeps event history.
- Manual cloud attestation is distinguished from automated evidence; cleanup candidates are review-only and no deletion function exists.
- Installer is non-destructive, uses `npm ci`, runs checks and builds the dashboard.
- Added tests, CI and architecture / security / recovery documentation.

## Required operator setup

The exact Resilio receive-folder path is intentionally not guessed. Set `PIXEL_NAS_INBOX_DIR` in `dashboard/.env` after checking the real path on the Pixel. Test the MacroDroid receiver before relying on the storage watchdog. Review `docs/RECOVERY.md` and `docs/SECURITY.md` before exposing the dashboard outside localhost.

## Verification

Run from `dashboard/`:

```bash
npm ci
npm run lint
npm test
npm run build
```

The automated tests cover local file verification and invalidation, missing-file handling, storage classification, battery parsing, environment validation and watchdog failure / latch behaviour. Device-side Android permissions, MacroDroid execution, Resilio status and Google Photos uploads still require a real Pixel test.
