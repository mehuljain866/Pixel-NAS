'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { isLoopbackHost, loadConfig } = require('../lib/config');

function withEnv(overrides, run) {
  const previous = new Map();
  for (const [key, value] of Object.entries(overrides)) {
    previous.set(key, process.env[key]);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try { run(); } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test('configuration defaults to loopback, safe thresholds and existing GET webhook', () => {
  withEnv({
    PIXEL_NAS_HOST: undefined,
    PIXEL_NAS_PORT: undefined,
    PIXEL_NAS_AUTH_TOKEN: undefined,
    PIXEL_NAS_STORAGE_WARNING_GB: undefined,
    PIXEL_NAS_STORAGE_PAUSE_GB: undefined,
    PIXEL_NAS_STORAGE_RESUME_BELOW_GB: undefined,
    PIXEL_NAS_PAUSE_ON_STORAGE_UNKNOWN: undefined,
    PIXEL_NAS_INGESTION_POLL_MS: undefined,
    PIXEL_NAS_MAX_HASH_BYTES_PER_SCAN: undefined,
    PIXEL_NAS_STOP_WEBHOOK: undefined,
    PIXEL_NAS_STOP_WEBHOOK_METHOD: undefined,
    PIXEL_NAS_INBOX_DIR: undefined,
  }, () => {
    const config = loadConfig();
    assert.equal(config.host, '127.0.0.1');
    assert.equal(config.port, 3000);
    assert.equal(config.storageWarningGB, 48);
    assert.equal(config.storagePauseGB, 55);
    assert.equal(config.storageResumeBelowGB, 50);
    assert.equal(config.pauseOnStorageUnknown, true);
    assert.equal(config.ingestionPollMs, 300000);
    assert.equal(config.maxHashBytesPerScan, 536870912);
    assert.equal(config.stopWebhookMethod, 'GET');
    assert.equal(config.stopWebhook, 'http://127.0.0.1:5000/webhook/stop-resilio');
    assert.equal(config.inboxDir, '');
  });
});

test('non-loopback binding requires a strong API token', () => {
  withEnv({ PIXEL_NAS_HOST: '0.0.0.0', PIXEL_NAS_AUTH_TOKEN: '' }, () => {
    assert.throws(() => loadConfig(), /AUTH_TOKEN is required/i);
  });
  withEnv({ PIXEL_NAS_HOST: '0.0.0.0', PIXEL_NAS_AUTH_TOKEN: 'short' }, () => {
    assert.throws(() => loadConfig(), /at least 24 characters/i);
  });
  withEnv({ PIXEL_NAS_HOST: '127.0.0.1', PIXEL_NAS_AUTH_TOKEN: undefined }, () => {
    assert.equal(isLoopbackHost(loadConfig().host), true);
  });
});

test('threshold relationships and webhook methods are validated', () => {
  withEnv({ PIXEL_NAS_STORAGE_WARNING_GB: '55', PIXEL_NAS_STORAGE_PAUSE_GB: '55' }, () => {
    assert.throws(() => loadConfig(), /warning.*lower than.*pause/i);
  });
  withEnv({ PIXEL_NAS_STOP_WEBHOOK_METHOD: 'DELETE' }, () => {
    assert.throws(() => loadConfig(), /must be GET or POST/i);
  });
  withEnv({ PIXEL_NAS_PAUSE_ON_STORAGE_UNKNOWN: 'maybe' }, () => {
    assert.throws(() => loadConfig(), /must be true or false/i);
  });
});
