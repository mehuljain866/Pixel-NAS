'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { BYTES_PER_GIB, classifyStorage, summarizeStatfs } = require('../lib/storage');

test('summarizeStatfs calculates used, total and available capacity', () => {
  const result = summarizeStatfs({
    blocks: 100,
    bfree: 25,
    bavail: 20,
    bsize: BYTES_PER_GIB,
  });
  assert.equal(result.totalGB, 100);
  assert.equal(result.usedGB, 75);
  assert.equal(result.freeGB, 20);
  assert.equal(result.usagePercent, 75);
});

test('summarizeStatfs rejects invalid filesystem telemetry', () => {
  assert.throws(() => summarizeStatfs({ blocks: 0, bfree: 0, bavail: 0, bsize: 0 }), /invalid capacity/i);
});

test('storage classification fails closed when telemetry is unavailable', () => {
  const thresholds = { warningGB: 48, pauseGB: 55 };
  assert.equal(classifyStorage({ available: false, usedGB: null }, thresholds), 'unknown');
  assert.equal(classifyStorage({ available: true, usedGB: 47.9 }, thresholds), 'normal');
  assert.equal(classifyStorage({ available: true, usedGB: 48 }, thresholds), 'warning');
  assert.equal(classifyStorage({ available: true, usedGB: 55 }, thresholds), 'pause_required');
});
