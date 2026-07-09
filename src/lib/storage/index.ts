import fs from "fs/promises";
import path from "path";
import { env } from "@/lib/env";

export interface IStorageProvider {
  upload(filePath: string, buffer: Buffer, mimeType?: string): Promise<string>;
  getTemporaryUrl(filePath: string, expirySeconds?: number): Promise<string>;
  delete(filePath: string): Promise<void>;
}

class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor() {
    this.baseDir = path.join(process.cwd(), "uploads");
  }

  async upload(filePath: string, buffer: Buffer): Promise<string> {
    const fullPath = path.join(this.baseDir, filePath);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, buffer);
    return `uploads/${filePath}`;
  }

  async getTemporaryUrl(filePath: string): Promise<string> {
    // For local, we return a relative URL to the streaming endpoint.
    // The streaming route will perform auth and stream the file.
    // We clean filePath if it starts with "uploads/" prefix
    const cleanPath = filePath.startsWith("uploads/") ? filePath.slice(8) : filePath;
    return `/api/v1/documents/download/stream?file=${encodeURIComponent(cleanPath)}`;
  }

  async delete(filePath: string): Promise<void> {
    const cleanPath = filePath.startsWith("uploads/") ? filePath.slice(8) : filePath;
    const fullPath = path.join(this.baseDir, cleanPath);
    try {
      await fs.unlink(fullPath);
    } catch {
      // Ignore if file doesn't exist
    }
  }
}

// Stubs for Supabase / S3 to support compilation if selected
class SupabaseStorageProvider implements IStorageProvider {
  async upload(filePath: string, buffer: Buffer): Promise<string> {
    return `supabase/${filePath}?size=${buffer.length}`;
  }
  async getTemporaryUrl(filePath: string): Promise<string> {
    return `https://supabase.placeholder/${filePath}`;
  }
  async delete(filePath: string): Promise<void> {
    void filePath;
  }
}

class S3StorageProvider implements IStorageProvider {
  async upload(filePath: string, buffer: Buffer): Promise<string> {
    return `s3/${filePath}?size=${buffer.length}`;
  }
  async getTemporaryUrl(filePath: string): Promise<string> {
    return `https://s3.placeholder/${filePath}`;
  }
  async delete(filePath: string): Promise<void> {
    void filePath;
  }
}

export function getStorageProvider(): IStorageProvider {
  const provider = env.STORAGE_PROVIDER;
  if (provider === "supabase") return new SupabaseStorageProvider();
  if (provider === "s3") return new S3StorageProvider();
  return new LocalStorageProvider();
}

export const storage = getStorageProvider();
