'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');
const { openDatabase } = require('../lib/database');
const { StorageGuard } = require('../lib/storage-guard');

async function makeDb(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'pixel-nas-guard-'));
  const db = openDatabase(path.join(directory, 'ledger.sqlite'));
  t.after(async () => { db.close(); await fs.rm(directory, { recursive: true, force: true }); });
  return db;
}

const thresholds = { warningGB: 48, pauseGB: 55, resumeBelowGB: 50 };

test('storage telemetry loss requests a conservative stop by default', async (t) => {
  const db = await makeDb(t);
  let called = false;
  const guard = new StorageGuard({ db, ...thresholds, webhookUrl: 'http://localhost/stop', fetchImpl: async () => { called = true; return { ok: true }; } });
  const result = await guard.evaluate({ available: false, usedGB: null });
  assert.equal(result.state, 'pause_requested');
  assert.equal(result.webhookAcknowledged, true);
  assert.equal(called, true);
});

test('storage telemetry loss can be configured as alert-only', async (t) => {
  const db = await makeDb(t);
  let called = false;
  const guard = new StorageGuard({ db, ...thresholds, webhookUrl: 'http://localhost/stop', pauseOnUnknown: false, fetchImpl: async () => { called = true; return { ok: true }; } });
  const result = await guard.evaluate({ available: false, usedGB: null });
  assert.equal(result.state, 'unknown');
  assert.equal(called, false);
});

test('storage guard latches an acknowledged stop request and requires manual resume', async (t) => {
  const db = await makeDb(t);
  let calls = 0;
  const guard = new StorageGuard({
    db,
    ...thresholds,
    webhookUrl: 'http://localhost/stop',
    fetchImpl: async () => { calls += 1; return { ok: true }; },
  });

  const triggered = await guard.evaluate({ available: true, usedGB: 56 });
  assert.equal(triggered.state, 'pause_requested');
  assert.equal(triggered.webhookAcknowledged, true);
  assert.equal(calls, 1);

  const belowResume = await guard.evaluate({ available: true, usedGB: 49 });
  assert.equal(belowResume.state, 'resume_required');
  assert.equal(guard.latched, true);
  assert.throws(() => guard.acknowledgeManualResume({ available: true, usedGB: 49 }, 'yes'), /manual restart confirmation/i);

  const resumed = guard.acknowledgeManualResume({ available: true, usedGB: 49 }, 'I restarted Resilio manually');
  assert.equal(resumed.state, 'monitoring');
  assert.equal(guard.latched, false);
});


test('storage guard uses the configured HTTP method', async (t) => {
  const db = await makeDb(t);
  let request;
  const guard = new StorageGuard({
    db,
    ...thresholds,
    webhookUrl: 'http://localhost/stop',
    webhookMethod: 'POST',
    fetchImpl: async (_url, options) => { request = options; return { ok: true }; },
  });
  const result = await guard.evaluate({ available: true, usedGB: 56 });
  assert.equal(result.state, 'pause_requested');
  assert.equal(request.method, 'POST');
  assert.match(request.body, /storage_threshold_reached/);
});

test('latched stop request stays visible and cannot be resumed while storage is unavailable', async (t) => {
  const db = await makeDb(t);
  const guard = new StorageGuard({ db, ...thresholds, webhookUrl: 'http://localhost/stop', fetchImpl: async () => ({ ok: true }) });
  await guard.evaluate({ available: true, usedGB: 56 });
  const result = await guard.evaluate({ available: false, usedGB: null });
  assert.equal(result.state, 'pause_requested');
  assert.equal(result.requiresManualResume, true);
  assert.throws(() => guard.acknowledgeManualResume({ available: false, usedGB: null }, 'I restarted Resilio manually'), /measurable/i);
});

test('webhook failures are visible and retried only after the retry interval', async (t) => {
  const db = await makeDb(t);
  let calls = 0;
  const guard = new StorageGuard({
    db,
    ...thresholds,
    webhookUrl: 'http://localhost/stop',
    retryMs: 60000,
    fetchImpl: async () => { calls += 1; throw new Error('connection refused'); },
  });
  const first = await guard.evaluate({ available: true, usedGB: 56 });
  const second = await guard.evaluate({ available: true, usedGB: 56 });
  assert.equal(first.state, 'pause_failed');
  assert.equal(second.state, 'pause_failed');
  assert.equal(calls, 1);
});

test('storage guard reports an unconfigured webhook at the hard threshold', async (t) => {
  const db = await makeDb(t);
  const guard = new StorageGuard({ db, ...thresholds, webhookUrl: '' });
  const result = await guard.evaluate({ available: true, usedGB: 55 });
  assert.equal(result.state, 'pause_not_configured');
});
