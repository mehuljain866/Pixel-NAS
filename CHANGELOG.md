# Changelog

## Reliability hardening (proposed)

- Replaced heuristic upload-state detection with explicit `unknown` / `unverified` states.
- Added filesystem telemetry, a persisted storage-pause latch and visible webhook failure handling.
- Added optional SQLite file-ingestion ledger with stability checks and SHA-256 verification.
- Added operator cloud attestation and review-only cleanup candidates; no automatic media deletion.
- Hardened dashboard network defaults and API authentication.
- Made installation non-destructive and lockfile-driven.
- Added tests, CI, architecture, security and recovery documentation.
