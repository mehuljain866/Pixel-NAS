'use strict';

const fs = require('node:fs/promises');

const BYTES_PER_GIB = 1024 ** 3;

function summarizeStatfs(stats) {
  const blocks = Number(stats.blocks);
  const freeBlocks = Number(stats.bfree);
  const availableBlocks = Number(stats.bavail);
  const blockSize = Number(stats.bsize);

  if (![blocks, freeBlocks, availableBlocks, blockSize].every(Number.isFinite)
      || blocks <= 0 || blockSize <= 0 || freeBlocks < 0 || availableBlocks < 0) {
    throw new Error('Filesystem returned invalid capacity information.');
  }

  const totalBytes = blocks * blockSize;
  const usedBytes = Math.max(0, (blocks - freeBlocks) * blockSize);
  const freeBytes = availableBlocks * blockSize;
  if (!Number.isFinite(totalBytes) || totalBytes <= 0) {
    throw new Error('Filesystem capacity is unavailable.');
  }

  return {
    available: true,
    totalGB: Number((totalBytes / BYTES_PER_GIB).toFixed(2)),
    usedGB: Number((usedBytes / BYTES_PER_GIB).toFixed(2)),
    freeGB: Number((freeBytes / BYTES_PER_GIB).toFixed(2)),
    usagePercent: Number(Math.min(100, (usedBytes / totalBytes) * 100).toFixed(1)),
    checkedAt: new Date().toISOString(),
    error: null,
  };
}

async function readStorage(storagePath) {
  try {
    const stats = await fs.statfs(storagePath);
    return { ...summarizeStatfs(stats), path: storagePath };
  } catch (error) {
    return {
      available: false,
      totalGB: null,
      usedGB: null,
      freeGB: null,
      usagePercent: null,
      checkedAt: new Date().toISOString(),
      path: storagePath,
      error: error.message,
    };
  }
}

function classifyStorage(storage, thresholds) {
  if (!storage || storage.available !== true || !Number.isFinite(storage.usedGB)) return 'unknown';
  if (storage.usedGB >= thresholds.pauseGB) return 'pause_required';
  if (storage.usedGB >= thresholds.warningGB) return 'warning';
  return 'normal';
}

module.exports = { BYTES_PER_GIB, classifyStorage, readStorage, summarizeStatfs };
