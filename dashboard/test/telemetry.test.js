'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { parseBatteryStatus, parseDumpsysBattery, readBatteryTelemetry } = require('../lib/telemetry');

test('battery parser preserves a legitimate zero percent reading', () => {
  const battery = parseBatteryStatus({ percentage: 0, status: 'DISCHARGING' });
  assert.equal(battery.percentage, 0);
  assert.equal(battery.isCharging, false);
});

test('dumpsys battery parser maps charging and full states', () => {
  assert.equal(parseDumpsysBattery('level: 82\nstatus: 2').isCharging, true);
  assert.equal(parseDumpsysBattery('level: 100\nstatus: 5').isCharging, true);
  assert.equal(parseDumpsysBattery('level: 34\nstatus: 3').isCharging, false);
});

test('battery fallback reports unavailable instead of inventing values', async () => {
  const battery = await readBatteryTelemetry({ command: async () => { throw new Error('not available'); } });
  assert.equal(battery.available, false);
  assert.equal(battery.percentage, null);
  assert.equal(battery.status, 'UNAVAILABLE');
});
