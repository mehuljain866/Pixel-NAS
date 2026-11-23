# Pixel-NAS security notes

## Dashboard network exposure

- The server binds to `127.0.0.1` by default.
- Binding to a non-loopback interface requires `PIXEL_NAS_AUTH_TOKEN` with at least 24 characters.
- API requests require `Authorization: Bearer <token>` when a token is configured.
- Cross-origin requests are denied unless their exact origin is listed in `PIXEL_NAS_ALLOWED_ORIGINS`.
- Prefer an SSH tunnel or HTTPS reverse proxy for remote use. A bearer token sent over plain HTTP can be intercepted on an untrusted network.
- The static UI is not a secret. API responses and actions are protected by the bearer token.

## Secrets and data

- Never commit `dashboard/.env`, bearer tokens, webhook secrets, or device-specific credentials.
- `dashboard/.env.example` contains placeholders only.
- The SQLite ledger defaults to `~/.pixel-nas/ledger.sqlite`, outside the checkout.
- The ledger contains relative media paths, file sizes, hashes and operator evidence notes. Protect it as private metadata.
- Do not expose `/api/items` or `/api/cleanup-candidates` to the public internet.

## Android permissions

The dashboard no longer requires `android.permission.READ_LOGS`. It does not scrape Google Photos logs. Grant Android storage permission to Termux only when needed to access the configured inbox and filesystem telemetry.

## Cloud backup claims

Local SHA-256 verification is not cloud backup verification. The `attest-cloud-backup` endpoint records a manual operator attestation and requires an evidence note; it does not query Google Photos. Do not use this mechanism as an excuse to remove your independent offline copy.

## Storage webhook

The stop webhook is a local control surface. Keep its receiver private and verify the MacroDroid action itself. An HTTP success response proves only that the receiver acknowledged a request, not that Resilio has stopped.
