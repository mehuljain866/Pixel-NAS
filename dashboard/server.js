'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const cors = require('cors');
const { loadEnvFile } = require('./lib/env');
const { loadConfig, isLoopbackHost } = require('./lib/config');
const { openDatabase } = require('./lib/database');
const { IngestionLedger, parseIgnoreList } = require('./lib/ledger');
const { readStorage } = require('./lib/storage');
const { readBatteryTelemetry } = require('./lib/telemetry');
const { StorageGuard } = require('./lib/storage-guard');

function safeTokenEqual(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string') return false;
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function createAuthMiddleware(token) {
  return (req, res, next) => {
    if (!token) return next();
    const header = req.get('authorization') || '';
    const match = header.match(/^Bearer\s+(.+)$/i);
    if (!match || !safeTokenEqual(match[1], token)) {
      res.set('WWW-Authenticate', 'Bearer');
      return res.status(401).json({ error: 'Authentication required.' });
    }
    return next();
  };
}

function deriveOverallStatus(storageGuard, scan, counts, inboxEnabled) {
  if (storageGuard.state === 'unknown' || storageGuard.state === 'pause_failed' || storageGuard.state === 'pause_not_configured') return 'storage_guard_attention';
  if (storageGuard.state === 'pause_requested' || storageGuard.state === 'resume_required') return 'storage_pause_requested';
  if (storageGuard.state === 'warning') return 'storage_warning';
  if (scan?.error) return 'ingestion_error';
  if (!inboxEnabled) return 'setup_required';
  if (counts.observed > 0) return 'incoming_files_detected';
  if (counts.missing > 0) return 'missing_local_files';
  if (counts.locally_verified > 0) return 'awaiting_cloud_confirmation';
  if (counts.cleanup_candidate > 0) return 'cleanup_review_available';
  return 'idle_unverified';
}

function createApp({ config, getStatus, ledger, storageGuard, getStorage, refreshStatus }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb', strict: true }));

  const allowedOrigins = new Set(config.allowedOrigins || []);
  app.use(cors((req, callback) => {
    const origin = req.get('Origin');
    const sameOrigin = origin && origin === `${req.protocol}://${req.get('host')}`;
    if (origin && !sameOrigin && !allowedOrigins.has(origin)) {
      return callback(new Error('Origin is not in PIXEL_NAS_ALLOWED_ORIGINS.'));
    }
    return callback(null, {
      origin: origin || false,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: false,
    });
  }));

  const authenticate = createAuthMiddleware(config.authToken);
  app.use('/api', authenticate, (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
  });

  app.get('/api/health', (req, res) => {
    const status = getStatus();
    res.json({ ok: true, generatedAt: status.generatedAt, telemetryAvailable: Boolean(status.diagnostics?.lastPollAt) });
  });

  app.get('/api/status', (req, res) => res.json(getStatus()));

  app.get('/api/items', (req, res) => {
    if (!ledger.enabled) return res.status(409).json({ error: 'Set PIXEL_NAS_INBOX_DIR to enable the ingestion ledger.' });
    const limit = Number(req.query.limit || 25);
    const offset = Number(req.query.offset || 0);
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const allowedStates = new Set(['observed', 'locally_verified', 'cleanup_candidate', 'missing']);
    if (state && !allowedStates.has(state)) return res.status(400).json({ error: 'Invalid state filter.' });
    if (!Number.isInteger(limit) || !Number.isInteger(offset) || limit < 1 || offset < 0) {
      return res.status(400).json({ error: 'limit and offset must be non-negative integers; limit must be at least 1.' });
    }
    return res.json({ items: ledger.listItems({ limit, offset, state }), counts: ledger.counts() });
  });

  app.get('/api/cleanup-candidates', (req, res) => {
    if (!ledger.enabled) return res.status(409).json({ error: 'Set PIXEL_NAS_INBOX_DIR to enable the ingestion ledger.' });
    const limit = Number(req.query.limit || 100);
    if (!Number.isInteger(limit) || limit < 1 || limit > 500) return res.status(400).json({ error: 'limit must be an integer from 1 to 500.' });
    return res.json({
      deletionEnabled: false,
      explanation: 'These are manually attested review candidates only. Pixel-NAS never deletes media files.',
      items: ledger.cleanupCandidates({ limit }),
    });
  });

  app.post('/api/items/:id/attest-cloud-backup', async (req, res, next) => {
    try {
      if (!ledger.enabled) return res.status(409).json({ error: 'Set PIXEL_NAS_INBOX_DIR to enable the ingestion ledger.' });
      const item = await ledger.attestCloudBackup(req.params.id, req.body?.evidence);
      return res.status(200).json({
        item,
        note: 'This is an operator attestation, not an automated Google Photos confirmation. No file was deleted.',
      });
    } catch (error) {
      if (/not found/i.test(error.message)) return res.status(404).json({ error: error.message });
      if (error.code === 'ENOENT') return res.status(409).json({ error: 'The local file is missing; cloud attestation was refused.' });
      if (/required|only locally|changed|matches|valid media|Invalid media/i.test(error.message)) return res.status(400).json({ error: error.message });
      return next(error);
    }
  });

  app.post('/api/storage-guard/acknowledge-resume', async (req, res) => {
    try {
      const result = storageGuard.acknowledgeManualResume(getStorage(), req.body?.confirmation);
      if (refreshStatus) await refreshStatus();
      return res.json({ ...result, resilioStarted: false });
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  });

  const exportDirectory = path.join(__dirname, 'out');
  if (fs.existsSync(exportDirectory)) {
    app.use(express.static(exportDirectory, { fallthrough: true, index: 'index.html' }));
  }

  // Express 5 requires named wildcards; this also matches '/'.
  app.get('/{*splat}', (req, res) => {
    if (req.path === '/api' || req.path.startsWith('/api/')) return res.status(404).json({ error: 'API endpoint not found.' });
    const indexPath = path.join(exportDirectory, 'index.html');
    if (!fs.existsSync(indexPath)) return res.status(503).send('Dashboard has not been built. Run npm run build.');
    return res.sendFile(indexPath);
  });

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const statusCode = error.message?.includes('Origin is not') ? 403 : 500;
    if (statusCode === 500) console.error('Request failed:', error.message);
    return res.status(statusCode).json({ error: statusCode === 403 ? error.message : 'Internal server error.' });
  });

  return app;
}

