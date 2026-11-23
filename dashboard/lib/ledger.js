'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const fsp = require('node:fs/promises');
const path = require('node:path');
const { writeEvent } = require('./database');

function globToRegExp(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const source = escaped.replace(/\*/g, '.*').replace(/\?/g, '.');
  return new RegExp(`^${source}$`, 'i');
}

function parseIgnoreList(contents) {
  return contents
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((pattern) => ({ pattern: pattern.replace(/\\/g, '/'), regex: globToRegExp(pattern.replace(/\\/g, '/')) }));
}

function isIgnored(relativePath, isDirectory, patterns) {
  const normalized = relativePath.replace(/\\/g, '/').replace(/^\.\//, '');
  const basename = path.posix.basename(normalized);
  return patterns.some(({ pattern, regex }) => {
    if (pattern.includes('/')) {
      return regex.test(normalized)
        || normalized.endsWith(`/${pattern}`)
        || (isDirectory && normalized.startsWith(`${pattern}/`));
    }
    return regex.test(basename);
  });
}

async function hashFile(filePath) {
  const hash = crypto.createHash('sha256');
  await new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', resolve);
  });
  return hash.digest('hex');
}

class IngestionLedger {
  constructor({ db, inboxDir, stableWindowMs = 60000, maxHashBytesPerScan = 536870912, ignorePatterns = [] }) {
    this.db = db;
    this.inboxDir = inboxDir ? path.resolve(inboxDir) : '';
    this.stableWindowMs = stableWindowMs;
    this.maxHashBytesPerScan = maxHashBytesPerScan;
    this.ignorePatterns = ignorePatterns;
    this.lastScanAt = null;
    this.lastScanError = null;
    this.lastScanCount = 0;
    this.scanInProgress = false;
  }

  get enabled() {
    return Boolean(this.inboxDir);
  }

  async scan() {
    if (!this.enabled) {
      return { enabled: false, scannedFiles: 0, lastScanAt: this.lastScanAt, error: null };
    }
    if (this.scanInProgress) {
      return { enabled: true, skipped: true, scannedFiles: this.lastScanCount, lastScanAt: this.lastScanAt, error: null };
    }

    this.scanInProgress = true;
    const startedAt = new Date().toISOString();
    const seen = new Set();
    let scannedFiles = 0;
    const hashBudget = { remainingBytes: this.maxHashBytesPerScan, hashedFiles: 0, hashedBytes: 0, deferredHashes: 0 };

    try {
      const rootStat = await fsp.stat(this.inboxDir);
      if (!rootStat.isDirectory()) throw new Error('PIXEL_NAS_INBOX_DIR must point to a directory.');

      const visit = async (directory) => {
        const entries = await fsp.readdir(directory, { withFileTypes: true });
        entries.sort((a, b) => a.name.localeCompare(b.name));

        for (const entry of entries) {
          const absolutePath = path.join(directory, entry.name);
          const relativePath = path.relative(this.inboxDir, absolutePath).split(path.sep).join('/');
          if (isIgnored(relativePath, entry.isDirectory(), this.ignorePatterns)) continue;
          if (entry.isSymbolicLink()) continue;

          if (entry.isDirectory()) {
            await visit(absolutePath);
            continue;
          }
          if (!entry.isFile()) continue;

          const stat = await fsp.stat(absolutePath);
          if (!stat.isFile()) continue;
          seen.add(relativePath);
          scannedFiles += 1;
          await this.#recordFile(relativePath, absolutePath, stat, hashBudget);
        }
      };

      await visit(this.inboxDir);

      // Only mark unseen items missing after a complete successful traversal.
      const existing = this.db.prepare(`
        SELECT id, relative_path, state FROM media_items WHERE state <> 'missing'
      `).all();
      for (const item of existing) {
        if (!seen.has(item.relative_path)) {
          this.db.prepare(`
            UPDATE media_items SET state = 'missing', failure_reason = ?, last_seen_at = ? WHERE id = ?
          `).run('File is no longer present in the configured inbox; this is not proof of cloud backup.', startedAt, item.id);
          writeEvent(this.db, item.id, 'file_missing', { previousState: item.state });
        }
      }

      this.lastScanAt = new Date().toISOString();
      this.lastScanError = null;
      this.lastScanCount = scannedFiles;
      return { enabled: true, scannedFiles, hashedFiles: hashBudget.hashedFiles, hashedBytes: hashBudget.hashedBytes, deferredHashes: hashBudget.deferredHashes, lastScanAt: this.lastScanAt, error: null };
    } catch (error) {
      this.lastScanError = error.message;
      return { enabled: true, scannedFiles, lastScanAt: this.lastScanAt, error: error.message };
    } finally {
      this.scanInProgress = false;
    }
  }

