import fs from 'node:fs';
import path from 'node:path';
import { IProfileConfig, IProfilesFile } from '../types/index.js';
import { ConfigManager } from './config.js';

export class ProfileManager {
  private profilesPath: string;
  private configManager: ConfigManager;

  constructor(customPath?: string, configManager?: ConfigManager) {
    this.configManager = configManager || new ConfigManager();
    this.profilesPath = customPath 
      ? path.resolve(customPath)
      : path.join(this.configManager.getProjectRoot(), 'tools', 'ops-hub', 'profiles.json');
  }

  public getProfilesPath(): string {
    return this.profilesPath;
  }

  public loadProfiles(): IProfilesFile {
    if (!fs.existsSync(this.profilesPath)) {
      const env = this.configManager.loadEnv();
      const defaultProfile = this.configManager.createDefaultProfileFromEnv(env);
      const initialData: IProfilesFile = {
        activeProfile: 'default',
        profiles: {
          default: defaultProfile
        }
      };
      this.saveProfiles(initialData);
      return initialData;
    }

    try {
      const content = fs.readFileSync(this.profilesPath, 'utf-8');
      const data = JSON.parse(content) as IProfilesFile;
      if (!data.profiles || Object.keys(data.profiles).length === 0) {
        const env = this.configManager.loadEnv();
        const defaultProfile = this.configManager.createDefaultProfileFromEnv(env);
        data.activeProfile = 'default';
        data.profiles = { default: defaultProfile };
        this.saveProfiles(data);
      }
      return data;
    } catch {
      const env = this.configManager.loadEnv();
      const defaultProfile = this.configManager.createDefaultProfileFromEnv(env);
      const fallbackData: IProfilesFile = {
        activeProfile: 'default',
        profiles: {
          default: defaultProfile
        }
      };
      this.saveProfiles(fallbackData);
      return fallbackData;
    }
  }

  public saveProfiles(data: IProfilesFile): void {
    const dir = path.dirname(this.profilesPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.profilesPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  public getActiveProfile(): IProfileConfig {
    const data = this.loadProfiles();
    const active = data.profiles[data.activeProfile];
    if (!active) {
      const firstKey = Object.keys(data.profiles)[0];
      if (firstKey) {
        return data.profiles[firstKey];
      }
      const env = this.configManager.loadEnv();
      return this.configManager.createDefaultProfileFromEnv(env);
    }
    return active;
  }

  public setActiveProfile(name: string): boolean {
    const data = this.loadProfiles();
    if (!data.profiles[name]) {
      return false;
    }
    data.activeProfile = name;
    this.saveProfiles(data);
    return true;
  }

  public addProfile(profile: IProfileConfig): void {
    const data = this.loadProfiles();
    data.profiles[profile.name] = profile;
    this.saveProfiles(data);
  }

  public removeProfile(name: string): boolean {
    const data = this.loadProfiles();
    if (!data.profiles[name]) return false;
    delete data.profiles[name];
    if (data.activeProfile === name) {
      data.activeProfile = Object.keys(data.profiles)[0] || 'default';
    }
    this.saveProfiles(data);
    return true;
  }

  public listProfiles(): IProfileConfig[] {
    const data = this.loadProfiles();
    return Object.values(data.profiles);
  }
}
