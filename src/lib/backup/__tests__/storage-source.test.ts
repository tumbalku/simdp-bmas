import os from "os";
import path from "path";
import { pathToFileURL } from "url";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "fs/promises";
import { afterEach, describe, expect, it, vi } from "vitest";

const helperModuleUrl = pathToFileURL(
  path.resolve(process.cwd(), "scripts/backup-storage-source.mjs"),
).href;
const originalEnv = { ...process.env };

async function importStorageHelper() {
  try {
    return await import(helperModuleUrl);
  } catch (error) {
    throw new Error(
      `Gagal import backup-storage-source.mjs dari ${helperModuleUrl}: ${
        error instanceof Error ? error.stack : String(error)
      }`,
      { cause: error },
    );
  }
}

describe("backup storage source helper", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it("copies local storage into a snapshot folder", async () => {
    const sourceDir = await mkdtemp(path.join(os.tmpdir(), "simdp-local-storage-"));
    const outDir = await mkdtemp(path.join(os.tmpdir(), "simdp-local-snapshot-"));

    await mkdir(path.join(sourceDir, "docs"), { recursive: true });
    await writeFile(path.join(sourceDir, "docs", "file.pdf"), "local-file");

    process.env.STORAGE_PROVIDER = "local";
    process.env.SIMDP_STORAGE_DIR = sourceDir;

    const { snapshotLocalStorageSource } = await importStorageHelper();
    await snapshotLocalStorageSource({ outDir });

    const copied = await readFile(path.join(outDir, "storage", "docs", "file.pdf"), "utf8");
    expect(copied).toBe("local-file");

    await rm(sourceDir, { recursive: true, force: true });
    await rm(outDir, { recursive: true, force: true });
  });

  it("downloads supabase storage objects into a snapshot folder", async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "simdp-supabase-snapshot-"));

    process.env.STORAGE_PROVIDER = "supabase";
    process.env.SUPABASE_URL = "https://project.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    process.env.SUPABASE_STORAGE_BUCKET = "employee-documents";

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([
          { name: "docs/file.pdf" },
          { name: "avatars/profile.png" },
        ]),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new TextEncoder().encode("supabase-file").buffer),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new TextEncoder().encode("profile-image").buffer),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { snapshotSupabaseStorageSource } = await importStorageHelper();
    await snapshotSupabaseStorageSource({
      outDir,
      baseUrl: "https://project.supabase.co/",
      serviceRoleKey: "service-role-key",
      bucket: "employee-documents",
    });

    const file = await readFile(path.join(outDir, "storage", "docs", "file.pdf"), "utf8");
    const avatar = await readFile(path.join(outDir, "storage", "avatars", "profile.png"), "utf8");

    expect(file).toContain("supabase-file");
    expect(avatar).toContain("profile-image");
    expect(fetchMock).toHaveBeenCalledTimes(3);

    await rm(outDir, { recursive: true, force: true });
  });

  it("walks nested supabase storage folders before downloading objects", async () => {
    const outDir = await mkdtemp(path.join(os.tmpdir(), "simdp-supabase-recursive-snapshot-"));

    process.env.STORAGE_PROVIDER = "supabase";
    process.env.SUPABASE_URL = "https://project.supabase.co";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
    process.env.SUPABASE_STORAGE_BUCKET = "employee-documents";

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([{ name: "employee-documents", id: null, metadata: null }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([{ name: "emp-1", id: null, metadata: null }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue([{ name: "ktp.pdf", id: "object-id", metadata: { size: 12 } }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new TextEncoder().encode("nested-file").buffer),
      });
    vi.stubGlobal("fetch", fetchMock);

    const { snapshotSupabaseStorageSource } = await importStorageHelper();
    await snapshotSupabaseStorageSource({
      outDir,
      baseUrl: "https://project.supabase.co/",
      serviceRoleKey: "service-role-key",
      bucket: "employee-documents",
    });

    const file = await readFile(
      path.join(outDir, "storage", "employee-documents", "emp-1", "ktp.pdf"),
      "utf8",
    );

    expect(file).toContain("nested-file");
    expect(fetchMock).toHaveBeenCalledTimes(4);

    await rm(outDir, { recursive: true, force: true });
  });
});
