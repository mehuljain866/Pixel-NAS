# Pixel-NAS Dashboard

A local operations dashboard for the Pixel-NAS Android node. It reports battery and filesystem telemetry, records stable files in an optional SQLite ingestion ledger, and exposes a storage-threshold watchdog. It deliberately does **not** claim that Google Photos has uploaded a file unless an operator records an attestation.

## Requirements

- Termux on the Pixel node.
- Node.js 22.13.0 or newer (`node:sqlite` is used; no native npm SQLite module is required). The built-in SQLite API is still marked experimental / release-candidate in current Node documentation, so keep the ledger backed up and validate it on your exact Termux Node release before relying on it as your only index.
- A working Termux `termux-battery-status` command. `dumpsys battery` is used as a best-effort fallback.
- The checked-in `config/IgnoreList.txt` if you want the ingestion scanner to honor the same exclusions used by the documented Resilio setup.

## Install and run

From Termux:

```bash
bash ~/Pixel-NAS/dashboard/install.sh
cd ~/Pixel-NAS/dashboard
nano .env
npm start
```

The installer is non-destructive: it refuses to overwrite a dirty checkout or a non-Git directory. It uses `npm ci`, runs lint/tests, and creates the static export before starting the service. When applying a local patch to an existing checkout, commit the patch on your feature branch before rerunning the installer; otherwise, run the npm checks/build manually from `dashboard/` while the working tree is intentionally modified.

## Configure the ingestion ledger

The scanner is disabled until `PIXEL_NAS_INBOX_DIR` is set. Find the actual receive-only folder path on the Pixel and set it in `.env`; do not copy a guessed path from an example. Do not point it at all of `/sdcard` unless you deliberately intend to index the entire shared-storage tree. Restart the server after editing `.env`.

The scanner runs every five minutes by default and hashes at most 512 MiB of files per scan (one oversized file may exceed the budget so it cannot remain permanently unverified). Both settings are configurable. This bounds repeated checksum I/O on the low-power Pixel node; an initial backlog may take multiple scans to process. The scanner:

1. Walks regular files below the configured inbox (without following symlinks).
2. Applies the configured Resilio-style ignore patterns.
3. Waits until size and modification time remain stable for `PIXEL_NAS_STABLE_WINDOW_MS`.
4. Calculates SHA-256 and checks that the file did not change during hashing.
5. Records a local verification event in SQLite.

The SQLite database is stored outside the Git checkout in `~/.pixel-nas/ledger.sqlite` by default (or under `PIXEL_NAS_DATA_DIR` if configured). It includes a WAL journal and event history. Back it up only after stopping the dashboard cleanly, so SQLite can checkpoint its journal.

A local checksum proves that the local file was stable when checked. It does **not** prove that Google Photos has uploaded it.

## Cloud attestation and cleanup candidates

Google Photos does not expose a dependable supported per-file upload-completion signal to this service. Process presence and old logcat messages are intentionally not used as upload proof.

An operator may attest that a file was independently checked in Google Photos:

```bash
curl -X POST http://127.0.0.1:3000/api/items/ITEM_ID/attest-cloud-backup \
  -H 'Content-Type: application/json' \
  -d '{"evidence":"Manually located this item in the intended Google Photos account on 2026-11-23."}'
```

Replace `ITEM_ID` and the evidence with the actual item ID and your own verification record. If authentication is enabled, include `-H 'Authorization: Bearer YOUR_TOKEN'`.

This operation is explicitly an **operator attestation**, not an automated Google confirmation. It rechecks the local file and its SHA-256 before marking it as a cleanup-review candidate. `GET /api/cleanup-candidates` lists those candidates. Pixel-NAS contains no endpoint or background job that deletes media files. Keep your existing cleanup process manual until you have independently validated the end-to-end backup behaviour.

## Storage guard

Defaults:

- Warning at 48 GiB used.
- Stop webhook request at 55 GiB used.
- Manual resume acknowledgement only when storage is below 50 GiB.
- A stop request is also attempted when storage telemetry is unavailable (`PIXEL_NAS_PAUSE_ON_STORAGE_UNKNOWN=true` by default).

The default stop webhook URL preserves the endpoint previously hard-coded in the dashboard server: `http://127.0.0.1:5000/webhook/stop-resilio`, using GET by default. Set `PIXEL_NAS_STOP_WEBHOOK_METHOD=POST` only if your receiver explicitly expects POST. Confirm that MacroDroid actually listens there and returns a successful HTTP status. A successful HTTP response means only that the webhook acknowledged the request; it does **not** prove Resilio stopped. The dashboard keeps the pause latched and requires a manual restart and explicit acknowledgement. It never starts Resilio itself.

If the webhook is not configured or fails, the dashboard reports `pause_not_configured` or `pause_failed`; it does not pretend the stop succeeded. If telemetry is unavailable, the default policy conservatively requests a stop and keeps manual resume blocked until storage can be measured again. Set `PIXEL_NAS_PAUSE_ON_STORAGE_UNKNOWN=false` only if you explicitly prefer alert-only behaviour. Do not rely on this guard until you have tested the MacroDroid action on the actual Pixel node.

## Network security

The server binds to `127.0.0.1` by default. Keep it there unless you need remote access. To bind to a LAN interface, set `PIXEL_NAS_HOST=0.0.0.0` and provide a random `PIXEL_NAS_AUTH_TOKEN` of at least 24 characters. The API then requires `Authorization: Bearer ...`. Use HTTPS or an SSH tunnel on untrusted networks; a bearer token sent over plain HTTP can be intercepted. Set `PIXEL_NAS_ALLOWED_ORIGINS` only for exact origins that need cross-origin browser access.

The dashboard does not need Android `READ_LOGS` permission.

See [`docs/ARCHITECTURE.md`](../docs/ARCHITECTURE.md), [`docs/SECURITY.md`](../docs/SECURITY.md), and [`docs/RECOVERY.md`](../docs/RECOVERY.md) for design boundaries and operational procedures.

## API

- `GET /api/health` — lightweight health response.
- `GET /api/status` — current telemetry, guard and ingestion summary.
- `GET /api/items?limit=25&offset=0&state=locally_verified` — ingestion ledger items.
- `POST /api/items/:id/attest-cloud-backup` — record a manual operator attestation; requires an evidence string.
- `GET /api/cleanup-candidates` — list review candidates; never deletes files.
- `POST /api/storage-guard/acknowledge-resume` — clear a latched stop request after storage falls below the resume threshold and the operator confirms Resilio was manually restarted.

## Development checks

```bash
npm ci
npm run lint
npm test
npm run build
```

`next.config.ts` uses a static export. `npm run build` produces `dashboard/out`, which the Express service serves. Express 5's named wildcard route is used for the SPA fallback.
