'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { openDatabase } = require('../lib/database');
const { IngestionLedger, isIgnored, parseIgnoreList } = require('../lib/ledger');

async function fixture() {
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'pixel-nas-ledger-'));
  const inbox = path.join(temporary, 'inbox');
  await fs.mkdir(inbox);
  const db = openDatabase(path.join(temporary, 'ledger.sqlite'));
  const ledger = new IngestionLedger({ db, inboxDir: inbox, stableWindowMs: 0, ignorePatterns: parseIgnoreList('.sync\n*.tmp\n*.pdf') });
  return { temporary, inbox, db, ledger };
}

test('ignore list supports file globs and sync metadata directories', () => {
  const patterns = parseIgnoreList('# comment\n.sync\n*.tmp\n*.pdf');
  assert.equal(isIgnored('folder/.sync', true, patterns), true);
  assert.equal(isIgnored('photo.tmp', false, patterns), true);
  assert.equal(isIgnored('folder/scan.PDF', false, patterns), true);
  assert.equal(isIgnored('folder/photo.jpg', false, patterns), false);
});


test('opening an in-memory ledger does not change working-directory permissions', (t) => {
  const before = require('node:fs').statSync(process.cwd()).mode & 0o777;
  const memoryDb = openDatabase(':memory:');
  t.after(() => memoryDb.close());
  const after = require('node:fs').statSync(process.cwd()).mode & 0o777;
  assert.equal(after, before);
});

test('checksum work is bounded per scan and deferred files remain eligible', async (t) => {
  const { temporary, inbox, db } = await fixture();
  t.after(async () => { db.close(); await fs.rm(temporary, { recursive: true, force: true }); });
  const ledger = new IngestionLedger({ db, inboxDir: inbox, stableWindowMs: 0, maxHashBytesPerScan: 1024 * 1024 });
  await fs.writeFile(path.join(inbox, 'first.bin'), Buffer.alloc(1024 * 1024 + 10, 1));
  await fs.writeFile(path.join(inbox, 'second.bin'), Buffer.alloc(1024 * 1024 + 10, 2));
  await ledger.scan(); // Register both files.
  const secondScan = await ledger.scan(); // Hash one oversized file only.
  assert.equal(secondScan.hashedFiles, 1);
  assert.ok(secondScan.hashedBytes > 1024 * 1024);
  assert.equal(secondScan.deferredHashes, 1);
  assert.equal(ledger.counts().locally_verified, 1);
  const thirdScan = await ledger.scan();
  assert.equal(thirdScan.hashedFiles, 1);
  assert.equal(ledger.counts().locally_verified, 2);
});

test('ledger verifies stable local files and requires manual cloud attestation', async (t) => {
  const { temporary, inbox, db, ledger } = await fixture();
  t.after(async () => { db.close(); await fs.rm(temporary, { recursive: true, force: true }); });

  await fs.writeFile(path.join(inbox, 'IMG_001.jpg'), Buffer.from('pixel-nas-test-image'));
  await ledger.scan();
  assert.equal(ledger.counts().observed, 1);
  assert.equal(ledger.counts().locally_verified, 0);

  await ledger.scan();
  assert.equal(ledger.counts().locally_verified, 1);
  const [item] = ledger.listItems({ limit: 5 });
  assert.match(item.sha256, /^[a-f0-9]{64}$/);
  assert.equal(item.state, 'locally_verified');
  assert.equal(ledger.cleanupCandidates().length, 0);

  await assert.rejects(
    ledger.attestCloudBackup(item.id, 'short'),
    /12–500 character/i,
  );
  const attested = await ledger.attestCloudBackup(item.id, 'Manually checked the matching item in the intended Google Photos account.');
  assert.equal(attested.state, 'cleanup_candidate');
  assert.equal(ledger.cleanupCandidates().length, 1);
  assert.equal(ledger.counts().total, 1);
});

test('a changed file resets local verification and prior attestation', async (t) => {
  const { temporary, inbox, db, ledger } = await fixture();
  t.after(async () => { db.close(); await fs.rm(temporary, { recursive: true, force: true }); });

  const file = path.join(inbox, 'IMG_002.jpg');
  await fs.writeFile(file, 'first');
  await ledger.scan();
  await ledger.scan();
  const [item] = ledger.listItems();
  await ledger.attestCloudBackup(item.id, 'Manually checked this exact image in Google Photos.');

  await new Promise((resolve) => setTimeout(resolve, 5));
  await fs.writeFile(file, 'different-content');
  await ledger.scan();
  const [changed] = ledger.listItems();
  assert.equal(changed.state, 'observed');
  assert.equal(changed.sha256, null);
  assert.equal(changed.cloud_attested_at, null);
});

test('missing local files are recorded as missing, never treated as backed up', async (t) => {
  const { temporary, inbox, db, ledger } = await fixture();
  t.after(async () => { db.close(); await fs.rm(temporary, { recursive: true, force: true }); });

  const file = path.join(inbox, 'IMG_003.jpg');
  await fs.writeFile(file, 'content');
  await ledger.scan();
  await ledger.scan();
  await fs.rm(file);
  await ledger.scan();
  const [item] = ledger.listItems();
  assert.equal(item.state, 'missing');
  assert.match(item.failure_reason, /not proof of cloud backup/i);
});
