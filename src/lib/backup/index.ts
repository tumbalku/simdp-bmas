import fs from "fs/promises";
import path from "path";
import { SignJWT, importPKCS8 } from "jose";
import { z } from "zod";
import { env } from "@/lib/env";

const optionalString = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().optional(),
);

const optionalUrl = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z.string().url().optional(),
);

const optionalBoolean = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") return value.toLowerCase() === "true";
  return Boolean(value);
}, z.boolean().optional());

const optionalPositiveInt = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null) return undefined;
  if (typeof value === "number") return value;
  return Number(value);
}, z.number().int().positive().optional());

const backupConfigSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DEPLOYMENT_CONTEXT: z.enum(["vercel-supabase", "vps-local", "hybrid"]).default("hybrid"),
    STORAGE_PROVIDER: z.enum(["local", "supabase", "s3"]).default("local"),
    BACKUP_ENABLED: optionalBoolean.default(false),
    BACKUP_DB_ENABLED: optionalBoolean.default(true),
    BACKUP_STORAGE_ENABLED: optionalBoolean.default(true),
    BACKUP_ENCRYPTION_ENABLED: optionalBoolean.default(false),
    BACKUP_TARGET: z.enum(["local", "folder", "gdrive", "s3"]).default("local"),
    BACKUP_LOCAL_DIR: optionalString,
    BACKUP_FOLDER_PATH: optionalString,
    BACKUP_RETENTION_DAILY_DAYS: optionalPositiveInt.default(14),
    BACKUP_RETENTION_WEEKLY_DAYS: optionalPositiveInt.default(56),
    BACKUP_RETENTION_MONTHLY_DAYS: optionalPositiveInt.default(365),
    GDRIVE_FOLDER_ID: optionalString,
    GDRIVE_CLIENT_EMAIL: optionalString,
    GDRIVE_PRIVATE_KEY: optionalString,
    S3_ENDPOINT: optionalUrl,
    S3_REGION: optionalString,
    S3_BUCKET: optionalString,
    S3_ACCESS_KEY_ID: optionalString,
    S3_SECRET_ACCESS_KEY: optionalString,
    SUPABASE_URL: optionalUrl,
    SUPABASE_SERVICE_ROLE_KEY: optionalString,
    SUPABASE_STORAGE_BUCKET: optionalString,
  })
  .superRefine((config, context) => {
    if (!config.BACKUP_ENABLED) return;

    if (
      config.NODE_ENV === "production" &&
      config.BACKUP_TARGET === "local" &&
      !config.BACKUP_ENCRYPTION_ENABLED
    ) {
      context.addIssue({
        code: "custom",
        path: ["BACKUP_ENCRYPTION_ENABLED"],
        message: "Backup production ke target local wajib dienkripsi sebelum disalin offsite",
      });
    }

    if (config.DEPLOYMENT_CONTEXT === "vercel-supabase") {
      if (config.STORAGE_PROVIDER === "local") {
        context.addIssue({
          code: "custom",
          path: ["STORAGE_PROVIDER"],
          message: "DEPLOYMENT_CONTEXT=vercel-supabase tidak boleh memakai STORAGE_PROVIDER=local",
        });
      }

      if (config.BACKUP_TARGET === "local" || config.BACKUP_TARGET === "folder") {
        context.addIssue({
          code: "custom",
          path: ["BACKUP_TARGET"],
          message: "Runtime Vercel tidak punya filesystem persisten; gunakan BACKUP_TARGET=gdrive sebagai target utama",
        });
      }
    }

    if (config.DEPLOYMENT_CONTEXT === "vps-local" && config.STORAGE_PROVIDER !== "local") {
      context.addIssue({
        code: "custom",
        path: ["STORAGE_PROVIDER"],
        message: "DEPLOYMENT_CONTEXT=vps-local mengharapkan STORAGE_PROVIDER=local",
      });
    }

    if (config.BACKUP_TARGET === "local" && !config.BACKUP_LOCAL_DIR) {
      context.addIssue({
        code: "custom",
        path: ["BACKUP_LOCAL_DIR"],
        message: "BACKUP_LOCAL_DIR wajib diisi saat BACKUP_TARGET=local",
      });
    }

    if (config.BACKUP_TARGET === "folder" && !config.BACKUP_FOLDER_PATH) {
      context.addIssue({
        code: "custom",
        path: ["BACKUP_FOLDER_PATH"],
        message: "BACKUP_FOLDER_PATH wajib diisi saat BACKUP_TARGET=folder",
      });
    }

    if (config.BACKUP_TARGET === "gdrive") {
      for (const key of ["GDRIVE_FOLDER_ID", "GDRIVE_CLIENT_EMAIL", "GDRIVE_PRIVATE_KEY"] as const) {
        if (!config[key]) {
          context.addIssue({
            code: "custom",
            path: [key],
            message: `${key} wajib diisi saat BACKUP_TARGET=gdrive`,
          });
        }
      }
    }

    if (config.BACKUP_TARGET === "s3") {
      for (const key of ["S3_REGION", "S3_BUCKET", "S3_ACCESS_KEY_ID", "S3_SECRET_ACCESS_KEY"] as const) {
        if (!config[key]) {
          context.addIssue({
            code: "custom",
            path: [key],
            message: `${key} wajib diisi saat BACKUP_TARGET=s3`,
          });
        }
      }
    }
  });

