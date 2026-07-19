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

function normalizeStoragePath(filePath: string) {
  return filePath
    .split("?")[0]
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/^uploads\//, "")
    .replace(/^supabase\//, "");
}

function encodeStoragePath(filePath: string) {
  return normalizeStoragePath(filePath)
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");
}

class SupabaseStorageProvider implements IStorageProvider {
  private bucket: string;
  private baseUrl: string;
  private serviceRoleKey: string;

  constructor() {
    this.bucket = env.SUPABASE_STORAGE_BUCKET;
    this.baseUrl = env.SUPABASE_URL?.replace(/\/+$/, "") ?? "";
    this.serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  }

  private assertConfigured() {
    if (!this.baseUrl || !this.serviceRoleKey) {
      throw new Error("Supabase storage belum dikonfigurasi lengkap");
    }
  }

  private headers(extra?: HeadersInit) {
    return {
      apikey: this.serviceRoleKey,
      authorization: `Bearer ${this.serviceRoleKey}`,
      ...extra,
    };
  }

  async upload(filePath: string, buffer: Buffer, mimeType?: string): Promise<string> {
    this.assertConfigured();

    const objectPath = normalizeStoragePath(filePath);
    const encodedPath = encodeStoragePath(objectPath);
    const response = await fetch(
      `${this.baseUrl}/storage/v1/object/${encodeURIComponent(this.bucket)}/${encodedPath}`,
      {
        method: "POST",
        headers: this.headers({
          "content-type": mimeType || "application/octet-stream",
          "x-upsert": "true",
        }),
        body: new Uint8Array(buffer),
      },
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Gagal upload ke Supabase Storage (${response.status}): ${body || response.statusText}`);
    }

    return `supabase/${objectPath}`;
  }

  async getTemporaryUrl(filePath: string, expirySeconds = 300): Promise<string> {
    this.assertConfigured();

    const encodedPath = encodeStoragePath(filePath);
    const response = await fetch(
      `${this.baseUrl}/storage/v1/object/sign/${encodeURIComponent(this.bucket)}/${encodedPath}`,
      {
        method: "POST",
        headers: this.headers({ "content-type": "application/json" }),
        body: JSON.stringify({ expiresIn: expirySeconds }),
      },
    );

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Gagal membuat signed URL Supabase Storage (${response.status}): ${body || response.statusText}`);
    }

    const data = (await response.json()) as { signedURL?: string; signedUrl?: string };
    const signedUrl = data.signedURL ?? data.signedUrl;
    if (!signedUrl) {
      throw new Error("Respons signed URL Supabase Storage tidak valid");
    }

    return signedUrl.startsWith("http") ? signedUrl : `${this.baseUrl}${signedUrl}`;
  }

  async delete(filePath: string): Promise<void> {
    this.assertConfigured();

    const objectPath = normalizeStoragePath(filePath);
    const response = await fetch(`${this.baseUrl}/storage/v1/object/${encodeURIComponent(this.bucket)}`, {
      method: "DELETE",
      headers: this.headers({ "content-type": "application/json" }),
      body: JSON.stringify({ prefixes: [objectPath] }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Gagal menghapus file Supabase Storage (${response.status}): ${body || response.statusText}`);
    }
  }
}

// Stub for S3 to support compilation if selected.
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
