import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { ConfigManager } from '../src/core/config.js';
import { ProfileManager } from '../src/core/profile.js';
import { ManifestManager } from '../src/core/manifest.js';
import { LocalStorageDriver } from '../src/drivers/storage/local.js';
import { PostgresDriver } from '../src/drivers/database/postgres.js';
import { ProjectSync } from '../src/core/sync.js';

describe('ConfigManager & ProfileManager', () => {
  const testRoot = path.join(__dirname, '__fixtures_test');
  const profilesPath = path.join(testRoot, 'profiles.json');

  beforeEach(() => {
    if (fs.existsSync(testRoot)) {
      fs.rmSync(testRoot, { recursive: true, force: true });
    }
    fs.mkdirSync(testRoot, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testRoot)) {
      fs.rmSync(testRoot, { recursive: true, force: true });
    }
  });

  it('loads env variables and creates default profile correctly', () => {
    const envFile = path.join(testRoot, '.env');
    fs.writeFileSync(
      envFile,
      'POSTGRES_PRISMA_URL="postgres://user:pass@localhost:5432/testdb"\nSUPABASE_URL="https://test.supabase.co"\nSUPABASE_SERVICE_ROLE_KEY="secret-key"',
      'utf-8'
    );

    const config = new ConfigManager(testRoot);
    const env = config.loadEnv();
    expect(env.POSTGRES_PRISMA_URL).toBe('postgres://user:pass@localhost:5432/testdb');

    const defaultProfile = config.createDefaultProfileFromEnv(env);
    expect(defaultProfile.name).toBe('default');
    expect(defaultProfile.db.type).toBe('postgres');
    expect(defaultProfile.storage.type).toBe('supabase');
  });

  it('manages profiles: add, switch, and list profiles', () => {
    const config = new ConfigManager(testRoot);
    const manager = new ProfileManager(profilesPath, config);

    const initial = manager.loadProfiles();
    expect(initial.activeProfile).toBe('default');

    manager.addProfile({
      name: 'production',
      description: 'Production DB',
      db: { type: 'supabase', url: 'postgres://aws.supabase.co:5432/prod' },
      storage: { type: 's3', bucket: 'simdp-prod' }
    });

    const list = manager.listProfiles();
    expect(list.length).toBe(2);

    const switched = manager.setActiveProfile('production');
    expect(switched).toBe(true);
    expect(manager.getActiveProfile().name).toBe('production');
  });
});

describe('ManifestManager', () => {
  const testDir = path.join(__dirname, '__manifest_test');

  beforeEach(() => {
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
    fs.mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) fs.rmSync(testDir, { recursive: true, force: true });
  });

  it('generates, verifies, and detects checksum mismatches', () => {
    const file1 = path.join(testDir, 'table.json');
    fs.writeFileSync(file1, JSON.stringify([{ id: 1, name: 'Arsi' }]), 'utf-8');

    const hash1 = ManifestManager.calculateFileHash(file1);
    expect(hash1).toHaveLength(64);

    const manifest = ManifestManager.createManifest({
      sourceProfile: 'default',
      type: 'full',
      checksums: { 'table.json': hash1 }
    });

    const manifestFile = path.join(testDir, 'manifest.json');
    ManifestManager.saveManifest(manifest, manifestFile);

    const loaded = ManifestManager.readManifest(manifestFile);
    expect(loaded.sourceProfile).toBe('default');

    // Verify correct
    const check1 = ManifestManager.verifyChecksums(testDir, manifest.checksums);
    expect(check1.valid).toBe(true);

    // Tamper file
    fs.writeFileSync(file1, JSON.stringify([{ id: 1, name: 'Tampered' }]), 'utf-8');
    const check2 = ManifestManager.verifyChecksums(testDir, manifest.checksums);
    expect(check2.valid).toBe(false);
    expect(check2.mismatches.length).toBe(1);
  });
});

describe('LocalStorageDriver', () => {
  const testStorageDir = path.join(__dirname, '__local_storage_test');
  const outTarPath = path.join(testStorageDir, 'backup.tar.gz');

  beforeEach(() => {
    if (fs.existsSync(testStorageDir)) fs.rmSync(testStorageDir, { recursive: true, force: true });
    fs.mkdirSync(path.join(testStorageDir, 'documents', 'subdir'), { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(testStorageDir)) fs.rmSync(testStorageDir, { recursive: true, force: true });
  });

  it('lists objects, backups bucket to tar.gz and restores files', async () => {
    const fileA = path.join(testStorageDir, 'documents', 'doc1.pdf');
    const fileB = path.join(testStorageDir, 'documents', 'subdir', 'doc2.pdf');
    fs.writeFileSync(fileA, 'file A content');
    fs.writeFileSync(fileB, 'file B content');

    const driver = new LocalStorageDriver({
      type: 'local',
      localPath: testStorageDir
    });

    const testConn = await driver.testConnection();
    expect(testConn.success).toBe(true);

    const objects = await driver.listObjects('documents');
    expect(objects.length).toBe(2);

    const backupResult = await driver.backupBucket('documents', outTarPath);
    expect(backupResult.objectCount).toBe(2);
    expect(fs.existsSync(outTarPath)).toBe(true);

    // Delete originals and restore
    fs.rmSync(fileA);
    fs.rmSync(fileB);

    const restoreResult = await driver.restoreBucket('documents', outTarPath);
    expect(restoreResult.restoredCount).toBe(2);
    expect(fs.existsSync(fileA)).toBe(true);
    expect(fs.existsSync(fileB)).toBe(true);
  });
});