function initialStatus(config) {
  return {
    generatedAt: new Date().toISOString(),
    status: 'setup_required',
    battery: { available: false, percentage: null, status: 'UNAVAILABLE', isCharging: null, checkedAt: null, error: 'Waiting for the first telemetry poll.' },
    storage: { available: false, usedGB: null, totalGB: null, freeGB: null, usagePercent: null, checkedAt: null, path: config.storagePath, error: 'Waiting for the first telemetry poll.' },
    resilio: { status: 'unknown', details: 'No supported read-only transfer signal is configured. Process presence is not treated as active transfer.' },
    cloudBackup: { status: 'unverified', details: 'Google Photos upload completion is not inferred from process presence or old log messages.' },
    ingestion: {
      enabled: Boolean(config.inboxDir),
      status: config.inboxDir ? 'waiting_for_scan' : 'not_configured',
      counts: { observed: 0, locally_verified: 0, cleanup_candidate: 0, missing: 0, total: 0 },
      scannedFiles: 0,
      hashedFiles: 0,
      hashedBytes: 0,
      deferredHashes: 0,
      lastScanAt: null,
      error: null,
      recentItems: [],
    },
    storageGuard: { state: 'unknown', warningGB: config.storageWarningGB, pauseGB: config.storagePauseGB, resumeBelowGB: config.storageResumeBelowGB, webhookConfigured: Boolean(config.stopWebhook), webhookAcknowledged: false, requiresManualResume: false, lastActionAt: null, details: 'Waiting for storage telemetry.' },
    diagnostics: { lastPollAt: null, polling: false, error: null },
  };
}

