import "dotenv/config";
import { createHash } from "crypto";
import { importPKCS8, SignJWT } from "jose";
import { afterEach, describe, expect, it, vi } from "vitest";

const smokeEnabled = process.env.BACKUP_GDRIVE_SMOKE === "1";
const suite = smokeEnabled ? describe : describe.skip;

const requiredKeys = [
  "GDRIVE_FOLDER_ID",
  "GDRIVE_CLIENT_EMAIL",
  "GDRIVE_PRIVATE_KEY",
] as const;

function sanitizeArtifactName(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]/g, "_");
}

async function createDriveAccessToken() {
  const privateKey = (process.env.GDRIVE_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  const signingKey = await importPKCS8(privateKey, "RS256");
  const jwt = await new SignJWT({
    scope: "https://www.googleapis.com/auth/drive.file",
  })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(process.env.GDRIVE_CLIENT_EMAIL ?? "")
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
      `Gagal membuat access token Google Drive (${response.status}): ${responseText || response.statusText}`,
    );
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("Respons token Google Drive tidak memuat access_token");
  }

  return data.access_token;
}

async function findUploadedFileId(accessToken: string, artifactName: string) {
  const folderId = process.env.GDRIVE_FOLDER_ID ?? "";
  const query = encodeURIComponent(
    `'${folderId}' in parents and name='${artifactName}' and trashed=false`,
  );
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&supportsAllDrives=true&includeItemsFromAllDrives=true&fields=files(id,name,mimeType)`,
    {
      headers: {
        authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    throw new Error(
      `Gagal mencari file backup di Google Drive (${response.status}): ${responseText || response.statusText}`,
    );
  }

  const data = (await response.json()) as {
    files?: Array<{ id?: string; name?: string; mimeType?: string }>;
  };
  const file = data.files?.[0];

  if (!file?.id) {
    throw new Error(`File backup "${artifactName}" tidak ditemukan di folder Drive`);
  }

  return file.id;
}

async function deleteUploadedFile(accessToken: string, fileId: string) {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: "DELETE",
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    throw new Error(
      `Gagal menghapus file backup smoke test (${response.status}): ${responseText || response.statusText}`,
    );
  }
}

suite("Google Drive backup smoke", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it(
    "uploads a small backup artifact into the configured Drive folder and cleans it up",
    async () => {
      const missing = requiredKeys.filter((key) => !process.env[key]);
      if (missing.length > 0) {
        throw new Error(
          `BACKUP_GDRIVE_SMOKE=1 tetapi env berikut belum terisi: ${missing.join(", ")}`,
        );
      }

      process.env.BACKUP_ENABLED = "true";
      process.env.BACKUP_TARGET = "gdrive";

      vi.resetModules();

      const { getBackupTarget, parseBackupConfig } = await import("@/lib/backup");
      const config = parseBackupConfig(process.env);
      const target = getBackupTarget(config);

      const artifactName = sanitizeArtifactName(
        `simdp-gdrive-smoke-${Date.now()}-${Math.random().toString(16).slice(2)}.txt`,
      );
      const bytes = Buffer.from(`SIMDP GDrive smoke test ${new Date().toISOString()}`);
      const sha256 = createHash("sha256").update(bytes).digest("hex");

      const uploadResult = await target.putArtifact({
        name: artifactName,
        contentType: "text/plain",
        bytes,
        sha256,
      });

      expect(uploadResult.target).toBe("gdrive");
      expect(uploadResult.artifactName).toBe(artifactName);
      expect(uploadResult.checksumSha256).toBe(sha256);

      const accessToken = await createDriveAccessToken();
      const uploadedFileId = await findUploadedFileId(accessToken, artifactName);

      expect(uploadedFileId).toBeTruthy();

      await deleteUploadedFile(accessToken, uploadedFileId);
    },
    120_000,
  );
});