export type DeploymentContext = "vercel-supabase" | "vps-local" | "hybrid";
export type BackupTargetName = "local" | "folder" | "gdrive" | "s3";
export type BackupConfig = z.infer<typeof backupConfigSchema>;

export interface BackupArtifact {
  readonly name: string;
  readonly contentType: string;
  readonly bytes: Buffer;
  readonly sha256: string;
}

export interface BackupUploadResult {
  readonly target: BackupTargetName;
  readonly artifactName: string;
  readonly location: string;
  readonly checksumSha256: string;
  readonly uploadedAt: string;
}

export interface IBackupTarget {
  readonly targetName: BackupTargetName;
  putArtifact(artifact: BackupArtifact): Promise<BackupUploadResult>;
}

export function parseBackupConfig(rawEnv: Record<string, unknown>): BackupConfig {
  const parsed = backupConfigSchema.safeParse(rawEnv);

  if (!parsed.success) {
    const formattedErrors = parsed.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("\n");

    throw new Error(`Konfigurasi backup SiCantIK tidak valid:\n${formattedErrors}`);
  }

  return parsed.data;
}

export const backupConfig = parseBackupConfig(process.env);

abstract class FileSystemBackupTarget implements IBackupTarget {
  abstract readonly targetName: BackupTargetName;

  protected constructor(private readonly baseDir: string) {}

  async putArtifact(artifact: BackupArtifact): Promise<BackupUploadResult> {
    const destination = path.resolve(this.baseDir, sanitizeArtifactName(artifact.name));
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.writeFile(destination, artifact.bytes, { flag: "wx" });

    return {
      target: this.targetName,
      artifactName: artifact.name,
      location: destination,
      checksumSha256: artifact.sha256,
      uploadedAt: new Date().toISOString(),
    };
  }
}

class LocalBackupTarget extends FileSystemBackupTarget {
  readonly targetName = "local" as const;

  constructor(config: BackupConfig) {
    super(config.BACKUP_LOCAL_DIR ?? "");
  }
}

class FolderBackupTarget extends FileSystemBackupTarget {
  readonly targetName = "folder" as const;

  constructor(config: BackupConfig) {
    super(config.BACKUP_FOLDER_PATH ?? "");
  }
}

class GoogleDriveBackupTarget implements IBackupTarget {
  readonly targetName = "gdrive" as const;

  constructor(private readonly config: BackupConfig) {}

