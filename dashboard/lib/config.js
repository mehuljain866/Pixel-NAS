'use strict';

const os = require('node:os');
const path = require('node:path');

function numberFromEnv(name, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${name} must be a number between ${min} and ${max}.`);
  }
  return value;
}

function booleanFromEnv(name, fallback) {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === '') return fallback;
  const normalized = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalized)) return true;
  if (['0', 'false', 'no', 'off'].includes(normalized)) return false;
  throw new Error(`${name} must be true or false.`);
}

function listFromEnv(name) {
  return (process.env[name] || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function isLoopbackHost(host) {
  return host === '127.0.0.1' || host === '::1' || host === 'localhost';
}

function loadConfig() {
  const home = os.homedir();
  const dataDir = process.env.PIXEL_NAS_DATA_DIR || path.join(home, '.pixel-nas');
  const config = {
    host: process.env.PIXEL_NAS_HOST || '127.0.0.1',
    port: numberFromEnv('PIXEL_NAS_PORT', 3000, { min: 1, max: 65535 }),
    storagePath: process.env.PIXEL_NAS_STORAGE_PATH || '/sdcard',
    inboxDir: process.env.PIXEL_NAS_INBOX_DIR || '',
    ignoreListPath: process.env.PIXEL_NAS_IGNORE_LIST || path.resolve(__dirname, '../../config/IgnoreList.txt'),
    dataDir,
    dbPath: process.env.PIXEL_NAS_DB_PATH || path.join(dataDir, 'ledger.sqlite'),
    stableWindowMs: numberFromEnv('PIXEL_NAS_STABLE_WINDOW_MS', 60000, { min: 0, max: 3600000 }),
    ingestionPollMs: numberFromEnv('PIXEL_NAS_INGESTION_POLL_MS', 300000, { min: 60000, max: 3600000 }),
    maxHashBytesPerScan: numberFromEnv('PIXEL_NAS_MAX_HASH_BYTES_PER_SCAN', 536870912, { min: 1048576, max: 4294967296 }),
    telemetryPollMs: numberFromEnv('PIXEL_NAS_TELEMETRY_POLL_MS', 10000, { min: 5000, max: 120000 }),
    storageWarningGB: numberFromEnv('PIXEL_NAS_STORAGE_WARNING_GB', 48, { min: 1, max: 4096 }),
    storagePauseGB: numberFromEnv('PIXEL_NAS_STORAGE_PAUSE_GB', 55, { min: 1, max: 4096 }),
    storageResumeBelowGB: numberFromEnv('PIXEL_NAS_STORAGE_RESUME_BELOW_GB', 50, { min: 1, max: 4096 }),
    pauseOnStorageUnknown: booleanFromEnv('PIXEL_NAS_PAUSE_ON_STORAGE_UNKNOWN', true),
    stopWebhook: process.env.PIXEL_NAS_STOP_WEBHOOK === undefined
      ? 'http://127.0.0.1:5000/webhook/stop-resilio'
      : process.env.PIXEL_NAS_STOP_WEBHOOK.trim(),
    stopWebhookMethod: (process.env.PIXEL_NAS_STOP_WEBHOOK_METHOD || 'GET').toUpperCase(),
    webhookTimeoutMs: numberFromEnv('PIXEL_NAS_WEBHOOK_TIMEOUT_MS', 4000, { min: 500, max: 30000 }),
    webhookRetryMs: numberFromEnv('PIXEL_NAS_WEBHOOK_RETRY_MS', 30000, { min: 5000, max: 600000 }),
    authToken: process.env.PIXEL_NAS_AUTH_TOKEN || '',
    allowedOrigins: listFromEnv('PIXEL_NAS_ALLOWED_ORIGINS'),
  };

  if (!(config.storageWarningGB < config.storagePauseGB)) {
    throw new Error('PIXEL_NAS_STORAGE_WARNING_GB must be lower than PIXEL_NAS_STORAGE_PAUSE_GB.');
  }
  if (!(config.storageResumeBelowGB < config.storagePauseGB)) {
    throw new Error('PIXEL_NAS_STORAGE_RESUME_BELOW_GB must be lower than PIXEL_NAS_STORAGE_PAUSE_GB.');
  }
  if (!isLoopbackHost(config.host) && !config.authToken) {
    throw new Error('PIXEL_NAS_AUTH_TOKEN is required when PIXEL_NAS_HOST is not loopback.');
  }
  if (!['GET', 'POST'].includes(config.stopWebhookMethod)) {
    throw new Error('PIXEL_NAS_STOP_WEBHOOK_METHOD must be GET or POST.');
  }
  if (config.authToken && config.authToken.length < 24) {
    throw new Error('PIXEL_NAS_AUTH_TOKEN must contain at least 24 characters.');
  }

  return config;
}

module.exports = { booleanFromEnv, isLoopbackHost, loadConfig };
