'use strict';

const fs = require('node:fs');
const path = require('node:path');
const sqlite = require('node:sqlite');
const Database = sqlite.Database || sqlite.DatabaseSync;

function openDatabase(dbPath) {
  if (dbPath !== ':memory:') {
    // Create missing directories privately, but never chmod an existing parent
    // directory supplied by the operator (it may contain unrelated files).
    fs.mkdirSync(path.dirname(dbPath), { recursive: true, mode: 0o700 });
  }
  const db = new Database(dbPath);
  if (dbPath !== ':memory:') {
    try { fs.chmodSync(dbPath, 0o600); } catch { /* Keep working if the filesystem ignores POSIX modes. */ }
  }
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS media_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      relative_path TEXT NOT NULL UNIQUE,
      size_bytes INTEGER NOT NULL,
      mtime_ms REAL NOT NULL,
      sha256 TEXT,
      state TEXT NOT NULL,
      first_seen_at TEXT NOT NULL,
      stable_since TEXT NOT NULL,
      last_seen_at TEXT NOT NULL,
      verified_at TEXT,
      cloud_attested_at TEXT,
      cloud_evidence TEXT,
      failure_reason TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_media_items_state ON media_items(state, id DESC);
    CREATE INDEX IF NOT EXISTS idx_media_items_sha256 ON media_items(sha256);

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      media_item_id INTEGER,
      event_type TEXT NOT NULL,
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL,
      FOREIGN KEY(media_item_id) REFERENCES media_items(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(id DESC);

    CREATE TABLE IF NOT EXISTS system_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  return db;
}

function writeEvent(db, mediaItemId, eventType, details = {}) {
  db.prepare(`
    INSERT INTO events (media_item_id, event_type, details_json, created_at)
    VALUES (?, ?, ?, ?)
  `).run(mediaItemId ?? null, eventType, JSON.stringify(details), new Date().toISOString());
}

function getSystemState(db, key, fallback = null) {
  const row = db.prepare('SELECT value FROM system_state WHERE key = ?').get(key);
  return row ? row.value : fallback;
}

function setSystemState(db, key, value) {
  db.prepare(`
    INSERT INTO system_state (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key, String(value), new Date().toISOString());
}

module.exports = { getSystemState, openDatabase, setSystemState, writeEvent };
