# Pixel-NAS recovery runbook

This runbook is a starting point for rebuilding the dashboard and re-establishing the existing backup workflow. It does not replace a tested offline media backup.

## Before a failure

Keep a current offline or separately administered copy of irreplaceable media. Google Photos and the Pixel buffer are not independent enough to be the only recovery targets. Retain a copy of `dashboard/.env` securely outside Git, including the actual inbox path, storage thresholds and webhook configuration. Do not put secrets in this repository.

Back up the SQLite ledger periodically. Stop the dashboard cleanly first so SQLite can checkpoint its WAL files, then copy `~/.pixel-nas/ledger.sqlite` to a separate protected location. The ledger is an index and event history; it does not contain your photos or videos.

## Rebuild on the Pixel

1. Install / update Termux packages and confirm Node.js is 22.13.0 or newer.
2. Restore the Pixel-NAS repository or clone it from GitHub.
3. Run `bash ~/Pixel-NAS/dashboard/install.sh`.
4. Restore the saved `dashboard/.env` securely. Confirm `PIXEL_NAS_INBOX_DIR` points to the actual receive-only directory on this device.
5. Restore the SQLite ledger only after the service is stopped. Keep the database and any associated WAL files together if the source service was not shut down cleanly; do not restore an arbitrary `.sqlite` copy over an active database.
6. Reinstall and configure Resilio Sync and Google Photos using your device-specific recovery notes. Reconfirm receive-only behaviour and verify the relevant shared folders.
7. Confirm the MacroDroid stop webhook URL and method. Trigger a controlled test while monitoring the actual Resilio app; do not infer success from an HTTP response alone.
8. Start the dashboard with `cd ~/Pixel-NAS/dashboard && npm start`.
9. Verify battery and filesystem telemetry. Check that the inbox scan sees test files, waits for stability, and records a checksum.
10. Independently verify a test image in the intended Google Photos account. Only then record a manual cloud attestation for that test item.

## Recovery acceptance checklist

- [ ] Source device can transfer a new test image to the Pixel inbox.
- [ ] The ledger records the file as observed, then locally verified.
- [ ] A changed test file invalidates its prior checksum and attestation.
- [ ] A missing file is reported as missing, not as uploaded.
- [ ] Storage telemetry matches the device's own storage view closely enough for the configured thresholds.
- [ ] Stop webhook action is verified on-device.
- [ ] Dashboard remains explicit that cloud backup is unverified until manually checked.
- [ ] Offline restore of sample media succeeds from the independent backup.

Record the date, device, OS version, app versions and any deviations after each full recovery drill.
