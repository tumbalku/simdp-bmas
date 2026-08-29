import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { ConfigManager } from './config.js';
import { ProfileManager } from './profile.js';

export interface SyncValidationResult {
  valid: boolean;
  projectRoot: string;
  prismaSchemaExists: boolean;
  prismaSchemaHash?: string;
  envExists: boolean;
  envKeys: string[];
  activeProfileName: string;
  error?: string;
}

export class ProjectSync {
  private configManager: ConfigManager;
  private profileManager: ProfileManager;

  constructor(customProjectRoot?: string) {
    this.configManager = new ConfigManager(customProjectRoot);
    this.profileManager = new ProfileManager(undefined, this.configManager);
  }

  public validateProject(): SyncValidationResult {
    const projectRoot = this.configManager.getProjectRoot();
    const prismaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
    const envPath = path.join(projectRoot, '.env');

    const prismaSchemaExists = fs.existsSync(prismaPath);
    const envExists = fs.existsSync(envPath);

    let prismaSchemaHash: string | undefined;
    if (prismaSchemaExists) {
      const content = fs.readFileSync(prismaPath, 'utf-8');
      prismaSchemaHash = crypto.createHash('sha256').update(content).digest('hex');
    }

    const env = this.configManager.loadEnv();
    const envKeys = Object.keys(env);

    const activeProfile = this.profileManager.getActiveProfile();

    return {
      valid: prismaSchemaExists,
      projectRoot,
      prismaSchemaExists,
      prismaSchemaHash,
      envExists,
      envKeys,
      activeProfileName: activeProfile.name,
      error: !prismaSchemaExists ? 'prisma/schema.prisma not found in project root' : undefined
    };
  }

  public syncProfileFromEnv(profileName = 'default'): void {
    const env = this.configManager.loadEnv();
    const profile = this.configManager.createDefaultProfileFromEnv(env);
    profile.name = profileName;
    this.profileManager.addProfile(profile);
    this.profileManager.setActiveProfile(profileName);
  }
}