async function start() {
  loadEnvFile(path.join(__dirname, '.env'));
  const [major, minor] = process.versions.node.split('.').map(Number);
  if (major < 22 || (major === 22 && minor < 13)) {
    throw new Error(`Pixel-NAS requires Node.js 22.13.0 or newer (found ${process.versions.node}).`);
  }

  const config = loadConfig();
  const db = openDatabase(config.dbPath);
  let ignorePatterns = [];
  try {
    ignorePatterns = parseIgnoreList(fs.readFileSync(config.ignoreListPath, 'utf8'));
  } catch (error) {
    console.warn(`Ignore list unavailable (${error.message}); scanner will use built-in safeguards only.`);
  }

  const ledger = new IngestionLedger({
    db,
    inboxDir: config.inboxDir,
    stableWindowMs: config.stableWindowMs,
    maxHashBytesPerScan: config.maxHashBytesPerScan,
    ignorePatterns,
  });
  const storageGuard = new StorageGuard({
    db,
    warningGB: config.storageWarningGB,
    pauseGB: config.storagePauseGB,
    resumeBelowGB: config.storageResumeBelowGB,
    webhookUrl: config.stopWebhook,
    webhookMethod: config.stopWebhookMethod,
    pauseOnUnknown: config.pauseOnStorageUnknown,
    webhookTimeoutMs: config.webhookTimeoutMs,
    retryMs: config.webhookRetryMs,
  });

  let currentStorage = { available: false, usedGB: null, totalGB: null, freeGB: null, usagePercent: null, checkedAt: null, path: config.storagePath, error: 'Waiting for telemetry.' };
  let status = initialStatus(config);
  let pollInProgress = false;
  let activeRefresh = null;
  let ingestionScanInProgress = false;
  let lastScanResult = { enabled: ledger.enabled, scannedFiles: 0, hashedFiles: 0, hashedBytes: 0, deferredHashes: 0, lastScanAt: null, error: null };

  const runIngestionScan = async () => {
    if (!ledger.enabled || ingestionScanInProgress) return;
    ingestionScanInProgress = true;
    try {
      lastScanResult = await ledger.scan();
    } finally {
      ingestionScanInProgress = false;
    }
  };

  const refresh = async () => {
    if (activeRefresh) return activeRefresh;
    pollInProgress = true;
    const currentRun = (async () => {
      try {
        const [battery, storage] = await Promise.all([
          readBatteryTelemetry(),
          readStorage(config.storagePath),
        ]);
        currentStorage = storage;

        // Run the storage guard independently of checksum work; hashing a large video must not delay it.
        const guard = await storageGuard.evaluate(storage);
        const scan = lastScanResult;
        const counts = ledger.counts();
        status = {
          generatedAt: new Date().toISOString(),
          status: deriveOverallStatus(guard, scan, counts, ledger.enabled),
          battery,
          storage,
          resilio: { status: 'unknown', details: 'Transfer state is unknown until a trustworthy read-only Resilio integration is configured. Running process names are not considered active transfer.' },
          cloudBackup: { status: 'unverified', details: 'This service has no supported per-file Google Photos completion API. Local checksums prove local file stability only, not cloud backup.' },
          ingestion: {
            enabled: ledger.enabled,
            status: !ledger.enabled ? 'not_configured' : scan.error ? 'scan_error' : counts.observed > 0 ? 'files_observed' : 'monitoring',
            counts,
            scannedFiles: scan.scannedFiles || 0,
            hashedFiles: scan.hashedFiles || 0,
            hashedBytes: scan.hashedBytes || 0,
            deferredHashes: scan.deferredHashes || 0,
            lastScanAt: scan.lastScanAt || null,
            error: scan.error || null,
            recentItems: ledger.enabled ? ledger.listItems({ limit: 8 }) : [],
          },
          storageGuard: guard,
          diagnostics: { lastPollAt: new Date().toISOString(), polling: true, error: null },
        };
      } catch (error) {
        status = {
          ...status,
          generatedAt: new Date().toISOString(),
          diagnostics: { lastPollAt: new Date().toISOString(), polling: false, error: error.message },
        };
        console.error('Telemetry poll failed:', error.message);
      } finally {
        pollInProgress = false;
      }
    })();
    activeRefresh = currentRun;
    try {
      return await currentRun;
    } finally {
      if (activeRefresh === currentRun) activeRefresh = null;
    }
  };

  await refresh();
  void runIngestionScan().catch((error) => console.error('Initial ingestion scan failed:', error.message));
  const app = createApp({
    config,
    getStatus: () => status,
    ledger,
    storageGuard,
    getStorage: () => currentStorage,
    refreshStatus: refresh,
  });

  const server = app.listen(config.port, config.host, () => {
    console.log(`Pixel-NAS dashboard listening on http://${config.host}:${config.port}`);
    console.log(`Storage path: ${config.storagePath}`);
    console.log(ledger.enabled ? `Ingestion inbox: ${config.inboxDir}` : 'Ingestion ledger disabled: set PIXEL_NAS_INBOX_DIR in dashboard/.env.');
    if (!isLoopbackHost(config.host)) console.log('Remote binding enabled; bearer authentication is required.');
    if (!config.stopWebhook) console.warn('Storage stop webhook is not configured; threshold events will only be reported.');
  });

  const interval = setInterval(refresh, config.telemetryPollMs);
  const ingestionInterval = setInterval(() => { void runIngestionScan().catch((error) => console.error('Ingestion scan failed:', error.message)); }, config.ingestionPollMs);
  interval.unref();
  ingestionInterval.unref();

  const shutdown = () => {
    clearInterval(interval);
    clearInterval(ingestionInterval);
    server.close(() => {
      const closeWhenIdle = async () => {
        // Do not close SQLite while a poll or file hash is still using it.
        while (pollInProgress || ingestionScanInProgress) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        db.close();
        process.exit(0);
      };
      void closeWhenIdle();
    });
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
}

if (require.main === module) {
  start().catch((error) => {
    console.error(`Pixel-NAS failed to start: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = { createApp, createAuthMiddleware, deriveOverallStatus, initialStatus, start };
