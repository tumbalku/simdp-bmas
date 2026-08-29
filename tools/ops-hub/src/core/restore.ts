import fs from 'node:fs';
import path from 'node:path';
import * as tar from 'tar';
import { 
  IDatabaseDriver, 
  IStorageDriver, 
  RestoreOptions, 
  RestoreResult 
} from '../types/index.js';
import { ConfigManager } from './config.js';
import { ProfileManager } from './profile.js';
import { PostgresDriver } from '../drivers/database/postgres.js';
import { SupabaseStorageDriver } from '../drivers/storage/supabase.js';
import { S3StorageDriver } from '../drivers/storage/s3.js';
import { LocalStorageDriver } from '../drivers/storage/local.js';
import { ManifestManager } from './manifest.js';

export class RestorePipeline {
  private configManager: ConfigManager;
  private profileManager: ProfileManager;

  constructor(customProjectRoot?: string) {
    this.configManager = new ConfigManager(customProjectRoot);
    this.profileManager = new ProfileManager(undefined, this.configManager);
  }

  private createDatabaseDriver(profile: any): IDatabaseDriver {
    return new PostgresDriver(profile.db);
  }

  private createStorageDriver(profile: any): IStorageDriver {
    const type = profile.storage?.type || 'local';
    if (type === 'supabase') {
      return new SupabaseStorageDriver(profile.storage);
    } else if (type === 's3') {
      return new S3StorageDriver(profile.storage);
    } else {
      return new LocalStorageDriver(profile.storage);
    }
  }

  public async execute(artifactPath: string, options?: RestoreOptions): Promise<RestoreResult> {
    const startTime = Date.now();
    const dryRun = options?.dryRun ?? false;

    if (!fs.existsSync(artifactPath)) {
      throw new Error(`Backup artifact not found: ${artifactPath}`);
    }

    const profile = options?.profileName 
      ? this.profileManager.loadProfiles().profiles[options.profileName] 
      : this.profileManager.getActiveProfile();

    if (!profile) {
      throw new Error(`Profile '${options?.profileName || 'active'}' not found.`);
    }

    const tempExtractDir = path.join(
      path.dirname(artifactPath), 
      `__extract_${Date.now()}`
    );
    fs.mkdirSync(tempExtractDir, { recursive: true });

    try {
      options?.onProgress?.({ 
        stage: 'extract', 
        message: `Extracting backup bundle ${path.basename(artifactPath)}...` 
      });

      await tar.x({
        file: artifactPath,
        cwd: tempExtractDir
      });

      // 1. Read & Validate Manifest
      const manifestPath = path.join(tempExtractDir, 'manifest.json');
      if (!fs.existsSync(manifestPath)) {
        throw new Error('Corrupted backup bundle: manifest.json is missing.');
      }

      options?.onProgress?.({ stage: 'verify', message: 'Verifying backup integrity and checksums...' });
      const manifest = ManifestManager.readManifest(manifestPath);
      const verification = ManifestManager.verifyChecksums(tempExtractDir, manifest.checksums);

      if (!verification.valid) {
        throw new Error(`Integrity check failed: ${verification.mismatches.join(', ')}`);
      }

      options?.onProgress?.({ 
        stage: 'verify', 
        message: `Integrity check passed! Source Profile: ${manifest.sourceProfile}, Type: ${manifest.type}` 
      });

      let dbRestored: { tables: string[]; totalRows: number } | undefined;
      const storageRestored: Array<{ bucket: string; restoredCount: number }> = [];

      // 2. Restore Database
      const dbDir = path.join(tempExtractDir, 'database');
      if (fs.existsSync(dbDir) && (options?.targetType === undefined || options.targetType === 'full' || options.targetType === 'db')) {
        options?.onProgress?.({ stage: 'database', message: `Connecting to database target (${profile.db.type})...` });
        const dbDriver = this.createDatabaseDriver(profile);
        try {
          const res = await dbDriver.restoreDatabase(dbDir, {
            dryRun,
            onProgress: (msg) => options?.onProgress?.({ stage: 'database', message: msg })
          });
          dbRestored = {
            tables: res.restoredTables,
            totalRows: res.totalRows
          };
        } finally {
          await dbDriver.close();
        }
      }

      // 3. Restore Storage
      const storageDir = path.join(tempExtractDir, 'storage');
      if (fs.existsSync(storageDir) && (options?.targetType === undefined || options.targetType === 'full' || options.targetType === 'storage')) {
        options?.onProgress?.({ stage: 'storage', message: `Connecting to storage target (${profile.storage.type})...` });
        const storageDriver = this.createStorageDriver(profile);
        const bucketTars = fs.readdirSync(storageDir).filter(f => f.endsWith('.tar.gz'));

        for (const bucketTar of bucketTars) {
          const bucketName = bucketTar.replace('.tar.gz', '');
          const bucketTarPath = path.join(storageDir, bucketTar);

          options?.onProgress?.({ stage: 'storage', message: `Restoring bucket '${bucketName}'...` });
          const res = await storageDriver.restoreBucket(bucketName, bucketTarPath, {
            dryRun,
            onProgress: (msg) => options?.onProgress?.({ stage: 'storage', message: msg })
          });

          storageRestored.push({
            bucket: bucketName,
            restoredCount: res.restoredCount
          });
        }
      }

      const durationMs = Date.now() - startTime;
      options?.onProgress?.({ 
        stage: 'complete', 
        message: `${dryRun ? '[DRY-RUN] Restore simulation' : 'Restore'} finished in ${(durationMs / 1000).toFixed(2)}s.` 
      });

      return {
        success: true,
        dryRun,
        manifest,
        dbRestored,
        storageRestored,
        durationMs
      };
    } finally {
      if (fs.existsSync(tempExtractDir)) {
        fs.rmSync(tempExtractDir, { recursive: true, force: true });
      }
    }
  }
}
