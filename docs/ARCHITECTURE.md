# Pixel-NAS reliability architecture

The dashboard is an observer and safety coordinator around the existing Android / Resilio Sync / Google Photos workflow. It is not the backup engine and must not be treated as an independent cloud-verification authority.

## Data flow

```text
Source devices
    |
    | Resilio Sync (existing configuration)
    v
Pixel receive-only directory (PIXEL_NAS_INBOX_DIR; configured by the operator)
    |
    +--> Ingestion scanner
    |      - respects config/IgnoreList.txt
    |      - skips symlinks and unstable files
    |      - records size, modification time and SHA-256 in SQLite
    - caps checksum work at 512 MiB per scan by default; scans run every five minutes by default
    |      - keeps an append-only event history
    |
    +--> Google Photos (existing application / account)
    |      - dashboard reports cloud status as UNVERIFIED
    |      - no process-name or historical-log heuristic is used as upload proof
    |
    +--> Storage telemetry (Node fs.statfs)
           - warning threshold
           - optional stop webhook request at the hard threshold
           - latched state and manual restart acknowledgement

Dashboard PWA --> authenticated /api/* endpoints --> read-only telemetry and ledger
```

## Ingestion states

- `observed`: file found; the stability window has not elapsed.
- `locally_verified`: file remained stable during SHA-256 calculation; this confirms the local copy only.
- `cleanup_candidate`: an operator manually attested that the matching cloud item was found. It remains a review candidate, not a deletion command.
- `missing`: file disappeared from the inbox. This state is never interpreted as successful cloud upload.

If a file changes, its local checksum and any previous cloud attestation are invalidated. A new stable scan is required.

## Storage guard

A valid filesystem reading is required before threshold comparisons are made. If telemetry becomes unavailable, the default policy conservatively sends the configured stop webhook and keeps resume blocked until storage can be measured again (`PIXEL_NAS_PAUSE_ON_STORAGE_UNKNOWN=false` disables this response). At the pause threshold it sends the configured webhook using GET by default to preserve the previous server's behaviour. A 2xx response is recorded as `pause_requested`, not `paused`, because it only acknowledges the HTTP request. A failed request is visible and retried after a cooldown. After a successful request, the stop request remains latched until storage is below the resume threshold and an operator confirms that Resilio was restarted manually. The dashboard never launches or kills Resilio directly.

## Explicit non-goals

- No automatic deletion of source media or Pixel-buffer media.
- No claim of per-file Google Photos success from logcat, app process presence, or a notification.
- No inferred Resilio transfer state from a running process name.
- No cloud API integration until a supported and tested source of evidence is available.
