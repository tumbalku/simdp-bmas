import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import { IProfileConfig } from '../types/index.js';

export class ConfigManager {
  private projectRoot: string;

  constructor(customProjectRoot?: string) {
    this.projectRoot = customProjectRoot 
      ? path.resolve(customProjectRoot)
      : this.findProjectRoot(process.cwd());
  }

  public getProjectRoot(): string {
    return this.projectRoot;
  }

  private findProjectRoot(startDir: string): string {
    let current = path.resolve(startDir);
    while (current !== path.dirname(current)) {
      if (
        fs.existsSync(path.join(current, 'prisma', 'schema.prisma')) ||
        fs.existsSync(path.join(current, 'package.json')) &&
        fs.existsSync(path.join(current, 'tools', 'ops-hub'))
      ) {
        return current;
      }
      current = path.dirname(current);
    }
    return path.resolve(process.cwd(), '../..');
  }

  public loadEnv(customEnvPath?: string): Record<string, string> {
    const envFile = customEnvPath 
      ? path.resolve(customEnvPath)
      : path.join(this.projectRoot, '.env');

    if (!fs.existsSync(envFile)) {
      return {};
    }

    const envContent = fs.readFileSync(envFile, 'utf-8');
    const parsed = dotenv.parse(envContent);
    return parsed;
  }

  public createDefaultProfileFromEnv(env: Record<string, string>): IProfileConfig {
    const dbUrl = 
      env.POSTGRES_PRISMA_URL || 
      env.DATABASE_URL || 
      env.POSTGRES_URL || 
      'postgres://postgres:postgres@localhost:5432/simdp';

    const dbType = dbUrl.includes('supabase.co') 
      ? 'supabase' 
      : dbUrl.includes('rds.amazonaws.com') 
        ? 'rds' 
        : 'postgres';

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let storageConfig: {
      type: 'supabase' | 's3' | 'local';
      bucket?: string;
      endpoint?: string;
      region?: string;
      accessKeyId?: string;
      secretAccessKey?: string;
      supabaseUrl?: string;
      supabaseKey?: string;
      localPath?: string;
    } = {
      type: 'local',
      localPath: path.join(this.projectRoot, 'LocalStorage'),
      bucket: 'documents'
    };

    if (supabaseUrl && supabaseKey) {
      storageConfig = {
        type: 'supabase',
        supabaseUrl,
        supabaseKey,
        bucket: 'documents'
      };
    } else if (env.AWS_S3_BUCKET || env.S3_BUCKET) {
      storageConfig = {
        type: 's3',
        bucket: env.AWS_S3_BUCKET || env.S3_BUCKET,
        endpoint: env.AWS_ENDPOINT || env.S3_ENDPOINT,
        region: env.AWS_REGION || env.S3_REGION || 'us-east-1',
        accessKeyId: env.AWS_ACCESS_KEY_ID || env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.AWS_SECRET_ACCESS_KEY || env.S3_SECRET_ACCESS_KEY
      };
    }

    return {
      name: 'default',
      description: 'Auto-detected from SIMDP environment',
      db: {
        type: dbType,
        url: dbUrl,
        ssl: dbUrl.includes('sslmode=require') || dbType === 'supabase' || dbType === 'rds'
      },
      storage: storageConfig
    };
  }
}