  async #recordFile(relativePath, absolutePath, stat, hashBudget) {
    const now = new Date().toISOString();
    const existing = this.db.prepare('SELECT * FROM media_items WHERE relative_path = ?').get(relativePath);

    if (!existing) {
      const result = this.db.prepare(`
        INSERT INTO media_items
          (relative_path, size_bytes, mtime_ms, state, first_seen_at, stable_since, last_seen_at)
        VALUES (?, ?, ?, 'observed', ?, ?, ?)
      `).run(relativePath, stat.size, stat.mtimeMs, now, now, now);
      writeEvent(this.db, Number(result.lastInsertRowid), 'file_observed', { relativePath, sizeBytes: stat.size });
      return;
    }

    const changed = existing.size_bytes !== stat.size || existing.mtime_ms !== stat.mtimeMs || existing.state === 'missing';
    if (changed) {
      this.db.prepare(`
        UPDATE media_items
        SET size_bytes = ?, mtime_ms = ?, sha256 = NULL, state = 'observed', stable_since = ?,
            last_seen_at = ?, verified_at = NULL, cloud_attested_at = NULL, cloud_evidence = NULL,
            failure_reason = NULL
        WHERE id = ?
      `).run(stat.size, stat.mtimeMs, now, now, existing.id);
      writeEvent(this.db, existing.id, 'file_changed_or_returned', { relativePath, sizeBytes: stat.size });
      return;
    }

    this.db.prepare('UPDATE media_items SET last_seen_at = ? WHERE id = ?').run(now, existing.id);
    if (existing.state !== 'observed') return;

    const stableSince = Date.parse(existing.stable_since);
    if (!Number.isFinite(stableSince) || Date.now() - stableSince < this.stableWindowMs) return;
    // Process a bounded amount of checksum I/O per scan. One oversized file is
    // allowed as the first hash so very large videos do not remain stuck forever.
    if (hashBudget.hashedFiles > 0 && hashBudget.remainingBytes <= 0) {
      hashBudget.deferredHashes += 1;
      return;
    }

    const digest = await hashFile(absolutePath);
    hashBudget.hashedFiles += 1;
    hashBudget.hashedBytes += stat.size;
    hashBudget.remainingBytes = Math.max(0, hashBudget.remainingBytes - stat.size);
    const afterHash = await fsp.stat(absolutePath);
    if (afterHash.size !== stat.size || afterHash.mtimeMs !== stat.mtimeMs) {
      const resetAt = new Date().toISOString();
      this.db.prepare(`
        UPDATE media_items SET size_bytes = ?, mtime_ms = ?, state = 'observed', stable_since = ?,
          sha256 = NULL, verified_at = NULL, cloud_attested_at = NULL, cloud_evidence = NULL,
          failure_reason = 'File changed while its checksum was being calculated.', last_seen_at = ?
        WHERE id = ?
      `).run(afterHash.size, afterHash.mtimeMs, resetAt, resetAt, existing.id);
      writeEvent(this.db, existing.id, 'file_changed_during_hash', { relativePath });
      return;
    }

