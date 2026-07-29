import { describe, expect, it } from "vitest";
import { getBackupTarget, parseBackupConfig } from "@/lib/backup";

const baseEnv = {
  NODE_ENV: "test",
  DEPLOYMENT_CONTEXT: "hybrid",
  STORAGE_PROVIDER: "local",
  BACKUP_ENABLED: "true",
  BACKUP_DB_ENABLED: "true",
  BACKUP_STORAGE_ENABLED: "true",
  BACKUP_ENCRYPTION_ENABLED: "false",
  BACKUP_TARGET: "local",
  BACKUP_LOCAL_DIR: "C:/tmp/simdp-backups",
};

describe("backup config", () => {
  it("selects a local backup target from validated env", () => {
    const config = parseBackupConfig(baseEnv);
    const target = getBackupTarget(config);

    expect(config.BACKUP_TARGET).toBe("local");
    expect(target.targetName).toBe("local");
  });

  it("rejects filesystem backup targets for Vercel Supabase context", () => {
    expect(() =>
      parseBackupConfig({
        ...baseEnv,
        DEPLOYMENT_CONTEXT: "vercel-supabase",
        STORAGE_PROVIDER: "supabase",
        BACKUP_TARGET: "folder",
        BACKUP_FOLDER_PATH: "C:/tmp/simdp-backups",
      }),
    ).toThrow("Runtime Vercel tidak punya filesystem persisten");
  });

  it("requires Google Drive credentials when gdrive is selected", () => {
    expect(() =>
      parseBackupConfig({
        ...baseEnv,
        BACKUP_TARGET: "gdrive",
        BACKUP_LOCAL_DIR: undefined,
      }),
    ).toThrow("GDRIVE_FOLDER_ID wajib diisi saat BACKUP_TARGET=gdrive");
  });

  it("accepts Google Drive service account env", () => {
    const config = parseBackupConfig({
      ...baseEnv,
      BACKUP_TARGET: "gdrive",
      BACKUP_LOCAL_DIR: undefined,
      GDRIVE_FOLDER_ID: "folder-id",
      GDRIVE_CLIENT_EMAIL: "backup@example.iam.gserviceaccount.com",
      GDRIVE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n",
    });

    expect(config.BACKUP_TARGET).toBe("gdrive");
    expect(getBackupTarget(config).targetName).toBe("gdrive");
  });

  it("accepts Google Drive folder URLs as folder id inputs", async () => {
    const config = parseBackupConfig({
      ...baseEnv,
      BACKUP_TARGET: "gdrive",
      BACKUP_LOCAL_DIR: undefined,
      GDRIVE_FOLDER_ID: "https://drive.google.com/drive/folders/folder-id-123?hl=id",
      GDRIVE_CLIENT_EMAIL: "backup@example.iam.gserviceaccount.com",
      GDRIVE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\\nabc\\n-----END PRIVATE KEY-----\\n",
    });

    expect(config.BACKUP_TARGET).toBe("gdrive");
    expect(getBackupTarget(config).targetName).toBe("gdrive");
  });

  it("keeps S3 as an explicit fail-fast fallback target", async () => {
    const config = parseBackupConfig({
      ...baseEnv,
      BACKUP_TARGET: "s3",
      BACKUP_LOCAL_DIR: undefined,
      S3_REGION: "ap-southeast-1",
      S3_BUCKET: "simdp-backup",
      S3_ACCESS_KEY_ID: "test-access-key",
      S3_SECRET_ACCESS_KEY: "test-secret-key",
    });
    const target = getBackupTarget(config);

    expect(target.targetName).toBe("s3");
    await expect(
      target.putArtifact({
        name: "manifest.txt",
        contentType: "text/plain",
        bytes: Buffer.from("test"),
        sha256: "test-sha256",
      }),
    ).rejects.toThrow("opsi terakhir");
  });
});
