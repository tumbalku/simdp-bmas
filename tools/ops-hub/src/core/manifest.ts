import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { IBackupManifest } from '../types/index.js';

export class ManifestManager {
  public static calculateFileHash(filePath: string): string {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  public static calculateStringHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  public static createManifest(params: {
    sourceProfile: string;
    type: 'full' | 'db' | 'storage';
    prismaSchemaHash?: string;
    database?: {
      type: any;
      tables: Record<string, number>;
      totalRows: number;
      checksum: string;
    };
    storage?: {
      type: any;
      buckets: Array<{
        bucket: string;
        objectCount: number;
        totalSize: number;
        checksum: string;
      }>;
    };
    checksums: Record<string, string>;
  }): IBackupManifest {
    return {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      sourceProfile: params.sourceProfile,
      type: params.type,
      prismaSchemaHash: params.prismaSchemaHash,
      database: params.database,
      storage: params.storage,
      checksums: params.checksums
    };
  }

  public static saveManifest(manifest: IBackupManifest, outputPath: string): void {
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2), 'utf-8');
  }

  public static readManifest(manifestPath: string): IBackupManifest {
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Manifest file not found: ${manifestPath}`);
    }
    const content = fs.readFileSync(manifestPath, 'utf-8');
    return JSON.parse(content) as IBackupManifest;
  }

  public static verifyChecksums(
    baseDir: string,
    checksums: Record<string, string>
  ): { valid: boolean; mismatches: string[] } {
    const mismatches: string[] = [];

    for (const [relPath, expectedHash] of Object.entries(checksums)) {
      const fullPath = path.join(baseDir, relPath);
      if (!fs.existsSync(fullPath)) {
        mismatches.push(`Missing file: ${relPath}`);
        continue;
      }
      const actualHash = this.calculateFileHash(fullPath);
      if (actualHash !== expectedHash) {
        mismatches.push(`Hash mismatch for ${relPath}: expected ${expectedHash}, got ${actualHash}`);
      }
    }

    return {
      valid: mismatches.length === 0,
      mismatches
    };
  }
}
