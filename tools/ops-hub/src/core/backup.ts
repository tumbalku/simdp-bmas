import fs from 'node:fs';
import path from 'node:path';
import * as tar from 'tar';
import { 
  BackupOptions, 
  BackupResult, 
  IDatabaseDriver, 
  IStorageDriver 
} from '../types/index.js';
import { ConfigManager } from './config.js';
import { ProfileManager } from './profile.js';
import { PostgresDriver } from '../drivers/database/postgres.js';
import { SupabaseStorageDriver } from '../drivers/storage/supabase.js';
import { S3StorageDriver } from '../drivers/storage/s3.js';
import { LocalStorageDriver } from '../drivers/storage/local.js';
import { ManifestManager } from './manifest.js';
import { ProjectSync } from './sync.js';

export class BackupPipeline {
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

  public async execute(options?: BackupOptions): Promise<BackupResult> {
    const startTime = Date.now();
    const type = options?.type || 'full';
    const profile = options?.profileName 
      ? this.profileManager.loadProfiles().profiles[options.profileName] 
      : this.profileManager.getActiveProfile();

    if (!profile) {
      throw new Error(`Profile '${options?.profileName || 'active'}' not found.`);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outDir = options?.outputDir 
      ? path.resolve(options.outputDir)
      : path.join(this.configManager.getProjectRoot(), 'backups');

    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const stagingDir = path.join(outDir, `staging_${timestamp}`);
    fs.mkdirSync(stagingDir, { recursive: true });

    const checksums: Record<string, string> = {};
    let dbInfo: any = undefined;
    let storageBuckets: any[] = [];

    const sync = new ProjectSync(this.configManager.getProjectRoot());
    const syncValidation = sync.validateProject();

    try {
      options?.onProgress?.({ stage: 'start', message: `Starting ${type} backup for profile '${profile.name}'` });

      // 1. Database Backup
      if (type === 'full' || type === 'db') {
        options?.onProgress?.({ stage: 'database', message: 'Connecting to database...' });
        const dbDriver = this.createDatabaseDriver(profile);
        const dbDataDir = path.join(stagingDir, 'database');
        
        try {
          const dbResult = await dbDriver.dumpDatabase(dbDataDir, (msg) => {
            options?.onProgress?.({ stage: 'database', message: msg });
          });

          // Calculate checksums for each dumped table
          const tableFiles = fs.readdirSync(dbDataDir);
          let allTableHash = '';
          for (const file of tableFiles) {
            const relPath = path.join('database', file);
            const fullPath = path.join(dbDataDir, file);
            const hash = ManifestManager.calculateFileHash(fullPath);
            checksums[relPath] = hash;
            allTableHash += hash;
          }

          dbInfo = {
            type: dbDriver.type,
            tables: dbResult.tables,
            totalRows: dbResult.totalRows,
            checksum: ManifestManager.calculateStringHash(allTableHash)
          };
        } finally {
          await dbDriver.close();
        }
      }

      // 2. Storage Backup
      if (type === 'full' || type === 'storage') {
        options?.onProgress?.({ stage: 'storage', message: 'Connecting to storage provider...' });
        const storageDriver = this.createStorageDriver(profile);
        const storageDir = path.join(stagingDir, 'storage');
        fs.mkdirSync(storageDir, { recursive: true });

        const bucketsToBackup = profile.storage.bucket ? [profile.storage.bucket] : ['documents', 'avatars'];

        for (const bucket of bucketsToBackup) {
          options?.onProgress?.({ stage: 'storage', message: `Backing up bucket '${bucket}'...` });
          const bucketTarPath = path.join(storageDir, `${bucket}.tar.gz`);
          
          try {
            const result = await storageDriver.backupBucket(bucket, bucketTarPath, (msg) => {
              options?.onProgress?.({ stage: 'storage', message: msg });
            });

            const relPath = path.join('storage', `${bucket}.tar.gz`);
            const hash = ManifestManager.calculateFileHash(bucketTarPath);
            checksums[relPath] = hash;

            storageBuckets.push({
              bucket,
              objectCount: result.objectCount,
              totalSize: result.totalSize,
              checksum: hash
            });
          } catch (err: any) {
            options?.onProgress?.({ 
              stage: 'storage', 
              message: `Warning: Bucket '${bucket}' backup skipped or empty: ${err.message}` 
            });
          }
        }
      }

      // 3. Create Manifest
      options?.onProgress?.({ stage: 'manifest', message: 'Generating backup manifest and cryptographic checksums...' });
      const manifest = ManifestManager.createManifest({
        sourceProfile: profile.name,
        type,
        prismaSchemaHash: syncValidation.prismaSchemaHash,
        database: dbInfo,
        storage: storageBuckets.length > 0 ? {
          type: profile.storage.type,
          buckets: storageBuckets
        } : undefined,
        checksums
      });

      const manifestPath = path.join(stagingDir, 'manifest.json');
      ManifestManager.saveManifest(manifest, manifestPath);

      // 4. Compress bundle
      const finalBundleName = `simdp-backup-${profile.name}-${type}-${timestamp}.tar.gz`;
      const finalBundlePath = path.join(outDir, finalBundleName);

      options?.onProgress?.({ stage: 'archive', message: `Compressing complete backup bundle into ${finalBundleName}...` });
      
      const stagingContents = fs.readdirSync(stagingDir);
      await tar.c(
        {
          gzip: true,
          file: finalBundlePath,
          cwd: stagingDir
        },
        stagingContents
      );

      const durationMs = Date.now() - startTime;
      options?.onProgress?.({ 
        stage: 'complete', 
        message: `Backup completed successfully in ${(durationMs / 1000).toFixed(2)}s: ${finalBundleName}` 
      });

      return {
        success: true,
        manifest,
        artifactPath: finalBundlePath,
        durationMs
      };
    } finally {
      if (fs.existsSync(stagingDir)) {
        fs.rmSync(stagingDir, { recursive: true, force: true });
      }
    }
  }
}
