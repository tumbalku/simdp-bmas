export type DatabaseType = 'postgres' | 'supabase' | 'rds' | 'local';
export type StorageType = 'supabase' | 's3' | 'local';

export interface IDatabaseConfig {
  type: DatabaseType;
  url: string;
  ssl?: boolean;
}

export interface IStorageConfig {
  type: StorageType;
  bucket?: string;
  endpoint?: string;
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  supabaseUrl?: string;
  supabaseKey?: string;
  localPath?: string;
}

export interface IProfileConfig {
  name: string;
  description?: string;
  db: IDatabaseConfig;
  storage: IStorageConfig;
}

export interface IProfilesFile {
  activeProfile: string;
  profiles: Record<string, IProfileConfig>;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
  latencyMs?: number;
}

export interface TableDumpInfo {
  tableName: string;
  rowCount: number;
  filePath: string;
  checksum: string;
}

export interface DBDumpResult {
  tables: Record<string, number>;
  totalRows: number;
  schemaSqlPath?: string;
  dataDir: string;
}

export interface StorageObjectInfo {
  bucket: string;
  key: string;
  size: number;
  lastModified?: Date;
  checksum?: string;
}

export interface StorageBackupResult {
  bucket: string;
  objectCount: number;
  totalSize: number;
  archivePath: string;
}

export interface IDatabaseDriver {
  type: DatabaseType;
  testConnection(): Promise<ConnectionTestResult>;
  getTables(): Promise<string[]>;
  dumpDatabase(outputDir: string, onProgress?: (msg: string) => void): Promise<DBDumpResult>;
  restoreDatabase(
    dataDir: string,
    options?: { dryRun?: boolean; onProgress?: (msg: string) => void }
  ): Promise<{ restoredTables: string[]; totalRows: number }>;
  close(): Promise<void>;
}

export interface IStorageDriver {
  type: StorageType;
  testConnection(): Promise<ConnectionTestResult>;
  listObjects(bucket: string, prefix?: string): Promise<StorageObjectInfo[]>;
  backupBucket(
    bucket: string,
    outputTarPath: string,
    onProgress?: (msg: string) => void
  ): Promise<StorageBackupResult>;
  restoreBucket(
    bucket: string,
    inputTarPath: string,
    options?: { dryRun?: boolean; onProgress?: (msg: string) => void }
  ): Promise<{ restoredCount: number; totalSize: number }>;
}

export interface IBackupManifest {
  version: string;
  createdAt: string;
  sourceProfile: string;
  type: 'full' | 'db' | 'storage';
  prismaSchemaHash?: string;
  database?: {
    type: DatabaseType;
    tables: Record<string, number>;
    totalRows: number;
    checksum: string;
  };
  storage?: {
    type: StorageType;
    buckets: Array<{
      bucket: string;
      objectCount: number;
      totalSize: number;
      checksum: string;
    }>;
  };
  checksums: Record<string, string>;
}

export interface SyncOptions {
  projectPath?: string;
}

export interface BackupOptions {
  profileName?: string;
  type?: 'full' | 'db' | 'storage';
  outputDir?: string;
  onProgress?: (event: { stage: string; message: string; percent?: number }) => void;
}

export interface BackupResult {
  success: boolean;
  manifest: IBackupManifest;
  artifactPath: string;
  durationMs: number;
}

export interface RestoreOptions {
  profileName?: string;
  dryRun?: boolean;
  targetType?: 'full' | 'db' | 'storage';
  onProgress?: (event: { stage: string; message: string; percent?: number }) => void;
}

export interface RestoreResult {
  success: boolean;
  dryRun: boolean;
  manifest: IBackupManifest;
  dbRestored?: { tables: string[]; totalRows: number };
  storageRestored?: Array<{ bucket: string; restoredCount: number }>;
  durationMs: number;
}