  async putArtifact(artifact: BackupArtifact): Promise<BackupUploadResult> {
    const accessToken = await this.createAccessToken();
    const metadata = {
      name: sanitizeArtifactName(artifact.name),
      parents: [normalizeDriveFolderId(this.config.GDRIVE_FOLDER_ID ?? "")],
    };
    const boundary = `simdp-backup-${Date.now()}`;
    const body = Buffer.concat([
      Buffer.from(
        `--${boundary}\r\ncontent-type: application/json; charset=utf-8\r\n\r\n${JSON.stringify(metadata)}\r\n`,
      ),
      Buffer.from(`--${boundary}\r\ncontent-type: ${artifact.contentType}\r\n\r\n`),
      artifact.bytes,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ]);

    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name,webViewLink",
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": `multipart/related; boundary=${boundary}`,
        },
        body: new Uint8Array(body),
      },
    );

    if (!response.ok) {
      const responseText = await response.text().catch(() => "");
      if (response.status === 403 && responseText.includes("storageQuotaExceeded")) {
        throw new Error(
          "Google Drive service account tidak bisa upload ke My Drive pribadi. Pindahkan folder backup ke Shared Drive, lalu bagikan Shared Drive itu ke service account backup.",
        );
      }

      throw new Error(
        `Gagal upload backup ke Google Drive (${response.status}): ${responseText || response.statusText}`,
      );
    }

    const data = (await response.json()) as { id?: string; webViewLink?: string };
    if (!data.id) {
      throw new Error("Respons Google Drive tidak memuat file id backup");
    }

    return {
      target: this.targetName,
      artifactName: artifact.name,
      location: data.webViewLink ?? `gdrive://${data.id}`,
      checksumSha256: artifact.sha256,
      uploadedAt: new Date().toISOString(),
    };
  }

  private async createAccessToken(): Promise<string> {
    const privateKey = normalizePrivateKey(this.config.GDRIVE_PRIVATE_KEY ?? "");
    const signingKey = await importPKCS8(privateKey, "RS256");
    const jwt = await new SignJWT({
      scope: "https://www.googleapis.com/auth/drive.file",
    })
      .setProtectedHeader({ alg: "RS256", typ: "JWT" })
      .setIssuer(this.config.GDRIVE_CLIENT_EMAIL ?? "")
      .setAudience("https://oauth2.googleapis.com/token")
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(signingKey);

    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    if (!response.ok) {
      const responseText = await response.text().catch(() => "");
      throw new Error(
        `Gagal membuat access token Google Drive backup (${response.status}): ${responseText || response.statusText}`,
      );
    }

    const data = (await response.json()) as { access_token?: string };
    if (!data.access_token) {
      throw new Error("Respons OAuth Google Drive tidak memuat access_token");
    }

    return data.access_token;
  }
}

class S3BackupTarget implements IBackupTarget {
  readonly targetName = "s3" as const;

  async putArtifact(): Promise<BackupUploadResult> {
    throw new Error(
      "BACKUP_TARGET=s3 adalah opsi terakhir dan adapter upload S3 belum diaktifkan. Tambahkan SDK/SigV4 resmi atau job CLI resmi sebelum memakai target ini.",
    );
  }
}

export function getBackupTarget(config: BackupConfig = backupConfig): IBackupTarget {
  if (!config.BACKUP_ENABLED) {
    throw new Error("Backup tidak aktif. Set BACKUP_ENABLED=true sebelum meminta target backup.");
  }

  if (config.BACKUP_TARGET === "folder") return new FolderBackupTarget(config);
  if (config.BACKUP_TARGET === "gdrive") return new GoogleDriveBackupTarget(config);
  if (config.BACKUP_TARGET === "s3") return new S3BackupTarget();
  return new LocalBackupTarget(config);
}

function sanitizeArtifactName(name: string): string {
  const baseName = path.basename(name);
  const safeName = baseName.replace(/[^A-Za-z0-9._-]/g, "_");
  if (!safeName) throw new Error("Nama artifact backup tidak valid");
  return safeName;
}

function normalizePrivateKey(value: string): string {
  return value.replace(/\\n/g, "\n");
}

function normalizeDriveFolderId(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("GDRIVE_FOLDER_ID wajib diisi saat BACKUP_TARGET=gdrive");
  }

  try {
    const parsed = new URL(trimmed);
    const folderIdFromPath = parsed.pathname.match(/\/folders\/([^/]+)/)?.[1];
    if (folderIdFromPath) {
      return folderIdFromPath;
    }

    const idFromQuery = parsed.searchParams.get("id");
    if (idFromQuery) {
      return idFromQuery;
    }
  } catch {
    // Not a URL, treat as raw folder ID below.
  }

  return trimmed.replace(/[?#].*$/, "");
}

void env;