    this.db.prepare(`
      UPDATE media_items
      SET sha256 = ?, state = 'locally_verified', verified_at = ?, failure_reason = NULL, last_seen_at = ?
      WHERE id = ?
    `).run(digest, now, now, existing.id);
    writeEvent(this.db, existing.id, 'file_locally_verified', { relativePath, sha256: digest, sizeBytes: stat.size });
  }

  counts() {
    const rows = this.db.prepare('SELECT state, COUNT(*) AS count FROM media_items GROUP BY state').all();
    const counts = { observed: 0, locally_verified: 0, cleanup_candidate: 0, missing: 0, total: 0 };
    for (const row of rows) {
      counts[row.state] = Number(row.count);
      counts.total += Number(row.count);
    }
    return counts;
  }

  listItems({ limit = 25, offset = 0, state = '' } = {}) {
    const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
    const safeOffset = Math.max(0, Math.trunc(offset));
    const rows = state
      ? this.db.prepare(`
          SELECT id, relative_path, size_bytes, sha256, state, first_seen_at, verified_at,
                 cloud_attested_at, cloud_evidence, failure_reason
          FROM media_items WHERE state = ? ORDER BY id DESC LIMIT ? OFFSET ?
        `).all(state, safeLimit, safeOffset)
      : this.db.prepare(`
          SELECT id, relative_path, size_bytes, sha256, state, first_seen_at, verified_at,
                 cloud_attested_at, cloud_evidence, failure_reason
          FROM media_items ORDER BY id DESC LIMIT ? OFFSET ?
        `).all(safeLimit, safeOffset);
    return rows;
  }

  cleanupCandidates({ limit = 100 } = {}) {
    const safeLimit = Math.max(1, Math.min(500, Math.trunc(limit)));
    return this.db.prepare(`
      SELECT id, relative_path, size_bytes, sha256, verified_at, cloud_attested_at, cloud_evidence
      FROM media_items WHERE state = 'cleanup_candidate' ORDER BY cloud_attested_at ASC LIMIT ?
    `).all(safeLimit);
  }

  async attestCloudBackup(id, evidence) {
    const numericId = Number(id);
    if (!Number.isSafeInteger(numericId) || numericId <= 0) throw new Error('A valid media item ID is required.');
    if (typeof evidence !== 'string' || evidence.trim().length < 12 || evidence.trim().length > 500) {
      throw new Error('Evidence must be a 12–500 character description of the manual cloud check.');
    }

    const item = this.db.prepare('SELECT * FROM media_items WHERE id = ?').get(numericId);
    if (!item) throw new Error('Media item not found.');
    if (item.state !== 'locally_verified') {
      throw new Error(`Only locally verified files can be attested; current state is ${item.state}.`);
    }

    const absolutePath = path.resolve(this.inboxDir, item.relative_path);
    if (!absolutePath.startsWith(`${this.inboxDir}${path.sep}`)) throw new Error('Invalid media path.');
    const statBefore = await fsp.stat(absolutePath);
    if (!statBefore.isFile() || statBefore.size !== item.size_bytes || statBefore.mtimeMs !== item.mtime_ms) {
      throw new Error('The local file changed or disappeared; run the scanner again before attesting.');
    }
    const digest = await hashFile(absolutePath);
    const statAfter = await fsp.stat(absolutePath);
    if (digest !== item.sha256 || statAfter.size !== statBefore.size || statAfter.mtimeMs !== statBefore.mtimeMs) {
      throw new Error('The local file no longer matches its recorded checksum. Attestation was refused.');
    }

    const now = new Date().toISOString();
    const note = evidence.trim();
    this.db.prepare(`
      UPDATE media_items SET state = 'cleanup_candidate', cloud_attested_at = ?, cloud_evidence = ?, failure_reason = NULL
      WHERE id = ?
    `).run(now, note, numericId);
    writeEvent(this.db, numericId, 'operator_attested_cloud_backup', { evidence: note, sha256: digest });
    return this.db.prepare(`
      SELECT id, relative_path, size_bytes, sha256, state, verified_at, cloud_attested_at, cloud_evidence
      FROM media_items WHERE id = ?
    `).get(numericId);
  }
}

module.exports = { IngestionLedger, hashFile, isIgnored, parseIgnoreList };
