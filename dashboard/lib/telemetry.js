'use strict';

const { execFile } = require('node:child_process');

function execFileText(command, args, timeoutMs = 3000) {
  return new Promise((resolve, reject) => {
    execFile(command, args, { timeout: timeoutMs, windowsHide: true, maxBuffer: 256 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        error.stderr = stderr;
        reject(error);
        return;
      }
      resolve(String(stdout || '').trim());
    });
  });
}

function parseBatteryStatus(payload) {
  const percentage = Number(payload.percentage);
  const rawStatus = String(payload.status || '').toUpperCase();
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw new Error('Battery API returned an invalid percentage.');
  }
  return {
    available: true,
    percentage,
    status: rawStatus || 'UNKNOWN',
    isCharging: rawStatus === 'CHARGING' || rawStatus === 'FULL',
    checkedAt: new Date().toISOString(),
    error: null,
  };
}

function parseDumpsysBattery(output) {
  const levelMatch = output.match(/^\s*level:\s*(\d+)/mi);
  const statusMatch = output.match(/^\s*status:\s*(\d+)/mi);
  if (!levelMatch) throw new Error('dumpsys did not return a battery level.');

  const percentage = Number(levelMatch[1]);
  const numericStatus = Number(statusMatch?.[1]);
  const labels = { 1: 'UNKNOWN', 2: 'CHARGING', 3: 'DISCHARGING', 4: 'NOT_CHARGING', 5: 'FULL' };
  const status = labels[numericStatus] || 'UNKNOWN';
  return {
    available: true,
    percentage,
    status,
    isCharging: numericStatus === 2 || numericStatus === 5,
    checkedAt: new Date().toISOString(),
    error: null,
  };
}

async function readBatteryTelemetry({ command = execFileText } = {}) {
  try {
    const output = await command('termux-battery-status', [], 3000);
    return parseBatteryStatus(JSON.parse(output));
  } catch (primaryError) {
    try {
      const output = await command('dumpsys', ['battery'], 3000);
      return parseDumpsysBattery(output);
    } catch (fallbackError) {
      return {
        available: false,
        percentage: null,
        status: 'UNAVAILABLE',
        isCharging: null,
        checkedAt: new Date().toISOString(),
        error: `Termux API: ${primaryError.message}; dumpsys: ${fallbackError.message}`,
      };
    }
  }
}

module.exports = { execFileText, parseBatteryStatus, parseDumpsysBattery, readBatteryTelemetry };
